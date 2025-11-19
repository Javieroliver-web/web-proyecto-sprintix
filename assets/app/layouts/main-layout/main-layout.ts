// src/app/layouts/main-layout/main-layout.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header'; // IMPORTADO
import { Sidebar } from '../../components/sidebar/sidebar'; // IMPORTADO

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Header,     // AÑADIDO
    Sidebar     // AÑADIDO
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent {
  // Toda la lógica de usuario se ha movido a header.ts
}