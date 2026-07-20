import { Injectable, signal } from '@angular/core';

/**
 * Tema visual conmutable de la plataforma.
 * `id` vacío representa el tema institucional MIDAGRI (tokens base de
 * src/styles.css); los demás aplican `data-theme` sobre <html> y
 * redefinen los tokens de color del design system en tiempo real.
 */
export interface TemaVisual {
  /** Slug usado como valor de `data-theme` ('' = institucional, sin atributo). */
  id: string;
  nombre: string;
  descripcion: string;
  /** Vista previa de la regla 60-30-10: [principal, secundario, acento]. */
  colores: [string, string, string];
}

export const TEMAS_VISUALES: TemaVisual[] = [
  {
    id: 'naturaleza-viva',
    nombre: 'Naturaleza Viva',
    descripcion: 'Azul agua, teal y verdes vivos. Biodiversidad y desarrollo sostenible.',
    colores: ['#22577A', '#38A3A5', '#80ED99'],
  },
  {
    id: 'innovacion-rural',
    nombre: 'Innovación Rural',
    descripcion: 'Celestes de agua con azul profundo. Digitalización y modernización del agro.',
    colores: ['#1B4965', '#5FA8D3', '#BEE9E8'],
  },
];

const TEMA_STORAGE_KEY = 'sodega.tema';
/** Tema aplicado cuando no existe una preferencia guardada válida. */
const TEMA_POR_DEFECTO = 'naturaleza-viva';

/**
 * Apariencia de la plataforma (solo presentación).
 * Aplica el tema elegido sobre <html data-theme> y lo persiste en
 * localStorage para conservarlo entre sesiones. No interviene en la
 * lógica de negocio ni en la autenticación.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _temaId = signal('');
  readonly temaId = this._temaId.asReadonly();
  readonly temas = TEMAS_VISUALES;

  constructor() {
    let guardado = '';
    try {
      guardado = localStorage.getItem(TEMA_STORAGE_KEY) ?? '';
    } catch {
      /* Almacenamiento no disponible: se usa el tema por defecto. */
    }
    // Preferencias de temas retirados caen automáticamente al tema por defecto.
    this.aplicar(TEMAS_VISUALES.some((t) => t.id === guardado) ? guardado : TEMA_POR_DEFECTO);
  }

  /** Cambia el tema en tiempo real y persiste la elección. */
  seleccionar(id: string): void {
    if (!TEMAS_VISUALES.some((t) => t.id === id)) return;
    this.aplicar(id);
    try {
      localStorage.setItem(TEMA_STORAGE_KEY, id);
    } catch {
      /* Sin persistencia disponible: el tema aplica solo a la sesión actual. */
    }
  }

  private aplicar(id: string): void {
    this._temaId.set(id);
    document.documentElement.setAttribute('data-theme', id);
  }
}
