const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const tecnicoController = require('../controllers/tecnicoController');

// Lista de técnicos ativos, usada para preencher o seletor ao abrir ou
// atribuir um chamado (mesmos perfis que podem atribuir técnico em
// chamadoRoutes.js).
router.get('/', autenticar, autorizar('administrador', 'supervisor'), asyncHandler(tecnicoController.listarTecnicos));

module.exports = router;
