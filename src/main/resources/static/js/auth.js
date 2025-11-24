// Variable global
let API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) setupLoginListener(loginForm);
    
    checkAuth();
});

async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            if (config.apiUrl) API_URL = config.apiUrl;
        }
    } catch (e) { console.log('Usando config local'); }
}

async function authFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (response.status === 401) { logout(); return null; }
        return response;
    } catch (error) { return null; }
}

function setupLoginListener(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Elementos
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        
        // Resetear estado UI
        errorMsg.style.display = 'none';
        errorMsg.innerText = '';

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
                // ERROR DE CREDENCIALES
                throw new Error('Credenciales incorrectas');
            }
        } catch (error) {
            // MOSTRAR ERROR VISUALMENTE
            errorMsg.innerText = "⚠️ " + error.message;
            errorMsg.style.display = 'block';
        }
    });
}

function checkAuth() {
    const path = window.location.pathname;
    const isLogin = path === '/' || path.endsWith('index.html');
    const token = localStorage.getItem('token');
    if (!isLogin && !token) window.location.href = '/index.html';
    if (isLogin && token) window.location.href = '/dashboard.html';
}

function logout() {
    localStorage.clear();
    window.location.href = '/index.html';
}