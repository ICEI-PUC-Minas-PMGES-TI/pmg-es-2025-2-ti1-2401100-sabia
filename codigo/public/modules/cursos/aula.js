document.addEventListener('DOMContentLoaded', ()=>{
  const API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'https://sabiaa.onrender.com';
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

      // build player layout: main + sidebar
      aulaArea.innerHTML = '';
      const player = document.createElement('div'); player.className = 'aula-player';
      const main = document.createElement('div'); main.className = 'aula-player-main';
      const sidebar = document.createElement('aside'); sidebar.className = 'aula-player-sidebar';

      const title = document.createElement('h2'); title.textContent = aula.titulo || '';
      main.appendChild(title);

      // player container depending on type
      const mediaWrap = document.createElement('div'); mediaWrap.className = 'aula-media';

      if((aula.tipo||'').toLowerCase() === 'video'){
        // determine video embed src
        const url = aula.video_url || aula.video || aula.url || '';
        let embed = '';
        if(url && (url.includes('youtube.com') || url.includes('youtu.be'))){
          // extract youtube id
          const ytMatch = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
          const vid = ytMatch ? ytMatch[1] : null;
          if(vid) embed = `https://www.youtube.com/embed/${vid}?rel=0`; else embed = url;
        } else if(url){
          embed = url;
        }
        const iframe = document.createElement('iframe');
        iframe.setAttribute('allowfullscreen','');
        iframe.setAttribute('frameborder','0');
        iframe.src = embed || '';
        if(!embed){
          const placeholder = document.createElement('div'); placeholder.textContent = 'Vídeo não disponível.'; placeholder.className='aula-empty'; mediaWrap.appendChild(placeholder);
        } else mediaWrap.appendChild(iframe);
      } else if((aula.tipo||'').toLowerCase() === 'texto' || (aula.pdf_url || aula.file_url || aula.conteudo)){
        // try to embed PDF or show text
        const pdf = aula.pdf_url || aula.file_url || aula.pdf || '';
        if(pdf){
          const iframe = document.createElement('iframe'); iframe.src = pdf; iframe.style.height='70vh'; mediaWrap.appendChild(iframe);
        } else if(aula.conteudo){
          const div = document.createElement('div'); div.className='aula-desc'; div.innerHTML = aula.conteudo; mediaWrap.appendChild(div);
        } else {
          const placeholder = document.createElement('div'); placeholder.textContent = 'Conteúdo em texto não disponível.'; placeholder.className='aula-empty'; mediaWrap.appendChild(placeholder);
        }
      } else {
        const p = document.createElement('p'); p.textContent = `Tipo: ${aula.tipo||'—'} • Duração: ${aula.duracao||0} min`;
        mediaWrap.appendChild(p);
      }

      main.appendChild(mediaWrap);

      // description
      const desc = document.createElement('div'); desc.className = 'aula-desc'; desc.innerHTML = aula.descricao || aula.description || 'Sem descrição.';
      main.appendChild(desc);

      // navigation buttons
      const nav = document.createElement('div'); nav.className = 'aula-nav';
      const btnPrev = document.createElement('button'); btnPrev.className='btn btn-secondary'; btnPrev.textContent='Voltar';
      const btnNext = document.createElement('button'); btnNext.className='btn btn-primary'; btnNext.textContent='Próxima';
      nav.appendChild(btnPrev); nav.appendChild(btnNext);
      main.appendChild(nav);

      // build sidebar list of aulas
      const listTitle = document.createElement('h4'); listTitle.textContent = 'Aulas'; sidebar.appendChild(listTitle);
      const ul = document.createElement('ul'); ul.className = 'aula-list';
      aulas.forEach((a, idx)=>{
        const li = document.createElement('li');
        if(a.id === aulaId) li.className = 'current';
        const aLink = document.createElement('a');
        aLink.href = `/codigo/public/modules/cursos/aula.html?curso=${encodeURIComponent(cursoId)}&aula=${encodeURIComponent(a.id)}`;
        aLink.innerHTML = `<span>${a.titulo||('Aula '+a.id)}</span><span class="aula-meta">${a.duracao||0} min</span>`;
        li.appendChild(aLink);
        ul.appendChild(li);
      });
      if(aulas.length===0){ const empty = document.createElement('div'); empty.className='aula-empty'; empty.textContent='Nenhuma aula encontrada.'; sidebar.appendChild(empty); }
      else sidebar.appendChild(ul);

      player.appendChild(main); player.appendChild(sidebar); aulaArea.appendChild(player);

      // wire prev/next based on aulas order
      const idx = aulas.findIndex(x=>x.id===aulaId);
      const prev = idx>0? aulas[idx-1] : null;
      const next = idx>=0 && idx < aulas.length-1 ? aulas[idx+1] : null;
      if(prev){ btnPrev.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/aula.html?curso=${cursoId}&aula=${prev.id}` }); } else btnPrev.disabled=true;
      if(next){ btnNext.addEventListener('click', ()=>{ location.href = `/codigo/public/modules/cursos/aula.html?curso=${cursoId}&aula=${next.id}` }); } else btnNext.disabled=true;

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

      // disable complete button if already concluded
      const concluidasArr = Array.isArray(ins.aulas_concluidas)? ins.aulas_concluidas : (ins.aulas_concluidas||[]);
      if(concluidasArr.includes(aulaId)){
        completeBtn.disabled = true;
        completeBtn.textContent = 'Concluída';
      }

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
