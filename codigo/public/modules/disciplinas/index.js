// ========================================
// DISCIPLINAS - Funcionalidades
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    carregarDisciplinas();
    setupEventListeners();
});

function setupEventListeners() {
    // Filtro de busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarDisciplinas);
    }

    // Filtro de área
    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) {
        areaFilter.addEventListener('change', filtrarDisciplinas);
    }
}

async function carregarDisciplinas() {
    const gridContainer = document.querySelector('.disciplinas-grid');
    
    if (!gridContainer) {
        console.error('Container de disciplinas não encontrado');
        return;
    }

    // Loading state
    gridContainer.innerHTML = `
        <div class="loading-disciplinas" style="grid-column: 1 / -1;">
            <i class="fas fa-spinner"></i>
            <p>Carregando disciplinas...</p>
        </div>
    `;

    try {
        // Tentar buscar do backend
        const response = await fetch(`${SABIAA_CONFIG.API_BASE_URL}/api/disciplinas`, {
            headers: {
                'Authorization': `Bearer ${sabiaAuth.getToken()}`
            }
        });

        let disciplinas = [];

        if (response.ok) {
            disciplinas = await response.json();
        } else {
            console.warn('Usando dados mockados de disciplinas');
            disciplinas = getDisciplinasMockadas();
        }

        renderizarDisciplinas(disciplinas);
    } catch (error) {
        console.error('Erro ao carregar disciplinas:', error);
        renderizarDisciplinas(getDisciplinasMockadas());
    }
}

function getDisciplinasMockadas() {
    return [
        {
            id: 1,
            nome: 'Português',
            descricao: 'Gramática, Literatura e Redação',
            area: 'humanas',
            icone: 'fa-book-open',
            cor: '#D9534F',
            bgCor: '#F8D7DA'
        },
        {
            id: 2,
            nome: 'Matemática',
            descricao: 'Álgebra, Geometria e Estatística',
            area: 'exatas',
            icone: 'fa-calculator',
            cor: '#31708F',
            bgCor: '#D1ECF1'
        },
        {
            id: 3,
            nome: 'Biologia',
            descricao: 'Citologia, Bactérias e Doenças',
            area: 'bio',
            icone: 'fa-flask',
            cor: '#155724',
            bgCor: '#D4EDDA'
        },
        {
            id: 4,
            nome: 'Física',
            descricao: 'Leis do movimento, energia e universo',
            area: 'exatas',
            icone: 'fa-atom',
            cor: '#31708F',
            bgCor: '#D1ECF1'
        },
        {
            id: 5,
            nome: 'Química',
            descricao: 'Reações, elementos e compostos',
            area: 'exatas',
            icone: 'fa-vial',
            cor: '#155724',
            bgCor: '#D4EDDA'
        },
        {
            id: 6,
            nome: 'História',
            descricao: 'Do Brasil colonial ao século XXI',
            area: 'humanas',
            icone: 'fa-landmark',
            cor: '#D9534F',
            bgCor: '#F8D7DA'
        },
        {
            id: 7,
            nome: 'Geografia',
            descricao: 'Paisagens naturais e urbanas',
            area: 'humanas',
            icone: 'fa-globe-americas',
            cor: '#D9534F',
            bgCor: '#F8D7DA'
        },
        {
            id: 8,
            nome: 'Inglês',
            descricao: 'Conversação, gramática e vocabulário',
            area: 'linguagens',
            icone: 'fa-language',
            cor: '#856404',
            bgCor: '#FFF3CD'
        },
        {
            id: 9,
            nome: 'Espanhol',
            descricao: 'Compreensão e expressão escrita',
            area: 'linguagens',
            icone: 'fa-comments',
            cor: '#856404',
            bgCor: '#FFF3CD'
        },
        {
            id: 10,
            nome: 'Filosofia',
            descricao: 'Pensamento crítico e ético',
            area: 'humanas',
            icone: 'fa-brain',
            cor: '#D9534F',
            bgCor: '#F8D7DA'
        },
        {
            id: 11,
            nome: 'Sociologia',
            descricao: 'Sociedade, cultura e política',
            area: 'humanas',
            icone: 'fa-users',
            cor: '#D9534F',
            bgCor: '#F8D7DA'
        },
        {
            id: 12,
            nome: 'Artes',
            descricao: 'Expressão visual e cultural',
            area: 'linguagens',
            icone: 'fa-palette',
            cor: '#856404',
            bgCor: '#FFF3CD'
        }
    ];
}

function renderizarDisciplinas(disciplinas) {
    const gridContainer = document.querySelector('.disciplinas-grid');
    
    if (!gridContainer) return;

    if (disciplinas.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fas fa-book"></i>
                <h3>Nenhuma disciplina encontrada</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }

    gridContainer.innerHTML = disciplinas.map(disc => `
        <div class="disciplina-card" data-area="${disc.area}" data-nome="${disc.nome.toLowerCase()}">
            <div class="card-icon-container" style="background-color: ${disc.bgCor};">
                <i class="fas ${disc.icone}" style="color: ${disc.cor};"></i>
            </div>
            <h3>${disc.nome}</h3>
            <p>${disc.descricao}</p>
            <a href="#" class="btn-acessar" onclick="acessarDisciplina(${disc.id}, '${disc.nome}'); return false;">Acessar</a>
        </div>
    `).join('');
}

function filtrarDisciplinas() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const areaFilter = document.getElementById('areaFilter')?.value || '';
    
    const cards = document.querySelectorAll('.disciplina-card');
    
    cards.forEach(card => {
        const nome = card.dataset.nome || '';
        const area = card.dataset.area || '';
        
        const matchSearch = nome.includes(searchTerm);
        const matchArea = !areaFilter || area === areaFilter;
        
        if (matchSearch && matchArea) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function acessarDisciplina(id, nome) {
    console.log(`Acessando disciplina: ${nome} (ID: ${id})`);
    try {
        const norm = nome && nome.normalize ? nome.normalize('NFD').replace(/\p{Diacritic}/gu, '') : nome;
        const key = (norm || nome).toString().toLowerCase().trim();
        if (key === 'portugues' || key === 'português' || key === 'matematica' || key === 'matemática') {
            alert(`Conteúdo da disciplina "${nome}" em desenvolvimento`);
            return;
        }
    } catch (e) {
        // fallback simple check
        const lk = (nome || '').toLowerCase();
        if (lk.includes('portugu') || lk.includes('matema')) {
            alert(`Conteúdo da disciplina "${nome}" em desenvolvimento`);
            return;
        }
    }

    // se não está em desenvolvimento, redireciona para Painel de Cursos filtrado
    const target = `/codigo/public/modules/cursos/PainelCursos.html?disciplina=${encodeURIComponent(nome)}`;
    window.location.href = target;
}
