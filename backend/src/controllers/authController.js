const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const usuarioModel = require('../models/usuarioModel');
const SALT_ROUNDS = 12;


// gerrar o accessToken
function gerarAccessToken(usuario) {
    return jwt.sign(
    { id: usuario.id, role: usuario.perfil},
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
    );
}




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

// Login
async function login(req, res) {
    const { email, senha } = req.body;
    // buscar pelo email e vrificar: 
    if (!email || !senha){
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }
    const usuario = await usuarioModel.buscarPorEmail(email);
    // Verica a existencia da senha
    const hashFicticio = '$2b$12$invalidhashinvalidhashinvalidhashinvalidhashinvali';
    const senhaValida = await bcrypt.compare(senha, usuario?.senha_hash?? hashFicticio);
    if (!usuario || !senhaValida){
    return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    //// Emite o acces Token
    const token = gerarAccessToken(usuario);

    const refreshToken = jwt.sign(
        { id: usuario.id, role: usuario.perfil },
            process.env.REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' });
            await usuarioModel.salvarRefreshToken(refreshToken, usuario.id);
            /// enviar refresh token
            res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/auth/refresh',
            });
            
res.status(200).json({ accessToken: token });
}


async function refresh(req, res) {
    const refreshTokenAntigo = req.cookies.refreshToken;
    if (!refreshTokenAntigo)
    return res.status(401).json({ erro: 'Refresh token ausente' });
    // 1. Verificar assinatura e expiração do token
    let payload;
    try {
    payload = jwt.verify(refreshTokenAntigo, process.env.REFRESH_SECRET);
    } catch {
    return res.status(401).json({ erro: 'Refresh token inválido ou expirado' });
    }
    const tokenNoBanco = await usuarioModel.buscarRefreshToken(refreshTokenAntigo);

    if (!tokenNoBanco) {
    // Token reutilizado possível roubo: revogar TODOS os tokens do usuário
    await await usuarioModel.revogarRefreshToken(refreshTokenAntigo);
    return res.status(403).json({ erro: 'Token reutilizado sessão encerrada' });
    }

    await usuarioModel.revogarRefreshToken(refreshTokenAntigo);
    // 4. Buscar o usuário para incluir dados atualizados no novo token
    const usuario = await usuarioModel.buscarPorId(payload.id);
    if (!usuario)
    return res.status(401).json({ erro: 'Usuário não encontrado' });
    // 5. Emitir novo par de tokens
    const novoAccessToken = gerarAccessToken(usuario);
    const novoRefreshToken = gerarRefreshToken(usuario);
    await usuarioModel.salvarRefreshToken(novoRefreshToken, usuario.id);
    res.cookie('refreshToken', novoRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh',
    });
res.status(200).json({ accessToken: novoAccessToken });
}
/// gerar o refresh token
function gerarRefreshToken(usuario) {
    return jwt.sign(
    { id: usuario.id },
    process.env.REFRESH_SECRET, // segredo DIFERENTE do access token
    { expiresIn: '7d' }
    );
}
async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
    // Revogar no banco para impedir reutilização

    await usuarioModel.revogarRefreshToken(refreshToken);

    }
    // Limpar o cookie do cliente
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    res.status(204).send();
}




module.exports = {cadastrarUsuario, login, refresh, logout};