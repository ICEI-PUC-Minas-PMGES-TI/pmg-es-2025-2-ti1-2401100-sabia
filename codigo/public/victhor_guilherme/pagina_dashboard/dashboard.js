/* script.js
   Dashboard SABIAA - LocalStorage, mock API, tarefas, favoritos, vídeo e gráfico
   - Plug & play para o HTML fornecido
   - Sem dependências externas
*/

(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const safe = (fn) => { try { return fn(); } catch (e) { return null; } };

  const LS = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.warn('LS.get error', e);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('LS.set error', e);
      }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch {}
    }
  };

  function id() {
    return 'id_' + Math.random().toString(36).slice(2, 10);
  }

  function escapeHtml(str = '') {
    return ('' + str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  /* ---------- Mock API (local fallback) ---------- */
  const MOCK = {
    usuario: { nome: "Maria", progresso: 82, cursosConcluidos: 12, horasEstudo: "89h" },
    tarefas: [
      { id: id(), titulo: "Quiz: Matemática Básica", meta: "Vence em 2 dias", status: "pendente" },
      { id: id(), titulo: "Atividade: História do Brasil", meta: "Vence em 5 dias", status: "andamento" },
      { id: id(), titulo: "Exercício: Português", meta: "Concluído ontem", status: "completo" }
    ],
    favoritos: [
      { id: id(), titulo: "Química Orgânica", aulas: 15 },
      { id: id(), titulo: "Literatura Brasileira", aulas: 8 },
      { id: id(), titulo: "Geometria Analítica", aulas: 12 }
    ],
    recomendacoes: [
      { id: id(), titulo: "Introdução ao JavaScript", descricao: "Baseado no seu progresso em informática" },
      { id: id(), titulo: "Redação ENEM", descricao: "Próximo passo recomendado" }
    ],
    evolucaoMensal: [5, 8, 12, 10, 14, 18, 21, 26, 24, 30, 28, 32]
  };

  /* ---------- Keys ---------- */
  const KEYS = {
    DB: 'sabiaa_db_v1',
    TASKS: 'sabiaa_tasks_v1',
    FAVORITES: 'sabiaa_favs_v1',
    VIDEO: 'sabiaa_video_v1',
    RECS: 'sabiaa_recs_v1'
  };

  /* ---------- Initial load / Seed ---------- */
  function seedIfEmpty() {
    if (!LS.get(KEYS.DB)) {
      LS.set(KEYS.DB, MOCK);
      LS.set(KEYS.TASKS, MOCK.tarefas);
      LS.set(KEYS.FAVORITES, MOCK.favoritos.map(f => f.titulo));
      LS.set(KEYS.RECS, MOCK.recomendacoes);
      LS.set(KEYS.VIDEO, { progress: MOCK.usuario.progresso || 0 });
    } else {
      // ensure tasks exist as separate key (backwards compat)
      if (!LS.get(KEYS.TASKS)) LS.set(KEYS.TASKS, MOCK.tarefas);
      if (!LS.get(KEYS.VIDEO)) LS.set(KEYS.VIDEO, { progress: MOCK.usuario.progresso || 0 });
      if (!LS.get(KEYS.FAVORITES)) LS.set(KEYS.FAVORITES, MOCK.favoritos.map(f => f.titulo));
      if (!LS.get(KEYS.RECS)) LS.set(KEYS.RECS, MOCK.recomendacoes);
    }
  }

  /* ---------- Tasks ---------- */
  const tasksContainer = qs('.card-dois ul'); // existing ul in HTML
  const pendenteBadge = qs('.card-dois .contador');

  function readTasksFromDOMIfNeeded() {
    // if no tasks in LS, read from DOM li nodes present in HTML and build initial state
    const existing = LS.get(KEYS.TASKS, null);
    if (existing && Array.isArray(existing) && existing.length) return;
    const arr = [];
    qsa('.card-dois li').forEach(li => {
      const title = qs('h4', li)?.textContent?.trim() || 'Tarefa';
      const meta = qs('.detalhes p', li)?.textContent?.trim() || '';
      const statusTxt = qs('.status-tarefa', li)?.textContent?.toLowerCase() || 'pendente';
      let status = 'pendente';
      if (statusTxt.includes('andamento')) status = 'andamento';
      if (statusTxt.includes('conclu')) status = 'completo';
      arr.push({ id: id(), titulo: title, meta, status });
    });
    if (arr.length) LS.set(KEYS.TASKS, arr);
  }

  function getTasks() { return LS.get(KEYS.TASKS, []); }

  function saveTasks(tasks) { LS.set(KEYS.TASKS, tasks); }

  function renderTasks() {
    const tasks = getTasks();
    if (!tasksContainer) return;
    tasksContainer.innerHTML = '';
    tasks.forEach(t => {
      const li = document.createElement('li');
      li.dataset.id = t.id;
      const statusClass = t.status === 'pendente' ? 'tipo-pendente' : t.status === 'andamento' ? 'tipo-andamento' : 'tipo-completo';
      const icon = t.status === 'completo' ? '<i class="fas fa-check-circle"></i>' : t.status === 'andamento' ? '<i class="fas fa-hourglass-half"></i>' : '<i class="fas fa-exclamation-triangle"></i>';

      li.innerHTML = `
        <div class="item-tarefa ${t.status === 'pendente' ? 'urgente' : t.status === 'andamento' ? 'fazendo' : 'pronto'}">
          <span class="icone-tipo">${icon}</span>
          <div class="detalhes">
            <h4>${escapeHtml(t.titulo)}</h4>
            <p>${escapeHtml(t.meta)}</p>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
            <span class="status-tarefa ${statusClass}">${capitalizeStatus(t.status)}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn-toggle" title="Alternar status" aria-label="Alternar status">↺</button>
              <button class="btn-delete" title="Remover tarefa" aria-label="Remover tarefa">🗑️</button>
            </div>
          </div>
        </div>
      `;

      const btnToggle = li.querySelector('.btn-toggle');
      const btnDelete = li.querySelector('.btn-delete');

      btnToggle?.addEventListener('click', () => {
        toggleTaskStatus(t.id);
      });
      btnDelete?.addEventListener('click', () => {
        deleteTask(t.id);
      });

      tasksContainer.appendChild(li);
    });
    updatePendingCounter();
  }

  function capitalizeStatus(s) {
    if (s === 'pendente') return 'Pendente';
    if (s === 'andamento') return 'Em Andamento';
    if (s === 'completo') return 'Concluído';
    return s;
  }

  function updatePendingCounter() {
    const tasks = getTasks();
    const pend = tasks.filter(t => t.status !== 'completo').length;
    if (pendenteBadge) pendenteBadge.textContent = `${pend} pendentes`;
  }

  function toggleTaskStatus(taskId) {
    const tasks = getTasks().map(t => {
      if (t.id !== taskId) return t;
      const next = t.status === 'pendente' ? 'andamento' : t.status === 'andamento' ? 'completo' : 'pendente';
      return Object.assign({}, t, { status: next });
    });
    saveTasks(tasks);
    renderTasks();
  }

  function deleteTask(taskId) {
    if (!confirm('Remover esta tarefa?')) return;
    const tasks = getTasks().filter(t => t.id !== taskId);
    saveTasks(tasks);
    renderTasks();
  }

  function addTaskInteractive(buttonEl) {
    const title = prompt('Título da tarefa:');
    if (!title) return;
    const meta = prompt('Observação / prazo (opcional):') || '';
    const tasks = getTasks();
    tasks.unshift({ id: id(), titulo: title, meta, status: 'pendente' });
    saveTasks(tasks);
    renderTasks();
    // subtle feedback
    if (buttonEl) {
      buttonEl.textContent = '+ Nova Tarefa';
    }
  }

  /* ---------- Video progress (persistente) ---------- */
  const progressoEl = qs('.barra-progresso .progresso');
  const porcentagemEl = qs('.video-bloco .porcentagem');
  const botaoVideo = qs('.botao-video');

  function getVideoState() { return LS.get(KEYS.VIDEO, { progress: MOCK.usuario.progresso || 0 }); }
  function saveVideoState(state) { LS.set(KEYS.VIDEO, state); }

  function renderVideoProgress() {
    const st = getVideoState();
    const p = Math.max(0, Math.min(100, Number(st.progress) || 0));
    if (progressoEl) progressoEl.style.width = p + '%';
    if (porcentagemEl) porcentagemEl.textContent = p + '%';
  }

  function bindVideoButtons() {
    if (!botaoVideo) return;
    botaoVideo.addEventListener('click', () => {
      const st = getVideoState();
      st.progress = Math.min(100, (Number(st.progress) || 0) + 10);
      saveVideoState(st);
      renderVideoProgress();
      if (st.progress >= 100) {
        setTimeout(() => alert('Parabéns — vídeo concluído!'), 60);
      }
    });
  }

  /* ---------- Favoritos toggle ---------- */
  function initFavoritos() {
    const favorites = LS.get(KEYS.FAVORITES, []); // array of titles
    const favItems = qsa('.card-quatro li');
    favItems.forEach(li => {
      let heart = li.querySelector('.icone-coracao');
      // ensure heart exists and is interactive
      if (!heart) {
        heart = document.createElement('span');
        heart.className = 'icone-coracao';
        li.insertBefore(heart, li.firstChild);
      }
      heart.style.cursor = 'pointer';
      // normalized text to use as id
      const text = (li.textContent || '').replace(/\d+\s*aulas?/i,'').trim();
      const normalized = text;
      const isFav = favorites.includes(normalized);
      heart.textContent = isFav ? '❤️' : '🤍';
      heart.addEventListener('click', () => {
        const favs = LS.get(KEYS.FAVORITES, []);
        const idx = favs.indexOf(normalized);
        if (idx === -1) {
          favs.push(normalized);
          heart.textContent = '❤️';
        } else {
          favs.splice(idx, 1);
          heart.textContent = '🤍';
        }
        LS.set(KEYS.FAVORITES, favs);
      });
    });
  }

  /* ---------- Recomendações actions ---------- */
  function initRecomendacoes() {
    const recs = LS.get(KEYS.RECS, MOCK.recomendacoes);
    // if HTML has .card-cinco .item-rec nodes, bind; otherwise, render from LS
    const recNodes = qsa('.card-cinco .item-rec');
    if (recNodes.length) {
      recNodes.forEach((item, idx) => {
        const btns = qsa('button', item);
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            const curso = qs('.detalhes-rec h4', item)?.textContent || (`Curso ${idx+1}`);
            if (btn.classList.contains('botao-iniciar')) {
              alert(`Iniciando: ${curso}`);
              const started = LS.get('sabiaa_recs_started', {});
              started[curso] = new Date().toISOString();
              LS.set('sabiaa_recs_started', started);
              btn.textContent = 'Iniciado';
              btn.disabled = true;
            } else {
              alert(`Detalhes do curso "${curso}":\n\n${qs('.detalhes-rec p', item)?.textContent || '-'}`);
            }
          });
        });
      });
    } else {
      // render HTML from recs (optional; not necessary but safe)
      const container = qs('.card-cinco');
      if (container) {
        recs.forEach(rec => {
          const div = document.createElement('div');
          div.className = 'item-rec';
          div.innerHTML = `
            <div class="detalhes-rec">
              <h4>${escapeHtml(rec.titulo)}</h4>
              <p>${escapeHtml(rec.descricao || '')}</p>
            </div>
            <span class="estrela"><i class="fas fa-star"></i></span>
            <div class="acoes">
              <button class="botao-iniciar">Iniciar Curso</button>
              <button class="botao-detalhes">Ver Detalhes</button>
            </div>
          `;
          container.appendChild(div);
        });
        initRecomendacoes(); // bind newly created buttons
      }
    }
  }

  /* ---------- Mini Chart (canvas) ---------- */
  function drawMiniChart(values = MOCK.evolucaoMensal) {
    const placeholder = qs('.grafico-placeholder');
    if (!placeholder) return;

    // remove existing content (img or canvas)
    placeholder.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(600, placeholder.clientWidth || 360) || 360;
    canvas.height = 160;
    placeholder.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // styling
    const pad = { left: 28, right: 12, top: 12, bottom: 18 };
    const w = canvas.width - pad.left - pad.right;
    const h = canvas.height - pad.top - pad.bottom;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = w / (values.length - 1);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // grid lines (horizontal)
    ctx.strokeStyle = 'rgba(33,32,63,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (h * i / 3);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // compute points
    const points = values.map((v, i) => {
      const x = pad.left + (i * stepX);
      const y = pad.top + h - ((v - min) / range) * h;
      return { x, y, v };
    });

    // area gradient
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
    grad.addColorStop(0, 'rgba(75,60,93,0.18)');
    grad.addColorStop(1, 'rgba(231,191,165,0.02)');

    // draw area
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pad.left + w, pad.top + h);
    ctx.lineTo(pad.left, pad.top + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // draw line
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(75,60,93,0.95)';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // draw points
    points.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'rgba(75,60,93,0.9)';
      ctx.lineWidth = 1.5;
      ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // last value label
    const last = points[points.length - 1];
    if (last) {
      ctx.font = '600 12px Poppins, sans-serif';
      ctx.fillStyle = 'rgba(33,32,63,0.9)';
      ctx.fillText(String(last.v), last.x + 8, last.y - 8);
    }
  }

  /* ---------- Utility: render header resumo (nome, contadores) ---------- */
  function renderHeaderResumo() {
    const db = LS.get(KEYS.DB, MOCK);
    // header greeting
    const cabecalhoH1 = qs('.cabecalho h1');
    const cabecalhoP = qs('.cabecalho p');
    if (cabecalhoH1) cabecalhoH1.textContent = `Bem-vinda de volta, ${db.usuario?.nome || MOCK.usuario.nome}!`;
    if (cabecalhoP) cabecalhoP.textContent = 'Continue sua jornada de aprendizado';

    // update small summary cards that came from initial HTML (if they have specific selectors)
    const cursosEl = qs('.cursos-feitos .numero');
    const horasEl = qs('.horas-estudo .numero');
    if (cursosEl) cursosEl.textContent = db.usuario?.cursosConcluidos ?? MOCK.usuario.cursosConcluidos;
    if (horasEl) horasEl.textContent = db.usuario?.horasEstudo ?? MOCK.usuario.horasEstudo;
  }

  /* ---------- Reset button (dev helper) ---------- */
  function mountResetButton() {
    // optional: if user has not placed a reset, we add a small hidden control in footer for dev/test
    const existing = qs('#resetarDashboard');
    if (existing) return;
    const footer = qs('.footer');
    if (!footer) return;
    const btn = document.createElement('button');
    btn.id = 'resetarDashboard';
    btn.textContent = '🔁 Resetar Demo';
    btn.style.fontSize = '0.9em';
    btn.style.padding = '8px 12px';
    btn.style.background = 'linear-gradient(135deg,#4b3c5d,#e7bfa5)';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '10px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      if (!confirm('Resetar dados locais do dashboard?')) return;
      LS.remove(KEYS.DB);
      LS.remove(KEYS.TASKS);
      LS.remove(KEYS.FAVORITES);
      LS.remove(KEYS.VIDEO);
      LS.remove(KEYS.RECS);
      location.reload();
    });
    footer.appendChild(btn);
  }

  /* ---------- Initialization ---------- */
  function init() {
    seedIfEmpty();
    readTasksFromDOMIfNeeded();
    renderHeaderResumo();
    renderTasks();
    renderVideoProgress();
    bindVideoButtons();
    initFavoritos();
    initRecomendacoes();
    drawMiniChart(LS.get(KEYS.DB, MOCK).evolucaoMensal || MOCK.evolucaoMensal);
    mountResetButton();

    // add "add task" button to card header if exists
    const cardDoisTitle = qs('.card-dois h2');
    if (cardDoisTitle && !cardDoisTitle.querySelector('.add-task-btn')) {
      const btn = document.createElement('button');
      btn.className = 'botao-iniciar add-task-btn';
      btn.textContent = '+ Nova Tarefa';
      btn.style.marginLeft = '10px';
      btn.addEventListener('click', () => addTaskInteractive(btn));
      cardDoisTitle.appendChild(btn);
    }

    // Responsive: redraw chart on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => drawMiniChart(LS.get(KEYS.DB, MOCK).evolucaoMensal || MOCK.evolucaoMensal), 200);
    });
  }

  /* ---------- Run on DOM ready ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
