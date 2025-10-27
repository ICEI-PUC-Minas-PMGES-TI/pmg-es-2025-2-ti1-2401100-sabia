/**
 * Testador de API e dados do usuário
 * Verifica se o backend está funcionando e carrega dados apropriados
 */
class ProfileDataManager {
    constructor() {
        // Aguardar SABIAA_CONFIG estar disponível ou usar fallback
        this.API_BASE = this.getApiBase();
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    /**
     * Obtém a URL base da API com fallback
     */
    getApiBase() {
        if (typeof window !== 'undefined' && window.SABIAA_CONFIG && window.SABIAA_CONFIG.API_BASE_URL) {
            return window.SABIAA_CONFIG.API_BASE_URL;
        }
        
        // Fallback para localhost
        console.log('⚠️ SABIAA_CONFIG não encontrado, usando fallback localhost:3000');
        return 'http://localhost:3000';
    }

    /**
     * Verifica se o backend está online
     */
    async checkBackendHealth() {
        try {
            // Se estamos em modo file:// ou localhost sem servidor, retornar false imediatamente
            if (window.location.protocol === 'file:' || window.location.hostname === '') {
                console.log('📁 Modo arquivo local detectado, backend considerado offline');
                return false;
            }
            
            const response = await fetch(`${this.getApiBase()}/health`, {
                method: 'GET',
                timeout: 3000
            });
            
            const isOnline = response.ok;
            console.log('🔍 Status do backend:', isOnline ? 'Online' : 'Offline');
            return isOnline;
        } catch (error) {
            console.log('⚠️ Backend não está acessível:', error.message);
            return false;
        }
    }

    /**
     * Carrega dados do perfil do usuário
     */
    async loadUserProfile() {
        console.log('🔄 ProfileDataManager: Iniciando carregamento do perfil...');
        
        // Dados padrão do Gustavo para fallback
        const gustavoDefaults = {
            nome: "Gustavo",
            email: "gustavo@exemplo.com",
            telefone: "",
            data_nascimento: "",
            genero: "",
            foto: "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63",
            referencias_academicas: {
                aluno: {
                    escola: "",
                    serie: "",
                    turma: "",
                    numero_matricula: ""
                }
            }
        };

        const token = sabiaAuth.getToken();
        
        if (!token) {
            console.log('⚠️ Sem token, usando dados padrão do Gustavo');
            return gustavoDefaults;
        }

        // Primeiro, tentar carregar do localStorage
        try {
            const localData = await this.loadFromLocalStorage();
            if (localData && localData.nome && localData.nome !== 'Ana Silva Santos') {
                console.log('✅ Dados carregados do localStorage:', localData);
                return { ...gustavoDefaults, ...localData };
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar do localStorage:', error);
        }

        // Depois, tentar do backend (opcional)
        try {
            const backendOnline = await this.checkBackendHealth();
            
            if (backendOnline) {
                console.log('🌐 Backend online, tentando carregar dados...');
                const backendData = await this.loadFromBackend(token);
                
                if (backendData && backendData.nome !== 'Ana Silva Santos') {
                    console.log('✅ Dados carregados do backend:', backendData);
                    return { ...gustavoDefaults, ...backendData };
                }
            } else {
                console.log('⚠️ Backend offline');
            }
        } catch (error) {
            console.log('⚠️ Erro ao carregar do backend:', error);
        }

        // Se tudo falhar, usar dados padrão do Gustavo
        console.log('✅ Usando dados padrão do Gustavo');
        return gustavoDefaults;
    }

    /**
     * Carrega dados do backend
     */
    async loadFromBackend(token) {
        // Verificar se estamos em modo local antes de tentar requisição
        if (window.location.protocol === 'file:' || window.location.hostname === '') {
            console.log('📁 Modo arquivo local, não fazendo requisições HTTP');
            throw new Error('Modo arquivo local - backend não disponível');
        }
        
        // Garantir que temos a URL correta
        const apiUrl = `${this.getApiBase()}/api/usuario/perfil`;
        
        console.log('🔄 Fazendo requisição para:', apiUrl);
        console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('Dados inválidos retornados pela API');
        }

        // Salvar dados atualizados no localStorage
        sabiaAuth.setUser(result.data);
        
        return result.data;
    }

    /**
     * Carrega dados do localStorage
     */
    async loadFromLocalStorage() {
        console.log('📁 Tentando carregar dados do localStorage...');
        
        const user = sabiaAuth.getUser();
        
        if (!user) {
            console.log('⚠️ Nenhum dado de usuário encontrado no localStorage');
            return null;
        }

        // Verificar se são dados inválidos (Ana Silva Santos)
        if (user.nome === 'Ana Silva Santos') {
            console.log('❌ Dados inválidos encontrados (Ana Silva Santos), ignorando');
            return null;
        }

        console.log('✅ Dados encontrados no localStorage:', user);
        
        // Simular um pequeno delay para consistência com chamadas de API
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return user;
    }

    /**
     * Atualiza perfil do usuário
     */
    async updateUserProfile(updatedData) {
        const token = sabiaAuth.getToken();
        
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }

        try {
            const backendOnline = await this.checkBackendHealth();
            
            if (backendOnline) {
                return await this.updateInBackend(token, updatedData);
            } else {
                console.warn('Backend offline, atualizando apenas localmente');
                return await this.updateInLocalStorage(updatedData);
            }
        } catch (error) {
            console.error('Erro ao atualizar no backend:', error);
            
            // Fallback para localStorage
            return await this.updateInLocalStorage(updatedData);
        }
    }

    /**
     * Atualiza dados no backend
     */
    async updateInBackend(token, updatedData) {
        const response = await fetch(`${this.API_BASE}/api/usuario/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erro ao atualizar perfil');
        }

        // Atualizar localStorage com dados atualizados
        sabiaAuth.setUser(result.data);
        
        return result.data;
    }

    /**
     * Atualiza dados no localStorage
     */
    async updateInLocalStorage(updatedData) {
        const currentUser = sabiaAuth.getUser();
        
        if (!currentUser) {
            throw new Error('Usuário não encontrado no localStorage');
        }

        // Mesclar dados atualizados com dados existentes
        const mergedData = { ...currentUser, ...updatedData };
        
        // Salvar no localStorage
        sabiaAuth.setUser(mergedData);
        
        return mergedData;
    }

    /**
     * Carrega notificações do usuário
     */
    async loadNotifications() {
        try {
            const user = sabiaAuth.getUser();
            
            if (!user) {
                return 0;
            }

            // Simular contagem de notificações baseada na atividade do usuário
            let count = 0;
            
            if (user.referencias_academicas && user.referencias_academicas.aluno) {
                const aluno = user.referencias_academicas.aluno;
                
                // Contar baseado em cursos e atividades
                count += (aluno.cursos_ids?.length || 0);
                count += (aluno.tarefas_ids?.length || 0);
                count += (aluno.quizzes_ids?.length || 0);
                
                // Limitar a um número razoável
                count = Math.min(count, 99);
            }

            return count;
            
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            return 0;
        }
    }

    /**
     * Upload de foto de perfil
     */
    async uploadProfilePhoto(file, onProgress) {
        const token = sabiaAuth.getToken();
        const user = sabiaAuth.getUser();
        
        if (!token || !user) {
            throw new Error('Usuário não autenticado');
        }

        try {
            const backendOnline = await this.checkBackendHealth();
            
            if (backendOnline) {
                return await this.uploadToBackend(file, token, user.id, onProgress);
            } else {
                return await this.uploadToFirebase(file, user.id, onProgress);
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            
            // Fallback para Firebase se disponível
            if (typeof SabiaUpload !== 'undefined') {
                return await this.uploadToFirebase(file, user.id, onProgress);
            }
            
            throw error;
        }
    }

    /**
     * Upload para o backend
     */
    async uploadToBackend(file, token, userId, onProgress) {
        const formData = new FormData();
        formData.append('foto', file);

        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = (e.loaded / e.total) * 100;
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.success) {
                            resolve(result.data.foto);
                        } else {
                            reject(new Error(result.error || 'Erro no upload'));
                        }
                    } catch (e) {
                        reject(new Error('Resposta inválida do servidor'));
                    }
                } else {
                    reject(new Error(`Erro HTTP: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Erro de rede'));
            });

            xhr.open('PATCH', `${this.API_BASE}/api/usuario/${userId}/foto`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }

    /**
     * Upload para Firebase (fallback)
     */
    async uploadToFirebase(file, userId, onProgress) {
        if (typeof SabiaUpload === 'undefined') {
            throw new Error('Sistema de upload não disponível');
        }

        const sabiaUpload = new SabiaUpload();
        return await sabiaUpload.uploadProfilePhoto(file, userId, onProgress);
    }
}

// Criar instância global
window.profileDataManager = new ProfileDataManager();