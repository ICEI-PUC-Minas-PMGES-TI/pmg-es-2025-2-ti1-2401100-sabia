/* script.js
   Interações para o Dashboard de Aprendizado
   - Persistência simples via localStorage
   - Manipulação de tarefas (toggle, deletar)
   - Progresso de vídeo (persistente)
   - Favoritos (toggle)
   - Ações das recomendações
   - Gráfico simples de evolução mensal (canvas)
*/

(() => {
  // ----- Helpers -----
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LS = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };

  // ----- Tasks -----
  const tasksListEl = qs('.card-dois ul');
  const pendentesEl = qs('.card-dois .contador');

  // Read existing DOM tasks as initial state (if localStorage empty)
  function readTasksFromDOM() {
    const items = [];
    qsa('.card-dois li').forEach(li => {
      const title = li.querySelector('h4')?.textContent?.trim() || 'Tarefa';
      const meta = li.querySelector('.detalhes p')?.textContent?.trim() || '';
      const statusEl = li.querySelector('.status-tarefa');
      let status = 'pendente';
      if (statusEl) {
        const txt = statusEl.textContent.toLowerCase();
        if (txt.includes('andamento') || txt.includes('andamento')) status = 'andamento';
        if (txt.includes('conclu') || txt.includes('concluído')) status = 'completo';
      }
      items.push({ id: cryptoRandomId(), title, meta, status });
    });
    return items;
  }

  function cryptoRandomId() {
    // fallback simple id
    return 'id-' + Math.random().toString(36).slice(2, 9);
  }

  let tasks = LS.get('dashboard_tasks', null);
  if (!tasks) {
    tasks = readTasksFromDOM();
    LS.set('dashboard_tasks', tasks);
  }

  function renderTasks() {
    tasksListEl.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.dataset.id = task.id;
      // choose icon & class by status
      const statusClass = {
        pendente: 'tipo-pendente',
        andamento: 'tipo-andamento',
        completo: 'tipo-completo'
      }[task.status] || 'tipo-pendente';

      const icon = task.status === 'completo' ? '✅' : (task.status === 'andamento' ? '🟠' : (task.status === 'pendente' ? '🚨' : '🔔'));

      li.innerHTML = `
        <div class="item-tarefa ${task.status === 'pendente' ? 'urgente' : task.status === 'andamento' ? 'fazendo' : 'pronto'}">
          <span class="icone-tipo">${icon}</span>
          <div class="detalhes">
            <h4>${escapeHtml(task.title)}</h4>
            <p>${escapeHtml(task.meta)}</p>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <span class="status-tarefa ${statusClass}">${statusText(task.status)}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn-toggle" title="Alternar status" aria-label="Alternar status">↺</button>
              <button class="btn-delete" title="Remover tarefa" aria-label="Remover tarefa">🗑️</button>
            </div>
          </div>
        </div>
      `;
      // events
      li.querySelector('.btn-toggle').addEventListener('click', () => toggleTaskStatus(task.id));
      li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));
      tasksListEl.appendChild(li);
    });
    updatePendingCounter();
  }

  function statusText(status) {
    if (status === 'pendente') return 'Pendente';
    if (status === 'andamento') return 'Em Andamento';
    if (status === 'completo') return 'Concluído';
    return status;
  }

  function escapeHtml(str) {
    return ('' + str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function toggleTaskStatus(id) {
    tasks = tasks.map(t => {
      if (t.id !== id) return t;
      const next = t.status === 'pendente' ? 'andamento' : t.status === 'andamento' ? 'completo' : 'pendente';
      return {...t, status: next};
    });
    LS.set('dashboard_tasks', tasks);
    renderTasks();
  }

  function deleteTask(id) {
    if (!confirm('Remover esta tarefa?')) return;
    tasks = tasks.filter(t => t.id !== id);
    LS.set('dashboard_tasks', tasks);
    renderTasks();
  }

  function updatePendingCounter() {
    const pendentes = tasks.filter(t => t.status !== 'completo').length;
    pendentesEl.textContent = `${pendentes} pendentes`;
  }

  // Allow user to adicionar tarefa via botão virtual (ex.: clicar no título do card)
  const cardDoisTitle = qs('.card-dois h2');
  const addButton = document.createElement('button');
  addButton.textContent = '+ Nova Tarefa';
  addButton.style.marginLeft = '10px';
  addButton.className = 'botao-iniciar';
  addButton.addEventListener('click', () => {
    const title = prompt('Título da tarefa:');
    if (!title) return;
    const meta = prompt('Observação / prazo (opcional):') || '';
    const newTask = { id: cryptoRandomId(), title, meta, status: 'pendente' };
    tasks.unshift(newTask);
    LS.set('dashboard_tasks', tasks);
    renderTasks();
  });
  cardDoisTitle.appendChild(addButton);

  // ----- Video progress -----
  const progressoEl = qs('.barra-progresso .progresso');
  const porcentagemEl = qs('.video-bloco .porcentagem');
  const botaoVideo = qs('.botao-video');

  let videoState = LS.get('dashboard_video', { progress: 82 }); // default 82 as in HTML
  // sanitize
  if (typeof videoState.progress !== 'number') videoState.progress = 0;
  videoState.progress = Math.min(100, Math.max(0, videoState.progress));

  function renderVideoProgress() {
    progressoEl.style.width = videoState.progress + '%';
    porcentagemEl.textContent = videoState.progress + '%';
  }

  botaoVideo.addEventListener('click', () => {
    // Simula continuar: aumenta 10% (ou completa)
    videoState.progress = Math.min(100, videoState.progress + 10);
    LS.set('dashboard_video', videoState);
    renderVideoProgress();

    if (videoState.progress >= 100) {
      alert('Parabéns — vídeo concluído!');
    }
  });

  // ----- Favoritos toggle -----
  function initFavoritos() {
    const favorites = LS.get('dashboard_favorites', []);
    // Map existing list items and add click handler on heart icon
    qsa('.card-quatro li').forEach(li => {
      const text = li.textContent.replace(/\d+\s*aulas?/i,'').trim();
      const normalized = text;
      // add button wrapper to heart if not present
      const heart = li.querySelector('.icone-coracao') || li.insertBefore(document.createElement('span'), li.firstChild);
      heart.classList.add('icone-coracao');
      heart.style.cursor = 'pointer';
      // sync visual
      if (favorites.includes(normalized)) {
        heart.textContent = '❤️';
      } else {
        heart.textContent = '🤍';
      }
      heart.addEventListener('click', () => {
        const idx = favorites.indexOf(normalized);
        if (idx === -1) {
          favorites.push(normalized);
          heart.textContent = '❤️';
        } else {
          favorites.splice(idx,1);
          heart.textContent = '🤍';
        }
        LS.set('dashboard_favorites', favorites);
      });
    });
  }

  // ----- Recomendações -----
  qsa('.card-cinco .item-rec').forEach((item, idx) => {
    const btn = item.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const curso = item.querySelector('.detalhes-rec h4')?.textContent || `Curso ${idx+1}`;
      if (btn.classList.contains('botao-iniciar')) {
        // marcar como iniciado
        alert(`Iniciando: ${curso}`);
        // optional: store that it was started
        const rec = LS.get('dashboard_recommendations', {});
        rec[curso] = { startedAt: new Date().toISOString() };
        LS.set('dashboard_recommendations', rec);
        btn.textContent = 'Iniciado';
        btn.disabled = true;
      } else {
        // detalhes
        alert(`Detalhes do curso "${curso}":\n\nDescrição: ${item.querySelector('.detalhes-rec p')?.textContent || '-'}`);
      }
    });
  });

  // ----- Grafico simples (sparkline mensal) -----
  function drawMiniChart(values = [5,10,8,12,20,16,22,18,24,30,28,32]) {
    // replace placeholder content with canvas
    const placeholder = qs('.grafico-placeholder');
    placeholder.innerHTML = ''; // remove img
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 160;
    placeholder.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // background
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // padding
    const pad = {left:20,right:10,top:12,bottom:20};
    const w = canvas.width - pad.left - pad.right;
    const h = canvas.height - pad.top - pad.bottom;

    // scale
    const max = Math.max(...values) || 1;
    const min = Math.min(...values);
    const stepX = w / (values.length - 1);

    // draw grid lines
    ctx.strokeStyle = 'rgba(90,90,112,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4,4]);

