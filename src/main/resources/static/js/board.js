// js/board.js

// ELIMINAMOS loadBoard() y los listeners de DOMContentLoaded
// Solo dejamos las funciones de interacción

// --- Drag & Drop ---
function drag(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.dataset.id);
    ev.dataTransfer.effectAllowed = "move";
}

window.allowDrop = (e) => e.preventDefault();

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if(!card) return;

    // Mover UI
    const targetCol = document.getElementById(`col-${nuevoEstado}`);
    targetCol.appendChild(card);

    // Actualizar Backend
    const res = await authFetch(`/tareas/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
        alert("Error. Recargando...");
        window.location.reload();
    }
};

// --- Modales ---
const modal = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');

window.openTaskModal = function(estadoDefault) {
    document.getElementById('t-estado').value = estadoDefault;
    modal.classList.add('show');
}

window.closeTaskModal = function() {
    modal.classList.remove('show');
    form.reset();
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newTask = {
        titulo: document.getElementById('t-titulo').value,
        descripcion: document.getElementById('t-desc').value,
        estado: document.getElementById('t-estado').value,
        fecha_limite: document.getElementById('t-fecha').value || null,
        proyecto_id: projectId // Usamos la variable inyectada por Thymeleaf
    };

    const res = await authFetch('/tareas', {
        method: 'POST',
        body: JSON.stringify(newTask)
    });

    if (res && res.ok) {
        closeTaskModal();
        window.location.reload(); // Recargar para ver la nueva tarea
    } else {
        alert('Error al crear tarea');
    }
});