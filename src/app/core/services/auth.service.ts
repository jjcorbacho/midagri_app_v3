import { Injectable, computed, inject, signal } from '@angular/core';
import { Perfil, PeriodoGestion, UsuarioSodega } from '../models/usuario-sodega.model';
import { User } from '../models/user.model';
import { UsuariosService } from './usuarios.service';

const SESSION_KEY = 'sodega.session';

/** Sesión activa de la Plataforma SODEGA. */
export interface SodegaSession {
  userGen: string;
  nombreCompleto: string;
  /** Perfil con el que se opera la sesión (el Admin General puede elegir otro al ingresar). */
  perfil: Perfil;
  /** Perfil real autenticado (conserva los privilegios del Admin General master). */
  perfilAutenticado: Perfil;
  unidad: string;
  opa: string;
}

/** Resultado de resolver el ingreso (flujo del prototipo SODEGA). */
export type LoginResolution =
  | { status: 'no-registrado' }
  | { status: 'inhabilitado' }
  | { status: 'seleccion-perfil'; registros: UsuarioSodega[] }   // Admin General elige perfil
  | { status: 'seleccion-opa'; registros: UsuarioSodega[] }      // varios registros: elige Unidad/OPA
  | { status: 'directo'; registro: UsuarioSodega };              // registro único habilitado

/**
 * Autenticación SODEGA (base del proyecto).
 *
 * ⚠ SIMULADO: valida contra el registro en memoria de UsuariosService.
 * El equipo backend debe:
 *  - Reemplazar `resolverIngreso()` por `POST {apiBaseUrl}/auth/login` (usuario+clave)
 *    devolviendo los registros/privilegios activos de la cuenta unificada.
 *  - Emitir el JWT en `confirmarIngreso()` y exponerlo en `getToken()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuariosService = inject(UsuariosService);

  private readonly _session = signal<SodegaSession | null>(null);
  private readonly _sessionReady = signal(false);

  readonly session = this._session.asReadonly();
  readonly sessionReady = this._sessionReady.asReadonly();

  readonly perfil = computed<Perfil | null>(() => this._session()?.perfil ?? null);
  readonly perfilAutenticado = computed<Perfil | null>(() => this._session()?.perfilAutenticado ?? null);
  /** ¿La cuenta autenticada es el Admin General master (aunque opere con otro perfil)? */
  readonly esAdminGeneralAutenticado = computed(() => this.perfilAutenticado() === 'Administrador General');

  /* Helpers por perfil (matriz SODEGA) */
  readonly isAdministrador = computed(() => this.perfil() === 'Administrador General');
  readonly isJefeArea = computed(() => this.perfil() === 'Jefe de Área');
  readonly isAdminUE = computed(() => this.perfil() === 'Administrador Unidad Ejecutora(UE)');
  readonly isAdminDZ = computed(() => this.perfil() === 'Administrador DZ_Cap_Asit.');
  readonly isTecnico1 = computed(() => this.perfil() === 'Técnico Capacitación y Asistencia Técnica');
  readonly isReadOnly = computed(() => this.isAdminDZ() || this.isAdminUE());

  /**
   * Registro SODEGA del que proviene la sesión activa. Un usuario unificado
   * puede tener varios registros (uno por servicio/unidad), así que se resuelve
   * por perfil + unidad + OPA y se degrada al primero disponible. Es reactivo:
   * si el registro cambia (p. ej. se le agrega un periodo), la vista se refresca.
   */
  readonly registroActivo = computed<UsuarioSodega | null>(() => {
    const s = this._session();
    if (!s) return null;
    const registros = this.usuariosService.findByUserGen(s.userGen);
    if (registros.length === 0) return null;
    return (
      registros.find((u) => u.perfil === s.perfil && u.unidad === s.unidad && u.opa === s.opa) ??
      registros.find((u) => u.perfil === s.perfil) ??
      registros[0]
    );
  });

  /** Periodos de gestión asignados al servicio con el que se opera la sesión. */
  readonly periodosSesion = computed<PeriodoGestion[]>(
    () => this.registroActivo()?.periodosGestion ?? [],
  );

  /** Vista compatible del usuario para componentes existentes (perfil, header…). */
  readonly user = computed<User | null>(() => {
    const s = this._session();
    if (!s) return null;
    const partes = s.nombreCompleto.trim().split(/\s+/);
    return {
      username: s.userGen,
      nombre: partes[0] ?? s.nombreCompleto,
      apellido: partes.slice(1).join(' ') || '—',
      rol: s.perfil,
      email: `${s.userGen}@midagri.gob.pe`,
    };
  });

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw) as SodegaSession;
        // Migración: el perfil "Administrador Unidad Organizacional" pasó a
        // llamarse "Administrador Unidad Ejecutora(UE)" (SODEGA v3.1.2).
        if ((session.perfil as string) === 'Administrador Unidad Organizacional') {
          session.perfil = 'Administrador Unidad Ejecutora(UE)';
        }
        if (!session.perfilAutenticado) session.perfilAutenticado = session.perfil;
        this._session.set(session);
      }
    } catch (e) {
      console.error('[SODEGA] No se pudo restaurar la sesión.', e);
    } finally {
      this._sessionReady.set(true);
    }
  }

  /** ¿El usuario unificado existe en el registro? (mensaje en vivo del login). */
  usuarioReconocido(username: string): boolean {
    const u = username.trim().toLowerCase();
    if (!u) return false;
    // Alias de compatibilidad del prototipo
    if (u === 'candelab' || u === 'psanchez') return true;
    return this.usuariosService.findByUserGen(u).length > 0;
  }

  /**
   * POST /auth/login (simulado): resuelve el flujo de ingreso.
   *  - Admin General master → selección de perfil.
   *  - Varios registros habilitados → selección de Unidad Responsable (OPA).
   *  - Registro único → ingreso directo.
   */
  resolverIngreso(username: string): LoginResolution {
    this.usuariosService.recalcularVigencias();
    const user = username.trim().toLowerCase();
    const mappedUser = user === 'candelab' ? 'ccandelaria' : user;

    const registros = this.usuariosService.findByUserGen(mappedUser);
    if (registros.length === 0) return { status: 'no-registrado' };

    const habilitados = registros.filter((u) => u.estado === 'HABILITADO');
    if (habilitados.length === 0) return { status: 'inhabilitado' };

    const esAdminGralMaster = mappedUser === 'ccandelaria';
    if (esAdminGralMaster) return { status: 'seleccion-perfil', registros: habilitados };
    if (habilitados.length > 1) return { status: 'seleccion-opa', registros: habilitados };
    return { status: 'directo', registro: habilitados[0] };
  }

  /** Confirma el ingreso con el perfil/unidad elegidos y persiste la sesión. */
  confirmarIngreso(registro: UsuarioSodega, perfil?: Perfil, unidad?: string, perfilAutenticado?: Perfil): void {
    const session: SodegaSession = {
      userGen: registro.userGen,
      nombreCompleto: `${registro.nombres} ${registro.apePat} ${registro.apeMat}`,
      perfil: perfil ?? registro.perfil,
      perfilAutenticado: perfilAutenticado ?? perfil ?? registro.perfil,
      unidad: unidad ?? registro.unidad ?? 'Sede Central',
      opa: registro.opa,
    };
    this._session.set(session);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* noop */ }
  }

  /** POST /auth/logout (simulado). */
  logout(): void {
    this._session.set(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch { /* noop */ }
  }

  /** Token para el interceptor. TODO(backend): devolver el JWT real. */
  getToken(): string | null {
    return null;
  }
}
