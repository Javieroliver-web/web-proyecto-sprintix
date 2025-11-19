// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout';
import { LoginComponent } from './pages/login/login';
import { ProjectListComponent } from './pages/project-list/project-list';
import { BoardComponent } from './pages/board/board';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'recomendados', 
        component: ProjectListComponent 
      },
      { 
        path: 'proyectos',
        component: ProjectListComponent
      },
      { 
        path: 'proyectos/:id',
        component: DashboardComponent
      },
      { 
        path: 'proyectos/:id/board',
        component: BoardComponent
      },
      { 
        path: '', 
        redirectTo: 'recomendados', 
        pathMatch: 'full' 
      }
    ]
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];