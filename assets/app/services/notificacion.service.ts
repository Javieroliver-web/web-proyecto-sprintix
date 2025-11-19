import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../enviroment/enviroment.development';

export interface Notificacion {
  id: number;
  usuario_id: number;
  mensaje: string;
  tipo: string;
  leida: boolean;
  creado_en: Date | string;
  proyecto_id?: number;
  tarea_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  constructor(private http: HttpClient) {}

  getNotificaciones(usuarioId: number): Observable<Notificacion[]> {
    // En una app real: return this.http.get<Notificacion[]>(`${this.apiUrl}?usuario_id=${usuarioId}`);
    // Por ahora retornamos datos ficticios
    const notificaciones: Notificacion[] = [
      {
        id: 1,
        usuario_id: usuarioId,
        mensaje: 'Nueva tarea asignada',
        tipo: 'tarea',
        leida: false,
        creado_en: new Date(),
        tarea_id: 1
      },
      {
        id: 2,
        usuario_id: usuarioId,
        mensaje: 'Proyecto actualizado',
        tipo: 'proyecto',
        leida: false,
        creado_en: new Date(),
        proyecto_id: 1
      }
    ];
    return of(notificaciones);
  }

  marcarComoLeida(id: number): Observable<void> {
    // En una app real: return this.http.put<void>(`${this.apiUrl}/${id}/leida`, {});
    return of(undefined);
  }
}

