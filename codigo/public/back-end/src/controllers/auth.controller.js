// src/controllers/auth.controller.js
const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

/**
 * Controller de autenticação
 */
class AuthController {
  /**
   * Cadastro de novo usuário
   */
  async cadastro(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const resultado = await authService.cadastrarUsuario(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso',
        data: resultado
      });

    } catch (error) {
      console.error('Erro no cadastro:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Login de usuário
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { email, senha } = req.body;
      const resultado = await authService.login(email, senha);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: resultado
      });

    } catch (error) {
      console.error('Erro no login:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Solicitar recuperação de senha
   */
  async recuperarSenha(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { email } = req.body;
      const resultado = await authService.solicitarRecuperacaoSenha(email);

      res.json({
        success: true,
        ...resultado
      });

    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao processar solicitação';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Alterar senha com código de recuperação
   */
  async alterarSenha(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { token, codigo, nova_senha } = req.body;
      const resultado = await authService.alterarSenhaComCodigo(token, codigo, nova_senha);

      res.json({
        success: true,
        ...resultado
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao alterar senha';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Verificar se token é válido
   */
  async verificarToken(req, res) {
    res.json({
      success: true,
      message: 'Token válido',
      user: {
        id: req.user.id,
        email: req.user.email,
        tipo: req.user.tipo
      }
    });
  }
}

module.exports = new AuthController();
