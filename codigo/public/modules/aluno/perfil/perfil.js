// perfil.js - funcionalidades especificas da pagina de perfil

let isEditing = false;
let originalData = {};

// carrega dados do perfil do usuario
async function loadProfileData() {
    try {
        console.log('Carregando dados do perfil...');

        // Verifica se está logado usando a função compartilhada
        const userData = sabiaAuth.getUser();
        if (!userData) {
            console.log('Usuário não logado, redirecionando...');
            window.location.href = '/codigo/public/modules/auth/login.html';
            return;
        }

        console.log(`Carregando perfil para: ${userData.nome}`);
        populateForm(userData);
        updateUserHeader(userData);
        
        // calcula e renderiza estatísticas do aluno
        try {
            await calculateAndRenderStats(userData.id);
        } catch (e) {
            console.warn('Não foi possível calcular estatísticas:', e.message || e);
        }
        
        console.log('Perfil carregado com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        window.location.href = '/codigo/public/modules/auth/login.html';
    }
}

// Calcula estatísticas do aluno (cursos inscritos, progresso médio, pontos)
async function calculateAndRenderStats(userId) {
    if (!userId) return;
    const API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'https://sabiaa.onrender.com';

    try {
        const res = await fetch(`${API_BASE}/api/inscricoes?aluno_id=${userId}`);
        if (!res.ok) {
            console.warn('Falha ao buscar inscrições:', res.status);
            return;
        }

        const raw = await res.json();
        let arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.value) ? raw.value : []);

        const cursosCount = arr.length;
        const totalProgress = arr.reduce((s, it) => s + (Number(it.progresso) || 0), 0);
        const avgProgress = cursosCount ? Math.round(totalProgress / cursosCount) : 0;
        const pontos = arr.reduce((s, it) => s + (Array.isArray(it.aulas_concluidas) ? it.aulas_concluidas.length : 0), 0);

        const elCursos = document.getElementById('statCursos');
        const elProgresso = document.getElementById('statProgresso');
        const elPontos = document.getElementById('statPontos');

        if (elCursos) elCursos.textContent = cursosCount;
        if (elProgresso) elProgresso.textContent = `${avgProgress}%`;
        if (elPontos) elPontos.textContent = pontos;

    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
    }
}

// popula o formulario com dados do usuario
function populateForm(user) {
    if (!user) {
        console.error('Nenhum dado de usuário fornecido');
        return;
    }
    
    // dados pessoais basicos
    const fields = [
        { id: 'nome', value: user.nome },
        { id: 'email', value: user.email },
        { id: 'telefone', value: user.telefone },
        { id: 'data_nascimento', value: user.data_nascimento },
        { id: 'genero', value: user.genero }
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value || '';
        }
    });

    // atualiza interface
    updateUserInterface(user);
    
    // foto do usuario - usa foto padrao se nao tiver personalizada
    const defaultPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    const photoToUse = (user.foto && !user.foto.includes('logo_simbolo')) ? user.foto : defaultPhoto;

    // dados academicos
    if (user.referencias_academicas?.aluno) {
        const aluno = user.referencias_academicas.aluno;
        const academicFields = [
            { id: 'escola', value: aluno.escola },
            { id: 'serie', value: aluno.serie },
            { id: 'turma', value: aluno.turma },
            { id: 'matricula', value: aluno.numero_matricula }
        ];
        
        academicFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.value = field.value || '';
            }
        });
    }

    // Salva dados originais para cancelar edição
    originalData = { ...user };
    console.log('Formulário populado com sucesso');
}

// Atualiza interface do usuário (nome e fotos)
function updateUserInterface(user) {
    if (!user) return;
    
    // Atualiza nome no header pequeno
    const headerUserName = document.getElementById('headerUserName');
    if (headerUserName) {
        headerUserName.textContent = user.nome || 'Usuário';
    }
    
    // Atualiza nome no header grande do perfil
    const profileHeaderName = document.getElementById('profileHeaderName');
    if (profileHeaderName) {
        profileHeaderName.textContent = user.nome || 'Usuário';
    }
    
    // Determina foto a usar
    const defaultPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    const photoToUse = (user.foto && !user.foto.includes('logo_simbolo')) ? user.foto : defaultPhoto;
    
    // Atualiza foto no header pequeno
    const headerUserAvatar = document.getElementById('headerUserAvatar');
    if (headerUserAvatar) {
        headerUserAvatar.src = photoToUse;
        headerUserAvatar.alt = user.nome || 'Avatar';
    }
    
    // Atualiza foto grande no perfil
    const profileHeaderAvatar = document.getElementById('profileHeaderAvatar');
    if (profileHeaderAvatar) {
        profileHeaderAvatar.src = photoToUse;
        profileHeaderAvatar.alt = user.nome || 'Foto do perfil';
    }
    
    // Atualiza preview da foto atual
    const currentPhotoPreview = document.getElementById('currentPhotoPreview');
    if (currentPhotoPreview) {
        currentPhotoPreview.src = photoToUse;
    }
}

// atualiza header do usuario (mantido para compatibilidade)
function updateUserHeader(user) {
    updateUserInterface(user);
}

// habilita/desabilita edicao do perfil
function toggleEdit() {
    isEditing = !isEditing;
    
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');
    const formActions = document.getElementById('formActions');
    
    inputs.forEach(input => {
        // email nao pode ser editado
        if (input.name !== 'email') {
            input.readOnly = !isEditing;
            input.disabled = !isEditing;
        }
    });

    // mostra/esconde botoes de acao
    if (formActions) {
        formActions.style.display = isEditing ? 'block' : 'none';
    }
    
    // atualiza texto do botao editar
    const editBtn = document.querySelector('[onclick="toggleEdit()"]');
    if (editBtn) {
        const icon = editBtn.querySelector('i');
        const text = editBtn.querySelector('span') || editBtn;
        
        if (isEditing) {
            if (icon) icon.className = 'fas fa-times';
            text.textContent = 'cancelar';
        } else {
            if (icon) icon.className = 'fas fa-edit';
            text.textContent = 'editar';
        }
    }
}

// cancela edicao e restaura dados originais
function cancelEdit() {
    populateForm(originalData);
    toggleEdit();
}

// salva alteracoes do perfil
async function saveProfile() {
    try {
        const formData = new FormData(document.getElementById('profileForm'));
        const updatedData = Object.fromEntries(formData.entries());
        
        // validacao basica
        if (!updatedData.nome || !updatedData.nome.trim()) {
            alert('nome e obrigatorio');
            return;
        }
        
        // Validações básicas
        if (updatedData.email && !updatedData.email.includes('@')) {
            alert('E-mail inválido');
            return;
        }
        
        if (updatedData.telefone && updatedData.telefone.length < 10) {
            alert('Telefone inválido');
            return;
        }

        console.log('Salvando alterações:', updatedData);
        
        // Simula salvamento (seria uma chamada para API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Perfil atualizado com sucesso!');
        toggleEdit();
        
        // atualiza dados locais usando funcao compartilhada
        const currentUser = sabiaAuth.getUser();
        const updatedUser = { ...currentUser, ...updatedData };
        sabiaAuth.setUser(updatedUser);
        
        // recarrega dados atualizados
        populateForm(updatedUser);
        // const stats = alunoStats.calculateStats(updatedUser);
        // alunoStats.updateStatsUI(stats);
        
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar perfil: ' + error.message);
    }
}

// configura upload de foto
function setupPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await uploadProfilePhoto(file);
            }
        });
    }
}

// faz upload da foto do perfil
async function uploadProfilePhoto(file) {
    try {
        // validacao do arquivo
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (file.size > maxSize) {
            alert('arquivo muito grande. maximo 5MB');
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            alert('tipo de arquivo nao suportado. use jpeg, png ou webp');
            return;
        }

        // mostra progresso
        const progressDiv = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressDiv) progressDiv.style.display = 'block';

        // simula upload com progresso
        for (let i = 0; i <= 100; i += 10) {
            if (progressFill) progressFill.style.width = `${i}%`;
            if (progressText) progressText.textContent = `${i}%`;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // gera url simulada (em producao seria url real do upload)
        const photoUrl = `https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2F${Date.now()}.jpeg?alt=media&token=${Math.random().toString(36)}`;

        console.log('Foto enviada:', photoUrl);

        // Atualiza dados do usuário
        const currentUser = sabiaAuth.getUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, foto: photoUrl };
            sabiaAuth.setUser(updatedUser);
            console.log('Dados do usuário atualizados com nova foto');
            
            // atualiza interface com a nova foto
            updateUserInterface(updatedUser);
        }

        if (progressDiv) progressDiv.style.display = 'none';
        alert('Foto atualizada com sucesso!');

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao enviar foto: ' + error.message);
        
        const progressDiv = document.getElementById('uploadProgress');
        if (progressDiv) progressDiv.style.display = 'none';
    }
}

// inicializacao da pagina
document.addEventListener('DOMContentLoaded', async () => {
    // aguarda scripts compartilhados carregarem
    setTimeout(async () => {
        await loadProfileData();
        setupPhotoUpload();
    }, 100);
});