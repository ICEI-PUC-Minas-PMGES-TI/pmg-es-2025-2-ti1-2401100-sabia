// SABIAA - Sistema de Autenticação Simples
// Funciona diretamente com json-server (sem backend de autenticação)

class SabiaAuth {
    constructor() {
        this.API_BASE = 'https://sabiaa.onrender.com';
        this.USER_KEY = 'sabiaa_user';
    }

    // Salvar usuário logado
    saveUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Obter usuário logado
    getUser() {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // Remover usuário (logout)
    logout() {
        localStorage.removeItem(this.USER_KEY);
        window.location.href = '/codigo/public/gustavo/login/login.html';
    }

    // Verificar se está logado
    verificarLogin() {
        const user = this.getUser();
        
        if (!user) {
            // Se não estiver logado e não estiver em página pública
            const currentPath = window.location.pathname;
            const publicPages = ['/login', '/cadastro', '/sobre', '/homepage'];
            const isPublicPage = publicPages.some(page => currentPath.includes(page));
            
            if (!isPublicPage) {
                alert('Você precisa estar logado!');
                window.location.href = '/codigo/public/gustavo/login/login.html';
                return false;
            }
        }
        
        return true;
    }

    // Fazer login
    async login(email, senha) {
        try {
            // Buscar usuário por email
            const response = await fetch(`${this.API_BASE}/usuarios?email=${email}`);
            const usuarios = await response.json();

            if (usuarios.length === 0) {
                throw new Error('Usuário não encontrado');
            }

            const usuario = usuarios[0];

            // Verificar senha (em produção, isso seria no backend!)
            if (usuario.senha !== senha) {
                throw new Error('Senha incorreta');
            }

            // Salvar usuário (sem a senha)
            const userToSave = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                foto: usuario.foto || '/codigo/public/assets/images/default-aluno-avatar.svg',
                tipo: usuario.tipo || 'aluno'
            };

            this.saveUser(userToSave);

            return {
                success: true,
                message: 'Login realizado com sucesso!',
                user: userToSave
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erro ao fazer login'
            };
        }
    }

    // Registrar novo usuário
    async register(dados) {
        try {
            // Verificar se email já existe
            const checkResponse = await fetch(`${this.API_BASE}/usuarios?email=${dados.email}`);
            const existing = await checkResponse.json();

            if (existing.length > 0) {
                throw new Error('Este e-mail já está cadastrado');
            }

            // Criar novo usuário
            const novoUsuario = {
                nome: dados.nome,
                email: dados.email,
                senha: dados.senha, // Em produção, seria hash!
                foto: dados.foto || '/codigo/public/assets/images/default-aluno-avatar.svg',
                tipo: dados.tipo || 'aluno',
                data_cadastro: new Date().toISOString(),
                bio: dados.bio || '',
                telefone: dados.telefone || ''
            };

            const response = await fetch(`${this.API_BASE}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario)
            });

            if (!response.ok) {
                throw new Error('Erro ao criar usuário');
            }

            const usuarioCriado = await response.json();

            // Fazer login automático
            const userToSave = {
                id: usuarioCriado.id,
                nome: usuarioCriado.nome,
                email: usuarioCriado.email,
                foto: usuarioCriado.foto,
                tipo: usuarioCriado.tipo
            };

            this.saveUser(userToSave);

            return {
                success: true,
                message: 'Cadastro realizado com sucesso!',
                user: userToSave
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erro ao cadastrar usuário'
            };
        }
    }

    // Verificar se é admin
    isAdmin() {
        const user = this.getUser();
        return user && user.tipo === 'admin';
    }

    // Verificar se é aluno
    isAluno() {
        const user = this.getUser();
        return user && user.tipo === 'aluno';
    }

    // Redirecionar após login
    redirectAfterLogin() {
        const user = this.getUser();
        if (user) {
            // Sempre redirecionar para o index.html correto
            window.location.href = '/codigo/public/modules/dashboard/index.html';
        }
    }

    // Atualizar dados do usuário
    async atualizarPerfil(dados) {
        try {
            const user = this.getUser();
            if (!user) throw new Error('Usuário não logado');

            // Atualizar no servidor
            const response = await fetch(`${this.API_BASE}/usuarios/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }

            const usuarioAtualizado = await response.json();

            // Atualizar localStorage
            const userToSave = {
                id: usuarioAtualizado.id,
                nome: usuarioAtualizado.nome,
                email: usuarioAtualizado.email,
                foto: usuarioAtualizado.foto,
                tipo: usuarioAtualizado.tipo
            };

            this.saveUser(userToSave);

            return {
                success: true,
                message: 'Perfil atualizado com sucesso!',
                user: userToSave
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Erro ao atualizar perfil'
            };
        }
    }
}

// Criar instância global
const sabiaAuth = new SabiaAuth();
