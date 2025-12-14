/* Shared layout loader
   Injects standardized header and sidebar into pages.
   Uses window.SABIAA_CONFIG.BASE_PATH for links (defaults to '/codigo/public').
*/
(function(){
  const BASE = (window.SABIAA_CONFIG && window.SABIAA_CONFIG.BASE_PATH) || '/codigo/public';

  const headerHtml = `
  <header class="header header-internal">
    <div class="header-container" style="display:flex;justify-content:space-between;align-items:center;width:100%;gap:20px;padding-left:var(--content-padding-left,0px);padding-right:var(--content-padding-right,0px);">
      <div class="header-left" style="display:flex;align-items:center;gap:12px;">
        <button class="mobile-menu-btn"><i class="fas fa-bars"></i></button>
        <div class="search-container" style="flex:1;max-width:680px;"><i class="fas fa-search search-icon"></i><input class="search-input" placeholder="Buscar..."></div>
      </div>
      <div class="header-right" style="display:flex;align-items:center;gap:12px;">
        <div class="header-icons" style="display:flex;align-items:center;gap:12px;">
          <a class="header-icon" href="#"><i class="fas fa-bell"></i></a>
          <a class="header-icon" href="#"><i class="fas fa-user"></i></a>
        </div>
      </div>
    </div>
  </header>`;

  const sidebarHtml = `
  <aside class="sidebar">
    <div class="sidebar-header"><img src="${BASE}/assets/images/logos/logo_nome_lateral_bege.png" class="sidebar-logo"></div>
    <nav class="sidebar-nav">
      <a class="nav-item" href="${BASE}/modules/dashboard/index.html"><i class="fas fa-home"></i><span class="nav-item-text">Início</span></a>
      <a class="nav-item" href="${BASE}/modules/cursos/PainelCursos.html"><i class="fas fa-book"></i><span class="nav-item-text">Cursos</span></a>
      <a class="nav-item" href="${BASE}/modules/aluno/certificados/certificados.html"><i class="fas fa-certificate"></i><span class="nav-item-text">Certificados</span></a>
      <a class="nav-item" href="${BASE}/modules/disciplinas/index.html"><i class="fas fa-chalkboard"></i><span class="nav-item-text">Disciplinas</span></a>
      <a class="nav-item" href="${BASE}/modules/home/index.html"><i class="fas fa-globe"></i><span class="nav-item-text">Site</span></a>
    </nav>
  </aside>`;

  const adminNavItem = `<a class="nav-item admin-only" href="${BASE}/modules/cursos/cadastro-curso.html" id="nav-cadastrar-curso" style="display:none;"><i class="fas fa-plus-circle"></i><span class="nav-item-text">Cadastrar Curso</span></a>`;

  const footerHtml = `
  <footer class="footer" style="position:relative; left:var(--sidebar-width,280px); width:calc(100% - var(--sidebar-width,280px)); z-index:850;">
    <div class="footer-content">
      <div class="footer-section">
        <img src="${BASE}/assets/images/logos/logo_nome_lateral_bege.png" alt="Sabiaa" style="width: 150px; margin-bottom: 15px;">
        <p>Transformando a educação brasileira através da tecnologia e inovação.</p>
      </div>
      <div class="footer-section">
        <h4>Links Úteis</h4>
        <a href="#">Sobre</a>
        <a href="#">Cursos</a>
        <a href="#">Suporte</a>
      </div>
      <div class="footer-section">
        <h4>Contato</h4>
        <p><i class="fas fa-envelope"></i> contato@sabiaa.com.br</p>
        <p><i class="fas fa-phone"></i> (31) 1234-5678</p>
      </div>
      <div class="footer-section">
        <h4>Redes Sociais</h4>
        <div class="footer-social">
          <a href="#"><i class="fab fa-facebook"></i></a>
          <a href="#"><i class="fab fa-instagram"></i></a>
          <a href="#"><i class="fab fa-youtube"></i></a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2025 Sabiaa - Educação e Tecnologia Alinhadas para um Futuro Melhor.</p>
    </div>
  </footer>`;

  function ensureFontAwesome(){
    if(!document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]')){
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
      document.head.appendChild(l);
    }
  }

  function injectIfMissing() {
    ensureFontAwesome();
    // Replace or insert standardized header
    const existingHeader = document.querySelector('.header-internal, .header, .top-header, .main-header');
    if (existingHeader) {
      existingHeader.remove();
    }
    document.body.insertAdjacentHTML('afterbegin', headerHtml);

    // Ensure the injected header is fixed and positioned to the right of the sidebar
    const injectedHeader = document.querySelector('.header.header-internal');
    if (injectedHeader) {
      injectedHeader.style.position = 'fixed';
      injectedHeader.style.top = '0';
      injectedHeader.style.left = 'var(--sidebar-width, 280px)';
      injectedHeader.style.right = '0';
      injectedHeader.style.height = 'var(--header-height, 70px)';
      injectedHeader.style.zIndex = '900';
      injectedHeader.style.background = 'var(--branco, #fff)';
      injectedHeader.style.display = 'flex';
      injectedHeader.style.alignItems = 'center';
      injectedHeader.style.boxShadow = '0 1px 8px rgba(0,0,0,0.06)';
    }

    // Replace or insert standardized sidebar
    const existingSidebar = document.querySelector('.sidebar, .sidebar-left, .sidebar-simple');
    if (existingSidebar) {
      existingSidebar.remove();
    }
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

    // after inserting sidebar, measure its real width and sync layout
    const sidebarEl = document.querySelector('.sidebar');
    const computedSidebarWidth = sidebarEl ? sidebarEl.getBoundingClientRect().width : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')) || 280;
    // set CSS variable to the measured width so other rules follow
    document.documentElement.style.setProperty('--sidebar-width', computedSidebarWidth + 'px');

    // adjust header left and main margin to avoid visual gap
    const adjustedHeader = document.querySelector('.header.header-internal');
    if (adjustedHeader) adjustedHeader.style.left = computedSidebarWidth + 'px';

    // ensure main content uses same left offset
    const mainElForOffset = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('.content-area');
    if (mainElForOffset) {
      // only set margin if not already intentionally set via page CSS
      const currentMarginLeft = parseFloat(getComputedStyle(mainElForOffset).marginLeft) || 0;
      if (Math.abs(currentMarginLeft - computedSidebarWidth) > 1) {
        mainElForOffset.style.marginLeft = computedSidebarWidth + 'px';
      }
    }

    // Insert admin-only link if user is admin. Wait for sabiaAuth if it's not yet loaded.
    function tryInsertAdminLink() {
      const nav = document.querySelector('.sidebar .sidebar-nav') || document.querySelector('.sidebar-nav');
        if (!nav) return; // Ensure nav exists

      // avoid duplicate
      if (document.getElementById('nav-cadastrar-curso')) return;

      // Use a periodic check for up to 8 seconds to handle pages that load auth later
      let attempts = 0;
      const maxAttempts = 32; // ~32 * 250ms = 8s

      const intervalId = setInterval(() => {
        attempts += 1;

        // If nav disappeared, stop trying
        const currentNav = document.querySelector('.sidebar .sidebar-nav') || document.querySelector('.sidebar-nav');
        if (!currentNav) {
          if (attempts >= maxAttempts) clearInterval(intervalId);
          return;
        }

        // If link already present, stop
        if (document.getElementById('nav-cadastrar-curso')) {
          clearInterval(intervalId);
          return;
        }

        // If sabiaAuth present, try to infer role from user data or isAdmin()
          // First, check localStorage for stored user (faster on some pages)
          try {
            const storedKeys = ['sabiaa_user', 'sabiaaa_user', 'sabia_user'];
            let storedRaw = null;
            for (const k of storedKeys) {
              const v = localStorage.getItem(k);
              if (v) { storedRaw = v; break; }
            }
            if (storedRaw) {
              let su = null;
              try { su = JSON.parse(storedRaw); } catch (e) { su = null; }
              const roleRawLS = (su && (su.role || su.tipo)) || '';
              const roleLS = ('' + roleRawLS).toLowerCase();
              const isAdminLS = roleLS.includes('admin') || roleLS.includes('administrador') || roleLS.includes('professor');
              if (isAdminLS) {
                if (!document.getElementById('nav-cadastrar-curso')) {
                  currentNav.insertAdjacentHTML('beforeend', adminNavItem);
                  const el = document.getElementById('nav-cadastrar-curso');
                  if (el) el.style.display = '';
                }
                try {
                  const headerArea = document.getElementById('admin-controls') || document.querySelector('.header-right');
                  if (headerArea && !document.getElementById('btn-cadastrar-curso')) {
                    headerArea.insertAdjacentHTML('beforeend', adminHeaderButton);
                    const btn = document.getElementById('btn-cadastrar-curso');
                    if (btn) btn.style.display = '';
                  }
                } catch (e) {}
                clearInterval(intervalId);
                return;
              }
            }
          } catch (e) {/* ignore localStorage errors */}

          if (window.sabiaAuth) {
          try {
            const user = typeof sabiaAuth.getUser === 'function' ? sabiaAuth.getUser() : null;
            const roleRaw = (user && (user.role || user.tipo)) || '';
            const role = ('' + roleRaw).toLowerCase();
            const isAdminRole = role.includes('admin') || role.includes('administrador') || role.includes('professor');

            if (isAdminRole || (typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin())) {
              currentNav.insertAdjacentHTML('beforeend', adminNavItem);
              const el = document.getElementById('nav-cadastrar-curso');
              if (el) el.style.display = '';
                // also add admin header button if page offers admin-controls area (e.g., PainelCursos)
                try {
                  const headerArea = document.getElementById('admin-controls') || document.querySelector('.header-right');
                  if (headerArea && !document.getElementById('btn-cadastrar-curso')) {
                    headerArea.insertAdjacentHTML('beforeend', adminHeaderButton);
                    const btn = document.getElementById('btn-cadastrar-curso');
                    if (btn) btn.style.display = '';
                  }
                } catch (e) {/* ignore */}
              clearInterval(intervalId);
              return;
            }
          } catch (e) {
            // try fallback isAdmin path
            if (typeof sabiaAuth.isAdmin === 'function' && sabiaAuth.isAdmin()) {
              currentNav.insertAdjacentHTML('beforeend', adminNavItem);
              const el = document.getElementById('nav-cadastrar-curso');
              if (el) el.style.display = '';
                // also add admin header button if page offers admin-controls area (e.g., PainelCursos)
                try {
                  const headerArea = document.getElementById('admin-controls') || document.querySelector('.header-right');
                  if (headerArea && !document.getElementById('btn-cadastrar-curso')) {
                    headerArea.insertAdjacentHTML('beforeend', adminHeaderButton);
                    const btn = document.getElementById('btn-cadastrar-curso');
                    if (btn) btn.style.display = '';
                  }
                } catch (e) {/* ignore */}
              clearInterval(intervalId);
              return;
            }
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      }, 250);
    }

    tryInsertAdminLink();

    // Observe mudanças no DOM para reaplicar o link admin caso o sidebar seja substituído
    try {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length) {
            for (const node of m.addedNodes) {
              if (node.nodeType === 1) {
                if (node.classList && (node.classList.contains('sidebar') || node.classList.contains('sidebar-nav'))) {
                  tryInsertAdminLink();
                }
                if (node.querySelector && node.querySelector('.sidebar-nav')) {
                  tryInsertAdminLink();
                }
              }
            }
          }
          if (m.removedNodes && m.removedNodes.length) {
            // if sidebar removed, try again shortly
            for (const node of m.removedNodes) {
              if (node.nodeType === 1 && (node.classList && node.classList.contains('sidebar'))) {
                setTimeout(tryInsertAdminLink, 200);
                break;
              }
            }
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
      // fail silently if MutationObserver not supported
      console.warn('layout: MutationObserver not available', e);
    }

    // Remove any static footers on the page to avoid duplicates
    document.querySelectorAll('footer.footer').forEach(f => f.remove());

    // Insert shared footer at the end of body as a normal flow element
    if (!document.querySelector('body > .footer')) document.body.insertAdjacentHTML('beforeend', footerHtml);

    // ensure main/content has bottom padding so footer doesn't overlap content on short pages
    const mainEl = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('.content-area');
    if (mainEl && !mainEl.style.paddingBottom) {
      mainEl.style.paddingBottom = '120px';
    }

    // ensure main content has the correct class so shared CSS applies
    const main = document.querySelector('main') || document.querySelector('.main-content') || document.querySelector('.content-area') || document.querySelector('.page-wrapper') || document.querySelector('.page-container');
    if (main) {
      main.classList.add('main-content');
      // ensure content area has appropriate padding to avoid header overlap
      if (!main.style.paddingTop) main.style.paddingTop = 'calc(var(--header-height,70px) + 20px)';
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectIfMissing);
  else injectIfMissing();
})();
