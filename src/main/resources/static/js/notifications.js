// src/main/resources/static/js/notifications.js

let isDropdownOpen = false;

async function initNotifications() {
    console.log('🚀 Iniciando sistema de notificaciones...');
    await loadNotifications();
    setInterval(loadNotifications, 30000); 
}

function toggleNotifModal() {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) {
        console.error('❌ No se encontró el elemento notif-dropdown');
        return;
    }
    
    isDropdownOpen = !isDropdownOpen;
    
    if (isDropdownOpen) {
        dropdown.classList.add('show');
        loadNotifications();
    } else {
        dropdown.classList.remove('show');
    }
}

async function loadNotifications() {
    const userId = window.CURRENT_USER_ID;
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    if (!userId || !token) {
        console.warn('❌ No hay usuario o token disponible');
        console.warn('   - User ID:', userId);
        console.warn('   - Token:', token ? 'Presente' : 'Ausente');
        return;
    }
    
    try {
        console.log(`📡 Cargando notificaciones para usuario ${userId}`);
        console.log(`   URL: ${apiUrl}/notificaciones/usuario/${userId}/no-leidas`);
        
        const response = await fetch(`${apiUrl}/notificaciones/usuario/${userId}/no-leidas`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📥 Respuesta recibida: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const notificaciones = await response.json();
        console.log(`✅ ${notificaciones.length} notificaciones cargadas`);
        
        renderNotifications(notificaciones);
        updateBadge(notificaciones.length);
        
    } catch (error) {
        console.error('❌ Error cargando notificaciones:', error);
        const container = document.getElementById('notif-list');
        if (container) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:#e74c3c;">Error al cargar notificaciones</div>';
        }
    }
}

function renderNotifications(lista) {
    const container = document.getElementById('notif-list');
    if (!container) {
        console.error('❌ No se encontró el elemento notif-list');
        return;
    }
    
    container.innerHTML = '';
    
    if (!lista || lista.length === 0) {
        container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">No tienes notificaciones nuevas</div>';
        return;
    }
    
    console.log(`🎨 Renderizando ${lista.length} notificaciones`);
    
    lista.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        
        let icon = '🔵'; // Por defecto
        if (notif.tipo === 'alerta') icon = '🔴';
        if (notif.tipo === 'exito') icon = '🟢';
        if (notif.tipo === 'info') icon = '🔵';
        
        item.innerHTML = `
            <div style="display:flex;gap:10px;width:100%;align-items:start;">
                <span style="font-size:1.2rem;flex-shrink:0;">${icon}</span>
                <div style="flex:1;">
                    <p style="margin:0;font-size:0.9rem;color:#333;">${notif.mensaje}</p>
                    <small style="color:#999;font-size:0.75rem;">${formatFecha(notif.fecha)}</small>
                </div>
                <button class="btn-close-notif" onclick="markAsRead(${notif.id}, event)" title="Marcar como leída">×</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function formatFecha(fecha) {
    if (!fecha) return '';
    
    try {
        const date = new Date(fecha);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // Segundos
        
        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
        return `Hace ${Math.floor(diff / 86400)} días`;
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return '';
    }
}

function updateBadge(count) {
    const badge = document.getElementById('notif-count');
    if (!badge) {
        console.warn('⚠️ No se encontró el badge de notificaciones');
        return;
    }
    
    if (count > 0) {
        badge.style.display = 'flex';
        badge.innerText = count > 99 ? '99+' : count;
        console.log(`🔔 Badge actualizado: ${count} notificaciones`);
    } else {
        badge.style.display = 'none';
        console.log('🔕 Sin notificaciones nuevas');
    }
}

async function markAsRead(id, event) {
    if (event) event.stopPropagation();
    
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    if (!token) {
        console.error('❌ No hay token disponible');
        return;
    }
    
    try {
        console.log(`📝 Marcando notificación ${id} como leída...`);
        
        const response = await fetch(`${apiUrl}/notificaciones/${id}/leer`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ Notificación ${id} marcada como leída`);
            await loadNotifications();
        } else {
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error marcando notificación:', error);
    }
}

async function markAllAsRead() {
    const userId = window.CURRENT_USER_ID;
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    if (!userId || !token) {
        console.error('❌ No hay usuario o token disponible');
        return;
    }
    
    if (!confirm('¿Marcar todas como leídas?')) return;
    
    try {
        console.log(`📝 Marcando todas las notificaciones como leídas para usuario ${userId}...`);
        
        const response = await fetch(`${apiUrl}/notificaciones/usuario/${userId}/leer-todas`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Todas las notificaciones marcadas como leídas');
            await loadNotifications();
        } else {
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error marcando todas las notificaciones:', error);
    }
}

// Cerrar dropdown al hacer clic fuera
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const btn = document.getElementById('btn-notif');
    
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
            dropdown.classList.remove('show');
            isDropdownOpen = false;
        }
    }
});

// Auto-iniciar si ya hay usuario (ejecutar al cargar)
if (typeof CURRENT_USER_ID !== 'undefined' && CURRENT_USER_ID) {
    console.log('✨ Variables globales detectadas:');
    console.log('   - User ID:', CURRENT_USER_ID);
    console.log('   - Token:', JWT_TOKEN ? 'Presente' : 'Ausente');
    console.log('   - API URL:', API_BASE_URL);
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }
}