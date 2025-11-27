// src/main/resources/static/js/board.js

// --- Helper UI Vacía ---
function checkEmptyState(colId) {
    const col = document.getElementById(`col-${colId}`);
    if (!col) return;
    const tasks = col.querySelectorAll('.task-card');
    let msg = col.querySelector('.empty-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.className = 'empty-msg';
        msg.innerText = 'No hay tareas';
        col.prepend(msg);
    }
    msg.style.display = (tasks.length === 0) ? 'block' : 'none';
}

// --- Notificaciones ---
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
    ev.dataTransfer.setData("origin-col", ev.target.closest('.column-content').id.replace('col-', ''));
    ev.dataTransfer.effectAllowed = "move";
    ev.target.classList.add('dragging');
}

window.allowDrop = (e) => { e.preventDefault(); }

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const origen = e.dataTransfer.getData('origin-col');
    
    const card = document.getElementById(`task-${taskId}`);
    if (!card) return;
    
    card.classList.remove('dragging');
    document.getElementById(`col-${nuevoEstado}`).appendChild(card);

    // Actualizar atributos
    card.setAttribute('data-status-key', nuevoEstado);
    card.setAttribute('data-status', capitalizeEstado(nuevoEstado));

    checkEmptyState(origen);
    checkEmptyState(nuevoEstado);

    try {
        const res = await authFetch(`/tareas/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (res.ok) {
            let estadoTexto = capitalizeEstado(nuevoEstado);
            let tipo = nuevoEstado === 'completada' ? 'exito' : 'info';
            sendNotification(`Tarea movida a: ${estadoTexto}`, tipo);
        } else { 
            alert("Error al mover. Recargando..."); window.location.reload(); 
        }
    } catch (error) { window.location.reload(); }
};

// --- MODAL DE DETALLES, EDICIÓN Y ELIMINACIÓN ---
window.openViewTaskModal = function(card) {
    const modal = document.getElementById('viewTaskModal');
    const btnDelete = document.getElementById('btn-delete-modal');
    const btnEdit = document.getElementById('btn-edit-modal');
    
    // Rellenar datos desde los atributos data-*
    document.getElementById('view-title').innerText = card.dataset.title;
    document.getElementById('view-desc').innerText = card.dataset.desc || 'Sin descripción';
    document.getElementById('view-date').innerText = card.dataset.date || 'Sin fecha';
    document.getElementById('view-status').innerText = card.dataset.status;

    const taskId = card.dataset.id;

    // Configurar botón eliminar
    btnDelete.onclick = function(e) { deleteTask(e, taskId); };

    // Configurar botón editar
    btnEdit.onclick = function() { openEditTaskModal(card); };

    modal.classList.add('show');
}

window.closeViewModal = function() {
    document.getElementById('viewTaskModal').classList.remove('show');
}

// --- LÓGICA DE EDICIÓN ---
window.openEditTaskModal = function(card) {
    // Cerrar modal de vista
    closeViewModal();

    const taskId = card.dataset.id;
    const titulo = card.dataset.title;
    const desc = card.dataset.desc;
    const estadoKey = card.dataset.statusKey || 'pendiente';
    const dateIso = card.dataset.dateIso; // Formato yyyy-MM-dd o timestamp

    // Rellenar formulario de creación (reutilizado)
    document.getElementById('modal-title').innerText = "✏️ Editar Tarea";
    document.getElementById('btn-save-task').innerText = "Guardar Cambios";
    
    document.getElementById('t-id').value = taskId; // ID presente = Modo Edición
    document.getElementById('t-titulo').value = titulo;
    document.getElementById('t-desc').value = desc || '';
    document.getElementById('t-estado').value = estadoKey;
    
    // Formatear fecha para input date (yyyy-MM-dd)
    if (dateIso) {
        let dateVal = dateIso;
        // Si es timestamp numérico o string largo ISO
        if (!isNaN(dateIso)) {
            dateVal = new Date(parseInt(dateIso)).toISOString().split('T')[0];
        } else if (dateIso.length > 10) {
            dateVal = dateIso.substring(0, 10);
        }
        document.getElementById('t-fecha').value = dateVal;
    } else {
        document.getElementById('t-fecha').value = '';
    }

    // Abrir modal
    const modal = document.getElementById('createTaskModal');
    modal.classList.add('show');
}

// --- Modal Crear/Editar ---
const modalCreate = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');

window.openTaskModal = function(estadoDefault) {
    if (modalCreate) {
        // Resetear formulario para modo CREACIÓN
        form.reset();
        document.getElementById('t-id').value = ''; // Sin ID = Crear
        document.getElementById('modal-title').innerText = "✨ Nueva Tarea";
        document.getElementById('btn-save-task').innerText = "Guardar";
        
        document.getElementById('t-estado').value = estadoDefault;
        modalCreate.classList.add('show');
        setTimeout(() => document.getElementById('t-titulo').focus(), 100);
    }
}

window.closeTaskModal = function() {
    if (modalCreate) { 
        modalCreate.classList.remove('show'); 
        form.reset(); 
        document.getElementById('t-id').value = ''; 
    }
}

window.onclick = function(event) { 
    if (event.target == modalCreate) closeTaskModal();
    if (event.target == document.getElementById('viewTaskModal')) closeViewModal();
}

function capitalizeEstado(estado) {
    if (estado === 'en_progreso') return 'En Curso';
    if (estado === 'completada') return 'Completada';
    if (estado === 'pendiente') return 'Pendiente';
    return estado;
}

// --- AGREGAR O ACTUALIZAR DOM ---
function updateOrAddTaskToDOM(tarea) {
    let card = document.getElementById(`task-${tarea.id}`);
    const isNew = !card;

    if (isNew) {
        card = document.createElement('div');
        card.className = 'task-card';
        card.id = `task-${tarea.id}`;
        card.draggable = true;
        card.ondragstart = drag;
        card.onclick = function() { openViewTaskModal(this); };
        // Si es nueva, la añadimos a la columna correspondiente
        const col = document.getElementById(`col-${tarea.estado}`);
        if(col) col.appendChild(card);
    } else {
        // Si existe, verificamos si cambió de columna
        const currentStatusKey = card.getAttribute('data-status-key');
        if (currentStatusKey !== tarea.estado) {
            const newCol = document.getElementById(`col-${tarea.estado}`);
            if(newCol) newCol.appendChild(card);
            checkEmptyState(currentStatusKey); // Verificar antigua columna
        }
    }

    // Formatear fecha
    let fechaTexto = '';
    let fechaIso = '';
    if (tarea.fecha_limite) {
        const fecha = new Date(tarea.fecha_limite);
        fechaIso = fecha.toISOString().split('T')[0];
        fechaTexto = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
    }

    // Actualizar atributos
    card.setAttribute('data-id', tarea.id);
    card.setAttribute('data-title', tarea.titulo);
    card.setAttribute('data-desc', tarea.descripcion || '');
    card.setAttribute('data-date', fechaTexto);
    card.setAttribute('data-date-iso', fechaIso);
    card.setAttribute('data-status', capitalizeEstado(tarea.estado));
    card.setAttribute('data-status-key', tarea.estado);

    if (tarea.estado === 'completada') card.classList.add('completed');
    else card.classList.remove('completed');

    // Actualizar contenido visual
    card.innerHTML = `
        <h4>${tarea.titulo}</h4>
        <p>${tarea.descripcion || ''}</p>
        ${fechaTexto ? `<small>📅 ${fechaTexto}</small>` : ''}
    `;

    checkEmptyState(tarea.estado);
}

// --- SUBMIT FORMULARIO (CREAR O EDITAR) ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('t-id').value;
        const titulo = document.getElementById('t-titulo').value;
        const desc = document.getElementById('t-desc').value;
        const estado = document.getElementById('t-estado').value;
        const fecha = document.getElementById('t-fecha').value;
        const isEdit = !!id;

        const taskData = { 
            titulo: titulo, 
            descripcion: desc, 
            estado: estado, 
            fecha_limite: fecha || null, 
            proyecto_id: parseInt(window.projectId) 
        };

        const url = isEdit ? `/tareas/${id}` : '/tareas';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const res = await authFetch(url, { 
                method: method, 
                body: JSON.stringify(taskData) 
            });
            
            if (res && res.ok) {
                const tareaRes = await res.json();
                
                updateOrAddTaskToDOM(tareaRes);
                
                const msg = isEdit ? `Tarea actualizada: ${titulo}` : `Nueva tarea creada: ${titulo}`;
                await sendNotification(msg, 'info');
                
                closeTaskModal();
            } else { 
                alert('Error al guardar tarea'); 
            }
        } catch (error) { 
            console.error(error);
            alert('Error de conexión.'); 
        }
    });
}

// Función eliminar tarea
window.deleteTask = async function(event, taskId) {
    if(event) event.stopPropagation(); 
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
        const res = await authFetch(`/tareas/${taskId}`, { method: 'DELETE' });
        if (res.ok) {
            const card = document.getElementById(`task-${taskId}`);
            const colId = card.closest('.column-content').id.replace('col-', '');
            
            card.remove();
            checkEmptyState(colId);
            
            closeViewModal();
            sendNotification(`Tarea eliminada`, 'alerta');
        }
    } catch (error) { console.error(error); }
}