// ==========================================
// GESTIÓN DE AUTENTICACIÓN Y CONFIGURACIÓN
// ==========================================

// Variable global para la URL de la API (se actualiza al cargar)
let API_URL = 'http://localhost:8080/api'; 

// Se ejecuta automáticamente al cargar cualquier página que incluya este script
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();      // 1. Cargar configuración
    setupLoginListener();    // 2. Activar formulario de login (si existe)
    checkAuth();             // 3. Verificar si el usuario tiene permiso (si no es login)
});

/**
 * 1. Carga la configuración desde el Backend Java (Controller)
 * Esto permite que la URL de la API sea dinámica (Docker vs Local)
 */
async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            if (config.apiUrl) {
                API_URL = config.apiUrl;
                console.log('🔌 API configurada en:', API_URL);
            }
        }
    } catch (error) {
        console.warn('No se pudo cargar /config, usando localhost por defecto.');
    }
}

/**
 * 2. Configura el evento submit del formulario de Login
 */
function setupLoginListener() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return; // Si no estamos en el login, no hacemos nada

    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitar recarga de página
        
        if(errorMsg) errorMsg.style.display = 'none'; // Ocultar error previo
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Llamada a la API (Endpoint AuthController)
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // LOGIN EXITOSO
                console.log('Login correcto:', data.usuario.nombre);
                
                // Guardamos sesión en el navegador
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.usuario));
                
                // Redirigir al Dashboard
                window.location.href = '/dashboard.html';
            } else {
                // LOGIN FALLIDO
                throw new Error(data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error(error);
            if(errorMsg) {
                errorMsg.textContent = error.message || 'Error de conexión';
                errorMsg.style.display = 'block';
            } else {
                alert(error.message);
            }
        }
    });
}

/**
 * 3. Verifica si hay sesión activa
 * Si estamos en una página protegida (no login) y no hay token, echa al usuario.
 */
function checkAuth() {
    const path = window.location.pathname;
    const isLoginPage = path === '/' || path === '/index.html' || path.endsWith('index.html');
    const token = localStorage.getItem('token');

    if (!isLoginPage && !token) {
        // Si intenta entrar a dashboard sin token -> Al Login
        window.location.href = '/index.html';
    } else if (isLoginPage && token) {
        // Si ya tiene token y va al login -> Al Dashboard
        window.location.href = '/dashboard.html';
    }
}

/**
 * 4. Función Global para Cerrar Sesión
 * Se llama desde el botón "Salir" del HTML
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}