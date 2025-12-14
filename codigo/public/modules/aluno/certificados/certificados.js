// certificados.js - funcionalidades especificas da pagina de certificados

// constantes da api
const API_BASE_URL = window.SABIAA_CONFIG && window.SABIAA_CONFIG.API_BASE_URL ? window.SABIAA_CONFIG.API_BASE_URL : 'https://sabiaa.onrender.com';

// inicial debug logs e captura de erros globais
console.log('certificados.js carregado — iniciando debug');
window.addEventListener('error', (e) => {
    console.error('certificados.js global error:', e.message || e);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('certificados.js unhandledrejection:', e.reason || e);
});

// delegated click listener para garantir captura do click no botão confirmar
document.addEventListener('click', function delegatedConfirmClick(e) {
    try {
        const btn = e.target.closest && e.target.closest('#confirmBtn');
        if (btn) {
            console.log('delegated listener: #confirmBtn click captured — disabled=', btn.disabled);
            // evitar dupla execução se onclick inline já chamou (checar se botao tem data-handled)
            if (!btn.dataset._confirmHandled) {
                btn.dataset._confirmHandled = '1';
                try { confirmarGeracao(); } catch(err) { console.error('erro ao chamar confirmarGeracao delegated:', err); }
                // limpar flag depois de curto tempo para permitir novos cliques
                setTimeout(()=>{ delete btn.dataset._confirmHandled; }, 2000);
            } else {
                console.log('delegated: click ignorado por flag de reentrancia');
            }
        }
    } catch (err) {
        console.error('delegated click handler error:', err);
    }
});

// delegated listener para garantir que botões Gerar chamem abrirModalGeracao
document.addEventListener('click', function delegatedGenerateClick(e) {
    try {
        const btn = e.target.closest && e.target.closest('.btn-generate');
        if (btn) {
            const cursoId = btn.dataset.cursoId || btn.getAttribute('data-curso-id') || null;
            console.log('delegated listener: .btn-generate click captured — cursoId=', cursoId);
            if (cursoId) {
                try { abrirModalGeracao(cursoId); } catch(err) { console.error('erro ao chamar abrirModalGeracao delegated:', err); }
            } else {
                // fallback: tentar extrair id do atributo onclick string (se ainda existir)
                const onclick = btn.getAttribute && btn.getAttribute('onclick');
                if (onclick) {
                    const m = onclick.match(/abrirModalGeracao\(['"]([^'\"]+)['"]\)/);
                    if (m && m[1]) {
                        try { abrirModalGeracao(m[1]); } catch(err) { console.error('erro ao chamar abrirModalGeracao via onclick parse:', err); }
                    } else {
                        console.warn('delegated: não foi possível extrair cursoId do onclick');
                    }
                } else {
                    console.warn('delegated: botão .btn-generate sem data-curso-id nem onclick');
                }
            }
            e.preventDefault();
        }
    } catch (err) {
        console.error('delegatedGenerateClick error:', err);
    }
});

// variaveis globais
let cursosDisponiveis = [];
let certificadosEmitidos = [];
let cursoSelecionado = null;

// Helper fetch com timeout para evitar travamentos de request
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const resp = await fetch(resource, { signal: controller.signal, ...options });
        clearTimeout(id);
        return resp;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

// carrega certificados disponiveis
async function carregarCertificados() {
    try {
        alunoUI.showLoading();
        alunoUI.hideError();
        
        // verifica autenticacao
        if (!alunoAuth.isLoggedIn()) {
            console.log('usuario nao autenticado');
            window.location.href = '/codigo/public/modules/auth/login.html';
            return;
        }
        
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        const user = (typeof alunoAuth !== 'undefined' && alunoAuth.getUser) ? alunoAuth.getUser() : null;
        
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

        // se API padrão retornou vazio, tentar fallback usando dados locais (progresso_cursos + cursos)
        if ((!cursosDisponiveis || cursosDisponiveis.length === 0)) {
            try {
                const urlParams = new URLSearchParams(location.search);
                const forcedUserId = urlParams.get('asUser') || urlParams.get('asuser') || null;
                const localUser = (typeof alunoAuth !== 'undefined' && alunoAuth.getUser) ? alunoAuth.getUser() : null;
                const localUserId = forcedUserId || (localUser && localUser.id ? localUser.id : null);
                if (forcedUserId) console.log('fallback: usando asUser override from URL:', forcedUserId);
                console.log('fallback: cursosDisponiveis vazio — tentando progresso_cursos para user:', localUserId);
                if (localUserId) {
                    // usar a mesma API que as páginas de curso usam: /api/inscricoes?aluno_id=...
                    // tenta buscar inscrições com ambos os parâmetros possíveis e loga a URL
                    const base = API_BASE_URL.replace(/\/$/, '');
                    const urlAluno = `${base}/api/inscricoes?aluno_id=${encodeURIComponent(localUserId)}`;
                    const urlUsuario = `${base}/api/inscricoes?usuario_id=${encodeURIComponent(localUserId)}`;

                    console.log('fallback: consultando inscrições em:', urlAluno, 'e', urlUsuario);

                    let inscricoes = [];
                    try {
                        console.log('fallback: fetch ->', urlAluno);
                        const inscricoesRes = await fetch(urlAluno);
                        if (inscricoesRes.ok) {
                            const parsed = await inscricoesRes.json();
                            inscricoes = Array.isArray(parsed) ? parsed : (parsed.value || (parsed.items || []));
                        } else {
                            console.log('fallback: resposta não ok para aluno_id', inscricoesRes.status);
                        }
                    } catch (e) {
                        console.warn('fallback: erro ao buscar inscricoes com aluno_id', e);
                    }

                    if ((!inscricoes || inscricoes.length === 0)) {
                        try {
                            console.log('fallback: tentando parametro usuario_id ->', urlUsuario);
                            const inscricoesRes2 = await fetch(urlUsuario);
                            if (inscricoesRes2.ok) {
                                const parsed2 = await inscricoesRes2.json();
                                inscricoes = Array.isArray(parsed2) ? parsed2 : (parsed2.value || (parsed2.items || []));
                            } else {
                                console.log('fallback: resposta não ok para usuario_id', inscricoesRes2.status);
                            }
                        } catch (e) {
                            console.warn('fallback: erro ao buscar inscricoes com usuario_id', e);
                        }
                    }

                    // lista de cursos para mapear metadata
                    const cursosRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/cursos`);
                    const cursosAll = cursosRes.ok ? await cursosRes.json() : [];

                    // certificados existentes para o usuario (consulta pública)
                    const certsRes = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/certificados?usuario_id=${encodeURIComponent(localUserId)}`);
                    const certsList = certsRes.ok ? await certsRes.json() : [];
                    const certCursoIds = new Set((certsList || []).map(c => c.curso_id || c.curso || c.cursoId));

                    console.log('fallback: inscricoes len=', (inscricoes||[]).length, 'inscricoes=', inscricoes);
                    console.log('fallback: certificados len=', (certsList||[]).length, 'certificados=', certsList);
                    console.log('fallback: certificados cursos ids:', Array.from(certCursoIds));

                    const built = (inscricoes || [])
                        .filter(ins => {
                            // considerar concluído se progresso >=100 ou status explicitamente marcado
                            const progresso = ins.progresso || ins.progresso_porcentagem || 0;
                            return (Number(progresso) >= 100) || (ins.status && String(ins.status).toLowerCase().includes('conclu'));
                        })
                        .map(ins => {
                            if (certCursoIds.has(ins.curso_id)) return null; // já tem certificado
                            const curso = (cursosAll || []).find(c => c.id === ins.curso_id || c.id == ins.curso_id);
                            return curso ? {
                                id: curso.id,
                                titulo: curso.titulo || curso.nome || 'Curso',
                                instrutor: curso.instrutor || '',
                                carga_horaria: curso.carga_horaria || curso.cargaHoraria || 0,
                                categoria: curso.categoria || '',
                                nivel: curso.nivel || '',
                                total_aulas: curso.total_aulas || (ins.aulas_concluidas || []).length || 0,
                                progresso: {
                                    aulas_assistidas: (ins.aulas_concluidas || []).length || 0,
                                    data_conclusao: ins.data_conclusao || ins.dataConclusao || ins.data_inscricao || null,
                                    nota_final: ins.nota_final || ins.notaFinal || 0
                                }
                            } : null;
                        }).filter(Boolean);

                    if (built.length) {
                        console.log('fallback: montados', built.length, 'cursos a partir de /api/inscricoes');
                        cursosDisponiveis = built;
                    } else {
                        console.log('fallback: nenhum curso sem certificado encontrado. Possíveis motivos: nenhuma inscrição concluída encontrada ou certificados já emitidos para as inscrições retornadas.');
                    }
                }
            } catch (e) {
                console.warn('fallback erro ao montar cursosDisponiveis:', e);
            }
        }

        // carrega certificados ja emitidos separadamente (tenta pelo endpoint autenticado e fallback público)
        await carregarCertificadosEmitidosComFallback();

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

// Fallback público: se endpoint autenticado não retornar certificados, tentar buscar por usuario_id
async function carregarCertificadosEmitidosComFallback() {
    await carregarCertificadosEmitidos();
    try {
        if ((!certificadosEmitidos || certificadosEmitidos.length === 0)) {
            const urlParams = new URLSearchParams(location.search);
            const forcedUserId = urlParams.get('asUser') || urlParams.get('asuser') || null;
            const localUser = (typeof alunoAuth !== 'undefined' && alunoAuth.getUser) ? alunoAuth.getUser() : null;
            const localUserId = forcedUserId || (localUser && localUser.id ? localUser.id : null);
            if (localUserId) {
                try {
                    const base = API_BASE_URL.replace(/\/$/, '');
                    const certsRes = await fetch(`${base}/api/certificados?usuario_id=${encodeURIComponent(localUserId)}`);
                    if (certsRes.ok) {
                        const certs = await certsRes.json();
                        console.log('fallback: certificados (public) encontrados:', certs.length || (Array.isArray(certs)?certs.length:0));
                        // tentar normalizar formato esperado por UI
                        if (Array.isArray(certs) && certs.length > 0) {
                            certificadosEmitidos = certs.map(c => ({
                                id: c.id || c.certificado_id || c.codigo || '',
                                curso_titulo: c.dados_curso?.titulo || c.curso_titulo || (c.dados_curso && c.dados_curso.titulo) || '',
                                categoria: c.dados_curso?.categoria || c.categoria || '',
                                data_emissao: c.data_emissao || c.data_geracao || c.data_emissao || null,
                                token_validacao: c.token_validacao || c.codigo || (c.token) || ''
                            }));
                        } else if (certs && certs.certificados) {
                            certificadosEmitidos = certs.certificados;
                        }
                    } else {
                        console.log('fallback: consulta publica de certificados retornou', certsRes.status);
                    }
                } catch (e) {
                    console.warn('fallback: erro ao buscar certificados publicos', e);
                }
            }
        }
    } catch (e) {
        console.warn('erro no fallback de certificados emitidos:', e);
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
                    <h3>Nenhum Curso Concluído</h3>
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
    
    // suportar formatos retornados pela API: propriedades podem estar em curso.progresso
    const dataConclusao = curso.data_conclusao || curso.progresso?.data_conclusao || curso.progresso?.dataConclusao || null;
    const notaFinal = curso.nota_final || curso.progresso?.nota_final || curso.progresso?.notaFinal || (curso.progresso && curso.progresso.nota_final) || '—';
    const carga = curso.carga_horaria || curso.cargaHoraria || (curso.progresso && curso.progresso.carga_horaria) || '—';
    const nivel = curso.nivel || curso.nivel || '—';

    card.innerHTML = `
        <div class="certificate-status status-available">Disponível</div>
        <h3 class="course-title">${curso.titulo}</h3>
        <div class="course-category">${curso.categoria || ''}</div>
        
        <div class="course-details">
            <div class="detail-item">
                <span class="detail-label">Data de Conclusão</span>
                <span class="detail-value">${dataConclusao ? formatarData(dataConclusao) : 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nota Final</span>
                <span class="detail-value">${notaFinal !== undefined ? notaFinal + ' pontos' : '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Carga Horária</span>
                <span class="detail-value">${carga}h</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Nível</span>
                <span class="detail-value">${nivel}</span>
            </div>
        </div>
        
        <div class="certificate-actions">
            <button class="btn-generate" data-curso-id="${curso.id}">
                <i class="fas fa-certificate"></i>
                Gerar Certificado
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
                <span class="detail-label">Data de Emissão</span>
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
    console.log('abrirModalGeracao: called with cursoId=', cursoId);
    const curso = cursosDisponiveis.find(c => String(c.id) === String(cursoId));
    if (!curso) {
        alert('Curso não encontrado');
        return;
    }
    
    cursoSelecionado = curso;
    
    // atualiza conteudo do modal
    const courseInfo = document.getElementById('courseInfo');
    if (courseInfo) {
        courseInfo.innerHTML = `
            <h4>${curso.titulo}</h4>
            <p><strong>Categoria:</strong> ${curso.categoria}</p>
            <p><strong>Carga Horária:</strong> ${curso.carga_horaria} horas</p>
            <p><strong>Data de Conclusão:</strong> ${formatarData(curso.data_conclusao)}</p>
        `;
    }
    
    // abre modal usando funcao compartilhada
    // verificar existencia do modal e forcar abertura como fallback
    try {
        const modalEl = document.getElementById('confirmModal');
        console.log('abrirModalGeracao: modalEl=', !!modalEl, modalEl);
        // inject minimal fallback styles so modal-content renders correctly even
        // if page CSS is missing or overridden
        if (!document.getElementById('certModalFallbackStyles')) {
            const s = document.createElement('style');
            s.id = 'certModalFallbackStyles';
            s.textContent = `
                #confirmModal.modal { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; display: flex !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,0.5) !important; z-index: 200000 !important; }
                #confirmModal .modal-content { background: #fff !important; border-radius: 12px !important; padding: 24px !important; max-width: 640px !important; width: 90% !important; box-shadow: 0 10px 30px rgba(0,0,0,0.25) !important; color: #222 !important; }
                #confirmModal .modal-actions { display: flex !important; gap: 10px !important; justify-content: flex-end !important; margin-top: 18px !important; }
                #confirmModal .modal-content.success { text-align: center !important; }
            `;
            document.head.appendChild(s);
            console.log('abrirModalGeracao: injected certModalFallbackStyles');
        }
        alunoModal.open('confirmModal');
        // small delay then verify display
        setTimeout(() => {
            try {
                const m = document.getElementById('confirmModal');
                if (m) {
                    const styleDisplay = window.getComputedStyle(m).display;
                    console.log('abrirModalGeracao: after open computed display=', styleDisplay);
                    if (styleDisplay === 'none' || styleDisplay === '') {
                        // fallback: set inline style and add show class + stronger visibility styles
                        m.style.display = 'flex';
                        // stronger inline positioning to override page CSS issues
                        m.style.position = 'fixed';
                        m.style.top = '0';
                        m.style.left = '0';
                        m.style.right = '0';
                        m.style.bottom = '0';
                        m.style.width = '100%';
                        m.style.height = '100%';
                        m.style.background = 'rgba(0,0,0,0.5)';
                        m.style.alignItems = 'center';
                        m.style.justifyContent = 'center';
                        m.classList.add('show');
                        m.style.visibility = 'visible';
                        m.style.opacity = '1';
                        m.style.zIndex = '100000';
                        m.style.justifyContent = 'center';
                        m.style.alignItems = 'center';
                        m.style.padding = '20px';
                        document.body.style.overflow = 'hidden';
                        // ensure modal-content is visible and animated
                        try {
                            const mc = m.querySelector('.modal-content');
                            if (mc) {
                                mc.style.opacity = '1';
                                mc.style.transform = 'translateY(0)';
                                mc.style.margin = '0 auto';
                                mc.style.position = 'relative';
                                mc.style.left = 'auto';
                                mc.style.right = 'auto';
                                mc.style.maxWidth = mc.style.maxWidth || '600px';
                                mc.style.width = mc.style.width || 'min(600px,90%)';
                                mc.classList.add('animate-fade-in');
                            }
                        } catch (ee) { console.warn('abrirModalGeracao: erro ao aplicar estilo em .modal-content', ee); }
                        console.log('abrirModalGeracao: fallback applied to modal (display/visibility/zIndex/animation)');
                    }
                }
            } catch (e) { console.warn('abrirModalGeracao: fallback check error', e); }
        }, 40);
    } catch (e) {
        console.error('abrirModalGeracao: erro ao abrir modal via alunoModal.open', e);
        try {
            const m = document.getElementById('confirmModal');
            if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
        } catch (ee) { console.error('abrirModalGeracao: fallback direct open error', ee); }
    }
}

// confirma geracao do certificado
async function confirmarGeracao() {
    if (!cursoSelecionado) {
        alert('Nenhum Curso Selecionado');
        return;
    }
    
    try {
        console.log('confirmarGeracao: iniciar fluxo');
        console.log('confirmarGeracao: fechando modal de confirmacao');
        alunoModal.close('confirmModal');
        console.log('confirmarGeracao: mostrando loading');
        alunoUI.showLoading();
        console.log('confirmarGeracao: loading visivel');
        
        const token = localStorage.getItem('sabiaa_token') || localStorage.getItem('authToken');
        
        console.log(`gerando certificado para curso: ${cursoSelecionado.titulo}`);
        
        let result;
        try {
            // antes de chamar gerar, garantir que a inscrição esteja marcada como concluída
            try {
                if (user && user.id) {
                    let ins = null;
                    try {
                        const ir = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?aluno_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }, 10000);
                        if (ir.ok) {
                            const d = await ir.json();
                            ins = Array.isArray(d) ? d[0] : (d.value || [])[0] || null;
                        }
                    } catch (e) { console.warn('confirmarGeracao: erro ao buscar inscricao (aluno_id) pre-check', e); }

                    if (!ins) {
                        try {
                            const ir2 = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?usuario_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            }, 10000);
                            if (ir2.ok) {
                                const d2 = await ir2.json();
                                ins = Array.isArray(d2) ? d2[0] : (d2.value || [])[0] || null;
                            }
                        } catch (e) { console.warn('confirmarGeracao: erro ao buscar inscricao (usuario_id) pre-check', e); }
                    }

                    if (ins) {
                        const progresso = Number(ins.progresso || 0);
                        console.log('confirmarGeracao: inscricao pre-check encontrada, progresso=', progresso, 'status=', ins.status);
                        if (progresso < 100) {
                            alert('Não é possível gerar certificado: progresso do curso é menor que 100%.');
                            alunoUI.hideLoading();
                            return;
                        }

                        if (!(ins.status && String(ins.status).toLowerCase().includes('conclu'))) {
                            // marcar como concluído antes de gerar
                            try {
                                const patchBody = { progresso: 100, status: 'concluido', certificado_emitido: false };
                                console.log('confirmarGeracao: atualizando inscricao para concluido (PATCH)', ins.id, patchBody);
                                const patchRes = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes/${encodeURIComponent(ins.id)}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(patchBody)
                                }, 10000);
                                if (!patchRes.ok) console.warn('confirmarGeracao: PATCH inscricao retornou', patchRes.status);
                                else console.log('confirmarGeracao: inscrição atualizada para concluido (pre-geracao)');
                            } catch (e) { console.warn('confirmarGeracao: erro ao patchar inscricao pre-geracao', e); }
                        }
                    } else {
                        console.log('confirmarGeracao: inscricao nao encontrada no pre-check; prosseguindo para chamada gerar (backend validará)');
                    }
                }
            } catch (e) { console.warn('confirmarGeracao: erro no pre-check de inscricao', e); }

            // Re-check inscrição status to guarantee backend acceptance.
            console.log('confirmarGeracao: garantindo inscrição marcada como concluída antes do POST');
            let ensuredConcluded = false;
            try {
                if (user && user.id) {
                    // function to fetch inscription by aluno_id or usuario_id
                    const fetchInscricao = async () => {
                        try {
                            const url1 = `${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?aluno_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`;
                            const r1 = await fetchWithTimeout(url1, { headers: { 'Authorization': `Bearer ${token}` } }, 10000);
                            if (r1.ok) {
                                const d1 = await r1.json();
                                const got = Array.isArray(d1) ? d1[0] : (d1.value || [])[0] || null;
                                if (got) return got;
                            }
                        } catch (e) { console.warn('fetchInscricao: erro ao buscar por aluno_id', e); }
                        try {
                            const url2 = `${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?usuario_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`;
                            const r2 = await fetchWithTimeout(url2, { headers: { 'Authorization': `Bearer ${token}` } }, 10000);
                            if (r2.ok) {
                                const d2 = await r2.json();
                                const got2 = Array.isArray(d2) ? d2[0] : (d2.value || [])[0] || null;
                                if (got2) return got2;
                            }
                        } catch (e) { console.warn('fetchInscricao: erro ao buscar por usuario_id', e); }
                        return null;
                    };

                    let currentIns = await fetchInscricao();
                    console.log('confirmarGeracao: inscrição atual antes do POST:', currentIns);

                    if (currentIns && Number(currentIns.progresso || 0) >= 100 && String(currentIns.status || '').toLowerCase().includes('conclu')) {
                        ensuredConcluded = true;
                        console.log('confirmarGeracao: inscrição já consta como concluída');
                    } else {
                        // try PATCH first (we may have done this earlier), then try PUT if PATCH not accepted
                        const patchBody = { progresso: 100, status: 'concluido', certificado_emitido: false };
                        let patched = false;
                        try {
                            const tryPatch = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes/${encodeURIComponent(currentIns ? currentIns.id : '')}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(patchBody)
                            }, 10000);
                            if (tryPatch && tryPatch.ok) {
                                patched = true;
                                console.log('confirmarGeracao: PATCH pré-POST ok');
                            } else {
                                console.warn('confirmarGeracao: PATCH pré-POST não ok', tryPatch && tryPatch.status);
                            }
                        } catch (e) { console.warn('confirmarGeracao: erro ao tentar PATCH pré-POST', e); }

                        if (!patched) {
                            // attempt PUT with the full resource body if PATCH failed
                            try {
                                const putRes = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes/${encodeURIComponent(currentIns ? currentIns.id : '')}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify(Object.assign({}, currentIns || {}, patchBody))
                                }, 10000);
                                if (putRes && putRes.ok) {
                                    patched = true;
                                    console.log('confirmarGeracao: PUT pré-POST ok');
                                } else {
                                    console.warn('confirmarGeracao: PUT pré-POST não ok', putRes && putRes.status);
                                }
                            } catch (e) { console.warn('confirmarGeracao: erro ao tentar PUT pré-POST', e); }
                        }

                        // re-fetch inscription and verify
                        currentIns = await fetchInscricao();
                        console.log('confirmarGeracao: inscrição após tentativas de patch/put:', currentIns);
                        if (currentIns && Number(currentIns.progresso || 0) >= 100 && String(currentIns.status || '').toLowerCase().includes('conclu')) {
                            ensuredConcluded = true;
                            console.log('confirmarGeracao: inscrição agora marcada como concluída (pré-POST)');
                        } else {
                            console.warn('confirmarGeracao: não foi possível marcar inscrição como concluída; abortando geração');
                        }
                    }
                }
            } catch (e) {
                console.warn('confirmarGeracao: erro ao garantir inscrição concluída', e);
            }

            if (!ensuredConcluded) {
                alert('Não é possível gerar o certificado: inscrição não marcada como concluída no servidor. Verifique seu progresso ou contate o suporte.');
                alunoUI.hideLoading();
                return;
            }

            console.log('confirmarGeracao: realizando POST /api/certificados/gerar');
            const response = await fetchWithTimeout(`${API_BASE_URL}/api/certificados/gerar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ curso_id: cursoSelecionado.id })
            }, 15000);

            console.log('confirmarGeracao: POST retornou status', response.status);
            if (!response.ok) {
                let bodyText = '';
                try { bodyText = await response.text(); } catch(e){}
                console.error('confirmarGeracao: erro no POST gerar:', response.status, response.statusText, bodyText);
                throw new Error(`Erro ao gerar certificado: ${response.status} ${response.statusText} ${bodyText}`);
            }

            console.log('confirmarGeracao: lendo JSON do POST');
            result = await response.json();
            console.log('confirmarGeracao: JSON lido', result);
        } catch (err) {
            console.error('erro na requisição de gerar certificado:', err);
            alert('Erro ao gerar certificado: ' + (err.message || err));
            alunoUI.hideLoading();
            return;
        }
        console.log('certificado gerado:', result);
        
        // atualiza modal de sucesso com informações retornadas pelo servidor
        const certificateDetails = document.getElementById('certificateDetails');
        const certificadoData = result.certificado || result;
        const certId = certificadoData && (certificadoData.id || certificadoData.certificado_id || result.certificado_id || result.id);
        const tokenValidacao = certificadoData && (certificadoData.token_validacao || certificadoData.token || result.token_validacao || '');

        if (certificateDetails) {
            // usar handlers inline para garantir disponibilidade imediata
            const safeId = certId ? String(certId).replace(/'/g, "\\'") : '';
            certificateDetails.innerHTML = `
                <h4>${cursoSelecionado.titulo}</h4>
                <p><strong>Token de Validação:</strong> ${tokenValidacao}</p>
                <p><strong>Data de Emissão:</strong> ${formatarData(new Date(certificadoData.data_emissao || certificadoData.data_emissao || Date.now()))}</p>
                <div style="margin-top:12px">
                    <button class="btn btn-primary" onclick="(function(){ if('${safeId}') visualizarCertificado('${safeId}'); else alert('ID do certificado não disponível'); })()">Visualizar / Imprimir</button>
                    <button class="btn" onclick="(function(){ if('${safeId}') baixarCertificado('${safeId}'); else alert('ID do certificado não disponível'); })()">Baixar PDF</button>
                </div>
            `;
        }

        // salva id do certificado para download/visualizacao
        window.ultimoCertificadoId = certId;
        console.log('confirmarGeracao: ultimoCertificadoId definido =', certId);

        // mostra modal de sucesso
        console.log('confirmarGeracao: abrindo modal de sucesso');
        alunoModal.open('successModal');
        console.log('confirmarGeracao: modal de sucesso aberto');
        
        // após gerar o certificado, garantir que a inscrição do aluno esteja marcada como concluída (mesma lógica da página de aulas)
        try {
            const user = (typeof alunoAuth !== 'undefined' && alunoAuth.getUser) ? alunoAuth.getUser() : null;
            if (user && user.id) {
                // localizar inscrição
                let ins = null;
                try {
                    console.log('confirmarGeracao: buscando inscricao via aluno_id');
                    const ir = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?aluno_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }, 10000);
                    console.log('confirmarGeracao: resposta inscricao aluno_id status=', ir.status);
                    if (ir.ok) {
                        const d = await ir.json();
                        console.log('confirmarGeracao: inscricao (aluno_id) body=', d);
                        ins = Array.isArray(d) ? d[0] : (d.value || [])[0] || null;
                    }
                } catch(e) {
                    console.warn('erro ao buscar inscricao (aluno_id):', e);
                }

                if (!ins) {
                    try {
                        console.log('confirmarGeracao: buscando inscricao via usuario_id');
                        const ir2 = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes?usuario_id=${encodeURIComponent(user.id)}&curso_id=${encodeURIComponent(cursoSelecionado.id)}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }, 10000);
                        console.log('confirmarGeracao: resposta inscricao usuario_id status=', ir2.status);
                        if (ir2.ok) {
                            const d2 = await ir2.json();
                            console.log('confirmarGeracao: inscricao (usuario_id) body=', d2);
                            ins = Array.isArray(d2) ? d2[0] : (d2.value || [])[0] || null;
                        }
                    } catch(e) {
                        console.warn('erro ao buscar inscricao (usuario_id):', e);
                    }
                }

                if (ins) {
                    // obter lista completa de aulas do curso
                    let cursoFull = null;
                    try {
                        const cursoRes = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/cursos/${encodeURIComponent(cursoSelecionado.id)}`, {}, 10000);
                        cursoFull = cursoRes.ok ? await cursoRes.json() : null;
                    } catch(e) { console.warn('erro ao buscar curso completo:', e); }
                    const allAulas = [];
                    if (cursoFull && cursoFull.modulos) {
                        (cursoFull.modulos || []).sort((a,b)=>(a.ordem||0)-(b.ordem||0)).forEach(m=>{ (m.aulas||[]).forEach(a=> allAulas.push(a.id || a)); });
                    }

                    const updatedAulas = Array.isArray(ins.aulas_concluidas) ? Array.from(new Set([...(ins.aulas_concluidas||[]), ...allAulas])) : allAulas.slice();
                    const ultimaAula = updatedAulas.length ? updatedAulas[updatedAulas.length-1] : (ins.ultima_aula_assistida || null);
                    const patchBody = {
                        aulas_concluidas: updatedAulas,
                        ultima_aula_assistida: ultimaAula,
                        progresso: 100,
                        certificado_emitido: true
                    };

                    // envia patch para /api/inscricoes/:id
                    try {
                        try {
                            const p = await fetchWithTimeout(`${API_BASE_URL.replace(/\/$/, '')}/api/inscricoes/${encodeURIComponent(ins.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify(patchBody)
                            }, 10000);
                            if (p.ok) console.log('inscrição marcada como concluída para curso', cursoSelecionado.id);
                            else {
                                let txt=''; try{ txt = await p.text(); }catch(e){}
                                console.warn('falha ao atualizar inscrição:', p.status, p.statusText, txt);
                            }
                        } catch (e) {
                            console.warn('erro ao atualizar inscrição:', e);
                        }
                    } catch (e) {
                        console.warn('erro ao atualizar inscrição:', e);
                    }
                } else {
                    console.warn('inscrição não encontrada para marcar como concluída');
                }
            }
        } catch (err) {
            console.warn('erro ao garantir marcação de conclusão na inscrição:', err);
        }

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
        alert('ID do Certificado não encontrado');
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

    // garantir que o botão de confirmar geração tenha listener e logs (debug clicks)
    setTimeout(() => {
        try {
            const confirmBtn = document.getElementById('confirmBtn');
            if (confirmBtn) {
                console.log('confirmBtn encontrado — registrando listener adicional de debug');
                // adicionar listener que loga antes de delegar à função existente
                const wrapped = (e) => {
                    console.log('confirmBtn: click capturado, disabled=', confirmBtn.disabled);
                };
                confirmBtn.addEventListener('click', wrapped);
            } else {
                console.log('confirmBtn não encontrado na inicialização (esperando modal)');
            }
        } catch (e) {
            console.error('erro ao registrar listener debug do confirmBtn:', e);
        }
    }, 200);
});