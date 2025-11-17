/**
 * Gerenciador de Perfil do Usuário - Sistema Limpo e Funcional
 * Carrega dados dinamicamente baseado no usuário logado
 */
class ProfileDataManager {
    constructor() {
        this.API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'http://localhost:3000';
    }

    /**
     * Carrega dados do perfil do usuário autenticado
     */
    async loadUserProfile() {
        try {
            // Verificar se usuário está autenticado
            if (!window.sabiaAuth?.isLoggedIn()) {
                console.log('⚠️ Usuário não autenticado');
                return null;
            }

            // Sempre buscar dados atualizados do backend
            const userData = await this.fetchFromBackend();
            
            if (userData) {
                console.log(`✅ Perfil carregado: ${userData.nome} (${userData.email})`);
                // Atualizar dados locais
                window.sabiaAuth.setUser(userData);
                return userData;
            }

            return null;
        } catch (error) {
            console.error('❌ Erro ao carregar perfil:', error.message);
            return null;
        }
    }

    /**
     * Busca dados do backend usando o token do usuário logado
     */
    async fetchFromBackend() {
        const token = window.sabiaAuth.getToken();
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }

        const response = await fetch(`${this.API_BASE}/api/usuario/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success || !result.user) {
            throw new Error('Dados inválidos retornados pela API');
        }

        return result.user;
    }

    /**
     * Atualiza dados do perfil
     */
    async updateProfile(userData) {
        const token = window.sabiaAuth.getToken();
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }

        const response = await fetch(`${this.API_BASE}/api/usuario/perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro ao atualizar perfil');
        }

        // Atualizar dados locais
        window.sabiaAuth.setUser(result.user);
        
        return result.user;
    }

    /**
     * Carrega e atualiza elementos da interface com dados do usuário
     */
    async loadAndUpdateUI() {
        const userData = await this.loadUserProfile();
        
        if (!userData) {
            console.log('⚠️ Nenhum dado de usuário para exibir');
            return false;
        }

        // Atualizar elementos do header
        this.updateHeaderElements(userData);
        
        // Atualizar elementos do perfil se existirem
        this.updateProfileElements(userData);
        
        return true;
    }

    /**
     * Atualiza elementos do header com dados do usuário
     */
    updateHeaderElements(userData) {
        // Nome do usuário no header
        const headerName = document.getElementById('headerUserName');
        if (headerName) {
            headerName.textContent = userData.nome;
        }

        // Avatar do usuário no header
        const headerAvatar = document.getElementById('headerUserAvatar');
        if (headerAvatar) {
            headerAvatar.src = userData.foto || '/assets/images/default-avatar.png';
            headerAvatar.alt = `Foto de ${userData.nome}`;
        }

        // Link do perfil
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.href = userData.tipo === 'professor' ? '/gustavo/in/professor/perfil/' : '/gustavo/in/aluno/perfil/';
        }
    }

    /**
     * Atualiza elementos da página de perfil com dados do usuário
     */
    updateProfileElements(userData) {
        // Elementos comuns de perfil
        const profileElements = {
            'profile-name': userData.nome,
            'profile-email': userData.email,
            'profile-phone': userData.telefone,
            'profile-birth': userData.data_nascimento,
            'profile-type': userData.tipo === 'professor' ? 'Professor' : 'Aluno'
        };

        Object.entries(profileElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'Não informado';
            }
        });

        // Foto de perfil
        const profilePhoto = document.getElementById('profile-photo');
        if (profilePhoto) {
            profilePhoto.src = userData.foto || '/assets/images/default-avatar.png';
            profilePhoto.alt = `Foto de ${userData.nome}`;
        }
    }
}

// Criar instância global
window.profileDataManager = new ProfileDataManager();

// Auto-inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.sabiaAuth?.isLoggedIn()) {
        window.profileDataManager.loadAndUpdateUI();
    }
});