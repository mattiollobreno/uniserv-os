import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../services/api';

const CAMPOS_FORMULARIO = [
  { nome: 'razao_social', label: 'Razão social', tipo: 'text' },
  { nome: 'cpf_cnpj', label: 'CPF/CNPJ', tipo: 'text' },
  { nome: 'telefone', label: 'Telefone', tipo: 'text' },
  { nome: 'email', label: 'E-mail', tipo: 'email' },
  { nome: 'endereco', label: 'Endereço', tipo: 'text' },
  { nome: 'contato_nome', label: 'Pessoa de contato', tipo: 'text' },
];

const CLIENTE_VAZIO = {
  razao_social: '',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  contato_nome: '',
};

// Move o foco para dentro do modal ao abrir, devolve para o elemento que
// disparou a abertura ao fechar, e permite fechar com Esc — sem isso,
// quem navega por teclado ou leitor de tela fica "preso" fora do contexto
// do diálogo ou perde a referência de onde estava ao fechá-lo.
function useFocoAoAbrirModal(aberto, refConteudo, aoFechar) {
  useEffect(() => {
    if (!aberto) return;

    const elementoAnterior = document.activeElement;
    const primeiroFocavel = refConteudo.current?.querySelector(
      'input, select, textarea, button:not([disabled])'
    );
    primeiroFocavel?.focus();

    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    }
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      elementoAnterior?.focus?.();
    };
  }, [aberto]);
}

// Cabeçalho de coluna ordenável operável por teclado (Tab + Enter/Espaço),
// com aria-sort informando ao leitor de tela a direção da ordenação atual.
function CabecalhoOrdenavel({ campo, ordenacaoAtual, aoOrdenar, children }) {
  const ativo = ordenacaoAtual.campo === campo;
  const ariaSort = ativo ? (ordenacaoAtual.direcao === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th aria-sort={ariaSort}>
      <button type="button" className="botao-ordenar" onClick={() => aoOrdenar(campo)}>
        {children} {ativo && (ordenacaoAtual.direcao === 'asc' ? '▲' : '▼')}
      </button>
    </th>
  );
}

export default function Clientes({ usuario }) {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'razao_social', direcao: 'asc' });

  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState(CLIENTE_VAZIO);
  const [erroFormulario, setErroFormulario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const refModal = useRef(null);

  const podeExcluir = usuario.role === 'administrador';
  const podeCriarAcesso = usuario.role === 'administrador' || usuario.role === 'supervisor';

  const [clienteAcesso, setClienteAcesso] = useState(null);
  const [formAcesso, setFormAcesso] = useState({ email: '', senha: '' });
  const [erroAcesso, setErroAcesso] = useState('');
  const [salvandoAcesso, setSalvandoAcesso] = useState(false);
  const refModalAcesso = useRef(null);

  useFocoAoAbrirModal(modalAberto, refModal, () => setModalAberto(false));
  useFocoAoAbrirModal(Boolean(clienteAcesso), refModalAcesso, () => setClienteAcesso(null));

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiFetch('/clientes');
      setClientes(dados);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível carregar os clientes.');
    } finally {
      setCarregando(false);
    }
  }

  const clientesVisiveis = useMemo(() => {
    const termo = filtro.trim().toLowerCase();
    let resultado = clientes;

    if (termo) {
      resultado = resultado.filter((cliente) =>
        [cliente.razao_social, cliente.cpf_cnpj, cliente.email]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))
      );
    }

    resultado = [...resultado].sort((a, b) => {
      const valorA = (a[ordenacao.campo] ?? '').toString().toLowerCase();
      const valorB = (b[ordenacao.campo] ?? '').toString().toLowerCase();
      const comparacao = valorA.localeCompare(valorB);
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });

    return resultado;
  }, [clientes, filtro, ordenacao]);

  function alternarOrdenacao(campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' }
    );
  }

  function abrirNovo() {
    setClienteEditando(null);
    setFormulario(CLIENTE_VAZIO);
    setErroFormulario('');
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setClienteEditando(cliente);
    setFormulario({
      razao_social: cliente.razao_social ?? '',
      cpf_cnpj: cliente.cpf_cnpj ?? '',
      telefone: cliente.telefone ?? '',
      email: cliente.email ?? '',
      endereco: cliente.endereco ?? '',
      contato_nome: cliente.contato_nome ?? '',
    });
    setErroFormulario('');
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
  }

  async function handleSalvar(evento) {
    evento.preventDefault();
    setErroFormulario('');
    setSalvando(true);

    try {
      if (clienteEditando) {
        await apiFetch(`/clientes/${clienteEditando.id}`, { method: 'PUT', body: formulario });
      } else {
        await apiFetch('/clientes', { method: 'POST', body: formulario });
      }
      setModalAberto(false);
      await carregarClientes();
    } catch (err) {
      setErroFormulario(err.dados?.erro || 'Não foi possível salvar o cliente.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirCriarAcesso(cliente) {
    setClienteAcesso(cliente);
    setFormAcesso({ email: cliente.email ?? '', senha: '' });
    setErroAcesso('');
  }

  function fecharModalAcesso() {
    setClienteAcesso(null);
  }

  async function handleSalvarAcesso(evento) {
    evento.preventDefault();
    setErroAcesso('');

    if (!formAcesso.email || !formAcesso.senha) {
      setErroAcesso('Preencha e-mail e senha.');
      return;
    }
    if (formAcesso.senha.length < 6) {
      setErroAcesso('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSalvandoAcesso(true);
    try {
      await apiFetch('/auth/cadastrar', {
        method: 'POST',
        body: {
          nome_completo: clienteAcesso.contato_nome || clienteAcesso.razao_social,
          email: formAcesso.email,
          senha: formAcesso.senha,
          perfil: 'cliente',
          cliente_id: clienteAcesso.id,
        },
      });
      setClienteAcesso(null);
      await carregarClientes();
    } catch (err) {
      setErroAcesso(err.dados?.erro || 'Não foi possível criar o acesso.');
    } finally {
      setSalvandoAcesso(false);
    }
  }

  async function handleExcluir(cliente) {
    if (!window.confirm(`Remover o cliente "${cliente.razao_social}"?`)) return;
    try {
      await apiFetch(`/clientes/${cliente.id}`, { method: 'DELETE' });
      await carregarClientes();
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível remover o cliente.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h2>Clientes</h2>
        <button type="button" onClick={abrirNovo}>
          Novo cliente
        </button>
      </div>

      <div className="barra-filtros">
        <label htmlFor="buscaClientes" className="sr-only">
          Buscar por razão social, CPF/CNPJ ou e-mail
        </label>
        <input
          id="buscaClientes"
          type="search"
          placeholder="Buscar por razão social, CPF/CNPJ ou e-mail..."
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value)}
        />
      </div>

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

      {carregando ? (
        <p>Carregando clientes...</p>
      ) : (
        <div className="tabela-wrapper">
          <table>
            <thead>
              <tr>
                <CabecalhoOrdenavel campo="razao_social" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Razão social
                </CabecalhoOrdenavel>
                <CabecalhoOrdenavel campo="cpf_cnpj" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  CPF/CNPJ
                </CabecalhoOrdenavel>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Contato</th>
                <th>Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesVisiveis.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.razao_social}</td>
                  <td>{cliente.cpf_cnpj}</td>
                  <td>{cliente.telefone}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.contato_nome}</td>
                  <td>
                    {cliente.usuario_id ? (
                      <span className="badge badge-equip-ativo">Vinculado</span>
                    ) : podeCriarAcesso ? (
                      <button type="button" className="secundario" onClick={() => abrirCriarAcesso(cliente)}>
                        Criar acesso
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="acoes-tabela">
                      <button type="button" className="secundario" onClick={() => abrirEdicao(cliente)}>
                        Editar
                      </button>
                      {podeExcluir && (
                        <button type="button" className="perigo" onClick={() => handleExcluir(cliente)}>
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {clientesVisiveis.length === 0 && (
                <tr>
                  <td colSpan={7}>Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal">
          <form
            className="cartao-modal"
            onSubmit={handleSalvar}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalCliente"
            ref={refModal}
          >
            <h2 id="tituloModalCliente">{clienteEditando ? 'Editar cliente' : 'Novo cliente'}</h2>

            {CAMPOS_FORMULARIO.map((campo) => (
              <div key={campo.nome}>
                <label htmlFor={campo.nome}>{campo.label}</label>
                <input
                  id={campo.nome}
                  type={campo.tipo}
                  value={formulario[campo.nome]}
                  onChange={(evento) =>
                    setFormulario((atual) => ({ ...atual, [campo.nome]: evento.target.value }))
                  }
                  required
                />
              </div>
            ))}

            {erroFormulario && <p className="mensagem-erro" role="alert">{erroFormulario}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="secundario" onClick={fecharModal}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {clienteAcesso && (
        <div className="sobreposicao-modal">
          <form
            className="cartao-modal"
            onSubmit={handleSalvarAcesso}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalAcesso"
            ref={refModalAcesso}
          >
            <h2 id="tituloModalAcesso">Criar acesso — {clienteAcesso.razao_social}</h2>
            <p>
              O cliente poderá logar com este e-mail e senha para abrir chamados,
              acompanhar o andamento e avaliar o atendimento.
            </p>

            <label htmlFor="acessoEmail">E-mail de login</label>
            <input
              id="acessoEmail"
              type="email"
              value={formAcesso.email}
              onChange={(evento) => setFormAcesso((atual) => ({ ...atual, email: evento.target.value }))}
              required
            />

            <label htmlFor="acessoSenha">Senha</label>
            <input
              id="acessoSenha"
              type="password"
              value={formAcesso.senha}
              onChange={(evento) => setFormAcesso((atual) => ({ ...atual, senha: evento.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required
            />

            {erroAcesso && <p className="mensagem-erro" role="alert">{erroAcesso}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={salvandoAcesso}>
                {salvandoAcesso ? 'Criando...' : 'Criar acesso'}
              </button>
              <button type="button" className="secundario" onClick={fecharModalAcesso}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
