import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../services/api';

const LABEL_STATUS = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const LABEL_TIPO = {
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  desinstalacao: 'Desinstalação',
};

const LABEL_PRIORIDADE = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const STATUS_VALIDOS = ['aberto', 'em_andamento', 'finalizado', 'cancelado'];

const CHAMADO_VAZIO = {
  descricao: '',
  tipo: 'manutencao',
  prioridade: 'media',
  origem: 'interno',
  cliente_id: '',
  equipamento_id: '',
  tecnico_id: '',
};

function formatarData(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}

// Move o foco para dentro do modal ao abrir, devolve para o elemento que
// disparou a abertura ao fechar, e permite fechar com Esc — repetido aqui
// (em vez de importado) porque cada tela corrige seus próprios modais
// de forma independente.
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

// Cabeçalho de coluna ordenável operável por teclado, com aria-sort
// informando ao leitor de tela a direção da ordenação atual.
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

export default function Chamados({ usuario }) {
  const [chamados, setChamados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [ordenacao, setOrdenacao] = useState({ campo: 'data_abertura', direcao: 'desc' });

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [formulario, setFormulario] = useState(CHAMADO_VAZIO);
  const [erroFormulario, setErroFormulario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const refModalNovo = useRef(null);

  const [chamadoStatusEditando, setChamadoStatusEditando] = useState(null);
  const [novoStatus, setNovoStatus] = useState('aberto');
  const [observacaoStatus, setObservacaoStatus] = useState('');
  const [erroStatus, setErroStatus] = useState('');
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const refModalStatus = useRef(null);

  // RF10 — preenchido pelo técnico ao finalizar (ações realizadas,
  // horário de início/fim do atendimento).
  const [atendimento, setAtendimento] = useState({ descricao_acoes: '', data_inicio: '', data_fim: '' });

  const [chamadoDetalhe, setChamadoDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const refModalDetalhe = useRef(null);

  const [chamadoAvaliando, setChamadoAvaliando] = useState(null);
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [erroAvaliacao, setErroAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const refModalAvaliacao = useRef(null);

  // Espelha a autorização do backend (routes/chamadoRoutes.js): as ações só
  // aparecem para quem, de fato, tem permissão de executá-las na API.
  // RF05/RF06 — cliente abre o próprio chamado; administrador/supervisor
  // abrem chamados internos (e escolhem cliente/técnico na hora).
  const podeAbrirChamado = ['administrador', 'supervisor', 'cliente'].includes(usuario.role);
  const podeEscolherClienteETecnico = usuario.role === 'administrador' || usuario.role === 'supervisor';
  const podeAtribuirTecnico = usuario.role === 'administrador' || usuario.role === 'supervisor';
  const podeAtualizarStatus = ['administrador', 'supervisor', 'tecnico'].includes(usuario.role);
  const podeExcluir = usuario.role === 'administrador';
  const podeAvaliar = usuario.role === 'cliente';

  useFocoAoAbrirModal(modalNovoAberto, refModalNovo, () => setModalNovoAberto(false));
  useFocoAoAbrirModal(Boolean(chamadoStatusEditando), refModalStatus, () => setChamadoStatusEditando(null));
  useFocoAoAbrirModal(Boolean(chamadoDetalhe), refModalDetalhe, () => setChamadoDetalhe(null));
  useFocoAoAbrirModal(Boolean(chamadoAvaliando), refModalAvaliacao, () => setChamadoAvaliando(null));

  useEffect(() => {
    carregarListasDeApoio();
    carregarChamados();
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

  // Clientes e usuários só são carregados para quem tem permissão de usá-los
  // (abrir chamado / atribuir técnico) — evita um 403 desnecessário no console.
  async function carregarListasDeApoio() {
    try {
      const dadosEquipamentos = await apiFetch('/equipamentos');
      setEquipamentos(dadosEquipamentos);
    } catch {
      // lista de apoio; se falhar, os selects ficam vazios e o form avisa
    }

    if (podeEscolherClienteETecnico) {
      try {
        const dadosClientes = await apiFetch('/clientes');
        setClientes(dadosClientes);
      } catch {
        /* usuário sem permissão para listar clientes */
      }
    }

    if (podeAtribuirTecnico) {
      try {
        // tecnico.id (não usuario.id) é o valor esperado por
        // chamado.tecnico_id — por isso usamos /tecnicos, que já traz o
        // nome do usuário vinculado a cada técnico.
        const dadosTecnicos = await apiFetch('/tecnicos');
        setTecnicos(dadosTecnicos);
      } catch {
        /* usuário sem permissão para listar técnicos */
      }
    }
  }

  const chamadosVisiveis = useMemo(() => {
    const termo = filtroTexto.trim().toLowerCase();
    let resultado = chamados;

    if (termo) {
      resultado = resultado.filter((chamado) =>
        [chamado.descricao, chamado.cliente_nome, chamado.tecnico_nome, chamado.equipamento_pat]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus) {
      resultado = resultado.filter((chamado) => chamado.status === filtroStatus);
    }

    if (filtroTipo) {
      resultado = resultado.filter((chamado) => chamado.tipo === filtroTipo);
    }

    resultado = [...resultado].sort((a, b) => {
      const { campo, direcao } = ordenacao;
      let comparacao;

      if (campo === 'data_abertura') {
        comparacao = new Date(a.data_abertura).getTime() - new Date(b.data_abertura).getTime();
      } else {
        const valorA = (a[campo] ?? '').toString().toLowerCase();
        const valorB = (b[campo] ?? '').toString().toLowerCase();
        comparacao = valorA.localeCompare(valorB);
      }

      return direcao === 'asc' ? comparacao : -comparacao;
    });

    return resultado;
  }, [chamados, filtroTexto, filtroStatus, filtroTipo, ordenacao]);

  function alternarOrdenacao(campo) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' }
        : { campo, direcao: campo === 'data_abertura' ? 'desc' : 'asc' }
    );
  }

  const equipamentosDoCliente = useMemo(() => {
    if (!formulario.cliente_id) return equipamentos;
    return equipamentos.filter((equipamento) => String(equipamento.cliente_id) === String(formulario.cliente_id));
  }, [equipamentos, formulario.cliente_id]);

  function abrirNovoChamado() {
    setFormulario(CHAMADO_VAZIO);
    setErroFormulario('');
    setModalNovoAberto(true);
  }

  function fecharModalNovo() {
    setModalNovoAberto(false);
  }

  async function handleSalvarNovo(evento) {
    evento.preventDefault();
    setErroFormulario('');

    if (!formulario.descricao || !formulario.tipo) {
      setErroFormulario('Preencha descrição e tipo.');
      return;
    }
    if (podeEscolherClienteETecnico && !formulario.cliente_id) {
      setErroFormulario('Selecione o cliente.');
      return;
    }

    setSalvando(true);
    try {
      const corpo = {
        descricao: formulario.descricao,
        tipo: formulario.tipo,
        prioridade: formulario.prioridade,
        equipamento_id: formulario.equipamento_id ? Number(formulario.equipamento_id) : null,
      };

      // cliente_id/tecnico_id/origem só fazem sentido para quem abre
      // chamado internamente — para o perfil cliente, o backend resolve
      // tudo isso a partir do próprio usuário logado (RF05).
      if (podeEscolherClienteETecnico) {
        corpo.cliente_id = Number(formulario.cliente_id);
        corpo.tecnico_id = formulario.tecnico_id ? Number(formulario.tecnico_id) : null;
      }

      await apiFetch('/chamados', { method: 'POST', body: corpo });
      setModalNovoAberto(false);
      await carregarChamados();
    } catch (err) {
      setErroFormulario(err.dados?.erro || 'Não foi possível abrir o chamado.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicaoStatus(chamado) {
    setChamadoStatusEditando(chamado);
    setNovoStatus(chamado.status);
    setObservacaoStatus('');
    setAtendimento({ descricao_acoes: '', data_inicio: '', data_fim: '' });
    setErroStatus('');
  }

  function fecharEdicaoStatus() {
    setChamadoStatusEditando(null);
  }

  async function handleSalvarStatus(evento) {
    evento.preventDefault();
    setErroStatus('');
    setAtualizandoStatus(true);
    try {
      // RF10 — o registro de atendimento precisa ser salvo ANTES de marcar
      // como finalizado: é nesse momento que o backend gera a OS (RF16), e
      // ela já sai vinculada ao atendimento se ele existir a tempo.
      const temDadosAtendimento = atendimento.descricao_acoes || atendimento.data_inicio || atendimento.data_fim;
      if (novoStatus === 'finalizado' && temDadosAtendimento) {
        await apiFetch(`/chamados/${chamadoStatusEditando.id}/atendimento`, {
          method: 'PATCH',
          body: {
            descricao_acoes: atendimento.descricao_acoes || undefined,
            data_inicio: atendimento.data_inicio || undefined,
            data_fim: atendimento.data_fim || undefined,
          },
        });
      }

      await apiFetch(`/chamados/${chamadoStatusEditando.id}/status`, {
        method: 'PATCH',
        body: { status: novoStatus, observacao: observacaoStatus || undefined },
      });

      setChamadoStatusEditando(null);
      await carregarChamados();
    } catch (err) {
      setErroStatus(err.dados?.erro || 'Não foi possível atualizar o status.');
    } finally {
      setAtualizandoStatus(false);
    }
  }

  async function handleAtribuirTecnico(chamado, tecnicoId) {
    if (!tecnicoId) return;
    try {
      await apiFetch(`/chamados/${chamado.id}/tecnico`, {
        method: 'PATCH',
        body: { tecnico_id: Number(tecnicoId) },
      });
      await carregarChamados();
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível atribuir o técnico.');
    }
  }

  async function handleExcluir(chamado) {
    if (!window.confirm(`Excluir o chamado #${chamado.id}?`)) return;
    try {
      await apiFetch(`/chamados/${chamado.id}`, { method: 'DELETE' });
      await carregarChamados();
    } catch (err) {
      setErro(err.dados?.erro || 'Não foi possível excluir o chamado.');
    }
  }

  async function abrirDetalhes(chamado) {
    setCarregandoDetalhe(true);
    setChamadoDetalhe({ id: chamado.id });
    try {
      const dados = await apiFetch(`/chamados/${chamado.id}`);
      setChamadoDetalhe(dados);
    } catch (err) {
      setChamadoDetalhe(null);
      setErro(err.dados?.erro || 'Não foi possível carregar o histórico do chamado.');
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharDetalhes() {
    setChamadoDetalhe(null);
  }

  function abrirAvaliacao(chamado) {
    setChamadoAvaliando(chamado);
    setNotaAvaliacao(5);
    setComentarioAvaliacao('');
    setErroAvaliacao('');
  }

  function fecharAvaliacao() {
    setChamadoAvaliando(null);
  }

  async function handleEnviarAvaliacao(evento) {
    evento.preventDefault();
    setErroAvaliacao('');
    setEnviandoAvaliacao(true);
    try {
      await apiFetch('/avaliacoes', {
        method: 'POST',
        body: {
          chamado_id: chamadoAvaliando.id,
          nota: Number(notaAvaliacao),
          comentario: comentarioAvaliacao || undefined,
        },
      });
      setChamadoAvaliando(null);
      await carregarChamados();
    } catch (err) {
      setErroAvaliacao(err.dados?.erro || 'Não foi possível enviar a avaliação.');
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h2>Chamados</h2>
        {podeAbrirChamado && (
          <button type="button" onClick={abrirNovoChamado}>
            Novo chamado
          </button>
        )}
      </div>

      <div className="barra-filtros">
        <label htmlFor="buscaChamados" className="sr-only">
          Buscar por descrição, cliente, técnico ou PAT
        </label>
        <input
          id="buscaChamados"
          type="search"
          placeholder="Buscar por descrição, cliente, técnico ou PAT..."
          value={filtroTexto}
          onChange={(evento) => setFiltroTexto(evento.target.value)}
        />
        <label htmlFor="filtroStatusChamado" className="sr-only">
          Filtrar por status
        </label>
        <select
          id="filtroStatusChamado"
          value={filtroStatus}
          onChange={(evento) => setFiltroStatus(evento.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_VALIDOS.map((status) => (
            <option key={status} value={status}>
              {LABEL_STATUS[status]}
            </option>
          ))}
        </select>
        <label htmlFor="filtroTipoChamado" className="sr-only">
          Filtrar por tipo
        </label>
        <select
          id="filtroTipoChamado"
          value={filtroTipo}
          onChange={(evento) => setFiltroTipo(evento.target.value)}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(LABEL_TIPO).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
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
                <CabecalhoOrdenavel campo="data_abertura" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Abertura
                </CabecalhoOrdenavel>
                <CabecalhoOrdenavel campo="cliente_nome" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Cliente
                </CabecalhoOrdenavel>
                <th>Equipamento</th>
                <CabecalhoOrdenavel campo="tipo" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Tipo
                </CabecalhoOrdenavel>
                <CabecalhoOrdenavel campo="prioridade" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Prioridade
                </CabecalhoOrdenavel>
                <CabecalhoOrdenavel campo="status" ordenacaoAtual={ordenacao} aoOrdenar={alternarOrdenacao}>
                  Status
                </CabecalhoOrdenavel>
                <th>Técnico</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {chamadosVisiveis.map((chamado) => (
                <tr key={chamado.id}>
                  <td>{formatarData(chamado.data_abertura)}</td>
                  <td>{chamado.cliente_nome ?? '—'}</td>
                  <td>{chamado.equipamento_pat ? `PAT ${chamado.equipamento_pat} — ${chamado.equipamento_modelo}` : '—'}</td>
                  <td>{LABEL_TIPO[chamado.tipo] ?? chamado.tipo}</td>
                  <td>{LABEL_PRIORIDADE[chamado.prioridade] ?? chamado.prioridade}</td>
                  <td>
                    <span className={`badge badge-${chamado.status}`}>{LABEL_STATUS[chamado.status] ?? chamado.status}</span>
                  </td>
                  <td>
                    {podeAtribuirTecnico ? (
                      <select
                        aria-label={`Atribuir técnico ao chamado número ${chamado.id}`}
                        value={chamado.tecnico_id ?? ''}
                        onChange={(evento) => handleAtribuirTecnico(chamado, evento.target.value)}
                      >
                        <option value="" disabled>
                          {chamado.tecnico_nome ?? 'Sem técnico'}
                        </option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.id} value={tecnico.id}>
                            {tecnico.nome_completo}
                          </option>
                        ))}
                      </select>
                    ) : (
                      chamado.tecnico_nome ?? '—'
                    )}
                  </td>
                  <td>
                    <div className="acoes-tabela">
                      <button type="button" className="secundario" onClick={() => abrirDetalhes(chamado)}>
                        Detalhes
                      </button>
                      {podeAtualizarStatus && (
                        <button type="button" className="secundario" onClick={() => abrirEdicaoStatus(chamado)}>
                          Status
                        </button>
                      )}
                      {podeAvaliar && chamado.status === 'finalizado' && !chamado.avaliacao_id && (
                        <button type="button" className="secundario" onClick={() => abrirAvaliacao(chamado)}>
                          Avaliar
                        </button>
                      )}
                      {podeExcluir && (
                        <button type="button" className="perigo" onClick={() => handleExcluir(chamado)}>
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {chamadosVisiveis.length === 0 && (
                <tr>
                  <td colSpan={8}>Nenhum chamado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalNovoAberto && (
        <div className="sobreposicao-modal">
          <form
            className="cartao-modal"
            onSubmit={handleSalvarNovo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalNovoChamado"
            ref={refModalNovo}
          >
            <h2 id="tituloModalNovoChamado">Novo chamado</h2>

            {podeEscolherClienteETecnico && (
              <>
                <label htmlFor="cliente_id">Cliente</label>
                <select
                  id="cliente_id"
                  value={formulario.cliente_id}
                  onChange={(evento) =>
                    setFormulario((atual) => ({ ...atual, cliente_id: evento.target.value, equipamento_id: '' }))
                  }
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
                </select>
              </>
            )}

            <label htmlFor="equipamento_id">Equipamento (opcional)</label>
            <select
              id="equipamento_id"
              value={formulario.equipamento_id}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, equipamento_id: evento.target.value }))}
            >
              <option value="">Nenhum</option>
              {equipamentosDoCliente.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  PAT {equipamento.pat} — {equipamento.modelo}
                </option>
              ))}
            </select>

            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={formulario.tipo}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, tipo: evento.target.value }))}
              required
            >
              {Object.entries(LABEL_TIPO).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="prioridade">Prioridade</label>
            <select
              id="prioridade"
              value={formulario.prioridade}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, prioridade: evento.target.value }))}
            >
              {Object.entries(LABEL_PRIORIDADE).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="descricao">Descrição do problema</label>
            <textarea
              id="descricao"
              rows={3}
              value={formulario.descricao}
              onChange={(evento) => setFormulario((atual) => ({ ...atual, descricao: evento.target.value }))}
              required
            />

            {podeAtribuirTecnico && (
              <>
                <label htmlFor="tecnico_id">Técnico (opcional)</label>
                <select
                  id="tecnico_id"
                  value={formulario.tecnico_id}
                  onChange={(evento) => setFormulario((atual) => ({ ...atual, tecnico_id: evento.target.value }))}
                >
                  <option value="">Sem técnico definido</option>
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                      {tecnico.nome_completo}
                    </option>
                  ))}
                </select>
              </>
            )}

            {erroFormulario && <p className="mensagem-erro" role="alert">{erroFormulario}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Abrir chamado'}
              </button>
              <button type="button" className="secundario" onClick={fecharModalNovo}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {chamadoStatusEditando && (
        <div className="sobreposicao-modal">
          <form
            className="cartao-modal"
            onSubmit={handleSalvarStatus}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalStatus"
            ref={refModalStatus}
          >
            <h2 id="tituloModalStatus">Atualizar status — chamado #{chamadoStatusEditando.id}</h2>

            <label htmlFor="novoStatus">Novo status</label>
            <select id="novoStatus" value={novoStatus} onChange={(evento) => setNovoStatus(evento.target.value)}>
              {STATUS_VALIDOS.map((status) => (
                <option key={status} value={status}>
                  {LABEL_STATUS[status]}
                </option>
              ))}
            </select>

            <label htmlFor="observacaoStatus">Observação (opcional)</label>
            <textarea
              id="observacaoStatus"
              rows={3}
              value={observacaoStatus}
              onChange={(evento) => setObservacaoStatus(evento.target.value)}
            />

            {novoStatus === 'finalizado' && (
              <>
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Registro de atendimento (opcional) — fica visível para o cliente avaliar.
                </p>

                <label htmlFor="descricaoAcoes">Ações realizadas</label>
                <textarea
                  id="descricaoAcoes"
                  rows={3}
                  value={atendimento.descricao_acoes}
                  onChange={(evento) =>
                    setAtendimento((atual) => ({ ...atual, descricao_acoes: evento.target.value }))
                  }
                  placeholder="Ex.: troca de toner, limpeza do cilindro..."
                />

                <label htmlFor="dataInicio">Início do atendimento</label>
                <input
                  id="dataInicio"
                  type="datetime-local"
                  value={atendimento.data_inicio}
                  onChange={(evento) => setAtendimento((atual) => ({ ...atual, data_inicio: evento.target.value }))}
                />

                <label htmlFor="dataFim">Fim do atendimento</label>
                <input
                  id="dataFim"
                  type="datetime-local"
                  value={atendimento.data_fim}
                  onChange={(evento) => setAtendimento((atual) => ({ ...atual, data_fim: evento.target.value }))}
                />
              </>
            )}

            {erroStatus && <p className="mensagem-erro" role="alert">{erroStatus}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={atualizandoStatus}>
                {atualizandoStatus ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" className="secundario" onClick={fecharEdicaoStatus}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {chamadoDetalhe && (
        <div className="sobreposicao-modal">
          <div
            className="cartao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalDetalhe"
            ref={refModalDetalhe}
            tabIndex={-1}
          >
            <h2 id="tituloModalDetalhe">Chamado #{chamadoDetalhe.id}</h2>
            {carregandoDetalhe ? (
              <p role="status">Carregando...</p>
            ) : (
              <>
                <p>
                  <strong>Descrição:</strong> {chamadoDetalhe.descricao}
                </p>
                <p>
                  <strong>Cliente:</strong> {chamadoDetalhe.cliente_nome ?? '—'}
                </p>
                <p>
                  <strong>Técnico:</strong> {chamadoDetalhe.tecnico_nome ?? '—'}
                </p>
                <p>
                  <strong>Aberto em:</strong> {formatarData(chamadoDetalhe.data_abertura)}
                </p>

                {(chamadoDetalhe.atendimento_descricao_acoes || chamadoDetalhe.atendimento_data_inicio) && (
                  <>
                    <h3>Registro de atendimento</h3>
                    <p>{chamadoDetalhe.atendimento_descricao_acoes ?? 'Sem detalhes registrados.'}</p>
                    <p>
                      <strong>Início:</strong> {formatarData(chamadoDetalhe.atendimento_data_inicio)}
                      {' · '}
                      <strong>Fim:</strong> {formatarData(chamadoDetalhe.atendimento_data_fim)}
                    </p>
                  </>
                )}

                {chamadoDetalhe.avaliacao_id && (
                  <>
                    <h3>Avaliação do cliente</h3>
                    <p>
                      <strong>Nota:</strong> {chamadoDetalhe.avaliacao_nota} / 5
                      {chamadoDetalhe.avaliacao_comentario ? ` — "${chamadoDetalhe.avaliacao_comentario}"` : ''}
                    </p>
                  </>
                )}

                {chamadoDetalhe.ordem_servico_numero && (
                  <>
                    <h3>Ordem de serviço</h3>
                    <p>
                      <strong>Nº:</strong> {chamadoDetalhe.ordem_servico_numero}
                      {' · '}
                      <strong>Gerada em:</strong> {formatarData(chamadoDetalhe.ordem_servico_data)}
                    </p>
                    <button type="button" className="secundario" onClick={() => window.print()}>
                      Imprimir OS
                    </button>
                  </>
                )}

                <h3>Histórico de status</h3>
                <ul className="lista-status">
                  {(chamadoDetalhe.historico ?? []).map((item) => (
                    <li key={item.id}>
                      <span>
                        {LABEL_STATUS[item.status] ?? item.status} — {item.alterado_por_nome ?? 'sistema'}
                        {item.observacao ? ` (${item.observacao})` : ''}
                      </span>
                      <strong>{formatarData(item.data_alteracao)}</strong>
                    </li>
                  ))}
                  {(chamadoDetalhe.historico ?? []).length === 0 && (
                    <li className="lista-status-vazia">Nenhuma alteração registrada ainda.</li>
                  )}
                </ul>
              </>
            )}

            <div className="acoes-formulario">
              <button type="button" className="secundario" onClick={fecharDetalhes}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {chamadoAvaliando && (
        <div className="sobreposicao-modal">
          <form
            className="cartao-modal"
            onSubmit={handleEnviarAvaliacao}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalAvaliacao"
            ref={refModalAvaliacao}
          >
            <h2 id="tituloModalAvaliacao">Avaliar atendimento — chamado #{chamadoAvaliando.id}</h2>

            <label htmlFor="notaAvaliacao">Nota (1 a 5)</label>
            <select id="notaAvaliacao" value={notaAvaliacao} onChange={(evento) => setNotaAvaliacao(evento.target.value)}>
              {[5, 4, 3, 2, 1].map((valor) => (
                <option key={valor} value={valor}>
                  {valor} {valor === 1 ? 'estrela' : 'estrelas'}
                </option>
              ))}
            </select>

            <label htmlFor="comentarioAvaliacao">Comentário (opcional)</label>
            <textarea
              id="comentarioAvaliacao"
              rows={3}
              value={comentarioAvaliacao}
              onChange={(evento) => setComentarioAvaliacao(evento.target.value)}
            />

            {erroAvaliacao && <p className="mensagem-erro" role="alert">{erroAvaliacao}</p>}

            <div className="acoes-formulario">
              <button type="submit" disabled={enviandoAvaliacao}>
                {enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação'}
              </button>
              <button type="button" className="secundario" onClick={fecharAvaliacao}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
