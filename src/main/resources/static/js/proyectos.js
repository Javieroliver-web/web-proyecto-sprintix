document.addEventListener('DOMContentLoaded', loadProjects);

// --- Cargar Proyectos ---
async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    const res = await authFetch('/proyectos');
    
    if (res && res.ok) {
        const proyectos = await res.json();
        container.innerHTML = '';
        
        if (proyectos.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay proyectos. ¡Crea el primero!</div>';
            return;
        }

        proyectos.forEach(p => {
            const html = `
            <div class="project-card" onclick="window.location.href='/board.html?id=${p.id}'">
                <div class="card-icon">${p.icono || '📦'}</div>
                <h3>${p.nombre}</h3>
                <p style="color: #666; font-size: 0.9rem; margin: 10px 0;">${p.descripcion || 'Sin descripción'}</p>
                <span class="project-status status-${(p.estado || 'activo').toLowerCase()}">${p.estado || 'Activo'}</span>
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

function openProjectModal() {
    modal.classList.add('show');
    document.getElementById('p-nombre').focus();
}

function closeProjectModal() {
    modal.classList.remove('show');
    form.reset();
}

// Cerrar si se hace clic fuera del modal
window.onclick = function(event) {
    if (event.target == modal) {
        closeProjectModal();
    }
}

// --- Crear Proyecto (API) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('p-nombre').value;
    const descripcion = document.getElementById('p-desc').value;
    
    // Asumimos que el backend asigna el ID y usuario automáticamente o tomamos el ID del usuario logueado
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const newProject = {
        nombre: nombre,
        descripcion: descripcion,
        estado: 'Activo',
        usuario_id: user.id || 1 // Fallback si no hay usuario
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
            alert('Error al crear el proyecto');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
});