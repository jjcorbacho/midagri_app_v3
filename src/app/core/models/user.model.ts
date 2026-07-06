/** Roles del sistema (mismos códigos que el sistema original). */
export type Rol = 'ADMINISTRADOR' | 'ADMIN_DZ' | 'ADMIN_UE' | 'TECNICO1';

export interface User {
  username: string;
  nombre: string;
  apellido: string;
  rol: Rol;
  email: string;
}
