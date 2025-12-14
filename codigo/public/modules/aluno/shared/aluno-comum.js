// aluno-comum.js - funcionalidades compartilhadas entre perfil e certificados

// funcoes de autenticacao
const alunoAuth = {
    // verifica se o usuario esta logado
    isLoggedIn() {
        const token = localStorage.getItem('sabiaa_token');
        const user = localStorage.getItem('sabiaa_user');
        return token && user;
    },
    
    // obtem dados do usuario logado
    getUser() {
        try {
            const userData = localStorage.getItem('sabiaa_user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('erro ao obter dados do usuario:', error);
            return null;
        }
    },
    
    // salva dados do usuario
    setUser(userData) {
        try {
            localStorage.setItem('sabiaa_user', JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('erro ao salvar dados do usuario:', error);
            return false;
        }
    },
    
    // desloga o usuario
    logout() {
        localStorage.removeItem('sabiaa_token');
        localStorage.removeItem('sabiaa_user');
    }
};

// funcoes de interface comum
const alunoUI = {
    // mostra loading
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
    },
    
    // esconde loading
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    },
    
    // mostra erro
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
        }
        
        this.hideLoading();
    },
    
    // esconde erro
    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) errorDiv.style.display = 'none';
    },
    
    // atualiza badge de notificacoes
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationCount');
        if (badge) {
            if (count > 0) {
                badge.textContent = Math.min(count, 99);
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    },
    
    // atualiza foto do usuario no header
    updateUserPhoto(photoUrl, userName) {
        const elements = ['headerUserAvatar', 'profileHeaderAvatar', 'currentPhoto'];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                // adiciona timestamp para cache busting
                const timestamp = new Date().getTime();
                const photoWithCache = photoUrl + (photoUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
                
                element.src = photoWithCache;
                element.alt = `foto de ${userName}`;
                
                // fallback em caso de erro
                element.onerror = function() {
                    console.log('erro ao carregar foto, usando padrao');
                    this.src = '../../../../assets/images/logos/logo_simbolo_branco.png';
                };
            }
        });
    },
    
    // atualiza nome do usuario no header
    updateUserName(userName) {
        const elements = ['headerUserName', 'profileHeaderName'];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = userName || 'usuario';
            }
        });
    }
};

// funcoes de validacao
const alunoValidation = {
    // valida email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // valida telefone brasileiro
    isValidPhone(phone) {
        const phoneRegex = /^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/;
        return phoneRegex.test(phone);
    },
    
    // valida data de nascimento
    isValidBirthDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        
        return date <= now && age >= 5 && age <= 120;
    }
};

// funcoes de estatisticas do aluno
const alunoStats = {
    // calcula estatisticas do usuario
    calculateStats(user) {
        let cursosCount = 0;
        let progresso = 0;
        let pontos = 0;

        if (user.referencias_academicas && user.referencias_academicas.aluno) {
            const aluno = user.referencias_academicas.aluno;
            
            // conta cursos
            cursosCount = aluno.cursos_ids ? aluno.cursos_ids.length : 0;
            
            // calcula progresso baseado em tarefas e quizzes completados
            const tarefasCount = aluno.tarefas_ids ? aluno.tarefas_ids.length : 0;
            const quizzesCount = aluno.quizzes_ids ? aluno.quizzes_ids.length : 0;
            
            // simula progresso baseado na atividade
            if (cursosCount > 0) {
                progresso = Math.min(100, Math.round(((tarefasCount + quizzesCount) / (cursosCount * 5)) * 100));
            }
            
            // calcula pontos baseado na atividade
            pontos = (tarefasCount * 10) + (quizzesCount * 15) + (cursosCount * 25);
        }

        return { cursosCount, progresso, pontos };
    },
    
    // atualiza interface com estatisticas
    updateStatsUI(stats) {
        if (document.getElementById('statCursos')) {
            document.getElementById('statCursos').textContent = stats.cursosCount;
        }
        if (document.getElementById('statProgresso')) {
            document.getElementById('statProgresso').textContent = stats.progresso + '%';
        }
        if (document.getElementById('statPontos')) {
            document.getElementById('statPontos').textContent = stats.pontos;
        }
    }
};

// funcoes de modal
const alunoModal = {
    // abre modal
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    },
    
    // fecha modal
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Use important to override any injected stylesheet forcing display
            try {
                modal.style.setProperty('display', 'none', 'important');
            } catch (e) {
                modal.style.display = 'none';
            }
            modal.classList.remove('show');
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            document.body.style.overflow = 'auto';
            // remove fallback styles injected by page scripts if present
            const injected = document.getElementById('certModalFallbackStyles');
            if (injected && injected.parentNode) {
                try { injected.parentNode.removeChild(injected); } catch (e) { /* ignore */ }
            }
        }
    },
    
    // fecha modal clicando fora
    setupClickOutside(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close(modalId);
                }
            });
        }
    }
};

// funcao de logout global
function logout() {
    if (confirm('tem certeza que deseja sair?')) {
        alunoAuth.logout();
        window.location.href = '../../../login/login.html';
    }
}

// inicializacao comum
document.addEventListener('DOMContentLoaded', () => {
    // verifica autenticacao
    if (!alunoAuth.isLoggedIn()) {
        console.log('usuario nao esta logado, redirecionando...');
        window.location.href = '../../../login/login.html';
        return;
    }
    
    // carrega dados basicos do usuario no header
    const userData = alunoAuth.getUser();
    if (userData) {
        alunoUI.updateUserName(userData.nome);
        
        // usa foto padrão do sistema se não tiver foto personalizada
        const defaultPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
        const photoToUse = (userData.foto && !userData.foto.includes('logo_simbolo')) ? userData.foto : defaultPhoto;
        
        alunoUI.updateUserPhoto(photoToUse, userData.nome);
        
        // atualiza notificacoes
        const stats = alunoStats.calculateStats(userData);
        const notificationCount = Math.min(stats.cursosCount + (userData.referencias_academicas?.aluno?.tarefas_ids?.length || 0), 99);
        alunoUI.updateNotificationBadge(notificationCount);
    }
    
    // setup do menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar?.classList.remove('show');
        });
    }
    
    // setup de modais comuns
    ['confirmModal', 'successModal'].forEach(modalId => {
        alunoModal.setupClickOutside(modalId);
    });
    
    console.log('sistema do aluno inicializado com sucesso');
});