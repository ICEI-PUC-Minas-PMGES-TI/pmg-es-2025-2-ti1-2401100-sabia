// SABIAA - Configuração de Menu com Controle de Acesso por Role
// Define os itens do menu e suas permissões

window.MENU_CONFIG = {
    principal: {
        title: 'Principal',
        items: [
            {
                href: '/codigo/public/modules/dashboard/index.html',
                icon: 'fas fa-home',
                text: 'Dashboard',
                roles: ['aluno', 'admin']
            },
            {
                href: '/codigo/public/modules/aluno/perfil/perfil.html',
                icon: 'fas fa-user',
                text: 'Meu Perfil',
                roles: ['aluno', 'admin']
            }
        ]
    },
    
    disciplinas: {
        title: 'Disciplinas',
        items: [
            {
                href: '/codigo/public/modules/disciplinas/index.html',
                icon: 'fas fa-book',
                text: 'Minhas Disciplinas',
                roles: ['aluno', 'admin']
            },
            {
                href: '/codigo/public/ruan_henrique/cadastro-atividade.html',
                icon: 'fas fa-tasks',
                text: 'Atividades',
                roles: ['aluno', 'admin']
            }
        ]
    },
    
    cursos: {
        title: 'Cursos',
        items: [
            {
                href: '/codigo/public/modules/cursos/lista.html',
                icon: 'fas fa-graduation-cap',
                text: 'Meus Cursos',
                roles: ['aluno', 'admin']
            },
            {
                href: '/codigo/public/ruan_henrique/cursos/cadastro.html',
                icon: 'fas fa-plus-circle',
                text: 'Cadastrar Curso',
                roles: ['admin'], // Apenas admin
                badge: 'Admin'
            }
        ]
    },
    
    progresso: {
        title: 'Meu Progresso',
        items: [
            {
                href: '/codigo/public/modules/aluno/certificados/lista-certificados.html',
                icon: 'fas fa-certificate',
                text: 'Certificados',
                roles: ['aluno', 'admin']
            },
            {
                href: '/codigo/public/Perciliana Rodrigues/videoaula.html',
                icon: 'fas fa-video',
                text: 'Videoaulas',
                roles: ['aluno', 'admin']
            },
            {
                href: '/codigo/public/alexia/pub-video/pub-video-prof.html',
                icon: 'fas fa-video-plus',
                text: 'Publicar Videoaula',
                roles: ['admin'], // Apenas admin
                badge: 'Admin'
            },
            {
                href: '/codigo/public/victhor_guilherme/pagina_dashboard/dashboard.html',
                icon: 'fas fa-chart-line',
                text: 'Desempenho',
                roles: ['aluno', 'admin']
            }
        ]
    },
    
    admin: {
        title: 'Administração',
        items: [
            {
                href: '/codigo/public/modules/atividades/cadastrar.html',
                icon: 'fas fa-clipboard-list',
                text: 'Cadastrar Atividade',
                roles: ['admin'], // Apenas admin
                badge: 'Admin'
            },
            {
                href: '/codigo/public/victhor_guilherme/pagina_relatorio/relatorio.html',
                icon: 'fas fa-file-alt',
                text: 'Relatórios',
                roles: ['admin'], // Apenas admin
                badge: 'Admin'
            }
        ]
    }
};

// Função para verificar se o usuário tem acesso a um item
function userHasAccessToItem(itemRoles) {
    if (!window.sabiaAuth) return false;
    
    const userRole = window.sabiaAuth.getUserRole() || 'aluno';
    const isAdmin = window.sabiaAuth.isAdmin();
    
    // Se o item aceita qualquer role
    if (!itemRoles || itemRoles.length === 0) return true;
    
    // Se o item aceita admin e o usuário é admin
    if (itemRoles.includes('admin') && isAdmin) return true;
    
    // Se o item aceita aluno e o usuário não é admin (é aluno)
    if (itemRoles.includes('aluno') && !isAdmin) return true;
    
    // Se o item aceita o role específico do usuário
    if (itemRoles.includes(userRole)) return true;
    
    return false;
}

// Função para gerar o HTML do menu baseado no role do usuário
function generateMenuHTML(currentPage = '') {
    if (!window.sabiaAuth || !window.sabiaAuth.isLoggedIn()) {
        return '<p style="color: white; padding: 20px;">Carregando...</p>';
    }
    
    let menuHTML = '';
    
    Object.keys(MENU_CONFIG).forEach(sectionKey => {
        const section = MENU_CONFIG[sectionKey];
        
        // Filtrar itens que o usuário tem acesso
        const accessibleItems = section.items.filter(item => 
            userHasAccessToItem(item.roles)
        );
        
        // Se a seção não tem itens acessíveis, pular
        if (accessibleItems.length === 0) return;
        
        menuHTML += `
            <div class="nav-section">
                <h3 class="nav-section-title">${section.title}</h3>
                ${accessibleItems.map(item => {
                    const isActive = currentPage === item.href ? 'active' : '';
                    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
                    
                    return `
                        <a href="${item.href}" class="nav-item ${isActive}">
                            <i class="${item.icon}"></i>
                            <span class="nav-item-text">${item.text}${badge}</span>
                        </a>
                    `;
                }).join('')}
            </div>
        `;
    });
    
    return menuHTML;
}

// Função para renderizar o menu na página atual
function renderMenu(containerId = 'sidebar-nav-container', currentPage = '') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Container de menu não encontrado:', containerId);
        return;
    }
    
    // Aguardar autenticação estar pronta
    if (!window.sabiaAuth || !window.sabiaAuth.isLoggedIn()) {
        setTimeout(() => renderMenu(containerId, currentPage), 100);
        return;
    }
    
    const menuHTML = generateMenuHTML(currentPage);
    container.innerHTML = menuHTML;
    
    console.log('✅ Menu renderizado com base no role:', window.sabiaAuth.getUserRole());
}

// Exportar funções globalmente
window.generateMenuHTML = generateMenuHTML;
window.renderMenu = renderMenu;
window.userHasAccessToItem = userHasAccessToItem;

console.log('✅ menu-config.js carregado');
