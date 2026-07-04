const db = require('../database');

async function criarChamado(dados) {
    return await db.query(
        `INSERT INTO chamado (descricao, tipo, status, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
            dados.descricao,
            dados.tipo,
            dados.status ?? 'aberto',
            dados.prioridade ?? 'media',
            dados.origem ?? 'interno',
            dados.cliente_id,
            dados.equipamento_id ?? null,
            dados.tecnico_id ?? null,
            dados.supervisor_id ?? null,
        ]
    );
}

// tecnico_id referencia tecnico.id (não usuario.id diretamente) — por isso
// o nome do técnico exige passar por `tecnico` antes de chegar em `usuario`.
// clienteId opcional: usado para o perfil "cliente" ver só os próprios
// chamados (o filtro é aplicado no controller, nunca confiando em dado
// vindo do próprio cliente).
async function listarChamados(clienteId) {
    const condicaoCliente = clienteId ? 'WHERE c.cliente_id = $1' : '';
    const result = await db.query(
        `SELECT c.*,
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.pat AS equipamento_pat,
            e.modelo AS equipamento_modelo,
            a.id AS avaliacao_id,
            a.nota AS avaliacao_nota
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN tecnico t ON t.id = c.tecnico_id
        LEFT JOIN usuario u ON u.id = t.usuario_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        LEFT JOIN avaliacao a ON a.chamado_id = c.id
        ${condicaoCliente}
        ORDER BY c.data_abertura DESC`,
        clienteId ? [clienteId] : []
    );
    return result.rows;
}

async function buscarPorId(id) {
    const result = await db.query(
        `SELECT c.*,
            cl.razao_social AS cliente_nome,
            u.nome_completo AS tecnico_nome,
            e.pat AS equipamento_pat,
            e.modelo AS equipamento_modelo,
            at.data_inicio AS atendimento_data_inicio,
            at.data_fim AS atendimento_data_fim,
            at.descricao_acoes AS atendimento_descricao_acoes,
            at.observacoes AS atendimento_observacoes,
            av.id AS avaliacao_id,
            av.nota AS avaliacao_nota,
            av.comentario AS avaliacao_comentario
        FROM chamado c
        LEFT JOIN cliente cl ON cl.id = c.cliente_id
        LEFT JOIN tecnico t ON t.id = c.tecnico_id
        LEFT JOIN usuario u ON u.id = t.usuario_id
        LEFT JOIN equipamento e ON e.id = c.equipamento_id
        LEFT JOIN atendimento at ON at.chamado_id = c.id
        LEFT JOIN avaliacao av ON av.chamado_id = c.id
        WHERE c.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

// Atualiza o status do chamado e registra a alteração em historico_status
// (RF09) na mesma transação, para nunca ficar um sem o outro.
async function atualizarStatus(id, status, alteradoPor, observacao) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE chamado SET status = $1
            WHERE id = $2
            RETURNING *`,
            [status, id]
        );
        const chamado = result.rows[0] || null;

        if (chamado) {
            await client.query(
                `INSERT INTO historico_status (chamado_id, status, alterado_por, observacao)
                VALUES ($1, $2, $3, $4)`,
                [id, status, alteradoPor ?? null, observacao ?? null]
            );
        }

        await client.query('COMMIT');
        return chamado;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function listarHistoricoStatus(chamado_id) {
    const result = await db.query(
        `SELECT hs.*, u.nome_completo AS alterado_por_nome
        FROM historico_status hs
        LEFT JOIN usuario u ON u.id = hs.alterado_por
        WHERE hs.chamado_id = $1
        ORDER BY hs.data_alteracao ASC`,
        [chamado_id]
    );
    return result.rows;
}

async function atribuirTecnico(id, tecnico_id) {
    const result = await db.query(
        `UPDATE chamado SET tecnico_id = $1
        WHERE id = $2
        RETURNING *`,
        [tecnico_id, id]
    );
    return result.rows[0] || null;
}

async function deletarChamado(id) {
    const result = await db.query(
        'DELETE FROM chamado WHERE id = $1 RETURNING id',
        [id]
    );
    return result.rows[0] || null;
}

module.exports = { criarChamado, listarChamados, buscarPorId, atualizarStatus, listarHistoricoStatus, atribuirTecnico, deletarChamado };