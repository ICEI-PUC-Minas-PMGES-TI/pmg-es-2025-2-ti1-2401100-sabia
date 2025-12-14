// ===== SCRIPT PARA NOVA SENHA =====

// Configuração da API
const API_BASE_URL = window.SABIAA_CONFIG?.API_BASE_URL || 'https://sabiaa.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se temos token válido
    checkRecoveryToken();
    
    const form = document.getElementById('new-password-form');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const submitBtn = document.getElementById('submit-btn');
    const messageContainer = document.getElementById('message-container');

    // Elementos de validação
    const requirements = {
        length: document.getElementById('req-length'),
        uppercase: document.getElementById('req-uppercase'),
        lowercase: document.getElementById('req-lowercase'),
        number: document.getElementById('req-number'),
        special: document.getElementById('req-special'),
        match: document.getElementById('req-match')
    };

    // Validação em tempo real
    novaSenhaInput.addEventListener('input', function() {
        validatePassword();
        validatePasswordMatch();
    });

    confirmarSenhaInput.addEventListener('input', function() {
        validatePasswordMatch();
    });

    // Submissão do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (isFormValid()) {
            updatePassword();
        }
    });

    function validatePassword() {
        const password = novaSenhaInput.value;
        const validations = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        // Atualizar indicadores visuais
        updateValidationIcon('length', validations.length);
        updateValidationIcon('uppercase', validations.uppercase);
        updateValidationIcon('lowercase', validations.lowercase);
        updateValidationIcon('number', validations.number);
        updateValidationIcon('special', validations.special);

        return Object.values(validations).every(v => v);
    }

    function validatePasswordMatch() {
        const password = novaSenhaInput.value;
        const confirmPassword = confirmarSenhaInput.value;
        const isMatch = password && confirmPassword && password === confirmPassword;
        
        updateValidationIcon('match', isMatch);
        return isMatch;
    }

    function updateValidationIcon(requirement, isValid) {
        const element = requirements[requirement];
        if (!element) return;

        const icon = element.querySelector('.validation-icon');
        if (isValid) {
            icon.textContent = '✓';
            icon.className = 'validation-icon valid';
        } else {
            icon.textContent = '✗';
            icon.className = 'validation-icon invalid';
        }
    }

    function isFormValid() {
        const isPasswordValid = validatePassword();
        const isMatchValid = validatePasswordMatch();
        const isFormComplete = novaSenhaInput.value && confirmarSenhaInput.value;
        
        const isValid = isPasswordValid && isMatchValid && isFormComplete;
        
        // Atualizar estado do botão
        submitBtn.disabled = !isValid;
        
        return isValid;
    }

    // Verificar validade inicial e sempre que houver mudanças
    function checkFormValidity() {
        isFormValid();
    }

    // Verificar validade inicial
    checkFormValidity();

    // Verificar validade a cada mudança
    novaSenhaInput.addEventListener('input', checkFormValidity);
    confirmarSenhaInput.addEventListener('input', checkFormValidity);

    async function updatePassword() {
        const novaSenha = novaSenhaInput.value;
        const token = getRecoveryToken();
        
        // Verificar se temos o token
        if (!token) {
            showMessage('error', 'Token de recuperação não encontrado. Solicite a recuperação novamente.');
            setTimeout(() => {
                window.location.href = 'enviar_instrucoes.html';
            }, 2000);
            return;
        }
        
        // Mostrar loading
        showMessage('info', 'Atualizando senha...');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span>Atualizando...';
        
        try {
            // Fazer alteração de senha através da API
            const result = await updatePasswordReal(novaSenha, token);
            
            if (result.success) {
                // Sucesso - limpar token
                clearRecoveryToken();
                
                showMessage('success', 'Senha atualizada com sucesso! Redirecionando...');
                form.reset();
                
                // Redirecionar para login após 2 segundos
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 2000);
            } else {
                showMessage('error', result.error || 'Erro ao atualizar senha');
                
                // Restaurar botão
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Redefinir Senha';
            }
            
        } catch (error) {
            showMessage('error', 'Erro ao atualizar senha. Tente novamente.');
            console.error('Erro:', error);
            
            // Restaurar botão
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Redefinir Senha';
        }
    }

    function showMessage(type, message) {
        messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        // Auto-hide info messages após 5 segundos
        if (type === 'info') {
            setTimeout(() => {
                if (messageContainer.innerHTML.includes(message)) {
                    messageContainer.innerHTML = '';
                }
            }, 5000);
        }
    }

    // Integração real com backend  
    async function updatePasswordReal(newPassword, token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/alterar-senha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    nova_senha: newPassword,
                    recovery_token: token 
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao atualizar senha');
            }
            
            return {
                success: true,
                message: data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Funções para gerenciar token de recuperação
    function getRecoveryToken() {
        // Tentar obter do URL primeiro
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        
        if (tokenFromUrl) {
            sessionStorage.setItem('recovery_token', tokenFromUrl);
            return tokenFromUrl;
        }
        
        // Caso contrário, obter do sessionStorage
        return sessionStorage.getItem('recovery_token');
    }

    function clearRecoveryToken() {
        sessionStorage.removeItem('recovery_token');
    }

    async function checkRecoveryToken() {
        const token = getRecoveryToken();
        
        if (!token) {
            showMessage('error', 'Token de recuperação não encontrado. Redirecionando...');
            setTimeout(() => {
                window.location.href = 'enviar_instrucoes.html';
            }, 2000);
            return;
        }

        // Verificar se o token é válido
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verificar-token-recuperacao`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recovery_token: token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Token inválido');
            }

            console.log('Token válido para:', data.email);
        } catch (error) {
            showMessage('error', 'Token inválido ou expirado. Redirecionando...');
            clearRecoveryToken();
            setTimeout(() => {
                window.location.href = 'enviar_instrucoes.html';
            }, 2000);
        }
    }
});

// Função para alternar visibilidade da senha
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}