/** Roles definidos en Keycloak (provienen de la tarea 1 del back-end). */
export const ROLE_ADMIN = 'SUPER-ADMIN-ROLE';
export const ROLE_USER = 'USER';

export interface LoginRequest {
  username: string;
  password: string;
}

/** Cuerpo de POST /usuario/registro. */
export interface RegistroRequest {
  username: string;
  password: string;
  role: string;
}

/** Roles que se pueden elegir al registrarse. */
export const ROLES_REGISTRO = [ROLE_ADMIN, ROLE_USER] as const;

/** Respuesta de POST /auth/login (ver pruebas HTTP: response.body.token). */
export interface LoginResponse {
  access_token: string;
}

/** Usuario tal como está en la tabla `usuario` (la contraseña nunca viaja al frontend). */
export interface Usuario {
  id: number;
  username: string;
  role: string;
}

/** Claims del JWT emitido por Keycloak que usa el frontend. */
export interface JwtPayload {
  exp?: number;
  sub?: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}
