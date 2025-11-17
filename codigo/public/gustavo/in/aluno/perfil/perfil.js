// perfil.js - funcionalidades especificas da pagina de perfil

let isEditing = false;
let originalData = {};

// carrega dados do perfil do usuario
async function loadProfileData() {
    try {
        console.log('carregando dados do perfil...');

        // verifica se esta logado usando a funcao compartilhada
        const userData = alunoAuth.getUser();
        if (!userData) {
            console.log('usuario nao logado, redirecionando...');
            window.location.href = '../../../login/login.html';
            return;
        }

        console.log(`carregando perfil para: ${userData.nome}`);
        populateForm(userData);
        updateUserHeader(userData);
        
        // usa funcao compartilhada para calcular stats
        const stats = alunoStats.calculateStats(userData);
        alunoStats.updateStatsUI(stats);
        
        console.log('perfil carregado com sucesso');
        
    } catch (error) {
        console.error('erro ao carregar perfil:', error);
        window.location.href = '../../../login/login.html';
    }
}

// popula o formulario com dados do usuario
function populateForm(user) {
    if (!user) {
        console.error('nenhum dado de usuario fornecido');
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

    // atualiza interface usando funcoes compartilhadas
    alunoUI.updateUserName(user.nome);
    
    // foto do usuario - usa foto padrao se nao tiver personalizada
    const defaultPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    const photoToUse = (user.foto && !user.foto.includes('logo_simbolo')) ? user.foto : defaultPhoto;
    
    alunoUI.updateUserPhoto(photoToUse, user.nome);

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

    // salva dados originais para cancelar edicao
    originalData = { ...user };
    console.log('formulario populado com sucesso');
}

// atualiza header do usuario
function updateUserHeader(user) {
    if (!user) return;
    
    // usa funcao compartilhada para nome
    alunoUI.updateUserName(user.nome || 'usuario');
    
    // determina foto a usar
    const defaultPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    const photoToUse = (user.foto && !user.foto.includes('logo_simbolo')) ? user.foto : defaultPhoto;
    
    // usa funcao compartilhada para foto
    alunoUI.updateUserPhoto(photoToUse, user.nome);
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
        
        if (updatedData.email && !alunoValidation.isValidEmail(updatedData.email)) {
            alert('email invalido');
            return;
        }
        
        if (updatedData.telefone && !alunoValidation.isValidPhone(updatedData.telefone)) {
            alert('telefone invalido');
            return;
        }
        
        if (updatedData.data_nascimento && !alunoValidation.isValidBirthDate(updatedData.data_nascimento)) {
            alert('data de nascimento invalida');
            return;
        }

        console.log('salvando alteracoes:', updatedData);
        
        // simula salvamento (seria uma chamada para API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('perfil atualizado com sucesso!');
        toggleEdit();
        
        // atualiza dados locais usando funcao compartilhada
        const currentUser = alunoAuth.getUser();
        const updatedUser = { ...currentUser, ...updatedData };
        alunoAuth.setUser(updatedUser);
        
        // recarrega dados atualizados
        populateForm(updatedUser);
        const stats = alunoStats.calculateStats(updatedUser);
        alunoStats.updateStatsUI(stats);
        
    } catch (error) {
        console.error('erro ao salvar perfil:', error);
        alert('erro ao salvar perfil: ' + error.message);
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

        console.log('foto enviada:', photoUrl);

        // atualiza interface imediatamente usando funcao compartilhada
        const currentUser = alunoAuth.getUser();
        alunoUI.updateUserPhoto(photoUrl, currentUser?.nome || 'usuario');

        // atualiza dados do usuario
        if (currentUser) {
            const updatedUser = { ...currentUser, foto: photoUrl };
            alunoAuth.setUser(updatedUser);
            console.log('dados do usuario atualizados com nova foto');
        }

        if (progressDiv) progressDiv.style.display = 'none';
        alert('foto atualizada com sucesso!');

    } catch (error) {
        console.error('erro no upload:', error);
        alert('erro ao enviar foto: ' + error.message);
        
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