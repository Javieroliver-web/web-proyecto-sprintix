// board.js - Gestión del tablero Kanban y tareas

const modal = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');
const btnCrear = document.getElementById('btnCrearTarea');

// --- Drag & Drop ---
function drag(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.dataset.id);
    ev.dataTransfer.effectAllowed = "move";
    ev.target.style.opacity = "0.5";
}

window.allowDrop = (e) => e.preventDefault();

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if(!card) return;
    
    card.style.opacity = "1";

    const targetCol = document.getElementById(`col-${nuevoEstado}`);
    targetCol.appendChild(card);

    console.log(`🔄 Moviendo tarea ${taskId} a ${nuevoEstado}`);

    try {
        const res = await authFetch(`/tareas/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!res.ok) {
            console.error('❌ Error al actualizar tarea');
            alert("❌ Error al mover la tarea. Recargando...");
            window.location.reload();
        } else {
            console.log('✅ Tarea actualizada correctamente');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        alert("❌ Error de conexión. Recargando...");
        window.location.reload();
    }
};

// --- Modales ---
window.openTaskModal = function(estadoDefault) {
    document.getElementById('t-estado').value = estadoDefault;
    
    const modalTitle = document.querySelector('#createTaskModal .modal-header h3');
    const estadoTexto = {
        'pendiente': 'Por hacer',
        'en_progreso': 'En curso',
        'completada': 'Listo'
    };
    modalTitle.textContent = `✨ Nueva Tarea - ${estadoTexto[estadoDefault] || 'Nueva'}`;
    
    modal.classList.add('show');
    
    const tituloInput = document.getElementById('t-titulo');
    if(tituloInput) tituloInput.focus();
}

window.closeTaskModal = function() {
    modal.classList.remove('show');
    form.reset();
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeTaskModal();
    }
}

function setLoading(loading) {
    if (btnCrear) {
        btnCrear.disabled = loading;
        btnCrear.textContent = loading ? 'Creando...' : 'Añadir Tarea';
    }
}

// Manejar envío del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const titulo = document.getElementById('t-titulo').value.trim();
    const descripcion = document.getElementById('t-desc').value.trim();
    const estado = document.getElementById('t-estado').value;
    const fechaLimite = document.getElementById('t-fecha').value;
    
    if (!titulo) {
        alert('⚠️ El título de la tarea es obligatorio');
        return;
    }
    
    if (!projectId || projectId === 0) {
        alert('⚠️ Error: No se ha identificado el proyecto');
        console.error('ProjectId no válido:', projectId);
        return;
    }
    
    const newTask = {
        titulo: titulo,
        descripcion: descripcion || '',
        estado: estado,
        proyecto_id: projectId
    };
    
    if (fechaLimite) {
        newTask.fecha_limite = fechaLimite;
    }
    
    console.log('📤 Enviando tarea:', newTask);
    console.log('🔑 Token:', JWT_TOKEN ? 'Presente' : 'Ausente');
    console.log('🆔 Proyecto ID:', projectId);
    
    setLoading(true);

    try {
        const res = await authFetch('/tareas', {
            method: 'POST',
            body: JSON.stringify(newTask)
        });

        console.log('📥 Respuesta status:', res.status);

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Tarea creada exitosamente:', data);
            
            closeTaskModal();
            addTaskToBoard(data, estado);
            showNotification('✅ Tarea creada exitosamente', 'success');
        } else {
            let errorMessage = 'No se pudo crear la tarea';
            let errorDetails = '';
            
            try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
                errorDetails = JSON.stringify(errorData, null, 2);
                console.error('❌ Error del servidor:', errorData);
            } catch (e) {
                errorDetails = res.statusText;
                console.error('❌ Error HTTP', res.status, ':', res.statusText);
            }
            
            alert('❌ Error al crear tarea:\n' + errorMessage + '\n\nStatus: ' + res.status);
            console.error('Detalles completos:', errorDetails);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        alert('❌ Error de conexión al servidor:\n' + error.message + '\n\nVerifica que la API esté corriendo.');
    } finally {
        setLoading(false);
    }
});

function addTaskToBoard(tarea, estado) {
    const columna = document.getElementById(`col-${estado}`);
    if (!columna) {
        console.warn('Columna no encontrada, recargando página...');
        window.location.reload();
        return;
    }
    
    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.draggable = true;
    taskCard.id = `task-${tarea.id}`;
    taskCard.dataset.id = tarea.id;
    taskCard.ondragstart = drag;
    
    let html = `<h4>${tarea.titulo}</h4>`;
    if (tarea.descripcion) {
        html += `<p>${tarea.descripcion}</p>`;
    }
    if (tarea.fecha_limite) {
        const fecha = new Date(tarea.fecha_limite);
        const fechaStr = fecha.toLocaleDateString('es-ES');
        html += `<small>📅 ${fechaStr}</small>`;
    }
    
    taskCard.innerHTML = html;
    columna.appendChild(taskCard);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-card')) {
        e.target.style.opacity = "1";
    }
});

console.log('✅ board.js cargado');
console.log('📂 Proyecto ID:', projectId);
console.log('🔑 Token disponible:', typeof JWT_TOKEN !== 'undefined' && JWT_TOKEN ? 'Sí' : 'No');