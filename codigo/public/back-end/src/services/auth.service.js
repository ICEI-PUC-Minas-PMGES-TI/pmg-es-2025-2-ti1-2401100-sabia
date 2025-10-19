// src/services/auth.service.js
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../config/database');
const { 
  hashSenha, 
  compararSenha, 
  gerarToken, 
  gerarCodigoRecuperacao,
  removerCamposSensiveis,
  criarEstruturaUsuario,
  formatarEndereco,
  formatarPreferencias
} = require('../utils/helpers');
const { enviarEmailRecuperacao, enviarEmailBoasVindas } = require('../config/email');
const recoveryTokens = require('../utils/recoveryTokens');

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Cadastra novo usuário
   * @param {Object} dadosUsuario - Dados do usuário
   * @returns {Promise<Object>} Usuário criado e token
   */
  async cadastrarUsuario(dadosUsuario) {
    const db = readDB();
    const { email, senha, nome, tipo, data_nascimento, genero, telefone, endereco, preferencias, foto } = dadosUsuario;

    // Garantir que a estrutura do banco está correta
    if (!db.usuarios) {
      db.usuarios = [];
    }

    // Verificar se o email já existe
    const existingUser = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      throw { status: 409, message: 'Email já cadastrado' };
    }

    // Hash da senha
    const senha_hash = await hashSenha(senha);

    // Criar novo usuário
    const novoUsuario = {
      id: uuidv4(),
      tipo,
      nome,
      foto: foto || "",
      data_nascimento,
      genero,
      email: email.toLowerCase(),
      senha_hash,
      telefone: telefone || "",
      endereco: formatarEndereco(endereco),
      preferencias: formatarPreferencias(preferencias),
      cadastro_data: new Date().toISOString(),
      status: "ativo",
      favoritos: [],
      referencias_academicas: criarEstruturaUsuario(tipo)
    };

    db.usuarios.push(novoUsuario);
    writeDB(db);

    // Gerar token JWT
    const token = gerarToken({
      id: novoUsuario.id,
      email: novoUsuario.email,
      tipo: novoUsuario.tipo
    });

    // Enviar email de boas-vindas (não bloquear o cadastro se falhar)
    try {
      await enviarEmailBoasVindas(novoUsuario.email, novoUsuario.nome, novoUsuario.tipo);
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
    }

    return {
      token,
      usuario: removerCamposSensiveis(novoUsuario)
    };
  }

  /**
   * Realiza login do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise<Object>} Usuário e token
   */
  async login(email, senha) {
    const db = readDB();

    // Buscar usuário
    const usuario = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!usuario) {
      throw { status: 401, message: 'Email ou senha incorretos' };
    }

    // Verificar status
    if (usuario.status !== 'ativo') {
      throw { status: 403, message: 'Usuário inativo ou suspenso. Entre em contato com o suporte.' };
    }

    // Verificar senha
    const senhaValida = await compararSenha(senha, usuario.senha_hash);
    if (!senhaValida) {
      throw { status: 401, message: 'Email ou senha incorretos' };
    }

    // Gerar token JWT
    const token = gerarToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo
    });

    return {
      token,
      usuario: removerCamposSensiveis(usuario)
    };
  }

  /**
   * Solicita recuperação de senha
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} Token de recuperação
   */
  async solicitarRecuperacaoSenha(email) {
    const db = readDB();

    const usuario = db.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Por segurança, sempre retornar sucesso mesmo se o email não existir
    if (!usuario) {
      return { 
        message: 'Se o email existir, você receberá um código de recuperação',
        token: null 
      };
    }

    // Gerar código de 6 dígitos e token único
    const codigo = gerarCodigoRecuperacao();
    const token = uuidv4();
    
    // Armazenar temporariamente (expira em 15 minutos)
    recoveryTokens.set(token, {
      email: usuario.email,
      codigo,
      expira: Date.now() + 15 * 60 * 1000
    });

    // Enviar email
    try {
      await enviarEmailRecuperacao(usuario.email, usuario.nome, codigo, token);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw { status: 500, message: 'Erro ao enviar email de recuperação' };
    }

    return {
      message: 'Código de recuperação enviado para o email',
      token
    };
  }

  /**
   * Valida código e altera senha
   * @param {string} token - Token de recuperação
   * @param {string} codigo - Código de 6 dígitos
   * @param {string} nova_senha - Nova senha
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async alterarSenhaComCodigo(token, codigo, nova_senha) {
    // Verificar token
    const recovery = recoveryTokens.get(token);
    if (!recovery) {
      throw { status: 400, message: 'Token inválido ou expirado' };
    }

    if (Date.now() > recovery.expira) {
      recoveryTokens.delete(token);
      throw { status: 400, message: 'Código expirado. Solicite um novo' };
    }

    if (recovery.codigo !== codigo) {
      throw { status: 400, message: 'Código incorreto' };
    }

    // Atualizar senha
    const db = readDB();
    const usuario = db.usuarios.find(u => u.email.toLowerCase() === recovery.email.toLowerCase());
    
    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    usuario.senha_hash = await hashSenha(nova_senha);
    writeDB(db);

    // Remover token usado
    recoveryTokens.delete(token);

    return { message: 'Senha alterada com sucesso' };
  }
}

module.exports = new AuthService();
