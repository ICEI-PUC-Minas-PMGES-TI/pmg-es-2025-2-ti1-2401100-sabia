// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth');
const {
  cadastroValidator,
  loginValidator,
  recuperarSenhaValidator,
  alterarSenhaValidator
} = require('../validators/auth.validator');

/**
 * @route   POST /api/auth/cadastro
 * @desc    Cadastrar novo usuário
 * @access  Public
 */
router.post('/cadastro', cadastroValidator, authController.cadastro);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', loginValidator, authController.login);

/**
 * @route   POST /api/auth/recuperar-senha
 * @desc    Solicitar recuperação de senha
 * @access  Public
 */
router.post('/recuperar-senha', recuperarSenhaValidator, authController.recuperarSenha);

/**
 * @route   POST /api/auth/alterar-senha
 * @desc    Alterar senha com código de recuperação
 * @access  Public
 */
router.post('/alterar-senha', alterarSenhaValidator, authController.alterarSenha);

/**
 * @route   GET /api/auth/verificar
 * @desc    Verificar se o token é válido
 * @access  Private
 */
router.get('/verificar', authenticateToken, authController.verificarToken);

module.exports = router;
