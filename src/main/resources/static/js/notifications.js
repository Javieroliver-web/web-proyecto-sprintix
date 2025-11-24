// js/notifications.js

async function initNotifications() {
    await loadNotifications();
    // Recargar cada 30 segundos (Polling simple)
    setInterval(loadNotifications, 30000); 
}

function toggleNotifModal() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.classList.toggle('show');
    
    // Si se abre, recargar datos
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
}

async function loadNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Endpoint API: /notificaciones/usuario/{id}/no-leidas (o todas)
    // Usamos el endpoint que creaste en NotificacionController
    const res = await authFetch(`/notificaciones/usuario/${user.id}`);
    
    if (res && res.ok) {
        const notificaciones = await res.json();
        renderNotifications(notificaciones);
        updateBadge(notificaciones.length);
    }
}

function renderNotifications(lista) {
    const container = document.getElementById('notif-list');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:10px;">No tienes notificaciones</p>';
        return;
    }

    lista.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        
        // Texto + Botón X
        item.innerHTML = `
            <span>${notif.mensaje}</span>
            <button class="btn-close-notif" onclick="deleteNotification(${notif.id}, event)">✕</button>
        `;
        container.appendChild(item);
    });
}

function updateBadge(count) {
    const badge = document.getElementById('notif-count');
    if (count > 0) {
        badge.style.display = 'flex';
        badge.innerText = count > 9 ? '9+' : count;
    } else {
        badge.style.display = 'none';
    }
}

async function deleteNotification(id, event) {
    event.stopPropagation(); // Evitar cierre del modal
    
    if(!confirm('¿Borrar notificación?')) return;

    const res = await authFetch(`/notificaciones/${id}`, {
        method: 'DELETE'
    });

    if (res && res.ok) {
        loadNotifications(); // Recargar lista
    }
}

// Cerrar modal si clic fuera
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('btn-notif');
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && e.target !== btn) {
            dropdown.classList.remove('show');
        }
    }
});