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
    // Endpoint: GET /api/tareas/proyecto/{id}
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
            card.dataset.id = t.id; // Guardamos ID real en dataset
            
            card.innerHTML = `
                <h4>${t.titulo}</h4>
                <p>${t.descripcion || ''}</p>
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

// --- Drag & Drop Logic ---
window.allowDrop = (e) => {
    e.preventDefault();
}

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if(!card) return;

    // UI Optimista: Mover la tarjeta inmediatamente
    const targetCol = document.getElementById(`col-${nuevoEstado}`);
    targetCol.appendChild(card);

    // Llamada API para persistir cambio
    const res = await authFetch(`/tareas/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
            estado: nuevoEstado 
            // Nota: Al ser PUT, el backend podría requerir el resto de campos.
            // Si falla, cambiaremos a PATCH o enviaremos el objeto completo.
            // Tu TareaController hace: tarea.setEstado(...) y guarda.
            // Como recupera la tarea de DB primero (obtenerPorId), esto funcionará bien.
        })
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

    // Estructura para JPA: enviamos el proyecto como objeto anidado
    const newTask = {
        titulo: titulo,
        descripcion: desc,
        estado: estado,
        fecha_limite: new Date(),
        proyecto: {
            id: projectId
        }
    };

    const res = await authFetch('/tareas', {
        method: 'POST',
        body: JSON.stringify(newTask)
    });

    if (res && res.ok) {
        closeTaskModal();
        loadBoard();
    } else {
        alert('Error al crear tarea');
    }
});