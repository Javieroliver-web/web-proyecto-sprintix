// src/app/pages/dashboard/dashboard.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { ProjectService, Proyecto } from '../../services/project.service';
import { TareaService, Tarea } from '../../services/tarea.service';
import { NotificacionService, Notificacion } from '../../services/notificacion.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  proyecto: Proyecto | null = null;
  tareas: Tarea[] = [];
  notificaciones: Notificacion[] = [];
  isLoading = true;

  // Estadísticas
  stats = {
    finalizadas: 0,
    creadas: 0,
    vencenProximas: 0
  };

  // Datos del gráfico de dona
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Por hacer', 'En curso', 'Listo'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#5b8f97', '#a8d5dc', '#d1eaee'],
      borderWidth: 0
    }]
  };

  donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proyectoService: ProjectService,
    private tareaService: TareaService,
    private notificacionService: NotificacionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const proyectoId = this.route.snapshot.paramMap.get('id');
    if (proyectoId) {
      this.cargarDatos(+proyectoId);
    }
  }

  cargarDatos(proyectoId: number): void {
    this.isLoading = true;

    // Cargar proyecto
    this.proyectoService.getProyecto(proyectoId).subscribe({
      next: (proyecto: Proyecto) => {
        this.proyecto = proyecto;
      },
      error: (error: unknown) => {
        console.error('Error al cargar proyecto:', error);
      }
    });

    // Cargar tareas
    this.tareaService.getTareasPorProyecto(proyectoId).subscribe({
      next: (tareas: Tarea[]) => {
        this.tareas = tareas;
        this.calcularEstadisticas();
        this.actualizarGraficos();
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error('Error al cargar tareas:', error);
        this.isLoading = false;
      }
    });

    // Cargar notificaciones del usuario
    const usuario = this.authService.getCurrentUser();
    if (usuario) {
      this.notificacionService.getNotificaciones(usuario.id).subscribe({
        next: (notificaciones: Notificacion[]) => {
          this.notificaciones = notificaciones.slice(0, 5); // Últimas 5
        },
        error: (error: unknown) => {
          console.error('Error al cargar notificaciones:', error);
        }
      });
    }
  }

  calcularEstadisticas(): void {
    this.stats.creadas = this.tareas.length;
    this.stats.finalizadas = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'completada' || t.estado.toLowerCase() === 'listo'
    ).length;
    
    // Calcular tareas que vencen próximas (próximos 7 días)
    const hoy = new Date();
    const unaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.stats.vencenProximas = this.tareas.filter(t => {
      if (!t.fecha_limite) return false;
      const fechaLimite = new Date(t.fecha_limite);
      return fechaLimite >= hoy && fechaLimite <= unaSemana;
    }).length;
  }

  actualizarGraficos(): void {
    const porHacer = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'pendiente' || t.estado.toLowerCase() === 'por hacer'
    ).length;
    
    const enCurso = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'en_progreso' || t.estado.toLowerCase() === 'en curso'
    ).length;
    
    const listo = this.tareas.filter(t => 
      t.estado.toLowerCase() === 'completada' || t.estado.toLowerCase() === 'listo'
    ).length;

    this.donutChartData.datasets[0].data = [porHacer, enCurso, listo];
  }

  eliminarProyecto(): void {
    if (!this.proyecto || !confirm('¿Estás seguro de eliminar este proyecto?')) {
      return;
    }

    this.proyectoService.eliminarProyecto(this.proyecto.id).subscribe({
      next: () => {
        this.router.navigate(['/recomendados']);
      },
      error: (error: unknown) => {
        console.error('Error al eliminar proyecto:', error);
        alert('Error al eliminar el proyecto');
      }
    });
  }

  verTablero(): void {
    if (this.proyecto) {
      this.router.navigate(['/proyectos', this.proyecto.id, 'board']);
    }
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  }
}