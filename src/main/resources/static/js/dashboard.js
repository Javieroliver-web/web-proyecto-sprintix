document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
    // 1. Obtener usuario logueado
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = '/index.html';
        return;
    }
    const user = JSON.parse(userStr);

    // 2. Llamar al endpoint específico de Dashboard en tu API
    // Endpoint: GET /api/usuarios/{id}/dashboard
    const res = await authFetch(`/usuarios/${user.id}/dashboard`);

    if (res && res.ok) {
        const data = await res.json();
        renderDashboard(data);
    } else {
        console.error("Error cargando dashboard");
    }
}

function renderDashboard(data) {
    // A. Renderizar Estadísticas
    document.getElementById('stat-pendientes').innerText = data.tareasPendientes || 0;
    document.getElementById('stat-proyectos').innerText = data.proyectosActivos || 0;

    // B. Renderizar Proyectos Recientes
    const recContainer = document.getElementById('recContainer');
    recContainer.innerHTML = '';
    
    if (data.ultimosProyectos && data.ultimosProyectos.length > 0) {
        data.ultimosProyectos.forEach(p => {
            recContainer.innerHTML += `
                <div class="rec-card" onclick="window.location.href='/board.html?id=${p.id}'">
                    <h3>${p.nombre}</h3>
                    <span style="font-size: 0.8rem; opacity: 0.8;">${new Date(p.fecha_inicio).toLocaleDateString()}</span>
                </div>
            `;
        });
    } else {
        recContainer.innerHTML = '<p style="color:#777;">No hay proyectos recientes</p>';
    }

    // C. Renderizar Próximas Tareas
    const taskContainer = document.getElementById('taskList');
    taskContainer.innerHTML = '';

    if (data.tareasProximas && data.tareasProximas.length > 0) {
        data.tareasProximas.forEach(t => {
            taskContainer.innerHTML += `
                <div class="task-row">
                    <input type="checkbox" class="task-check" disabled>
                    <span class="task-title">${t.titulo}</span>
                    <div class="task-meta">
                        <span class="badge badge-${t.estado?.toLowerCase() || 'default'}">${t.estado}</span>
                        <div class="user-avatar" style="width:30px; height:30px; font-size:0.8rem; background:#4285f4;">
                            U
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        taskContainer.innerHTML = '<p style="color:#777;">¡Estás al día! No tienes tareas próximas.</p>';
    }
}