document.addEventListener('DOMContentLoaded', async () => {
  for (let i=0;i<10;i++){ if(window.sabiaAuth) break; await new Promise(r=>setTimeout(r,100)); }
  if(!(window.sabiaAuth && typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin())){
    if(window.sabiaAuth && typeof sabiaAuth.verificarPermissaoAdmin === 'function') { sabiaAuth.verificarPermissaoAdmin(); return; }
    alert('Acesso restrito: administradores apenas'); window.location.href='/codigo/public/modules/dashboard/index.html'; return;
  }

  const API_BASE = window.SABIAA_CONFIG?.API_BASE_URL || 'https://sabiaa.onrender.com';
  const params = new URLSearchParams(window.location.search);
  const cursoId = params.get('curso');
  const moduloSelect = document.getElementById('modulo_select');
  const novoModuloInput = document.getElementById('novo_modulo');
  const cursoTitle = document.getElementById('curso-title');

  if(!cursoId){ alert('Curso não informado'); window.location.href='/codigo/public/modules/cursos/PainelCursos.html'; return; }

  // fetch course to populate modules
  let curso = null;
  try{
    const r = await fetch(`${API_BASE}/api/cursos/${cursoId}`);
    if(!r.ok) throw new Error('Curso não encontrado');
    curso = await r.json();
  }catch(e){ console.error(e); alert('Erro ao carregar curso'); window.location.href='/codigo/public/modules/cursos/PainelCursos.html'; return; }

  cursoTitle.textContent = curso.titulo || '';

  function populateModules(){
    moduloSelect.innerHTML = '';
    const opt = document.createElement('option'); opt.value='__novo__'; opt.textContent='-- Criar novo módulo --'; moduloSelect.appendChild(opt);
    (curso.modulos||[]).forEach(m=>{ const o=document.createElement('option'); o.value=m.id; o.textContent=m.titulo; moduloSelect.appendChild(o); });
  }
  populateModules();

  moduloSelect.addEventListener('change', ()=>{ if(moduloSelect.value==='__novo__'){ novoModuloInput.style.display='block'; } else novoModuloInput.style.display='none'; });

  document.getElementById('btn-cancel').addEventListener('click', ()=>{ window.location.href=`/codigo/public/modules/cursos/curso.html?id=${cursoId}`; });

  document.getElementById('form-aula').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const duracao = Number(document.getElementById('duracao').value) || 0;
    const tipo = document.getElementById('tipo').value;
    const video_url = document.getElementById('video_url').value.trim();
    const descricao = document.getElementById('descricao').value.trim();

    if(!titulo){ alert('Preencha o título da aula'); return; }

    const newAula = { id: 'aula-'+Date.now(), titulo, duracao, tipo, video_url, descricao };

    const selected = moduloSelect.value;
    let modulos = curso.modulos || [];
    if(selected === '__novo__'){
      const nome = novoModuloInput.value.trim();
      if(!nome){ alert('Informe o nome do novo módulo'); return; }
      const newMod = { id: 'mod-'+Date.now(), titulo: nome, ordem: (modulos.length||0)+1, aulas: [newAula] };
      modulos.push(newMod);
    } else {
      const mod = modulos.find(m=>m.id===selected);
      if(!mod){ alert('Módulo selecionado não encontrado'); return; }
      mod.aulas = mod.aulas || []; mod.aulas.push(newAula);
    }

    try{
      const r = await fetch(`${API_BASE}/api/cursos/${cursoId}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ modulos }) });
      if(!r.ok) throw new Error('Falha ao salvar aula');
      alert('Aula adicionada com sucesso');
      window.location.href = `/codigo/public/modules/cursos/curso.html?id=${cursoId}`;
    }catch(e){ console.error(e); alert('Erro ao salvar aula'); }
  });

});
