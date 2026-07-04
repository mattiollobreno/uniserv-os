const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const avaliacaoController = require('../controllers/avaliacaoController');

// RF14 — só o cliente avalia o próprio atendimento.
router.post('/', autenticar, autorizar('cliente'), asyncHandler(avaliacaoController.criarAvaliacao));

module.exports = router;
