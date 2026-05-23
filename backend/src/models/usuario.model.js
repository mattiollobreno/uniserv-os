const db = require('../database');


async function criarUsuario(dados) {
    return await db.query(
        `INSERT INTO usuario (nome_completo, email, telefone, senha_hash, perfil, ativo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,

        [dados.nome_completo, dados.email, dados.telefone, dados.senha_hash, dados.perfil, dados.ativo]
    );
}

module.exports = criarUsuario;