// ===== JAVASCRIPT DA PÁGINA DE LOGIN - SABIAA =====

document.addEventListener('DOMContentLoaded', function() {
    
    // Toggle para mostrar/ocultar senha
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alterna o ícone
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Gerenciamento do formulário de login
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Aguardar o carregamento do sabiaAuth se necessário
            if (typeof sabiaAuth === 'undefined') {
                console.warn('sabiaAuth não está disponível ainda, aguardando...');
                
                // Aguardar até 3 segundos pelo carregamento do script
                let attempts = 0;
                const maxAttempts = 30; // 3 segundos (100ms * 30)
                
                const waitForAuth = () => {
                    if (typeof sabiaAuth !== 'undefined') {
                        handleLoginSubmit();
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(waitForAuth, 100);
                    } else {
                        console.error('sabiaAuth não foi carregado após 3 segundos');
                        showMessage('Erro: Sistema de autenticação não disponível. Recarregue a página.');
                    }
                };
                
                waitForAuth();
                return;
            }
            
            handleLoginSubmit();
        });
    }
    
    // Função para lidar com o login
    async function handleLoginSubmit() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validação básica
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        if (!validateEmail(email)) {
            showMessage('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        // Mostrar loading
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Entrando...';
        submitBtn.disabled = true;
        
        try {
            // Fazer login através do sistema de autenticação
            const result = await sabiaAuth.login(email, password);
            
            if (result.success) {
                // Salvar no localStorage se "Lembrar-me" estiver marcado
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                showMessage(result.message, 'success');
                
                // Aguardar um pouco e redirecionar
                setTimeout(() => {
                    sabiaAuth.redirectAfterLogin();
                }, 1500);
                
            } else {
                showMessage(result.error, 'error');
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            showMessage('Erro interno. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Carregar email lembrado
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
    
    // Validação de e-mail
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Função para mostrar mensagens (será melhorada com um toast/alert customizado)
    function showMessage(message, type) {
        // TODO: Implementar sistema de notificações visual
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message); // Temporário - substituir por componente visual
    }
    
    // Animação suave nos inputs ao focar
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});