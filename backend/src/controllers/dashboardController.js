const dashboardModel = require('../models/dashboardModel');

async function obterResumo(req, res) {
    const resumo = await dashboardModel.obterResumo();
    res.status(200).json(resumo);
}

module.exports = { obterResumo };
