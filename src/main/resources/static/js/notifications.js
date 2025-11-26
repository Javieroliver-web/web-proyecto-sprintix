let isDropdownOpen = false;

async function initNotifications() {
    await loadNotifications();
    setInterval(loadNotifications, 30000); 
}

function toggleNotifModal() {
    const dropdown = document.getElementById('notif-dropdown');
    if(!dropdown) return;
    isDropdownOpen = !isDropdownOpen;
    if (isDropdownOpen) { dropdown.classList.add('show'); loadNotifications(); } 
    else { dropdown.classList.remove('show'); }
}

async function loadNotifications() {
    let userId = window.CURRENT_USER_ID;
    if (!userId) return;
    try {
        const res = await authFetch(`/notificaciones/usuario/${userId}/no-leidas`);
        if (res && res.ok) {
            const notificaciones = await res.json();
            renderNotifications(notificaciones);
            updateBadge(notificaciones.length);
        }
    } catch (e) { console.error(e); }
}

function renderNotifications(lista) {
    const container = document.getElementById('notif-list');
    if(!container) return;
    container.innerHTML = '';
    if (!lista || lista.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">No tienes notificaciones nuevas</div>';
        return;
    }
    lista.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        let icon = notif.tipo === 'alerta' ? '🔴' : (notif.tipo === 'exito' ? '🟢' : '🔵');
        item.innerHTML = `
            <div style="display:flex;gap:10px;width:100%;">
                <span>${icon}</span>
                <div style="flex:1;"><p style="margin:0;font-size:0.9rem;color:#333;">${notif.mensaje}</p></div>
                <button class="btn-close-notif" onclick="markAsRead(${notif.id}, event)">×</button>
            </div>`;
        container.appendChild(item);
    });
}

function updateBadge(count) {
    const badge = document.getElementById('notif-count');
    if(!badge) return;
    if (count > 0) { badge.style.display = 'flex'; badge.innerText = count > 9 ? '9+' : count; } 
    else { badge.style.display = 'none'; }
}

async function markAsRead(id, event) {
    if(event) event.stopPropagation();
    try {
        const res = await authFetch(`/notificaciones/${id}/leer`, { method: 'PUT' });
        if (res.ok) loadNotifications();
    } catch (e) { console.error(e); }
}

async function markAllAsRead() {
    let userId = window.CURRENT_USER_ID;
    if(!userId || !confirm('¿Marcar todas como leídas?')) return;
    try {
        const res = await authFetch(`/notificaciones/usuario/${userId}/leer-todas`, { method: 'PUT' });
        if (res.ok) loadNotifications();
    } catch (e) { console.error(e); }
}

window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('btn-notif');
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
            dropdown.classList.remove('show'); isDropdownOpen = false;
        }
    }
});