import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/api';

const TIPOS = [
  { valor: 'instalacao', label: 'Instalação' },
  { valor: 'manutencao', label: 'Manutenção' },
  { valor: 'desinstalacao', label: 'Desinstalação' },
];

const PRIORIDADES = [
  { valor: 'baixa', label: 'Baixa' },
  { valor: 'media', label: 'Média' },
  { valor: 'alta', label: 'Alta' },
];

const STATUS = [
  { valor: 'aberto', label: 'Aberto' },
  { valor: 'em_andamento', label: 'Em andamento' },
  { valor: 'finalizado', label: 'Finalizado' },
  { valor: 'cancelado', label: 'Cancelado' },
];

const LABEL_TIPO = Object.fromEntries(TIPOS.map((t) => [t.valor, t.label]));
const LABEL_STATUS = Object.fromEntries(STATUS.map((s) => [s.valor, s.label]));

const CHAMADO_VAZIO = {
  descricao: '',
  tipo: 'manutencao',
  prioridade: 'media',
  cliente_id: '',
  equipamento_id: '',
};

export default function Chamados({ usuario }) {
  const [chamados, setChamados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ordenacao, setOrdenacao] = useState({ campo: 'data_abertura', direcao: 'desc' });

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoChamado, setNovoChamado] = useState(CHAMADO_VAZIO);
  const [erroNovo, setErroNovo] = useState('');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const [chamadoDetalhe, setChamadoDetalhe] = useState(null);

  const podeCriar = usuario.role === 'administrador' || usuario.role === 'supervisor';
  const podeAtribuirTecnico = usuario.role === 'administrador' || usuario.role === 'supervisor';
  const podeExcluir = usuario.role === 'administrador';

  useEffect(() => {
    carregarChamados();
    apiFetch('/equipamentos').then(setEquipamentos).catch(() => {});
    if (podeCriar) {
      apiFetch('/clientes').then(setClientes).catch(() => {});
    }
    if (podeAtribuirTecnico) {
      apiFetch('/usuarios')
        .then((lista) => setTecnicos(lista.filter((u) => u.perfil === 'tecnico')))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarChamados() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await apiFetch('/chamados');
      setChamados(dados);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível carregar os chamados.');
    } finally {
      setCarregando(false);
    }
  }

  const chamadosVisiveis = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    let resultado = chamados;

    if (filtroStatus !== 'todos') {
      resultado = resultado.filter((chamado) => chamado.status === filtroStatus);
    }

    if (termo) {
      resultado = resultado.filter((chamado) =>
        [chamado.descricao, chamado.cliente_nome, chamado.equipamento_pat]
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
  }, [chamados, filtroTexto, filtroStatus, ordenacao]);

  function alternarOrdenacao(campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: 'asc' }
    );
  }

  function abrirNovo() {
    setNovoChamado(CHAMADO_VAZIO);
    setErroNovo('');
    setModalNovoAberto(true);
  }

  async function handleCriarChamado(evento) {
    evento.preventDefault();
    setErroNovo('');
    setSalvandoNovo(true);
    try {
      await apiFetch('/chamados', {
        method: 'POST',
        body: {
          ...novoChamado,
          cliente_id: Number(novoChamado.cliente_id),
          equipamento_id: novoChamado.equipamento_id ? Number(novoChamado.equipamento_id) : null,
        },
      });
      setModalNovoAberto(false);
      await carregarChamados();
    } catch (err) {
      setErroNovo(err.dados?.erro || 'Não foi possível abrir o chamado.');
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function abrirDetalhe(chamado) {
    setChamadoDetalhe({ ...chamado, historico: [], carregandoDetalhe: true });
    try {
      const completo = await apiFetch(`/chamados/${chamado.id}`);
      setChamadoDetalhe({ ...completo, carregandoDetalhe: false });
    } catch (err) {
      setChamadoDetalhe(null);
      setErro(err.dados?.erro || 'Não foi possível carregar os detalhes do chamado.');
    }
  }

  async function handleAtualizarStatus(novoStatus, observacao) {
    if (!chamadoDetalhe) return;
    try {
      await apiFetch(`/chamados/${chamadoDetalhe.id}/status`, {
        method: 'PATCH',
        body: { status: novoStatus, observacao: observacao || undefined },
      });
      await Promise.all([carregarChamados(), abrirDetalhe(chamadoDetalhe)]);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível atualizar o status.');
    }
  }

  async function handleAtribuirTecnico(tecnicoId) {
    if (!chamadoDetalhe || !tecnicoId) return;
    try {
      await apiFetch(`/chamados/${chamadoDetalhe.id}/tecnico`, {
        method: 'PATCH',
        body: { tecnico_id: Number(tecnicoId) },
      });
      await Promise.all([carregarChamados(), abrirDetalhe(chamadoDetalhe)]);
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível atribuir o técnico.');
    }
  }

  async function handleExcluir(chamado) {
    if (!window.confirm(`Remover o chamado #${chamado.id}?`)) return;
    try {
      await apiFetch(`/chamados/${chamado.id}`, { method: 'DELETE' });
      setChamadoDetalhe(null);
      await carregarChamados();
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível remover o chamado.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h2>Chamados</h2>
        {podeCriar && (
          <button type="button" onClick={abrirNovo}>
            Novo chamado
          </button>
        )}
      </div>

      <div className="barra-filtros">
        <input
          type="search"
          placeholder="Buscar por cliente, PAT ou descrição..."
          value={filtroTexto}
          onChange={(evento) => setFiltroTexto(evento.target.value)}
        />
        <select value={filtroStatus} onChange={(evento) => setFiltroStatus(evento.target.value)}>
          <option value="todos">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}

      {carregando ? (
        <p>Carregando chamados...</p>
      ) : (
        <div className="tabela-wrapper">
          <table>
            <thead>
              <tr>
                <th className="ordenavel" onClick={() => alternarOrdenacao('cliente_nome')}>
                  Cliente {ordenacao.campo === 'cliente_nome' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Técnico</th>
                <th className="ordenavel" onClick={() => alternarOrdenacao('data_abertura')}>
                  Abertura {ordenacao.campo === 'data_abertura' && (ordenacao.direcao === 'asc' ? '▲' : '▼')}
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {chamadosVisiveis.map((chamado) => (
                <tr key={chamado.id}>
                  <td>{chamado.cliente_nome}</td>
                  <td>{LABEL_TIPO[chamado.tipo] ?? chamado.tipo}</td>
                  <td>
                    <span className={`badge badge-${chamado.status}`}>
                      {LABEL_STATUS[chamado.status] ?? chamado.status}
                    </span>
                  </td>
                  <td>{chamado.tecnico_nome ?? '—'}</td>
                  <td>{formatarData(chamado.data_abertura)}</td>
                  <td>
                    <div className="acoes-tabela">
                      <button type="button" className="secundario" onClick={() => abrirDetalhe(chamado)}>
                        Detalhes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {chamadosVisiveis.length === 0 && (
                <tr>
                  <td colSpan={6}>Nenhum chamado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalNovoAberto && (
        <div className="sobreposicao-modal" onClick={() => setModalNovoAberto(false)}>
          <form
            className="cartao-modal"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={handleCriarChamado}
          >
            <h2>Novo chamado</h2>

            <label htmlFor="cliente_id">Cliente</label>
            <select
              id="cliente_id"
              value={novoChamado.cliente_id}
              onChange={(evento) => setNovoChamado((atual) => ({ ...atual, cliente_id: evento.target.value }))}
              required
            >
              <option value="" disabled>Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.razao_social}
                </option>
              ))}
            </select>

            <label htmlFor="equipamento_id">Equipamento (opcional)</label>
            <select
              id="equipamento_id"
              value={novoChamado.equipamento_id}
              onChange={(evento) => setNovoChamado((atual) => ({ ...atual, equipamento_id: evento.target.value }))}
            >
              <option value="">Nenhum</option>
              {equipamentos.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.pat} — {equipamento.modelo}
                </option>
              ))}
            </select>

            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={novoChamado.tipo}
              onChange={(evento) => setNovoChamado((atual) => ({ ...atual, tipo: evento.target.value }))}
            >
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </select>

            <label htmlFor="prioridade">Prioridade</label>
            <select
              id="prioridade"
              value={novoChamado.prioridade}
              onChange={(evento) => setNovoChamado((atual) => ({ ...atual, prioridade: evento.target.value }))}
            >
              {PRIORIDADES.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>

            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              rows={3}
              value={novoChamado.descricao}
              onChange={(evento) => setNovoChamado((atual) => ({ ...atual, descricao: evento.target.value }))}
              required
            />

            {erroNovo && <p className="mensagem-erro" role="alert">{erroNovo}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={salvandoNovo}>
                {salvandoNovo ? 'Abrindo...' : 'Abrir chamado'}
              </button>
              <button type="button" className="secundario" onClick={() => setModalNovoAberto(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {chamadoDetalhe && (
        <DetalheChamado
          chamado={chamadoDetalhe}
          tecnicos={tecnicos}
          podeAtribuirTecnico={podeAtribuirTecnico}
          podeExcluir={podeExcluir}
          onFechar={() => setChamadoDetalhe(null)}
          onAtualizarStatus={handleAtualizarStatus}
          onAtribuirTecnico={handleAtribuirTecnico}
          onExcluir={() => handleExcluir(chamadoDetalhe)}
        />
      )}
    </div>
  );
}

function DetalheChamado({
  chamado,
  tecnicos,
  podeAtribuirTecnico,
  podeExcluir,
  onFechar,
  onAtualizarStatus,
  onAtribuirTecnico,
  onExcluir,
}) {
  const [novoStatus, setNovoStatus] = useState(chamado.status);
  const [observacao, setObservacao] = useState('');
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(chamado.tecnico_id ?? '');

  return (
    <div className="sobreposicao-modal" onClick={onFechar}>
      <div className="cartao-modal" onClick={(evento) => evento.stopPropagation()}>
        <h2>Chamado #{chamado.id}</h2>
        <p><strong>Cliente:</strong> {chamado.cliente_nome}</p>
        <p><strong>Descrição:</strong> {chamado.descricao}</p>
        <p><strong>Tipo:</strong> {LABEL_TIPO[chamado.tipo] ?? chamado.tipo}</p>
        <p>
          <strong>Status atual:</strong>{' '}
          <span className={`badge badge-${chamado.status}`}>{LABEL_STATUS[chamado.status] ?? chamado.status}</span>
        </p>
        <p><strong>Técnico responsável:</strong> {chamado.tecnico_nome ?? 'Não atribuído'}</p>

        {podeAtribuirTecnico && (
          <>
            <label htmlFor="tecnico">Atribuir técnico</label>
            <div className="acoes-formulario">
              <select
                id="tecnico"
                value={tecnicoSelecionado}
                onChange={(evento) => setTecnicoSelecionado(evento.target.value)}
              >
                <option value="" disabled>Selecione um técnico</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome_completo}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => onAtribuirTecnico(tecnicoSelecionado)}>
                Atribuir
              </button>
            </div>
          </>
        )}

        <label htmlFor="novoStatus">Atualizar status</label>
        <select id="novoStatus" value={novoStatus} onChange={(evento) => setNovoStatus(evento.target.value)}>
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(evento) => setObservacao(evento.target.value)}
          style={{ marginTop: '0.5rem' }}
        />

        <section style={{ marginTop: '1rem' }}>
          <h3>Histórico</h3>
          {chamado.carregandoDetalhe ? (
            <p>Carregando histórico...</p>
          ) : chamado.historico?.length ? (
            <ul className="lista-status">
              {chamado.historico.map((entrada) => (
                <li key={entrada.id}>
                  <span>
                    {LABEL_STATUS[entrada.status] ?? entrada.status}
                    {entrada.alterado_por_nome ? ` — por ${entrada.alterado_por_nome}` : ''}
                  </span>
                  <span>{formatarData(entrada.data_alteracao)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sem alterações registradas ainda.</p>
          )}
        </section>

        <div className="acoes-formulario">
          <button type="button" onClick={() => onAtualizarStatus(novoStatus, observacao)}>
            Salvar status
          </button>
          {podeExcluir && (
            <button type="button" className="perigo" onClick={onExcluir}>
              Excluir chamado
            </button>
          )}
          <button type="button" className="secundario" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function formatarData(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}
