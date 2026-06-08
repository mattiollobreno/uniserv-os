const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const equipamentoController = require('../controllers/equipamentoController');

// Cadastrar equipamento — técnico ou supervisor
router.post('/', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(equipamentoController.criarEquipamento));

// Listar equipamentos — qualquer autenticado
router.get('/', autenticar, asyncHandler(equipamentoController.listarEquipamentos));

// Buscar por ID — qualquer autenticado
router.get('/:id', autenticar, asyncHandler(equipamentoController.buscarEquipamento));

// Atualizar — técnico ou supervisor
router.put('/:id', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(equipamentoController.atualizarEquipamento));

// Deletar — somente administrador
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(equipamentoController.deletarEquipamento));

module.exports = router;
