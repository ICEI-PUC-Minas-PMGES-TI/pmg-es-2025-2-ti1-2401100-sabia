// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');
const { alterarSenhaLogadoValidator } = require('../validators/auth.validator');

/**
 * @route   GET /api/usuario/perfil
 * @desc    Obter perfil do usuário logado
 * @access  Private
 */
router.get('/perfil', authenticateToken, userController.obterPerfil);

/**
 * @route   GET /api/usuario/:id
 * @desc    Obter usuário por ID
 * @access  Private
 */
router.get('/:id', authenticateToken, userController.obterUsuarioPorId);

/**
 * @route   PUT /api/usuario/perfil
 * @desc    Atualizar perfil do usuário
 * @access  Private
 */
router.put('/perfil', authenticateToken, userController.atualizarPerfil);

/**
 * @route   PATCH /api/usuario/:id/foto
 * @desc    Atualizar foto do usuário
 * @access  Private
 */
router.patch('/:id/foto', authenticateToken, userController.atualizarFoto);

/**
 * @route   PUT /api/usuario/alterar-senha
 * @desc    Alterar senha do usuário logado
 * @access  Private
 */
router.put('/alterar-senha', authenticateToken, alterarSenhaLogadoValidator, userController.alterarSenha);

/**
 * @route   DELETE /api/usuario/conta
 * @desc    Desativar conta do usuário
 * @access  Private
 */
router.delete('/conta', authenticateToken, userController.desativarConta);

/**
 * @route   GET /api/usuario
 * @desc    Listar usuários (apenas administradores)
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, isAdmin, userController.listarUsuarios);

/**
 * @route   POST /api/usuario/favoritos
 * @desc    Adicionar item aos favoritos
 * @access  Private
 */
router.post('/favoritos', authenticateToken, userController.adicionarFavorito);

/**
 * @route   DELETE /api/usuario/favoritos/:tipo/:id
 * @desc    Remover item dos favoritos
 * @access  Private
 */
router.delete('/favoritos/:tipo/:id', authenticateToken, userController.removerFavorito);

module.exports = router;
