// --- Notificaciones Automáticas ---
async function sendNotification(mensaje, tipo = 'info') {
    const userId = window.CURRENT_USER_ID;
    if (!userId) return;
    try {
        await authFetch('/notificaciones', {
            method: 'POST',
            body: JSON.stringify({ mensaje: mensaje, tipo: tipo, usuario_id: userId })
        });
        if(typeof loadNotifications === 'function') loadNotifications();
    } catch (e) { console.error(e); }
}

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
        if (res.ok) {
            let estadoTexto = nuevoEstado === 'en_progreso' ? 'En Curso' : 
                              nuevoEstado === 'completada' ? 'Completada' : 'Pendiente';
            let tipo = nuevoEstado === 'completada' ? 'exito' : 'info';
            sendNotification(`Tarea movida a: ${estadoTexto}`, tipo);
        } else { 
            alert("Error al mover. Recargando..."); window.location.reload(); 
        }
    } catch (error) { window.location.reload(); }
};

// --- Modales ---
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
    if (modal) { modal.classList.remove('show'); if (form) form.reset(); }
}
window.onclick = function(event) { if (event.target == modal) closeTaskModal(); }

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('t-titulo').value;
        const desc = document.getElementById('t-desc').value;
        const estado = document.getElementById('t-estado').value;
        const fecha = document.getElementById('t-fecha').value;

        const newTask = { titulo: titulo, descripcion: desc, estado: estado, fecha_limite: fecha || null, proyecto_id: parseInt(projectId) };

        try {
            const res = await authFetch('/tareas', { method: 'POST', body: JSON.stringify(newTask) });
            if (res && res.ok) {
                await sendNotification(`Nueva tarea creada: ${titulo}`, 'info');
                closeTaskModal();
                window.location.reload(); 
            } else { alert('Error al crear tarea'); }
        } catch (error) { alert('Error de conexión.'); }
    });
}

window.deleteTask = async function(event, taskId) {
    event.stopPropagation(); 
    if (!confirm('¿Eliminar tarea?')) return;
    try {
        const res = await authFetch(`/tareas/${taskId}`, { method: 'DELETE' });
        if (res.ok) {
            document.getElementById(`task-${taskId}`).remove();
            sendNotification(`Tarea eliminada`, 'alerta');
        }
    } catch (error) { console.error(error); }
}