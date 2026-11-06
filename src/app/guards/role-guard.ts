import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAutenticacion } from '../services/auth';

/**
 * Restringe una ruta a ciertos roles. Los roles permitidos se declaran en la
 * definición de la ruta: `data: { roles: [ROLE_ADMIN] }`.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(ServicioAutenticacion);
  const router = inject(Router);
  const permisosRequeridos = (route.data['roles'] as string[] | undefined) ?? [];

  if (!authService.tieneSesionValida()) {
    return router.createUrlTree(['/login']);
  }
  return authService.tieneAlgunPermisoRequerido(permisosRequeridos) ? true : router.createUrlTree(['/acceso-denegado']);
};