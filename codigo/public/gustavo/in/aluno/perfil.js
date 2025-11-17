/**
 * SABIAA - Perfil do Aluno
 * Script responsável pelo gerenciamento do perfil do aluno
 */

// Variáveis globais
let isEditing = false;
let originalData = {};

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando perfil do aluno...');
    
    // Verificar autenticação
    if (!sabiaAuth.isLoggedIn()) {
        console.warn('⚠️ Usuário não autenticado, redirecionando...');
        window.location.href = '../../login/login.html';
        return;
    }

    // Aguardar todos os scripts carregarem
    setTimeout(async () => {
        await loadProfileData();
        await loadNotifications();
        setupPhotoUpload();
        console.log('✅ Perfil do aluno inicializado com sucesso');
    }, 100);
});

/**
 * Carrega os dados do perfil do usuário
 */
async function loadProfileData() {
    try {
        console.log('🔄 Iniciando carregamento do perfil...');

        // Verificar se o usuário está logado
        if (!window.sabiaAuth || !window.sabiaAuth.isLoggedIn()) {
            console.warn('Usuário não está logado');
            window.location.href = '../../login/login.html';
            return;
        }

        let userData = null;
        
        // Primeiro tentar obter dados do localStorage
        userData = window.sabiaAuth.getUser();
        console.log('📁 Dados do localStorage:', userData);
        
        if (!userData) {
            console.log('❌ Nenhum dado encontrado no localStorage');
            window.location.href = '../../login/login.html';
            return;
        }

        // Se temos dados, popular o formulário
        console.log(`✅ Carregando dados para: ${userData.nome} (${userData.email})`);
        populateForm(userData);
        updateUserHeader(userData);
        calculateStats(userData);
        
        console.log('✅ Perfil carregado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        
        // Redirecionar para login em caso de erro
        window.location.href = '../../login/login.html';
    }
}

/**
 * Carrega as notificações do usuário
 */
async function loadNotifications() {
    try {
        // Simular notificações baseado no usuário
        const userData = window.sabiaAuth.getUser();
        let count = 0;
        
        if (userData && userData.referencias_academicas && userData.referencias_academicas.aluno) {
            const aluno = userData.referencias_academicas.aluno;
            count = (aluno.cursos_ids?.length || 0) + (aluno.tarefas_ids?.length || 0);
        }
        
        updateNotificationBadge(Math.min(count, 99));
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        updateNotificationBadge(0);
    }
}

/**
 * Atualiza o badge de notificações
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationCount');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Calcula estatísticas do usuário (cursos, progresso, pontos)
 */
function calculateStats(user) {
    let cursosCount = 0;
    let progresso = 0;
    let pontos = 0;

    if (user.referencias_academicas && user.referencias_academicas.aluno) {
        const aluno = user.referencias_academicas.aluno;
        
        // Contar cursos
        cursosCount = aluno.cursos_ids ? aluno.cursos_ids.length : 0;
        
        // Calcular progresso baseado em tarefas e quizzes completados
        const tarefasCount = aluno.tarefas_ids ? aluno.tarefas_ids.length : 0;
        const quizzesCount = aluno.quizzes_ids ? aluno.quizzes_ids.length : 0;
        
        // Simular progresso baseado na atividade
        if (cursosCount > 0) {
            progresso = Math.min(100, Math.round(((tarefasCount + quizzesCount) / (cursosCount * 5)) * 100));
        }
        
        // Calcular pontos baseado na atividade
        pontos = (tarefasCount * 10) + (quizzesCount * 15) + (cursosCount * 25);
    }

    // Atualizar interface
    if (document.getElementById('statCursos')) document.getElementById('statCursos').textContent = cursosCount;
    if (document.getElementById('statProgresso')) document.getElementById('statProgresso').textContent = progresso + '%';
    if (document.getElementById('statPontos')) document.getElementById('statPontos').textContent = pontos;
}

/**
 * Popula o formulário com os dados do usuário
 */
function populateForm(user) {
    console.log('🔄 Populando formulário com dados do usuário:', user);
    
    if (!user) {
        console.error('❌ Nenhum dado de usuário fornecido');
        return;
    }
    
    // Dados pessoais
    if (document.getElementById('nome')) document.getElementById('nome').value = user.nome || '';
    if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
    if (document.getElementById('telefone')) document.getElementById('telefone').value = user.telefone || '';
    if (document.getElementById('data_nascimento')) document.getElementById('data_nascimento').value = user.data_nascimento || '';
    if (document.getElementById('genero')) document.getElementById('genero').value = user.genero || '';

    // Header e navegação - NOME
    if (document.getElementById('profileHeaderName')) {
        document.getElementById('profileHeaderName').textContent = user.nome || 'Usuário';
    }
    if (document.getElementById('headerUserName')) {
        document.getElementById('headerUserName').textContent = user.nome || 'Usuário';
    }
    
    // FOTOS
    const userPhoto = user.foto || "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    
    // Aplicar foto em todos os elementos
    const photoElements = ['profileHeaderAvatar', 'currentPhoto', 'headerUserAvatar'];
    photoElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.src = userPhoto;
            element.alt = `Foto de ${user.nome}`;
            console.log(`✅ Foto ${elementId} atualizada`);
        }
    });

    // Dados acadêmicos
    if (user.referencias_academicas && user.referencias_academicas.aluno) {
        const aluno = user.referencias_academicas.aluno;
        if (document.getElementById('escola')) document.getElementById('escola').value = aluno.escola || '';
        if (document.getElementById('serie')) document.getElementById('serie').value = aluno.serie || '';
        if (document.getElementById('turma')) document.getElementById('turma').value = aluno.turma || '';
        if (document.getElementById('matricula')) document.getElementById('matricula').value = aluno.numero_matricula || '';
    }

    // Salvar dados originais
    originalData = { ...user };
    
    console.log('✅ Formulário populado com sucesso');
}

/**
 * Atualiza o header do usuário com nome e foto
 */
function updateUserHeader(user) {
    console.log('🔄 Atualizando header do usuário...');
    
    if (!user) {
        console.log('❌ Nenhum usuário fornecido para atualizar header');
        return;
    }
    
    // Atualizar nome no header
    const headerNameElement = document.getElementById('headerUserName');
    if (headerNameElement) {
        headerNameElement.textContent = user.nome || 'Usuário';
        console.log('✅ Nome no header atualizado:', user.nome || 'Usuário');
    }
    
    // Atualizar foto no header
    const headerAvatarElement = document.getElementById('headerUserAvatar');
    if (headerAvatarElement) {
        // URL da foto padrão do Gustavo
        const gustavoPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
        
        let photoToUse = gustavoPhoto;
        
        if (user.foto && user.foto.trim() !== '' && !user.foto.includes('logo_simbolo')) {
            photoToUse = user.foto;
            console.log('✅ Usando foto personalizada no header:', user.foto);
        } else {
            console.log('✅ Usando foto padrão do Gustavo no header');
        }
        
        // Cache busting
        const timestamp = new Date().getTime();
        const photoWithCache = photoToUse + (photoToUse.includes('?') ? '&' : '?') + 't=' + timestamp;
        
        headerAvatarElement.src = photoWithCache;
        console.log('✅ Foto no header atualizada:', photoWithCache);
        
        // Verificar se a imagem carregou corretamente
        headerAvatarElement.onload = function() {
            console.log('✅ Foto do header carregada com sucesso');
        };
        
        headerAvatarElement.onerror = function() {
            console.log('❌ Erro ao carregar foto, usando default');
            this.src = '../../../assets/images/logos/logo_simbolo_branco.png';
        };
    }
}

/**
 * Carrega a foto atual na área de edição
 */
function loadCurrentPhoto(userData) {
    console.log('📷 Carregando foto na área de edição...');
    
    const currentPhotoElement = document.getElementById('currentPhoto');
    if (!currentPhotoElement) {
        console.log('❌ Elemento currentPhoto não encontrado');
        return;
    }
    
    // URL padrão do Gustavo
    const gustavoPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    
    let photoToUse = gustavoPhoto;
    
    // Se usuário tem foto personalizada, usar ela
    if (userData && userData.foto && userData.foto.trim() !== '' && !userData.foto.includes('logo_simbolo')) {
        photoToUse = userData.foto;
        console.log('✅ Usando foto personalizada para edição:', userData.foto);
    } else {
        console.log('✅ Usando foto padrão do Gustavo para edição');
    }
    
    // Cache busting para garantir atualização
    const timestamp = new Date().getTime();
    const photoWithCache = photoToUse + (photoToUse.includes('?') ? '&' : '?') + 't=' + timestamp;
    
    // Aplicar a foto
    currentPhotoElement.src = photoWithCache;
    console.log('🔄 Foto de edição atualizada:', photoWithCache);
    
    // Verificar se carregou
    currentPhotoElement.onload = function() {
        console.log('✅ Foto de edição carregada com sucesso');
    };
    
    currentPhotoElement.onerror = function() {
        console.log('❌ Erro ao carregar foto de edição, usando padrão do sistema');
        this.src = defaultPhoto;
    };
}

/**
 * Calcula contagem de notificações baseada no usuário
 */
function calculateNotificationCount(user) {
    if (!user || !user.referencias_academicas) return 0;
    
    const aluno = user.referencias_academicas.aluno;
    if (!aluno) return 0;
    
    let count = 0;
    count += (aluno.cursos_ids?.length || 0);
    count += (aluno.tarefas_ids?.length || 0);
    count += (aluno.quizzes_ids?.length || 0);
    
    // Limitar a 99
    return Math.min(count, 99);
}

/**
 * Alterna o modo de edição do formulário
 */
function toggleEdit() {
    isEditing = !isEditing;
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');
    const formActions = document.getElementById('formActions');
    
    inputs.forEach(input => {
        if (input.name !== 'email') { // Email não pode ser editado
            input.readOnly = !isEditing;
            input.disabled = !isEditing;
        }
    });

    formActions.style.display = isEditing ? 'block' : 'none';
}

/**
 * Cancela a edição e restaura dados originais
 */
function cancelEdit() {
    populateForm(originalData);
    toggleEdit();
}

/**
 * Salva as alterações do perfil
 */
async function saveProfile() {
    try {
        const formData = new FormData(document.getElementById('profileForm'));
        const updatedData = Object.fromEntries(formData.entries());

        // Simular salvamento (seria uma chamada para a API)
        console.log('💾 Salvando dados:', updatedData);
        
        alert('✅ Perfil atualizado com sucesso!');
        toggleEdit();
        
        // Atualizar dados locais
        const currentUser = window.sabiaAuth.getUser();
        const updatedUser = { ...currentUser, ...updatedData };
        window.sabiaAuth.setUser(updatedUser);
        
        // Recarregar dados atualizados
        populateForm(updatedUser);
        calculateStats(updatedUser);
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro ao salvar perfil: ' + error.message);
    }
}

/**
 * Configura o upload de foto
 */
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

/**
 * Faz upload da foto de perfil
 */
async function uploadProfilePhoto(file) {
    try {
        const progressDiv = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressDiv.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';

        // Simular upload (aqui seria a integração com Firebase ou outro serviço)
        for (let i = 0; i <= 100; i += 10) {
            progressFill.style.width = `${i}%`;
            progressText.textContent = `${i}%`;
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // simular upload (substituir por upload real em produção)
        const photoUrl = `https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2F${Date.now()}.jpeg?alt=media&token=${Math.random().toString(36)}`;

        console.log('✅ Foto enviada com sucesso:', photoUrl);

        // Atualizar foto na interface IMEDIATAMENTE
        document.getElementById('profileHeaderAvatar').src = photoUrl;
        document.getElementById('currentPhoto').src = photoUrl;
        document.getElementById('headerUserAvatar').src = photoUrl;

        // Atualizar dados do usuário no localStorage
        const currentUser = window.sabiaAuth.getUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, foto: photoUrl };
            window.sabiaAuth.setUser(updatedUser);
            console.log('✅ Dados do usuário atualizados com nova foto');
        }

        progressDiv.style.display = 'none';
        alert('✅ Foto atualizada com sucesso!');

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('❌ Erro ao enviar foto: ' + error.message);
        document.getElementById('uploadProgress').style.display = 'none';
    }
}

/**
 * Função de logout
 */
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        window.sabiaAuth.logout();
        window.location.href = '../../login/login.html';
    }
}

// Tornar funções disponíveis globalmente para uso no HTML
window.toggleEdit = toggleEdit;
window.cancelEdit = cancelEdit;
window.saveProfile = saveProfile;
window.logout = logout;