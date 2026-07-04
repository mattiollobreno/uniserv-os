const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const chamadoController = require('../controllers/chamadoController');

// Cliente também pode abrir chamado (RF05); administrador/supervisor abrem
// chamados internos (RF06). A diferenciação de campos é feita no controller.
router.post('/', autenticar, autorizar('administrador', 'supervisor', 'cliente'), asyncHandler(chamadoController.criarChamado));
router.get('/', autenticar, asyncHandler(chamadoController.listarChamados));
router.get('/:id', autenticar, asyncHandler(chamadoController.buscarChamado));
router.patch('/:id/status', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(chamadoController.atualizarStatus));
// RF10 — registro de atendimento (ações realizadas, horário início/fim),
// preenchido pelo técnico antes de finalizar o chamado.
router.patch('/:id/atendimento', autenticar, autorizar('administrador', 'supervisor', 'tecnico'), asyncHandler(chamadoController.salvarAtendimento));
router.patch('/:id/tecnico', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(chamadoController.atribuirTecnico));
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(chamadoController.deletarChamado));

module.exports = router;
