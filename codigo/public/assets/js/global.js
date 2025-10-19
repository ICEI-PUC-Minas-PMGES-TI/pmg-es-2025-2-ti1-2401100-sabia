// ===== SCRIPT GLOBAL SABIAA =====

// Carregar sistema de autenticação
function loadAuthScript() {
    // Determinar caminho baseado na localização atual
    const currentPath = window.location.pathname;
    let authScriptPath;
    
    if (currentPath.includes('/assets/')) {
        authScriptPath = './auth.js';
    } else if (currentPath.includes('/gustavo/')) {
        authScriptPath = '../../assets/js/auth.js';
    } else if (currentPath.includes('/in/')) {
        authScriptPath = '../../../assets/js/auth.js';
    } else {
        authScriptPath = './assets/js/auth.js';
    }
    
    const authScript = document.createElement('script');
    authScript.src = authScriptPath;
    authScript.async = false;
    document.head.appendChild(authScript);
}

loadAuthScript();

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar funcionalidades globais
    initMobileMenu();
});

// Função para menu mobile (baseada no menu.js)
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const body = document.body;

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            body.classList.toggle('menu-open');
            
            // Trocar ícone
            const icon = this.querySelector('i');
            if (icon) {
                if (mobileMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Fechar menu ao clicar em um link
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                body.classList.remove('menu-open');
                
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('active');
                body.classList.remove('menu-open');
                
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
}

// Função global para toggle de menu mobile (caso seja chamada diretamente do HTML)
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const body = document.body;
    
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
        body.classList.toggle('menu-open');
    }
}