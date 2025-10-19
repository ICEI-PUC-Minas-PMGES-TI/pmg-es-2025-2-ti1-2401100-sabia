/**
 * SABIAA - Configurações do Frontend
 */

const SABIAA_CONFIG = {
  // Configurações da API
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
};

// Exportar configurações globalmente
window.SABIAA_CONFIG = SABIAA_CONFIG;
