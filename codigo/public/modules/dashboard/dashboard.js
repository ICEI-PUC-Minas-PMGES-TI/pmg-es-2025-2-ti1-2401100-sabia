/* Dashboard module script - adapted from Victhor's original
   Behavior:
   - Try to fetch dashboard data from API (`SABIAA_CONFIG.API_BASE_URL + '/dashboard'`)
   - Fallback to localStorage/mock data when API unavailable
   - Render tasks, favorites, recommendations, video progress and a small chart
*/
/* Dashboard module script - enhanced: fetch real data from /cursos and /inscricoes, compute derived metrics and render with Chart.js (fallbacks included) */
(async function(){
  'use strict';
  const qs = (s, ctx=document) => ctx.querySelector(s);

  const API = (window.SABIAA_CONFIG && window.SABIAA_CONFIG.API_BASE_URL) || 'http://localhost:3000';

  function getLocalUser(){
    try{
      if(window.sabiaAuth && typeof window.sabiaAuth.getUser === 'function') return window.sabiaAuth.getUser();
      const raw = localStorage.getItem('sabiaa_user') || localStorage.getItem('sabiaa_db_v1');
      if(!raw) return null; const p = JSON.parse(raw); return p && p.id ? p : null;
    }catch(e){ return null; }
  }

  async function fetchJSON(path){
    try{ const r = await fetch(API.replace(/\/$/, '') + path); if(!r.ok) return null; return await r.json(); }catch(e){ return null; }
  }

  function secondsToHoursLabel(sec){ if(!sec) return '0h'; const h = Math.floor(sec/3600); return h + 'h'; }

  function pickRandom(arr, n){ const out=[]; const copy=(arr||[]).slice(); while(out.length<n && copy.length){ const i = Math.floor(Math.random()*copy.length); out.push(copy.splice(i,1)[0]); } return out; }

  function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // gather data from API (including certificados for concluded courses)
  const [cursos, inscricoes, usuarios, certificados] = await Promise.all([
    fetchJSON('/api/cursos'),
    fetchJSON('/api/inscricoes'),
    fetchJSON('/api/usuarios'),
    fetchJSON('/api/certificados')
  ]);

  const user = getLocalUser() || (usuarios && usuarios[0]) || { id: 1, nome: 'Aluno' };

  // filter inscriptions
  const myInscricoes = (inscricoes || []).filter(i=> i.aluno_id == user.id || i.usuario_id == user.id || i.user_id == user.id);

  // courses concluded: prefer counting certificados, fallback to inscricoes with progresso>=100
  const certificadosDoUsuario = (certificados || []).filter(c => c.usuario_id == user.id || c.user_id == user.id);
  const certificadosCount = certificadosDoUsuario.length;
  const inscricoesConcluidasCount = myInscricoes.filter(i => (i.progresso >= 100) || i.concluido || i.certificado_emitido).length;
  const cursosConcluidos = Math.max(certificadosCount, inscricoesConcluidasCount);

  // horas estudadas: sum duração (min) of aulas_concluidas across inscricoes -> convert to seconds
  let totalMinutes = 0;
  (myInscricoes || []).forEach(ins => {
    const curso = (cursos||[]).find(c => c.id == ins.curso_id || c.id == ins.curso);
    if(!curso) return;
    const aulasConcluidas = ins.aulas_concluidas || [];
    (curso.modulos || []).forEach(mod => {
      (mod.aulas||[]).forEach(a => {
        if(aulasConcluidas.includes(a.id) && a.duracao) totalMinutes += Number(a.duracao) || 0;
      });
    });
  });
  // fallback to tempo_total_estudado if no aula durations available
  if(totalMinutes === 0){
    const horasSeg = myInscricoes.reduce((s,i)=> s + (i.tempo_total_estudado || 0), 0);
    totalMinutes = Math.round(horasSeg/60);
  }
  const horasSeg = totalMinutes * 60;

  // update header numbers
  const userNameEl = qs('#dashUserName'); if(userNameEl) userNameEl.textContent = user.nome || 'Aluno';
  const concluidosEl = qs('#dashCursosConcluidos'); if(concluidosEl) concluidosEl.textContent = cursosConcluidos;
  const horasEl = qs('#dashHorasEstudo'); if(horasEl) horasEl.textContent = secondsToHoursLabel(horasSeg);

  // build monthly evolution: try to aggregate mensal arrays from inscriptions, else zeros
  let mensal = Array(12).fill(0);
  (myInscricoes || []).forEach(ins => { if(Array.isArray(ins.mensal) && ins.mensal.length===12) ins.mensal.forEach((v,i)=> mensal[i] += (v||0)); });

  // render Chart.js line chart into placeholder canvas
  try{
    const placeholder = qs('.grafico-placeholder');
    if(placeholder){
      placeholder.innerHTML = '<canvas id="evolucao-canvas"></canvas>';
      const ctx = qs('#evolucao-canvas').getContext('2d');
      new Chart(ctx, {
        type: 'line', data: { labels:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], datasets:[{ data: mensal, borderColor:'#6b46c1', backgroundColor:'rgba(107,70,193,0.08)', fill:true, tension:0.3 }] },
        options:{ plugins:{ legend:{ display:false } }, scales:{ y:{ display:false }, x:{ display:false } } }
      });
    }
  }catch(e){ /* ignore chart errors */ }

  // tarefas (pending aulas) — list with links to aula and nicer layout
  const tarefasEl = qs('#dashTasksList');
  const pending = [];
  // build a global set of concluded aula ids across all user's inscricoes to avoid duplicates
  const concludedSet = new Set();
  (myInscricoes || []).forEach(ins => { (ins.aulas_concluidas || []).forEach(id => concludedSet.add(id)); });
  const seenPending = new Set();
  (myInscricoes || []).forEach(ins=>{
    const curso = (cursos||[]).find(c => c.id == ins.curso_id || c.id == ins.curso);
    if(!curso) return;
    (curso.modulos || []).forEach(mod => {
      (mod.aulas||[]).forEach(a => {
        if(concludedSet.has(a.id)) return; // already concluded somewhere — skip
        if(seenPending.has(a.id)) return; // avoid duplicate entries
        seenPending.add(a.id);
        pending.push({ curso: curso.titulo || curso.nome || 'Curso', aula: a.titulo || a.nome || ('Aula ' + a.id), curso_id: curso.id, aula_id: a.id, duracao: a.duracao || 0 });
      });
    });
  });
  const tasksCountEl = qs('#dashTasksCount'); if(tasksCountEl) tasksCountEl.textContent = (pending.length? (pending.length + ' pendentes') : '0 pendentes');
  if(tarefasEl){
    tarefasEl.innerHTML='';
    if(pending.length){
      pending.slice(0,8).forEach(t=>{
        const li=document.createElement('li');
        li.className = 'item-tarefa-link';
        li.innerHTML = `<a class="tarefa-link" href="/codigo/public/modules/cursos/aula.html?curso=${encodeURIComponent(t.curso_id)}&aula=${encodeURIComponent(t.aula_id)}"><div class="tarefa-meta"><strong>${escapeHtml(t.curso)}</strong><span class="tarefa-aula">${escapeHtml(t.aula)}</span></div><div class="tarefa-right"><span class="tarefa-dur">${t.duracao} min</span><span class="tarefa-go"><i class="fas fa-chevron-right"></i></span></div></a>`;
        tarefasEl.appendChild(li);
      });
    } else {
      tarefasEl.innerHTML = '<li class="sem-tarefas">Parabéns — sem tarefas pendentes!</li>';
    }
  }

  // continuar assistindo: first pending — show and link to aula
  const contEl = qs('.video-bloco');
  if(contEl){
    if(pending.length){
      const f = pending[0];
      const titleEl = qs('#dashVideoTitle'); const subEl = qs('#dashVideoSubtitle'); const progEl = qs('#dashVideoProgress'); const percentEl = qs('#dashVideoPercent');
      if(titleEl) titleEl.textContent = f.curso; if(subEl) subEl.textContent = f.aula;
      const prog = Math.round((myInscricoes[0] && myInscricoes[0].progresso) || 0);
      if(progEl) progEl.style.width = prog + '%'; if(percentEl) percentEl.textContent = prog + '%';
      // make entire continue button navigate to aula
      const btn = qs('#dashBtnVideo'); if(btn){ btn.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/aula.html?curso=${encodeURIComponent(f.curso_id)}&aula=${encodeURIComponent(f.aula_id)}`; }); }
      // also allow clicking thumb/title to open
      const titleWrap = qs('.video-info'); if(titleWrap) titleWrap.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/aula.html?curso=${encodeURIComponent(f.curso_id)}&aula=${encodeURIComponent(f.aula_id)}`; });
    } else {
      const block = qs('.card-tres'); if(block) block.innerHTML = '<div class="concluido">Você já concluiu todos os cursos!</div>';
    }
  }

  // favoritos (in-progress)
  const favEl = qs('#dashFavorites'); if(favEl){ favEl.innerHTML=''; const favs = (myInscricoes||[]).filter(i=> (i.progresso||0)>0 && (i.progresso||0)<100); if(favs.length){ favs.slice(0,6).forEach(i=>{ const c = (cursos||[]).find(cc=> cc.id == i.curso_id || cc.id == i.curso); const li = document.createElement('li'); li.textContent = `${(c && (c.titulo||c.nome)) || 'Curso'} — ${i.progresso || 0}%`; favEl.appendChild(li); }); } else { favEl.innerHTML = '<li>Nenhum curso em progresso</li>'; } }

  // recomendacoes: 2 random courses not enrolled; if already concluido show 'Concluído'
  const recEl = qs('#dashRecommendations');
  if(recEl){
    recEl.innerHTML='';
    const notEnrolled = (cursos||[]).filter(cc => !myInscricoes.find(i=> i.curso_id == cc.id || i.curso == cc.id));
    const pool = notEnrolled.length? notEnrolled : (cursos||[]);
    const recs = pickRandom(pool,2);
    recs.forEach(r=>{
      const isConcluded = ((certificados||[]).find(c => c.curso_id == r.id || c.dados_curso?.titulo == r.titulo));
      const d=document.createElement('div'); d.className='item-rec';
      const buttonHtml = isConcluded ? `<button class="botao-concluido" disabled>Concluído</button>` : `<a href="/codigo/public/modules/cursos/curso.html?id=${encodeURIComponent(r.id)}" class="botao-iniciar">Iniciar Curso</a>`;
      d.innerHTML = `<div class="detalhes-rec"><h4>${r.titulo||r.nome}</h4><p>${r.descricao||''}</p></div><div class="acoes">${buttonHtml}</div>`;
      recEl.appendChild(d);
    });
  }

  // bind continue button
  const btn = qs('#dashBtnVideo'); if(btn) btn.addEventListener('click', ()=>{ alert('Continuando sua aula...'); });

})();
