// src/controllers/user.controller.js
const { validationResult } = require('express-validator');
const userService = require('../services/user.service');

/**
 * Controller de usuários
 */
class UserController {
  /**
   * Obter perfil do usuário logado
   */
  async obterPerfil(req, res) {
    try {
      const usuario = userService.obterUsuarioPorId(req.user.id);

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao obter perfil';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Obter usuário por ID
   */
  async obterUsuarioPorId(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar permissão
      if (req.user.id !== id && req.user.tipo !== 'administrador') {
        return res.status(403).json({ 
          success: false,
          error: 'Sem permissão para acessar este perfil' 
        });
      }

      const usuario = userService.obterUsuarioPorId(id);

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao obter usuário';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async atualizarPerfil(req, res) {
    try {
      const usuario = userService.atualizarPerfil(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: usuario
      });

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao atualizar perfil';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Alterar senha do usuário logado
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

      const { senha_atual, nova_senha } = req.body;
      const resultado = await userService.alterarSenha(req.user.id, senha_atual, nova_senha);

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
   * Desativar conta
   */
  async desativarConta(req, res) {
    try {
      const resultado = userService.desativarConta(req.user.id);

      res.json({
        success: true,
        ...resultado
      });

    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao desativar conta';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Listar usuários (apenas administradores)
   */
  async listarUsuarios(req, res) {
    try {
      const filtros = {
        tipo: req.query.tipo,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
        busca: req.query.busca
      };

      const resultado = userService.listarUsuarios(filtros);

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao listar usuários';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Adicionar favorito
   */
  async adicionarFavorito(req, res) {
    try {
      const { tipo, id } = req.body;
      
      if (!tipo || !id) {
        return res.status(400).json({ 
          success: false,
          error: 'Tipo e ID são obrigatórios' 
        });
      }

      const resultado = userService.adicionarFavorito(req.user.id, { tipo, id });

      res.json({
        success: true,
        ...resultado
      });

    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao adicionar favorito';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Atualizar foto do usuário
   */
  async atualizarFoto(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          error: 'Dados inválidos', 
          errors: errors.array() 
        });
      }

      const { id } = req.params;
      const { foto } = req.body;

      // Verificar se o usuário está atualizando seu próprio perfil
      if (req.user.id !== id) {
        return res.status(403).json({
          success: false,
          error: 'Não autorizado'
        });
      }

      const resultado = userService.atualizarFoto(id, foto);

      res.json({
        success: true,
        message: 'Foto atualizada com sucesso',
        data: resultado
      });

    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro interno do servidor';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }

  /**
   * Remover favorito
   */
  async removerFavorito(req, res) {
    try {
      const { tipo, id } = req.params;
      const resultado = userService.removerFavorito(req.user.id, tipo, id);

      res.json({
        success: true,
        ...resultado
      });

    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      const status = error.status || 500;
      const message = error.message || 'Erro ao remover favorito';
      res.status(status).json({ 
        success: false,
        error: message 
      });
    }
  }
}

module.exports = new UserController();
