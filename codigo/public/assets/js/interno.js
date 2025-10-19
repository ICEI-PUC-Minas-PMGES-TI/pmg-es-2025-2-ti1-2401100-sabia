/**
 * SABIAA - JavaScript Global para Dashboard Interno
 * Funcionalidades comuns para alunos e professores
 */

class SabiaDashboard {
    constructor() {
        this.sidebarCollapsed = false;
        this.userMenuOpen = false;
        this.isMobile = window.innerWidth <= 1024;
        
        this.init();
    }

    /**
     * Inicializar dashboard
     */
    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateDateTime();
        this.checkMobileView();
        
        // Atualizar a cada minuto
        setInterval(() => this.updateDateTime(), 60000);
        
        // Verificar resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Toggle sidebar
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Menu mobile toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // User profile dropdown  
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            if (this.userMenuOpen) {
                this.closeUserMenu();
            }
        });

        // Overlay mobile
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeMobileSidebar());
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                e.currentTarget.classList.add('active');
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    /**
     * Carregar dados do usuário
     */
    async loadUserData() {
        try {
            if (!window.sabiaAuth) {
                console.warn('Sistema de autenticação não encontrado');
                return;
            }

            // Primeiro tenta pegar do localStorage
            let user = sabiaAuth.getUser();
            
            // Se não tem no localStorage ou quer dados atualizados, busca do backend
            if (!user || this.shouldRefreshUserData(user)) {
                const token = sabiaAuth.getToken();
                if (token) {
                    const response = await fetch(`${sabiaAuth.API_BASE}/api/usuario/perfil`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        user = data.data || data.usuario || data;
                        // Atualizar localStorage com dados frescos
                        sabiaAuth.setUser(user);
                    } else if (response.status === 401) {
                        // Token inválido
                        sabiaAuth.logout();
                        this.redirectToLogin();
                        return;
                    }
                }
            }

            if (user) {
                this.updateUserDisplay(user);
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            // Em caso de erro, tenta usar dados do localStorage
            const user = sabiaAuth.getUser();
            if (user) {
                this.updateUserDisplay(user);
            } else {
                this.redirectToLogin();
            }
        }
    }

    /**
     * Verifica se deve atualizar dados do usuário
     */
    shouldRefreshUserData(user) {
        if (!user.lastUpdate) return true;
        const now = Date.now();
        const lastUpdate = new Date(user.lastUpdate).getTime();
        // Atualizar a cada 15 minutos
        return (now - lastUpdate) > (15 * 60 * 1000);
    }

    /**
     * Atualizar exibição do usuário
     */
    updateUserDisplay(user) {
        console.log('Atualizando dados do usuário:', user);
        
        // Avatar
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar) {
            if (user.foto) {
                userAvatar.src = user.foto;
            } else {
                // Usar path relativo correto baseado na localização atual
                const currentPath = window.location.pathname;
                const depth = currentPath.split('/').filter(p => p !== '').length;
                let relativePath = '';
                for (let i = 0; i < depth - 2; i++) {
                    relativePath += '../';
                }
                userAvatar.src = `${relativePath}assets/images/banner_ti.png`;
            }
            userAvatar.alt = `Foto de ${user.nome}`;
        }

        // Nome
        const userName = document.querySelector('.user-name');
        if (userName) {
            userName.textContent = user.nome || 'Usuário';
        }

        // Tipo/Role
        const userRole = document.querySelector('.user-role');
        if (userRole) {
            userRole.textContent = user.tipo === 'aluno' ? 'Aluno' : 'Professor';
        }

        // Atualizar outros avatares na página (se houver)
        const profileHeaderAvatar = document.getElementById('profileHeaderAvatar');
        if (profileHeaderAvatar && user.foto) {
            profileHeaderAvatar.src = user.foto;
        }

        const profileHeaderName = document.getElementById('profileHeaderName');
        if (profileHeaderName) {
            profileHeaderName.textContent = user.nome || 'Usuário';
        }

        // Breadcrumb e títulos personalizados
        this.updatePageInfo(user);
    }

    /**
     * Atualizar informações da página baseado no usuário
     */
    updatePageInfo(user) {
        const pageTitle = document.querySelector('.page-title');
        const breadcrumbUser = document.querySelector('.breadcrumb-user');
        
        if (pageTitle && pageTitle.textContent.includes('{{USER_NAME}}')) {
            pageTitle.textContent = pageTitle.textContent.replace('{{USER_NAME}}', user.nome);
        }
        
        if (breadcrumbUser) {
            breadcrumbUser.textContent = user.nome;
        }
    }

    /**
     * Toggle sidebar desktop
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            
            sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            mainContent.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            
            // Salvar preferência
            localStorage.setItem('sabiaa_sidebar_collapsed', this.sidebarCollapsed);
        }
    }

    /**
     * Toggle sidebar mobile
     */
    toggleMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
        }
    }

    /**
     * Fechar sidebar mobile
     */
    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        }
    }

    /**
     * Toggle menu do usuário
     */
    toggleUserMenu() {
        const userProfile = document.querySelector('.user-profile');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userProfile && userDropdown) {
            this.userMenuOpen = !this.userMenuOpen;
            
            userProfile.classList.toggle('active', this.userMenuOpen);
            userDropdown.classList.toggle('active', this.userMenuOpen);
        }
    }

    /**
     * Fechar menu do usuário
     */
    closeUserMenu() {
        const userProfile = document.querySelector('.user-profile');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userProfile && userDropdown) {
            this.userMenuOpen = false;
            userProfile.classList.remove('active');
            userDropdown.classList.remove('active');
        }
    }

    /**
     * Lidar com busca
     */
    handleSearch(query) {
        // Implementar lógica de busca em tempo real
        if (query.length > 2) {
            console.log('Buscando:', query);
            // Aqui você pode fazer uma requisição para buscar
        }
    }

    /**
     * Executar busca
     */
    performSearch(query) {
        if (query.trim()) {
            console.log('Executar busca para:', query);
            // Implementar busca completa
        }
    }

    /**
     * Atualizar data e hora
     */
    updateDateTime() {
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateTimeElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    /**
     * Verificar se é mobile
     */
    checkMobileView() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 1024;
        
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                // Fechar sidebar se mudou para mobile
                this.closeMobileSidebar();
            } else {
                // Restaurar estado do sidebar em desktop
                const savedState = localStorage.getItem('sabiaa_sidebar_collapsed');
                if (savedState === 'true') {
                    this.sidebarCollapsed = true;
                    document.querySelector('.sidebar')?.classList.add('collapsed');
                    document.querySelector('.main-content')?.classList.add('sidebar-collapsed');
                }
            }
        }
    }

    /**
     * Lidar com resize da janela
     */
    handleResize() {
        this.checkMobileView();
    }

    /**
     * Logout
     */
    async logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            try {
                if (window.sabiaAuth) {
                    sabiaAuth.logout();
                }
                this.redirectToLogin();
            } catch (error) {
                console.error('Erro no logout:', error);
                // Forçar redirecionamento mesmo com erro
                this.redirectToLogin();
            }
        }
    }

    /**
     * Redirecionar para login
     */
    redirectToLogin() {
        // Calcular caminho relativo baseado na localização atual
        const currentPath = window.location.pathname;
        let loginUrl = '';
        
        if (currentPath.includes('/gustavo/in/')) {
            // Se estamos em gustavo/in/, voltar 1 nível para gustavo/ e depois ir para login/
            loginUrl = '../login/login.html';
        } else if (currentPath.includes('/modulos/')) {
            // Se estamos em modulos/, voltar 1 nível e ir para gustavo/login/
            loginUrl = '../gustavo/login/login.html';
        } else {
            // Raiz ou outras páginas
            loginUrl = './gustavo/login/login.html';
        }
        
        window.location.href = loginUrl;
    }

    /**
     * Mostrar notificação
     */
    showNotification(message, type = 'info', duration = 5000) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Remover automaticamente
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Botão de fechar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    /**
     * Obter ícone da notificação
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Atualizar contadores de notificação
     */
    updateNotificationCount(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

// Inicializar dashboard quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.sabiaDashboard = new SabiaDashboard();
});

// Funções globais para uso nos templates
window.logout = () => window.sabiaDashboard?.logout();
window.toggleSidebar = () => window.sabiaDashboard?.toggleSidebar();
window.toggleMobileSidebar = () => window.sabiaDashboard?.toggleMobileSidebar();