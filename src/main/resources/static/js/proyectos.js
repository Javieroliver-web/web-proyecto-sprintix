// proyectos.js - Gestión de proyectos

const modal = document.getElementById('createProjectModal');
const form = document.getElementById('createProjectForm');
const btnCrear = document.getElementById('btnCrearProyecto');

// Abrir modal
window.openProjectModal = function() {
    if(modal) {
        modal.classList.add('show');
        
        const nombreInput = document.getElementById('p-nombre');
        if(nombreInput) nombreInput.focus();
        
        const inicioInput = document.getElementById('p-inicio');
        if(inicioInput && !inicioInput.value) {
            const hoy = new Date().toISOString().split('T')[0];
            inicioInput.value = hoy;
        }
    }
}

// Cerrar modal
window.closeProjectModal = function() {
    if(modal) {
        modal.classList.remove('show');
        if(form) form.reset();
    }
}

// Cerrar al hacer clic fuera del modal
window.onclick = function(event) {
    if (event.target == modal) {
        closeProjectModal();
    }
}

// Validar fechas
function validarFechas() {
    const fechaInicio = document.getElementById('p-inicio').value;
    const fechaFin = document.getElementById('p-fin').value;
    
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
        alert('⚠️ La fecha de fin no puede ser anterior a la fecha de inicio');
        return false;
    }
    return true;
}

// Deshabilitar botón mientras se procesa
function setLoading(loading) {
    if (btnCrear) {
        btnCrear.disabled = loading;
        btnCrear.textContent = loading ? 'Creando...' : 'Crear Proyecto';
    }
}

// Manejar envío del formulario
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validarFechas()) return;
        
        const nombre = document.getElementById('p-nombre').value.trim();
        const descripcion = document.getElementById('p-desc').value.trim();
        const fechaInicio = document.getElementById('p-inicio').value;
        const fechaFin = document.getElementById('p-fin').value;
        
        if (!nombre) {
            alert('⚠️ El nombre del proyecto es obligatorio');
            return;
        }
        
        if (!fechaInicio) {
            alert('⚠️ La fecha de inicio es obligatoria');
            return;
        }
        
        const newProject = {
            nombre: nombre,
            descripcion: descripcion || '',
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin || null,
            estado: 'Activo'
        };
        
        console.log('📤 Enviando proyecto:', newProject);
        setLoading(true);
        
        try {
            if (typeof authFetch === 'undefined') {
                throw new Error('La función authFetch no está definida');
            }
            
            const response = await authFetch('/proyectos', {
                method: 'POST',
                body: JSON.stringify(newProject)
            });
            
            console.log('📥 Respuesta recibida:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Proyecto creado:', data);
                
                closeProjectModal();
                alert('✅ Proyecto creado exitosamente');
                window.location.reload();
            } else {
                let errorMessage = 'No se pudo crear el proyecto';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('❌ Error del servidor:', errorData);
                } catch (e) {
                    console.error('❌ Error sin detalles:', response.statusText);
                }
                
                alert('❌ Error: ' + errorMessage);
            }
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            alert('❌ Error de conexión: ' + error.message);
        } finally {
            setLoading(false);
        }
    });
}

console.log('✅ proyectos.js cargado');
console.log('🔑 Token disponible:', typeof JWT_TOKEN !== 'undefined' && JWT_TOKEN ? 'Sí' : 'No');
console.log('🌐 API URL:', typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'No definida');