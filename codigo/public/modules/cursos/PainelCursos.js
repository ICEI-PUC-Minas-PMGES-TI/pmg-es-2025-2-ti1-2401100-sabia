document.addEventListener("DOMContentLoaded", function() {

    const coursesContainer = document.querySelector(".courses-container");
    const courseGrid = document.getElementById("course-grid");

    const searchInput = document.getElementById("search-input");
    const filterButton = document.getElementById("filterButton");
    const courseCountSpan = document.getElementById("course-count");
    const disciplinaSelect = document.getElementById("select-disciplina");

    const API_BASE = window.SABIAA_CONFIG && window.SABIAA_CONFIG.API_BASE_URL ? window.SABIAA_CONFIG.API_BASE_URL : 'http://localhost:3000';
    let masterCourseList = [];

    function normalizeString(str) { return str.toLowerCase().normalize("NFD").replace(/[\u0000-\u036f]/g,""); }

    function getCurrentUserFromStorage(){
        try{
            if(window.sabiaAuth && typeof sabiaAuth.getUser === 'function'){ const u = sabiaAuth.getUser(); if(u) return u; }
            const keys = ['sabiaa_user','user','usuario'];
            for(const k of keys){ const raw = localStorage.getItem(k); if(raw){ try{ const parsed = JSON.parse(raw); if(parsed) return parsed; }catch(e){} } }
            return null;
        }catch(e){return null}
    }

    async function ensureUser(){
        let user = getCurrentUserFromStorage();
        if(!user){
            try{
                const possibleToken = localStorage.getItem('sabiaa_token');
                if(possibleToken){
                    const verifyRes = await fetch(`${API_BASE}/api/auth/verificar`, { headers: { 'Authorization': 'Bearer ' + possibleToken } });
                    if(verifyRes.ok){
                        const verified = await verifyRes.json();
                        if(verified && verified.user){
                            user = verified.user;
                            try{ if(window.sabiaAuth && typeof sabiaAuth.setUser === 'function') sabiaAuth.setUser(user); else localStorage.setItem('sabiaa_user', JSON.stringify(user)); }catch(e){}
                        }
                    }
                }
            }catch(e){ console.warn('token verify failed', e); }
        }
        return user;
    }

    function renderizarCursos(cursosParaRenderizar) {
        courseGrid.innerHTML = "";
        const total = cursosParaRenderizar.length;
        courseCountSpan.textContent = `${total} ${total === 1 ? 'curso encontrado' : 'cursos encontrados'}`;

        if (cursosParaRenderizar.length === 0) {
            courseGrid.innerHTML = "<p>Nenhum curso encontrado com estes filtros.</p>";
            return;
        }

        cursosParaRenderizar.forEach(curso => {
            const novoCard = document.createElement('article');
            novoCard.className = 'course-card';

            const thumb = curso.thumbnail || curso.imagem || curso.thumbnail_url || ('/codigo/public/assets/images/logos/logo_nome_lateral_bege.png');
            const titulo = curso.titulo || curso.nome || 'Curso';
            const descricao = curso.descricao || curso.summary || '';
            const progresso = (curso._inscricao && (curso._inscricao.progresso || curso._inscricao.progresso === 0)) ? Number(curso._inscricao.progresso) : (curso.progresso_porcentagem || 0);
            const inscricaoId = curso._inscricao ? (curso._inscricao.id || curso._inscricao._id) : null;

            // build modules list (show up to 3 modules, then +n)
            const modulos = (curso.modulos||[]);
            const modItems = [];
            for(let i=0;i<Math.min(3, modulos.length); i++){ modItems.push(`<li><i class="fa-regular fa-circle"></i> ${modulos[i].titulo||('Módulo '+(i+1))}</li>`); }
            if(modulos.length>3) modItems.push(`<li class="more-mods">+${modulos.length-3} outros</li>`);

            novoCard.innerHTML = `
                <div class="card-image">
                    <img src="${thumb}" alt="${titulo}">
                        <span class="card-tag tag-subject">${curso.categoria || curso.disciplina || ''}</span>
                </div>
                <div class="card-content">
                    <h3>${titulo}</h3>
                    <p>${descricao}</p>
                    <div class="card-modules">
                        <strong>Módulos</strong>
                            <span class="module-time">${modulos.length} aulas</span>
                            <ul class="modules-list">
                                ${modItems.join('')}
                            </ul>
                    </div>
                    <div class="curso-actions">
                        ${progresso>=100?`<button class="btn btn-primary" disabled>Concluído</button>`: (inscricaoId?`<button class="btn btn-primary" data-action="continuar" data-id="${curso.id}" data-insc="${inscricaoId}">Continuar</button>`:`<button class="btn btn-primary" data-action="iniciar" data-id="${curso.id}">Iniciar</button>`) }
                        <a class="btn btn-secondary" href="/codigo/public/modules/cursos/curso.html?id=${curso.id}">Detalhes</a>
                        ${ (window.sabiaAuth && typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin()) ? `<a class="btn btn-tertiary" href="/codigo/public/modules/cursos/curso.html?id=${curso.id}&admin=1">Editar</a><button class="btn btn-danger" data-action="delete" data-id="${curso.id}">Excluir</button>` : '' }
                    </div>
                    <div style="margin-top:8px">
                        <div class="progresso-bar"><div class="progresso-fill" style="width:${progresso}%"></div></div>
                    </div>
                </div>
            `;
            courseGrid.appendChild(novoCard);
        });
    }

    function aplicarFiltros() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const disciplina = disciplinaSelect.value;

        const listaFiltrada = masterCourseList.filter(curso => {
            const titulo = (curso.titulo || curso.nome || '').toString().toLowerCase();
            const desc = (curso.descricao || curso.summary || '').toString().toLowerCase();
            const cat = (curso.categoria || curso.disciplina || '').toString();
            const matchSearch = titulo.includes(searchTerm) || desc.includes(searchTerm);
            const matchDisciplina = disciplina ? cat === disciplina : true;
            return matchSearch && matchDisciplina;
        });

        renderizarCursos(listaFiltrada);
    }

    function popularFiltroDisciplinas(){
        const todas = masterCourseList.map(c=>c.categoria||c.disciplina||'').filter(Boolean);
        const unicas = [...new Set(todas)]; unicas.sort();
        unicas.forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; disciplinaSelect.appendChild(o); });
    }

    async function loadFromApi(){
        try{
            const res = await fetch(`${API_BASE}/api/cursos`);
            if(!res.ok) throw new Error('Erro ao buscar cursos');
            const data = await res.json();
            masterCourseList = Array.isArray(data) ? data : (data.value || []);

            // Attach inscricoes if user logged (robust detection)
            let user = await ensureUser();

            if(user){
                try{
                    const r = await fetch(`${API_BASE}/api/inscricoes?aluno_id=${user.id}`);
                    let inscricoes = [];
                    if(r.ok){ const insData = await r.json(); inscricoes = Array.isArray(insData)?insData:(insData.value||[]); }
                    // additionally fetch by usuario_id if none found
                    if(inscricoes.length===0){ const r2 = await fetch(`${API_BASE}/api/inscricoes?usuario_id=${user.id}`); if(r2.ok){ const d2 = await r2.json(); inscricoes = Array.isArray(d2)?d2:(d2.value||[]); } }
                    masterCourseList = masterCourseList.map(c=>{ const ins = inscricoes.find(i=>i.curso_id===c.id||i.curso_id===c.codigo); return Object.assign({},c,{_inscricao: ins||null}); });
                }catch(e){console.warn('inscricoes fetch failed',e)}
            }

            popularFiltroDisciplinas();

            // aplicar filtro vindo da URL (ex: ?disciplina=Português)
            try {
                const params = new URLSearchParams(window.location.search);
                const disciplinaParam = params.get('disciplina') || params.get('categoria');
                if (disciplinaParam) {
                    // se opção existir, seleciona; se não, adiciona e seleciona
                    let found = Array.from(disciplinaSelect.options).some(opt => opt.value === disciplinaParam);
                    if (!found) {
                        const o = document.createElement('option');
                        o.value = disciplinaParam;
                        o.textContent = disciplinaParam;
                        disciplinaSelect.appendChild(o);
                    }
                    disciplinaSelect.value = disciplinaParam;
                }
            } catch(e) { console.warn('Erro ao aplicar disciplina via URL', e); }

            aplicarFiltros();
        }catch(err){
            console.error(err);
            courseGrid.innerHTML = `<div class="empty"><h3>Erro ao carregar cursos</h3><p>${err.message}</p></div>`;
        }
    }

    // no view toggles — single layout

    filterButton.addEventListener('click', aplicarFiltros);
    searchInput.addEventListener('keyup', aplicarFiltros);
    disciplinaSelect.addEventListener('change', aplicarFiltros);

    popularFiltroDisciplinas();
    loadFromApi();

    // render admin controls in header (create course)
    function renderAdminControls(){
        const container = document.getElementById('admin-controls');
        if(!container) return;
        try{
            if(window.sabiaAuth && typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin()){
                container.innerHTML = `<button id="btn-create-course" class="btn btn-primary">Cadastrar Curso</button>`;
                const btn = document.getElementById('btn-create-course');
                btn.addEventListener('click', ()=>{ window.location.href = '/codigo/public/modules/cursos/cadastro-curso.html'; });
            } else { container.innerHTML = ''; }
        }catch(e){ console.warn('admin render failed',e); }
    }
    renderAdminControls();

    // Handle Iniciar / Continuar clicks
    courseGrid.addEventListener('click', async (ev)=>{
        const btn = ev.target.closest('button[data-action]');
        if(!btn) return;
        const action = btn.getAttribute('data-action');
        const cursoId = btn.getAttribute('data-id');
        const inscId = btn.getAttribute('data-insc');

        // ensure user (try storage, sabiaAuth, then token verification)
        let user = await ensureUser();
        if(!user){ window.location.href = '/codigo/public/modules/auth/login.html'; return; }

        if(action==='iniciar'){
            // create inscription
            try{
                const body = { aluno_id: user.id || user.userId || user.id, curso_id: cursoId, data_inscricao: new Date().toISOString(), progresso: 0, status: 'em_andamento', aulas_concluidas: [] };
                const r = await fetch(`${API_BASE}/api/inscricoes`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
                if(!r.ok) throw new Error('Falha ao criar inscrição');
                const ins = await r.json();
                // reload data and redirect to course page
                await loadFromApi();
                window.location.href = `/codigo/public/modules/cursos/curso.html?id=${cursoId}`;
            }catch(err){ console.error(err); alert('Erro ao iniciar o curso'); }
        }

        if(action==='continuar'){
            // Redirect to course page; course page should handle continuing from last aula
            window.location.href = `/codigo/public/modules/cursos/curso.html?id=${cursoId}`;
        }
        if(action==='delete'){
            if(!confirm('Confirmar exclusão deste curso?')) return;
            try{
                const token = localStorage.getItem('sabiaa_token');
                const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                const r = await fetch(`${API_BASE}/api/cursos/${cursoId}`, { method: 'DELETE', headers });
                if(!r.ok){
                    const body = await r.json().catch(()=>null);
                    throw new Error((body && body.error) ? body.error : 'Falha ao excluir');
                }
                alert('Curso excluído');
                await loadFromApi();
            }catch(err){ console.error(err); alert('Erro ao excluir curso: ' + (err.message||err)); }
        }
    });

});
