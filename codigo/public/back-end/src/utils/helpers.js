// src/utils/helpers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Gera hash de senha
 * @param {string} senha - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
const hashSenha = async (senha) => {
  return await bcrypt.hash(senha, 10);
};

/**
 * Compara senha com hash
 * @param {string} senha - Senha em texto plano
 * @param {string} hash - Hash da senha
 * @returns {Promise<boolean>} Verdadeiro se as senhas correspondem
 */
const compararSenha = async (senha, hash) => {
  return await bcrypt.compare(senha, hash);
};

/**
 * Gera token JWT
 * @param {Object} payload - Dados a serem incluídos no token
 * @returns {string} Token JWT
 */
const gerarToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
};

/**
 * Gera código numérico de 6 dígitos
 * @returns {string} Código de 6 dígitos
 */
const gerarCodigoRecuperacao = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Remove campos sensíveis do objeto usuário
 * @param {Object} usuario - Objeto do usuário
 * @returns {Object} Usuário sem campos sensíveis
 */
const removerCamposSensiveis = (usuario) => {
  const { senha_hash, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
};

/**
 * Cria estrutura inicial do usuário baseada no tipo
 * @param {string} tipo - Tipo do usuário (aluno, professor, administrador)
 * @returns {Object} Estrutura de referências acadêmicas
 */
const criarEstruturaUsuario = (tipo) => {
  switch (tipo) {
    case 'aluno':
      return {
        aluno: {
          escola: "",
          serie: "",
          turma: "",
          numero_matricula: "",
          cursos_ids: [],
          quizzes_ids: [],
          tarefas_ids: []
        }
      };
    
    case 'professor':
      return {
        professor: {
          disciplinas: [],
          turmas_atribuidas: [],
          numero_registro: "",
          formacao: "",
          aulas_ids: [],
          quizzes_criados_ids: []
        }
      };
    
    case 'administrador':
      return {
        administrador: {
          escola: "",
          cargo: "",
          numero_alunos: 0,
          numero_professores: 0,
          relatorios_ids: []
        }
      };
    
    default:
      return {};
  }
};

/**
 * Valida e formata endereço
 * @param {Object} endereco - Objeto de endereço
 * @returns {Object} Endereço formatado
 */
const formatarEndereco = (endereco) => {
  return {
    cep: endereco?.cep || "",
    rua: endereco?.rua || "",
    numero: endereco?.numero || "",
    complemento: endereco?.complemento || "",
    bairro: endereco?.bairro || "",
    cidade: endereco?.cidade || "",
    estado: endereco?.estado || ""
  };
};

/**
 * Valida e formata preferências
 * @param {Object} preferencias - Objeto de preferências
 * @returns {Object} Preferências formatadas
 */
const formatarPreferencias = (preferencias) => {
  return {
    idioma: preferencias?.idioma || "pt-br",
    notificacoes: preferencias?.notificacoes !== false,
    acessibilidade: preferencias?.acessibilidade || false,
    tema: preferencias?.tema || "claro"
  };
};

module.exports = {
  hashSenha,
  compararSenha,
  gerarToken,
  gerarCodigoRecuperacao,
  removerCamposSensiveis,
  criarEstruturaUsuario,
  formatarEndereco,
  formatarPreferencias
};
