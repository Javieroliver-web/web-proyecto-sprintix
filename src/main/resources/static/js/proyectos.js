document.addEventListener('DOMContentLoaded', loadProjects);

async function loadProjects() {
    const container = document.getElementById('projectsGrid');
    const res = await authFetch('/proyectos');
    
    if (res && res.ok) {
        const proyectos = await res.json();
        container.innerHTML = '';
        
        if (proyectos.length === 0) {
            container.innerHTML = '<div class="empty-state">No hay proyectos.</div>';
            return;
        }

        proyectos.forEach(p => {
            const html = `
            <div class="project-card" onclick="window.location.href='/board.html?id=${p.id}'">
                <div class="card-content">
                    <span class="card-icon">${p.icono || '📦'}</span>
                    <h3>${p.nombre}</h3>
                    <p class="project-description">${p.descripcion || ''}</p>
                    <span class="project-status status-${p.estado.toLowerCase()}">${p.estado}</span>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    } else {
        container.innerHTML = '<p class="error-message">Error cargando proyectos</p>';
    }
}