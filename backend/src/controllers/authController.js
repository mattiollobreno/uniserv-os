const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const usuarioModel = require('../models/usuarioModel');
const SALT_ROUNDS = 12;


async function cadastrarUsuario(req, res) {
    const { nome_completo, email, telefone, senha, perfil } = req.body;

    if (!nome_completo || !email || !senha)
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });

    if (await usuarioModel.buscarPorEmail(email))
        return res.status(409).json({ erro: 'E-mail já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const usuario = await usuarioModel.criarUsuario({ 
        nome_completo, 
        email, 
        telefone, 
        senha_hash,
        perfil,
        ativo: true 
    });

    res.status(201).json({ id: usuario.rows[0].id, nome: usuario.rows[0].nome_completo, email: usuario.rows[0].email });
}

module.exports = cadastrarUsuario;