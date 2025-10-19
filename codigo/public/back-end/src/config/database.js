// src/config/database.js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../db/db.json');

/**
 * Lê o banco de dados JSON
 * @returns {Object} Dados do banco
 */
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    
    // Garantir estrutura correta
    return {
      usuarios: parsed.usuarios || [],
      recovery_tokens: parsed.recovery_tokens || []
    };
  } catch (error) {
    console.error('Erro ao ler banco de dados:', error);
    return { 
      usuarios: [],
      recovery_tokens: []
    };
  }
};

/**
 * Escreve no banco de dados JSON
 * @param {Object} data - Dados a serem salvos
 */
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao escrever no banco de dados:', error);
    throw new Error('Erro ao salvar dados');
  }
};

module.exports = { readDB, writeDB };
