// Popula o banco com dados mínimos para conseguir logar e testar o sistema
// logo após rodar o schema.sql. Idempotente: pode ser rodado várias vezes
// sem duplicar registros (usa ON CONFLICT / verificação prévia).
//
// Uso: npm run seed   (a partir da pasta backend/)

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./index');

const SALT_ROUNDS = 12;

const USUARIOS_SEED = [
    { nome_completo: 'Administrador Uniserv', email: 'admin@uniserv.com', telefone: '49999990001', senha: 'admin123', perfil: 'administrador' },
    { nome_completo: 'Erni Braz', email: 'supervisor@uniserv.com', telefone: '49999990002', senha: 'admin123', perfil: 'supervisor' },
    { nome_completo: 'Jonas de Moraes', email: 'tecnico@uniserv.com', telefone: '49999990003', senha: 'admin123', perfil: 'tecnico' },
];

async function seedUsuarios() {
    const idsPorEmail = {};
    // tecnico_id em `chamado` aponta para tecnico.id, não usuario.id — por
    // isso guardamos os dois separadamente.
    const idsTecnicoPorEmail = {};

    for (const usuario of USUARIOS_SEED) {
        const existente = await db.query('SELECT id FROM usuario WHERE email = $1', [usuario.email]);
        let usuarioId;

        if (existente.rows[0]) {
            usuarioId = existente.rows[0].id;
        } else {
            const senha_hash = await bcrypt.hash(usuario.senha, SALT_ROUNDS);
            const resultado = await db.query(
                `INSERT INTO usuario (nome_completo, email, telefone, senha_hash, perfil, ativo)
                 VALUES ($1, $2, $3, $4, $5, true)
                 RETURNING id`,
                [usuario.nome_completo, usuario.email, usuario.telefone, senha_hash, usuario.perfil]
            );
            usuarioId = resultado.rows[0].id;
            console.log(`Usuário criado: ${usuario.email} (senha: ${usuario.senha})`);
        }

        idsPorEmail[usuario.email] = usuarioId;

        if (usuario.perfil === 'tecnico') {
            const tecnicoExistente = await db.query('SELECT id FROM tecnico WHERE usuario_id = $1', [usuarioId]);
            if (tecnicoExistente.rows[0]) {
                idsTecnicoPorEmail[usuario.email] = tecnicoExistente.rows[0].id;
            } else {
                const tecnicoResultado = await db.query(
                    `INSERT INTO tecnico (usuario_id, ativo) VALUES ($1, true) RETURNING id`,
                    [usuarioId]
                );
                idsTecnicoPorEmail[usuario.email] = tecnicoResultado.rows[0].id;
                console.log(`Registro de técnico criado para: ${usuario.email}`);
            }
        }
    }

    return { idsPorEmail, idsTecnicoPorEmail };
}

async function seedCliente() {
    const existente = await db.query('SELECT id FROM cliente WHERE cpf_cnpj = $1', ['00000000000191']);
    if (existente.rows[0]) return existente.rows[0].id;

    const resultado = await db.query(
        `INSERT INTO cliente (razao_social, cpf_cnpj, telefone, email, endereco, contato_nome)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        ['Tormann Transportes LTDA', '00000000000191', '49327270217', 'contato@tormann.com.br', 'Rua Regen Diogo Feijó, 72E, Chapecó - SC', 'Julio Tortelli']
    );
    console.log('Cliente de exemplo criado: Tormann Transportes LTDA');
    return resultado.rows[0].id;
}

async function seedEquipamento(clienteId) {
    const existente = await db.query('SELECT id FROM equipamento WHERE pat = $1', ['30510']);
    if (existente.rows[0]) return existente.rows[0].id;

    const resultado = await db.query(
        `INSERT INTO equipamento (pat, modelo, marca, localizacao, status, cliente_id)
         VALUES ($1, $2, $3, $4, 'ativo', $5)
         RETURNING id`,
        ['30510', 'M4070', 'Samsung', 'Recepção', clienteId]
    );
    console.log('Equipamento de exemplo criado: PAT 30510 (Samsung M4070)');
    return resultado.rows[0].id;
}

// Cria um login para o cliente de exemplo (Tormann), já vinculado
// (cliente.usuario_id), pra testar o fluxo de abertura/avaliação de
// chamado pelo próprio cliente.
async function seedClienteUsuario(clienteId) {
    const email = 'cliente@uniserv.com';
    const senha = 'admin123';

    const clienteAtual = await db.query('SELECT usuario_id FROM cliente WHERE id = $1', [clienteId]);
    if (clienteAtual.rows[0]?.usuario_id) return;

    const existente = await db.query('SELECT id FROM usuario WHERE email = $1', [email]);
    let usuarioId;

    if (existente.rows[0]) {
        usuarioId = existente.rows[0].id;
    } else {
        const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
        const resultado = await db.query(
            `INSERT INTO usuario (nome_completo, email, telefone, senha_hash, perfil, ativo)
             VALUES ($1, $2, $3, $4, 'cliente', true)
             RETURNING id`,
            ['Julio Tortelli', email, '49999990004', senha_hash]
        );
        usuarioId = resultado.rows[0].id;
        console.log(`Usuário criado: ${email} (senha: ${senha})`);
    }

    await db.query('UPDATE cliente SET usuario_id = $1 WHERE id = $2', [usuarioId, clienteId]);
    console.log('Login de cliente vinculado a: Tormann Transportes LTDA');
}

async function seedChamado(clienteId, equipamentoId, tecnicoId, supervisorId) {
    const existente = await db.query('SELECT id FROM chamado WHERE cliente_id = $1 LIMIT 1', [clienteId]);
    if (existente.rows[0]) return;

    await db.query(
        `INSERT INTO chamado (descricao, tipo, status, prioridade, origem, cliente_id, equipamento_id, tecnico_id, supervisor_id)
         VALUES ($1, 'manutencao', 'aberto', 'media', 'cliente', $2, $3, $4, $5)`,
        ['Impressora falhando ao imprimir em preto.', clienteId, equipamentoId, tecnicoId, supervisorId]
    );
    console.log('Chamado de exemplo criado.');
}

async function seed() {
    try {
        const { idsPorEmail, idsTecnicoPorEmail } = await seedUsuarios();
        const clienteId = await seedCliente();
        const equipamentoId = await seedEquipamento(clienteId);
        await seedClienteUsuario(clienteId);
        await seedChamado(
            clienteId,
            equipamentoId,
            idsTecnicoPorEmail['tecnico@uniserv.com'],
            idsPorEmail['supervisor@uniserv.com']
        );

        console.log('\nSeed concluído. Login de teste:');
        console.log('  admin@uniserv.com / admin123 (administrador)');
        console.log('  supervisor@uniserv.com / admin123 (supervisor)');
        console.log('  tecnico@uniserv.com / admin123 (tecnico)');
        console.log('  cliente@uniserv.com / admin123 (cliente, vinculado à Tormann Transportes)');
    } catch (err) {
        console.error('Erro ao rodar o seed:', err);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

seed();
