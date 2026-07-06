// Mapa simplificado del Perú.
// Contorno del país como <path> y bboxes lng/lat aproximados de cada región
// para hacer zoom cuando el usuario elige región en la cascada de "Ubicación".
//
// Coordenadas de referencia del país (WGS84):
//   lng ∈ [-81.5, -68.5]  → ancho ~13°
//   lat ∈ [-18.5,   0.0]  → alto  ~18.5°
//
// El SVG usa viewBox proporcional a esas dimensiones (1° = 20 unidades).

export const PERU_LNG_MIN = -81.5;
export const PERU_LNG_MAX = -68.5;
export const PERU_LAT_MIN = -18.5;
export const PERU_LAT_MAX = 0.5;

export const SVG_SCALE = 20; // unidades SVG por grado
export const SVG_WIDTH = (PERU_LNG_MAX - PERU_LNG_MIN) * SVG_SCALE; // 260
export const SVG_HEIGHT = (PERU_LAT_MAX - PERU_LAT_MIN) * SVG_SCALE; // 380

export function lngLatToSvg(lng: number, lat: number): { x: number; y: number } {
  return {
    x: (lng - PERU_LNG_MIN) * SVG_SCALE,
    y: (PERU_LAT_MAX - lat) * SVG_SCALE,
  };
}

export function svgToLngLat(x: number, y: number): { lng: number; lat: number } {
  return {
    lng: x / SVG_SCALE + PERU_LNG_MIN,
    lat: PERU_LAT_MAX - y / SVG_SCALE,
  };
}

// Contorno muy simplificado del Perú (silueta reconocible, no cartográficamente exacta).
const outlineLngLat: [number, number][] = [
  [-81.3, -4.5],
  [-80.8, -3.4],
  [-80.2, -3.5],
  [-79.5, -4.4],
  [-78.7, -4.8],
  [-78.2, -3.4],
  [-77.5, -2.6],
  [-76.6, -2.5],
  [-75.5, -4.0],
  [-74.3, -4.3],
  [-73.2, -3.7],
  [-72.0, -2.3],
  [-70.9, -2.4],
  [-70.1, -4.2],
  [-70.7, -6.0],
  [-71.2, -8.0],
  [-71.9, -9.9],
  [-72.7, -11.1],
  [-73.4, -12.6],
  [-72.4, -13.8],
  [-71.0, -14.6],
  [-69.7, -14.2],
  [-69.0, -15.7],
  [-69.4, -17.4],
  [-70.4, -18.3],
  [-71.4, -17.6],
  [-72.6, -17.0],
  [-74.0, -15.9],
  [-75.5, -15.1],
  [-76.3, -14.2],
  [-76.8, -12.6],
  [-77.4, -11.2],
  [-78.4, -9.4],
  [-79.2, -8.0],
  [-79.8, -6.9],
  [-80.9, -6.1],
  [-81.2, -5.0],
];

function outlineToPath(pts: [number, number][]): string {
  return (
    pts
      .map(([lng, lat], i) => {
        const p = lngLatToSvg(lng, lat);
        return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
}

export const PERU_OUTLINE_D = outlineToPath(outlineLngLat);

// BBoxes aproximados en lng/lat por región (padding leve incluido).
// Solo se incluyen las regiones presentes en el catálogo UBIGEO + fallback país.
// [lngMin, latMin, lngMax, latMax]
export const REGION_LNGLAT_BBOX: Record<string, [number, number, number, number]> = {
  'Apurímac':     [-73.6, -14.8, -72.1, -13.1],
  'Cusco':        [-73.6, -15.4, -70.4, -11.2],
  'Huancavelica': [-75.9, -14.9, -74.4, -11.9],
  'Cajamarca':    [-79.7, -8.0, -77.4, -4.6],
};

export function bboxToSvgRect(bbox: [number, number, number, number]) {
  const [lngMin, latMin, lngMax, latMax] = bbox;
  const tl = lngLatToSvg(lngMin, latMax);
  const br = lngLatToSvg(lngMax, latMin);
  return {
    x: tl.x,
    y: tl.y,
    width: br.x - tl.x,
    height: br.y - tl.y,
  };
}
