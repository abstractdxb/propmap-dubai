/**
 * Dubai community coordinate lookup.
 * `dldName` matches the AREA_EN field returned by the DLD carea-lookup endpoint.
 * Used server-side to build the /api/map/areas GeoJSON response.
 */

export interface DubaiCommunity {
  id:      string;
  name:    string;   // display name
  dldName: string;   // DLD AREA_EN (upper-case)
  lat:     number;
  lng:     number;
}

export const DUBAI_COMMUNITIES: DubaiCommunity[] = [
  // ── Central / Downtown ──────────────────────────────────────────────────────
  { id: 'downtown-dubai',      name: 'Downtown Dubai',         dldName: 'DOWNTOWN DUBAI',            lat: 25.1972, lng: 55.2744 },
  { id: 'business-bay',        name: 'Business Bay',           dldName: 'BUSINESS BAY',              lat: 25.1861, lng: 55.2788 },
  { id: 'difc',                name: 'DIFC',                   dldName: 'DIFC',                      lat: 25.2124, lng: 55.2789 },
  { id: 'city-walk',           name: 'City Walk',              dldName: 'CITY WALK',                 lat: 25.2058, lng: 55.2498 },
  { id: 'jumeirah',            name: 'Jumeirah',               dldName: 'JUMEIRAH',                  lat: 25.2084, lng: 55.2395 },
  { id: 'al-quoz',             name: 'Al Quoz',                dldName: 'AL QUOZ',                   lat: 25.1448, lng: 55.2305 },
  { id: 'ras-al-khor',         name: 'Ras Al Khor',            dldName: 'RAS AL KHOR',               lat: 25.1937, lng: 55.3399 },
  { id: 'nadd-al-sheba',       name: 'Nadd Al Sheba',          dldName: 'NADD AL SHEBA',             lat: 25.1695, lng: 55.3281 },
  // ── Waterfront ──────────────────────────────────────────────────────────────
  { id: 'dubai-marina',        name: 'Dubai Marina',           dldName: 'DUBAI MARINA',              lat: 25.0760, lng: 55.1334 },
  { id: 'jbr',                 name: 'JBR',                    dldName: 'JUMEIRAH BEACH RESIDENCE',  lat: 25.0783, lng: 55.1333 },
  { id: 'palm-jumeirah',       name: 'Palm Jumeirah',          dldName: 'PALM JUMEIRAH',             lat: 25.1124, lng: 55.1390 },
  { id: 'bluewaters',          name: 'Bluewaters Island',      dldName: 'BLUEWATERS ISLAND',         lat: 25.0746, lng: 55.1201 },
  { id: 'emaar-beachfront',    name: 'Emaar Beachfront',       dldName: 'EMAAR BEACHFRONT',          lat: 25.0770, lng: 55.1238 },
  { id: 'marsa-al-arab',       name: 'Marsa Al Arab',          dldName: 'MARSA AL ARAB',             lat: 25.1398, lng: 55.1727 },
  // ── JLT / Al Sufouh ─────────────────────────────────────────────────────────
  { id: 'jlt',                 name: 'JLT',                    dldName: 'JUMEIRAH LAKE TOWERS',      lat: 25.0697, lng: 55.1399 },
  { id: 'al-sufouh',           name: 'Al Sufouh',              dldName: 'AL SUFOUH',                 lat: 25.0962, lng: 55.1584 },
  { id: 'barsha-heights',      name: 'Barsha Heights (TECOM)', dldName: 'BARSHA HEIGHTS',            lat: 25.1049, lng: 55.1889 },
  { id: 'al-barsha',           name: 'Al Barsha',              dldName: 'AL BARSHA',                 lat: 25.1126, lng: 55.1968 },
  // ── Jumeirah Villages ────────────────────────────────────────────────────────
  { id: 'jvc',                 name: 'JVC',                    dldName: 'JUMEIRAH VILLAGE CIRCLE',   lat: 25.0569, lng: 55.2154 },
  { id: 'jvt',                 name: 'JVT',                    dldName: 'JUMEIRAH VILLAGE TRIANGLE', lat: 25.0694, lng: 55.1905 },
  { id: 'jumeirah-park',       name: 'Jumeirah Park',          dldName: 'JUMEIRAH PARK',             lat: 25.0861, lng: 55.1584 },
  { id: 'jumeirah-islands',    name: 'Jumeirah Islands',       dldName: 'JUMEIRAH ISLANDS',          lat: 25.0799, lng: 55.1624 },
  { id: 'discovery-gardens',   name: 'Discovery Gardens',      dldName: 'DISCOVERY GARDENS',         lat: 25.0449, lng: 55.1465 },
  { id: 'al-furjan',           name: 'Al Furjan',              dldName: 'AL FURJAN',                 lat: 25.0304, lng: 55.1580 },
  // ── Greens / Lakes / Emirates Hills ─────────────────────────────────────────
  { id: 'the-greens',          name: 'The Greens',             dldName: 'THE GREENS',                lat: 25.0943, lng: 55.1785 },
  { id: 'the-views',           name: 'The Views',              dldName: 'THE VIEWS',                 lat: 25.0893, lng: 55.1813 },
  { id: 'the-lakes',           name: 'The Lakes',              dldName: 'THE LAKES',                 lat: 25.0927, lng: 55.1755 },
  { id: 'the-springs',         name: 'The Springs',            dldName: 'THE SPRINGS',               lat: 25.0908, lng: 55.1770 },
  { id: 'meadows',             name: 'The Meadows',            dldName: 'MEADOWS',                   lat: 25.1001, lng: 55.1668 },
  { id: 'emirates-hills',      name: 'Emirates Hills',         dldName: 'EMIRATES HILLS',            lat: 25.0987, lng: 55.1646 },
  // ── Dubai Hills / MBR ───────────────────────────────────────────────────────
  { id: 'dubai-hills-estate',  name: 'Dubai Hills Estate',     dldName: 'DUBAI HILLS ESTATE',        lat: 25.1097, lng: 55.2375 },
  { id: 'sobha-hartland',      name: 'Sobha Hartland',         dldName: 'SOBHA HARTLAND',            lat: 25.2058, lng: 55.3281 },
  { id: 'creek-harbour',       name: 'Dubai Creek Harbour',    dldName: 'DUBAI CREEK HARBOUR',       lat: 25.2072, lng: 55.3281 },
  { id: 'al-jadaf',            name: 'Al Jaddaf',              dldName: 'AL JADAF',                  lat: 25.2250, lng: 55.3326 },
  { id: 'culture-village',     name: 'Culture Village',        dldName: 'CULTURE VILLAGE',           lat: 25.2270, lng: 55.3381 },
  // ── Arabian Ranches / Golf ──────────────────────────────────────────────────
  { id: 'arabian-ranches',     name: 'Arabian Ranches',        dldName: 'ARABIAN RANCHES',           lat: 25.0530, lng: 55.2750 },
  { id: 'arabian-ranches-2',   name: 'Arabian Ranches 2',      dldName: 'ARABIAN RANCHES 2',         lat: 25.0450, lng: 55.2690 },
  { id: 'arabian-ranches-3',   name: 'Arabian Ranches 3',      dldName: 'ARABIAN RANCHES 3',         lat: 25.0361, lng: 55.2673 },
  { id: 'damac-hills',         name: 'DAMAC Hills',            dldName: 'DAMAC HILLS',               lat: 25.0271, lng: 55.2363 },
  { id: 'damac-hills-2',       name: 'DAMAC Hills 2',          dldName: 'DAMAC HILLS 2',             lat: 25.0015, lng: 55.3247 },
  { id: 'tilal-al-ghaf',       name: 'Tilal Al Ghaf',          dldName: 'TILAL AL GHAF',             lat: 25.0166, lng: 55.2528 },
  { id: 'mudon',               name: 'Mudon',                  dldName: 'MUDON',                     lat: 25.0380, lng: 55.2514 },
  { id: 'remraam',             name: 'Remraam',                dldName: 'REMRAAM',                   lat: 25.0268, lng: 55.2033 },
  // ── Sports / Motor City ──────────────────────────────────────────────────────
  { id: 'sports-city',         name: 'Sports City',            dldName: 'DUBAI SPORTS CITY',         lat: 25.0358, lng: 55.2117 },
  { id: 'motor-city',          name: 'Motor City',             dldName: 'MOTOR CITY',                lat: 25.0469, lng: 55.2236 },
  { id: 'the-villa',           name: 'The Villa',              dldName: 'THE VILLA',                 lat: 25.0862, lng: 55.3396 },
  // ── South Dubai ─────────────────────────────────────────────────────────────
  { id: 'town-square',         name: 'Town Square',            dldName: 'TOWN SQUARE',               lat: 24.9986, lng: 55.2455 },
  { id: 'dubai-south',         name: 'Dubai South',            dldName: 'DUBAI SOUTH',               lat: 24.9986, lng: 55.1714 },
  // ── East / Silicon ───────────────────────────────────────────────────────────
  { id: 'dso',                 name: 'Dubai Silicon Oasis',    dldName: 'DUBAI SILICON OASIS',       lat: 25.1186, lng: 55.3799 },
  { id: 'international-city',  name: 'International City',     dldName: 'INTERNATIONAL CITY',        lat: 25.1664, lng: 55.4110 },
  { id: 'wadi-al-safa',        name: 'Wadi Al Safa',           dldName: 'WADI AL SAFA 5',            lat: 25.0988, lng: 55.3395 },
  { id: 'mirdif',              name: 'Mirdif',                 dldName: 'MIRDIF',                    lat: 25.2278, lng: 55.4128 },
  { id: 'al-garhoud',          name: 'Al Garhoud',             dldName: 'AL GARHOUD',                lat: 25.2393, lng: 55.3573 },
  { id: 'rashidiya',           name: 'Rashidiya',              dldName: 'RASHIDIYA',                 lat: 25.2393, lng: 55.4005 },
  // ── Old Dubai ────────────────────────────────────────────────────────────────
  { id: 'deira',               name: 'Deira',                  dldName: 'DEIRA',                     lat: 25.2676, lng: 55.3130 },
  { id: 'bur-dubai',           name: 'Bur Dubai',              dldName: 'BUR DUBAI',                 lat: 25.2581, lng: 55.3047 },
  { id: 'al-qusais',           name: 'Al Qusais',              dldName: 'AL QUSAIS',                 lat: 25.2793, lng: 55.3723 },
  { id: 'muhaisnah',           name: 'Muhaisnah',              dldName: 'MUHAISNAH',                 lat: 25.2762, lng: 55.3727 },
  { id: 'port-saeed',          name: 'Port Saeed',             dldName: 'PORT SAEED',                lat: 25.2474, lng: 55.3285 },
];
