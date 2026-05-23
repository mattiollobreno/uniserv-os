const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const AuthRouthes = require('../controllers/authController');

router.post('/cadastrar', asyncHandler(AuthRouthes.cadastrarUsuario));
router.post('/login', asyncHandler(AuthRouthes.login));
router.post('/refresh', asyncHandler(AuthRouthes.refresh));

module.exports = router;