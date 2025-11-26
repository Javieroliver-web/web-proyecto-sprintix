// src/main/resources/static/js/proyectos.js

const modal = document.getElementById('createProjectModal');
const form = document.getElementById('createProjectForm');
const btnCrear = document.getElementById('btnCrearProyecto');

// --- 1. FUNCIÓN PARA ENVIAR NOTIFICACIONES ---
async function sendNotification(mensaje, tipo = 'info') {
    const userId = window.CURRENT_USER_ID;
    if (!userId) return;
    try {
        await window.authFetch('/notificaciones', {
            method: 'POST',
            body: JSON.stringify({ 
                mensaje: mensaje, 
                tipo: tipo, 
                usuario_id: userId 
            })
        });
    } catch (e) { 
        console.error("Error enviando notificación:", e); 
    }
}

// --- 2. LÓGICA DEL MODAL ---
window.openProjectModal = function() {
    if(modal) {
        modal.classList.add('show');
        const nombreInput = document.getElementById('p-nombre');
        if(nombreInput) nombreInput.focus();
        
        // Poner fecha de hoy por defecto
        const inicioInput = document.getElementById('p-inicio');
        if(inicioInput && !inicioInput.value) {
            inicioInput.value = new Date().toISOString().split('T')[0];
        }
    }
}

window.closeProjectModal = function() {
    if(modal) {
        modal.classList.remove('show');
        if(form) form.reset();
    }
}

window.onclick = function(event) {
    if (event.target == modal) closeProjectModal();
}

// --- 3. CREAR PROYECTO (Con notificación) ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('p-nombre').value.trim();
        const descripcion = document.getElementById('p-desc').value.trim();
        const fechaInicio = document.getElementById('p-inicio').value;
        const fechaFin = document.getElementById('p-fin').value;
        
        if (!nombre || !fechaInicio) {
            alert('⚠️ El nombre y la fecha de inicio son obligatorios');
            return;
        }

        const newProject = {
            nombre: nombre,
            descripcion: descripcion || '',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin || null,
            estado: 'Activo'
        };
        
        try {
            const response = await window.authFetch('/proyectos', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });
            
            if (response.ok) {
                // ENVIAR NOTIFICACIÓN ANTES DE RECARGAR
                await sendNotification(`Nuevo proyecto creado: ${nombre}`, 'exito');
                
                closeProjectModal();
                window.location.reload();
            } else {
                alert('❌ Error al crear el proyecto');
            }
        } catch (error) {
            console.error(error);
            alert('❌ Error de conexión');
        }
    });
}

// --- 4. ELIMINAR PROYECTO (Con notificación) ---
window.deleteProject = async function(event, projectId) {
    event.stopPropagation(); // Evita entrar al tablero al hacer clic en borrar
    
    if(!confirm('¿Estás seguro de eliminar este proyecto? Se borrarán todas sus tareas.')) return;
    
    try {
        const res = await window.authFetch('/proyectos/' + projectId, { method: 'DELETE' });
        
        if(res.ok) {
            // ENVIAR NOTIFICACIÓN
            await sendNotification(`Proyecto eliminado`, 'alerta');
            window.location.reload();
        } else {
            alert("❌ No se pudo eliminar el proyecto.");
        }
    } catch(e) { 
        console.error(e); 
        alert("❌ Error de conexión al eliminar.");
    }
}