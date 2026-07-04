import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const LABEL_STATUS = {
  ativo: 'Ativo',
  em_manutencao: 'Em manutenção',
  desinstalado: 'Desinstalado',
};

const STATUS_VALIDOS = ['ativo', 'em_manutencao', 'desinstalado'];

const EQUIPAMENTO_VAZIO = {
  pat: '',
  modelo: '',
  marca: '',
  localizacao: '',
  status: 'ativo',
  cliente_id: '',
};

export default function Equipamentos({ usuario }) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'pat', direcao: 'asc' });

  const [modalAberto, setModalAberto] = useState(false);
  const [equipamentoEditando, setEquipamentoEditando] = useState(null);
  const [formulario, setFormulario] = useState(EQUIPAMENTO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Espelha routes/equipamentoRoutes.js: técnico também pode cadastrar e
  // editar equipamento, mas exclusão é restrita a administrador.
  const podeGerenciar = ['administrador', 'supervisor', 'tecnico'].includes(usuario.role);
  const podeExcluir = usuario.role === 'administrador';

  useEffect(() => {
    carregarEquipamentos();
    carregarClientes();
  }, []);

  async function carregarEquipamentos() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiFetch('/equipamentos');
      setEquipamentos(dados);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível carregar os equipamentos.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarClientes() {
    try {
      const dados = await apiFetch('/clientes');
      setClientes(dados);
    } catch {
      // usuário sem permissão para listar clientes (ex.: perfil técnico) —
      // o formulário mostra o cliente já vinculado, mas não permite trocá-lo
    }
  }

  const equipamentosVisiveis = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    let resultado = equipamentos;

    if (termo) {
      resultado = resultado.filter((equipamento) =>
        [equipamento.pat, equipamento.modelo, equipamento.marca, equipamento.cliente_nome]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus) {
      resultado = resultado.filter((equipamento) => equipamento.status === filtroStatus);
    }

    resultado = [...resultado].sort((a, b) => {
      const valorA = (a[ordenacao.campo] ?? '').toString().toLowerCase();
      const valorB = (b[ordenacao.campo] ?? '').toString().toLowerCase();
      const comparacao = valorA.localeCompare(valorB, undefined, { numeric: true });
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });

    return resultado;
  }, [equipamentos, filtroTexto, filtroStatus, ordenacao]);

  function alternarOrdenacao(campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' }
    );
  }

  function abrirNovo() {
    setEquipamentoEditando(null);
    setFormulario(EQUIPAMENTO_VAZIO);
    setErroFormulario('');
    setModalAberto(true);
  }

  function abrirEdicao(equipamento) {
    setEquipamentoEditando(equipamento);
    setFormulario({
      pat: equipamento.pat ?? '',
      modelo: equipamento.modelo ?? '',
      marca: equipamento.marca ?? '',
      localizacao: equipamento.localizacao ?? '',
      status: equipamento.status ?? 'ativo',
      cliente_id: equipamento.cliente_id ?? '',
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

    if (!formulario.pat || !formulario.modelo || !formulario.marca || !formulario.cliente_id) {
      setErroFormulario('Preencha patrimônio, modelo, marca e cliente.');
      return;
    }

    setSalvando(true);
    const corpo = { ...formulario, cliente_id: Number(formulario.cliente_id) };

    try {
      if (equipamentoEditando) {
        await apiFetch(`/equipamentos/${equipamentoEditando.id}`, { method: 'PUT', body: corpo });
      } else {
        await apiFetch('/equipamentos', { method: 'POST', body: corpo });
      }
      setModalAberto(false);
      await carregarEquipamentos();
    } catch (err) {
      setErroFormulario(err.dados?.erro || 'Não foi possível salvar o equipamento.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(equipamento) {
    if (!window.confirm(`Remover o equipamento PAT ${equipamento.pat}?`)) return;
    try {
      await apiFetch(`/equipamentos/${equipamento.id}`, { method: 'DELETE' });
      await carregarEquipamentos();
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível remover o equipamento.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h2>Equipamentos</h2>
        {podeGerenciar && (
          <button type="button" onClick={abrirNovo}>
            Novo equipamento
          </button>
        )}
      </div>

      <div className="barra-filtros">
        <input
          type="search"
          placeholder="Buscar por PAT, modelo, marca ou cliente..."
          value={filtroTexto}
          onChange={(evento) => setFiltroTexto(evento.target.value)}
        />
        <select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_VALIDOS.map((status) => (
            <option key={status} value={status}>
              {LABEL_STATUS[status]}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

      {carregando ? (
        <p>Carregando equipamentos...</p>
      ) : (
        <div className="tabela-wrapper">
          <table>
            <thead>
              <tr>
                <th className="ordenavel" onClick={() => alternarOrdenacao('pat')}>
                  PAT {ordenacao.campo === 'pat' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th className="ordenavel" onClick={() => alternarOrdenacao('modelo')}>
                  Modelo {ordenacao.campo === 'modelo' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th>Marca</th>
                <th>Localização</th>
                <th className="ordenavel" onClick={() => alternarOrdenacao('cliente_nome')}>
                  Cliente {ordenacao.campo === 'cliente_nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th className="ordenavel" onClick={() => alternarOrdenacao('status')}>
                  Status {ordenacao.campo === 'status' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentosVisiveis.map((equipamento) => (
                <tr key={equipamento.id}>
                  <td>{equipamento.pat}</td>
                  <td>{equipamento.modelo}</td>
                  <td>{equipamento.marca}</td>
                  <td>{equipamento.localizacao ?? '—'}</td>
                  <td>{equipamento.cliente_nome ?? '—'}</td>
                  <td>
                    <span className={`badge badge-equip-${equipamento.status}`}>
                      {LABEL_STATUS[equipamento.status] ?? equipamento.status}
                    </span>
                  </td>
                  <td>
                    <div className="acoes-tabela">
                      {podeGerenciar && (
                        <button type="button" className="secundario" onClick={() => abrirEdicao(equipamento)}>
                          Editar
                        </button>
                      )}
                      {podeExcluir && (
                        <button type="button" className="perigo" onClick={() => handleExcluir(equipamento)}>
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {equipamentosVisiveis.length === 0 && (
                <tr>
                  <td colSpan={7}>Nenhum equipamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="sobreposicao-modal">
          <form className="cartao-modal" onSubmit={handleSalvar}>
            <h2>{equipamentoEditando ? 'Editar equipamento' : 'Novo equipamento'}</h2>

            <label htmlFor="pat">Número de patrimônio (PAT)</label>
            <input
              id="pat"
              type="text"
              value={formulario.pat}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, pat: evento.target.value }))}
              required
            />

            <label htmlFor="modelo">Modelo</label>
            <input
              id="modelo"
              type="text"
              value={formulario.modelo}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, modelo: evento.target.value }))}
              required
            />

            <label htmlFor="marca">Marca</label>
            <input
              id="marca"
              type="text"
              value={formulario.marca}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, marca: evento.target.value }))}
              required
            />

            <label htmlFor="localizacao">Localização</label>
            <input
              id="localizacao"
              type="text"
              value={formulario.localizacao}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, localizacao: evento.target.value }))}
            />

            <label htmlFor="cliente_id">Cliente</label>
            <select
              id="cliente_id"
              value={formulario.cliente_id}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, cliente_id: evento.target.value }))}
              required
            >
              <option value="" disabled>
                Selecione o cliente
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razao_social}
                </option>
              ))}
              {formulario.cliente_id && !clientes.some((c) => String(c.id) === String(formulario.cliente_id)) && (
                <option value={formulario.cliente_id}>{equipamentoEditando?.cliente_nome ?? 'Cliente atual'}</option>
              )}
            </select>

            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={formulario.status}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, status: evento.target.value }))}
            >
              {STATUS_VALIDOS.map((status) => (
                <option key={status} value={status}>
                  {LABEL_STATUS[status]}
                </option>
              ))}
            </select>

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
