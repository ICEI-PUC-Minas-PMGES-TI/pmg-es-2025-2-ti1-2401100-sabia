document.addEventListener('DOMContentLoaded', () => {

    const formAtividade = document.getElementById('form-atividade');
    const anexoInput = document.getElementById('anexos');
    const uploadArea = document.getElementById('upload-area');
    const listaAtividadesContainer = document.getElementById('lista-atividades-recentes');

    function carregarAtividades() {
        listaAtividadesContainer.innerHTML = '';
        const atividades = JSON.parse(localStorage.getItem('atividades')) || [];

        if (atividades.length === 0) {
            listaAtividadesContainer.innerHTML = '<p style="font-size: 14px; color: #777;">Nenhuma atividade recente.</p>';
            return;
        }

        const atividadesRecentes = atividades.slice(-3).reverse();

        atividadesRecentes.forEach(atividade => {
            const prazoFormatado = new Date(atividade.prazo_entrega).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const cardHTML = `
                <div class="card card-atividade">
                    <p><strong>${atividade.titulo}</strong></p>
                    <small>${atividade.tipo} • Prazo: ${prazoFormatado}</small>
                    <span class="status pendente">Pendente</span> 
                </div>
            `;
            
            listaAtividadesContainer.innerHTML += cardHTML;
        });
    }

    formAtividade.addEventListener('submit', (event) => {
        
        event.preventDefault();

        const tituloInput = document.getElementById('titulo');
        const descricaoInput = document.getElementById('descricao');
        const tipoInput = document.getElementById('tipo');
        const prazoInput = document.getElementById('prazo');

        if (tituloInput.value.trim() === '') {
            alert('Por favor, preencha o Título da Atividade.');
            tituloInput.focus();
            return;
        }
        if (prazoInput.value === '') {
            alert('Por favor, selecione um Prazo de Entrega.');
            prazoInput.focus();
            return;
        }
        if (tipoInput.value === '') {
            alert('Por favor, selecione um Tipo de Atividade.');
            tipoInput.focus();
            return;
        }

        const nomesDosArquivos = [];
        if (anexoInput.files.length > 0) {
            for (let i = 0; i < anexoInput.files.length; i++) {
                nomesDosArquivos.push(anexoInput.files[i].name);
            }
        }

        const novaAtividade = {
            id: "atividade_id_" + new Date().getTime(),
            titulo: tituloInput.value,
            descricao: descricaoInput.value,
            tipo: tipoInput.value,
            data_criacao: new Date().toISOString(),
            prazo_entrega: prazoInput.value,
            materiais_apoio: nomesDosArquivos, 
            associacao: {
                curso_id: null,
                disciplina_id: null,
                turma_id: document.getElementById('turma').value
            },
            status_alunos: [],
            quantidade_submissoes: 0,
            numero_visualizacoes: 0
        };

        try {
            const atividadesSalvas = JSON.parse(localStorage.getItem('atividades')) || [];
            atividadesSalvas.push(novaAtividade);
            localStorage.setItem('atividades', JSON.stringify(atividadesSalvas));

            alert('Atividade salva com sucesso!');
            
            formAtividade.reset();
            uploadArea.querySelector('p').textContent = 'Arraste arquivos aqui ou clique para selecionar';

            carregarAtividades();

        } catch (error) {
            console.error('Erro ao salvar no Local Storage:', error);
            alert('Houve um erro ao salvar a atividade.');
        }
    });

    uploadArea.addEventListener('click', () => {
        anexoInput.click();
    });

    anexoInput.addEventListener('change', () => {
        if (anexoInput.files.length > 0) {
            let nomes = [];
            for(let i = 0; i < anexoInput.files.length; i++) {
                nomes.push(anexoInput.files[i].name);
            }
            uploadArea.querySelector('p').textContent = nomes.join(', ');
        } else {
            uploadArea.querySelector('p').textContent = 'Arraste arquivos aqui ou clique para selecionar';
        }
    });

    carregarAtividades();

});
