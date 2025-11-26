// src/main/resources/static/js/notifications.js

let isDropdownOpen = false;
let knownNotifIds = new Set(); // Para rastrear qué notificaciones ya vimos
let firstLoad = true;

async function initNotifications() {
    // 1. Crear el elemento HTML del Toast si no existe
    createToastElement();

    // 2. Verificar si hay un mensaje pendiente de una recarga anterior (ej: Proyecto Creado)
    checkPendingToast();

    // 3. Cargar notificaciones iniciales
    await loadNotifications();

    // 4. Iniciar sondeo cada 15 segundos
    setInterval(loadNotifications, 15000); 
}

// --- LOGICA TOAST (POP-UP) ---

function createToastElement() {
    const wrapper = document.querySelector('.notification-wrapper');
    if (wrapper && !document.getElementById('toast-popup')) {
        const toast = document.createElement('div');
        toast.id = 'toast-popup';
        toast.className = 'toast-popup';
        toast.innerHTML = `
            <span class="toast-icon" id="toast-icon">👋</span>
            <span class="toast-msg" id="toast-msg">Notificación</span>
        `;
        wrapper.appendChild(toast);
    }
}

function showToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toast-popup');
    const msgEl = document.getElementById('toast-msg');
    const iconEl = document.getElementById('toast-icon');
    
    if (!toast) return;

    // Configurar contenido
    msgEl.innerText = mensaje;
    
    // Configurar estilo e icono
    toast.className = `toast-popup show ${tipo}`;
    if (tipo === 'exito') iconEl.innerText = '✅';
    else if (tipo === 'alerta') iconEl.innerText = '🗑️'; // O ⚠️
    else iconEl.innerText = '🔵';

    // Ocultar a los 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function checkPendingToast() {
    const pendingMsg = sessionStorage.getItem('TOAST_MSG');
    const pendingType = sessionStorage.getItem('TOAST_TYPE');
    
    if (pendingMsg) {
        // Pequeño delay para asegurar que el usuario ve la animación al cargar
        setTimeout(() => showToast(pendingMsg, pendingType || 'info'), 500);
        
        // Limpiar para que no salga siempre
        sessionStorage.removeItem('TOAST_MSG');
        sessionStorage.removeItem('TOAST_TYPE');
    }
}

// --- LOGICA NOTIFICACIONES ---

async function loadNotifications() {
    const userId = window.CURRENT_USER_ID;
    const token = window.JWT_TOKEN;
    
    if (!userId || !token) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/notificaciones/usuario/${userId}/no-leidas`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const notificaciones = await response.json();
            
            // Detectar nuevas notificaciones para mostrar Toast (Solo si NO es la primera carga)
            if (!firstLoad) {
                notificaciones.forEach(n => {
                    if (!knownNotifIds.has(n.id)) {
                        // ¡Nueva notificación detectada en segundo plano!
                        showToast(n.mensaje, n.tipo);
                    }
                });
            }

            // Actualizar Set de IDs conocidos
            notificaciones.forEach(n => knownNotifIds.add(n.id));
            
            renderNotifications(notificaciones);
            updateBadge(notificaciones.length);
            firstLoad = false;
        }
    } catch (e) { console.error(e); }
}

function renderNotifications(lista) {
    const container = document.getElementById('notif-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!lista || lista.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">Sin novedades</div>';
        return;
    }
    
    lista.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        // ... (resto del renderizado igual que antes) ...
        let icon = '🔵';
        if (notif.tipo === 'alerta') icon = '🔴';
        if (notif.tipo === 'exito') icon = '🟢';
        
        item.innerHTML = `
            <div style="display:flex;gap:10px;width:100%;align-items:start;">
                <span style="font-size:1.2rem;">${icon}</span>
                <div style="flex:1;">
                    <p style="margin:0;font-size:0.9rem;">${notif.mensaje}</p>
                    <small style="color:#999;font-size:0.75rem;">Hace un momento</small>
                </div>
                <button class="btn-close-notif" onclick="markAsRead(${notif.id}, event)">×</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function updateBadge(count) {
    const badge = document.getElementById('notif-count');
    if (badge) {
        badge.style.display = count > 0 ? 'flex' : 'none';
        badge.innerText = count > 99 ? '99+' : count;
    }
}

// ... Funciones markAsRead, markAllAsRead, toggleNotifModal se mantienen igual ...
// (Asegúrate de copiar las funciones existentes toggleNotifModal, markAsRead, etc. del archivo anterior o pedirme que las incluya si las necesitas)
function toggleNotifModal() {
    const dropdown = document.getElementById('notif-dropdown');
    if(!dropdown) return;
    isDropdownOpen = !isDropdownOpen;
    dropdown.classList.toggle('show', isDropdownOpen);
}
// Cierre al hacer click fuera
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('btn-notif');
    if (isDropdownOpen && dropdown && !dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('show');
        isDropdownOpen = false;
    }
});

async function markAsRead(id, event) {
    if(event) event.stopPropagation();
    await fetch(`${window.API_BASE_URL}/notificaciones/${id}/leer`, {
        method: 'PUT', headers: {'Authorization': `Bearer ${window.JWT_TOKEN}`}
    });
    loadNotifications();
}

async function markAllAsRead() {
    if(!confirm('¿Marcar todo como leído?')) return;
    await fetch(`${window.API_BASE_URL}/notificaciones/usuario/${window.CURRENT_USER_ID}/leer-todas`, {
        method: 'PUT', headers: {'Authorization': `Bearer ${window.JWT_TOKEN}`}
    });
    loadNotifications();
}