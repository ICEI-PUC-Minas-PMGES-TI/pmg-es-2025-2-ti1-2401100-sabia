/**
 * Sistema de componentes compartilhados
 * Carrega automaticamente os componentes em páginas
 */

// Função para carregar componentes HTML
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Erro ao carregar ${componentPath}`);
        
        const html = await response.text();
        const element = document.getElementById(elementId);
        
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao carregar componente:', error);
        return false;
    }
}

// Função para marcar item ativo na navegação
function setActiveNavItem(currentPage) {
    // Sidebar
    const sidebarItems = document.querySelectorAll('.sidebar .nav-item');
    sidebarItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Navbar público
    const navItems = document.querySelectorAll('.header-public .nav-links a');
    navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (page === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Função para toggle do menu mobile
function setupMobileMenu() {
    // Menu interno
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
        });

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }

    // Menu público
    const publicToggle = document.getElementById('mobileMenuTogglePublic');
    const publicMenu = document.getElementById('mobileMenuPublic');

    if (publicToggle && publicMenu) {
        publicToggle.addEventListener('click', () => {
            publicMenu.classList.toggle('active');
            publicToggle.classList.toggle('active');
        });
    }
}

// Inicializar componentes automaticamente
document.addEventListener('DOMContentLoaded', async () => {
    // Detectar qual tipo de componente carregar
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarSimpleContainer = document.getElementById('sidebar-simple-container');
    const headerContainer = document.getElementById('header-container');
    const navbarContainer = document.getElementById('navbar-container');

    // Carregar componentes
    if (sidebarContainer) {
        await loadComponent('sidebar-container', '/codigo/public/shared/components/sidebar.html');
    }
    
    if (sidebarSimpleContainer) {
        await loadComponent('sidebar-simple-container', '/codigo/public/shared/components/sidebar-simple.html');
    }
    
    if (headerContainer) {
        await loadComponent('header-container', '/codigo/public/shared/components/header.html');
    }
    
    if (navbarContainer) {
        await loadComponent('navbar-container', '/codigo/public/shared/components/navbar-public.html');
    }

    // Configurar menu mobile após carregar componentes
    setTimeout(setupMobileMenu, 100);

    // Marcar item ativo baseado na página atual
    const bodyPage = document.body.getAttribute('data-page');
    if (bodyPage) {
        setActiveNavItem(bodyPage);
    }
});

// Exportar funções para uso externo
window.SabiaComponents = {
    loadComponent,
    setActiveNavItem,
    setupMobileMenu
};
