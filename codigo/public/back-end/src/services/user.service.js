// src/services/user.service.js
const { readDB, writeDB } = require('../config/database');
const { hashSenha, compararSenha, removerCamposSensiveis } = require('../utils/helpers');

/**
 * Serviço de gerenciamento de usuários
 */
class UserService {
  /**
   * Obtém usuário por ID
   * @param {string} userId - ID do usuário
   * @returns {Object} Dados do usuário
   */
  obterUsuarioPorId(userId) {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === userId);

    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    return removerCamposSensiveis(usuario);
  }

  /**
   * Atualiza perfil do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} dadosAtualizacao - Dados a serem atualizados
   * @returns {Object} Usuário atualizado
   */
  atualizarPerfil(userId, dadosAtualizacao) {
    const db = readDB();
    const usuarioIndex = db.usuarios.findIndex(u => u.id === userId);

    if (usuarioIndex === -1) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    const usuario = db.usuarios[usuarioIndex];

    // Campos que podem ser editados
    const camposEditaveis = [
      'nome', 'foto', 'telefone', 'endereco', 
      'preferencias', 'referencias_academicas', 'genero'
    ];

    // Atualizar apenas campos permitidos
    camposEditaveis.forEach(campo => {
      if (dadosAtualizacao[campo] !== undefined) {
        usuario[campo] = dadosAtualizacao[campo];
      }
    });

    writeDB(db);

    return removerCamposSensiveis(usuario);
  }

  /**
   * Altera senha do usuário logado
   * @param {string} userId - ID do usuário
   * @param {string} senha_atual - Senha atual
   * @param {string} nova_senha - Nova senha
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async alterarSenha(userId, senha_atual, nova_senha) {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === userId);

    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    // Verificar senha atual
    const senhaValida = await compararSenha(senha_atual, usuario.senha_hash);
    if (!senhaValida) {
      throw { status: 401, message: 'Senha atual incorreta' };
    }

    // Atualizar senha
    usuario.senha_hash = await hashSenha(nova_senha);
    writeDB(db);

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Desativa conta do usuário
   * @param {string} userId - ID do usuário
   * @returns {Object} Mensagem de sucesso
   */
  desativarConta(userId) {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === userId);

    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    // Desativar ao invés de deletar (soft delete)
    usuario.status = 'inativo';
    writeDB(db);

    return { message: 'Conta desativada com sucesso' };
  }

  /**
   * Lista usuários (apenas para administradores)
   * @param {Object} filtros - Filtros de busca
   * @returns {Object} Lista paginada de usuários
   */
  listarUsuarios(filtros = {}) {
    const db = readDB();
    const { tipo, status, page = 1, limit = 10, busca = '' } = filtros;

    let usuarios = db.usuarios;

    // Filtro por tipo
    if (tipo) {
      usuarios = usuarios.filter(u => u.tipo === tipo);
    }

    // Filtro por status
    if (status) {
      usuarios = usuarios.filter(u => u.status === status);
    }

    // Busca por nome ou email
    if (busca) {
      const buscaLower = busca.toLowerCase();
      usuarios = usuarios.filter(u => 
        u.nome.toLowerCase().includes(buscaLower) ||
        u.email.toLowerCase().includes(buscaLower)
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = usuarios.slice(startIndex, endIndex);

    // Remover senhas
    const usuariosSemSenha = paginatedUsers.map(u => removerCamposSensiveis(u));

    return {
      total: usuarios.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(usuarios.length / limit),
      usuarios: usuariosSemSenha
    };
  }

  /**
   * Adiciona item aos favoritos
   * @param {string} userId - ID do usuário
   * @param {Object} favorito - Item favorito
   * @returns {Object} Mensagem de sucesso
   */
  adicionarFavorito(userId, favorito) {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === userId);

    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    // Verificar se já está nos favoritos
    const jaExiste = usuario.favoritos.some(
      f => f.tipo === favorito.tipo && f.id === favorito.id
    );

    if (jaExiste) {
      throw { status: 409, message: 'Item já está nos favoritos' };
    }

    usuario.favoritos.push({
      ...favorito,
      data_favorito: new Date().toISOString()
    });

    writeDB(db);

    return { message: 'Adicionado aos favoritos com sucesso' };
  }

  /**
   * Atualiza apenas a foto do usuário
   * @param {string} userId - ID do usuário
   * @param {string} fotoUrl - URL da nova foto
   * @returns {Object} Usuário atualizado
   */
  atualizarFoto(userId, fotoUrl) {
    const db = readDB();
    const usuarioIndex = db.usuarios.findIndex(u => u.id === userId);

    if (usuarioIndex === -1) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    // Atualizar apenas a foto
    db.usuarios[usuarioIndex].foto = fotoUrl || '';

    writeDB(db);

    return removerCamposSensiveis(db.usuarios[usuarioIndex]);
  }

  /**
   * Remove item dos favoritos
   * @param {string} userId - ID do usuário
   * @param {string} tipo - Tipo do favorito
   * @param {string} id - ID do item
   * @returns {Object} Mensagem de sucesso
   */
  removerFavorito(userId, tipo, id) {
    const db = readDB();
    const usuario = db.usuarios.find(u => u.id === userId);

    if (!usuario) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    usuario.favoritos = usuario.favoritos.filter(
      f => !(f.tipo === tipo && f.id === id)
    );

    writeDB(db);

    return { message: 'Removido dos favoritos com sucesso' };
  }
}

module.exports = new UserService();
