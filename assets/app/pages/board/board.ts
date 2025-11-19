// src/app/pages/board/board.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Proyecto } from '../../services/project.service';
import { TareaService, Tarea, TareaCreate } from '../../services/tarea.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css']
})
export class BoardComponent implements OnInit {
  proyecto: Proyecto | null = null;
  tareas: Tarea[] = [];
  isLoading = true;

  // Estado de las columnas
  columnas = {
    pendiente: [] as Tarea[],
    en_progreso: [] as Tarea[],
    completada: [] as Tarea[]
  };

  // Modal para crear tarea
  mostrarModal = false;
  nuevaTarea: TareaCreate = {
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    proyecto_id: 0
  };

  // Modal para detalles de tarea
  mostrarDetalles = false;
  tareaSeleccionada: Tarea | null = null;

  // Drag and Drop
  draggedTask: Tarea | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proyectoService: ProjectService,
    private tareaService: TareaService
  ) {}

  ngOnInit(): void {
    const proyectoId = this.route.snapshot.paramMap.get('id');
    if (proyectoId) {
      this.cargarDatos(+proyectoId);
    }
  }

  cargarDatos(proyectoId: number): void {
    this.isLoading = true;

    this.proyectoService.getProyecto(proyectoId).subscribe({
      next: (proyecto: Proyecto) => {
        this.proyecto = proyecto;
        this.nuevaTarea.proyecto_id = proyecto.id;
      },
      error: (error: unknown) => {
        console.error('Error al cargar proyecto:', error);
      }
    });

    this.tareaService.getTareasPorProyecto(proyectoId).subscribe({
      next: (tareas: Tarea[]) => {
        this.tareas = tareas;
        this.organizarTareas();
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error('Error al cargar tareas:', error);
        this.isLoading = false;
      }
    });
  }

  organizarTareas(): void {
    this.columnas.pendiente = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'pendiente' || t.estado.toLowerCase() === 'por hacer'
    );
    this.columnas.en_progreso = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'en_progreso' || t.estado.toLowerCase() === 'en curso'
    );
    this.columnas.completada = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'completada' || t.estado.toLowerCase() === 'listo'
    );
  }

  // Drag and Drop
  onDragStart(event: DragEvent, tarea: Tarea): void {
    this.draggedTask = tarea;
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, nuevoEstado: string): void {
    event.preventDefault();
    
    if (!this.draggedTask) return;

    const estadoMap: { [key: string]: string } = {
      'pendiente': 'pendiente',
      'en_progreso': 'en_progreso',
      'completada': 'completada'
    };

    const estadoActualizado = estadoMap[nuevoEstado];
    
    this.tareaService.actualizarTarea(this.draggedTask.id, { 
      estado: estadoActualizado 
    }).subscribe({
      next: () => {
        if (this.proyecto) {
          this.cargarDatos(this.proyecto.id);
        }
      },
      error: (error: unknown) => {
        console.error('Error al actualizar tarea:', error);
        alert('Error al mover la tarea');
      }
    });

    this.draggedTask = null;
  }

  // Modal crear tarea
  abrirModalCrear(estado: string): void {
    this.nuevaTarea = {
      titulo: '',
      descripcion: '',
      estado: estado,
      proyecto_id: this.proyecto?.id || 0
    };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.nuevaTarea = {
      titulo: '',
      descripcion: '',
      estado: 'pendiente',
      proyecto_id: this.proyecto?.id || 0
    };
  }

  crearTarea(): void {
    if (!this.nuevaTarea.titulo.trim()) {
      alert('El título es obligatorio');
      return;
    }

    this.tareaService.crearTarea(this.nuevaTarea).subscribe({
      next: () => {
        this.cerrarModal();
        if (this.proyecto) {
          this.cargarDatos(this.proyecto.id);
        }
      },
      error: (error: unknown) => {
        console.error('Error al crear tarea:', error);
        alert('Error al crear la tarea');
      }
    });
  }

  // Modal detalles
  abrirDetalles(tarea: Tarea): void {
    this.tareaSeleccionada = { ...tarea };
    this.mostrarDetalles = true;
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.tareaSeleccionada = null;
  }

  actualizarTarea(): void {
    if (!this.tareaSeleccionada) return;

    this.tareaService.actualizarTarea(
      this.tareaSeleccionada.id, 
      this.tareaSeleccionada
    ).subscribe({
      next: () => {
        this.cerrarDetalles();
        if (this.proyecto) {
          this.cargarDatos(this.proyecto.id);
        }
      },
      error: (error: unknown) => {
        console.error('Error al actualizar tarea:', error);
        alert('Error al actualizar la tarea');
      }
    });
  }

  eliminarTarea(): void {
    if (!this.tareaSeleccionada || !confirm('¿Eliminar esta tarea?')) {
      return;
    }

    this.tareaService.eliminarTarea(this.tareaSeleccionada.id).subscribe({
      next: () => {
        this.cerrarDetalles();
        if (this.proyecto) {
          this.cargarDatos(this.proyecto.id);
        }
      },
      error: (error: unknown) => {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
      }
    });
  }

  volverADashboard(): void {
    if (this.proyecto) {
      this.router.navigate(['/proyectos', this.proyecto.id]);
    }
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Por hacer',
      'en_progreso': 'En curso',
      'completada': 'Listo'
    };
    return labels[estado] || estado;
  }
}