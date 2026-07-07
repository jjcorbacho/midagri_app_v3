import { Perfil } from './usuario-sodega.model';

/**
 * Rol del sistema = perfil SODEGA (base del proyecto).
 * Se mantiene el alias `Rol` por compatibilidad con el código existente.
 */
export type Rol = Perfil;

/** Vista simplificada del usuario en sesión (derivada de la sesión SODEGA). */
export interface User {
  username: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  email: string;
}
