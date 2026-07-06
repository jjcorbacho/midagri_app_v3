import { Injectable, computed, signal } from '@angular/core';
import { AREAS, getArea } from '../constants/areas.const';

const AREA_KEY = 'midagri.area';

/** Área usuaria activa (selector del header). Persistida en sessionStorage. */
@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly _currentArea = signal<string>(this.restore());

  readonly currentArea = this._currentArea.asReadonly();
  readonly area = computed(() => getArea(this._currentArea()));

  private restore(): string {
    try {
      const area = sessionStorage.getItem(AREA_KEY);
      if (area && AREAS.some((a) => a.code === area)) return area;
    } catch { /* noop */ }
    return AREAS[0].code;
  }

  setCurrentArea(code: string): void {
    this._currentArea.set(code);
    try {
      sessionStorage.setItem(AREA_KEY, code);
    } catch { /* noop */ }
  }
}
