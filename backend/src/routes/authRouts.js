const express = require('express');
const router = express.Router();
const AuthRouthes = require('../controllers/authController');

router.post('/cadastrar', asyncHandler(AuthRouthes.cadastrarUsuario));
router.post('/login', asyncHandler(AuthRouthes.login));

module.exports = router;