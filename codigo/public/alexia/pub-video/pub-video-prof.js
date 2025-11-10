//-----------------------------------POP-UP CANCELAR AULA ---------------------------------------------
const botoesExcluir = document.querySelectorAll('.button-excluir');

botoesExcluir.forEach(botao => {
    botao.addEventListener('click', function() {

        const temCerteza = window.confirm("Tem certeza que deseja excluir esta aula?");

        if (temCerteza) {
            const cardDaAula = this.closest('.videoaulas');
            cardDaAula.remove();
            console.log("Aula excluída!");
        }
    });
});

//----------------------------------PUP-UP PUBLICAR AULA ---------------------------------------------------

const botaoPublicar = document.querySelector('#button-publicar-aula');
const inputTitulo = document.querySelector('#titulo-aula');
const inputDescricao = document.querySelector('#descricao-aula');

botaoPublicar.addEventListener('click', function(event) {

    if (inputTitulo.value === "") {
        alert("Por favor, preencha o Título da Aula.");
        inputTitulo.style.borderColor = "red";
        return;
    }

    if (inputDescricao.value === "") {
        alert("Por favor, preencha a Descrição.");
        inputDescricao.style.borderColor = "red";
        return;
    }

    alert("Aula publicada com sucesso!");

    inputTitulo.value = "";
    inputDescricao.value = "";
    inputTitulo.style.borderColor = "#e0e0e0";
    inputDescricao.style.borderColor = "#e0e0e0";
});
//---------------------------------------FEEDBACK UPLOAD VIDEOS ---------------------------------------------

const inputVideo = document.querySelector('#upload-video');
const pUploadVideo = document.querySelector('.upload-box[for="upload-video"] p');


inputVideo.addEventListener('change', function() {

    if (this.files && this.files.length > 0) {
        pUploadVideo.textContent = this.files[0].name;
    } else {
        pUploadVideo.textContent = "Arraste o vídeo aqui ou clique para selecionar";
    }
});