// ===== SCRIPT PARA RECUPERAÇÃO DE SENHA ===== 

// Configuração da API
const API_BASE_URL = window.SABIAA_CONFIG?.API_BASE_URL || 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recovery-form');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('submit-btn');
    const messageContainer = document.getElementById('message-container');

    // Validação de email em tempo real
    emailInput.addEventListener('input', function() {
        validateEmail();
    });

    // Submissão do formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateEmail()) {
            sendRecoveryEmail();
        }
    });

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailError = document.getElementById('email-error');
        
        // Regex para validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            showFieldError('email-error', 'E-mail é obrigatório');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            showFieldError('email-error', 'E-mail inválido');
            return false;
        }
        
        hideFieldError('email-error');
        return true;
    }

    function showFieldError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '0.8em';
            errorElement.style.marginTop = '5px';
        }
    }

    function hideFieldError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    async function sendRecoveryEmail() {
        const email = emailInput.value.trim();
        
        // Mostrar loading
        showMessage('info', 'Enviando instruções...');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span>Enviando...';
        
        try {
            // Fazer solicitação de recuperação através da API
            const result = await sendRecoveryEmailReal(email);
            
            if (result.success) {
                // Sucesso - salvar token para próxima etapa
                sessionStorage.setItem('recovery_token', result.token);
                
                showMessage('success', `Instruções de recuperação enviadas para ${email}. Redirecionando...`);
                form.reset();
                
                // Aguardar e redirecionar para página de nova senha
                setTimeout(() => {
                    window.location.href = `nova_senha.html?token=${result.token}`;
                }, 3000);
            } else {
                showMessage('error', result.error || 'Erro ao enviar instruções');
            }
            
        } catch (error) {
            showMessage('error', 'Erro ao enviar instruções. Tente novamente.');
            console.error('Erro:', error);
        } finally {
            // Restaurar botão
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar Instruções';
        }
    }

    function showMessage(type, message) {
        messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        // Auto-hide info messages após 5 segundos
        if (type === 'info') {
            setTimeout(() => {
                messageContainer.innerHTML = '';
            }, 5000);
        }
    }

    // Integração real com backend
    async function sendRecoveryEmailReal(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/recuperar-senha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao enviar email');
            }
            
            return {
                success: true,
                message: data.message,
                token: data.recovery_token
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
});