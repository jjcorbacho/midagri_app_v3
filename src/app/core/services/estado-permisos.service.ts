import { Injectable, computed, inject } from '@angular/core';
import { EstadoCurso, ESTADOS } from '../models/curso.model';
import { Perfil, PerfilConocido } from '../models/usuario-sodega.model';
import { AuthService } from './auth.service';

/**
 * Matriz oficial de estados por perfil.
 *
 * Transcripción literal del cuadro "ESTADOS DEL SODEGA PARA LOS PERFILES —
 * Para las Capacitaciones y Asistencias Técnicas"
 * (Estados para los perfiles_Cap_Asist.tecnicas.xlsx): `realiza` son las filas
 * con SI en la columna REALIZA y `visualiza` las que lo tienen en VISUALIZA.
 *
 * No se completa por inferencia: el Administrador General no tiene ninguna
 * marca en el cuadro, así que no realiza ni visualiza estados aunque sea el
 * perfil de mayor jerarquía.
 */
interface FilaMatriz {
  realiza: EstadoCurso[];
  visualiza: EstadoCurso[];
}

const MATRIZ_ESTADOS: Record<PerfilConocido, FilaMatriz> = {
  // Cuadro: "Técnico Cap_Asist."
  'Técnico Capacitación y Asistencia Técnica': {
    realiza: ['Registrado', 'Enviado', 'Enviado-subsanado'],
    visualiza: [
      'Observado por DZ',
      'Observado por UE',
      'Observado por JA',
      'Aprobado por DZ',
      'Aprobado por UE',
      'Aprobado por JA',
    ],
  },
  // Cuadro: "Administrador DZ"
  'Administrador DZ_Cap_Asit.': {
    realiza: ['Observado por DZ', 'Enviado-subsanado', 'Aprobado por DZ'],
    visualiza: ['Observado por UE', 'Observado por JA', 'Aprobado por UE', 'Aprobado por JA'],
  },
  // Cuadro: "Administrador UE"
  'Administrador Unidad Ejecutora(UE)': {
    realiza: ['Observado por UE', 'Aprobado por UE'],
    visualiza: ['Observado por JA', 'Aprobado por JA', 'Aprobado por DZ'],
  },
  // Cuadro: "Jefe de Área"
  'Jefe de Área': {
    realiza: ['Observado por JA', 'Aprobado por JA'],
    visualiza: ['Aprobado por UE'],
  },
  // Cuadro: "Administrador General" — sin ninguna marca SI en REALIZA ni en
  // VISUALIZA. Se transcribe vacío, sin completarlo por jerarquía.
  'Administrador General': {
    realiza: [],
    visualiza: [],
  },
};

/** Estado de observación que produce cada perfil evaluador. */
const OBSERVA_COMO: Partial<Record<PerfilConocido, EstadoCurso>> = {
  'Administrador DZ_Cap_Asit.': 'Observado por DZ',
  'Administrador Unidad Ejecutora(UE)': 'Observado por UE',
  'Jefe de Área': 'Observado por JA',
};

/** Estado de aprobación que produce cada perfil evaluador. */
const APRUEBA_COMO: Partial<Record<PerfilConocido, EstadoCurso>> = {
  'Administrador DZ_Cap_Asit.': 'Aprobado por DZ',
  'Administrador Unidad Ejecutora(UE)': 'Aprobado por UE',
  'Jefe de Área': 'Aprobado por JA',
};

/**
 * Fuente única para resolver qué estados puede realizar o visualizar un perfil.
 *
 * El cuadro decide el permiso; el flujo de vida del registro (quién envía,
 * quién evalúa y en qué orden) sigue viviendo en `curso.model.ts`. Las vistas
 * consultan este servicio en lugar de repetir la matriz.
 */
@Injectable({ providedIn: 'root' })
export class EstadoPermisosService {
  private readonly auth = inject(AuthService);

  /** Perfil en sesión, o `null` si no hay uno reconocido en el cuadro. */
  private readonly perfilSesion = computed<PerfilConocido | null>(() =>
    this.perfilConocido(this.auth.perfil() ?? ''),
  );

  private perfilConocido(perfil: Perfil | ''): PerfilConocido | null {
    return perfil && perfil in MATRIZ_ESTADOS ? (perfil as PerfilConocido) : null;
  }

  /** ¿El perfil puede llevar un registro a este estado? (columna REALIZA) */
  puedeRealizar(perfil: Perfil | '', estado: EstadoCurso): boolean {
    const conocido = this.perfilConocido(perfil);
    return !!conocido && MATRIZ_ESTADOS[conocido].realiza.includes(estado);
  }

  /**
   * ¿El perfil puede ver registros en este estado? (columna VISUALIZA)
   * Incluye los que él mismo realiza: quien produce un estado lo ve.
   */
  puedeVisualizar(perfil: Perfil | '', estado: EstadoCurso): boolean {
    const conocido = this.perfilConocido(perfil);
    if (!conocido) return false;
    const fila = MATRIZ_ESTADOS[conocido];
    return fila.visualiza.includes(estado) || fila.realiza.includes(estado);
  }

  /* ===== Atajos para el perfil en sesión ===== */

  sesionPuedeRealizar(estado: EstadoCurso): boolean {
    return this.puedeRealizar(this.auth.perfil() ?? '', estado);
  }

  sesionPuedeVisualizar(estado: EstadoCurso): boolean {
    return this.puedeVisualizar(this.auth.perfil() ?? '', estado);
  }

  /** Estados que el perfil en sesión puede ver, en el orden del cuadro. */
  readonly estadosVisibles = computed<EstadoCurso[]>(() => {
    const perfil = this.auth.perfil() ?? '';
    return ESTADOS.filter((estado) => this.puedeVisualizar(perfil, estado));
  });

  /** Estados que el perfil en sesión puede producir, en el orden del cuadro. */
  readonly estadosRealizables = computed<EstadoCurso[]>(() => {
    const perfil = this.auth.perfil() ?? '';
    return ESTADOS.filter((estado) => this.puedeRealizar(perfil, estado));
  });

  /**
   * Estado de observación del perfil en sesión, o `null` si el cuadro no le
   * permite observar. Es lo que se guarda al devolver un registro.
   */
  readonly estadoObservarSesion = computed<EstadoCurso | null>(() => {
    const perfil = this.perfilSesion();
    const estado = perfil ? OBSERVA_COMO[perfil] : undefined;
    return estado && this.sesionPuedeRealizar(estado) ? estado : null;
  });

  /** Estado de aprobación del perfil en sesión, o `null` si no puede aprobar. */
  readonly estadoAprobarSesion = computed<EstadoCurso | null>(() => {
    const perfil = this.perfilSesion();
    const estado = perfil ? APRUEBA_COMO[perfil] : undefined;
    return estado && this.sesionPuedeRealizar(estado) ? estado : null;
  });
}
