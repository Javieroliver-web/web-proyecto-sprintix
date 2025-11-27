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

    // Actualizar el atributo data-status
    card.setAttribute('data-status', capitalizeEstado(nuevoEstado));

    checkEmptyState(origen);
    checkEmptyState(nuevoEstado);

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

// --- MODAL DE DETALLES Y ELIMINACIÓN ---
window.openViewTaskModal = function(card) {
    const modal = document.getElementById('viewTaskModal');
    const btnDelete = document.getElementById('btn-delete-modal');
    
    // Rellenar datos desde los atributos data-*
    document.getElementById('view-title').innerText = card.dataset.title;
    document.getElementById('view-desc').innerText = card.dataset.desc || 'Sin descripción';
    document.getElementById('view-date').innerText = card.dataset.date || 'Sin fecha';
    document.getElementById('view-status').innerText = card.dataset.status;

    // Configurar botón eliminar
    const taskId = card.dataset.id;
    btnDelete.onclick = function(e) {
        deleteTask(e, taskId);
    };

    modal.classList.add('show');
}

window.closeViewModal = function() {
    document.getElementById('viewTaskModal').classList.remove('show');
}

// --- Modal Crear ---
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

window.onclick = function(event) { 
    if (event.target == modal) closeTaskModal();
    if (event.target == document.getElementById('viewTaskModal')) closeViewModal();
}

// ✅ NUEVO: Helper para capitalizar estado
function capitalizeEstado(estado) {
    if (estado === 'en_progreso') return 'En Curso';
    if (estado === 'completada') return 'Completada';
    if (estado === 'pendiente') return 'Pendiente';
    return estado;
}

// ✅ NUEVO: Función para agregar tarea al DOM dinámicamente
function agregarTareaAlDOM(tarea) {
    console.log('📝 Agregando tarea al DOM:', tarea);
    
    const columna = document.getElementById(`col-${tarea.estado}`);
    if (!columna) {
        console.error('❌ Columna no encontrada:', tarea.estado);
        return;
    }
    
    // Formatear fecha si existe
    let fechaTexto = '';
    if (tarea.fecha_limite) {
        const fecha = new Date(tarea.fecha_limite);
        fechaTexto = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
    }
    
    // Crear elemento HTML
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = `task-${tarea.id}`;
    card.draggable = true;
    card.setAttribute('data-id', tarea.id);
    card.setAttribute('data-title', tarea.titulo);
    card.setAttribute('data-desc', tarea.descripcion || '');
    card.setAttribute('data-date', fechaTexto);
    card.setAttribute('data-status', capitalizeEstado(tarea.estado));
    card.ondragstart = drag;
    card.onclick = function() { openViewTaskModal(this); };
    
    card.innerHTML = `
        <h4>${tarea.titulo}</h4>
        <p>${tarea.descripcion || ''}</p>
        ${fechaTexto ? `<small>📅 ${fechaTexto}</small>` : ''}
    `;
    
    columna.appendChild(card);
    checkEmptyState(tarea.estado);
    
    console.log('✅ Tarea agregada correctamente al DOM');
}

// ✅ ACTUALIZADO: Form submit con actualización dinámica del DOM (SIN RECARGAR)
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('🚀 [FRONTEND] Iniciando creación de tarea...');
        
        const titulo = document.getElementById('t-titulo').value;
        const desc = document.getElementById('t-desc').value;
        const estado = document.getElementById('t-estado').value;
        const fecha = document.getElementById('t-fecha').value;

        const newTask = { 
            titulo: titulo, 
            descripcion: desc, 
            estado: estado, 
            fecha_limite: fecha || null, 
            proyecto_id: parseInt(projectId) 
        };

        console.log('📤 [FRONTEND] Datos a enviar:', newTask);

        try {
            const res = await authFetch('/tareas', { 
                method: 'POST', 
                body: JSON.stringify(newTask) 
            });
            
            if (res && res.ok) {
                // ✅ OBTENER LA TAREA CREADA CON SU ID
                const tareaCreada = await res.json();
                console.log('✅ [FRONTEND] Tarea creada en backend:', tareaCreada);
                
                // ✅ AGREGAR AL DOM SIN RECARGAR PÁGINA
                agregarTareaAlDOM(tareaCreada);
                
                // Enviar notificación
                await sendNotification(`Nueva tarea creada: ${titulo}`, 'info');
                
                // Cerrar modal y limpiar formulario
                closeTaskModal();
                form.reset();
                
                console.log('🎉 [FRONTEND] Proceso completado exitosamente');
            } else { 
                console.error('❌ [FRONTEND] Error en respuesta del servidor');
                alert('Error al crear tarea'); 
            }
        } catch (error) { 
            console.error('❌ [FRONTEND] Error de conexión:', error);
            alert('Error de conexión.'); 
        }
    });
}

// Función eliminar tarea
window.deleteTask = async function(event, taskId) {
    event.stopPropagation(); 
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