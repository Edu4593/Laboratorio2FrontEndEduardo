import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ServicioAutenticacion } from '../services/auth';

const RUTAS_PUBLICAS = ['/auth/login', '/usuario/registro'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const servicioAutenticacion = inject(ServicioAutenticacion);
  const esRutaPublica = RUTAS_PUBLICAS.some((url) => req.url.includes(url));
  const tokenActual = servicioAutenticacion.token();

  const peticionModificada = tokenActual && !esRutaPublica 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${tokenActual}` } }) 
    : req;

  return next(peticionModificada).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esRutaPublica) {
        servicioAutenticacion.cerrarSesion();
      }
      return throwError(() => error);
    }),
  );
};
