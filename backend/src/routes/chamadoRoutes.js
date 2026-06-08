const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const chamadoController = require('../controllers/chamadoController');

router.post('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(chamadoController.criarChamado));
router.get('/', autenticar, asyncHandler(chamadoController.listarChamados));
router.get('/:id', autenticar, asyncHandler(chamadoController.buscarChamado));
router.patch('/:id/status', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(chamadoController.atualizarStatus));
router.patch('/:id/tecnico', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(chamadoController.atribuirTecnico));
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(chamadoController.deletarChamado));

module.exports = router;
