const db = require('../database');

async function criarAvaliacao({ chamado_id, cliente_id, nota, comentario }) {
    const result = await db.query(
        `INSERT INTO avaliacao (chamado_id, cliente_id, nota, comentario)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [chamado_id, cliente_id, nota, comentario ?? null]
    );
    return result.rows[0];
}

async function buscarPorChamadoId(chamadoId) {
    const result = await db.query('SELECT * FROM avaliacao WHERE chamado_id = $1', [chamadoId]);
    return result.rows[0] || null;
}

module.exports = { criarAvaliacao, buscarPorChamadoId };
