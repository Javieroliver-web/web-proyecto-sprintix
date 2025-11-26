// src/main/resources/static/js/board.js

console.log('✅ board.js cargado');

// --- Notificaciones Automáticas ---
async function sendNotification(mensaje, tipo = 'info') {
    const userId = window.CURRENT_USER_ID;
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    if (!userId || !token) {
        console.warn('⚠️ No se puede enviar notificación: sin usuario o token');
        return;
    }
    
    try {
        console.log(`📤 Enviando notificación: ${mensaje}`);
        
        const response = await fetch(`${apiUrl}/notificaciones`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                mensaje: mensaje, 
                tipo: tipo, 
                usuario_id: userId 
            })
        });
        
        if (response.ok) {
            console.log('✅ Notificación enviada');
            // Recargar notificaciones si la función existe
            if (typeof loadNotifications === 'function') {
                await loadNotifications();
            }
        }
    } catch (e) { 
        console.error('❌ Error enviando notificación:', e); 
    }
}

// --- Drag & Drop ---
function drag(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.dataset.id);
    ev.dataTransfer.effectAllowed = "move";
    ev.target.classList.add('dragging');
    console.log(`🎯 Arrastrando tarea: ${ev.target.dataset.id}`);
}

window.allowDrop = (e) => { 
    e.preventDefault(); 
}

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    if (!card) {
        console.error(`❌ No se encontró la tarea ${taskId}`);
        return;
    }
    
    card.classList.remove('dragging');
    
    console.log(`📦 Moviendo tarea ${taskId} a: ${nuevoEstado}`);
    
    // Mover visualmente primero
    const targetColumn = document.getElementById(`col-${nuevoEstado}`);
    if (targetColumn) {
        targetColumn.appendChild(card);
    }
    
    // Actualizar en el servidor
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    try {
        const response = await fetch(`${apiUrl}/tareas/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (response.ok) {
            console.log(`✅ Tarea ${taskId} actualizada`);
            
            let estadoTexto = nuevoEstado === 'en_progreso' ? 'En Curso' : 
                              nuevoEstado === 'completada' ? 'Completada' : 'Pendiente';
            let tipo = nuevoEstado === 'completada' ? 'exito' : 'info';
            
            await sendNotification(`Tarea movida a: ${estadoTexto}`, tipo);
        } else { 
            console.error(`❌ Error al mover tarea: ${response.status}`);
            alert("Error al mover la tarea. Recargando...");
            window.location.reload(); 
        }
    } catch (error) { 
        console.error('❌ Error de conexión:', error);
        alert("Error de conexión. Recargando...");
        window.location.reload(); 
    }
};

// --- Modales ---
const modal = document.getElementById('createTaskModal');
const form = document.getElementById('createTaskForm');

window.openTaskModal = function(estadoDefault) {
    if (modal) {
        console.log(`📝 Abriendo modal para estado: ${estadoDefault}`);
        document.getElementById('t-estado').value = estadoDefault;
        modal.classList.add('show');
        setTimeout(() => {
            const tituloInput = document.getElementById('t-titulo');
            if (tituloInput) tituloInput.focus();
        }, 100);
    } else {
        console.error('❌ No se encontró el modal createTaskModal');
    }
}

window.closeTaskModal = function() {
    if (modal) { 
        modal.classList.remove('show'); 
        if (form) form.reset(); 
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) { 
    if (event.target == modal) {
        closeTaskModal();
    }
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('t-titulo').value;
        const desc = document.getElementById('t-desc').value;
        const estado = document.getElementById('t-estado').value;
        const fecha = document.getElementById('t-fecha').value;

        if (!titulo.trim()) {
            alert('⚠️ El título es obligatorio');
            return;
        }

        const newTask = { 
            titulo: titulo.trim(), 
            descripcion: desc.trim(), 
            estado: estado, 
            fecha_limite: fecha || null, 
            proyecto_id: parseInt(projectId) 
        };

        console.log('📤 Creando nueva tarea:', newTask);
        
        const token = window.JWT_TOKEN;
        const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';

        try {
            const response = await fetch(`${apiUrl}/tareas`, { 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTask)
            });
            
            if (response.ok) {
                console.log('✅ Tarea creada exitosamente');
                await sendNotification(`Nueva tarea creada: ${titulo}`, 'info');
                closeTaskModal();
                window.location.reload(); 
            } else { 
                const errorText = await response.text();
                console.error('❌ Error al crear tarea:', errorText);
                alert('Error al crear tarea: ' + errorText);
            }
        } catch (error) { 
            console.error('❌ Error de conexión:', error);
            alert('Error de conexión.');
        }
    });
} else {
    console.warn('⚠️ Formulario createTaskForm no encontrado');
}

window.deleteTask = async function(event, taskId) {
    event.stopPropagation(); 
    
    if (!confirm('¿Eliminar esta tarea?')) return;
    
    console.log(`🗑️ Eliminando tarea ${taskId}`);
    
    const token = window.JWT_TOKEN;
    const apiUrl = window.API_BASE_URL || 'http://localhost:8080/api';
    
    try {
        const response = await fetch(`${apiUrl}/tareas/${taskId}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ Tarea ${taskId} eliminada`);
            const taskElement = document.getElementById(`task-${taskId}`);
            if (taskElement) {
                taskElement.remove();
            }
            await sendNotification(`Tarea eliminada`, 'alerta');
        } else {
            console.error(`❌ Error al eliminar: ${response.status}`);
            alert('Error al eliminar la tarea');
        }
    } catch (error) { 
        console.error('❌ Error:', error);
        alert('Error de conexión');
    }
}

console.log('🎯 board.js inicializado correctamente');
console.log('   - Project ID:', typeof projectId !== 'undefined' ? projectId : 'No definido');
console.log('   - Token:', typeof JWT_TOKEN !== 'undefined' && JWT_TOKEN ? 'Presente' : 'Ausente');