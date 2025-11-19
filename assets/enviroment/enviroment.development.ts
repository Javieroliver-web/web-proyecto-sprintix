// src/environments/environment.development.ts
export const environment = {
    production: false,
    apiUrl: '/api', // Usa ruta relativa para aprovechar el proxy
    apiTimeout: 30000, // 30 segundos
    enableDebugMode: true,
    logLevel: 'debug'
  };