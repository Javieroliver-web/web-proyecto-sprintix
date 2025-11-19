// src/app/components/header/header.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf y {{...}}
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true, // Asumiendo que es standalone
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  currentUser: Usuario | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Nos suscribimos a los cambios del usuario
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout(); // Llama al método de logout del servicio
    }
  }

  getInitials(): string {
    if (!this.currentUser) return '?'; // Devuelve '?' si no hay usuario
    const nombre = this.currentUser.nombre?.charAt(0) || '';
    const apellido = this.currentUser.apellido?.charAt(0) || '';
    return (nombre + apellido).toUpperCase();
  }
}