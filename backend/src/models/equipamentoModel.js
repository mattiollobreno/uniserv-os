const db = require('../database');

async function criarEquipamento(dados) {
    return await db.query(
        `INSERT INTO equipamento (pat, modelo, marca, localizacao, status, cliente_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [dados.numero_patrimonio, dados.modelo, dados.marca, dados.localizacao, dados.status ?? 'ativo', dados.cliente_id]
    );
}

async function buscarPorPat(numero_patrimonio) {
    const result = await db.query(
        'SELECT * FROM equipamento WHERE pat = $1',
        [numero_patrimonio]
    );
    return result.rows[0] || null;
}

async function buscarPorId(id) {
    const result = await db.query(
        `SELECT e.*, c.razao_social AS cliente_nome
        FROM equipamento e
        LEFT JOIN cliente c ON c.id = e.cliente_id
        WHERE e.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function listarEquipamentos() {
    const result = await db.query(
        `SELECT e.*, c.razao_social AS cliente_nome
        FROM equipamento e
        LEFT JOIN cliente c ON c.id = e.cliente_id
        ORDER BY e.numero_patrimonio ASC`
    );
    return result.rows;
}

async function atualizarEquipamento(id, dados) {
    const result = await db.query(
        `UPDATE equipamento
        SET numero_patrimonio = $1, modelo = $2, marca = $3, localizacao = $4, status = $5, cliente_id = $6
        WHERE id = $7
        RETURNING *`,
        [dados.numero_patrimonio, dados.modelo, dados.marca, dados.localizacao, dados.status, dados.cliente_id, id]
    );
    return result.rows[0] || null;
}

async function deletarEquipamento(id) {
    const result = await db.query(
        'DELETE FROM equipamento WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0] || null;
}

module.exports = { criarEquipamento, buscarPorPat, buscarPorId, listarEquipamentos, atualizarEquipamento, deletarEquipamento };
