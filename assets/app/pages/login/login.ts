// src/app/pages/login/login.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor ingrese email y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/recomendados']);
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique que el backend esté corriendo.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al iniciar sesión. Por favor intente nuevamente.';
        }
        console.error('Error en login:', error);
      }
    });
  }
}