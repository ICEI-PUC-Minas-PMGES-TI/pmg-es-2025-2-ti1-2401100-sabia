const { exec } = require('child_process');
const path = require('path');

// URL da homepage
const homeUrl = 'https://sabiaa.onrender.com/codigo/public/modules/home/index.html';

// Aguardar um tempo para o servidor iniciar
console.log('\n🚀 Aguardando servidor iniciar...\n');

setTimeout(() => {
    console.log('🌐 Abrindo navegador na homepage...\n');
    
    // Detectar sistema operacional e abrir navegador
    const command = process.platform === 'win32' 
        ? `start ${homeUrl}`
        : process.platform === 'darwin' 
        ? `open ${homeUrl}`
        : `xdg-open ${homeUrl}`;
    
    exec(command, (error) => {
        if (error) {
            console.error('❌ Erro ao abrir navegador:', error);
            console.log(`\n📍 Acesse manualmente: ${homeUrl}\n`);
        } else {
            console.log('✅ Navegador aberto com sucesso!\n');
            console.log('📍 Homepage: ' + homeUrl);
            console.log('🔗 Login: https://sabiaa.onrender.com/codigo/public/modules/auth/login.html');
            console.log('🔗 Dashboard: https://sabiaa.onrender.com/codigo/public/modules/dashboard/index.html\n');
        }
    });
}, 3000); // Aguarda 3 segundos
