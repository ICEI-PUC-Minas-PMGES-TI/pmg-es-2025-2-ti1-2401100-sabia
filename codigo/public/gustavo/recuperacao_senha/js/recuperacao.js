// ===== SCRIPT PARA RECUPERAÇÃO DE SENHA ===== 

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
            // Fazer solicitação de recuperação através do sistema de autenticação
            const result = await sabiaAuth.recuperarSenha(email);
            
            if (result.success) {
                // Sucesso - salvar token para próxima etapa
                sessionStorage.setItem('recovery_token', result.token);
                
                showMessage('success', `Instruções de recuperação enviadas para ${email}. Verifique sua caixa de entrada.`);
                form.reset();
                
                // Aguardar e redirecionar para página de nova senha
                setTimeout(() => {
                    window.location.href = 'nova_senha.html';
                }, 3000);
            } else {
                showMessage('error', result.error);
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

    function simulateEmailSending(email) {
        return new Promise((resolve, reject) => {
            // Simular tempo de resposta do servidor
            setTimeout(() => {
                // Simular algumas condições
                if (email.includes('test-error')) {
                    reject(new Error('Email inválido'));
                } else {
                    resolve({
                        success: true,
                        message: 'Email enviado com sucesso'
                    });
                }
            }, 2000); // 2 segundos de delay
        });
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

    // TODO: Substituir pela integração real com backend
    /*
    async function sendRecoveryEmailReal(email) {
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao enviar email');
            }
            
            return data;
        } catch (error) {
            throw error;
        }
    }
    */
});