import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAutenticacion } from '../services/auth';

/** Solo deja pasar a usuarios autenticados; si no, redirige al login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const servicioAutenticacion = inject(ServicioAutenticacion);
  const router = inject(Router);

  return servicioAutenticacion.tieneSesionValida()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Para el login: si ya hay sesión, manda al usuario a la página principal. */
export const guestGuard: CanActivateFn = () => {
  const servicioAutenticacion = inject(ServicioAutenticacion);
  const router = inject(Router);

  return servicioAutenticacion.tieneSesionValida() ? router.createUrlTree(['/productos']) : true;
};
