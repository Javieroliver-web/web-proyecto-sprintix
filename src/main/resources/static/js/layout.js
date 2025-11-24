// js/layout.js
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("sidebar-container", "/components/sidebar.html", setupSidebarActiveLink);
    
    // Al cargar el header, iniciamos las notificaciones
    loadComponent("header-container", "/components/header.html", () => {
        setupHeaderUser();
        loadScript("/js/notifications.js", () => {
            if (typeof initNotifications === "function") {
                initNotifications();
            }
        });
    });
});

// Función auxiliar para cargar scripts dinámicamente
function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    document.body.appendChild(script);
}

async function loadComponent(elementId, path, callback) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        const res = await fetch(path);
        if (res.ok) {
            element.innerHTML = await res.text();
            if (callback) callback();
        }
    } catch (e) { console.error(`Error cargando ${path}`, e); }
}

function setupSidebarActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        // Lógica simple para detectar active
        if (link.getAttribute('href') === path) link.classList.add('active');
    });
}

function setupHeaderUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const avatar = document.getElementById('headerUserInitial');
        if (avatar) avatar.innerText = user.nombre.charAt(0).toUpperCase();
    }
}