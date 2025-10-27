/**
 * SABIAA - Sistema de Autenticação Global
 * Gerencia login, logout e proteção de rotas
 */

class SabiaAuth {
    constructor() {
        this.API_BASE = this.getApiBase();
        this.TOKEN_KEY = 'sabiaa_token';
        this.USER_KEY = 'sabiaa_user';
        this.init();
    }

    /**
     * Obtém a URL base da API com fallback robusto
     */
    getApiBase() {
        // Aguardar SABIAA_CONFIG estar disponível
        if (typeof window !== 'undefined' && window.SABIAA_CONFIG && window.SABIAA_CONFIG.API_BASE_URL) {
            console.log('✅ Usando API_BASE_URL do config:', window.SABIAA_CONFIG.API_BASE_URL);
            return window.SABIAA_CONFIG.API_BASE_URL;
        }
        
        // Fallback baseado no location
        if (typeof window !== 'undefined' && window.location) {
            const fallbackUrl = window.location.origin.includes('localhost') 
                ? 'http://localhost:3000' 
                : 'http://localhost:3000'; // Em produção seria o domínio real
            
            console.log('⚠️ SABIAA_CONFIG não encontrado, usando fallback:', fallbackUrl);
            return fallbackUrl;
        }
        
        // Fallback final
        console.log('⚠️ Usando fallback final: http://localhost:3000');
        return 'http://localhost:3000';
    }

    /**
     * Inicialização do sistema de autenticação
     */
    init() {
        // Verificar se precisa proteger a página atual
        this.checkProtectedRoute();
        
        // Configurar interceptador para requisições
        this.setupAxiosInterceptors();
        
        // Verificar token ao carregar a página
        this.checkTokenValidity();
    }

    /**
     * Verifica se a página atual precisa de autenticação
     */
    checkProtectedRoute() {
        const currentUrl = window.location.pathname;
        
        // Se a URL contém "/in/" em qualquer lugar, é uma rota protegida
        if (currentUrl.includes('/in/')) {
            const token = this.getToken();
            
            if (!token) {
                this.redirectToLogin();
                return;
            }
            
            // Verificar se o token é válido
            this.verifyToken().catch(() => {
                this.redirectToLogin();
            });
        }
    }

    /**
     * Redireciona para a página de login
     */
    redirectToLogin() {
        const currentPath = window.location.pathname;
        const loginUrl = this.getLoginUrl(currentPath);
        
        // Salvar a URL de retorno
        sessionStorage.setItem('sabiaa_return_url', currentPath);
        
        // Mostrar mensagem e redirecionar
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = loginUrl;
    }

    /**
     * Determina a URL de login baseada na localização atual
     */
    getLoginUrl(currentPath) {
        // Calcular caminho relativo baseado na localização atual
        let relativePath = '';
        
        if (currentPath.includes('/gustavo/in/')) {
            // Se estamos em gustavo/in/, voltar 1 nível para gustavo/ e depois ir para login/
            relativePath = '../login/login.html';
        } else if (currentPath.includes('/modulos/')) {
            // Se estamos em modulos/, voltar 1 nível e ir para gustavo/login/
            relativePath = '../gustavo/login/login.html';
        } else {
            // Raiz ou outras páginas
            relativePath = './gustavo/login/login.html';
        }
        
        return relativePath;
    }

    /**
     * Fazer login
     */
    async login(email, senha) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro no login');
            }

            // Salvar token e dados do usuário
            console.log('Dados recebidos do backend:', data);
            console.log('data.data:', data.data);
            
            // Acessar os dados corretos baseado na estrutura da resposta
            const { token, usuario } = data.data || data;
            
            console.log('Token extraído:', token);
            console.log('Usuario extraído:', usuario);
            
            if (!token) {
                throw new Error('Token não encontrado na resposta do servidor');
            }
            
            if (!usuario) {
                throw new Error('Dados do usuário não encontrados na resposta do servidor');
            }
            
            this.setToken(token);
            this.setUser(usuario);
            
            // Verificar se salvou corretamente
            console.log('Token salvo:', this.getToken());
            console.log('Usuário salvo:', this.getUser());

            return {
                success: true,
                user: usuario,
                message: 'Login realizado com sucesso!'
            };

        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: error.message || 'Erro ao fazer login'
            };
        }
    }

    /**
     * Fazer cadastro
     */
    async cadastro(dadosUsuario) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dadosUsuario),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro no cadastro');
            }

            return {
                success: true,
                message: 'Cadastro realizado com sucesso!'
            };

        } catch (error) {
            console.error('Erro no cadastro:', error);
            return {
                success: false,
                error: error.message || 'Erro ao fazer cadastro'
            };
        }
    }

    /**
     * Solicitar recuperação de senha
     */
    async recuperarSenha(email) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/recuperar-senha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao solicitar recuperação');
            }

            return {
                success: true,
                token: data.token,
                message: 'Instruções enviadas para seu email!'
            };

        } catch (error) {
            console.error('Erro na recuperação:', error);
            return {
                success: false,
                error: error.message || 'Erro ao solicitar recuperação de senha'
            };
        }
    }

    /**
     * Alterar senha com código
     */
    async alterarSenha(token, codigo, novaSenha) {
        try {
            const response = await fetch(`${this.API_BASE}/api/auth/alterar-senha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    token, 
                    codigo, 
                    nova_senha: novaSenha 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar senha');
            }

            return {
                success: true,
                message: 'Senha alterada com sucesso!'
            };

        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return {
                success: false,
                error: error.message || 'Erro ao alterar senha'
            };
        }
    }

    /**
     * Verificar se o token é válido
     */
    async verifyToken() {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('Token não encontrado');
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/verificar`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const data = await response.json();
            
            // Atualizar dados do usuário - corrigir estrutura da resposta
            const user = data.user || data.data?.usuario;
            if (user) {
                this.setUser(user);
            }
            
            return user;

        } catch (error) {
            console.error('Token inválido:', error);
            this.logout();
            throw error;
        }
    }

    /**
     * Verificar validade do token ao carregar página
     */
    async checkTokenValidity() {
        const token = this.getToken();
        const user = this.getUser();
        
        console.log('Verificando token:', token ? 'existe' : 'não existe');
        console.log('Dados do usuário:', user);
        
        if (token && user) {
            try {
                await this.verifyToken();
                console.log('Token válido, usuário autenticado');
            } catch (error) {
                console.log('Token inválido, fazendo logout');
                // Token inválido, fazer logout silencioso
                this.logout(false);
            }
        } else if (token && !user) {
            console.log('Token existe mas usuário não, verificando...');
            try {
                await this.verifyToken();
            } catch (error) {
                this.logout(false);
            }
        }
    }

    /**
     * Fazer logout
     */
    logout(showMessage = true) {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem('sabiaa_return_url');
        
        if (showMessage) {
            alert('Você foi desconectado.');
        }
        
        // Redirecionar para página inicial se estiver em rota protegida
        if (window.location.pathname.includes('/in/')) {
            window.location.href = this.getLoginUrl(window.location.pathname);
        }
    }

    /**
     * Obter token do localStorage
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Salvar token no localStorage
     */
    setToken(token) {
        if (token && token !== 'undefined' && token !== 'null') {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            console.error('Tentativa de salvar token inválido:', token);
        }
    }

    /**
     * Obter dados do usuário
     */
    getUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            if (!userData || userData === 'undefined' || userData === 'null') {
                return null;
            }
            return JSON.parse(userData);
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            // Limpar dados corrompidos
            localStorage.removeItem(this.USER_KEY);
            return null;
        }
    }

    /**
     * Salvar dados do usuário
     */
    setUser(user) {
        if (user && typeof user === 'object') {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } else {
            console.error('Tentativa de salvar usuário inválido:', user);
        }
    }

    /**
     * Verificar se está logado
     */
    isLoggedIn() {
        return !!this.getToken();
    }

    /**
     * Configurar interceptadores para requisições automáticas
     */
    setupAxiosInterceptors() {
        // Se axios estiver disponível, configurar interceptadores
        if (typeof axios !== 'undefined') {
            axios.defaults.baseURL = this.API_BASE;
            
            // Interceptar requisições para adicionar token
            axios.interceptors.request.use((config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            });

            // Interceptar respostas para tratar erros de autenticação
            axios.interceptors.response.use(
                (response) => response,
                (error) => {
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                    return Promise.reject(error);
                }
            );
        }
    }

    /**
     * Redirecionar após login bem-sucedido
     */
    redirectAfterLogin() {
        const returnUrl = sessionStorage.getItem('sabiaa_return_url');
        
        if (returnUrl) {
            sessionStorage.removeItem('sabiaa_return_url');
            window.location.href = returnUrl;
        } else {
            // Redirecionar para dashboard padrão baseado no tipo de usuário
            const user = this.getUser();
            if (user) {
                const dashboardUrl = this.getDashboardUrl(user.tipo);
                window.location.href = dashboardUrl;
            }
        }
    }

    /**
     * Obter URL do dashboard baseado no tipo de usuário
     */
    getDashboardUrl(tipoUsuario) {
        const currentPath = window.location.pathname;
        
        // Calcular caminho relativo baseado na localização atual
        let relativePath = '';
        
        if (currentPath.includes('/gustavo/login/')) {
            // Se estamos em gustavo/login/, voltar 2 níveis para chegar na public
            relativePath = '../../';
        } else if (currentPath.includes('/gustavo/in/')) {
            // Se estamos em gustavo/in/, voltar 3 níveis
            relativePath = '../../../';
        } else if (currentPath.includes('/modulos/')) {
            // Se estamos em modulos/, voltar 2 níveis
            relativePath = '../../';
        } else {
            // Raiz ou outras páginas
            relativePath = './';
        }
        
        // URLs dos perfis (páginas internas)
        switch (tipoUsuario) {
            case 'professor':
                return `${relativePath}gustavo/in/professor/perfil.html`;
            case 'aluno':
                return `${relativePath}gustavo/in/aluno/perfil.html`;
            default:
                return `${relativePath}index.html`;
        }
    }
}

// Instanciar o sistema de autenticação globalmente
const sabiaAuth = new SabiaAuth();

// Disponibilizar globalmente
window.sabiaAuth = sabiaAuth;

// Função auxiliar para mostrar notificações
function showNotification(message, type = 'info') {
    // Implementação simples com alert (pode ser melhorada com toast)
    if (type === 'error') {
        alert('❌ ' + message);
    } else if (type === 'success') {
        alert('✅ ' + message);
    } else {
        alert('ℹ️ ' + message);
    }
}

// Disponibilizar função globalmente
window.showNotification = showNotification;