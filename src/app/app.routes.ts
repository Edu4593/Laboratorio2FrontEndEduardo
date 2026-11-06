import { Routes } from '@angular/router';
import { ROLE_ADMIN } from './interfaces/auth';
import { authGuard, guestGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

/** Rutas que solo puede abrir el SUPER-ADMIN-ROLE (se reutiliza en varias rutas). */
const soloAdmin = {
  canActivate: [roleGuard],
  data: { roles: [ROLE_ADMIN] },
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },

  // ---------- Pública (solo si NO hay sesión) ----------
  {
    path: 'login',
    title: 'Iniciar sesión',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },

  // ---------- Productos: ver = cualquier autenticado; crear/editar = SUPER-ADMIN ----------
  {
    path: 'productos',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Productos',
        loadComponent: () =>
          import('./producto-list/producto-list').then((m) => m.ProductoList),
      },
      {
        path: 'nuevo',
        title: 'Nuevo producto',
        ...soloAdmin,
        loadComponent: () =>
          import('./producto-form/producto-form').then((m) => m.ProductoForm),
      },
      {
        path: 'editar/:id',
        title: 'Editar producto',
        ...soloAdmin,
        loadComponent: () =>
          import('./producto-form/producto-form').then((m) => m.ProductoForm),
      },
    ],
  },

  // ---------- Categorías: ver = cualquier autenticado; crear/editar = SUPER-ADMIN ----------
  {
    path: 'categorias',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Categorías',
        loadComponent: () =>
          import('./categoria-list/categoria-list').then((m) => m.CategoriaList),
      },
      {
        path: 'nueva',
        title: 'Nueva categoría',
        ...soloAdmin,
        loadComponent: () =>
          import('./categoria-form/categoria-form').then((m) => m.CategoriaForm),
      },
      {
        path: 'editar/:id',
        title: 'Editar categoría',
        ...soloAdmin,
        loadComponent: () =>
          import('./categoria-form/categoria-form').then((m) => m.CategoriaForm),
      },
    ],
  },

  // ---------- Usuarios: solo SUPER-ADMIN (acceso por URL y por menú) ----------
  {
    path: 'usuarios',
    title: 'Usuarios',
    ...soloAdmin, // roleGuard ya valida sesión y rol
    loadComponent: () => import('./usuario-list/usuario-list').then((m) => m.UsuarioList),
  },

  {
  path: 'registro',
  loadComponent: () => import('./registro/registro').then(c => c.Registro),
  canActivate: [guestGuard],
  title: 'Registro - Laboratorio 2'
  },



  { path: '**', redirectTo: 'productos' },
];