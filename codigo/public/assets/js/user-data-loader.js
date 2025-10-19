/**
 * SABIAA - Sistema de carregamento de dados do usuário
 * Carrega foto de perfil e informações do usuário do backend
 */

class UserDataLoader {
    constructor() {
        this.apiBaseUrl = window.location.origin.includes('localhost') 
            ? 'http://localhost:3000/api' 
            : '/api';
        this.init();
    }

    init() {
        // Carrega dados imediatamente
        this.loadUserData();
        
        // Configura refresh automático a cada 5 minutos
        setInterval(() => {
            this.loadUserData();
        }, 5 * 60 * 1000);
    }

    async loadUserData() {
        try {
            // Tenta carregar do backend primeiro
            await this.loadFromBackend();
        } catch (error) {
            console.warn('Backend não disponível, usando dados locais:', error);
            // Fallback para dados locais/mock
            this.loadFromLocalStorage();
        }
    }

    async loadFromBackend() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const response = await fetch(`${this.apiBaseUrl}/usuario/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        
        // Salva no localStorage para cache
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userDataTimestamp', Date.now().toString());
        
        // Atualiza a interface
        this.updateUserInterface(userData);
        
        return userData;
    }

    loadFromLocalStorage() {
        const cachedData = localStorage.getItem('userData');
        const timestamp = localStorage.getItem('userDataTimestamp');
        
        if (cachedData) {
            const userData = JSON.parse(cachedData);
            this.updateUserInterface(userData);
            
            // Se os dados são muito antigos (mais de 1 hora), tenta recarregar
            if (timestamp && (Date.now() - parseInt(timestamp)) > 60 * 60 * 1000) {
                setTimeout(() => this.loadUserData(), 1000);
            }
        } else {
            // Dados mock para desenvolvimento
            this.loadMockData();
        }
    }

    loadMockData() {
        const mockData = {
            nome: 'Usuário SABIAA',
            email: 'usuario@sabiaa.com',
            tipo: this.getUserType(),
            foto: this.getDefaultAvatar(),
            telefone: '(31) 99999-9999',
            matricula: this.getUserType() === 'aluno' ? '2024001' : 'PROF001'
        };
        
        this.updateUserInterface(mockData);
    }

    updateUserInterface(userData) {
        // Atualiza foto do usuário
        this.updateUserAvatar(userData.foto);
        
        // Atualiza nome do usuário
        this.updateUserName(userData.nome);
        
        // Atualiza informações do perfil se estiver na página de perfil
        this.updateProfileInfo(userData);
        
        // Atualiza breadcrumb se necessário
        this.updateBreadcrumb(userData);
    }

    updateUserAvatar(fotoUrl) {
        const avatars = document.querySelectorAll('.user-avatar, .profile-photo img, [data-user-avatar]');
        
        avatars.forEach(avatar => {
            if (fotoUrl && fotoUrl !== 'default') {
                // Se é uma URL completa ou caminho relativo
                if (fotoUrl.startsWith('http') || fotoUrl.startsWith('/')) {
                    avatar.src = fotoUrl;
                } else {
                    // Assume que é um nome de arquivo na pasta de uploads
                    avatar.src = `/uploads/avatars/${fotoUrl}`;
                }
                
                // Remove classe de avatar padrão se existir
                avatar.classList.remove('default-avatar');
            } else {
                // Usa avatar padrão
                avatar.src = this.getDefaultAvatar();
                avatar.classList.add('default-avatar');
            }
            
            // Adiciona tratamento de erro para imagens
            avatar.onerror = () => {
                avatar.src = this.getDefaultAvatar();
                avatar.classList.add('default-avatar');
            };
        });
    }

    updateUserName(nome) {
        const nameElements = document.querySelectorAll('.user-name, [data-user-name]');
        
        nameElements.forEach(element => {
            if (nome) {
                element.textContent = nome;
            }
        });
    }

    updateProfileInfo(userData) {
        // Atualiza campos do formulário de perfil
        const fields = {
            'nome': userData.nome,
            'email': userData.email,
            'telefone': userData.telefone,
            'matricula': userData.matricula
        };

        Object.entries(fields).forEach(([field, value]) => {
            const input = document.querySelector(`input[name="${field}"], #${field}`);
            if (input && value) {
                input.value = value;
            }
        });

        // Atualiza labels com informações do usuário
        const infoElements = document.querySelectorAll('[data-user-info]');
        infoElements.forEach(element => {
            const field = element.getAttribute('data-user-info');
            if (userData[field]) {
                element.textContent = userData[field];
            }
        });
    }

    updateBreadcrumb(userData) {
        const breadcrumbName = document.querySelector('.breadcrumb .user-name-breadcrumb');
        if (breadcrumbName && userData.nome) {
            breadcrumbName.textContent = userData.nome;
        }
    }

    getUserType() {
        // Detecta tipo do usuário baseado na URL ou classe do HTML
        if (document.documentElement.classList.contains('theme-professor')) {
            return 'professor';
        } else if (document.documentElement.classList.contains('theme-aluno')) {
            return 'aluno';
        }
        
        // Fallback baseado na URL
        if (window.location.pathname.includes('/professor/')) {
            return 'professor';
        } else if (window.location.pathname.includes('/aluno/')) {
            return 'aluno';
        }
        
        return 'aluno'; // padrão
    }

    getDefaultAvatar() {
        const userType = this.getUserType();
        return userType === 'professor' 
            ? '../../../assets/images/default-professor-avatar.svg'
            : '../../../assets/images/default-aluno-avatar.svg';
    }

    // Método para upload de nova foto de perfil
    async uploadProfilePhoto(file) {
        try {
            const formData = new FormData();
            formData.append('foto', file);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/usuario/foto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Erro ao fazer upload da foto');
            }

            const result = await response.json();
            
            // Atualiza a interface com a nova foto
            this.updateUserAvatar(result.fotoUrl);
            
            // Atualiza o cache local
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.foto = result.fotoUrl;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            return result;
        } catch (error) {
            console.error('Erro no upload da foto:', error);
            throw error;
        }
    }

    // Método para atualizar dados do perfil
    async updateProfile(profileData) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/usuario/perfil`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }

            const result = await response.json();
            
            // Atualiza o cache local
            localStorage.setItem('userData', JSON.stringify(result));
            localStorage.setItem('userDataTimestamp', Date.now().toString());
            
            // Atualiza a interface
            this.updateUserInterface(result);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            throw error;
        }
    }
}

// Inicializa automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Cria instância global do carregador de dados
    window.userDataLoader = new UserDataLoader();
});

// Exporta para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataLoader;
}