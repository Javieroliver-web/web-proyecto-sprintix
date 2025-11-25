// src/main/resources/static/js/board.js

// --- Drag & Drop ---
function drag(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.dataset.id);
    ev.dataTransfer.effectAllowed = "move";
    ev.target.classList.add('dragging');
}

window.allowDrop = (e) => { e.preventDefault(); }

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if (!card) return;
    card.classList.remove('dragging');
    document.getElementById(`col-${nuevoEstado}`).appendChild(card);

    try {
        const res = await authFetch(`/tareas/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (!res.ok) { 
            alert("Error al mover. Recargando..."); 
            window.location.reload(); 
        }
    } catch (error) { window.location.reload(); }
};

// --- Favoritos ---
async function toggleFavorito(taskId, iconElement) {
    event.stopPropagation(); 
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const isActive = iconElement.classList.contains('active');
    const method = isActive ? 'DELETE' : 'POST';
    const url = isActive ? `/tareas/${taskId}/favorito/${user.id}` : `/tareas/${taskId}/favorito`;
    const body = isActive ? null : JSON.stringify({ usuario_id: user.id });

    try {
        const res = await authFetch(url, { method: method, body: body });
        if (res.ok) {
            if(isActive) iconElement.classList.remove('active');
            else iconElement.classList.add('active');
        }
    } catch (error) { console.error(error); }
}

// --- Modal y Creación ---
const modal = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');

window.openTaskModal = function(estadoDefault) {
    if (modal) {
        document.getElementById('t-estado').value = estadoDefault;
        modal.classList.add('show');
        setTimeout(() => document.getElementById('t-titulo').focus(), 100);
    }
}

window.closeTaskModal = function() {
    if (modal) {
        modal.classList.remove('show');
        if (form) form.reset();
    }
}

window.onclick = function(event) {
    if (event.target == modal) closeTaskModal();
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('t-titulo').value;
        const desc = document.getElementById('t-desc').value;
        const estado = document.getElementById('t-estado').value;
        const fecha = document.getElementById('t-fecha').value;

        const newTask = {
            titulo: titulo,
            descripcion: desc,
            estado: estado,
            fecha_limite: fecha || null, // Enviar null si vacío, o "yyyy-MM-dd" si tiene valor
            proyecto_id: parseInt(projectId) 
        };

        try {
            const res = await authFetch('/tareas', {
                method: 'POST',
                body: JSON.stringify(newTask)
            });

            if (res && res.ok) {
                closeTaskModal();
                window.location.reload(); 
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert('Error al crear tarea: ' + (errorData.message || 'Datos inválidos'));
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    });
}