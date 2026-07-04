const usuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');

async function listarUsuarios(req, res) {
    const usuarios = await usuarioModel.listarUsuarios();
    res.status(200).json(usuarios);
}

async function buscarUsuario(req, res) {
    const { id } = req.params;
    const usuario = await usuarioModel.buscarPorId(id);
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.status(200).json(usuario);
}

async function atualizarUsuario(req, res) {
    const { id } = req.params;
    const usuario = await usuarioModel.atualizarUsuario(id, req.body);
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.status(200).json(usuario);
}

async function atualizarEmail(req, res) {
    const { id } = req.params;
    const usuario = await usuarioModel.atualizarEmail(id, req.body.email);
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.status(200).json(usuario);
}

async function atualizarSenha(req, res) {
    // atualiza ja com o Hash do bcrypt
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha)
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });

    const usuario = await usuarioModel.buscarPorIdComSenha(id);
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaValida)
        return res.status(401).json({ erro: 'Senha atual incorreta' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
    await usuarioModel.atualizarSenha(id, novaSenhaHash);

    res.status(200).json({ mensagem: 'Senha atualizada com sucesso' });
}

async function deletarUsuario(req, res) {
    const { id } = req.params;
    const usuario = await usuarioModel.deletarUsuario(id);
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.status(204).send();
}

module.exports = { listarUsuarios, buscarUsuario, atualizarUsuario, atualizarEmail, atualizarSenha, deletarUsuario };
