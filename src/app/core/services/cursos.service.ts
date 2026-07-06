import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Curso, EstadoCurso, ObservacionItem } from '../models/curso.model';
import { CURSOS_INICIALES } from '../constants/mock-data.const';

/**
 * Servicio de cursos (capacitaciones / asistencias técnicas).
 *
 * ⚠ SIMULADO: mantiene el estado en memoria con Signals.
 * El equipo backend debe reemplazar el cuerpo de cada método por la
 * llamada HttpClient correspondiente (contrato sugerido en cada método)
 * y actualizar el signal con la respuesta.
 */
@Injectable({ providedIn: 'root' })
export class CursosService {
  private readonly _cursos = signal<Curso[]>([...CURSOS_INICIALES]);
  readonly cursos = this._cursos.asReadonly();

  /** GET /cursos?area={area} */
  getByArea(area: string): Observable<Curso[]> {
    return of(this._cursos().filter((c) => c.area === area)).pipe(delay(150));
  }

  /** GET /cursos/{id} */
  getById(id: string): Curso | undefined {
    return this._cursos().find((c) => c.id === id);
  }

  /** POST /cursos — devuelve el registro creado con su id. */
  create(curso: Omit<Curso, 'id'>): Curso {
    const nuevo: Curso = { ...curso, id: String(Date.now()) };
    this._cursos.update((prev) => [nuevo, ...prev]);
    return nuevo;
  }

  /** PUT /cursos/{id} */
  update(id: string, patch: Partial<Curso>): void {
    this._cursos.update((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  /** PATCH /cursos/{id}/estado — cambia estado y anexa observación al historial. */
  updateEstado(id: string, estado: EstadoCurso, observacion?: string): void {
    this._cursos.update((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const historial: ObservacionItem[] | undefined = observacion
          ? [
              ...(c.observacionesHistorial ?? []),
              {
                fecha: new Date().toLocaleDateString('es-PE'),
                descripcion: observacion,
                autor: 'ADMIN_DZ',
              },
            ]
          : c.observacionesHistorial;
        return { ...c, estado, observacionesHistorial: historial };
      }),
    );
  }

  /** DELETE /cursos/{id} */
  delete(id: string): void {
    this._cursos.update((prev) => prev.filter((c) => c.id !== id));
  }

  /** Ajuste interno del contador de participantes (denormalizado). */
  adjustParticipantes(cursoId: string, deltaOrFn: number): void {
    this._cursos.update((prev) =>
      prev.map((c) =>
        c.id === cursoId
          ? { ...c, participantes: Math.max(0, (c.participantes ?? 0) + deltaOrFn) }
          : c,
      ),
    );
  }
}
