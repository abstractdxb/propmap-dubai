// ─── Developer colour palette ────────────────────────────────────────────────

export const DEVELOPER_COLORS: Record<string, string> = {
  Emaar:             '#3b82f6',   // blue
  Damac:             '#8b5cf6',   // purple
  Nakheel:           '#10b981',   // green
  Meraas:            '#f97316',   // orange
  Sobha:             '#ec4899',   // pink
  Aldar:             '#06b6d4',   // cyan
  Ellington:         '#f59e0b',   // amber
  'Select Group':    '#84cc16',   // lime
  'Union Properties':'#ef4444',   // red
  'Dubai Properties':'#a78bfa',   // violet
  'Omniyat':         '#fbbf24',   // yellow
  'Kerzner':         '#fb7185',   // rose
  Other:             '#64748b',   // slate
};

export function devColor(developer: string): string {
  return DEVELOPER_COLORS[developer] ?? DEVELOPER_COLORS.Other;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Community {
  name: string;
  developer: string;
  lat: number;
  lng: number;
  psf: number;
  rentalYield: number;
  color: string;
}

export interface Building {
  id: number;
  name: string;
  community: string;
  developer: string;
  floors: number;
  units: number;
  lat: number;
  lng: number;
  /** dominant transaction type for marker colour */
  txType: 'sale' | 'rent' | 'mixed';
  avgPsf: number;
  totalTx: number;
  lastSale: number;
  yearBuilt: number;
  propType: 'apartment' | 'villa' | 'townhouse' | 'office' | 'mixed';
}

export interface Transaction {
  type: 'sale' | 'rent' | 'mortgage';
  bed: string;
  area: number;
  price: number;
  psf: number | null;
  date: string;
  reg: string;
  nationality: string;
}

// ─── Communities ─────────────────────────────────────────────────────────────

export const COMMUNITIES: Community[] = [
  { name: 'Downtown Dubai',   developer: 'Emaar',            lat: 25.1972, lng: 55.2744, psf: 2450, rentalYield: 6.1, color: '#3b82f6' },
  { name: 'Dubai Marina',     developer: 'Various',          lat: 25.0827, lng: 55.1407, psf: 1920, rentalYield: 6.8, color: '#10b981' },
  { name: 'Palm Jumeirah',    developer: 'Nakheel',          lat: 25.1124, lng: 55.1390, psf: 3180, rentalYield: 5.2, color: '#f59e0b' },
  { name: 'Business Bay',     developer: 'Damac / Emaar',    lat: 25.1853, lng: 55.2624, psf: 1650, rentalYield: 7.1, color: '#8b5cf6' },
  { name: 'JBR',              developer: 'Dubai Properties', lat: 25.0769, lng: 55.1324, psf: 1780, rentalYield: 6.9, color: '#06b6d4' },
  { name: 'JVC',              developer: 'Nakheel',          lat: 25.0567, lng: 55.2065, psf:  980, rentalYield: 8.4, color: '#f97316' },
  { name: 'DIFC',             developer: 'Government',       lat: 25.2048, lng: 55.2780, psf: 2800, rentalYield: 5.8, color: '#ec4899' },
  { name: 'Arabian Ranches',  developer: 'Emaar',            lat: 25.0548, lng: 55.2706, psf: 1380, rentalYield: 5.5, color: '#84cc16' },
  { name: 'City Walk',        developer: 'Meraas',           lat: 25.1995, lng: 55.2414, psf: 2100, rentalYield: 6.2, color: '#f97316' },
  { name: 'Bluewaters',       developer: 'Meraas',           lat: 25.0833, lng: 55.1227, psf: 2650, rentalYield: 5.9, color: '#f97316' },
  { name: 'Creek Harbour',    developer: 'Emaar',            lat: 25.2048, lng: 55.3219, psf: 1850, rentalYield: 6.5, color: '#3b82f6' },
  { name: 'Dubai Hills',      developer: 'Emaar',            lat: 25.1100, lng: 55.2446, psf: 1950, rentalYield: 6.0, color: '#3b82f6' },
];

// ─── Buildings (30 across Dubai) ─────────────────────────────────────────────

export const BUILDINGS: Building[] = [
  // Downtown Dubai – Emaar
  { id:  1, name: 'Burj Khalifa Residences',      community: 'Downtown Dubai',  developer: 'Emaar',            floors: 163, units:  900, lat: 25.1972, lng: 55.2744, txType: 'mixed', avgPsf: 3200, totalTx: 247, lastSale: 8500000,  yearBuilt: 2010, propType: 'apartment' },
  { id:  2, name: 'Address Downtown',              community: 'Downtown Dubai',  developer: 'Emaar',            floors:  63, units:  626, lat: 25.1930, lng: 55.2720, txType: 'mixed', avgPsf: 2850, totalTx: 189, lastSale: 4200000,  yearBuilt: 2008, propType: 'apartment' },
  { id:  3, name: '29 Burj Boulevard Tower 1',    community: 'Downtown Dubai',  developer: 'Emaar',            floors:  45, units:  504, lat: 25.1958, lng: 55.2758, txType: 'sale',  avgPsf: 2400, totalTx: 312, lastSale: 2100000,  yearBuilt: 2014, propType: 'apartment' },
  { id:  4, name: 'Il Primo',                     community: 'Downtown Dubai',  developer: 'Emaar',            floors:  77, units:  119, lat: 25.1950, lng: 55.2735, txType: 'sale',  avgPsf: 3800, totalTx:  61, lastSale:12000000,  yearBuilt: 2022, propType: 'apartment' },

  // Dubai Marina
  { id:  5, name: 'Princess Tower',               community: 'Dubai Marina',    developer: 'Damac',            floors: 101, units:  763, lat: 25.0840, lng: 55.1430, txType: 'mixed', avgPsf: 1950, totalTx: 418, lastSale: 1800000,  yearBuilt: 2012, propType: 'apartment' },
  { id:  6, name: 'Marina Gate',                  community: 'Dubai Marina',    developer: 'Select Group',     floors:  65, units:  530, lat: 25.0820, lng: 55.1400, txType: 'mixed', avgPsf: 2100, totalTx: 203, lastSale: 2350000,  yearBuilt: 2018, propType: 'apartment' },
  { id:  7, name: 'Sulafa Tower',                 community: 'Dubai Marina',    developer: 'Damac',            floors:  75, units:  646, lat: 25.0810, lng: 55.1380, txType: 'rent',  avgPsf: 1700, totalTx: 289, lastSale: 1200000,  yearBuilt: 2010, propType: 'apartment' },

  // Palm Jumeirah
  { id:  8, name: 'Atlantis The Royal Residences',community: 'Palm Jumeirah',   developer: 'Kerzner',          floors:  37, units:  795, lat: 25.1300, lng: 55.1170, txType: 'sale',  avgPsf: 4200, totalTx:  87, lastSale:12000000,  yearBuilt: 2023, propType: 'apartment' },
  { id:  9, name: 'One Palm',                     community: 'Palm Jumeirah',   developer: 'Omniyat',          floors:  22, units:   90, lat: 25.1100, lng: 55.1320, txType: 'sale',  avgPsf: 5800, totalTx:  43, lastSale:25000000,  yearBuilt: 2019, propType: 'apartment' },
  { id: 10, name: 'Shoreline Apartments',         community: 'Palm Jumeirah',   developer: 'Nakheel',          floors:  10, units: 2000, lat: 25.1070, lng: 55.1390, txType: 'mixed', avgPsf: 2100, totalTx: 521, lastSale: 3500000,  yearBuilt: 2007, propType: 'apartment' },

  // Business Bay
  { id: 11, name: 'Executive Towers',             community: 'Business Bay',    developer: 'Damac',            floors:  40, units: 1748, lat: 25.1870, lng: 55.2590, txType: 'rent',  avgPsf: 1600, totalTx: 521, lastSale:  950000,  yearBuilt: 2011, propType: 'apartment' },
  { id: 12, name: 'Damac Maison Canal Views',     community: 'Business Bay',    developer: 'Damac',            floors:  36, units:  340, lat: 25.1840, lng: 55.2650, txType: 'mixed', avgPsf: 1720, totalTx: 167, lastSale: 1400000,  yearBuilt: 2016, propType: 'apartment' },
  { id: 13, name: 'Paramount Tower Hotel',        community: 'Business Bay',    developer: 'Damac',            floors:  64, units:  823, lat: 25.1820, lng: 55.2600, txType: 'mixed', avgPsf: 1850, totalTx: 201, lastSale: 1900000,  yearBuilt: 2018, propType: 'apartment' },

  // JBR
  { id: 14, name: 'Murjan Tower',                 community: 'JBR',             developer: 'Dubai Properties', floors:  45, units:  516, lat: 25.0780, lng: 55.1340, txType: 'mixed', avgPsf: 1800, totalTx: 298, lastSale: 2200000,  yearBuilt: 2007, propType: 'apartment' },
  { id: 15, name: 'Sadaf Tower',                  community: 'JBR',             developer: 'Dubai Properties', floors:  45, units:  460, lat: 25.0760, lng: 55.1310, txType: 'rent',  avgPsf: 1650, totalTx: 187, lastSale: 1800000,  yearBuilt: 2007, propType: 'apartment' },

  // JVC
  { id: 16, name: 'Bloom Towers',                 community: 'JVC',             developer: 'Ellington',        floors:  30, units:  650, lat: 25.0580, lng: 55.2080, txType: 'mixed', avgPsf:  970, totalTx: 289, lastSale:  680000,  yearBuilt: 2019, propType: 'apartment' },
  { id: 17, name: 'Belgravia Heights',            community: 'JVC',             developer: 'Ellington',        floors:  28, units:  298, lat: 25.0550, lng: 55.2050, txType: 'sale',  avgPsf: 1050, totalTx: 134, lastSale:  820000,  yearBuilt: 2021, propType: 'apartment' },
  { id: 18, name: 'Safi Apartments',              community: 'JVC',             developer: 'Nakheel',          floors:   5, units:  590, lat: 25.0610, lng: 55.2100, txType: 'mixed', avgPsf:  850, totalTx: 376, lastSale:  550000,  yearBuilt: 2019, propType: 'apartment' },

  // DIFC
  { id: 19, name: 'Index Tower',                  community: 'DIFC',            developer: 'Union Properties', floors:  80, units:  478, lat: 25.2060, lng: 55.2800, txType: 'mixed', avgPsf: 2650, totalTx:  98, lastSale: 3800000,  yearBuilt: 2011, propType: 'apartment' },
  { id: 20, name: 'Gate Precinct',                community: 'DIFC',            developer: 'Union Properties', floors:  35, units:  200, lat: 25.2045, lng: 55.2790, txType: 'sale',  avgPsf: 2900, totalTx:  54, lastSale: 5200000,  yearBuilt: 2009, propType: 'office'    },

  // Arabian Ranches – Emaar
  { id: 21, name: 'Arabian Ranches Villas Phase 1',community:'Arabian Ranches', developer: 'Emaar',            floors:   2, units:  645, lat: 25.0558, lng: 55.2706, txType: 'sale',  avgPsf: 1380, totalTx: 231, lastSale: 4500000,  yearBuilt: 2006, propType: 'villa'     },
  { id: 22, name: 'Alvorada',                     community: 'Arabian Ranches', developer: 'Emaar',            floors:   2, units:  300, lat: 25.0540, lng: 55.2720, txType: 'sale',  avgPsf: 1300, totalTx: 119, lastSale: 3900000,  yearBuilt: 2008, propType: 'villa'     },

  // City Walk – Meraas
  { id: 23, name: 'City Walk Residences',         community: 'City Walk',       developer: 'Meraas',           floors:  12, units:  278, lat: 25.1995, lng: 55.2414, txType: 'mixed', avgPsf: 2100, totalTx: 156, lastSale: 2800000,  yearBuilt: 2017, propType: 'apartment' },
  { id: 24, name: 'Bvlgari Residences',           community: 'Bluewaters',      developer: 'Meraas',           floors:   8, units:  173, lat: 25.0833, lng: 55.1227, txType: 'sale',  avgPsf: 4500, totalTx:  38, lastSale:18000000,  yearBuilt: 2019, propType: 'apartment' },
  { id: 25, name: 'Bluewaters Residences',        community: 'Bluewaters',      developer: 'Meraas',           floors:  10, units:  698, lat: 25.0850, lng: 55.1210, txType: 'mixed', avgPsf: 2600, totalTx: 189, lastSale: 4100000,  yearBuilt: 2019, propType: 'apartment' },

  // Creek Harbour – Emaar
  { id: 26, name: 'Creek Gate Tower 1',           community: 'Creek Harbour',   developer: 'Emaar',            floors:  36, units:  392, lat: 25.2048, lng: 55.3219, txType: 'mixed', avgPsf: 1850, totalTx: 201, lastSale: 2200000,  yearBuilt: 2021, propType: 'apartment' },
  { id: 27, name: 'Harbour Gate',                 community: 'Creek Harbour',   developer: 'Emaar',            floors:  33, units:  458, lat: 25.2060, lng: 55.3240, txType: 'sale',  avgPsf: 1900, totalTx: 134, lastSale: 2500000,  yearBuilt: 2022, propType: 'apartment' },

  // Dubai Hills – Emaar
  { id: 28, name: 'Dubai Hills Estate Villas',    community: 'Dubai Hills',     developer: 'Emaar',            floors:   2, units:  500, lat: 25.1100, lng: 55.2446, txType: 'sale',  avgPsf: 1950, totalTx: 302, lastSale: 6800000,  yearBuilt: 2020, propType: 'villa'     },
  { id: 29, name: 'Park Heights',                 community: 'Dubai Hills',     developer: 'Emaar',            floors:  25, units:  576, lat: 25.1120, lng: 55.2460, txType: 'mixed', avgPsf: 1800, totalTx: 187, lastSale: 1900000,  yearBuilt: 2021, propType: 'apartment' },

  // Sobha
  { id: 30, name: 'Sobha Hartland Greens',        community: 'Business Bay',    developer: 'Sobha',            floors:  19, units:  420, lat: 25.1810, lng: 55.2670, txType: 'sale',  avgPsf: 2050, totalTx: 143, lastSale: 2600000,  yearBuilt: 2022, propType: 'apartment' },
];

// ─── GeoJSON helpers ─────────────────────────────────────────────────────────

export function buildingsToGeoJSON(buildings: Building[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: buildings.map(b => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
      properties: {
        id:        b.id,
        name:      b.name,
        community: b.community,
        developer: b.developer,
        color:     devColor(b.developer),
        floors:    b.floors,
        units:     b.units,
        txType:    b.txType,
        propType:  b.propType,
        avgPsf:    b.avgPsf,
        totalTx:   b.totalTx,
        lastSale:  b.lastSale,
        yearBuilt: b.yearBuilt,
      },
    })),
  };
}

// ─── Transaction generator ────────────────────────────────────────────────────

export function generateTransactions(building: Building, count: number): Transaction[] {
  const types: Transaction['type'][] = ['sale', 'sale', 'rent', 'mortgage'];
  const beds         = ['Studio', '1BR', '2BR', '3BR', 'Penthouse'];
  const nationalities = ['UAE', 'British', 'Indian', 'Russian', 'Chinese', 'German', 'American', 'French'];

  const out: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const bed  = beds[Math.floor(Math.random() * beds.length)];
    const area = type === 'rent'
      ? Math.round(600 + Math.random() * 1200)
      : Math.round(700 + Math.random() * 2000);
    const price = type === 'rent'
      ? Math.round(40000 + Math.random() * 180000)
      : Math.round(building.avgPsf * area * (0.85 + Math.random() * 0.3));

    const d = new Date(2023, 0, 1);
    d.setDate(d.getDate() + Math.floor(Math.random() * 730));

    out.push({
      type,
      bed,
      area,
      price,
      psf:  type === 'rent' ? null : Math.round(price / area),
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      reg:  'DLD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    });
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
