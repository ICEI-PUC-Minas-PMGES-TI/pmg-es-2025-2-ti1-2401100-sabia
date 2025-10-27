/**
 * Debug e Limpeza de Dados do Usuário
 * Script para debugar e corrigir problemas de carregamento de dados
 */

// Função para debugar dados do usuário
function debugUserData() {
    console.log('=== DEBUG DADOS DO USUÁRIO ===');
    
    // Verificar localStorage
    const token = localStorage.getItem('sabia_token');
    const userData = localStorage.getItem('sabia_user');
    
    console.log('Token no localStorage:', token ? 'Existe' : 'Não existe');
    console.log('Dados do usuário no localStorage:', userData ? JSON.parse(userData) : 'Não existe');
    
    // Verificar auth
    if (window.sabiaAuth) {
        console.log('sabiaAuth.getUser():', sabiaAuth.getUser());
        console.log('sabiaAuth.isAuthenticated():', sabiaAuth.isAuthenticated());
    }
    
    // Verificar dados da API
    if (window.profileDataManager) {
        profileDataManager.loadUserProfile().then(data => {
            console.log('Dados carregados pela API:', data);
        }).catch(err => {
            console.error('Erro ao carregar da API:', err);
        });
    }
    
    // Verificar elementos do header
    console.log('=== ELEMENTOS DO HEADER ===');
    const headerName = document.getElementById('headerUserName');
    const headerAvatar = document.getElementById('headerUserAvatar');
    
    console.log('Nome no header:', headerName ? headerName.textContent : 'Elemento não encontrado');
    console.log('Avatar no header:', headerAvatar ? headerAvatar.src : 'Elemento não encontrado');
    
    // Verificar se há dados incorretos
    if (headerName && headerName.textContent.includes('Ana Silva')) {
        console.log('❌ PROBLEMA: Header contém "Ana Silva"');
        console.log('🔧 Execute: testHeaderUpdate()');
    }
}

// Função para testar atualização do header
function testHeaderUpdate() {
    console.log('🧪 Testando atualização do header...');
    
    const gustavoData = {
        nome: "Gustavo",
        foto: "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63"
    };
    
    // Testar função updateUserHeader se existir
    if (window.updateUserHeader) {
        updateUserHeader(gustavoData);
        console.log('✅ updateUserHeader() executada');
    } else {
        console.log('❌ updateUserHeader() não encontrada, atualizando manualmente...');
        
        // Atualizar manualmente
        const headerName = document.getElementById('headerUserName');
        const headerAvatar = document.getElementById('headerUserAvatar');
        
        if (headerName) {
            headerName.textContent = gustavoData.nome;
            console.log('✅ Nome atualizado no header');
        }
        
        if (headerAvatar) {
            headerAvatar.src = gustavoData.foto;
            console.log('✅ Avatar atualizado no header');
        }
    }
    
    // Verificar se funcionou
    setTimeout(() => {
        console.log('🔍 Verificando resultado...');
        debugUserData();
    }, 500);
}

// Função para forçar carregamento da foto de edição
function forceLoadEditPhoto() {
    console.log('📷 Forçando carregamento da foto de edição...');
    
    const gustavoPhoto = "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63";
    const currentPhotoElement = document.getElementById('currentPhoto');
    
    if (currentPhotoElement) {
        const timestamp = new Date().getTime();
        const photoWithCache = gustavoPhoto + '?t=' + timestamp;
        
        currentPhotoElement.src = photoWithCache;
        console.log('✅ Foto de edição atualizada:', photoWithCache);
        
        currentPhotoElement.onload = function() {
            console.log('✅ Foto de edição carregada com sucesso!');
        };
        
        currentPhotoElement.onerror = function() {
            console.log('❌ Erro ao carregar foto de edição');
        };
    } else {
        console.log('❌ Elemento currentPhoto não encontrado');
    }
}

// Função para limpar dados e forçar re-autenticação
function clearUserDataAndReload() {
    console.log('🧹 Limpando dados do usuário...');
    
    // Limpar localStorage
    localStorage.removeItem('sabia_token');
    localStorage.removeItem('sabia_user');
    
    // Limpar sessionStorage também
    sessionStorage.removeItem('sabia_token');
    sessionStorage.removeItem('sabia_user');
    
    console.log('✅ Dados limpos. Redirecionando para login...');
    
    // Redirecionar para login
    setTimeout(() => {
        window.location.href = '../../../modulos/login/login.html';
    }, 1000);
}

// Função para forçar login com Gustavo
function forceLoginGustavo() {
    console.log('🔧 Forçando login do Gustavo...');
    
    // Dados do Gustavo do banco
    const gustavoData = {
        "id": "c580739d-6f66-4e70-acd3-23634bc4bdf6",
        "tipo": "aluno",
        "nome": "Gustavo",
        "foto": "https://firebasestorage.googleapis.com/v0/b/sabiaa-2e56f.firebasestorage.app/o/profile_photos%2Ftemp_1760911760995_1760911761017.jpeg?alt=media&token=4ad22eb9-717d-4c92-a01b-483fdad52f63",
        "data_nascimento": "2005-07-17",
        "email": "gugupenido@gmail.com",
        "telefone": "(31) 99510-6573",
        "endereco": {
            "cep": "",
            "rua": "",
            "numero": "",
            "complemento": "",
            "bairro": "",
            "cidade": "",
            "estado": ""
        },
        "preferencias": {
            "idioma": "pt-br",
            "notificacoes": true,
            "acessibilidade": false,
            "tema": "claro"
        },
        "cadastro_data": "2025-10-19T18:37:29.685Z",
        "status": "ativo",
        "favoritos": [],
        "referencias_academicas": {
            "aluno": {
                "escola": "",
                "serie": "",
                "turma": "",
                "numero_matricula": "",
                "cursos_ids": [],
                "quizzes_ids": [],
                "tarefas_ids": []
            }
        }
    };
    
    // Simular token válido
    const fakeToken = "fake_token_gustavo_" + Date.now();
    
    // Salvar no localStorage
    localStorage.setItem('sabia_token', fakeToken);
    localStorage.setItem('sabia_user', JSON.stringify(gustavoData));
    
    console.log('✅ Dados do Gustavo salvos. Recarregando página...');
    
    // Recarregar página
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Função para verificar qual usuário deveria estar logado
function checkExpectedUser() {
    console.log('🔍 Verificando usuário esperado...');
    
    // Verificar URL para determinar se é aluno ou professor
    const isAluno = window.location.pathname.includes('/aluno/');
    const isProfessor = window.location.pathname.includes('/professor/');
    
    console.log('Página atual:', isAluno ? 'Aluno' : isProfessor ? 'Professor' : 'Indefinido');
    
    if (isAluno) {
        console.log('✅ Deveria carregar dados de aluno (Gustavo)');
        const currentUser = sabiaAuth?.getUser();
        if (currentUser && currentUser.nome !== 'Gustavo') {
            console.log('❌ Usuário atual:', currentUser.nome, '(deveria ser Gustavo)');
            console.log('🔧 Execute: forceLoginGustavo()');
        }
    }
}

// Adicionar comandos globais para debug
window.debugUserData = debugUserData;
window.clearUserDataAndReload = clearUserDataAndReload;
window.forceLoginGustavo = forceLoginGustavo;
window.checkExpectedUser = checkExpectedUser;

// Executar verificação automática quando carregado
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔍 Debug automático iniciado...');
        debugUserData();
        checkExpectedUser();
        
        console.log('\n📝 Comandos disponíveis no console:');
        console.log('- debugUserData() - Mostra dados atuais');
        console.log('- clearUserDataAndReload() - Limpa dados e vai para login');
        console.log('- forceLoginGustavo() - Força login do Gustavo');
        console.log('- checkExpectedUser() - Verifica usuário esperado');
    }, 1000);
});

console.log('🚀 Debug tools carregados! Execute debugUserData() para verificar dados.');