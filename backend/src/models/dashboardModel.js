const db = require('../database');

// Contagens agregadas para o dashboard (item 3 do enunciado): total por
// tabela e alguns resumos úteis para gestão (usuários ativos, chamados por
// status). Consultas simples e independentes — não há necessidade de
// transação aqui, é tudo leitura.
async function obterResumo() {
    const [usuarios, clientes, equipamentos, chamados, chamadosPorStatus] = await Promise.all([
        db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE ativo)::int AS ativos FROM usuario`),
        db.query(`SELECT COUNT(*)::int AS total FROM cliente`),
        db.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos FROM equipamento`),
        db.query(`SELECT COUNT(*)::int AS total FROM chamado`),
        db.query(`SELECT status, COUNT(*)::int AS total FROM chamado GROUP BY status`),
    ]);

    return {
        usuarios: {
            total: usuarios.rows[0].total,
            ativos: usuarios.rows[0].ativos,
        },
        clientes: {
            total: clientes.rows[0].total,
        },
        equipamentos: {
            total: equipamentos.rows[0].total,
            ativos: equipamentos.rows[0].ativos,
        },
        chamados: {
            total: chamados.rows[0].total,
            porStatus: chamadosPorStatus.rows.reduce((acc, row) => {
                acc[row.status] = row.total;
                return acc;
            }, {}),
        },
    };
}

module.exports = { obterResumo };
