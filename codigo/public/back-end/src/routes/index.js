// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

/**
 * Rotas de autenticação
 */
router.use('/auth', authRoutes);

/**
 * Rotas de usuário
 */
router.use('/usuario', userRoutes);

/**
 * Rota de health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Sabiaa funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Rota de documentação básica
 */
router.get('/', (req, res) => {
  res.json({
    message: 'API Sabiaa - Sistema Educacional',
    version: '1.0.0',
    endpoints: {
      auth: {
        cadastro: 'POST /api/auth/cadastro',
        login: 'POST /api/auth/login',
        recuperarSenha: 'POST /api/auth/recuperar-senha',
        alterarSenha: 'POST /api/auth/alterar-senha',
        verificar: 'GET /api/auth/verificar'
      },
      usuario: {
        perfil: 'GET /api/usuario/perfil',
        obterPorId: 'GET /api/usuario/:id',
        atualizar: 'PUT /api/usuario/perfil',
        alterarSenha: 'PUT /api/usuario/alterar-senha',
        desativar: 'DELETE /api/usuario/conta',
        listar: 'GET /api/usuario (admin)',
        favoritos: {
          adicionar: 'POST /api/usuario/favoritos',
          remover: 'DELETE /api/usuario/favoritos/:tipo/:id'
        }
      }
    },
    documentation: 'https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2025-2-ti1-2401100-sabia'
  });
});

module.exports = router;
