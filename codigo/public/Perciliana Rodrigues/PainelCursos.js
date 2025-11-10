document.addEventListener("DOMContentLoaded", function() {

    // --- 1. ELEMENTOS DO DOM ---
    const gridViewBtn = document.getElementById("grid-view");
    const listViewBtn = document.getElementById("list-view");
    const coursesContainer = document.querySelector(".courses-container");
    const toggleButtons = document.querySelectorAll(".toggle-btn");
    const courseGrid = document.getElementById("course-grid");

    const searchInput = document.getElementById("search-input");
    const filterButton = document.getElementById("filterButton");
    const courseCountSpan = document.getElementById("course-count");

    // >>> MODIFICADO <<<
    const disciplinaSelect = document.getElementById("select-disciplina"); 


    // --- 2. BANCO DE DADOS MESTRE DE CURSOS ---
    const masterCourseList = [
        {
            titulo: "Álgebra Básica",
            descricao: "Aprenda os fundamentos da álgebra com exemplos práticos.",
            disciplina: "Matemática",
            imagem: "imagens/algebra.png"
        },
        {
            titulo: "Gramática Avançada",
            descricao: "Domine as regras gramaticais e melhore sua escrita.",
            disciplina: "Português",
            imagem: "imagens/gramatica.png"
        },
        {
            titulo: "Biologia Celular",
            descricao: "Explore o mundo microscópico das células.",
            disciplina: "Ciências",
            imagem: "imagens/biologia.png"
        },
        {
            titulo: "Brasil Colonial",
            descricao: "Descubra os acontecimentos que moldaram o Brasil.",
            disciplina: "História",
            imagem: "imagens/brasil-colonial.png"
        },
        {
            titulo: "Mecânica Clássica",
            descricao: "Entenda os princípios fundamentais do movimento.",
            disciplina: "Física",
            imagem: "imagens/mecanica.png"
        },
        {
            titulo: "Geografia do Brasil",
            descricao: "Explore as características físicas e humanas do território.",
            disciplina: "Geografia",
            imagem: "imagens/geografia.png"
        },
        {
            titulo: "Química Orgânica",
            descricao: "Estude as cadeias de carbono e reações.",
            disciplina: "Química",
            imagem: "imagens/quimica-orgânica.png"
        },
        {
            titulo: "Literatura Brasileira",
            descricao: "Do Romantismo ao Modernismo.",
            disciplina: "Português",
            imagem: "imagens/literatura.png"
        },
        {
            titulo: "Revolução Francesa",
            descricao: "Entenda as causas e consequências.",
            disciplina: "História",
            imagem: "imagens/revolucao-francesa.png"
        }
    ];

    // --- 3. FUNÇÃO HELPER (REQUEST 1: BUSCA SEM ACENTO) ---
    // Esta função remove acentos e deixa tudo minúsculo
    function normalizeString(str) {
        return str
            .toLowerCase()
            .normalize("NFD") // Separa acentos dos caracteres
            .replace(/[\u0300-\u036f]/g, ""); // Remove os acentos
    }

    // --- 4. FUNÇÃO DE RENDERIZAÇÃO (DESENHAR NA TELA) ---
    // (Não mudou)
    function renderizarCursos(cursosParaRenderizar) {
        courseGrid.innerHTML = "";
        const total = cursosParaRenderizar.length;
        courseCountSpan.textContent = `${total} ${total === 1 ? 'curso encontrado' : 'cursos encontrados'}`;

        if (cursosParaRenderizar.length === 0) {
            courseGrid.innerHTML = "<p>Nenhum curso encontrado com estes filtros.</p>";
            return;
        }

        cursosParaRenderizar.forEach(curso => {
            const novoCard = document.createElement('article');
            novoCard.className = 'course-card';

            novoCard.innerHTML = `
                <div class="card-image">
                    <img src="${curso.imagem}" alt="${curso.titulo}">
                    <span class="card-tag tag-subject">${curso.disciplina}</span>
                </div>
                <div class="card-content">
                    <h3>${curso.titulo}</h3>
                    <p>${curso.descricao}</p>
                    <div class="card-modules">
                        <strong>Módulos</strong>
                        <span class="module-time"></span>
                        <ul>
                            <li><i class="fa-regular fa-circle"></i> Comece a estudar</li>
                        </ul>
                    </div>
                    <button class="btn btn-secondary">Entrar no Curso</button>
                </div>
            `;
            courseGrid.appendChild(novoCard);
        });
    }

    // --- 5. FUNÇÃO DE FILTRAGEM (MODIFICADA) ---
    function aplicarFiltros() {
        // >>> MODIFICADO (Request 1) <<<
        // Usa a função normalizeString para a busca
        const searchTerm = normalizeString(searchInput.value); 
        
        // >>> MODIFICADO (Request 2) <<<
        // Pega o valor do <select>
        const disciplina = disciplinaSelect.value; 

        const listaFiltrada = masterCourseList.filter(curso => {
            
            // >>> MODIFICADO (Request 1) <<<
            // Normaliza o título e descrição do curso antes de comparar
            const matchSearch = normalizeString(curso.titulo).includes(searchTerm) ||
                                normalizeString(curso.descricao).includes(searchTerm);
            
            // >>> MODIFICADO (Request 2) <<<
            // Lógica de filtro para <select> (só mostra se for igual ou se "Todas" estiver selecionado)
            const matchDisciplina = disciplina ? curso.disciplina === disciplina : true;

            return matchSearch && matchDisciplina;
        });

        renderizarCursos(listaFiltrada);
    }

    // --- 6. FUNÇÃO PARA POPULAR FILTRO (REQUEST 2: DINÂMICO) ---
    function popularFiltroDisciplinas() {
        // 1. Pega todas as disciplinas da lista mestre
        const todasDisciplinas = masterCourseList.map(curso => curso.disciplina);
        
        // 2. Remove duplicadas usando um Set e transforma em array
        const disciplinasUnicas = [...new Set(todasDisciplinas)];
        
        // 3. Ordena alfabeticamente
        disciplinasUnicas.sort();

        // 4. Cria e adiciona cada <option> no <select>
        disciplinasUnicas.forEach(disciplina => {
            const option = document.createElement('option');
            option.value = disciplina;
            option.textContent = disciplina;
            disciplinaSelect.appendChild(option);
        });
    }

    // --- 7. EVENT LISTENERS (QUANDO O USUÁRIO INTERAGE) ---
    if (gridViewBtn && listViewBtn && coursesContainer) {
        // ... (código de alternar grid/lista continua o mesmo) ...
        gridViewBtn.addEventListener("click", () => {
            coursesContainer.classList.remove("list-view");
            setActiveButton(gridViewBtn);
        });
        listViewBtn.addEventListener("click", () => {
            coursesContainer.classList.add("list-view");
            setActiveButton(listViewBtn);
        });
    }
    function setActiveButton(activeBtn) {
        toggleButtons.forEach(btn => btn.classList.remove("active"));
        activeBtn.classList.add("active");
    }

    // Botão de Filtrar
    filterButton.addEventListener("click", aplicarFiltros);

    // Filtro em tempo real
    searchInput.addEventListener("keyup", aplicarFiltros);
    // O evento para <select> é 'change', não 'keyup'
    disciplinaSelect.addEventListener("change", aplicarFiltros); 

    // --- 8. INICIALIZAÇÃO ---
    
    // >>> NOVO (Request 2) <<<
    // 1. Popula o <select> de disciplinas assim que a página carrega
    popularFiltroDisciplinas();

    // 2. Carrega todos os cursos (pois os filtros estão vazios)
    aplicarFiltros();
});