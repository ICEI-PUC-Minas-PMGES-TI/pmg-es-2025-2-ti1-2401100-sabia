document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'https://sabiaa.onrender.com';
  const params = new URLSearchParams(location.search);
  const cursoId = params.get('id');
  const courseInfo = document.getElementById('course-info');
  const courseActions = document.getElementById('course-actions');
  const modulesList = document.getElementById('modules-list');

  function getAllAulas(curso){
    const out=[];
    (curso.modulos||[]).sort((a,b)=>(a.ordem||0)-(b.ordem||0)).forEach(m=>{(m.aulas||[]).forEach(a=>{ out.push(Object.assign({},a,{modulo_id:m.id,modulo_titulo:m.titulo})) })});
    return out;
  }

  async function load(){
    try{
      if(!cursoId) throw new Error('curso id ausente');
      const res = await fetch(`${API_BASE}/api/cursos/${cursoId}`);
      if(!res.ok) throw new Error('curso não encontrado');
      const curso = await res.json();

      courseInfo.innerHTML = `<h2>${curso.titulo}</h2><p>${curso.descricao||''}</p><p><strong>Instrutor:</strong> ${curso.instrutor||'—'}</p>`;

      const aulas = getAllAulas(curso);

      // show modules and aulas (build DOM so each aula is a clickable link)
      modulesList.innerHTML = '';
      if (curso.modulos && curso.modulos.length) {
        curso.modulos.forEach(m=>{
          const card = document.createElement('div');
          card.className = 'card';
          card.style.marginBottom = '8px';

          const h4 = document.createElement('h4');
          h4.textContent = m.titulo || '';
          card.appendChild(h4);

          const ul = document.createElement('ul');
          (m.aulas||[]).forEach(a=>{
            const li = document.createElement('li');
            const aLink = document.createElement('a');
            aLink.className = 'aula-link';
            aLink.href = `/codigo/public/modules/cursos/aula.html?curso=${encodeURIComponent(cursoId)}&aula=${encodeURIComponent(a.id)}`;
            aLink.appendChild(document.createTextNode(a.titulo || ('Aula ' + (a.id||''))));
            const small = document.createElement('small');
            small.textContent = ` (${a.duracao||0} min)`;
            aLink.appendChild(small);
            li.appendChild(aLink);
            ul.appendChild(li);
          });

          card.appendChild(ul);
          modulesList.appendChild(card);
        });
      } else {
        modulesList.innerHTML = '<p>Sem módulos ou aulas.</p>';
      }

      // determine user and inscription (robust)
      function getCurrentUser(){
        try{ if(window.sabiaAuth && typeof sabiaAuth.getUser === 'function'){ const u = sabiaAuth.getUser(); if(u) return u } const keys=['sabiaa_user','user','usuario']; for(const k of keys){ const raw=localStorage.getItem(k); if(raw){ try{return JSON.parse(raw)}catch(e){} } } return null }catch(e){return null}
      }
      const user = getCurrentUser();

      if(!user){
        courseActions.innerHTML = `<a href="/codigo/public/modules/auth/login.html" class="btn btn-primary">Entrar para iniciar</a>`;
        return;
      }

      // fetch inscricao by aluno_id or usuario_id
      let ins = null;
      try{
        const r = await fetch(`${API_BASE}/api/inscricoes?aluno_id=${user.id}&curso_id=${cursoId}`);
        if(r.ok){ const d = await r.json(); const arr = Array.isArray(d)?d:(d.value||[]); ins = arr[0] || null; }
        if(!ins){ const r2 = await fetch(`${API_BASE}/api/inscricoes?usuario_id=${user.id}&curso_id=${cursoId}`); if(r2.ok){ const d2 = await r2.json(); const arr2 = Array.isArray(d2)?d2:(d2.value||[]); ins = arr2[0]||null } }
      }catch(e){ console.warn('inscricao fetch failed',e); }

      if(!ins){
        courseActions.innerHTML = `<button id="startBtn" class="btn btn-primary">Iniciar Curso</button>`;
        document.getElementById('startBtn').addEventListener('click', async ()=>{
          try{
            const body = { aluno_id: user.id, curso_id: cursoId, data_inscricao: new Date().toISOString(), progresso: 0, status: 'em_andamento', aulas_concluidas: [] };
            const p = await fetch(`${API_BASE}/api/inscricoes`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
            if(!p.ok) throw new Error('não criou inscrição');
            const created = await p.json();
            // go to first aula
            const next = aulas[0];
            if(next) location.href = `/codigo/public/modules/cursos/aula.html?curso=${cursoId}&aula=${next.id}`;
            else alert('Curso sem aulas');
          }catch(err){ console.error(err); alert('Erro ao iniciar'); }
        });
        // show admin controls even when no inscription
        try{ if(window.sabiaAuth && typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin()){
        const adminHtml = `<div style="margin-top:8px"><button id="editCourseBtn" class="btn btn-tertiary">Editar Curso</button> <button id="createAulaBtn" class="btn btn-secondary">Criar Aula</button> <button id="deleteCourseBtn" class="btn btn-danger">Excluir Curso</button></div>`;
        courseActions.innerHTML += adminHtml;
        setTimeout(()=>{ const createBtn = document.getElementById('createAulaBtn'); if(createBtn) createBtn.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/cadastro-aula.html?curso=${cursoId}` }); const editBtn = document.getElementById('editCourseBtn'); if(editBtn) editBtn.addEventListener('click', ()=>{ showEditForm(curso); }); const delBtn = document.getElementById('deleteCourseBtn'); if(delBtn) delBtn.addEventListener('click', deleteCourse); },100);
      }}catch(e){}
      } else {
        // user has inscription
        const concluidas = ins.aulas_concluidas || ins.aulas_concluidas || [];
        const next = aulas.find(a=> !concluidas.includes(a.id));
        if(!next){ courseActions.innerHTML = `<div class="badge-completo">Curso concluído</div>`; }
        else { courseActions.innerHTML = `<button id="contBtn" class="btn btn-primary">Continuar</button>`; document.getElementById('contBtn').addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/aula.html?curso=${cursoId}&aula=${next.id}` }); }

      // admin controls when inscription exists
      try{ if(window.sabiaAuth && typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin()){ 
        const extra = document.createElement('div'); extra.style.marginTop='8px'; extra.innerHTML = `<button id="editCourseBtn" class="btn btn-tertiary">Editar Curso</button> <button id="createAulaBtn" class="btn btn-secondary">Criar Aula</button> <button id="deleteCourseBtn" class="btn btn-danger">Excluir Curso</button>`;
        courseActions.appendChild(extra);
        setTimeout(()=>{ const createBtn = document.getElementById('createAulaBtn'); if(createBtn) createBtn.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/cadastro-aula.html?curso=${cursoId}` }); const editBtn = document.getElementById('editCourseBtn'); if(editBtn) editBtn.addEventListener('click', ()=>{ showEditForm(curso); }); const delBtn = document.getElementById('deleteCourseBtn'); if(delBtn) delBtn.addEventListener('click', deleteCourse); },100);
      }}catch(e){}
      }

    }catch(err){ console.error(err); courseInfo.innerHTML = `<p>Erro: ${err.message}</p>` }
  }

  load();

  function showEditForm(curso){
    const html = `
      <div class="card" id="admin-edit-card" style="margin-top:12px;padding:12px">
        <label>Título</label>
        <input id="admin-titulo" class="form-control" value="${curso.titulo||''}">
        <label>Descrição</label>
        <textarea id="admin-desc" class="form-control">${curso.descricao||''}</textarea>
        <div style="margin-top:8px"><button id="saveCourseBtn" class="btn btn-primary">Salvar</button> <button id="cancelEditBtn" class="btn btn-cancelar">Cancelar</button></div>
      </div>`;
    const existing = document.getElementById('admin-edit-card'); if(existing) existing.remove();
    modulesList.insertAdjacentHTML('beforebegin', html);
    document.getElementById('cancelEditBtn').addEventListener('click', ()=>{ document.getElementById('admin-edit-card').remove(); });
    document.getElementById('saveCourseBtn').addEventListener('click', async ()=>{
      const novoTitulo = document.getElementById('admin-titulo').value.trim();
      const novaDesc = document.getElementById('admin-desc').value.trim();
      try{
        const res = await fetch(`${API_BASE}/api/cursos/${cursoId}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ titulo: novoTitulo, descricao: novaDesc }) });
        if(!res.ok) throw new Error('Falha ao salvar');
        alert('Curso atualizado'); location.reload();
      }catch(e){ console.error(e); alert('Erro ao atualizar curso'); }
    });
  }

  async function deleteCourse(){
    if(!confirm('Tem certeza que deseja excluir este curso e todos os dados relacionados? Esta ação é irreversível.')) return;
    try{
      const token = localStorage.getItem('sabiaa_token');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const res = await fetch(`${API_BASE}/api/cursos/${cursoId}`, { method: 'DELETE', headers });
      if(!res.ok){ const b = await res.json().catch(()=>null); throw new Error((b && b.error) ? b.error : 'Falha ao excluir'); }
      alert('Curso excluído com sucesso');
      // redirect back to painel
      window.location.href = '/codigo/public/modules/cursos/PainelCursos.html';
    }catch(e){ console.error('deleteCourse failed', e); alert('Erro ao excluir curso: ' + (e.message||e)); }
  }

});
