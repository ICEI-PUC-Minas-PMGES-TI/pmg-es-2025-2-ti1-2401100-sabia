// Script de Cadastro de Usuários - Funcional
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await realizarCadastro();
        });
    }

    // Verificar senha em tempo real
    const senha = document.getElementById('password');
    const confirmarSenha = document.getElementById('confirmPassword');
    
    if (confirmarSenha) {
        confirmarSenha.addEventListener('input', () => {
            if (senha.value !== confirmarSenha.value) {
                confirmarSenha.setCustomValidity('As senhas não coincidem');
                confirmarSenha.style.borderColor = '#DC3545';
            } else {
                confirmarSenha.setCustomValidity('');
                confirmarSenha.style.borderColor = '#28A745';
            }
        });
    }
});

async function realizarCadastro() {
    const nome = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const confirmarSenha = document.getElementById('confirmPassword').value;
    const termos = document.getElementById('terms').checked;

    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
        alert('❌ Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    if (senha !== confirmarSenha) {
        alert('❌ As senhas não coincidem.');
        return;
    }

    if (senha.length < 6) {
        alert('❌ A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    if (!termos) {
        alert('❌ Você deve aceitar os termos de uso.');
        return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Email inválido.');
        return;
    }

    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

    try {
        // Verificar se email já existe
        const checkResponse = await fetch(`${API_URL}/usuarios?email=${email}`);
        const usuariosExistentes = await checkResponse.json();

        if (usuariosExistentes.length > 0) {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
        }

        // Criar novo usuário
        const novoUsuario = {
            nome: nome,
            email: email,
            senha: senha, // Em produção, usar hash!
            tipo: 'aluno',
            foto: '/codigo/public/assets/images/default-aluno-avatar.svg',
            data_cadastro: new Date().toISOString(),
            bio: '',
            telefone: ''
        };

        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoUsuario)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar usuário no servidor');
        }

        const usuarioCriado = await response.json();
        console.log('✅ Usuário criado:', usuarioCriado);

        // Fazer login automático
        if (typeof sabiaAuth !== 'undefined') {
            const userToSave = {
                id: usuarioCriado.id,
                nome: usuarioCriado.nome,
                email: usuarioCriado.email,
                foto: usuarioCriado.foto,
                tipo: usuarioCriado.tipo
            };
            sabiaAuth.saveUser(userToSave);
        }

        submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastro realizado!';
        submitBtn.style.background = '#28A745';

        alert('✅ Cadastro realizado com sucesso! Redirecionando...');

        // Redirecionar para dashboard
        setTimeout(() => {
            window.location.href = '/codigo/public/modules/dashboard/dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('❌ Erro no cadastro:', error);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        alert('❌ Erro no cadastro: ' + error.message + '\n\nVerifique se o json-server está rodando.');
    }
}

// Toggle senha
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    
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

// Adicionar toggle aos campos de senha se existirem
document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    
    if (passwordField) {
        const toggleBtn = document.createElement('i');
        toggleBtn.className = 'fas fa-eye';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '10px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.onclick = () => togglePasswordVisibility('password');
        
        if (passwordField.parentElement) {
            passwordField.parentElement.style.position = 'relative';
            passwordField.parentElement.appendChild(toggleBtn);
        }
    }
});
