// URL base da nossa API (JSONServer)
const API_URL = 'http://localhost:3000';

// Espera o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {
    loadCourseData();
    loadRelatedVideos();
    loadCourseProgress();
});

// Função para buscar e exibir os dados principais do curso
async function loadCourseData() {
    try {
        const response = await fetch(`${API_URL}/course`);
        const course = await response.json();

        // Atualiza o título e a descrição
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description;

        // Atualiza os metadados
        const metaContainer = document.getElementById('course-meta');
        metaContainer.innerHTML = `
            <span><i class="fa-regular fa-clock"></i> ${course.duration_minutes} min</span>
            <span><i class="fa-regular fa-eye"></i> ${course.views / 1000}k visualizações</span>
            <span><i class="fa-regular fa-calendar"></i> Publicado em ${new Date(course.published_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        `;

        // Configura o botão de favoritar
        const favButton = document.getElementById('favorite-btn');
        updateFavoriteButton(course.is_favorite);

        // Adiciona o evento de clique (EVENTO 1: onclick)
        favButton.onclick = () => toggleFavoriteStatus(course.id, course.is_favorite);

    } catch (error) {
        console.error('Erro ao carregar dados do curso:', error);
        document.getElementById('course-title').textContent = 'Erro ao carregar curso.';
    }
}

// Função para buscar e exibir os vídeos relacionados
async function loadRelatedVideos() {
    try {
        const response = await fetch(`${API_URL}/related_videos`);
        const videos = await response.json();
        const videoList = document.getElementById('related-videos-list');
        videoList.innerHTML = ''; // Limpa a lista antes de adicionar os itens

        videos.forEach(video => {
            const listItem = document.createElement('li');
            listItem.className = 'video-item';
            listItem.innerHTML = `
                <div class="thumbnail"><i class="fa-solid fa-play"></i></div>
                <div class="video-details">
                    <h3>${video.title}</h3>
                    <small>${video.duration_minutes} min</small>
                </div>
            `;
            videoList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Erro ao carregar vídeos relacionados:', error);
    }
}

// Função para buscar e exibir o progresso do curso
async function loadCourseProgress() {
    try {
        const response = await fetch(`${API_URL}/progress`);
        const progress = await response.json();

        const percentage = (progress.completed_videos / progress.total_videos) * 100;

        document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${progress.completed_videos} de ${progress.total_videos} vídeos concluídos`;

    } catch (error) {
        console.error('Erro ao carregar progresso do curso:', error);
    }
}

// Função para alternar o status de favorito (UPDATE do CRUD)
async function toggleFavoriteStatus(courseId, currentStatus) {
    const newStatus = !currentStatus;
    try {
        const response = await fetch(`${API_URL}/course`, {
            method: 'PATCH', // PATCH atualiza apenas o campo enviado
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_favorite: newStatus }),
        });

        if (response.ok) {
            // Se a API atualizou com sucesso, atualizamos o botão na tela
            updateFavoriteButton(newStatus);
            // Atualizamos a variável local para o próximo clique
            document.getElementById('favorite-btn').onclick = () => toggleFavoriteStatus(courseId, newStatus);
        }
    } catch (error) {
        console.error('Erro ao atualizar status de favorito:', error);
    }
}

// Função auxiliar para atualizar a aparência do botão de favorito
function updateFavoriteButton(isFavorite) {
    const favButton = document.getElementById('favorite-btn');
    if (isFavorite) {
        favButton.innerHTML = `<i class="fa-solid fa-heart"></i> Favoritado`;
        favButton.classList.add('favorited'); // Adicione um estilo para 'favorited' no CSS se quiser
    } else {
        favButton.innerHTML = `<i class="fa-regular fa-heart"></i> Favoritar`;
        favButton.classList.remove('favorited');
    }
}