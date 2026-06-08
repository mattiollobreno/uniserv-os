const equipamentoModel = require('../models/equipamentoModel');

const STATUS_VALIDOS = ['ativo', 'em_manutencao', 'desinstalado'];

async function criarEquipamento(req, res) {
    const { numero_patrimonio, modelo, marca, localizacao, status, cliente_id } = req.body;

    if (!numero_patrimonio || !modelo || !marca || !cliente_id) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes: numero_patrimonio, modelo, marca, cliente_id' });
    }

    if (status && !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido', validos: STATUS_VALIDOS });
    }

    if (await equipamentoModel.buscarPorPatrimonio(numero_patrimonio)) {
        return res.status(409).json({ erro: 'Número de patrimônio já cadastrado' });
    }

    const equipamento = await equipamentoModel.criarEquipamento({ numero_patrimonio, modelo, marca, localizacao, status, cliente_id });
    res.status(201).json(equipamento.rows[0]);
}

async function listarEquipamentos(req, res) {
    const equipamentos = await equipamentoModel.listarEquipamentos();
    res.status(200).json(equipamentos);
}

async function buscarEquipamento(req, res) {
    const { id } = req.params;
    const equipamento = await equipamentoModel.buscarPorId(id);
    if (!equipamento) {
        return res.status(404).json({ erro: 'Equipamento não encontrado' });
    }
    res.status(200).json(equipamento);
}

async function atualizarEquipamento(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (status && !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido', validos: STATUS_VALIDOS });
    }

    const equipamento = await equipamentoModel.atualizarEquipamento(id, req.body);
    if (!equipamento) {
        return res.status(404).json({ erro: 'Equipamento não encontrado' });
    }
    res.status(200).json(equipamento);
}

async function deletarEquipamento(req, res) {
    const { id } = req.params;
    const equipamento = await equipamentoModel.deletarEquipamento(id);
    if (!equipamento) {
        return res.status(404).json({ erro: 'Equipamento não encontrado' });
    }
    res.status(204).send();
}

module.exports = { criarEquipamento, listarEquipamentos, buscarEquipamento, atualizarEquipamento, deletarEquipamento };
