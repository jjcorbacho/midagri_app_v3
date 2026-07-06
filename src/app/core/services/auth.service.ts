import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Rol, User } from '../models/user.model';

const SESSION_KEY = 'midagri.session';

/**
 * Servicio de autenticación.
 *
 * ⚠ SIMULADO: replica el comportamiento del prototipo original (rol derivado
 * del nombre de usuario, sesión en sessionStorage). El equipo backend debe:
 *  - Reemplazar `login()` por `this.http.post<LoginResponse>(`${apiBaseUrl}/auth/login`, credenciales)`.
 *  - Emitir/almacenar el token JWT y exponerlo para `auth.interceptor.ts`.
 *  - Implementar refresh de sesión y logout contra el API.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _sessionReady = signal(false);

  readonly user = this._user.asReadonly();
  readonly sessionReady = this._sessionReady.asReadonly();

  readonly isAdministrador = computed(() => this._user()?.rol === 'ADMINISTRADOR');
  readonly isAdminDZ = computed(() => this._user()?.rol === 'ADMIN_DZ');
  readonly isAdminUE = computed(() => this._user()?.rol === 'ADMIN_UE');
  readonly isTecnico1 = computed(() => this._user()?.rol === 'TECNICO1');
  readonly isReadOnly = computed(
    () => this._user()?.rol === 'ADMIN_DZ' || this._user()?.rol === 'ADMIN_UE',
  );

  constructor() {
    this.restoreSession();
  }

  /** Restaura la sesión desde sessionStorage (evita expulsión al recargar). */
  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) this._user.set(JSON.parse(raw) as User);
    } catch (e) {
      console.error('[MIDAGRI] No se pudo restaurar la sesión.', e);
    } finally {
      this._sessionReady.set(true);
    }
  }

  /**
   * POST /auth/login (simulado).
   * El rol se deriva del nombre de usuario, igual que en el prototipo.
   */
  login(username: string): Observable<User> {
    const u = username.trim().toLowerCase();
    let rol: Rol = 'ADMINISTRADOR';
    let nombre = 'Marcos';
    let apellido = 'Torres';
    if (u === 'admindz' || u.includes('_dz') || u.startsWith('dz')) {
      rol = 'ADMIN_DZ'; nombre = 'Lucía'; apellido = 'Ramírez';
    } else if (u === 'adminue' || u.includes('_ue') || u.startsWith('ue')) {
      rol = 'ADMIN_UE'; nombre = 'Pedro'; apellido = 'Salas';
    } else if (u === 'tecnico1' || u.includes('tec1') || u.startsWith('tec1')) {
      rol = 'TECNICO1'; nombre = 'Juan'; apellido = 'Quispe';
    }
    const user: User = { username, nombre, apellido, rol, email: `${u}@midagri.gob.pe` };
    this._user.set(user);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch { /* noop */ }
    return of(user).pipe(delay(150));
  }

  /** POST /auth/logout (simulado). */
  logout(): void {
    this._user.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch { /* noop */ }
  }

  /** Token para el interceptor. TODO(backend): devolver el JWT real. */
  getToken(): string | null {
    return null;
  }
}
