import { useEffect, useMemo, useState } from 'react';
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

  const podeExcluir = usuario.role === 'administrador';

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
        <input
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
                <th className="ordenavel" onClick={() => alternarOrdenacao('razao_social')}>
                  Razão social {ordenacao.campo === 'razao_social' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th className="ordenavel" onClick={() => alternarOrdenacao('cpf_cnpj')}>
                  CPF/CNPJ {ordenacao.campo === 'cpf_cnpj' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Contato</th>
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
                  <td colSpan={6}>Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal" onClick={fecharModal}>
          <form
            className="cartao-modal"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={handleSalvar}
          >
            <h2>{clienteEditando ? 'Editar cliente' : 'Novo cliente'}</h2>

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
    </div>
  );
}
