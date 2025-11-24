const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if(!projectId) return window.location.href = '/proyectos.html';
    loadBoard();
});

async function loadBoard() {
    // 1. Info Proyecto
    const resP = await authFetch(`/proyectos/${projectId}`);
    if (resP.ok) {
        const proj = await resP.json();
        document.getElementById('boardTitle').innerText = proj.nombre;
    }

    // 2. Tareas
    const resT = await authFetch(`/tareas?proyecto_id=${projectId}`);
    if (resT.ok) {
        renderTasks(await resT.json());
    }
}

function renderTasks(tareas) {
    ['pendiente', 'en_progreso', 'completada'].forEach(estado => {
        document.getElementById(`col-${estado}`).innerHTML = '';
    });

    tareas.forEach(t => {
        let estadoKey = t.estado.toLowerCase();
        if(estadoKey === 'por hacer') estadoKey = 'pendiente';
        if(estadoKey === 'en curso') estadoKey = 'en_progreso';
        if(estadoKey === 'listo') estadoKey = 'completada';

        const col = document.getElementById(`col-${estadoKey}`);
        if (col) {
            const card = document.createElement('div');
            card.className = `task-card ${estadoKey === 'completada' ? 'completed' : ''}`;
            card.draggable = true;
            card.id = `task-${t.id}`;
            // Se puede añadir un onclick aquí para editar tarea en el futuro
            card.innerHTML = `<h4>${t.titulo}</h4><p>${t.descripcion || ''}</p>`;
            
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            col.appendChild(card);
        }
    });
}

// --- Drag & Drop ---
window.allowDrop = (e) => e.preventDefault();

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    // UI Optimista
    document.getElementById(`col-${nuevoEstado}`).appendChild(card);

    // Backend Update
    await authFetch(`/tareas/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado })
    });
};

// --- Gestión Modal Tarea ---
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

    const newTask = {
        titulo: titulo,
        descripcion: desc,
        estado: estado,
        proyecto_id: projectId
    };

    const res = await authFetch('/tareas', {
        method: 'POST',
        body: JSON.stringify(newTask)
    });

    if (res && res.ok) {
        closeTaskModal();
        loadBoard(); // Recargar el tablero
    } else {
        alert('Error al crear tarea');
    }
});