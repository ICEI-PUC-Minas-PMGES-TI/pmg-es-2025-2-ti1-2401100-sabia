// ===== JAVASCRIPT DA PÁGINA DE CADASTRO - SABIAA =====

document.addEventListener('DOMContentLoaded', function() {
    
    let currentStep = 1;
    let selectedPlatform = '';
    let selectedProfile = '';
    const totalSteps = 4;
    
    // Elementos do DOM
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.btn-next');
    const backButtons = document.querySelectorAll('.btn-back');
    const submitButton = document.querySelector('.btn-submit');
    const signupForm = document.getElementById('signupForm');
    
    // === CONFIGURAÇÃO DO UPLOAD DE FOTO ===
    const photoInput = document.getElementById('profilePhoto');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    const photoPlaceholder = document.getElementById('photoPlaceholder');
    
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validar arquivo
                if (!window.SABIAA_CONFIG.UPLOAD.allowedTypes.includes(file.type)) {
                    alert('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
                    return;
                }
                
                if (file.size > window.SABIAA_CONFIG.UPLOAD.maxSize) {
                    alert('Arquivo muito grande. Máximo 5MB.');
                    return;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreviewImg.src = e.target.result;
                    photoPreviewImg.style.display = 'block';
                    if (photoPlaceholder) {
                        photoPlaceholder.style.display = 'none';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // === NAVEGAÇÃO ENTRE ETAPAS ===
    
    function showStep(stepNumber) {
        steps.forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === stepNumber) {
                step.classList.add('active');
            }
        });
        
        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index + 1 < stepNumber) {
                indicator.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                indicator.classList.add('active');
            }
        });
        
        currentStep = stepNumber;
        window.scrollTo(0, 0);
    }
    
    // Botões "Continuar"
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    showStep(currentStep + 1);
                }
            }
        });
    });
    
    // Botões "Voltar"
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    });
    
    // === SELEÇÃO DE PLATAFORMA (Etapa 1) ===
    
    const platformCards = document.querySelectorAll('.platform-card');
    
    platformCards.forEach(card => {
        card.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Remove seleção anterior
            platformCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedPlatform = this.dataset.platform;
            
            // Habilita botão "Continuar"
            const nextBtn = document.querySelector('[data-step="1"] .btn-next');
            nextBtn.disabled = false;
            
            // Configura opções de perfil baseado na plataforma
            configurarPerfilPorPlataforma();
        });
    });
    
    function configurarPerfilPorPlataforma() {
        const professorCard = document.querySelector('[data-profile="professor"]');
        
        if (selectedPlatform === 'cursos') {
            // SABIAA Cursos: apenas Aluno disponível
            professorCard.classList.add('disabled');
            professorCard.querySelector('input').disabled = true;
            
            // Auto-selecionar Aluno
            const alunoCard = document.querySelector('[data-profile="aluno"]');
            const alunoRadio = alunoCard.querySelector('input');
            alunoRadio.checked = true;
            alunoCard.classList.add('selected');
            selectedProfile = 'aluno';
        } else {
            // SABIAA Educação: ambos disponíveis
            professorCard.classList.remove('disabled');
            professorCard.querySelector('input').disabled = false;
        }
    }
    
    // === SELEÇÃO DE TIPO DE PERFIL (Etapa 2) ===
    
    const profileCards = document.querySelectorAll('.profile-type-card');
    
    profileCards.forEach(card => {
        card.addEventListener('click', function() {
            if (this.classList.contains('disabled')) return;
            
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Remove seleção anterior
            profileCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedProfile = this.dataset.profile;
            
            // Habilita botão "Continuar"
            const nextBtn = document.querySelector('[data-step="2"] .btn-next');
            nextBtn.disabled = false;
            
            // Configura campos específicos da etapa 4
            configurarCamposEspecificos();
        });
    });
    
    // === CONFIGURAR CAMPOS ESPECÍFICOS (Etapa 4) ===
    
    function configurarCamposEspecificos() {
        // Ocultar todos os campos específicos
        document.getElementById('cursos-aluno-fields').style.display = 'none';
        document.getElementById('educacao-aluno-fields').style.display = 'none';
        document.getElementById('educacao-professor-fields').style.display = 'none';
        
        const title = document.getElementById('specificFieldsTitle');
        
        // Mostrar campos baseado na combinação de plataforma e perfil
        if (selectedPlatform === 'cursos' && selectedProfile === 'aluno') {
            document.getElementById('cursos-aluno-fields').style.display = 'block';
            title.textContent = 'Informações sobre seu aprendizado';
            
            // Remover required dos outros campos
            removerRequiredOutrosCampos('cursos-aluno-fields');
        } 
        else if (selectedPlatform === 'educacao' && selectedProfile === 'aluno') {
            document.getElementById('educacao-aluno-fields').style.display = 'block';
            title.textContent = 'Informações da sua escola';
            
            removerRequiredOutrosCampos('educacao-aluno-fields');
        } 
        else if (selectedPlatform === 'educacao' && selectedProfile === 'professor') {
            document.getElementById('educacao-professor-fields').style.display = 'block';
            title.textContent = 'Informações profissionais';
            
            removerRequiredOutrosCampos('educacao-professor-fields');
        }
    }
    
    function removerRequiredOutrosCampos(campoAtivo) {
        const todosOsCampos = ['cursos-aluno-fields', 'educacao-aluno-fields', 'educacao-professor-fields'];
        
        todosOsCampos.forEach(campo => {
            const container = document.getElementById(campo);
            const inputs = container.querySelectorAll('input, select');
            
            inputs.forEach(input => {
                if (campo === campoAtivo) {
                    // Adicionar required aos campos visíveis que precisam
                    if (input.id && (input.id.includes('Code') || input.id.includes('grade') || 
                        input.id.includes('classroom') || input.id.includes('studentId') ||
                        input.id.includes('subjectsTaught') || input.id.includes('teacherId') ||
                        input.id.includes('academicDegree') || input.id.includes('interestArea'))) {
                        input.setAttribute('required', 'required');
                    }
                } else {
                    // Remover required dos campos ocultos
                    input.removeAttribute('required');
                }
            });
        });
    }
    
    // === VALIDAÇÃO DOS CAMPOS (Etapa 3) ===
    
    const basicInputs = document.querySelectorAll('[data-step="3"] input');
    basicInputs.forEach(input => {
        input.addEventListener('input', function() {
            validateStep3();
        });
    });
    
    function validateStep3() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const nextBtn = document.querySelector('[data-step="3"] .btn-next');
        
        if (firstName && lastName && email && password.length >= 6 && 
            password === confirmPassword && validateEmail(email)) {
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
        
        // Validação visual de senha
        const confirmInput = document.getElementById('confirmPassword');
        if (confirmPassword) {
            if (password === confirmPassword) {
                confirmInput.style.borderColor = '#28a745';
            } else {
                confirmInput.style.borderColor = '#dc3545';
            }
        }
    }
    
    // === VALIDAÇÃO GERAL ===
    
    function validateCurrentStep() {
        switch(currentStep) {
            case 1:
                return selectedPlatform !== '';
            case 2:
                return selectedProfile !== '';
            case 3:
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (!firstName || !lastName) {
                    showMessage('Por favor, preencha seu nome completo.', 'error');
                    return false;
                }
                
                if (!validateEmail(email)) {
                    showMessage('Por favor, insira um e-mail válido.', 'error');
                    return false;
                }
                
                if (password.length < 6) {
                    showMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
                    return false;
                }
                
                if (password !== confirmPassword) {
                    showMessage('As senhas não coincidem.', 'error');
                    return false;
                }
                
                return true;
            default:
                return true;
        }
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // === ENVIO DO FORMULÁRIO ===
    
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Coletar todos os dados
        const formData = {
            plataforma: selectedPlatform,
            tipo: selectedProfile,
            nome: document.getElementById('firstName').value,
            sobrenome: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            senha: document.getElementById('password').value,
            telefone: document.getElementById('phone').value,
            data_nascimento: document.getElementById('birthdate').value
        };
        
        // Adicionar campos específicos baseado na seleção
        if (selectedPlatform === 'cursos' && selectedProfile === 'aluno') {
            formData.area_interesse = document.getElementById('interestArea').value;
            formData.nivel_educacao = document.getElementById('educationLevel').value;
            formData.objetivo_aprendizagem = document.getElementById('learningGoal').value;
        } 
        else if (selectedPlatform === 'educacao' && selectedProfile === 'aluno') {
            formData.codigo_escola = document.getElementById('schoolCode').value;
            formData.serie = document.getElementById('grade').value;
            formData.turma = document.getElementById('classroom').value;
            formData.id_estudante = document.getElementById('studentId').value;
        } 
        else if (selectedPlatform === 'educacao' && selectedProfile === 'professor') {
            formData.codigo_escola = document.getElementById('schoolCodeProf').value;
            formData.disciplinas = document.getElementById('subjectsTaught').value;
            formData.experiencia_ensino = document.getElementById('teachingExperience').value;
            formData.id_professor = document.getElementById('teacherId').value;
            formData.formacao_academica = document.getElementById('academicDegree').value;
        }
        
        // Mostrar loading
        const submitBtn = this.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Criando conta...';
        submitBtn.disabled = true;
        
        try {
            // Verificar se há foto para upload
            const photoFile = photoInput?.files[0];
            let fotoUrl = '';
            
            if (photoFile) {
                submitBtn.textContent = 'Enviando foto...';
                
                try {
                    // Gerar ID temporário para o upload
                    const tempUserId = 'temp_' + Date.now();
                    
                    // Fazer upload da foto
                    const sabiaUpload = new SabiaUpload();
                    fotoUrl = await sabiaUpload.uploadProfilePhoto(photoFile, tempUserId, (progress) => {
                        submitBtn.textContent = `Enviando foto... ${Math.round(progress)}%`;
                    });
                    
                    console.log('Foto enviada com sucesso:', fotoUrl);
                    
                } catch (uploadError) {
                    console.error('Erro no upload da foto:', uploadError);
                    // Continuar cadastro sem foto em caso de erro
                    showMessage('Erro ao enviar foto, mas o cadastro continuará sem ela.', 'warning');
                }
            }
            
            // Adicionar URL da foto aos dados
            formData.foto = fotoUrl;
            
            submitBtn.textContent = 'Finalizando cadastro...';
            
            // Verificar se sabiaAuth está disponível
            if (typeof sabiaAuth === 'undefined') {
                throw new Error('Sistema de autenticação não carregado. Recarregue a página.');
            }
            
            // Fazer cadastro através do sistema de autenticação
            const result = await sabiaAuth.cadastro(formData);
            
            if (result.success) {
                // Se teve upload de foto e cadastro foi bem-sucedido, mover foto para ID real
                if (fotoUrl && result.user && result.user.id) {
                    try {
                        submitBtn.textContent = 'Organizando arquivos...';
                        
                        const sabiaUpload = new SabiaUpload();
                        const finalPhotoUrl = await sabiaUpload.movePhotoToRealUser(fotoUrl, result.user.id);
                        
                        // Atualizar URL da foto no banco de dados via API
                        if (finalPhotoUrl !== fotoUrl) {
                            await fetch(`${window.SABIAA_CONFIG.API_BASE_URL}/api/usuarios/${result.user.id}/foto`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${result.token || sabiaAuth.getToken()}`
                                },
                                body: JSON.stringify({ foto: finalPhotoUrl })
                            });
                        }
                        
                        console.log('Foto finalizada:', finalPhotoUrl);
                        
                    } catch (photoMoveError) {
                        console.error('Erro ao organizar foto:', photoMoveError);
                        // Não falhar o cadastro por causa disso
                    }
                }
                
                showMessage(result.message, 'success');
                
                // Aguardar um pouco e redirecionar para login
                setTimeout(() => {
                    window.location.href = '/codigo/public/modules/auth/login.html';
                }, 2000);
                
            } else {
                showMessage(result.error, 'error');
            }
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            showMessage('Erro interno. Tente novamente.', 'error');
        } finally {
            // Restaurar botão
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    // === FUNÇÕES AUXILIARES ===
    
    function showMessage(message, type) {
        // TODO: Implementar sistema de notificações visual
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message); // Temporário - substituir por componente visual
    }
    
    // Máscara para telefone
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 10) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length > 6) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            
            e.target.value = value;
        });
    }
    
});