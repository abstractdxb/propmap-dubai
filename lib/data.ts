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
  type: 'sale' | 'rent' | 'mixed';
  avgPsf: number;
  totalTx: number;
  lastSale: number;
  yearBuilt: number;
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
  { name: 'Downtown Dubai',  developer: 'Emaar',             lat: 25.1972, lng: 55.2744, psf: 2450, rentalYield: 6.1, color: '#3b82f6' },
  { name: 'Dubai Marina',    developer: 'Various',           lat: 25.0827, lng: 55.1407, psf: 1920, rentalYield: 6.8, color: '#10b981' },
  { name: 'Palm Jumeirah',   developer: 'Nakheel',           lat: 25.1124, lng: 55.1390, psf: 3180, rentalYield: 5.2, color: '#f59e0b' },
  { name: 'Business Bay',    developer: 'Damac / Emaar',     lat: 25.1853, lng: 55.2624, psf: 1650, rentalYield: 7.1, color: '#8b5cf6' },
  { name: 'JBR',             developer: 'Dubai Properties',  lat: 25.0769, lng: 55.1324, psf: 1780, rentalYield: 6.9, color: '#06b6d4' },
  { name: 'JVC',             developer: 'Nakheel',           lat: 25.0567, lng: 55.2065, psf: 980,  rentalYield: 8.4, color: '#f97316' },
  { name: 'DIFC',            developer: 'Government',        lat: 25.2048, lng: 55.2780, psf: 2800, rentalYield: 5.8, color: '#ec4899' },
  { name: 'Arabian Ranches', developer: 'Emaar',             lat: 25.0548, lng: 55.2706, psf: 1380, rentalYield: 5.5, color: '#84cc16' },
];

// ─── Buildings ───────────────────────────────────────────────────────────────

export const BUILDINGS: Building[] = [
  // Downtown
  { id: 1,  name: 'Burj Khalifa Residences',     community: 'Downtown Dubai', developer: 'Emaar',            floors: 163, units: 900,  lat: 25.1972, lng: 55.2744, type: 'mixed', avgPsf: 3200, totalTx: 247, lastSale: 8500000,  yearBuilt: 2010 },
  { id: 2,  name: 'Address Downtown',             community: 'Downtown Dubai', developer: 'Emaar',            floors: 63,  units: 626,  lat: 25.1930, lng: 55.2720, type: 'mixed', avgPsf: 2850, totalTx: 189, lastSale: 4200000,  yearBuilt: 2008 },
  { id: 3,  name: '29 Burj Boulevard',            community: 'Downtown Dubai', developer: 'Emaar',            floors: 45,  units: 504,  lat: 25.1950, lng: 55.2760, type: 'sale',  avgPsf: 2400, totalTx: 312, lastSale: 2100000,  yearBuilt: 2014 },
  // Marina
  { id: 4,  name: 'Princess Tower',               community: 'Dubai Marina',   developer: 'Damac',            floors: 101, units: 763,  lat: 25.0840, lng: 55.1430, type: 'mixed', avgPsf: 1950, totalTx: 418, lastSale: 1800000,  yearBuilt: 2012 },
  { id: 5,  name: 'Marina Gate',                  community: 'Dubai Marina',   developer: 'Select Group',     floors: 65,  units: 530,  lat: 25.0820, lng: 55.1400, type: 'mixed', avgPsf: 2100, totalTx: 203, lastSale: 2350000,  yearBuilt: 2018 },
  // Palm
  { id: 6,  name: 'Atlantis The Royal',           community: 'Palm Jumeirah',  developer: 'Kerzner',          floors: 37,  units: 795,  lat: 25.1300, lng: 55.1170, type: 'sale',  avgPsf: 4200, totalTx: 87,  lastSale: 12000000, yearBuilt: 2023 },
  { id: 7,  name: 'One Palm',                     community: 'Palm Jumeirah',  developer: 'Omniyat',          floors: 22,  units: 90,   lat: 25.1100, lng: 55.1320, type: 'sale',  avgPsf: 5800, totalTx: 43,  lastSale: 25000000, yearBuilt: 2019 },
  // Business Bay
  { id: 8,  name: 'Executive Towers',             community: 'Business Bay',   developer: 'Business Bay LLC', floors: 40,  units: 1748, lat: 25.1870, lng: 55.2590, type: 'rent',  avgPsf: 1600, totalTx: 521, lastSale: 950000,   yearBuilt: 2011 },
  { id: 9,  name: 'Damac Maison Canal Views',     community: 'Business Bay',   developer: 'Damac',            floors: 36,  units: 340,  lat: 25.1840, lng: 55.2650, type: 'mixed', avgPsf: 1720, totalTx: 167, lastSale: 1400000,  yearBuilt: 2016 },
  // JVC
  { id: 10, name: 'Bloom Towers',                 community: 'JVC',            developer: 'Bloom Properties', floors: 30,  units: 650,  lat: 25.0580, lng: 55.2080, type: 'mixed', avgPsf: 970,  totalTx: 289, lastSale: 680000,   yearBuilt: 2019 },
  { id: 11, name: 'Belgravia Heights',            community: 'JVC',            developer: 'Ellington',        floors: 28,  units: 298,  lat: 25.0550, lng: 55.2050, type: 'sale',  avgPsf: 1050, totalTx: 134, lastSale: 820000,   yearBuilt: 2021 },
  // DIFC
  { id: 12, name: 'Index Tower',                  community: 'DIFC',           developer: 'Union Properties', floors: 80,  units: 478,  lat: 25.2060, lng: 55.2800, type: 'mixed', avgPsf: 2650, totalTx: 98,  lastSale: 3800000,  yearBuilt: 2011 },
];

// ─── Transaction generator (dummy data) ──────────────────────────────────────

export function generateTransactions(building: Building, count: number): Transaction[] {
  const types: Transaction['type'][] = ['sale', 'sale', 'rent', 'mortgage'];
  const beds = ['Studio', '1BR', '2BR', '3BR', 'Penthouse'];
  const nationalities = ['UAE', 'British', 'Indian', 'Russian', 'Chinese', 'German', 'American', 'French'];

  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const bed = beds[Math.floor(Math.random() * beds.length)];
    const area = type === 'rent' ? Math.round(600 + Math.random() * 1200) : Math.round(700 + Math.random() * 2000);
    const price = type === 'rent'
      ? Math.round(40000 + Math.random() * 180000)
      : Math.round(building.avgPsf * area * (0.85 + Math.random() * 0.3));

    const d = new Date(2023, 0, 1);
    d.setDate(d.getDate() + Math.floor(Math.random() * 730));

    transactions.push({
      type,
      bed,
      area,
      price,
      psf: type === 'rent' ? null : Math.round(price / area),
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      reg: 'DLD-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
