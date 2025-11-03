// Espera o DOM carregar antes de executar o script
document.addEventListener("DOMContentLoaded", function() {

    // --- 1. Alternância de Visualização (Grid/Lista) ---
    const gridViewBtn = document.getElementById("grid-view");
    const listViewBtn = document.getElementById("list-view");
    const coursesContainer = document.querySelector(".courses-container");
    const toggleButtons = document.querySelectorAll(".toggle-btn");

    if (gridViewBtn && listViewBtn && coursesContainer) {
        gridViewBtn.addEventListener("click", () => {
            coursesContainer.classList.remove("list-view");
            setActiveButton(gridViewBtn);
        });

        listViewBtn.addEventListener("click", () => {
            coursesContainer.classList.add("list-view");
            setActiveButton(listViewBtn);
        });
    }

    // Função auxiliar para marcar o botão ativo
    function setActiveButton(activeBtn) {
        toggleButtons.forEach(btn => {
            btn.classList.remove("active");
        });
        activeBtn.classList.add("active");
    }

    // --- 2. Botão "Carregar Mais Cursos" ---
    const loadMoreButton = document.getElementById("loadMoreButton");
    const courseGrid = document.getElementById("course-grid");

    if (loadMoreButton && courseGrid) {
        loadMoreButton.addEventListener("click", () => {
            // Simulação: Clona o primeiro card do grid e o adiciona no final
            const firstCard = courseGrid.querySelector(".course-card");
            if (firstCard) {
                const newCard = firstCard.cloneNode(true); // 'true' clona também os filhos
                courseGrid.appendChild(newCard);
            }
            // Você pode adicionar uma animação ou um "loading" aqui
        });
    }

    // --- 3. Placeholder para Filtro ---
    const filterButton = document.getElementById("filterButton");
    if (filterButton) {
        filterButton.addEventListener("click", () => {
            // Em um app real, aqui você pegaria os valores dos <select> e <input>
            // e faria uma chamada de API ou filtraria os itens no front-end.
            console.log("Botão de filtrar clicado! (Lógica de filtro não implementada)");
            alert("Funcionalidade de filtro (ainda não implementada).");
        });
    }

});