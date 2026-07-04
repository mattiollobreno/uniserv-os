const db = require('../database');

async function criarUsuario(dados) {
    return await db.query(
        `INSERT INTO usuario (nome_completo, email, telefone, senha_hash, perfil, ativo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, nome_completo, email, perfil, ativo`,
        [dados.nome_completo, dados.email, dados.telefone, dados.senha_hash, dados.perfil, dados.ativo]
    );
}

async function buscarPorEmail(email) {
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function buscarPorId(id) {
    // senha_hash excluída por segurança — este resultado pode ser exposto
    // via GET /usuarios/:id. Para fluxos internos que precisam do hash
    // (ex.: troca de senha), use buscarPorIdComSenha.
    const result = await db.query(
        'SELECT id, nome_completo, email, telefone, perfil, ativo FROM usuario WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

// Uso interno apenas (ex.: validar senha atual antes de trocar). Nunca
// repassar o retorno desta função direto numa resposta HTTP.
async function buscarPorIdComSenha(id) {
    const result = await db.query(
        'SELECT id, nome_completo, email, telefone, perfil, ativo, senha_hash FROM usuario WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

async function listarUsuarios() {
    // senha_hash excluída por segurança
    const result = await db.query(
        'SELECT id, nome_completo, email, telefone, perfil, ativo FROM usuario'
    );
    return result.rows;
}

async function atualizarUsuario(id, dados) {
    const result = await db.query(
        `UPDATE usuario SET nome_completo = $1, telefone = $2, perfil = $3, ativo = $4
        WHERE id = $5
        RETURNING id, nome_completo, email, telefone, perfil, ativo`,
        [dados.nome_completo, dados.telefone, dados.perfil, dados.ativo, id]
    );
    return result.rows[0] || null;
}

async function atualizarEmail(id, novoEmail) {
    const result = await db.query(
        'UPDATE usuario SET email = $1 WHERE id = $2 RETURNING id, nome_completo, email',
        [novoEmail, id]
    );
    return result.rows[0] || null;
}

async function atualizarSenha(id, novaSenhaHash) {
    const result = await db.query(
        'UPDATE usuario SET senha_hash = $1 WHERE id = $2 RETURNING id',
        [novaSenhaHash, id]
    );
    return result.rows[0] || null;
}

async function salvarRefreshToken(token, idUsuario) {
    return await db.query(
        'UPDATE usuario SET refresh_token = $1 WHERE id = $2',
        [token, idUsuario]
    );
}

async function buscarRefreshToken(token) {
    const result = await db.query(
        'SELECT * FROM usuario WHERE refresh_token = $1',
        [token]
    );
    return result.rows[0] || null;
}

// Corrigido: recebia token mas fazia WHERE por id — agora revoga pelo token
async function revogarRefreshToken(token) {
    return await db.query(
        'UPDATE usuario SET refresh_token = NULL WHERE refresh_token = $1',
        [token]
    );
}

async function deletarUsuario(id) {
    const result = await db.query(
        'DELETE FROM usuario WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0] || null;
}

module.exports = {
    criarUsuario,
    buscarPorEmail,
    buscarPorId,
    buscarPorIdComSenha,
    listarUsuarios,
    atualizarUsuario,
    atualizarEmail,
    atualizarSenha,
    salvarRefreshToken,
    buscarRefreshToken,
    revogarRefreshToken,
    deletarUsuario,
};
