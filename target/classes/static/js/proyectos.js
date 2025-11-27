// src/main/resources/static/js/proyectos.js

const modal = document.getElementById('createProjectModal');
const form = document.getElementById('createProjectForm');

// Función auxiliar para guardar el Toast pendiente y recargar
function reloadWithToast(mensaje, tipo) {
    sessionStorage.setItem('TOAST_MSG', mensaje);
    sessionStorage.setItem('TOAST_TYPE', tipo);
    window.location.reload();
}

// --- CREAR PROYECTO ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('p-nombre').value;
        const descripcion = document.getElementById('p-desc').value;
        const fechaInicio = document.getElementById('p-inicio').value;
        const fechaFin = document.getElementById('p-fin').value;

        const newProject = {
            nombre: nombre,
            descripcion: descripcion,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado: 'Activo'
        };

        try {
            const response = await window.authFetch('/proyectos', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });

            if (response.ok) {
                // 1. Enviar al backend (silencioso)
                await window.authFetch('/notificaciones', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        mensaje: `Has creado el proyecto: ${nombre}`, 
                        tipo: 'exito', 
                        usuario_id: window.CURRENT_USER_ID 
                    })
                });

                // 2. Recargar guardando el mensaje para el popup
                reloadWithToast(`Proyecto "${nombre}" creado con éxito`, 'exito');
            } else {
                alert('Error al crear proyecto');
            }
        } catch (error) { console.error(error); }
    });
}

// --- ELIMINAR PROYECTO ---
window.deleteProject = async function(event, projectId) {
    event.stopPropagation();
    if(!confirm('¿Eliminar proyecto?')) return;

    try {
        const res = await window.authFetch('/proyectos/' + projectId, { method: 'DELETE' });
        if(res.ok) {
            // 1. Notificar al backend
            await window.authFetch('/notificaciones', {
                method: 'POST',
                body: JSON.stringify({ 
                    mensaje: `Proyecto eliminado`, 
                    tipo: 'alerta', 
                    usuario_id: window.CURRENT_USER_ID 
                })
            });

            // 2. Recargar con popup
            reloadWithToast('Proyecto eliminado correctamente', 'alerta');
        }
    } catch(e) { console.error(e); }
}

// --- Funciones del Modal ---
window.openProjectModal = function() {
    if(modal) {
        modal.classList.add('show');
        document.getElementById('p-inicio').value = new Date().toISOString().split('T')[0];
    }
}
window.closeProjectModal = function() {
    if(modal) modal.classList.remove('show');
}
window.onclick = function(event) {
    if (event.target == modal) closeProjectModal();
}