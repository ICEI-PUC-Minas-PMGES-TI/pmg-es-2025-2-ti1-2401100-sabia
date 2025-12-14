/**
 * SABIAA - Configurações do Frontend
 */

const SABIAA_CONFIG = {
  // Configurações da API - JSON Server Simples
  API_BASE_URL: "http://localhost:3000",

  // Configurações do Firebase
  FIREBASE: {
    apiKey: "AIzaSyC9U3DZjJ8liRtElTM2RnpSCh2Jy6PiFcY",
    authDomain: "sabiaa-2e56f.firebaseapp.com",
    projectId: "sabiaa-2e56f",
    storageBucket: "sabiaa-2e56f.firebasestorage.app",
    messagingSenderId: "955927342731",
    appId: "1:955927342731:web:839ca036ac27f9471d6e8e",
    measurementId: "G-06EKQM64X6",
  },

  // Configurações de Upload
  UPLOAD: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    placeholderImage: "./assets/images/logos/logo_simbolo_azul.png",
  },

  // Configurações da API - Rotas simplificadas
  API_ROUTES: {
    AUTH: {
      LOGIN: "/api/auth/login",
      CADASTRO: "/api/auth/cadastro", 
      VERIFICAR: "/api/auth/verificar",
      RECUPERAR_SENHA: "/api/auth/recuperar-senha",
      ALTERAR_SENHA: "/api/auth/alterar-senha"
    },
    USUARIO: {
      PERFIL: "/api/usuario/perfil"
    },
    HEALTH: "/health"
  }
};

// Exportar configurações globalmente
window.SABIAA_CONFIG = SABIAA_CONFIG;
 
// Base path used to build links to pages/assets (can be adjusted in deployment)
window.SABIAA_CONFIG.BASE_PATH = window.SABIAA_CONFIG.BASE_PATH || '/codigo/public';
