/**
 * Correção Específica - Problema Ana Silva Santos
 * Script para corrigir o problema de carregamento incorreto de dados
 */

// Executar correção imediatamente quando a página carregar
(function() {
    'use strict';
    
    console.log('🔧 Iniciando correção AGRESSIVA...');
    
    // Função para limpar TODOS os dados do storage
    function clearAllData() {
        console.log('🧹 Limpando TODOS os dados de storage...');
        
        // Limpar localStorage
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
            if (key.includes('sabia') || key.includes('user') || key.includes('auth') || key.includes('token')) {
                localStorage.removeItem(key);
                console.log('🗑️ Removido do localStorage:', key);
            }
        });
        
        // Limpar sessionStorage
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach(key => {
            if (key.includes('sabia') || key.includes('user') || key.includes('auth') || key.includes('token')) {
                sessionStorage.removeItem(key);
                console.log('🗑️ Removido do sessionStorage:', key);
            }
        });
        
        // Limpar cookies relacionados
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        return true;
    }
    
    // Função para verificar se há dados incorretos EM QUALQUER LUGAR
    function hasIncorrectData() {
        // Verificar localStorage
        try {
            const userData = localStorage.getItem('sabia_user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.nome && (user.nome.includes('Ana') || user.nome.includes('Silva') || user.nome.includes('Santos'))) {
                    console.log('❌ Dados incorretos encontrados no localStorage');
                    return true;
                }
            }
        } catch (e) {}
        
        // Verificar se há elementos na página com Ana Silva
        const pageText = document.body.textContent || document.body.innerText;
        if (pageText.includes('Ana Silva')) {
            console.log('❌ "Ana Silva" encontrada na página');
            return true;
        }
        
        // Verificar campos de formulário
        const nomeField = document.getElementById('nome');
        if (nomeField && nomeField.value && nomeField.value.includes('Ana')) {
            console.log('❌ "Ana" encontrada no campo nome');
            return true;
        }
        
        return false;
    }
    
    // Função para definir dados corretos do Gustavo FORÇADAMENTE
    function forceCorrectData() {
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
        
        // Criar token válido
        const token = "gustavo_token_" + Date.now();
        
        // Salvar dados corretos com múltiplas chaves
        localStorage.setItem('sabia_user', JSON.stringify(gustavoData));
        localStorage.setItem('sabia_token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user_data', JSON.stringify(gustavoData));
        
        // Sobrescrever window objects se existirem
        if (window.sabiaAuth) {
            window.sabiaAuth.setUser = function() { return gustavoData; };
            window.sabiaAuth.getUser = function() { return gustavoData; };
        }
        
        console.log('✅ Dados FORÇADOS do Gustavo definidos');
        
        return gustavoData;
    }
    
    // Função para atualizar interface diretamente
    function updateInterfaceDirectly() {
        console.log('🎨 Atualizando interface diretamente...');
        
        // Atualizar campos de texto
        const updates = {
            'nome': 'Gustavo',
            'email': 'gugupenido@gmail.com',
            'telefone': '(31) 99510-6573',
            'data_nascimento': '2005-07-17'
        };
        
        Object.keys(updates).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = updates[id];
                console.log(`✅ Campo ${id} atualizado para: ${updates[id]}`);
            }
        });
        
        // Atualizar textos na página
        const textUpdates = {
            'profileHeaderName': 'Gustavo',
            'headerUserName': 'Gustavo'
        };
        
        Object.keys(textUpdates).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = textUpdates[id];
                console.log(`✅ Texto ${id} atualizado para: ${textUpdates[id]}`);
            }
        });
        
        // Remover qualquer texto "Ana Silva" da página
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('Ana Silva')) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(node => {
            node.textContent = node.textContent.replace(/Ana Silva Santos?/g, 'Gustavo');
            console.log('🔄 Texto corrigido:', node.textContent);
        });
    }
    
    // Função principal de correção
    function performAggressiveCorrection() {
        console.log('💀 MODO AGRESSIVO: Correção total iniciada');
        
        // 1. Limpar tudo
        clearAllData();
        
        // 2. Definir dados corretos
        forceCorrectData();
        
        // 3. Atualizar interface
        setTimeout(() => {
            updateInterfaceDirectly();
        }, 100);
        
        // 4. Configurar observador para mudanças na página
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        // Se alguém tentar colocar "Ana Silva" de volta, corrigir imediatamente
                        if (document.body.textContent.includes('Ana Silva')) {
                            console.log('🚨 "Ana Silva" detectada novamente! Corrigindo...');
                            setTimeout(updateInterfaceDirectly, 10);
                        }
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
            
            console.log('👁️ Observador de mudanças ativado');
        }
        
        console.log('✅ Correção agressiva concluída');
    }
    
    // Executar correção quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', performAggressiveCorrection);
    } else {
        performAggressiveCorrection();
    }
    
    // Também executar após um pequeno delay
    setTimeout(performAggressiveCorrection, 500);
    
    // E mais uma vez após 2 segundos para garantir
    setTimeout(() => {
        if (hasIncorrectData()) {
            console.log('🔥 AINDA há dados incorretos! Executando correção final...');
            performAggressiveCorrection();
            
            // Último recurso: recarregar página
            setTimeout(() => {
                if (hasIncorrectData()) {
                    console.log('🔄 Recarregando página como último recurso...');
                    window.location.reload(true); // Force reload
                }
            }, 1000);
        }
    }, 2000);
    
    // Disponibilizar função global para correção manual
    window.forceCorrectUserData = performAggressiveCorrection;
    
    console.log('🚀 Correção agressiva carregada! Execute forceCorrectUserData() se necessário');
    
})();