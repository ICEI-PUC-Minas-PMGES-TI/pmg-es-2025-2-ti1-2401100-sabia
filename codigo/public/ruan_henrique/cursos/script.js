document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:3000/cursos';
    const paginaAtual = window.location.pathname.split('/').pop();

    if (paginaAtual === 'index.html' || paginaAtual === '') {
        carregarCursos();
    }

    if (paginaAtual === 'cadastro.html') {
        inicializarFormCadastro();
    }

    async function carregarCursos() {
        const tabelaCorpo = document.getElementById('tabela-cursos-corpo');
        if (!tabelaCorpo) return;

        try {
            const response = await fetch(API_URL);
            const cursos = await response.json();

            tabelaCorpo.innerHTML = ''; 

            if (cursos.length === 0) {
                tabelaCorpo.innerHTML = `<tr><td colspan="9" style="text-align:center;">Nenhum curso cadastrado ainda.</td></tr>`;
            }

            document.getElementById('total-cursos').textContent = cursos.length;
            document.getElementById('total-publicados').textContent = cursos.filter(c => c.status === 'Publicado').length;
            document.getElementById('total-rascunhos').textContent = cursos.filter(c => c.status === 'Rascunho').length;
            document.getElementById('total-arquivados').textContent = cursos.filter(c => c.status === 'Arquivado').length;


            cursos.forEach(curso => {
                const tr = document.createElement('tr');
                
                const certificadoTag = curso.gera_certificado ? '<span class="tag-sim">✔ Sim</span>' : '<span class="tag-nao">✖ Não</span>';
                const statusTag = `<span class="status-tag status-${curso.status.toLowerCase()}">${curso.status}</span>`;
                const dataFormatada = new Date(curso.ultima_atualizacao).toLocaleDateString('pt-BR');
                
                tr.innerHTML = `
                    <td><img src="${curso.thumbnail_url || 'https://via.placeholder.com/60x40'}" alt="thumbnail" class="thumbnail-tabela"></td>
                    <td>
                        <strong>${curso.titulo}</strong>
                        <small>${curso.professor}</small>
                    </td>
                    <td>${curso.categoria}</td>
                    <td>${curso.num_aulas}</td>
                    <td>${curso.num_atividades}</td>
                    <td>${certificadoTag}</td>
                    <td>${statusTag}</td>
                    <td>${dataFormatada}</td>
                    <td class="acoes">
                        <a href="#" title="Editar"><i class="fa-solid fa-pencil"></i></a>
                        <a href="#" class="btn-delete" data-id="${curso.id}" title="Excluir"><i class="fa-solid fa-trash"></i></a>
                        <a href="#" title="Mais Opções"><i class="fa-solid fa-ellipsis-vertical"></i></a>
                    </td>
                `;
                tabelaCorpo.appendChild(tr);
            });

            adicionarListenersDelete();

        } catch (error) {
            console.error('Erro ao carregar cursos:', error);
            tabelaCorpo.innerHTML = `<tr><td colspan="9" style="text-align:center;">Erro ao carregar cursos.</td></tr>`;
        }
    }

    function adicionarListenersDelete() {
        const botoesDelete = document.querySelectorAll('.btn-delete');
        botoesDelete.forEach(botao => {
            botao.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = botao.dataset.id;
                
                if (confirm(`Tem certeza que quer excluir o curso ID ${id}?`)) {
                    try {
                        await fetch(`${API_URL}/${id}`, {
                            method: 'DELETE'
                        });
                        alert('Curso excluído com sucesso!');
                        carregarCursos(); 
                    } catch (error) {
                        console.error('Erro ao excluir curso:', error);
                        alert('Erro ao excluir curso.');
                    }
                }
            });
        });
    }

    function inicializarFormCadastro() {
        const form = document.getElementById('form-cadastro-curso');
        if (!form) return;

        const uploadThumbArea = document.querySelector('.upload-area-thumb');
        const inputThumb = document.getElementById('thumbnail');
        const uploadAnexoArea = document.querySelector('.upload-area-anexo');
        const inputAnexo = document.getElementById('anexos_gerais');

        if (uploadThumbArea && inputThumb) {
            uploadThumbArea.addEventListener('click', () => inputThumb.click());
        }
        
        if (uploadAnexoArea && inputAnexo) {
            uploadAnexoArea.addEventListener('click', () => inputAnexo.click());
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const dadosCurso = Object.fromEntries(formData.entries());

            dadosCurso.gera_certificado = document.getElementById('gera_certificado').checked;
            dadosCurso.tags = dadosCurso.tags.split(',').map(tag => tag.trim());
            
            dadosCurso.num_aulas = parseInt(dadosCurso.num_aulas);
            dadosCurso.num_atividades = parseInt(dadosCurso.num_atividades);
            dadosCurso.duracao_horas = parseInt(dadosCurso.duracao_horas);
            
            dadosCurso.data_publicacao = dadosCurso.data_publicacao || null;
            dadosCurso.ultima_atualizacao = new Date().toISOString();
            
            try {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dadosCurso)
                });

                alert('Curso cadastrado com sucesso!');
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Erro ao cadastrar curso:', error);
                alert('Erro ao cadastrar curso. Verifique o console.');
            }
        });
    }

});