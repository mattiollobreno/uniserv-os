const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const clienteController = require('../controllers/clienteController');

router.post('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.cadastrarCliente));
router.get('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.listarClientes));
router.get('/:id', autenticar, asyncHandler(clienteController.buscarCliente));
router.put('/:id', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(clienteController.atualizarCliente));

module.exports = router;