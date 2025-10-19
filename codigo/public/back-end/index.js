// Projeto Sabiaa - Backend API
// Sistema Educacional para Educação Básica Pública Brasileira

require('dotenv').config();
const express = require('express');
const jsonServer = require('json-server');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rotas da API customizada
const apiRoutes = require('./src/routes');
app.use('/api', apiRoutes);

// JSON Server para recursos adicionais (se necessário)
const router = jsonServer.router('./db/db.json');
const middlewares = jsonServer.defaults();
app.use(middlewares);

// Usar JSON Server apenas para rotas não definidas na API customizada
app.use('/db', router);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    message: 'O endpoint solicitado não existe'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   🎓 API SABIAA - BACKEND INICIADO  ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log(`🚀 Servidor rodando na porta: ${PORT}`);
  console.log(`📚 Documentação: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});