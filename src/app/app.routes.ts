import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/**
 * Rutas de la aplicación.
 * Todas las pantallas se cargan con Lazy Loading (loadComponent).
 * El shell (sidebar + header) protege con authGuard y filtra por rol (roleGuard).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/autenticacion/login.component').then((m) => m.LoginComponent),
    title: 'Inicio de sesión — MIDAGRI',
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Inicio — MIDAGRI',
      },
      {
        path: 'capacitaciones-n1',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/capacitaciones/bandeja/bandeja.component').then(
                (m) => m.BandejaComponent,
              ),
            title: 'Capacitaciones N1 — MIDAGRI',
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/capacitaciones/stepper/stepper.component').then(
                (m) => m.StepperComponent,
              ),
            data: { mode: 'nuevo' },
            title: 'Nuevo registro — MIDAGRI',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/capacitaciones/stepper/stepper.component').then(
                (m) => m.StepperComponent,
              ),
            data: { mode: 'editar' },
            title: 'Edición de registro — MIDAGRI',
          },
        ],
      },
      // Vista unificada de Seguimiento: ambas rutas cargan el mismo componente
      // (los guards y permisos por ruta se conservan); la ruta fija la pestaña.
      {
        path: 'seguimiento/revision',
        loadComponent: () =>
          import('./features/seguimiento/seguimiento.component').then((m) => m.SeguimientoComponent),
        data: { modo: 'revision' },
        title: 'Seguimiento — MIDAGRI',
      },
      {
        path: 'seguimiento/aprobacion',
        loadComponent: () =>
          import('./features/seguimiento/seguimiento.component').then((m) => m.SeguimientoComponent),
        data: { modo: 'aprobacion' },
        title: 'Seguimiento — MIDAGRI',
      },
      {
        path: 'configuracion',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'reglas' },
          {
            path: 'campos',
            loadComponent: () =>
              import('./features/configuracion/campos/campos.component').then(
                (m) => m.CamposComponent,
              ),
            title: 'Configuración de campos — MIDAGRI',
          },
          {
            path: 'reglas',
            loadComponent: () =>
              import('./features/configuracion/reglas/reglas.component').then(
                (m) => m.ReglasComponent,
              ),
            title: 'Configuración de reglas — MIDAGRI',
          },
        ],
      },
      {
        path: 'administracion',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'listas' },
          {
            path: 'listas',
            loadComponent: () =>
              import('./features/administracion/listas/listas.component').then(
                (m) => m.ListasComponent,
              ),
            title: 'Administración de Listas — SODEGA',
          },
        ],
      },
      {
        path: 'usuarios',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/usuarios/gestion-usuarios.component').then(
                (m) => m.GestionUsuariosComponent,
              ),
            title: 'Gestión de Usuarios — SODEGA',
          },
          {
            path: 'nuevo',
            loadComponent: () =>
              import('./features/usuarios/usuario-form.component').then(
                (m) => m.UsuarioFormComponent,
              ),
            title: 'Nuevo usuario — SODEGA',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/usuarios/usuario-form.component').then(
                (m) => m.UsuarioFormComponent,
              ),
            title: 'Edición de usuario — SODEGA',
          },
        ],
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then((m) => m.ReportesComponent),
        title: 'Reportes — MIDAGRI',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
        title: 'Mi perfil — MIDAGRI',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/errores/not-found.component').then((m) => m.NotFoundComponent),
    title: 'Página no encontrada — MIDAGRI',
  },
];
