import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core'; 
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  JwtPayload,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  ROLE_ADMIN,
  Usuario,
} from '../interfaces/auth';

// El nombre bajo el cual guardaremos el "gafete" en la memoria del navegador
const CLAVE_MEMORIA_TOKEN = 'lab2_token';

// 1. Busca en la memoria del navegador si ya hay un token (gafete) guardado de antes
function leerTokenGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_MEMORIA_TOKEN);
  } catch {
    return null;
  }
}

// 2. "Abre" el token para leer la información que trae adentro (nombre, roles, etc.)
function decodificarToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    // Magia matemática (Base64) para traducir el texto raro del token a un objeto JSON que podamos leer
    const parteInformacion = token.split('.')[1];
    let base64 = parteInformacion.replace(/-/g, '+').replace(/_/g, '/');
    base64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

// 3. Revisa la fecha de vencimiento del token. Si ya pasó, devuelve "true" (sí está vencido)
function elTokenEstaVencido(informacionToken: JwtPayload | null): boolean {
  if (!informacionToken?.exp) return false;
  // Se multiplica por 1000 porque la fecha viene en segundos y JavaScript usa milisegundos
  return informacionToken.exp * 1000 <= Date.now();
}

// 4. Saca la lista de permisos (roles) que tiene el usuario según su token
function extraerPermisos(informacionToken: JwtPayload | null): string[] {
  if (!informacionToken) return [];
  const permisos = new Set<string>(informacionToken.realm_access?.roles ?? []);
  
  Object.values(informacionToken.resource_access ?? {}).forEach((cliente) =>
    (cliente.roles ?? []).forEach((rol) => permisos.add(rol)),
  );
  return [...permisos]; // Devuelve la lista limpia
}

/**
 * SERVICIO DE AUTENTICACIÓN
 * Administra quién entra, quién sale y qué permisos tienen.
 */
@Service()
export class ServicioAutenticacion {
  // Herramientas para hacer peticiones al servidor y para navegar entre pantallas
  private readonly servidorHttp = inject(HttpClient);
  private readonly enrutador = inject(Router);
  
  // Direcciones de internet a las que nos vamos a conectar (vienen de tu archivo environment)
  private readonly urlLogin = `${environment.apiUrl}/auth`;
  private readonly urlUsuarios = `${environment.apiUrl}/usuario`;

  // SEÑALES (Signals): Son como variables "en vivo". Si el valor de "_tokenPrincipal" cambia, 
  // todo lo demás (usuario, roles, etc.) se actualiza automáticamente en toda la pantalla.
  private readonly _tokenPrincipal = signal<string | null>(leerTokenGuardado());

  // Variables de solo lectura que tu aplicación puede consultar en cualquier momento:
  readonly token = this._tokenPrincipal.asReadonly();
  
  readonly informacionUsuario = computed(() => decodificarToken(this._tokenPrincipal()));
  
  readonly estaLogueado = computed(() => {
    const info = this.informacionUsuario();
    // Está logueado SI hay token, SI pudimos leer su info, y SI NO está vencido.
    return !!this._tokenPrincipal() && !!info && !elTokenEstaVencido(info);
  });
  
  readonly nombreDeUsuario = computed(
    () => this.informacionUsuario()?.preferred_username ?? this.informacionUsuario()?.sub ?? '',
  );
  
  readonly rolesPermitidos = computed(() => extraerPermisos(this.informacionUsuario()));
  
  readonly esAdministrador = computed(() => this.rolesPermitidos().includes(ROLE_ADMIN));

  // ==========================================
  // ACCIONES PRINCIPALES
  // ==========================================

  // Iniciar sesión: Envía usuario y contraseña al backend. Si es exitoso, guarda el token.
  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.servidorHttp
      .post<LoginResponse>(`${this.urlLogin}/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta.access_token)));
  }

  // Registrar cuenta nueva: Envía datos al servidor pero no inicia sesión automáticamente.
  registrarCuenta(datos: RegistroRequest): Observable<Usuario> {
    return this.servidorHttp.post<Usuario>(`${this.urlUsuarios}/registro`, datos);
  }

  // Cerrar sesión: Borra el token y te manda a la pantalla de login
  cerrarSesion(redirigirAlLogin = true): void {
    this.guardarSesion(null); // Borra el token
    if (redirigirAlLogin) {
      this.enrutador.navigate(['/login']);
    }
  }

  // Revisa rápidamente si tu sesión sigue viva y no ha expirado el tiempo
  tieneSesionValida(): boolean {
    const tokenActual = this._tokenPrincipal();
    if (!tokenActual) return false;
    
    // Si el tiempo se acabó, borra todo
    if (elTokenEstaVencido(decodificarToken(tokenActual))) {
      this.guardarSesion(null);
      return false;
    }
    return true;
  }

  // Pregunta si el usuario actual tiene al menos uno de los permisos (roles) que le pidas
  tieneAlgunPermisoRequerido(permisosRequeridos: string[]): boolean {
    if (permisosRequeridos.length === 0) return true; // Si no piden nada, pasa.
    const misPermisos = this.rolesPermitidos();
    // Devuelve "true" si encuentra una coincidencia
    return permisosRequeridos.some((rol) => misPermisos.includes(rol));
  }

  // ==========================================
  // FUNCIONES INTERNAS (Privadas)
  // ==========================================

  // Se encarga de guardar el "gafete" tanto en la variable viva (Signal) como en el disco duro del navegador
  private guardarSesion(nuevoToken: string | null): void {
    try {
      if (nuevoToken) {
        localStorage.setItem(CLAVE_MEMORIA_TOKEN, nuevoToken);
      } else {
        localStorage.removeItem(CLAVE_MEMORIA_TOKEN); // Si le pasas "null", lo borra
      }
    } catch {
      /* Por si el navegador tiene bloqueada la memoria */
    }
    // Actualiza la variable viva
    this._tokenPrincipal.set(nuevoToken);
  }
}
