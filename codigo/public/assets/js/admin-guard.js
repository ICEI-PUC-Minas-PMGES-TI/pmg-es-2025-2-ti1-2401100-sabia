// SABIAA - Proteção de Páginas Administrativas
// Script para verificar se o usuário tem permissão de acesso

(function() {
    // Verifica se a página atual é administrativa
    function isAdminPage() {
        const currentPath = window.location.pathname;
        
        // Lista de páginas/padrões que são exclusivas para admin
        const adminPaths = [
            '/cadastro.html',
            '/cadastrar',
            '/publicar',
            '/pub-video',
            '/relatorio'
        ];
        
        return adminPaths.some(path => currentPath.includes(path));
    }
    
    // Verifica permissão e redireciona se necessário
    function checkAdminAccess() {
        // Aguardar o sabiaAuth estar pronto
        if (!window.sabiaAuth) {
            setTimeout(checkAdminAccess, 100);
            return;
        }
        
        // Se não está logado, redirecionar para login
        if (!window.sabiaAuth.isLoggedIn()) {
            console.log('❌ Usuário não autenticado');
            return; // O auth.js já cuida do redirect
        }
        
        // Se é página admin e o usuário não é admin
        if (isAdminPage() && !window.sabiaAuth.isAdmin()) {
            console.log('❌ Acesso negado: Página administrativa');
            alert('⚠️ Acesso Negado\n\nEsta página é exclusiva para administradores.\nVocê será redirecionado para o dashboard.');
            window.location.href = '/codigo/public/modules/dashboard/index.html';
            return;
        }
        
        // Log de acesso permitido
        if (isAdminPage()) {
            console.log('✅ Acesso administrativo concedido');
        }
    }
    
    // Executar verificação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminAccess);
    } else {
        checkAdminAccess();
    }
})();
