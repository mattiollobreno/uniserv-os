const db = require('../database');

// Cria a linha em `tecnico` vinculada ao usuário recém-cadastrado com
// perfil 'tecnico' (RF01). Sem isso, chamado.tecnico_id (que referencia
// tecnico.id, não usuario.id) nunca teria para quem apontar.
async function criarTecnico(usuarioId) {
    const result = await db.query(
        `INSERT INTO tecnico (usuario_id, ativo) VALUES ($1, true) RETURNING *`,
        [usuarioId]
    );
    return result.rows[0];
}

async function buscarPorUsuarioId(usuarioId) {
    const result = await db.query('SELECT * FROM tecnico WHERE usuario_id = $1', [usuarioId]);
    return result.rows[0] || null;
}

// Usado para preencher o seletor de técnico ao abrir/atribuir um chamado
// (frontend/src/pages/Chamados.jsx). Retorna o id da tabela `tecnico`
// (é esse id que deve ser gravado em chamado.tecnico_id), já com o nome
// vindo de `usuario` para exibição.
async function listarTecnicos() {
    const result = await db.query(
        `SELECT t.id, t.regiao, t.ativo, u.id AS usuario_id, u.nome_completo, u.email
         FROM tecnico t
         JOIN usuario u ON u.id = t.usuario_id
         WHERE t.ativo = true
         ORDER BY u.nome_completo ASC`
    );
    return result.rows;
}

module.exports = { criarTecnico, buscarPorUsuarioId, listarTecnicos };
