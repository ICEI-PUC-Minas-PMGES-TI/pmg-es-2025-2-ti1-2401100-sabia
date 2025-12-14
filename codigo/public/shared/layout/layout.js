/* Shared layout loader
   Injects standardized header and sidebar into pages.
   Uses window.SABIAA_CONFIG.BASE_PATH for links (defaults to '/codigo/public').
*/
(function(){
  const BASE = (window.SABIAA_CONFIG && window.SABIAA_CONFIG.BASE_PATH) || '/codigo/public';

  const headerHtml = `
  <header class="header-internal">
    <div class="header-container">
      <div class="header-left">
        <button class="mobile-menu-toggle"><i class="fas fa-bars"></i></button>
        <div class="search-bar"><i class="fas fa-search"></i><input placeholder="Buscar..."></div>
      </div>
      <div class="header-right">
        <div class="header-icons">
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
      <a class="nav-item" href="${BASE}/modules/dashboard/index.html"><i class="fas fa-home"></i><span>Início</span></a>
      <a class="nav-item" href="${BASE}/modules/cursos/PainelCursos.html"><i class="fas fa-book"></i><span>Cursos</span></a>
      <a class="nav-item" href="${BASE}/modules/disciplinas/index.html"><i class="fas fa-chalkboard"></i><span>Disciplinas</span></a>
      <a class="nav-item" href="${BASE}/alexia/pub-video/pub-video-prof.html"><i class="fas fa-video"></i><span>Vídeo Aulas</span></a>
      <a class="nav-item" href="${BASE}/gustavo/estatico/homepage.html"><i class="fas fa-globe"></i><span>Site</span></a>
    </nav>
  </aside>`;

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

    // Replace or insert standardized sidebar
    const existingSidebar = document.querySelector('.sidebar, .sidebar-left, .sidebar-simple');
    if (existingSidebar) {
      existingSidebar.remove();
    }
    document.body.insertAdjacentHTML('afterbegin', sidebarHtml);

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
