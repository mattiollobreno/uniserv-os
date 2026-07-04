const db = require('../database');

async function criarEquipamento(dados) {
    return await db.query(
        `INSERT INTO equipamento (pat, modelo, marca, localizacao, status, cliente_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [dados.pat, dados.modelo, dados.marca, dados.localizacao, dados.status ?? 'ativo', dados.cliente_id]
    );
}

async function buscarPorPat(pat) {
    const result = await db.query(
        'SELECT * FROM equipamento WHERE pat = $1',
        [pat]
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

// clienteId opcional: usado para o perfil "cliente" ver só os próprios
// equipamentos (filtro aplicado no controller, nunca em dado vindo do
// próprio cliente).
async function listarEquipamentos(clienteId) {
    const condicaoCliente = clienteId ? 'WHERE e.cliente_id = $1' : '';
    const result = await db.query(
        `SELECT e.*, c.razao_social AS cliente_nome
        FROM equipamento e
        LEFT JOIN cliente c ON c.id = e.cliente_id
        ${condicaoCliente}
        ORDER BY e.pat ASC`,
        clienteId ? [clienteId] : []
    );
    return result.rows;
}

async function atualizarEquipamento(id, dados) {
    const result = await db.query(
        `UPDATE equipamento
        SET pat = $1, modelo = $2, marca = $3, localizacao = $4, status = $5, cliente_id = $6
        WHERE id = $7
        RETURNING *`,
        [dados.pat, dados.modelo, dados.marca, dados.localizacao, dados.status, dados.cliente_id, id]
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
