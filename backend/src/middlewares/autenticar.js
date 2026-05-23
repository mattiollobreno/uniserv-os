const jwt = require('jsonwebtoken');
function autenticar(req, res, next) {
    // 1. Extrair o token do header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7) // remove o prefixo 'Bearer '
    : null;
    if (!token)
    return res.status(401).json({ erro: 'Token de autenticação ausente' });
    // 2. Verificar assinatura e expiração
    try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, role, iat, exp }
    next();
    } catch (err) {
    if (err.name === 'TokenExpiredError')
    return res.status(401).json({ erro: 'Token expirado', expirado: true });
    return res.status(401).json({ erro: 'Token inválido' });
    }
}
module.exports = autenticar