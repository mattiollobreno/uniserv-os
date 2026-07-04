const avaliacaoModel = require('../models/avaliacaoModel');
const chamadoModel = require('../models/chamadoModel');
const clienteModel = require('../models/clienteModel');

// RF14 — cliente avalia (nota 1-5 + comentário opcional) um chamado já
// finalizado, uma única vez. Só o próprio cliente dono do chamado pode
// avaliar (nunca confiamos em cliente_id vindo do corpo da requisição).
async function criarAvaliacao(req, res) {
    const { chamado_id, nota, comentario } = req.body;

    if (!chamado_id || !nota) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes: chamado_id, nota' });
    }

    const notaNumero = Number(nota);
    if (!Number.isInteger(notaNumero) || notaNumero < 1 || notaNumero > 5) {
        return res.status(400).json({ erro: 'Nota deve ser um número inteiro de 1 a 5' });
    }

    const cliente = await clienteModel.buscarPorUsuarioId(req.usuario.id);
    if (!cliente) {
        return res.status(409).json({ erro: 'Seu usuário ainda não está vinculado a um cliente' });
    }

    const chamado = await chamadoModel.buscarPorId(chamado_id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    if (chamado.cliente_id !== cliente.id) {
        return res.status(403).json({ erro: 'Este chamado não pertence ao seu cadastro' });
    }
    if (chamado.status !== 'finalizado') {
        return res.status(409).json({ erro: 'Só é possível avaliar um chamado finalizado' });
    }

    const existente = await avaliacaoModel.buscarPorChamadoId(chamado_id);
    if (existente) {
        return res.status(409).json({ erro: 'Este chamado já foi avaliado' });
    }

    const avaliacao = await avaliacaoModel.criarAvaliacao({
        chamado_id,
        cliente_id: cliente.id,
        nota: notaNumero,
        comentario,
    });
    res.status(201).json(avaliacao);
}

module.exports = { criarAvaliacao };
