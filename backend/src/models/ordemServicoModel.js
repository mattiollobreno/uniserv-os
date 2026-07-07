const db = require('../database');

// RF16 — a OS é gerada automaticamente pelo sistema (não por uma pessoa)
// quando o chamado é finalizado; ver chamadoModel.atualizarStatus. Recebe o
// `client` da transação em andamento para que a geração da OS nunca fique
// dessincronizada da mudança de status que a originou.
// chamado_id é UNIQUE em ordem_servico — ON CONFLICT DO NOTHING garante que
// finalizar/reabrir/finalizar de novo o mesmo chamado nunca gera duas OS.
async function gerarOrdemServico(client, chamadoId, atendimentoId) {
    const numeroOs = `OS-${new Date().getFullYear()}-${String(chamadoId).padStart(5, '0')}`;
    const result = await client.query(
        `INSERT INTO ordem_servico (numero_os, chamado_id, atendimento_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (chamado_id) DO NOTHING
         RETURNING *`,
        [numeroOs, chamadoId, atendimentoId ?? null]
    );
    return result.rows[0] || null;
}

async function buscarPorChamadoId(chamadoId) {
    const result = await db.query('SELECT * FROM ordem_servico WHERE chamado_id = $1', [chamadoId]);
    return result.rows[0] || null;
}

module.exports = { gerarOrdemServico, buscarPorChamadoId };
