// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../enviroment/enviroment.development';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  avatar?: string;
  fecha_registro?: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  usuario?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Cargar usuario del localStorage al iniciar
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.token && response.usuario) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getProfile(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/auth/me`);
  }
}