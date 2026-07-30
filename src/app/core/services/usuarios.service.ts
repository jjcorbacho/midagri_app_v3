import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  DatosReniec,
  Perfil,
  PERFILES,
  UsuarioSodega,
  calcularDiasRestantes,
  esUsuarioPermanente,
  toTitleCase,
} from '../models/usuario-sodega.model';
import { permisosCompletos } from '../models/permisos-menu.model';
import { ESQUEMAS_PERMISOS_MENU } from '../constants/permisos-menu.const';
import { obtenerUbigeoTextoSimulado } from '../constants/sodega.const';
import { TECNICOS_DEMO_REASIGNACION } from '../constants/mock-data.const';
import { usuariosDemoFaltantes } from '../constants/usuarios-demo.const';
import { environment } from '../../../environments/environment';

/** Cuenta master: ingresa con todos los permisos de menú activos. */
const PERMISOS_MASTER = permisosCompletos(ESQUEMAS_PERMISOS_MENU['Administrador General']!);

/**
 * Registros de prueba de QA (core/constants/usuarios-demo.const.ts). Se cargan
 * solo fuera de producción y sin duplicar los que ya existan: en un build
 * productivo la lista queda vacía y el estado inicial no cambia.
 */
function seedUsuariosDemo(base: readonly UsuarioSodega[]): UsuarioSodega[] {
  return environment.production ? [] : usuariosDemoFaltantes(base);
}

/**
 * Gestión Integral de Usuarios SODEGA.
 *
 * ⚠ SIMULADO: estado en memoria (Signals). Contratos sugeridos para el backend:
 *  - GET    /usuarios                       (filtrado por privilegios en servidor)
 *  - GET    /usuarios/{id}
 *  - POST   /usuarios
 *  - PUT    /usuarios/{id}
 *  - POST   /usuarios/{id}/presupuestos     (nueva partida presupuestal = nuevo registro)
 *  - PATCH  /usuarios/{id}/estado
 *  - POST   /usuarios/{id}/restablecer-clave
 *  - GET    /reniec/{dni}                   (Web Service RENIEC institucional)
 */
/** Estado inicial sin los registros de QA (cuenta master + demo de reasignación). */
const USUARIOS_BASE: UsuarioSodega[] = [
  {
    id: '1',
    dni: '45893012',
    nombres: 'Carlos',
    apePat: 'Candelaria',
    apeMat: 'Burgos',
    estCivil: 'Soltero',
    profesion: 'Especialista TI',
    direccion: 'Jr. Lambayeque 450',
    ubigeo: 'Lima/Lima/Jesús María',
    restricciones: 'Ninguna',
    sexo: 'Masculino',
    fechaNac: '15/08/1988',
    edad: '37',
    celular: '987452310',
    unidad: 'Programa de Desarrollo Productivo Agrario Rural',
    userGen: 'ccandelaria',
    correo: 'ccandelaria@midagri.gob.pe',
    regimen: 'Régimen CAS',
    estado: 'HABILITADO',
    fechaIni: '',
    fechaFin: '',
    nroOrden: '',
    perfil: 'Administrador General',
    opa: 'OGTI',
    fuenteFinanc: '',
    categoriaPresup: '',
    programaPresup: '',
    unidadFuncional: '',
    ambitos: [],
    permisosMenu: PERMISOS_MASTER,
  },
  // Datos de prueba (solo desarrollo): técnicos con registros para el
  // modal "Reasignar registros" — ver core/constants/mock-data.const.ts.
  ...TECNICOS_DEMO_REASIGNACION,
];

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly _usuarios = signal<UsuarioSodega[]>([
    ...USUARIOS_BASE,
    ...seedUsuariosDemo(USUARIOS_BASE),
  ]);

  readonly usuarios = this._usuarios.asReadonly();

  constructor() {
    this.recalcularVigencias();
  }

  /* ===== Vigencias (mismas reglas que el prototipo) ===== */

  /** Recalcula vigencia/vencimiento y auto-inhabilita contratos expirados. */
  recalcularVigencias(): void {
    this._usuarios.update((lista) =>
      lista.map((user) => {
        const u = { ...user };
        if (esUsuarioPermanente(u)) {
          u.diasRestantes = null;
          u.vigenciaCalculada = 'Permanente (Indeterminado)';
          if (u.inhabilitadoPorVencimiento) {
            u.estado = 'HABILITADO';
            u.inhabilitadoPorVencimiento = false;
          }
          return u;
        }
        const diasRestantes = calcularDiasRestantes(u.fechaFin);
        u.diasRestantes = diasRestantes;
        if (diasRestantes !== null && diasRestantes < 0) {
          u.vigenciaCalculada = 'Expiró';
          u.estado = 'INHABILITADO';
          u.inhabilitadoPorVencimiento = true;
        } else {
          if (diasRestantes === 0) u.vigenciaCalculada = '0 días';
          else if (diasRestantes === 1) u.vigenciaCalculada = 'Vence en 1 día';
          else u.vigenciaCalculada = `Vence en ${diasRestantes} días`;
          if (u.inhabilitadoPorVencimiento) {
            u.estado = 'HABILITADO';
            u.inhabilitadoPorVencimiento = false;
          }
        }
        return u;
      }),
    );
  }

  /* ===== Visibilidad y jerarquía de perfiles ===== */

  /**
   * Admin General ve todo; el Admin General master operando con otro perfil ve
   * los registros de ese perfil; el resto ve sus registros y los que creó.
   */
  registrosVisibles(
    perfilActivo: Perfil,
    userGenActivo: string,
    perfilAutenticado: Perfil = perfilActivo,
  ): UsuarioSodega[] {
    if (perfilActivo === 'Administrador General') return this._usuarios();
    if (perfilAutenticado === 'Administrador General') {
      return this._usuarios().filter((u) => u.perfil === perfilActivo);
    }
    return this._usuarios().filter(
      (u) => u.userGen === userGenActivo || u.creadoPor === userGenActivo,
    );
  }

  /**
   * Perfiles que el perfil activo puede registrar (jerarquía del prototipo),
   * incluyendo los perfiles personalizados de la lista "Perfil Autorizado".
   */
  perfilesRegistrables(perfilActivo: Perfil, disponibles: readonly string[] = PERFILES): Perfil[] {
    const esDz = perfilActivo === 'Administrador DZ_Cap_Asit.';
    return disponibles.filter((p) => {
      if (perfilActivo === 'Administrador General') return p !== 'Administrador General';
      if (p === perfilActivo || p === 'Administrador General') return false;
      if (perfilActivo === 'Administrador Unidad Ejecutora(UE)' && p === 'Jefe de Área') return false;
      if (esDz && (p === 'Jefe de Área' || p === 'Administrador Unidad Ejecutora(UE)')) return false;
      return true;
    });
  }

  /* ===== Consultas ===== */

  findById(id: string): UsuarioSodega | undefined {
    return this._usuarios().find((u) => u.id === id);
  }

  findByUserGen(userGen: string): UsuarioSodega[] {
    const normalizado = userGen.trim().toLowerCase();
    // Alias de compatibilidad del prototipo: 'candelab' → 'ccandelaria'
    const lookup = normalizado === 'candelab' ? 'ccandelaria' : normalizado;
    return this._usuarios().filter((u) => u.userGen.toLowerCase() === lookup);
  }

  existeDni(dni: string): boolean {
    return this._usuarios().some((u) => u.dni === dni);
  }

  existeUnidadParaDni(dni: string, unidad: string): boolean {
    return this._usuarios().some((u) => u.dni === dni && u.unidad === unidad);
  }

  /** ¿El DNI ya tiene registrada alguna de las fechas de contrato? (nueva partida). */
  existeFechaContratoParaDni(dni: string, fechaIni: string, fechaFin: string): boolean {
    return this._usuarios().some(
      (u) => u.dni === dni && (u.fechaIni === fechaIni || u.fechaFin === fechaFin),
    );
  }

  /** ¿El DNI ya tiene registrado el Nro. de Orden (O.S.)? (nueva partida). */
  existeOrdenParaDni(dni: string, nroOrden: string): boolean {
    const orden = nroOrden.trim().toLowerCase();
    return this._usuarios().some(
      (u) => u.dni === dni && (u.nroOrden || '').trim().toLowerCase() === orden,
    );
  }

  /* ===== Mutaciones ===== */

  /** POST /usuarios (o /usuarios/{id}/presupuestos si es nueva partida). */
  create(data: Omit<UsuarioSodega, 'id'>): UsuarioSodega {
    const nuevo: UsuarioSodega = { ...data, id: String(Date.now()) };
    this._usuarios.update((prev) => [...prev, nuevo]);
    this.recalcularVigencias();
    return nuevo;
  }

  /** PUT /usuarios/{id}. */
  update(id: string, patch: Partial<UsuarioSodega>): void {
    this._usuarios.update((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );
    this.recalcularVigencias();
  }

  /** PATCH /usuarios/{id}/estado — alterna HABILITADO/INHABILITADO. */
  toggleEstado(id: string): UsuarioSodega | undefined {
    const user = this.findById(id);
    if (!user) return undefined;
    const nuevoEstado = user.estado === 'HABILITADO' ? 'INHABILITADO' : 'HABILITADO';
    this.update(id, { estado: nuevoEstado, inhabilitadoPorVencimiento: false });
    return this.findById(id);
  }

  /** POST /usuarios/{id}/restablecer-clave — devuelve clave temporal. */
  restablecerClave(): string {
    return 'MIDAGRI_' + Math.floor(1000 + Math.random() * 9000);
  }

  /* ===== Usuario unificado generado (mismas reglas que el prototipo) ===== */

  private static limpiarTextoUsuario(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /** ¿El usuario generado ya pertenece a otro DNI? */
  existeUsuarioGeneradoParaOtroDni(usuario: string, dniActual: string): boolean {
    const buscado = UsuariosService.limpiarTextoUsuario(usuario);
    return this._usuarios().some(
      (u) =>
        UsuariosService.limpiarTextoUsuario(u.userGen) === buscado &&
        String(u.dni || '').trim() !== String(dniActual || '').trim(),
    );
  }

  /**
   * Usuario unificado único: inicial del primer nombre + apellido paterno,
   * desambiguado con letras del apellido materno y, si aún colisiona,
   * con un correlativo numérico.
   */
  generarUsuarioUnico(nombres: string, apellidoPaterno: string, apellidoMaterno: string, dniActual: string): string {
    const primerNombre = UsuariosService.limpiarTextoUsuario((nombres || '').trim().split(/\s+/)[0] ?? '');
    const apePat = UsuariosService.limpiarTextoUsuario(apellidoPaterno);
    const apeMat = UsuariosService.limpiarTextoUsuario(apellidoMaterno);
    if (!primerNombre || !apePat) return '';

    const base = primerNombre.charAt(0) + apePat;
    if (!this.existeUsuarioGeneradoParaOtroDni(base, dniActual)) return base;

    for (let i = 1; i <= apeMat.length; i++) {
      const candidato = base + apeMat.substring(0, i);
      if (!this.existeUsuarioGeneradoParaOtroDni(candidato, dniActual)) return candidato;
    }

    let correlativo = 2;
    let candidato = `${base}${apeMat}${correlativo}`;
    while (this.existeUsuarioGeneradoParaOtroDni(candidato, dniActual)) {
      correlativo++;
      candidato = `${base}${apeMat}${correlativo}`;
    }
    return candidato;
  }

  /**
   * GET /reniec/{dni} — consulta simulada al Web Service de RENIEC.
   * Generación determinista a partir del DNI (misma lógica del prototipo).
   */
  consultarReniec(dni: string): Observable<DatosReniec> {
    const seed = parseInt(dni, 10);
    const isFemenino = seed % 2 === 0;

    const nombresMasculinos = ['FRANCISCO JAVIER', 'LUIS ALBERTO', 'MIGUEL ÁNGEL', 'JORGE ENRIQUE', 'VÍCTOR MANUEL', 'EDGARD ANTONIO', 'CESAR AUGUSTO', 'HUGO HERNAN'];
    const nombresFemeninos = ['MARÍA ELENA', 'PATRICIA ISABEL', 'CARMEN ROSA', 'GLADYS BEATRIZ', 'ESTHER NOEMÍ', 'LIDIA DIANA', 'ROSA MERCEDES', 'SILVIA JANET'];
    const apellidosPaternos = ['QUISPE', 'RODRÍGUEZ', 'ALVARADO', 'FLORES', 'GARCÍA', 'VILLANUEVA', 'CRUZ', 'PALOMINO', 'HUAMÁN', 'ZAVALA', 'MEDRANO'];
    const apellidosMaternos = ['CHÁVEZ', 'ROJAS', 'HERRERA', 'MEDINA', 'VARGAS', 'PANDURO', 'ZEVALLOS', 'DÍAZ', 'SALAZAR', 'CORDOVA', 'BENITES'];
    const estadosCiviles = ['SOLTERO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIUDO(A)'];

    const departamentos = ['LIMA', 'AREQUIPA', 'CUSCO', 'LA LIBERTAD', 'PIURA', 'JUNÍN', 'ANCASH', 'PUNO'];
    const distritosPorDepto: Record<string, string[]> = {
      LIMA: ['JESÚS MARÍA', 'SAN ISIDRO', 'MIRAFLORES', 'LINCE', 'SANTIAGO DE SURCO'],
      AREQUIPA: ['YANAHUARA', 'CAYMA', 'CERRO COLORADO', 'SABANDÍA'],
      CUSCO: ['SANTIAGO', 'WANCHAQ', 'SAN SEBASTIÁN', 'SAN JERÓNIMO'],
      'LA LIBERTAD': ['TRUJILLO', 'VICTOR LARCO', 'EL PORVENIR', 'LAREDO'],
      PIURA: ['CASTILLA', 'CATACAOS', 'VEINTISÉIS DE OCTUBRE', 'SULLANA'],
      'JUNÍN': ['HUANCAYO', 'EL TAMBO', 'CHILCA', 'TARMA'],
      ANCASH: ['HUARAZ', 'CHIMBOTE', 'NUEVO CHIMBOTE', 'CASMA'],
      PUNO: ['JULIACA', 'PUNO', 'ILAVE', 'AYAVIRI'],
    };

    const nombresSim = isFemenino
      ? nombresFemeninos[seed % nombresFemeninos.length]
      : nombresMasculinos[seed % nombresMasculinos.length];
    const apePatSim = apellidosPaternos[(seed + 3) % apellidosPaternos.length];
    const apeMatSim = apellidosMaternos[(seed + 7) % apellidosMaternos.length];
    const rawCivil = estadosCiviles[seed % estadosCiviles.length];
    const estCivilSim = isFemenino ? rawCivil.replace('(A)', 'A') : rawCivil.replace('(A)', 'O');

    const deptoElegido = departamentos[seed % departamentos.length];
    const distritosElegibles = distritosPorDepto[deptoElegido];
    const distritoSim = distritosElegibles[(seed + 2) % distritosElegibles.length];
    const direccionSim = `AV. PROLONGACIÓN ${distritoSim} NRO. ${100 + (seed % 800)}`;
    const ubigeoSim = obtenerUbigeoTextoSimulado(seed);

    const edadSim = 22 + (seed % 40);
    const anioNac = 2026 - edadSim;
    const mesNac = String(1 + (seed % 12)).padStart(2, '0');
    const diaNac = String(1 + (seed % 28)).padStart(2, '0');

    const userGenerado = this.generarUsuarioUnico(nombresSim, apePatSim, apeMatSim, dni);

    const datos: DatosReniec = {
      apePat: toTitleCase(apePatSim),
      apeMat: toTitleCase(apeMatSim),
      nombres: toTitleCase(nombresSim),
      estCivil: toTitleCase(estCivilSim),
      direccion: toTitleCase(`${direccionSim} - ${deptoElegido}`),
      ubigeo: ubigeoSim,
      restricciones: 'Ninguna (Registro Vigente)',
      fechaNac: `${diaNac}/${mesNac}/${anioNac}`,
      sexo: isFemenino ? 'Femenino' : 'Masculino',
      edad: `${isFemenino ? (seed % 45) + 21 : edadSim} Años`,
      celularSugerido: '9' + String(10000000 + (seed % 89999999)),
      userGenerado,
      correoSugerido: `${userGenerado}@midagri.gob.pe`,
    };
    return of(datos).pipe(delay(1000));
  }

  /** Derivación de OPA por unidad responsable (heurística del prototipo). */
  derivarOpa(unidad: string): string {
    if (
      unidad.includes('Puyango') || unidad.includes('Putumayo') || unidad.includes('Compensaciones') ||
      unidad.includes('Asociatividad') || unidad.includes('Desarrollo Productivo')
    ) return 'OGTI';
    if (
      unidad.includes('Titicaca') || unidad.includes('Jequetepeque') || unidad.includes('Sierra') ||
      unidad.includes('Jaén') || unidad.includes('Huallaga')
    ) return 'OPP';
    if (
      unidad.includes('Agua') || unidad.includes('Sanidad') || unidad.includes('Innovación') ||
      unidad.includes('Forestal') || unidad.includes('Autoridad Nacional')
    ) return 'ANA';
    return 'SEDE CENTRAL';
  }
}
