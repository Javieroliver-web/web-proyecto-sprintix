// src/main/resources/static/js/api-client.js

/**
 * Cliente API centralizado para todas las peticiones
 * Carga la URL de la API dinámicamente desde el servidor
 */

let API_URL = null;

// Cargar configuración al inicio
async function initApiClient() {
    try {
        const response = await fetch('/config');
        const config = await response.json();
        API_URL = config.apiUrl;
    } catch (error) {
        console.error('Error cargando configuración de API:', error);
        API_URL = 'http://localhost:8080/api'; // Fallback
    }
}

/**
 * Realizar petición autenticada a la API
 * @param {string} endpoint - Ruta del endpoint (ej: '/proyectos')
 * @param {object} options - Opciones de fetch (method, body, etc.)
 * @returns {Promise<Response>}
 */
async function authFetch(endpoint, options = {}) {
    // Esperar a que la configuración esté lista
    if (!API_URL) {
        await initApiClient();
    }

    // Obtener token de la variable global (inyectada por Thymeleaf)
    const token = window.JWT_TOKEN || '';
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
}

/**
 * Helper para peticiones GET
 */
async function apiGet(endpoint) {
    const response = await authFetch(endpoint);
    if (!response.ok) throw new Error(`GET ${endpoint} falló`);
    return response.json();
}

/**
 * Helper para peticiones POST
 */
async function apiPost(endpoint, data) {
    const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`POST ${endpoint} falló`);
    return response.json();
}

/**
 * Helper para peticiones PUT
 */
async function apiPut(endpoint, data) {
    const response = await authFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`PUT ${endpoint} falló`);
    return response.json();
}

/**
 * Helper para peticiones DELETE
 */
async function apiDelete(endpoint) {
    const response = await authFetch(endpoint, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(`DELETE ${endpoint} falló`);
    return response;
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', initApiClient);