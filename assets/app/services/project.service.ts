// src/app/services/project.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroment/enviroment.development';

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: Date | string;
  fecha_fin?: Date | string;
  estado: string;
  usuario_id: number;
  es_favorito?: boolean;
  icono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/proyectos`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/proyectos
   * Obtiene todos los proyectos
   */
  getProyectos(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
  }

  /**
   * GET /api/proyectos/{id}
   * Obtiene un proyecto por ID
   */
  getProyecto(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  /**
   * DELETE /api/proyectos/{id}
   * Elimina un proyecto
   */
  eliminarProyecto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/proyectos/usuario/{usuarioId}/favoritos
   * Obtiene los proyectos favoritos de un usuario
   * 
   * NOTA: Este endpoint debe implementarse en el backend si no existe
   */
  getProyectosFavoritos(usuarioId: number): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/usuario/${usuarioId}/favoritos`);
  }

  /**
   * POST /api/proyectos/{proyectoId}/favorito
   * Marca o desmarca un proyecto como favorito
   * 
   * Body: { "usuario_id": number }
   * 
   * NOTA: Este endpoint debe implementarse en el backend si no existe
   */
  toggleFavorito(proyectoId: number, usuarioId: number): Observable<{ success: boolean; message: string; es_favorito: boolean }> {
    return this.http.post<{ success: boolean; message: string; es_favorito: boolean }>(
      `${this.apiUrl}/${proyectoId}/favorito`, 
      { usuario_id: usuarioId }
    );
  }
}