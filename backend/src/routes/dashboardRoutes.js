const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Acessível a qualquer usuário autenticado (item 3 do enunciado: dashboard
// após login, sem restrição de perfil específica nos requisitos).
router.get('/', autenticar, asyncHandler(dashboardController.obterResumo));

module.exports = router;
