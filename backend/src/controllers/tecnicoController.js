const tecnicoModel = require('../models/tecnicoModel');

async function listarTecnicos(req, res) {
    const tecnicos = await tecnicoModel.listarTecnicos();
    res.status(200).json(tecnicos);
}

module.exports = { listarTecnicos };
