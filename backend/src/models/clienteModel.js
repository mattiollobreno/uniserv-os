const db = require('../database');

async function criarCliente(dados) {
    return await db.query(
        `INSERT INTO cliente (razao_social, cpf_cnpj, telefone, email, endereco, contato_nome, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [dados.razao_social, dados.cpf_cnpj, dados.telefone, dados.email, dados.endereco, dados.contato_nome, dados.usuario_id]
    );
}

async function buscarPorCpfCnpj(cpf_cnpj) {
    const result = await db.query('SELECT * FROM cliente WHERE cpf_cnpj = $1', [cpf_cnpj]);
    return result.rows[0] || null;
}

// Corrigido: busca pelo id da tabela cliente, não pelo usuario_id
async function buscarPorId(id) {
    const result = await db.query('SELECT * FROM cliente WHERE id = $1', [id]);
    return result.rows[0] || null;
}

// Usado para resolver "qual cliente é esse usuário logado" quando o perfil
// é 'cliente' (abertura/listagem de chamados e equipamentos restrita ao
// próprio cliente).
async function buscarPorUsuarioId(usuario_id) {
    const result = await db.query(
        'SELECT * FROM cliente WHERE usuario_id = $1',
        [usuario_id]
    );
    return result.rows[0] || null;
}

// RF01: vincula um usuário do tipo "cliente" a um cliente já cadastrado.
async function vincularUsuario(clienteId, usuarioId) {
    const result = await db.query(
        'UPDATE cliente SET usuario_id = $1 WHERE id = $2 RETURNING *',
        [usuarioId, clienteId]
    );
    return result.rows[0] || null;
}

async function listarClientes() {
    const result = await db.query('SELECT * FROM cliente');
    return result.rows;
}

async function atualizarCliente(id, dados) {
    return await db.query(
        `UPDATE cliente SET razao_social = $1, cpf_cnpj = $2, telefone = $3, email = $4, endereco = $5, contato_nome = $6
        WHERE id = $7
        RETURNING *`,
        [dados.razao_social, dados.cpf_cnpj, dados.telefone, dados.email, dados.endereco, dados.contato_nome, id]
    );
}

module.exports = {
    criarCliente,
    buscarPorCpfCnpj,
    buscarPorId,
    buscarPorUsuarioId,
    vincularUsuario,
    listarClientes,
    atualizarCliente,
    deletarCliente,
};

async function deletarCliente(id) {
    const result = await db.query(
        'DELETE FROM cliente WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0] || null;
}
