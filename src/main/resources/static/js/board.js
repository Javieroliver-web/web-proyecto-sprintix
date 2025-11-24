const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if(!projectId) return window.location.href = '/proyectos.html';
    loadBoard();
});

async function loadBoard() {
    // 1. Info Proyecto
    const resP = await authFetch(`/proyectos/${projectId}`);
    if (resP.ok) {
        const proj = await resP.json();
        document.getElementById('boardTitle').innerText = proj.nombre;
    }

    // 2. Tareas
    const resT = await authFetch(`/tareas?proyecto_id=${projectId}`); // Ajusta según tu API real
    if (resT.ok) {
        renderTasks(await resT.json());
    }
}

function renderTasks(tareas) {
    ['pendiente', 'en_progreso', 'completada'].forEach(estado => {
        document.getElementById(`col-${estado}`).innerHTML = '';
    });

    tareas.forEach(t => {
        // Normalizar estado
        let estadoKey = t.estado.toLowerCase();
        if(estadoKey === 'por hacer') estadoKey = 'pendiente';
        if(estadoKey === 'en curso') estadoKey = 'en_progreso';
        if(estadoKey === 'listo') estadoKey = 'completada';

        const col = document.getElementById(`col-${estadoKey}`);
        if (col) {
            const card = document.createElement('div');
            card.className = `task-card ${estadoKey === 'completada' ? 'completed' : ''}`;
            card.draggable = true;
            card.id = `task-${t.id}`;
            card.innerHTML = `<h4>${t.titulo}</h4><p>${t.descripcion || ''}</p>`;
            
            // Eventos Drag Native
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', t.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            col.appendChild(card);
        }
    });
}

// Drag & Drop Global Handlers
window.allowDrop = (e) => e.preventDefault();

window.dropTask = async (e, nuevoEstado) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(`task-${taskId}`);
    
    // UI Optimista
    document.getElementById(`col-${nuevoEstado}`).appendChild(card);

    // Backend Update
    await authFetch(`/tareas/${taskId}`, {
        method: 'PUT', // O PATCH
        body: JSON.stringify({ estado: nuevoEstado })
    });
};

function openCreateModal(estado) {
    const titulo = prompt("Título de la tarea:");
    if (titulo) {
        authFetch('/tareas', {
            method: 'POST',
            body: JSON.stringify({
                titulo, 
                estado, 
                proyecto_id: projectId
            })
        }).then(() => loadBoard());
    }
}