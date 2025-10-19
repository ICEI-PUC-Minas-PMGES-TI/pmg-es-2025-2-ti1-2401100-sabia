/**
 * SABIAA - Carregador de Perfil do Usuário
 * Script para carregar dados do perfil a partir do banco de dados
 */

class PerfilLoader {
    constructor() {
        this.usuariosData = null;
        this.init();
    }

    async init() {
        await this.carregarDadosUsuarios();
        await this.carregarPerfilUsuario();
    }

    /**
     * Carregar dados dos usuários do arquivo JSON
     */
    async carregarDadosUsuarios() {
        try {
            // Determinar caminho para o arquivo de dados baseado na localização atual
            const currentPath = window.location.pathname;
            let dataPath = '';
            
            if (currentPath.includes('/gustavo/in/')) {
                dataPath = '../../../assets/data/usuarios.json';
            } else {
                dataPath = './assets/data/usuarios.json';
            }

            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar dados: ${response.status}`);
            }
            
            this.usuariosData = await response.json();
            console.log('📊 Dados dos usuários carregados:', this.usuariosData);
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados dos usuários:', error);
            // Usar dados mock em caso de erro
            this.carregarDadosMock();
        }
    }

    /**
     * Carregar dados mock para desenvolvimento
     */
    carregarDadosMock() {
        const isAluno = document.documentElement.classList.contains('theme-aluno');
        
        this.usuariosData = {
            usuarios: [
                {
                    id: isAluno ? "aluno_001" : "professor_001",
                    tipo: isAluno ? "aluno" : "professor",
                    nome: isAluno ? "Ana Silva Santos" : "Prof. Dr. Carlos Eduardo Oliveira",
                    foto: null, // Usará avatar padrão
                    data_nascimento: isAluno ? "2006-05-15" : "1985-03-22",
                    genero: isAluno ? "feminino" : "masculino",
                    email: isAluno ? "ana.santos@pucminas.br" : "carlos.oliveira@pucminas.br",
                    telefone: isAluno ? "(31) 98765-4321" : "(31) 91234-5678",
                    endereco: {
                        cep: isAluno ? "31270-010" : "30130-000",
                        rua: isAluno ? "Rua das Flores" : "Av. Afonso Pena",
                        numero: isAluno ? "123" : "3000",
                        bairro: isAluno ? "Savassi" : "Centro",
                        cidade: "Belo Horizonte",
                        estado: "MG"
                    },
                    referencias_academicas: isAluno ? {
                        aluno: {
                            numero_matricula: "2024001",
                            serie: "3º Ano",
                            escola: "Colégio Santo Antônio"
                        }
                    } : {
                        professor: {
                            departamento: "Ciência da Computação",
                            titulacao: "Doutor",
                            numero_registro: "PROF001"
                        }
                    }
                }
            ]
        };
        
        console.log('🔄 Usando dados mock para desenvolvimento');
    }

    /**
     * Carregar perfil do usuário logado
     */
    async carregarPerfilUsuario() {
        try {
            // Pegar dados do usuário logado do localStorage ou auth
            let usuarioLogado = null;
            
            if (window.sabiaAuth) {
                usuarioLogado = sabiaAuth.getUser();
            }
            
            // Se não tem usuário logado, simular baseado no tipo da página
            if (!usuarioLogado) {
                const isAluno = document.documentElement.classList.contains('theme-aluno');
                usuarioLogado = {
                    id: isAluno ? "aluno_001" : "professor_001",
                    tipo: isAluno ? "aluno" : "professor"
                };
            }
            
            // Buscar dados completos do usuário
            const dadosCompletos = this.buscarUsuarioPorId(usuarioLogado.id);
            
            if (dadosCompletos) {
                console.log('👤 Carregando perfil do usuário:', dadosCompletos);
                this.preencherFormularioPerfil(dadosCompletos);
                this.atualizarFotosPerfil(dadosCompletos);
                this.atualizarInformacoesPagina(dadosCompletos);
            } else {
                console.warn('⚠️ Usuário não encontrado nos dados');
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar perfil do usuário:', error);
        }
    }

    /**
     * Buscar usuário por ID nos dados carregados
     */
    buscarUsuarioPorId(id) {
        if (!this.usuariosData || !this.usuariosData.usuarios) {
            return null;
        }
        
        return this.usuariosData.usuarios.find(usuario => usuario.id === id);
    }

    /**
     * Preencher formulário de perfil com os dados do usuário
     */
    preencherFormularioPerfil(usuario) {
        // Dados básicos
        this.preencherCampo('nome', usuario.nome);
        this.preencherCampo('email', usuario.email);
        this.preencherCampo('telefone', usuario.telefone);
        this.preencherCampo('data_nascimento', usuario.data_nascimento);
        this.preencherCampo('genero', usuario.genero);
        
        // Endereço
        if (usuario.endereco) {
            this.preencherCampo('cep', usuario.endereco.cep);
            this.preencherCampo('rua', usuario.endereco.rua);
            this.preencherCampo('numero', usuario.endereco.numero);
            this.preencherCampo('complemento', usuario.endereco.complemento);
            this.preencherCampo('bairro', usuario.endereco.bairro);
            this.preencherCampo('cidade', usuario.endereco.cidade);
            this.preencherCampo('estado', usuario.endereco.estado);
        }
        
        // Referências acadêmicas específicas
        if (usuario.tipo === 'aluno' && usuario.referencias_academicas?.aluno) {
            const ref = usuario.referencias_academicas.aluno;
            this.preencherCampo('matricula', ref.numero_matricula);
            this.preencherCampo('serie', ref.serie);
            this.preencherCampo('escola', ref.escola);
        } else if (usuario.tipo === 'professor' && usuario.referencias_academicas?.professor) {
            const ref = usuario.referencias_academicas.professor;
            this.preencherCampo('matricula', ref.numero_registro);
            this.preencherCampo('departamento', ref.departamento);
            this.preencherCampo('titulacao', ref.titulacao);
        }
        
        console.log('✅ Formulário preenchido com dados do usuário');
    }

    /**
     * Preencher campo específico do formulário
     */
    preencherCampo(nome, valor) {
        if (!valor) return;
        
        const campo = document.querySelector(`[name="${nome}"], #${nome}`);
        if (campo) {
            campo.value = valor;
            
            // Adicionar classe de preenchido para estilização
            campo.classList.add('filled');
            
            // Se for select, garantir que a opção seja selecionada
            if (campo.tagName === 'SELECT') {
                const option = campo.querySelector(`option[value="${valor}"]`);
                if (option) {
                    option.selected = true;
                }
            }
        }
    }

    /**
     * Atualizar fotos de perfil na página
     */
    atualizarFotosPerfil(usuario) {
        const elementos = [
            '.profile-photo img',
            '.user-avatar',
            '#profileHeaderAvatar',
            '[data-perfil-foto]'
        ];
        
        elementos.forEach(seletor => {
            const elemento = document.querySelector(seletor);
            if (elemento) {
                if (usuario.foto && usuario.foto !== null) {
                    elemento.src = usuario.foto;
                    elemento.classList.remove('default-avatar');
                } else {
                    // Usar avatar padrão baseado no tipo
                    const avatarPadrao = usuario.tipo === 'professor' 
                        ? '../../../assets/images/default-professor-avatar.svg'
                        : '../../../assets/images/default-aluno-avatar.svg';
                    elemento.src = avatarPadrao;
                    elemento.classList.add('default-avatar');
                }
                
                elemento.alt = `Foto de ${usuario.nome}`;
            }
        });
        
        console.log('📸 Fotos de perfil atualizadas');
    }

    /**
     * Atualizar informações gerais da página
     */
    atualizarInformacoesPagina(usuario) {
        // Nome nos headers e títulos
        const nomeElements = document.querySelectorAll('.user-name, [data-user-name]');
        nomeElements.forEach(el => {
            el.textContent = usuario.nome;
        });
        
        // Tipo de usuário
        const tipoElements = document.querySelectorAll('.user-role, [data-user-role]');
        tipoElements.forEach(el => {
            el.textContent = usuario.tipo === 'aluno' ? 'Aluno' : 'Professor';
        });
        
        // Email em elementos específicos
        const emailElements = document.querySelectorAll('[data-user-email]');
        emailElements.forEach(el => {
            el.textContent = usuario.email;
        });
        
        // Atualizar título da página
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle && pageTitle.textContent.includes('{{USER_NAME}}')) {
            pageTitle.textContent = pageTitle.textContent.replace('{{USER_NAME}}', usuario.nome);
        }
        
        console.log('📝 Informações da página atualizadas');
    }

    /**
     * Salvar alterações do perfil
     */
    async salvarPerfil(dadosFormulario) {
        try {
            console.log('💾 Salvando alterações do perfil:', dadosFormulario);
            
            // Aqui você implementaria a chamada para a API para salvar
            // Por enquanto, apenas simular salvamento
            
            // Atualizar dados locais
            if (window.sabiaAuth) {
                const usuarioAtual = sabiaAuth.getUser();
                const dadosAtualizados = { ...usuarioAtual, ...dadosFormulario };
                sabiaAuth.setUser(dadosAtualizados);
            }
            
            // Mostrar mensagem de sucesso
            this.mostrarMensagem('Perfil atualizado com sucesso!', 'success');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao salvar perfil:', error);
            this.mostrarMensagem('Erro ao salvar perfil. Tente novamente.', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Mostrar mensagem para o usuário
     */
    mostrarMensagem(mensagem, tipo = 'info') {
        // Usar o sistema de notificações do dashboard se disponível
        if (window.sabiaDashboard) {
            window.sabiaDashboard.showNotification(mensagem, tipo);
        } else {
            // Fallback para alert
            alert(mensagem);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.perfilLoader = new PerfilLoader();
});

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerfilLoader;
}