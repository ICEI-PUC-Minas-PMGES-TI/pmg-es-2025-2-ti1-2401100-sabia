document.addEventListener('DOMContentLoaded', ()=>{
  const API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams(location.search);
  const cursoId = params.get('curso');
  const aulaId = params.get('aula');
  const aulaArea = document.getElementById('aula-area');
  const completeBtn = document.getElementById('completeBtn');

  function getAllAulas(curso){
    const out=[];
    (curso.modulos||[]).sort((a,b)=>(a.ordem||0)-(b.ordem||0)).forEach(m=>{(m.aulas||[]).forEach(a=> out.push(Object.assign({},a,{modulo_id:m.id,modulo_titulo:m.titulo}))) });
    return out;
  }

  async function load(){
    try{
      if(!cursoId || !aulaId) throw new Error('parametros ausentes');
      const r = await fetch(`${API_BASE}/api/cursos/${cursoId}`);
      if(!r.ok) throw new Error('curso nao encontrado');
      const curso = await r.json();
      const aulas = getAllAulas(curso);
      const aula = aulas.find(a=>a.id===aulaId);
      if(!aula) throw new Error('aula nao encontrada');

      aulaArea.innerHTML = `<h2>${aula.titulo}</h2><p>Tipo: ${aula.tipo||'—'}</p><p>Duração: ${aula.duracao||0} min</p>`;

      // get inscription (robust user detection)
      function getCurrentUser(){ try{ if(window.sabiaAuth && typeof sabiaAuth.getUser === 'function'){ const u=sabiaAuth.getUser(); if(u) return u } const keys=['sabiaa_user','user','usuario']; for(const k of keys){ const raw=localStorage.getItem(k); if(raw){ try{return JSON.parse(raw)}catch(e){} } } return null }catch(e){return null} }
      const user = getCurrentUser();
      if(!user){ alert('Faça login para marcar aulas como concluídas'); completeBtn.disabled=true; return; }

      let ins = null;
      try{
        const ir = await fetch(`${API_BASE}/api/inscricoes?aluno_id=${user.id}&curso_id=${cursoId}`);
        if(ir.ok){ const d = await ir.json(); ins = Array.isArray(d)?d[0]:(d.value||[])[0]; }
        if(!ins){ const ir2 = await fetch(`${API_BASE}/api/inscricoes?usuario_id=${user.id}&curso_id=${cursoId}`); if(ir2.ok){ const d2 = await ir2.json(); ins = Array.isArray(d2)?d2[0]:(d2.value||[])[0]; } }
      }catch(e){ console.warn('inscricao fetch failed',e); }
      if(!ins){ alert('Inscrição não encontrada. Inicie o curso primeiro.'); completeBtn.disabled=true; return; }

      completeBtn.addEventListener('click', async ()=>{
        try{
          // create progresso_aulas entry
          const progressoBody = { usuario_id: user.id, aula_id: aulaId, curso_id: cursoId, concluida: true, tempo_assistido: (aula.duracao||0)*60, data_conclusao: new Date().toISOString() };
          const pr = await fetch(`${API_BASE}/api/progresso_aulas`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(progressoBody)});
          if(!pr.ok) throw new Error('falha ao gravar progresso');

          // update inscricao: add aula to aulas_concluidas and recompute progresso
          const updatedAulas = Array.isArray(ins.aulas_concluidas)? [...ins.aulas_concluidas] : (ins.aulas_concluidas||[]);
          if(!updatedAulas.includes(aulaId)) updatedAulas.push(aulaId);
          const totalAulas = aulas.length || 1;
          const progressoPercent = Math.round((updatedAulas.length / totalAulas) * 100);

          const patchBody = { aulas_concluidas: updatedAulas, ultima_aula_assistida: aulaId, progresso: progressoPercent };
          const p = await fetch(`${API_BASE}/api/inscricoes/${ins.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patchBody)});
          if(!p.ok) throw new Error('falha ao atualizar inscrição');

          alert('Aula marcada como concluída');

          // decide next aula
          const next = aulas.find(a=> !updatedAulas.includes(a.id));
          if(next) location.href = `/codigo/public/modules/cursos/aula.html?curso=${cursoId}&aula=${next.id}`;
          else location.href = `/codigo/public/modules/cursos/curso.html?id=${cursoId}`;

        }catch(er){ console.error(er); alert('Erro ao marcar concluída: '+er.message); }
      });

    }catch(err){ console.error(err); aulaArea.innerHTML = `<p>Erro: ${err.message}</p>`; if(completeBtn) completeBtn.disabled=true }
  }

  load();

});
