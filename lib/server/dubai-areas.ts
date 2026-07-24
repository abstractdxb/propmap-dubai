export interface DubaiCommunity {
  id:       string;
  name:     string;
  dldName:  string;
  bayutId:  string;   // Bayut externalID — pre-resolved, saves API calls
  lat:      number;
  lng:      number;
  radiusKm: number;   // Approximate community radius for border circle rendering
}

export const DUBAI_COMMUNITIES: DubaiCommunity[] = [
  // ── Central / Downtown ──────────────────────────────────────────────────────
  { id: 'downtown-dubai',     name: 'Downtown Dubai',      dldName: 'DOWNTOWN DUBAI',           bayutId: '6901',  lat: 25.1972, lng: 55.2744, radiusKm: 0.55 },
  { id: 'business-bay',       name: 'Business Bay',        dldName: 'BUSINESS BAY',             bayutId: '5093',  lat: 25.1861, lng: 55.2788, radiusKm: 0.70 },
  { id: 'difc',               name: 'DIFC',                dldName: 'DIFC',                     bayutId: '5374',  lat: 25.2124, lng: 55.2789, radiusKm: 0.45 },
  { id: 'city-walk',          name: 'City Walk',           dldName: 'CITY WALK',                bayutId: '8733',  lat: 25.2058, lng: 55.2498, radiusKm: 0.40 },
  { id: 'jumeirah',           name: 'Jumeirah',            dldName: 'JUMEIRAH',                 bayutId: '5687',  lat: 25.2084, lng: 55.2395, radiusKm: 1.20 },
  { id: 'al-quoz',            name: 'Al Quoz',             dldName: 'AL QUOZ',                  bayutId: '5659',  lat: 25.1448, lng: 55.2305, radiusKm: 1.10 },
  { id: 'ras-al-khor',        name: 'Ras Al Khor',         dldName: 'RAS AL KHOR',              bayutId: '5644',  lat: 25.1937, lng: 55.3399, radiusKm: 0.80 },
  { id: 'nadd-al-sheba',      name: 'Nadd Al Sheba',       dldName: 'NADD AL SHEBA',            bayutId: '5645',  lat: 25.1695, lng: 55.3281, radiusKm: 1.20 },
  // ── Waterfront ──────────────────────────────────────────────────────────────
  { id: 'dubai-marina',       name: 'Dubai Marina',        dldName: 'DUBAI MARINA',             bayutId: '5003',  lat: 25.0807, lng: 55.1403, radiusKm: 0.70 },
  { id: 'jbr',                name: 'JBR',                 dldName: 'JUMEIRAH BEACH RESIDENCE', bayutId: '5549',  lat: 25.0754, lng: 55.1308, radiusKm: 0.50 },
  { id: 'palm-jumeirah',      name: 'Palm Jumeirah',       dldName: 'PALM JUMEIRAH',            bayutId: '5460',  lat: 25.1124, lng: 55.1390, radiusKm: 1.30 },
  { id: 'bluewaters',         name: 'Bluewaters Island',   dldName: 'BLUEWATERS ISLAND',        bayutId: '9157',  lat: 25.0746, lng: 55.1201, radiusKm: 0.35 },
  { id: 'emaar-beachfront',   name: 'Emaar Beachfront',    dldName: 'EMAAR BEACHFRONT',         bayutId: '11877', lat: 25.0770, lng: 55.1238, radiusKm: 0.40 },
  { id: 'marsa-al-arab',      name: 'Marsa Al Arab',       dldName: 'MARSA AL ARAB',            bayutId: '22931', lat: 25.1398, lng: 55.1727, radiusKm: 0.45 },
  // ── JLT / Al Sufouh ─────────────────────────────────────────────────────────
  { id: 'jlt',                name: 'JLT',                 dldName: 'JUMEIRAH LAKE TOWERS',     bayutId: '5152',  lat: 25.0697, lng: 55.1399, radiusKm: 0.75 },
  { id: 'al-sufouh',          name: 'Al Sufouh',           dldName: 'AL SUFOUH',                bayutId: '5660',  lat: 25.0962, lng: 55.1584, radiusKm: 0.70 },
  { id: 'barsha-heights',     name: 'Barsha Heights',      dldName: 'BARSHA HEIGHTS',           bayutId: '5933',  lat: 25.1049, lng: 55.1889, radiusKm: 0.65 },
  { id: 'al-barsha',          name: 'Al Barsha',           dldName: 'AL BARSHA',                bayutId: '5661',  lat: 25.1126, lng: 55.1968, radiusKm: 1.00 },
  // ── Jumeirah Villages ────────────────────────────────────────────────────────
  { id: 'jvc',                name: 'JVC',                 dldName: 'JUMEIRAH VILLAGE CIRCLE',  bayutId: '5416',  lat: 25.0569, lng: 55.2154, radiusKm: 1.20 },
  { id: 'jvt',                name: 'JVT',                 dldName: 'JUMEIRAH VILLAGE TRIANGLE',bayutId: '6893',  lat: 25.0694, lng: 55.1905, radiusKm: 0.90 },
  { id: 'jumeirah-park',      name: 'Jumeirah Park',       dldName: 'JUMEIRAH PARK',            bayutId: '5505',  lat: 25.0861, lng: 55.1584, radiusKm: 0.80 },
  { id: 'jumeirah-islands',   name: 'Jumeirah Islands',    dldName: 'JUMEIRAH ISLANDS',         bayutId: '5662',  lat: 25.0799, lng: 55.1624, radiusKm: 0.70 },
  { id: 'discovery-gardens',  name: 'Discovery Gardens',   dldName: 'DISCOVERY GARDENS',        bayutId: '5234',  lat: 25.0449, lng: 55.1465, radiusKm: 0.85 },
  { id: 'al-furjan',          name: 'Al Furjan',           dldName: 'AL FURJAN',                bayutId: '6688',  lat: 25.0304, lng: 55.1580, radiusKm: 0.95 },
  // ── Greens / Lakes / Emirates Hills ─────────────────────────────────────────
  { id: 'the-greens',         name: 'The Greens',          dldName: 'THE GREENS',               bayutId: '5246',  lat: 25.0980, lng: 55.1800, radiusKm: 0.55 },
  { id: 'the-views',          name: 'The Views',           dldName: 'THE VIEWS',                bayutId: '5258',  lat: 25.0893, lng: 55.1813, radiusKm: 0.50 },
  { id: 'the-lakes',          name: 'The Lakes',           dldName: 'THE LAKES',                bayutId: '6716',  lat: 25.0940, lng: 55.1740, radiusKm: 0.55 },
  { id: 'the-springs',        name: 'The Springs',         dldName: 'THE SPRINGS',              bayutId: '5245',  lat: 25.0908, lng: 55.1650, radiusKm: 0.60 },
  { id: 'meadows',            name: 'The Meadows',         dldName: 'MEADOWS',                  bayutId: '5273',  lat: 25.1001, lng: 55.1668, radiusKm: 0.65 },
  { id: 'emirates-hills',     name: 'Emirates Hills',      dldName: 'EMIRATES HILLS',           bayutId: '6703',  lat: 25.0987, lng: 55.1560, radiusKm: 0.90 },
  // ── Dubai Hills / MBR ───────────────────────────────────────────────────────
  { id: 'dubai-hills-estate', name: 'Dubai Hills Estate',  dldName: 'DUBAI HILLS ESTATE',       bayutId: '8288',  lat: 25.1097, lng: 55.2375, radiusKm: 1.80 },
  { id: 'sobha-hartland',     name: 'Sobha Hartland',      dldName: 'SOBHA HARTLAND',           bayutId: '8949',  lat: 25.2058, lng: 55.3140, radiusKm: 0.60 },
  { id: 'creek-harbour',      name: 'Dubai Creek Harbour', dldName: 'DUBAI CREEK HARBOUR',      bayutId: '8617',  lat: 25.2126, lng: 55.3308, radiusKm: 0.80 },
  { id: 'al-jadaf',           name: 'Al Jaddaf',           dldName: 'AL JADAF',                 bayutId: '5643',  lat: 25.2250, lng: 55.3326, radiusKm: 0.65 },
  { id: 'culture-village',    name: 'Culture Village',     dldName: 'CULTURE VILLAGE',          bayutId: '5382',  lat: 25.2270, lng: 55.3381, radiusKm: 0.50 },
  // ── Arabian Ranches / Golf ──────────────────────────────────────────────────
  { id: 'arabian-ranches',    name: 'Arabian Ranches',     dldName: 'ARABIAN RANCHES',          bayutId: '5223',  lat: 25.0607, lng: 55.2745, radiusKm: 1.50 },
  { id: 'arabian-ranches-2',  name: 'Arabian Ranches 2',   dldName: 'ARABIAN RANCHES 2',        bayutId: '11296', lat: 25.0450, lng: 55.2690, radiusKm: 1.10 },
  { id: 'arabian-ranches-3',  name: 'Arabian Ranches 3',   dldName: 'ARABIAN RANCHES 3',        bayutId: '12423', lat: 25.0361, lng: 55.2473, radiusKm: 1.00 },
  { id: 'damac-hills',        name: 'DAMAC Hills',         dldName: 'DAMAC HILLS',              bayutId: '9026',  lat: 25.0271, lng: 55.2363, radiusKm: 1.40 },
  { id: 'damac-hills-2',      name: 'DAMAC Hills 2',       dldName: 'DAMAC HILLS 2',            bayutId: '8657',  lat: 24.9847, lng: 55.3143, radiusKm: 1.50 },
  { id: 'tilal-al-ghaf',      name: 'Tilal Al Ghaf',       dldName: 'TILAL AL GHAF',            bayutId: '11943', lat: 25.0166, lng: 55.2528, radiusKm: 1.20 },
  { id: 'mudon',              name: 'Mudon',               dldName: 'MUDON',                    bayutId: '8230',  lat: 25.0340, lng: 55.2475, radiusKm: 1.00 },
  { id: 'remraam',            name: 'Remraam',             dldName: 'REMRAAM',                  bayutId: '5784',  lat: 25.0262, lng: 55.2008, radiusKm: 0.80 },
  // ── Sports / Motor City ──────────────────────────────────────────────────────
  { id: 'sports-city',        name: 'Sports City',         dldName: 'DUBAI SPORTS CITY',        bayutId: '5274',  lat: 25.0364, lng: 55.2099, radiusKm: 1.10 },
  { id: 'motor-city',         name: 'Motor City',          dldName: 'MOTOR CITY',               bayutId: '7153',  lat: 25.0469, lng: 55.2236, radiusKm: 0.90 },
  { id: 'the-villa',          name: 'The Villa',           dldName: 'THE VILLA',                bayutId: '5210',  lat: 25.0862, lng: 55.3396, radiusKm: 0.90 },
  // ── South Dubai ─────────────────────────────────────────────────────────────
  { id: 'town-square',        name: 'Town Square',         dldName: 'TOWN SQUARE',              bayutId: '8539',  lat: 24.9986, lng: 55.2455, radiusKm: 1.50 },
  { id: 'dubai-south',        name: 'Dubai South',         dldName: 'DUBAI SOUTH',              bayutId: '8881',  lat: 24.9986, lng: 55.1714, radiusKm: 2.00 },
  // ── East / Silicon ───────────────────────────────────────────────────────────
  { id: 'dso',                name: 'Dubai Silicon Oasis', dldName: 'DUBAI SILICON OASIS',      bayutId: '5361',  lat: 25.1186, lng: 55.3799, radiusKm: 1.10 },
  { id: 'international-city', name: 'International City',  dldName: 'INTERNATIONAL CITY',       bayutId: '5317',  lat: 25.1664, lng: 55.4110, radiusKm: 1.70 },
  { id: 'wadi-al-safa',       name: 'Wadi Al Safa',        dldName: 'WADI AL SAFA 5',           bayutId: '9561',  lat: 25.0988, lng: 55.3395, radiusKm: 1.00 },
  { id: 'mirdif',             name: 'Mirdif',              dldName: 'MIRDIF',                   bayutId: '5603',  lat: 25.2278, lng: 55.4128, radiusKm: 1.20 },
  { id: 'al-garhoud',         name: 'Al Garhoud',          dldName: 'AL GARHOUD',               bayutId: '5617',  lat: 25.2393, lng: 55.3573, radiusKm: 0.70 },
  { id: 'rashidiya',          name: 'Rashidiya',           dldName: 'RASHIDIYA',                bayutId: '5615',  lat: 25.2393, lng: 55.4005, radiusKm: 0.90 },
  // ── Old Dubai ────────────────────────────────────────────────────────────────
  { id: 'deira',              name: 'Deira',               dldName: 'DEIRA',                    bayutId: '6794',  lat: 25.2676, lng: 55.3130, radiusKm: 1.20 },
  { id: 'bur-dubai',          name: 'Bur Dubai',           dldName: 'BUR DUBAI',                bayutId: '6796',  lat: 25.2581, lng: 55.3047, radiusKm: 1.00 },
  { id: 'al-qusais',          name: 'Al Qusais',           dldName: 'AL QUSAIS',                bayutId: '5600',  lat: 25.2793, lng: 55.3723, radiusKm: 0.90 },
  { id: 'muhaisnah',          name: 'Muhaisnah',           dldName: 'MUHAISNAH',                bayutId: '5601',  lat: 25.2762, lng: 55.3907, radiusKm: 0.70 },
  { id: 'port-saeed',         name: 'Port Saeed',          dldName: 'PORT SAEED',               bayutId: '5618',  lat: 25.2474, lng: 55.3285, radiusKm: 0.55 },
];
