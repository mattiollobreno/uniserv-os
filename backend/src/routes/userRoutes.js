const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const autenticar = require('../middlewares/authMiddleware');
const autorizar = require('../middlewares/autorizar');
const usuarioController = require('../controllers/usuarioController');


router.get('/', autenticar, autorizar('administrador'), asyncHandler(usuarioController.listarUsuarios));
router.get('/:id', autenticar, asyncHandler(usuarioController.buscarUsuario));
router.put('/:id', autenticar, autorizar('administrador'), asyncHandler(usuarioController.atualizarUsuario));
router.patch('/:id/email', autenticar, asyncHandler(usuarioController.atualizarEmail));
router.patch('/:id/senha', autenticar, asyncHandler(usuarioController.atualizarSenha));
router.delete('/:id', autenticar, autorizar('administrador'), asyncHandler(usuarioController.deletarUsuario));

module.exports = router;