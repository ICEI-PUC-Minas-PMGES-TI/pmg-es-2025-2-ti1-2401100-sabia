/* --- Evento Principal: Espera o HTML carregar --- */
document.addEventListener("DOMContentLoaded", () => {

    console.log("Relatório SABIAA Carregado. Pronto para APIs.");

    /* --- 1. Lógica dos Gráficos (Chart.js) --- */
    // Cores do tema para os gráficos
    const corPrincipal = '#293443';
    const corDestaque = '#B97A57';
    const corRoxoClaro = '#C9C3D5'; // Reutilizei da paleta anterior
    const corGrid = '#EAEAEA';

    // 1.1 Gráfico de Evolução (Linha)
    const ctxEvolucao = document.getElementById('evolucaoMensalChart');
    if (ctxEvolucao) {
        new Chart(ctxEvolucao, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    data: [10, 25, 20, 40, 35, 55],
                    borderColor: corPrincipal,
                    borderWidth: 3,
                    pointBackgroundColor: corPrincipal,
                    pointBorderColor: '#FFFFFF',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Essencial para o wrapper
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: corGrid, drawBorder: false }, ticks: { color: '#888' } },
                    x: { grid: { display: false }, ticks: { color: '#888' } }
                }
            }
        });
    }

    // 1.2 Gráfico de Acertos (Donut)
    const ctxAcertos = document.getElementById('acertosChart');
    if (ctxAcertos) {
        new Chart(ctxAcertos, {
            type: 'doughnut',
            data: {
                labels: ['Acertos', 'Outros', 'Quase'],
                datasets: [{
                    data: [35, 25, 20],
                    backgroundColor: [corPrincipal, corDestaque, corRoxoClaro],
                    borderColor: '#FFFFFF',
                    borderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: true } } }
        });
    }

    // 1.3 Gráfico de Erros (Donut)
    const ctxErros = document.getElementById('errosChart');
    if (ctxErros) {
        new Chart(ctxErros, {
            type: 'doughnut',
            data: {
                labels: ['Erros', 'Outros', 'Quase'],
                datasets: [{
                    data: [25, 20, 15],
                    backgroundColor: [corPrincipal, corDestaque, corRoxoClaro],
                    borderColor: '#FFFFFF',
                    borderWidth: 4,
                    hoverOffset: 8
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: true } } }
        });
    }


    /* --- 2. Lógica de Funcionalidades e APIs --- */

    // 2.1 Exportar PDF
    const btnExportarPDF = document.getElementById('exportarPDF');
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', () => {
            console.log("Iniciando exportação para PDF...");
            const element = document.getElementById('report-content');
            
            // Esconde o próprio botão antes de "tirar a foto"
            btnExportarPDF.style.display = 'none';

            const opt = {
                margin: 10,
                filename: 'relatorio_sabiaa.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Gera o PDF
            html2pdf().from(element).set(opt).save().then(() => {
                // Mostra o botão novamente após a exportação
                btnExportarPDF.style.display = 'flex';
                console.log("PDF exportado com sucesso.");
            });
        });
    }

    // 2.2 Dropdown do Perfil (com simulação de API)
    const btnPerfil = document.getElementById('btn-perfil');
    const dropdown = document.getElementById('profile-dropdown');

    if (btnPerfil && dropdown) {
        btnPerfil.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique feche o menu imediatamente
            const isVisible = dropdown.classList.toggle('show');
            
            // Se o menu está sendo aberto, busca os dados da "API"
            if (isVisible) {
                console.log("Abrindo dropdown... buscando dados do perfil...");
                fetchProfileData();
            } else {
                console.log("Fechando dropdown.");
            }
        });
    }

    // Fecha o dropdown se clicar fora dele
    document.addEventListener('click', (event) => {
        if (dropdown && !dropdown.contains(event.target) && !btnPerfil.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });

    // 2.3 Modal "Selecionar Armário" (com simulação de API)
    const btnAbrirModal = document.getElementById('btn-selecionar-armario');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnFecharModal = document.getElementById('modal-close');
    const btnCancelarModal = document.getElementById('modal-btn-cancelar');
    const btnConfirmarModal = document.getElementById('modal-btn-confirmar');
    let armariosCarregados = []; // Guarda os dados da "API"
    let armarioSelecionado = null; // Guarda o ID selecionado

    if (btnAbrirModal && modalOverlay) {
        // Abrir o modal
        btnAbrirModal.addEventListener('click', () => {
            modalOverlay.classList.add('show');
            console.log("Abrindo modal... buscando 'armários'...");
            fetchArmarios();
        });

        // Fechar o modal (em 3 lugares: X, Cancelar, clique fora)
        btnFecharModal.addEventListener('click', () => modalOverlay.classList.remove('show'));
        btnCancelarModal.addEventListener('click', () => modalOverlay.classList.remove('show'));
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                modalOverlay.classList.remove('show');
            }
        });

        // Confirmar seleção (simula envio de dados)
        btnConfirmarModal.addEventListener('click', () => {
            if (armarioSelecionado) {
                console.log(`Confirmado! Buscando dados para o armário ID: ${armarioSelecionado.id}`);
                fetchArmarioData(armarioSelecionado.id);
                modalOverlay.classList.remove('show');
            } else {
                alert("Por favor, selecione um armário.");
            }
        });
    }


    /* --- 3. Simulação de Funções de API (Semi-pronto) --- */
    // Mantenha estas funções async/await para fácil integração

    /**
     * [API - PRONTO] Simula a busca de dados do perfil do usuário.
     */
    async function fetchProfileData() {
        // Simula um atraso de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ** SUBSTITUA ISSO PELA SUA CHAMADA DE API REAL **
        // const response = await fetch('/api/user/profile');
        // const userData = await response.json();
        
        // Dados de simulação:
        const userData = {
            username: "Aluno Exemplo",
            email: "aluno.exemplo@sabiaa.com"
        };
        
        // Atualiza o HTML do dropdown
        document.getElementById('dropdown-username').textContent = userData.username;
        document.getElementById('dropdown-email').textContent = userData.email;
        console.log("Dados do perfil carregados:", userData);
    }

    /**
     * [API - PRONTO] Simula a busca da lista de "Armários" (pastas de estudo).
     */
    async function fetchArmarios() {
        const listaUl = document.getElementById('armario-list');
        listaUl.innerHTML = "<li>Carregando armários...</li>";
        armarioSelecionado = null;

        await new Promise(resolve => setTimeout(resolve, 800)); // Simula rede

        // ** SUBSTITUA ISSO PELA SUA CHAMADA DE API REAL **
        // const response = await fetch('/api/armarios');
        // armariosCarregados = await response.json();

        // Dados de simulação:
        armariosCarregados = [
            { id: 101, nome: "Armário de Português" },
            { id: 102, nome: "Armário de Matemática Avançada" },
            { id: 103, nome: "Armário - Concurso Banco do Brasil" }
        ];

        // Renderiza a lista no modal
        listaUl.innerHTML = ""; // Limpa o "carregando"
        armariosCarregados.forEach(armario => {
            const li = document.createElement('li');
            li.textContent = armario.nome;
            li.dataset.id = armario.id; // Guarda o ID no elemento
            
            // Adiciona evento de clique para selecionar
            li.addEventListener('click', () => {
                // Remove a seleção de outros
                listaUl.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                // Adiciona seleção neste
                li.classList.add('selected');
                armarioSelecionado = armario;
                console.log("Armário selecionado:", armario);
            });
            listaUl.appendChild(li);
        });
    }

    /**
     * [API - PRONTO] Simula a busca de dados de evolução de um armário específico.
     * @param {number} armariosId O ID do armário selecionado.
     */
    async function fetchArmarioData(armarioId) {
        const evolucaoBody = document.getElementById('evolucao-body');
        evolucaoBody.innerHTML = "<p>Carregando nova evolução...</p>";

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula rede

        // ** SUBSTITUA ISSO PELA SUA CHAMADA DE API REAL **
        // const response = await fetch(`/api/evolucao?armario=${armarioId}`);
        // const evolucaoData = await response.json();

        // Dados de simulação (diferentes dos originais)
        let evolucaoData = [];
        if (armarioId === 101) {
            evolucaoData = [
                { label: "Interpretação de Texto", progress: 85 },
                { label: "Gramática", progress: 60 },
                { label: "Redação", progress: 40 }
            ];
        } else if (armarioId === 102) {
            evolucaoData = [
                { label: "Cálculo I", progress: 75 },
                { label: "Álgebra Linear", progress: 50 }
            ];
        } else {
             evolucaoData = [
                { label: "Sistema Financeiro", progress: 90 },
                { label: "Atendimento Bancário", progress: 70 },
                { label: "Informática", progress: 65 }
            ];
        }

        // Renderiza as novas barras de progresso
        evolucaoBody.innerHTML = ""; // Limpa o "carregando"
        evolucaoData.forEach(item => {
            evolucaoBody.innerHTML += `
                <div class="progress-item">
                    <span class="progress-label">${item.label}</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${item.progress}%;"></div>
                    </div>
                </div>
            `;
        });
        console.log("Novos dados de evolução carregados.");
    }

    
    /* --- 4. Links de Navegação (Placeholders) --- */
    // Adiciona "escutas" em links que não fazem nada, só para mostrar que funcionam
    
    function addNavPlaceholder(id) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault(); // Impede o link de pular para o topo
                console.log(`Navegação: Clique em '${id}'. (Pronto para roteamento)`);
            });
        }
    }

    // Sidebar
    ['nav-search', 'nav-home', 'nav-cursos', 'nav-relatorios', 'nav-config'].forEach(addNavPlaceholder);
    // Top Nav
    ['top-nav-inicio', 'top-nav-disciplinas', 'top-nav-cursos', 'top-nav-progresso'].forEach(addNavPlaceholder);
    // Outros botões
    addNavPlaceholder('btn-notificacoes');
    addNavPlaceholder('btn-logout');
    document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("armario-list");
  if (!lista) return;

  lista.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      // Remove seleção anterior
      document.querySelectorAll(".armario-list li").forEach(li => li.classList.remove("selected"));
      // Marca o atual
      e.target.classList.add("selected");

      // Guarda o selecionado (caso queira usar depois)
      const selecionado = e.target.dataset.disciplina;
      console.log("Disciplina selecionada:", selecionado);
    }
  });
});

});