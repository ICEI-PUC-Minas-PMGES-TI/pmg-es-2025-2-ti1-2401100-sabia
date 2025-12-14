/* Normalize module links and asset paths to use SABIAA_CONFIG.BASE_PATH
   Ensures module pages work regardless of deployment base path.
*/
(function(){
  const BASE = (window.SABIAA_CONFIG && window.SABIAA_CONFIG.BASE_PATH) || '/codigo/public';

  function normalizeUrl(url){
    if(!url) return url;
    // If already absolute with BASE, leave
    if(url.startsWith(BASE)) return url;
    // If absolute root pointing to /codigo/public, rewrite
    if(url.startsWith('/codigo/public')) return url.replace('/codigo/public', BASE);
    // If relative to modules (e.g. "modules/..."), make absolute with BASE
    if(url.startsWith('modules/') || url.startsWith('./modules/') || url.startsWith('../modules/')){
      // normalize leading ./ or ../ by removing dot segments and prefixing BASE
      const cleaned = url.replace(/^\.\/|^\.\.\//, '');
      return BASE + '/' + cleaned.replace(/^\//, '');
    }
    // For other relative urls, leave as-is (they are relative to current page)
    return url;
  }

  function updateAttributes(selector, attr){
    document.querySelectorAll(selector).forEach(el=>{
      try{
        const v = el.getAttribute(attr);
        const nv = normalizeUrl(v);
        if(nv && nv !== v) el.setAttribute(attr, nv);
      }catch(e){/* ignore */}
    });
  }

  function run(){
    updateAttributes('a[href]','href');
    updateAttributes('link[href]','href');
    updateAttributes('script[src]','src');
    updateAttributes('img[src]','src');
    updateAttributes('source[src]','src');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
