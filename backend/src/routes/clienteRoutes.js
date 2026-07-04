const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const clienteController = require('../controllers/clienteController');

router.post('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.cadastrarCliente));
// Leitura também liberada para técnico: ele precisa vincular um cliente ao
// cadastrar/editar um equipamento (ver frontend/src/pages/Equipamentos.jsx).
router.get('/', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(clienteController.listarClientes));
router.get('/:id', autenticar, asyncHandler(clienteController.buscarCliente));
router.put('/:id', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.atualizarCliente));
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(clienteController.deletarCliente));

module.exports = router;