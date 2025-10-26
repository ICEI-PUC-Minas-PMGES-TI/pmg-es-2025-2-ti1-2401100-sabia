const mockDatabase = {
    "course": {
      "id": "curso_js_01",
      "title": "Introdução ao JavaScript Moderno",
      "description": "Nesse vídeo vamos aprender do zero como utilizar Javascript para iniciar no universo de programação, aprendendo conceitos de variáveis, interações com HTML e DOM, onClick, funções e muito mais! E tudo isso de forma prática do zero",
      "duration_minutes": 31, 
      "views": 125386,
      "published_date": "2024-11-27T10:00:00Z",
      "is_favorite": false,
      "video_url": "https://www.youtube.com/embed/Z7mnxUI4u00?si=hz4oqedEj3h58lN9",
      "thumbnail_url": "https://img.youtube.com/vi/Z7mnxUI4u00/mqdefault.jpg"
    },
    
    "related_videos": [
      { 
        "id": "video_02_novo", 
        "title":"Interatividade com o usuário", 
        "description": "Nesse vídeo continuamos nosso aprendizado do zero de como utilizar Javascript para iniciar no universo de programação, usando o conhecimento de variáveis e interação de onClick da aula passada e aprendendo sobre como pegar valores de entrada do usuário em um elemento input e devolve-lo na tela! E tudo isso de forma prática do zero com um novo projeto de listagem de tarefas!",
        "duration_minutes": 35, 
        "views": 42365,
        "published_date": "2024-12-06T10:00:00Z",
        // ---
        "video_url": "https://www.youtube.com/embed/kwOPAQJDGyI",
        "thumbnail_url": "https://img.youtube.com/vi/kwOPAQJDGyI/mqdefault.jpg"
      },
      { 
        "id": "video_03_novo", 
        "title": "Estruturas Condicionais (if e else)", 
        "description": "Nesse vídeo continuamos nosso aprendizado do zero de como utilizar Javascript para iniciar no universo de programação, usando o conhecimento de variáveis e interação de onClick da aula passada e aprendendo sobre como pegar valores de entrada do usuário em um elemento input e devolve-lo na tela! E tudo isso de forma prática do zero com um novo projeto de listagem de tarefas!",
        "duration_minutes": 31, 
        "views": 20601,
        "published_date": "2024-12-11T10:00:00Z",
        // ---
        "video_url": "https://www.youtube.com/embed/c-D7uV2CiFQ",
        "thumbnail_url": "https://img.youtube.com/vi/c-D7uV2CiFQ/mqdefault.jpg"
      },
      { 
        "id": "video_04_novo", 
        "title": "Arrays, Estruturas de Repetição (for) e Escopo", 
        "description": "Nesse vídeo continuamos nosso aprendizado do zero de como utilizar Javascript para iniciar no universo de programação, usando todo o conhecimento das aulas passada e aprendendo sobre utilizar listas (array) e loops (estrutura de repetição - for). Além de entendendo um pouco mais sobre função e escopo. E tudo isso de forma prática do zero com um novo projeto de listagem de tarefas!",
        "duration_minutes": 42, 
        "views": 15537,
        "published_date": "2025-01-22T10:00:00Z",
        "video_url": "https://www.youtube.com/embed/IuCZPOk5EXo",
        "thumbnail_url": "https://img.youtube.com/vi/IuCZPOk5EXo/mqdefault.jpg"
      },
      { 
        "id": "video_05_novo", 
        "title": "Métodos de Array (deletando e editando itens em lista)", 
        "description": "Nesse vídeo continuamos nosso aprendizado do zero de como utilizar Javascript para iniciar no universo de programação, usando todo o conhecimento das aulas passada e aprendendo sobre utilizar mais métodos de arrays em javascript para agora conseguirmos remover e editar itens em uma lista, utilizando também o alert(). E tudo isso de forma prática do zero com um novo projeto de listagem de tarefas!",
        "duration_minutes": 30, 
        "views": 19789,
        "published_date": "2025-01-24T10:00:00Z",
        "video_url": "https://www.youtube.com/embed/RjfhRZXB_U8",
        "thumbnail_url": "https://img.youtube.com/vi/RjfhRZXB_U8/mqdefault.jpg"
      }
    ],
};

// Variável para guardar o estado atual do curso (para o 'Favorito')
let currentCourse = {};
document.addEventListener('DOMContentLoaded', () => {
    loadCourseData();
    loadRelatedVideos();
});


/**
 * Atualiza o player de vídeo, título, meta e descrição na tela.
 * @param {object} videoObject - O objeto do vídeo a ser carregado
 * @param {boolean} autoplay - Define se o vídeo deve tocar sozinho
 */
function loadVideo(videoObject, autoplay = false) {
    const player = document.getElementById('video-player');
    const videoUrl = videoObject.video_url + (autoplay ? "?autoplay=1" : "");
    player.src = videoUrl;

    // Atualiza o bloco de informações
    document.getElementById('course-title').textContent = videoObject.title;
    document.getElementById('course-description').textContent = videoObject.description;

    const metaContainer = document.getElementById('course-meta');
    const viewsInK = (videoObject.views / 1000).toFixed(0); 
    
    metaContainer.innerHTML = `
        <span><i class="fa-regular fa-clock"></i> ${videoObject.duration_minutes} min</span>
        <span><i class="fa-regular fa-eye"></i> ${viewsInK}k visualizações</span>
        <span><i class="fa-regular fa-calendar"></i> Estreou em ${new Date(videoObject.published_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    `;
    
    // Mostra o botão "Favoritar"
    const favButton = document.getElementById('favorite-btn');
    favButton.style.display = 'block'; 
    
    // Atualiza o estado do botão (cheio/vazio) baseado no curso principal
    if (currentCourse.is_favorite !== undefined) {
        updateFavoriteButton(currentCourse.is_favorite); 
    }
}


// Função para carregar os dados INICIAIS do curso
function loadCourseData() {
    try {
        currentCourse = mockDatabase.course; 

        // Puxa o status 'favorito' do localStorage
        const savedFavorite = localStorage.getItem('course_favorite_' + currentCourse.id);
        
        if (savedFavorite !== null) {
            currentCourse.is_favorite = (savedFavorite === 'true');
        }

        // Carrega o vídeo principal, SEM autoplay
        loadVideo(currentCourse, false);

        // Adiciona o 'escutador' de clique no botão
        const favButton = document.getElementById('favorite-btn');
        favButton.addEventListener('click', toggleFavoriteStatus);

    } catch (error) {
        console.error('Erro ao carregar dados do curso:', error);
        document.getElementById('course-title').textContent = 'Erro ao carregar curso.';
    }
}

// Função para carregar a lista de "Vídeos Relacionados"
function loadRelatedVideos() {
    try {
        const videoList = document.getElementById('related-videos-list');
        videoList.innerHTML = ''; 

        // 1. Adicionar o vídeo principal no topo da lista
        const mainCourseVideo = mockDatabase.course;
        const mainListItem = document.createElement('li');
        mainListItem.className = 'video-item';
        mainListItem.innerHTML = `
            <div class="thumbnail">
                <img src="${mainCourseVideo.thumbnail_url}" alt="${mainCourseVideo.title}">
            </div>
            <div class="video-details"> 
                <h3>${mainCourseVideo.title}</h3>
                <small>${mainCourseVideo.duration_minutes} min</small>
            </div>
        `;
        
        mainListItem.addEventListener('click', () => {
            loadVideo(mainCourseVideo, true); // true = autoplay
        });
        
        videoList.appendChild(mainListItem); 

        // 2. Adicionar o restante dos vídeos
        const relatedVideos = mockDatabase.related_videos;
        relatedVideos.forEach(video => {
            const listItem = document.createElement('li');
            listItem.className = 'video-item';
            
            listItem.innerHTML = `
                <div class="thumbnail">
                    <img src="${video.thumbnail_url}" alt="${video.title}">
                </div>
                <div class="video-details">
                    <h3>${video.title}</h3>
                    <small>${video.duration_minutes} min</small>
                </div>
            `;
            
            listItem.addEventListener('click', () => {
                loadVideo(video, true); // true = autoplay
            });
            
            videoList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Erro ao carregar vídeos relacionados:', error);
    }
}

// Função para carregar a barra de progresso
function loadCourseProgress() {
    try {
        const progress = mockDatabase.progress;
        const percentage = (progress.completed_videos / progress.total_videos) * 100;

        document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${progress.completed_videos} de ${progress.total_videos} vídeos concluídos`;

    } catch (error) { 
        console.error('Erro ao carregar progresso do curso:', error);
    }
}

// Função para SALVAR o clique no "Favoritar"
function toggleFavoriteStatus() {
    // Inverte o status do curso principal
    const newStatus = !currentCourse.is_favorite; 
    currentCourse.is_favorite = newStatus;
    
    try {
        // Salva no localStorage
        localStorage.setItem('course_favorite_' + currentCourse.id, newStatus);
        // Atualiza a aparência do botão
        updateFavoriteButton(newStatus);
    } catch (error) {
        console.error('Erro ao salvar favorito no localStorage:', error);
    }
}

// Função para MUDAR A APARÊNCIA do botão
function updateFavoriteButton(isFavorite) {
    const favButton = document.getElementById('favorite-btn');
    if (isFavorite) {
        favButton.innerHTML = `<i class="fa-solid fa-heart"></i> Favoritado`;
        favButton.classList.add('favorited');
    } else {
        favButton.innerHTML = `<i class="fa-regular fa-heart"></i> Favoritar`;
        favButton.classList.remove('favorited');
    }
}

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(granted => {
    if (granted) {
      console.log("O armazenamento persistente foi concedido.");
    } else {
      console.log("O armazenamento persistente foi negado.");
    }
  });
}