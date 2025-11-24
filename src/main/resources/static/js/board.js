const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if(!projectId) {
        window.location.href = '/proyectos.html';
        return;
    }
    loadBoard();
});

async function loadBoard() {
    // 1. Info Proyecto
    const resP = await authFetch(`/proyectos/${projectId}`);
    if (resP.ok) {
        const proj = await resP.json();
        document.getElementById('boardTitle').innerText = proj.nombre;
    }

    // 2. Tareas del Proyecto
    const resT = await authFetch(`/tareas/proyecto/${projectId}`);
    if (resT.ok) {
        renderTasks(await resT.json());
    }
}

function renderTasks(tareas) {
    ['pendiente', 'en_progreso', 'completada'].forEach(estado => {
        const col = document.getElementById(`col-${estado}`);
        if(col) col.innerHTML = '';
    });

    tareas.forEach(t => {
        let estadoKey = normalizeStatus(t.estado);
        const col = document.getElementById(`col-${estadoKey}`);
        
        if (col) {
            const card = document.createElement('div');
            card.className = `task-card ${estadoKey === 'completada' ? 'completed' : ''}`;
            card.draggable = true;
            card.id = `task-${t.id}`;
            card.dataset.id = t.id; 
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h4 style="margin:0; flex:1; font-size:1rem;">${t.titulo}</h4>
                    <span class="star-icon" onclick="toggleFavorito(${t.id}, this)">★</span>
                </div>
                <p style="margin: 5px 0; font-size:0.9rem; color:#666;">${t.descripcion || ''}</p>
                ${t.fecha_limite ? `<small style="color:#888; display:block; margin-top:5px;">📅 ${new Date(t.fecha_limite).toLocaleDateString()}</small>` : ''}
            `;
            
            // Eventos Drag
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'move';
                card.classList.add('dragging');
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            col.appendChild(card);
        }
    });
}

function normalizeStatus(status) {
    if(!status) return 'pendiente';
    const s = status.toLowerCase();
    if (s === 'por hacer' || s === 'todo') return 'pendiente';
    if (s === 'en curso' || s === 'in_progress') return 'en_progreso';
    if (s === 'listo' || s === 'done') return 'completada';
    return s;
}

// --- Favoritos ---
async function toggleFavorito(taskId, iconElement) {
    event.stopPropagation(); 
    const user = JSON.parse(localStorage.getItem('user'));
    const isActive = iconElement.classList.contains('active');
    
    if (!isActive) {
        const res = await authFetch(`/tareas/${taskId}/favorito`, {
            method: 'POST',
            body: JSON.stringify({ usuario_id: user.id })
        });
        if (res.ok) iconElement.classList.add('active');
    } else {
        const res = await authFetch(`/tareas/${taskId}/favorito/${user.id}`, {
            method: 'DELETE'
        });
        if (res.ok) iconElement.classList.remove('active');
    }
}

// --- Drag & Drop Logic ---
window.allowDrop = (e) => e.preventDefault();

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if(!card) return;

    const targetCol = document.getElementById(`col-${nuevoEstado}`);
    targetCol.appendChild(card);

    const res = await authFetch(`/tareas/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
        alert("Error al mover la tarea. Recargando...");
        loadBoard();
    }
};

// --- Modales Tarea ---
const modal = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');

window.openTaskModal = function(estadoDefault) {
    document.getElementById('t-estado').value = estadoDefault;
    modal.classList.add('show');
    document.getElementById('t-titulo').focus();
}

window.closeTaskModal = function() {
    modal.classList.remove('show');
    form.reset();
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('t-titulo').value;
    const desc = document.getElementById('t-desc').value;
    const estado = document.getElementById('t-estado').value;
    const fecha = document.getElementById('t-fecha').value;

    // --- CORRECCIÓN: Estructura plana para el DTO ---
    const newTask = {
        titulo: titulo,
        descripcion: desc,
        estado: estado,
        fecha_limite: fecha || null,
        proyecto_id: parseInt(projectId) // Enviamos ID directo
    };

    const res = await authFetch('/tareas', {
        method: 'POST',
        body: JSON.stringify(newTask)
    });

    if (res && res.ok) {
        closeTaskModal();
        loadBoard();
    } else {
        const errorData = await res.json().catch(() => ({})); 
        alert('Error al crear tarea: ' + (errorData.message || 'Error desconocido'));
    }
});