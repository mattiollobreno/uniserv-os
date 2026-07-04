const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const clienteController = require('../controllers/clienteController');

router.post('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.cadastrarCliente));
// Técnico também precisa listar clientes para vincular o cliente ao
// cadastrar um equipamento (RF04).
router.get('/', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(clienteController.listarClientes));
router.get('/:id', autenticar, asyncHandler(clienteController.buscarCliente));
router.put('/:id', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.atualizarCliente));
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(clienteController.deletarCliente));

module.exports = router;