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
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly _usuarios = signal<UsuarioSodega[]>([
    {
      id: '1',
      dni: '45893012',
      nombres: 'Carlos',
      apePat: 'Candelaria',
      apeMat: 'Burgos',
      estCivil: 'Soltero',
      profesion: 'Especialista TI',
      direccion: 'Jr. Lambayeque 450',
      ubigeo: '150101',
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
    },
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

  /** Admin General ve todo; el resto ve sus registros y los que creó. */
  registrosVisibles(perfilActivo: Perfil, userGenActivo: string): UsuarioSodega[] {
    if (perfilActivo === 'Administrador General') return this._usuarios();
    return this._usuarios().filter(
      (u) => u.userGen === userGenActivo || u.creadoPor === userGenActivo,
    );
  }

  /** Perfiles que el perfil activo puede registrar (jerarquía del prototipo). */
  perfilesRegistrables(perfilActivo: Perfil): Perfil[] {
    return PERFILES.filter((p) => {
      // El Admin General puede registrar otro Admin General; el resto no registra su propio perfil.
      if (p === perfilActivo && perfilActivo !== 'Administrador General') return false;
      if (perfilActivo === 'Jefe de Área' && p === 'Administrador General') return false;
      if (
        perfilActivo === 'Administrador Unidad Organizacional' &&
        (p === 'Jefe de Área' || p === 'Administrador General')
      ) return false;
      if (
        perfilActivo === 'Administrador DZ_Cap_Asit.' &&
        (p === 'Administrador Unidad Organizacional' || p === 'Jefe de Área' || p === 'Administrador General')
      ) return false;
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
    const ubigeoSim = String(150101 + (seed % 9999));

    const edadSim = 22 + (seed % 40);
    const anioNac = 2026 - edadSim;
    const mesNac = String(1 + (seed % 12)).padStart(2, '0');
    const diaNac = String(1 + (seed % 28)).padStart(2, '0');

    const primerNombreLetra = nombresSim.split(' ')[0].substring(0, 1).toLowerCase();
    const apellidoPatLimpio = apePatSim.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const userGenerado = primerNombreLetra + apellidoPatLimpio;

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
