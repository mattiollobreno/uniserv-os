const db = require('../database');


async function criarCliente(dados) {
    return await db.query(

        `INSERT INTO cliente (razao_social, cpf_cnpj, telefone, email, endereco, contato_nome, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,

        [dados.razao_social, dados.cpf_cnpj, dados.telefone, dados.email, dados.endereco, dados.contato_nome, dados.usuario_id]

    );
}

async function buscarPorCpfCnpj (cpf_cnpj){
    console.log('buscando informação', cpf_cnpj, typeof cpf_cnpj);
    const result = await db.query('SELECT * FROM cliente WHERE cpf_cnpj = $1', [cpf_cnpj]);

  return result.rows[0] || null;
}

async function buscarPorId(usuario_id) {
    console.log('buscando Id', usuario_id, typeof usuario_id);
    const result = await db.query('SELECT * FROM cliente WHERE usuario_id = $1', [usuario_id]);

  return result.rows[0] || null;
    
}

async function listarClientes () {
    const result =  await db.query('SELECT * from cliente');
    return result.rows || null;
}

async function atualizarCliente(id, dados) {
    return await db.query(
        `UPDATE cliente SET razao_social = $1, cpf_cnpj = $2, telefone = $3, email = $4, endereco = $5, contato_nome = $6
        WHERE id = $7
        RETURNING *`,
        [dados.razao_social, dados.cpf_cnpj, dados.telefone, dados.email, dados.endereco, dados.contato_nome, id]
    );
}

module.exports = {criarCliente, buscarPorCpfCnpj, buscarPorId, listarClientes, atualizarCliente};
