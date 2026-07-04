function autorizar(...papeis) {
    return (req, res, next) => {
        // req.usuario foi preenchido pelo middleware autenticar()
        if (!req.usuario)
            return res.status(401).json({ erro: 'Não autenticado' });

        if (!papeis.includes(req.usuario.role))
            return res.status(403).json({
                erro: 'Permissão insuficiente',
                necessario: papeis,
                atual: req.usuario.role,
            });

        next();
    };
}

module.exports = autorizar;
