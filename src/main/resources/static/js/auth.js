// Variable global para la API
let API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupLoginListener();
    checkAuth();
});

async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            if (config.apiUrl) API_URL = config.apiUrl;
        }
    } catch (e) { console.warn('Usando API localhost por defecto'); }
}

// --- Nueva función central para peticiones autenticadas ---
async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!options.headers) options.headers = {};
    
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (response.status === 401) {
            logout(); // Token expirado
            return null;
        }
        return response;
    } catch (error) {
        console.error("Error de red:", error);
        return null;
    }
}

function setupLoginListener() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.usuario));
                window.location.href = '/dashboard.html';
            } else {
                throw new Error(data.message || 'Error de login');
            }
        } catch (error) {
            if(errorMsg) {
                errorMsg.textContent = error.message;
                errorMsg.style.display = 'block';
            }
        }
    });
}

function checkAuth() {
    const path = window.location.pathname;
    const isPublic = path === '/' || path.endsWith('index.html') || path.endsWith('login.html');
    const token = localStorage.getItem('token');

    if (!isPublic && !token) window.location.href = '/index.html';
    if (isPublic && token) window.location.href = '/dashboard.html';
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}