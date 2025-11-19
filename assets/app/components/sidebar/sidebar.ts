// src/app/components/sidebar/sidebar.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // IMPORTADO

@Component({
  selector: 'app-sidebar',
  standalone: true, // Asumiendo que es standalone
  imports: [
    RouterLink,         // AÑADIDO
    RouterLinkActive    // AÑADIDO
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {

}