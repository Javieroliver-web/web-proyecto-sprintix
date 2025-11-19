// src/app/pages/project-list/project-list.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProjectService, Proyecto } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.css']
})
export class ProjectListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  proyectosFavoritos: Proyecto[] = [];
  isLoading = true;
  isLoadingFavoritos = true;
  errorMessage = '';

  // IDs de proyectos favoritos para búsqueda rápida
  private favoritosIds: Set<number> = new Set();

  // Mapeo de iconos por ID
  iconMap: { [key: number]: string } = {
    1: '📦',
    2: '🚀',
    3: '📈'
  };

  constructor(
    private proyectoService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarProyectosFavoritos();
  }

  cargarProyectos(): void {
    this.isLoading = true;
    this.proyectoService.getProyectos().subscribe({
      next: (proyectos: Proyecto[]) => {
        this.proyectos = proyectos;
        this.isLoading = false;
        console.log('Proyectos cargados:', proyectos);
      },
      error: (error: any) => {
        console.error('Error al cargar proyectos:', error);
        this.errorMessage = 'Error al cargar los proyectos';
        this.isLoading = false;
      }
    });
  }

  cargarProyectosFavoritos(): void {
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      console.warn('No hay usuario autenticado');
      this.isLoadingFavoritos = false;
      return;
    }

    this.isLoadingFavoritos = true;
    this.proyectoService.getProyectosFavoritos(usuario.id).subscribe({
      next: (proyectos: Proyecto[]) => {
        this.proyectosFavoritos = proyectos;
        // Actualizar el Set de IDs favoritos
        this.favoritosIds = new Set(proyectos.map(p => p.id));
        this.isLoadingFavoritos = false;
        console.log('Proyectos favoritos cargados:', proyectos);
      },
      error: (error: any) => {
        console.error('Error al cargar proyectos favoritos:', error);
        this.proyectosFavoritos = [];
        this.favoritosIds.clear();
        this.isLoadingFavoritos = false;
      }
    });
  }

  toggleFavorito(proyecto: Proyecto, event: Event): void {
    console.log('Click en estrella detectado!', proyecto.nombre);
    event.stopPropagation(); // Evitar navegación al hacer clic en estrella
    event.preventDefault();
    
    const usuario = this.authService.getCurrentUser();
    if (!usuario) {
      console.error('No hay usuario autenticado');
      this.errorMessage = 'Debes iniciar sesión para marcar favoritos';
      return;
    }

    console.log(`Toggling favorito para proyecto ${proyecto.id}, usuario ${usuario.id}`);

    // Actualización optimista de la UI
    const eraFavorito = this.esFavorito(proyecto);
    
    this.proyectoService.toggleFavorito(proyecto.id, usuario.id).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        
        // Actualizar listas basado en la respuesta del servidor
        if (response.es_favorito) {
          // Se agregó a favoritos
          if (!this.favoritosIds.has(proyecto.id)) {
            this.favoritosIds.add(proyecto.id);
            this.proyectosFavoritos.push(proyecto);
          }
        } else {
          // Se quitó de favoritos
          this.favoritosIds.delete(proyecto.id);
          this.proyectosFavoritos = this.proyectosFavoritos.filter(p => p.id !== proyecto.id);
        }
        
        // Mensaje de feedback
        const mensaje = response.es_favorito 
          ? `${proyecto.nombre} agregado a favoritos` 
          : `${proyecto.nombre} quitado de favoritos`;
        console.log(mensaje);
      },
      error: (error: any) => {
        console.error('Error al marcar favorito:', error);
        
        // Mostrar mensaje de error más específico
        if (error.status === 401) {
          this.errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente.';
        } else if (error.status === 404) {
          this.errorMessage = 'Proyecto no encontrado.';
        } else {
          this.errorMessage = error.error?.message || 'Error al actualizar favorito. Intenta nuevamente.';
        }
        
        // Limpiar el mensaje de error después de 3 segundos
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
        
        // Revertir el cambio optimista recargando las listas
        this.cargarProyectosFavoritos();
      }
    });
  }

  getIcono(proyecto: Proyecto): string {
    return proyecto.icono || this.iconMap[proyecto.id] || '📁';
  }

  getEstadoClass(estado: string | null | undefined): string {
    if (!estado) {
      return 'estado-default';
    }
  
    const estadoMap: { [key: string]: string } = {
      'activo': 'estado-activo',
      'completado': 'estado-completado',
      'pausado': 'estado-pausado',
      'planificado': 'estado-planificado'
    };
    
    return estadoMap[estado.toLowerCase()] || 'estado-default';
  }

  esFavorito(proyecto: Proyecto): boolean {
    return this.favoritosIds.has(proyecto.id);
  }
}