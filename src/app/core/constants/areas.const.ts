// Listado oficial de áreas usuarias MIDAGRI (migrado del original).

export interface Area {
  code: string;
  name: string;
}

export const AREAS: Area[] = [
  { code: 'PSI', name: 'PSI' },
  { code: 'UEFSA', name: 'UEFSA' },
  { code: '2328744', name: '2328744 - AGRORURAL 1' },
  { code: '2308865', name: '2308865 - AGRORURAL 2' },
  { code: '2643338', name: '2643338 - AGRORURAL 3' },
  { code: '2474757', name: '2474757 - AGRORURAL 4' },
  { code: '0000000', name: '0000000 - AGRORURAL 5' },
  { code: '5006064', name: '5006064 - AGRORURAL 6' },
  { code: '2502175', name: '2502175 - AGRORURAL 7' },
  { code: '2516185', name: '2516185 - AGRORURAL 8' },
  { code: '2503915', name: '2503915 - AGRORURAL 9' },
  { code: '2436681', name: '2436681 - AGRORURAL 10' },
  { code: '2437700', name: '2437700 - AGRORURAL 11' },
  { code: 'PEBLT', name: 'PEBLT' },
  { code: 'PEBPT', name: 'PEBPT' },
  { code: 'PEAH', name: 'PEAH' },
  { code: 'PEJSIB', name: 'PEJSIB' },
  { code: 'PEJEZA', name: 'PEJEZA' },
  { code: 'PEBDICP', name: 'PEBDICP' },
  { code: 'PROVRAEM', name: 'PROVRAEM' },
  { code: 'PEDA-MAALC', name: 'PEDA MAALC' },
  { code: 'PEPP', name: 'PEPP' },
  { code: '5004212', name: '5004212 – A' },
  { code: '5004189', name: '5004189 – B' },
  { code: '5004413', name: '5004413 – C' },
  { code: '5004420', name: '5004420 – D' },
];

export const getArea = (code: string): Area =>
  AREAS.find((a) => a.code === code) ?? AREAS[0];
