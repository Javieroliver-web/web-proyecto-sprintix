// js/layout.js
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("sidebar-container", "/components/sidebar.html");
    loadComponent("header-container", "/components/header.html");
});

async function loadComponent(elementId, htmlPath) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        // Nota: Deberás crear estos archivos HTML parciales o insertarlos vía JS string
        // Para simplificar sin servidor de templates, usaremos strings aquí:
        if (elementId === 'sidebar-container') {
            element.innerHTML = getSidebarHTML();
            setupActiveLink();
        } else if (elementId === 'header-container') {
            element.innerHTML = getHeaderHTML();
            setupUserHeader();
        }
    } catch (e) {
        console.error("Error cargando componente", e);
    }
}

function getSidebarHTML() {
    return `
    <nav class="sidebar">
        <div class="logo-container">
            <img src="img/Logo2.png" class="logo-img">
            <span class="brand-name">Sprintix</span>
        </div>
        <ul class="nav-links">
            <li><a href="/dashboard.html" class="nav-item">📊 Dashboard</a></li>
            <li><a href="/proyectos.html" class="nav-item">📁 Proyectos</a></li>
            <li><a href="#" onclick="logout()" class="nav-item">🚪 Salir</a></li>
        </ul>
    </nav>`;
}

function getHeaderHTML() {
    return `
    <header class="header">
        <h2 id="pageTitle">Sprintix</h2>
        <div class="user-profile">
            <span id="headerUserName">Usuario</span>
            <div class="avatar" id="headerUserInitial">U</div>
        </div>
    </header>`;
}

function setupActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(link => {
        if(link.getAttribute('href') === path) link.classList.add('active');
    });
}

function setupUserHeader() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('headerUserName').textContent = user.nombre;
        document.getElementById('headerUserInitial').textContent = user.nombre.charAt(0).toUpperCase();
    }
}