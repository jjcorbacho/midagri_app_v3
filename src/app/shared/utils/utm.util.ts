// Conversión WGS84 lng/lat → UTM (fórmulas estándar).
// Suficiente para Perú (zonas 17S / 18S / 19S).

const a = 6378137.0; // semi-eje mayor WGS84
const f = 1 / 298.257223563;
const k0 = 0.9996;
const e2 = f * (2 - f);
const ePrime2 = e2 / (1 - e2);

export interface UTMResult {
  zone: string; // e.g. "18S"
  easting: number;
  northing: number;
  zoneNumber: number;
  hemisphere: 'N' | 'S';
}

export function lngLatToUTM(lng: number, lat: number): UTMResult {
  const zoneNumber = Math.floor((lng + 180) / 6) + 1;
  const hemisphere: 'N' | 'S' = lat < 0 ? 'S' : 'N';
  const lambda = (lng * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const lambda0 = (((zoneNumber - 1) * 6 - 180 + 3) * Math.PI) / 180;

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = ePrime2 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lambda - lambda0);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));

  const easting =
    k0 *
      N *
      (A +
        ((1 - T + C) * A ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * ePrime2) * A ** 5) / 120) +
    500000.0;

  let northing =
    k0 *
    (M +
      N *
        Math.tan(phi) *
        (A ** 2 / 2 +
          ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 +
          ((61 - 58 * T + T ** 2 + 600 * C - 330 * ePrime2) * A ** 6) / 720));

  if (hemisphere === 'S') northing += 10000000.0;

  return {
    zone: `${zoneNumber}${hemisphere}`,
    easting,
    northing,
    zoneNumber,
    hemisphere,
  };
}
