const db = require('../database');

async function criarChamado(dados) {
    return await db.query(
        `INSERT INTO chamado (descricao, tipo, status, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
            dados.descricao,
            dados.tipo,
            dados.status ?? 'aberto',
            dados.prioridade ?? 'media',
            dados.origem ?? 'interno',
            dados.cliente_id,
            dados.equipamento_id ?? null,
            dados.tecnico_id ?? null,
            dados.supervisor_id ?? null,
        ]
    );
}

async function listarChamados() {
    const result = await db.query(
        `SELECT c.*, 
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.pat AS equipamento_pat,
            e.modelo AS equipamento_modelo
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN usuario u ON u.id = c.tecnico_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        ORDER BY c.data_abertura DESC`
    );
    return result.rows;
}

async function buscarPorId(id) {
    const result = await db.query(
        `SELECT c.*,
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.pat AS equipamento_pat,
            e.modelo AS equipamento_modelo
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN usuario u ON u.id = c.tecnico_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        WHERE c.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function atualizarStatus(id, status) {
    const result = await db.query(
        `UPDATE chamado SET status = $1
        WHERE id = $2
        RETURNING *`,
        [status, id]
    );
    return result.rows[0] || null;
}

async function atribuirTecnico(id, tecnico_id) {
    const result = await db.query(
        `UPDATE chamado SET tecnico_id = $1
        WHERE id = $2
        RETURNING *`,
        [tecnico_id, id]
    );
    return result.rows[0] || null;
}

async function deletarChamado(id) {
    const result = await db.query(
        'DELETE FROM chamado WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0] || null;
}

module.exports = { criarChamado, listarChamados, buscarPorId, atualizarStatus, atribuirTecnico, deletarChamado };