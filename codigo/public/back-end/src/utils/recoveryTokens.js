// src/utils/recoveryTokens.js
/**
 * Armazenamento em memória para tokens de recuperação
 * Em produção, usar Redis ou banco de dados
 */
class RecoveryTokensStore {
  constructor() {
    this.tokens = new Map();
    this.limparExpiradosInterval();
  }

  /**
   * Adiciona token de recuperação
   * @param {string} token - Token único
   * @param {Object} data - Dados do token (email, codigo, expira)
   */
  set(token, data) {
    this.tokens.set(token, data);
  }

  /**
   * Obtém dados do token
   * @param {string} token - Token único
   * @returns {Object|undefined} Dados do token
   */
  get(token) {
    return this.tokens.get(token);
  }

  /**
   * Remove token
   * @param {string} token - Token único
   */
  delete(token) {
    this.tokens.delete(token);
  }

  /**
   * Verifica se token existe
   * @param {string} token - Token único
   * @returns {boolean}
   */
  has(token) {
    return this.tokens.has(token);
  }

  /**
   * Limpa tokens expirados periodicamente
   */
  limparExpiradosInterval() {
    setInterval(() => {
      const agora = Date.now();
      for (const [token, data] of this.tokens.entries()) {
        if (agora > data.expira) {
          this.tokens.delete(token);
        }
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Retorna quantidade de tokens armazenados
   * @returns {number}
   */
  size() {
    return this.tokens.size;
  }
}

module.exports = new RecoveryTokensStore();
