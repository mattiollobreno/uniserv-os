const db = require('../database');

// chamado_id é UNIQUE em `atendimento` — um único registro de atendimento
// por chamado, atualizado conforme o técnico vai preenchendo (RF10).
async function salvarAtendimento({ chamado_id, tecnico_id, data_inicio, data_fim, descricao_acoes, observacoes }) {
    const result = await db.query(
        `INSERT INTO atendimento (chamado_id, tecnico_id, data_inicio, data_fim, descricao_acoes, observacoes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (chamado_id) DO UPDATE SET
            tecnico_id = EXCLUDED.tecnico_id,
            data_inicio = COALESCE(EXCLUDED.data_inicio, atendimento.data_inicio),
            data_fim = COALESCE(EXCLUDED.data_fim, atendimento.data_fim),
            descricao_acoes = COALESCE(EXCLUDED.descricao_acoes, atendimento.descricao_acoes),
            observacoes = COALESCE(EXCLUDED.observacoes, atendimento.observacoes)
         RETURNING *`,
        [chamado_id, tecnico_id, data_inicio ?? null, data_fim ?? null, descricao_acoes ?? null, observacoes ?? null]
    );
    return result.rows[0];
}

async function buscarPorChamadoId(chamadoId) {
    const result = await db.query('SELECT * FROM atendimento WHERE chamado_id = $1', [chamadoId]);
    return result.rows[0] || null;
}

module.exports = { salvarAtendimento, buscarPorChamadoId };
