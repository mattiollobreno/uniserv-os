const chamadoModel = require('../models/chamadoModel');
const clienteModel = require('../models/clienteModel');
const tecnicoModel = require('../models/tecnicoModel');
const atendimentoModel = require('../models/atendimentoModel');

const STATUS_VALIDOS = ['aberto', 'em_andamento', 'finalizado', 'cancelado'];
const TIPOS_VALIDOS = ['instalacao', 'manutencao', 'desinstalacao'];

// Resolve o cliente vinculado ao usuário logado quando o perfil é
// 'cliente'. Nunca confiamos em cliente_id vindo do corpo da requisição
// para esse perfil — sempre resolvido a partir do próprio token.
async function resolverClienteDoUsuario(req, res) {
    const cliente = await clienteModel.buscarPorUsuarioId(req.usuario.id);
    if (!cliente) {
        res.status(409).json({ erro: 'Seu usuário ainda não está vinculado a um cliente' });
        return null;
    }
    return cliente;
}

async function criarChamado(req, res) {
    const { descricao, tipo, prioridade, equipamento_id } = req.body;

    if (!descricao || !tipo) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes: descricao, tipo' });
    }

    if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo inválido', validos: TIPOS_VALIDOS });
    }

    let cliente_id;
    let origem;
    let tecnico_id = null;
    let supervisor_id = null;

    if (req.usuario.role === 'cliente') {
        // RF05 — abertura de chamado pelo próprio cliente.
        const cliente = await resolverClienteDoUsuario(req, res);
        if (!cliente) return;
        cliente_id = cliente.id;
        origem = 'cliente';
    } else {
        // RF06 — abertura interna pelo supervisor/administrador.
        if (!req.body.cliente_id) {
            return res.status(400).json({ erro: 'cliente_id é obrigatório' });
        }
        cliente_id = req.body.cliente_id;
        origem = 'interno';
        tecnico_id = req.body.tecnico_id ?? null;
        supervisor_id = req.usuario.role === 'supervisor' ? req.usuario.id : (req.body.supervisor_id ?? null);
    }

    const chamado = await chamadoModel.criarChamado({
        descricao, tipo, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id
    });
    res.status(201).json(chamado.rows[0]);
}

async function listarChamados(req, res) {
    let clienteId;

    if (req.usuario.role === 'cliente') {
        // RF12 — cliente só acompanha os próprios chamados.
        const cliente = await resolverClienteDoUsuario(req, res);
        if (!cliente) return;
        clienteId = cliente.id;
    }

    const chamados = await chamadoModel.listarChamados(clienteId);
    res.status(200).json(chamados);
}

async function buscarChamado(req, res) {
    const { id } = req.params;
    const chamado = await chamadoModel.buscarPorId(id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    if (req.usuario.role === 'cliente') {
        const cliente = await resolverClienteDoUsuario(req, res);
        if (!cliente) return;
        if (chamado.cliente_id !== cliente.id) {
            return res.status(403).json({ erro: 'Este chamado não pertence ao seu cadastro' });
        }
    }

    const historico = await chamadoModel.listarHistoricoStatus(id);
    res.status(200).json({ ...chamado, historico });
}

async function atualizarStatus(req, res) {
    const { id } = req.params;
    const { status, observacao } = req.body;

    if (!status || !STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ erro: 'Status inválido', validos: STATUS_VALIDOS });
    }

    const chamado = await chamadoModel.atualizarStatus(id, status, req.usuario.id, observacao);
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

// RF10 — o técnico preenche o registro de atendimento (ações realizadas,
// horário de início/fim) antes de finalizar o chamado. Um chamado só pode
// ser avaliado pelo cliente depois de finalizado (ver avaliacaoController).
async function salvarAtendimento(req, res) {
    const { id } = req.params;
    const { data_inicio, data_fim, descricao_acoes, observacoes } = req.body;

    const chamado = await chamadoModel.buscarPorId(id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }

    // atendimento.tecnico_id referencia tecnico.id (não usuario.id) — por
    // isso resolvemos o id correto conforme quem está preenchendo.
    let tecnico_id;
    if (req.usuario.role === 'tecnico') {
        const tecnico = await tecnicoModel.buscarPorUsuarioId(req.usuario.id);
        if (!tecnico) {
            return res.status(409).json({ erro: 'Seu usuário ainda não está vinculado a um técnico' });
        }
        tecnico_id = tecnico.id;
    } else {
        // administrador/supervisor preenchendo em nome do técnico já
        // atribuído ao chamado.
        if (!chamado.tecnico_id) {
            return res.status(409).json({ erro: 'Chamado ainda não tem técnico atribuído' });
        }
        tecnico_id = chamado.tecnico_id;
    }

    const atendimento = await atendimentoModel.salvarAtendimento({
        chamado_id: id,
        tecnico_id,
        data_inicio,
        data_fim,
        descricao_acoes,
        observacoes,
    });
    res.status(200).json(atendimento);
}

async function deletarChamado(req, res) {
    const { id } = req.params;
    const chamado = await chamadoModel.deletarChamado(id);
    if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado' });
    }
    res.status(204).send();
}

module.exports = {
    criarChamado,
    listarChamados,
    buscarChamado,
    atualizarStatus,
    atribuirTecnico,
    salvarAtendimento,
    deletarChamado,
};