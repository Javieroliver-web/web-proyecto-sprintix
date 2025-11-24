// src/main/resources/static/js/proyectos.js

/* NOTA: Ya no cargamos proyectos al inicio (DOMContentLoaded) 
   porque el servidor (Thymeleaf) nos entrega la página con la lista ya pintada.
*/

// --- Gestión del Modal ---
const modal = document.getElementById('createProjectModal');
const form = document.getElementById('createProjectForm');

// Hacemos las funciones globales para que el HTML (onclick) pueda verlas
window.openProjectModal = function() {
    if(modal) {
        modal.classList.add('show');
        const nombreInput = document.getElementById('p-nombre');
        if(nombreInput) nombreInput.focus();
        
        // Setear fecha de hoy por defecto si está vacía
        const inicioInput = document.getElementById('p-inicio');
        if(inicioInput && !inicioInput.value) {
            inicioInput.valueAsDate = new Date();
        }
    }
}

window.closeProjectModal = function() {
    if(modal) {
        modal.classList.remove('show');
        if(form) form.reset();
    }
}

// Cerrar si se hace clic fuera del contenido del modal
window.onclick = function(event) {
    if (event.target == modal) {
        closeProjectModal();
    }
}

// --- Lógica para Crear Proyecto (Llamada a la API) ---
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('p-nombre').value;
        const descripcion = document.getElementById('p-desc').value;
        const inicio = document.getElementById('p-inicio').value;
        const fin = document.getElementById('p-fin').value;
        
        const newProject = {
            nombre: nombre,
            descripcion: descripcion,
            fecha_inicio: inicio || new Date(), 
            fecha_fin: fin || null,
            estado: 'Activo'
        };

        try {
            // Usamos la función authFetch (definida en el template Thymeleaf con el token de sesión)
            const res = await authFetch('/proyectos', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });

            if (res && res.ok) {
                closeProjectModal();
                // IMPORTANTE: Recargamos la página para que el servidor nos devuelva la lista actualizada
                window.location.reload(); 
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert('Error: ' + (errorData.message || 'No se pudo crear el proyecto'));
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión al intentar crear el proyecto.');
        }
    });
}