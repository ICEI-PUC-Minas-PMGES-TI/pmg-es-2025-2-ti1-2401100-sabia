/*
   ARQUIVO: script.js
   Funcionalidade da página de Cadastro de Atividade.
   *** ATUALIZADO PARA SALVAR NOMES DOS ANEXOS ***
*/

// Espera o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleciona os elementos do formulário
    const formAtividade = document.getElementById('form-atividade');
    const tituloInput = document.getElementById('titulo');
    const descricaoInput = document.getElementById('descricao');
    const tipoInput = document.getElementById('tipo');
    const prazoInput = document.getElementById('prazo');
    const anexoInput = document.getElementById('anexos'); // <- Pega o input de anexo
    const uploadArea = document.getElementById('upload-area'); // <- Pega a area de upload

    // 2. Adiciona o "escutador" de evento para o envio (submit) do formulário
    formAtividade.addEventListener('submit', (event) => {
        
        // Previne o comportamento padrão do formulário (que recarregaria a página)
        event.preventDefault();

        // 3. Validação simples
        if (tituloInput.value.trim() === '') {
            alert('Por favor, preencha o Título da Atividade.');
            tituloInput.focus();
            return; // Para a execução
        }
        
        if (prazoInput.value === '') {
            alert('Por favor, selecione um Prazo de Entrega.');
            prazoInput.focus();
            return; // Para a execução
        }

        if (tipoInput.value === '') {
            alert('Por favor, selecione um Tipo de Atividade.');
            tipoInput.focus();
            return; // Para a execução
        }

        // *** INÍCIO DA CORREÇÃO ***
        // Pega os NOMES dos arquivos do input "anexos"
        const nomesDosArquivos = [];
        if (anexoInput.files.length > 0) {
            for (let i = 0; i < anexoInput.files.length; i++) {
                nomesDosArquivos.push(anexoInput.files[i].name);
            }
        }
        // *** FIM DA CORREÇÃO ***


        // 4. Monta o objeto JSON da atividade
        // (Baseado na ESTRUTURA DE DADOS que VOCÊ definiu no planejamento)
        const novaAtividade = {
            id: "atividade_id_" + new Date().getTime(), // ID único
            titulo: tituloInput.value,
            descricao: descricaoInput.value,
            tipo: tipoInput.value,
            data_criacao: new Date().toISOString(), // Data de hoje em formato ISO
            prazo_entrega: prazoInput.value, // O valor do datetime-local já é o formato correto
            
            // *** APLICA A CORREÇÃO AQUI ***
            materiais_apoio: nomesDosArquivos, 
            
            associacao: {
                curso_id: null,
                disciplina_id: null,
                turma_id: document.getElementById('turma').value // Pega o valor da turma
            },
            status_alunos: [], // Começa vazio
            quantidade_submissoes: 0,
            numero_visualizacoes: 0
        };

        // 5. Salva no Local Storage
        try {
            // Pega a lista de atividades que JÁ EXISTE no Local Storage
            const atividadesSalvas = JSON.parse(localStorage.getItem('atividades')) || [];

            // Adiciona a nova atividade na lista
            atividadesSalvas.push(novaAtividade);

            // Salva a lista ATUALIZADA de volta no Local Storage
            localStorage.setItem('atividades', JSON.stringify(atividadesSalvas));

            // 6. Feedback para o usuário
            alert('Atividade salva com sucesso!');
            
            // 7. Limpa o formulário
            formAtividade.reset();

            // 8. Limpa o texto do upload (CORREÇÃO BÔNUS)
            uploadArea.querySelector('p').textContent = 'Arraste arquivos aqui ou clique para selecionar';


        } catch (error) {
            console.error('Erro ao salvar no Local Storage:', error);
            alert('Houve um erro ao salvar a atividade.');
        }
    });

    // Bônus: Funcionalidade para o campo de Upload (Essa parte já estava certa)
    uploadArea.addEventListener('click', () => {
        anexoInput.click(); // Simula o clique no input file escondido
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

});