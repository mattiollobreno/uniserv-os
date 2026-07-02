import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

const LABEL_STATUS = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const INTERVALO_ATUALIZACAO_MS = 30000;

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarResumo();
    // Atualização dinâmica: repete a busca em segundo plano, sem piscar a tela.
    const intervalo = setInterval(() => carregarResumo({ silencioso: true }), INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
  }, []);

  async function carregarResumo({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true);
    if (!silencioso) setErro('');
    try {
      const dados = await apiFetch('/dashboard');
      setResumo(dados);
    } catch (err) {
      if (!silencioso) setErro(err.dados?.erro || 'Não foi possível carregar o dashboard.');
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }

  if (carregando) return <p>Carregando dashboard...</p>;
  if (erro) return <p className="mensagem-erro" role="alert">{erro}</p>;
  if (!resumo) return null;

  return (
    <div className="dashboard">
      <div className="cartoes-resumo">
        <CartaoResumo titulo="Usuários" total={resumo.usuarios.total} detalhe={`${resumo.usuarios.ativos} ativos`} />
        <CartaoResumo titulo="Clientes" total={resumo.clientes.total} />
        <CartaoResumo titulo="Equipamentos" total={resumo.equipamentos.total} detalhe={`${resumo.equipamentos.ativos} ativos`} />
        <CartaoResumo titulo="Chamados" total={resumo.chamados.total} />
      </div>

      <section className="secao-status">
        <h2>Chamados por status</h2>
        <ul className="lista-status">
          {Object.entries(resumo.chamados.porStatus).map(([status, total]) => (
            <li key={status}>
              <span>{LABEL_STATUS[status] ?? status}</span>
              <strong>{total}</strong>
            </li>
          ))}
          {Object.keys(resumo.chamados.porStatus).length === 0 && (
            <li className="lista-status-vazia">Nenhum chamado registrado ainda.</li>
          )}
        </ul>
      </section>

      <button type="button" onClick={() => carregarResumo()}>
        Atualizar agora
      </button>
    </div>
  );
}

function CartaoResumo({ titulo, total, detalhe }) {
  return (
    <div className="cartao-resumo">
      <h3>{titulo}</h3>
      <p className="cartao-resumo-total">{total}</p>
      {detalhe && <p className="cartao-resumo-detalhe">{detalhe}</p>}
    </div>
  );
}
