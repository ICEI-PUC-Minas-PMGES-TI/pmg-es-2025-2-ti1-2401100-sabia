// certificados.js - funcionalidades especificas da pagina de certificados

// constantes da api
const API_BASE_URL = 'http://localhost:3000';

// variaveis globais
let cursosDisponiveis = [];
let certificadosEmitidos = [];
let cursoSelecionado = null;

// carrega certificados disponiveis
async function carregarCertificados() {
    try {
        alunoUI.showLoading();
        alunoUI.hideError();
        
        // verifica autenticacao
        if (!alunoAuth.isLoggedIn()) {
            console.log('usuario nao autenticado');
            window.location.href = '../../../login/login.html';
            return;
        }
        
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        
        console.log('carregando certificados disponiveis...');
        const response = await fetch(`${API_BASE_URL}/api/certificados/cursos-disponiveis`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`erro na api: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('certificados carregados:', data);
        
        cursosDisponiveis = data || [];
        
        // carrega certificados ja emitidos separadamente
        await carregarCertificadosEmitidos();
        
        // atualiza interface
        exibirCertificados();
        
    } catch (error) {
        console.error('erro ao carregar certificados:', error);
        alunoUI.showError('erro ao carregar certificados: ' + error.message);
    } finally {
        alunoUI.hideLoading();
    }
}

// carrega certificados ja emitidos
async function carregarCertificadosEmitidos() {
    try {
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        if (!token) {
            console.error('token nao encontrado');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/certificados/meus-certificados`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('certificados emitidos:', data);
        
        certificadosEmitidos = data.certificados || [];

    } catch (error) {
        console.error('erro ao carregar certificados emitidos:', error);
    }
}

// exibe certificados na interface
function exibirCertificados() {
    const cursosGrid = document.getElementById('cursosGrid');
    const emitidosGrid = document.getElementById('emitidosGrid');
    const certificadosEmitidosSection = document.getElementById('certificadosEmitidos');
    
    // limpa grids
    if (cursosGrid) cursosGrid.innerHTML = '';
    if (emitidosGrid) emitidosGrid.innerHTML = '';
    
    // exibe cursos disponiveis
    if (cursosDisponiveis.length > 0) {
        cursosDisponiveis.forEach(curso => {
            if (cursosGrid) {
                cursosGrid.appendChild(criarCardCurso(curso));
            }
        });
    } else {
        if (cursosGrid) {
            cursosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <h3>Nenhum curso concluído</h3>
                    <p>Complete seus cursos para gerar certificados</p>
                </div>
            `;
        }
    }
    
    // exibe certificados emitidos
    if (certificadosEmitidos.length > 0) {
        if (certificadosEmitidosSection) {
            certificadosEmitidosSection.style.display = 'block';
        }
        
        certificadosEmitidos.forEach(certificado => {
            if (emitidosGrid) {
                emitidosGrid.appendChild(criarCardCertificadoEmitido(certificado));
            }
        });
    } else {
        if (certificadosEmitidosSection) {
            certificadosEmitidosSection.style.display = 'none';
        }
    }
    
    console.log(`exibidos ${cursosDisponiveis.length} cursos e ${certificadosEmitidos.length} certificados`);
}

// cria card de curso disponivel
function criarCardCurso(curso) {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    
    card.innerHTML = `
        <div class="certificate-status status-available">Disponível</div>
        <h3 class="course-title">${curso.titulo}</h3>
        <div class="course-category">${curso.categoria}</div>
        
        <div class="course-details">
            <div class="detail-item">
                <span class="detail-label">Data conclusão</span>
                <span class="detail-value">${formatarData(curso.data_conclusao)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nota final</span>
                <span class="detail-value">${curso.nota_final} pontos</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Carga horária</span>
                <span class="detail-value">${curso.carga_horaria}h</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nível</span>
                <span class="detail-value">${curso.nivel}</span>
            </div>
        </div>
        
        <div class="certificate-actions">
            <button class="btn-generate" onclick="abrirModal('${curso.id}')">
                <i class="fas fa-certificate"></i>
                Gerar certificado
            </button>
        </div>
    `;
    
    return card;
}

// cria card de certificado emitido
function criarCardCertificadoEmitido(certificado) {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    
    card.innerHTML = `
        <div class="certificate-status status-generated">Emitido</div>
        <h3 class="course-title">${certificado.curso_titulo}</h3>
        <div class="course-category">${certificado.categoria}</div>
        
        <div class="course-details">
            <div class="detail-item">
                <span class="detail-label">Data emissão</span>
                <span class="detail-value">${formatarData(certificado.data_emissao)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Token</span>
                <span class="detail-value">${certificado.token_validacao.substring(0, 8)}...</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Formato</span>
                <span class="detail-value">PDF</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Validade</span>
                <span class="detail-value">Permanente</span>
            </div>
        </div>
        
        <div class="certificate-actions">
            <button class="btn-view" onclick="visualizarCertificado('${certificado.id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-download" onclick="baixarCertificado('${certificado.id}')">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `;
    
    return card;
}

// abre modal para gerar certificado
function abrirModalGeracao(cursoId) {
    const curso = cursosDisponiveis.find(c => c.id === cursoId);
    if (!curso) {
        alert('curso nao encontrado');
        return;
    }
    
    cursoSelecionado = curso;
    
    // atualiza conteudo do modal
    const courseInfo = document.getElementById('courseInfo');
    if (courseInfo) {
        courseInfo.innerHTML = `
            <h4>${curso.titulo}</h4>
            <p><strong>categoria:</strong> ${curso.categoria}</p>
            <p><strong>nota final:</strong> ${curso.nota_final} pontos</p>
            <p><strong>carga horaria:</strong> ${curso.carga_horaria} horas</p>
            <p><strong>data de conclusao:</strong> ${formatarData(curso.data_conclusao)}</p>
        `;
    }
    
    // abre modal usando funcao compartilhada
    alunoModal.open('confirmModal');
}

// confirma geracao do certificado
async function confirmarGeracao() {
    if (!cursoSelecionado) {
        alert('nenhum curso selecionado');
        return;
    }
    
    try {
        alunoModal.close('confirmModal');
        alunoUI.showLoading();
        
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        
        console.log(`gerando certificado para curso: ${cursoSelecionado.titulo}`);
        
        const response = await fetch(`${API_BASE_URL}/api/certificados/gerar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                curso_id: cursoSelecionado.id
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao gerar certificado: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('certificado gerado:', result);
        
        // atualiza modal de sucesso
        const certificateDetails = document.getElementById('certificateDetails');
        if (certificateDetails) {
            certificateDetails.innerHTML = `
                <h4>${cursoSelecionado.titulo}</h4>
                <p><strong>token de validacao:</strong> ${result.token_validacao}</p>
                <p><strong>data de emissao:</strong> ${formatarData(new Date())}</p>
            `;
        }
        
        // salva id do certificado para download
        window.ultimoCertificadoId = result.certificado_id;
        
        // mostra modal de sucesso
        alunoModal.open('successModal');
        
        // recarrega certificados
        await carregarCertificados();
        
    } catch (error) {
        console.error('erro ao gerar certificado:', error);
        alert('Erro ao gerar certificado: ' + error.message);
    } finally {
        alunoUI.hideLoading();
    }
}

// baixa certificado
async function baixarCertificado(certificadoId) {
    try {
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        
        console.log(`baixando certificado: ${certificadoId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/certificados/${certificadoId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao baixar certificado: ${response.status}`);
        }
        
        // cria download do arquivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `certificado_${certificadoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Download concluído');
        
    } catch (error) {
        console.error('erro ao baixar certificado:', error);
        alert('Erro ao baixar certificado: ' + error.message);
    }
}

// baixa certificado do modal de sucesso
function baixarCertificadoModal() {
    if (window.ultimoCertificadoId) {
        baixarCertificado(window.ultimoCertificadoId);
        alunoModal.close('successModal');
    } else {
        alert('id do certificado nao encontrado');
    }
}

// visualiza certificado
async function visualizarCertificado(certificadoId) {
    try {
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        
        console.log(`visualizando certificado: ${certificadoId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/certificados/${certificadoId}/view`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao visualizar certificado: ${response.status}`);
        }
        
        // abre em nova aba
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // limpa url apos um tempo
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 60000);
        
    } catch (error) {
        console.error('erro ao visualizar certificado:', error);
        alert('Erro ao visualizar certificado: ' + error.message);
    }
}

// fecha modais
function fecharModal() {
    alunoModal.close('confirmModal');
}

function fecharModalSucesso() {
    alunoModal.close('successModal');
}

// formata data para exibicao
function formatarData(data) {
    if (!data) return 'n/a';
    
    const date = typeof data === 'string' ? new Date(data) : data;
    return date.toLocaleDateString('pt-BR');
}

// aplicar filtros
function aplicarFiltros() {
    const categoriaFilter = document.getElementById('categoriaFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    console.log('aplicando filtros:', { categoria: categoriaFilter, status: statusFilter });
    
    // filtra cursos disponiveis
    const cursosGrid = document.getElementById('cursosGrid');
    if (cursosGrid) {
        const cards = cursosGrid.querySelectorAll('.certificate-card');
        cards.forEach(card => {
            let mostrar = true;
            
            if (categoriaFilter) {
                const categoria = card.querySelector('.course-category')?.textContent || '';
                mostrar = mostrar && categoria.toLowerCase().includes(categoriaFilter.toLowerCase());
            }
            
            if (statusFilter === 'disponivel') {
                mostrar = mostrar && card.querySelector('.status-available');
            }
            
            card.style.display = mostrar ? 'block' : 'none';
        });
    }
    
    // filtra certificados emitidos
    const emitidosGrid = document.getElementById('emitidosGrid');
    if (emitidosGrid && statusFilter !== 'disponivel') {
        const cards = emitidosGrid.querySelectorAll('.certificate-card');
        cards.forEach(card => {
            let mostrar = true;
            
            if (categoriaFilter) {
                const categoria = card.querySelector('.course-category')?.textContent || '';
                mostrar = mostrar && categoria.toLowerCase().includes(categoriaFilter.toLowerCase());
            }
            
            if (statusFilter === 'emitido') {
                mostrar = mostrar && card.querySelector('.status-generated');
            }
            
            card.style.display = mostrar ? 'block' : 'none';
        });
    }
}

// inicializacao da pagina
document.addEventListener('DOMContentLoaded', async function() {
    console.log('inicializando pagina de certificados...');
    
    // aguarda scripts compartilhados carregarem
    setTimeout(async () => {
        // carrega certificados
        await carregarCertificados();
        
        // configura filtros
        const categoriaFilter = document.getElementById('categoriaFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (categoriaFilter) {
            categoriaFilter.addEventListener('change', aplicarFiltros);
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', aplicarFiltros);
        }
        
        console.log('pagina de certificados inicializada');
    }, 100);
});