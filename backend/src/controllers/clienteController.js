const clienteModel = require('../models/clienteModel')
/// CRUD
async function cadastrarCliente(req, res) {
    const { razao_social, cpf_cnpj, telefone, email, endereco, contato_nome} = req.body;
    const usuario_id = req.usuario.id;
    if (!razao_social || !email || !telefone || !endereco || !contato_nome || !usuario_id){
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }
    if (await clienteModel.buscarPorCpfCnpj(cpf_cnpj)){
            return res.status(409).json({ erro: 'E-mail já cadastrado' });
    }
    const cliente = await clienteModel.criarCliente({ 
            razao_social,
            cpf_cnpj,
            telefone,
            email,
            endereco,
            contato_nome,
            usuario_id
        });
        res.status(201).json({ id: cliente.rows[0].id, razao_social: cliente.rows[0].razao_social, email: cliente.rows[0].email });
}

async function listarClientes(req, res) {
    const clientes = await clienteModel.listarClientes();
    res.status(200).json(clientes);
}

async function buscarCliente(req, res) {
    const { id } = req.params;
    const cliente = await clienteModel.buscarPorId(id);
    if (!cliente)
        return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.status(200).json(cliente);
}

async function atualizarCliente(req, res) {
    const { id } = req.params;
    const cliente = await clienteModel.atualizarCliente(id, req.body);
    if (!cliente.rows[0])
        return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.status(200).json(cliente.rows[0]);
}

module.exports = { cadastrarCliente, listarClientes, buscarCliente, atualizarCliente, deletarCliente };
async function deletarCliente(req, res) {
    const { id } = req.params;
    const cliente = await clienteModel.deletarCliente(id);
    if (!cliente)
        return res.status(404).json({ erro: 'Cliente não encontrado' });
    res.status(204).send();
}
