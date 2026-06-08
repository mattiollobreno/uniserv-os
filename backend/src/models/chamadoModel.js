const db = require('../database');

async function criarChamado(dados) {
    return await db.query(
        `INSERT INTO chamado (titulo, descricao, tipo, status, prioridade, cliente_id, equipamento_id, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            dados.titulo,
            dados.descricao,
            dados.tipo,
            dados.status ?? 'aberto',
            dados.prioridade ?? 'normal',
            dados.cliente_id,
            dados.equipamento_id ?? null,
            dados.usuario_id,
        ]
    );
}

async function listarChamados() {
    const result = await db.query(
        `SELECT c.*, 
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.numero_patrimonio AS equipamento_pat,
            e.modelo AS equipamento_modelo
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN usuario u ON u.id = c.usuario_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        ORDER BY c.criado_em DESC`
    );
    return result.rows;
}

async function buscarPorId(id) {
    const result = await db.query(
        `SELECT c.*,
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.numero_patrimonio AS equipamento_pat,
            e.modelo AS equipamento_modelo
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN usuario u ON u.id = c.usuario_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        WHERE c.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function atualizarStatus(id, status) {
    const result = await db.query(
        `UPDATE chamado SET status = $1, atualizado_em = NOW()
        WHERE id = $2
        RETURNING *`,
        [status, id]
    );
    return result.rows[0] || null;
}

async function atribuirTecnico(id, usuario_id) {
    const result = await db.query(
        `UPDATE chamado SET usuario_id = $1, atualizado_em = NOW()
        WHERE id = $2
        RETURNING *`,
        [usuario_id, id]
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
