const chamadoModel = require('../models/chamadoModel');

const STATUS_VALIDOS = ['aberto', 'em_andamento', 'finalizado', 'cancelado'];
const TIPOS_VALIDOS = ['instalacao', 'manutencao', 'desinstalacao'];

async function criarChamado(req, res) {
    const { descricao, tipo, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id } = req.body;

    if (!descricao || !tipo || !cliente_id) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes: descricao, tipo, cliente_id' });
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo inválido', validos: TIPOS_VALIDOS });
    }

    const chamado = await chamadoModel.criarChamado({
        descricao, tipo, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id
    });
    res.status(201).json(chamado.rows[0]);
}

async function listarChamados(req, res) {
    const chamados = await chamadoModel.listarChamados();
    res.status(200).json(chamados);
}

async function buscarChamado(req, res) {
    const { id } = req.params;
    const chamado = await chamadoModel.buscarPorId(id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    res.status(200).json(chamado);
}

async function atualizarStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido', validos: STATUS_VALIDOS });
    }

    const chamado = await chamadoModel.atualizarStatus(id, status);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    res.status(200).json(chamado);
}

async function atribuirTecnico(req, res) {
    const { id } = req.params;
    const { tecnico_id } = req.body;

    if (!tecnico_id) {
        return res.status(400).json({ erro: 'tecnico_id é obrigatório' });
    }

    const chamado = await chamadoModel.atribuirTecnico(id, tecnico_id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    res.status(200).json(chamado);
}

async function deletarChamado(req, res) {
    const { id } = req.params;
    const chamado = await chamadoModel.deletarChamado(id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    res.status(204).send();
}

module.exports = { criarChamado, listarChamados, buscarChamado, atualizarStatus, atribuirTecnico, deletarChamado };