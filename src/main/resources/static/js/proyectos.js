document.addEventListener('DOMContentLoaded', loadProjects);

// --- Cargar Proyectos ---
async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    const res = await authFetch('/proyectos');
    
    if (res && res.ok) {
        const proyectos = await res.json();
        container.innerHTML = '';
        
        if (proyectos.length === 0) {
            container.innerHTML = '<div class="empty-state" style="text-align:center; width:100%; color:#666;">No hay proyectos. ¡Crea el primero!</div>';
            return;
        }

        proyectos.forEach(p => {
            const html = `
            <div class="project-card" onclick="window.location.href='/board.html?id=${p.id}'">
                <h3>${p.nombre}</h3>
                <p style="color: #e0f7fa; font-size: 0.9rem; margin: 10px 0;">${p.descripcion || 'Sin descripción'}</p>
                <div style="margin-top: auto; font-size: 0.8rem;">
                    Estado: <strong>${p.estado || 'Activo'}</strong>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    } else {
        container.innerHTML = '<p class="error-msg">Error cargando proyectos</p>';
    }
}

// --- Gestión del Modal ---
const modal = document.getElementById('createProjectModal');
const form = document.getElementById('createProjectForm');

window.openProjectModal = function() {
    modal.classList.add('show');
    document.getElementById('p-nombre').focus();
}

window.closeProjectModal = function() {
    modal.classList.remove('show');
    form.reset();
}

window.onclick = function(event) {
    if (event.target == modal) closeProjectModal();
}

// --- Crear Proyecto (API) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('p-nombre').value;
    const descripcion = document.getElementById('p-desc').value;
    
    // Objeto Proyecto tal como lo espera tu Entity Proyecto.java
    // El usuario creador lo saca el backend del Token JWT
    const newProject = {
        nombre: nombre,
        descripcion: descripcion,
        fecha_inicio: new Date(), 
        estado: 'Activo'
    };

    try {
        const res = await authFetch('/proyectos', {
            method: 'POST',
            body: JSON.stringify(newProject)
        });

        if (res && res.ok) {
            closeProjectModal();
            loadProjects(); // Recargar la lista
        } else {
            const errorData = await res.json(); // Intentar leer error del backend
            alert('Error: ' + (errorData.message || 'No se pudo crear el proyecto'));
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
});