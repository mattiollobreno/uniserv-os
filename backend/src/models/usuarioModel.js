const db = require('../database');

// criar usuario usando pg 
async function criarUsuario(dados) {
    return await db.query(
        `INSERT INTO usuario (nome_completo, email, telefone, senha_hash, perfil, ativo)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,

        [dados.nome_completo, dados.email, dados.telefone, dados.senha_hash, dados.perfil, dados.ativo]
    );
}

//buscar por email
async function buscarPorEmail(email){

  console.log('buscando Email', email, typeof email);
    const result = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);

  return result.rows[0] || null;
}

module.exports = { criarUsuario, buscarPorEmail };