import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../enviroment/enviroment.development';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  proyecto_id: number;
  fecha_limite?: Date | string;
  prioridad?: string;
  usuario_asignado_id?: number;
  creado_en?: Date | string;
  actualizado_en?: Date | string;
}

export interface TareaCreate {
  titulo: string;
  descripcion?: string;
  estado: string;
  proyecto_id: number;
  fecha_limite?: Date | string;
  prioridad?: string;
  usuario_asignado_id?: number;
}

export interface TareaUpdate {
  titulo?: string;
  descripcion?: string;
  estado?: string;
  fecha_limite?: Date | string;
  prioridad?: string;
  usuario_asignado_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TareaService {
  private apiUrl = `${environment.apiUrl}/tareas`;

  constructor(private http: HttpClient) {}

  getTareasPorProyecto(proyectoId: number): Observable<Tarea[]> {
    // En una app real, esto sería: return this.http.get<Tarea[]>(`${this.apiUrl}?proyecto_id=${proyectoId}`);
    // Por ahora retornamos datos ficticios
    const tareas: Tarea[] = [
      {
        id: 1,
        titulo: 'Tarea de ejemplo 1',
        descripcion: 'Descripción de la tarea',
        estado: 'pendiente',
        proyecto_id: proyectoId,
        fecha_limite: new Date(),
        prioridad: 'media'
      },
      {
        id: 2,
        titulo: 'Tarea de ejemplo 2',
        descripcion: 'Otra descripción',
        estado: 'en_progreso',
        proyecto_id: proyectoId,
        fecha_limite: new Date(),
        prioridad: 'alta'
      }
    ];
    return of(tareas);
  }

  crearTarea(tarea: TareaCreate): Observable<Tarea> {
    // En una app real: return this.http.post<Tarea>(this.apiUrl, tarea);
    const nuevaTarea: Tarea = {
      id: Date.now(),
      ...tarea,
      creado_en: new Date(),
      actualizado_en: new Date()
    };
    return of(nuevaTarea);
  }

  actualizarTarea(id: number, tarea: TareaUpdate): Observable<Tarea> {
    // En una app real: return this.http.put<Tarea>(`${this.apiUrl}/${id}`, tarea);
    const tareaActualizada: Tarea = {
      id,
      titulo: tarea.titulo || '',
      descripcion: tarea.descripcion,
      estado: tarea.estado || 'pendiente',
      proyecto_id: 0,
      fecha_limite: tarea.fecha_limite,
      prioridad: tarea.prioridad,
      usuario_asignado_id: tarea.usuario_asignado_id,
      actualizado_en: new Date()
    };
    return of(tareaActualizada);
  }

  eliminarTarea(id: number): Observable<void> {
    // En una app real: return this.http.delete<void>(`${this.apiUrl}/${id}`);
    return of(undefined);
  }
}

