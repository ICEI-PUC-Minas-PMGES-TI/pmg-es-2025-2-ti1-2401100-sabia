document.addEventListener('DOMContentLoaded', () => {
    
    const grid = document.querySelector('.disciplinas-grid');
    const inputBusca = document.querySelector('.filtro-busca input');
    const selectArea = document.querySelector('.filtro-select');
    let todasAsDisciplinas = []; // Array para guardar os dados originais

    // 1. FAZ A "CONEXÃO" (Busca os dados no JSON Server)
    fetch('http://localhost:3000/api/disciplinas') // URL CORRETA!
        .then(response => response.json())
        .then(disciplinas => {
            
            todasAsDisciplinas = disciplinas; // Salva os dados
            criarCards(disciplinas); // Cria os cards na tela

        })
        .catch(error => {
            console.error('Erro ao buscar disciplinas:', error);
            grid.innerHTML = '<p>Não foi possível carregar as disciplinas.</p>';
        });

    // 2. FUNÇÃO QUE CRIA OS CARDS NA TELA
    function criarCards(listaDeDisciplinas) {
        grid.innerHTML = ''; // Limpa o grid
        
        // Se a lista estiver vazia, mostra mensagem
        if (listaDeDisciplinas.length === 0) {
            grid.innerHTML = '<p>Nenhuma disciplina encontrada.</p>';
            return;
        }

        listaDeDisciplinas.forEach(disciplina => {
            const card = document.createElement('div');
            card.className = 'disciplina-card';
            card.dataset.area = disciplina.area; // Pega a área do JSON

            // Preenche o HTML com os dados do JSON
            card.innerHTML = `
                <div class="card-icon-container" style="background-color: ${disciplina.corFundo};">
                    <i class="${disciplina.icone}" style="color: ${disciplina.corIcone};"></i>
                </div>
                <h3>${disciplina.titulo}</h3>
                <p>${disciplina.descricao}</p>
                <a href="#" class="btn-acessar">Acessar</a>
            `;
            
            grid.appendChild(card);
        });
    }

    // 3. FUNÇÃO DE FILTRO (Busca e Select)
    function filtrarDisciplinas() {
        const termoBusca = inputBusca.value.toLowerCase();
        const areaSelecionada = selectArea.value;

        // Filtra o array original
        const disciplinasFiltradas = todasAsDisciplinas.filter(disciplina => {
            
            const textoDoCard = (disciplina.titulo + disciplina.descricao).toLowerCase();
            const matchBusca = textoDoCard.includes(termoBusca);
            
            const matchArea = (areaSelecionada === "") || (disciplina.area === areaSelecionada);

            return matchBusca && matchArea;
        });

        // Cria os cards de novo, mas só com os filtrados
        criarCards(disciplinasFiltradas);
    }

    // Adiciona os "ouvintes" de evento
    inputBusca.addEventListener('input', filtrarDisciplinas);
    selectArea.addEventListener('change', filtrarDisciplinas);
});