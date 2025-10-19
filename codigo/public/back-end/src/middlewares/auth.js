// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Middleware para autenticar token JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'É necessário estar autenticado para acessar este recurso' 
    });
  }

  jwt.verify(token, jwtConfig.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Token inválido ou expirado',
        message: 'Faça login novamente' 
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar se o usuário é administrador
 */
const isAdmin = (req, res, next) => {
  if (req.user.tipo !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar este recurso' 
    });
  }
  next();
};

/**
 * Middleware para verificar se o usuário é professor
 */
const isProfessor = (req, res, next) => {
  if (req.user.tipo !== 'professor' && req.user.tipo !== 'administrador') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas professores podem acessar este recurso' 
    });
  }
  next();
};

/**
 * Middleware para verificar permissão de acesso a perfil
 * Usuário pode acessar apenas seu próprio perfil, exceto administradores
 */
const checkProfilePermission = (req, res, next) => {
  const userId = req.params.id || req.user.id;
  
  if (req.user.id !== userId && req.user.tipo !== 'administrador') {
    return res.status(403).json({ 
      error: 'Sem permissão',
      message: 'Você só pode acessar seu próprio perfil' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  isProfessor,
  checkProfilePermission
};
