import { Lead, LeadCategory } from '../types/lead';
import { calculateWebsiteOpportunity, calculateAdsOpportunity } from './leadAnalysis';

interface KenyaHub {
  name: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
}

// Distributed Kenyan commercial hubs across batches so nationwide scans return rich, multi-city coverage
const KENYA_HUB_BATCHES: KenyaHub[][] = [
  [
    { name: 'Nairobi', center: { lat: -1.2921, lng: 36.8219 }, radiusMeters: 25000 },
    { name: 'Mombasa', center: { lat: -4.0435, lng: 39.6682 }, radiusMeters: 20000 },
    { name: 'Kisumu', center: { lat: -0.0917, lng: 34.768 }, radiusMeters: 20000 },
    { name: 'Nakuru', center: { lat: -0.3031, lng: 36.08 }, radiusMeters: 20000 },
    { name: 'Eldoret', center: { lat: 0.5143, lng: 35.2698 }, radiusMeters: 20000 },
    { name: 'Thika', center: { lat: -1.0332, lng: 37.0693 }, radiusMeters: 18000 },
  ],
  [
    { name: 'Nyeri', center: { lat: -0.4197, lng: 36.9553 }, radiusMeters: 18000 },
    { name: 'Malindi', center: { lat: -3.2192, lng: 40.1169 }, radiusMeters: 18000 },
    { name: 'Nanyuki', center: { lat: 0.0167, lng: 37.0728 }, radiusMeters: 18000 },
    { name: 'Machakos', center: { lat: -1.5177, lng: 37.2634 }, radiusMeters: 18000 },
    { name: 'Naivasha', center: { lat: -0.7172, lng: 36.431 }, radiusMeters: 18000 },
    { name: 'Kitale', center: { lat: 1.0157, lng: 35.0062 }, radiusMeters: 18000 },
  ],
  [
    { name: 'Westlands, Nairobi', center: { lat: -1.2673, lng: 36.8111 }, radiusMeters: 10000 },
    { name: 'Kilimani, Nairobi', center: { lat: -1.2906, lng: 36.7878 }, radiusMeters: 10000 },
    { name: 'Ruiru', center: { lat: -1.1459, lng: 36.9585 }, radiusMeters: 15000 },
    { name: 'Diani Beach', center: { lat: -4.2798, lng: 39.5947 }, radiusMeters: 15000 },
    { name: 'Kisii', center: { lat: -0.6817, lng: 34.7667 }, radiusMeters: 18000 },
    { name: 'Kakamega', center: { lat: 0.2827, lng: 34.7519 }, radiusMeters: 18000 },
  ],
];

// Focused single-niche queries yield far higher quality and review volume than multi-keyword stuffing
const KENYA_NICHE_BATCHES: string[][] = [
  [
    'plumbers and hardware stores',
    'auto repair garages and car service',
    'dental and medical clinics',
    'beauty salons and barbershops',
    'restaurants and cafes',
    'law firms and accountants',
  ],
  [
    'building contractors and roofing',
    'pharmacies and chemists',
    'car wash and auto spares',
    'boutiques and electronics shops',
    'gyms and wellness spas',
    'hotels and catering services',
  ],
  [
    'electricians and solar installers',
    'veterinary and optical clinics',
    'tyre centres and wheel alignment',
    'furniture showrooms and interiors',
    'printing and branding services',
    'real estate agencies and surveyors',
  ],
];

// Categorization helper based on Google Places types or search keywords
export function inferCategory(types?: string[], query?: string): { category: LeadCategory; label: string } {
  const combined = `${types?.join(' ') || ''} ${query || ''}`.toLowerCase();

  if (
    combined.includes('plumb') ||
    combined.includes('roof') ||
    combined.includes('hvac') ||
    combined.includes('electric') ||
    combined.includes('contractor') ||
    combined.includes('hardware') ||
    combined.includes('construction') ||
    combined.includes('paint') ||
    combined.includes('clean') ||
    combined.includes('solar')
  ) {
    return { category: 'home_services', label: 'Home & Contracting' };
  }
  if (
    combined.includes('dent') ||
    combined.includes('doctor') ||
    combined.includes('health') ||
    combined.includes('clinic') ||
    combined.includes('hospital') ||
    combined.includes('pharmacy') ||
    combined.includes('chemist') ||
    combined.includes('optic') ||
    combined.includes('vet') ||
    combined.includes('therap')
  ) {
    return { category: 'health_medical', label: 'Health & Medical' };
  }
  if (
    combined.includes('law') ||
    combined.includes('advocate') ||
    combined.includes('attorney') ||
    combined.includes('cpa') ||
    combined.includes('account') ||
    combined.includes('tax') ||
    combined.includes('financ') ||
    combined.includes('insur') ||
    combined.includes('real_estate') ||
    combined.includes('survey')
  ) {
    return { category: 'legal_financial', label: 'Legal & Financial' };
  }
  if (
    combined.includes('car') ||
    combined.includes('auto') ||
    combined.includes('garage') ||
    combined.includes('repair') ||
    combined.includes('mechanic') ||
    combined.includes('tire') ||
    combined.includes('tyre') ||
    combined.includes('spare')
  ) {
    return { category: 'automotive', label: 'Automotive' };
  }
  if (
    combined.includes('restaur') ||
    combined.includes('cafe') ||
    combined.includes('baker') ||
    combined.includes('bar') ||
    combined.includes('food') ||
    combined.includes('hotel') ||
    combined.includes('nyama') ||
    combined.includes('pizza') ||
    combined.includes('cater')
  ) {
    return { category: 'restaurants_food', label: 'Food & Dining' };
  }
  if (
    combined.includes('cloth') ||
    combined.includes('store') ||
    combined.includes('shop') ||
    combined.includes('retail') ||
    combined.includes('salon') ||
    combined.includes('barber') ||
    combined.includes('beauty') ||
    combined.includes('spa') ||
    combined.includes('boutique') ||
    combined.includes('tailor') ||
    combined.includes('furniture') ||
    combined.includes('electronics') ||
    combined.includes('print') ||
    combined.includes('gym')
  ) {
    return { category: 'retail_services', label: 'Retail & Specialty' };
  }

  return { category: 'other', label: 'Local Business' };
}

function inferCityFromAddress(address: string, fallbackCity: string): string {
  const knownTowns = [
    'Nairobi',
    'Mombasa',
    'Kisumu',
    'Nakuru',
    'Eldoret',
    'Thika',
    'Nyeri',
    'Malindi',
    'Diani',
    'Nanyuki',
    'Machakos',
    'Naivasha',
    'Kitale',
    'Ruiru',
    'Kisii',
    'Kakamega',
    'Westlands',
    'Kilimani',
  ];
  const lower = address.toLowerCase();
  const matched = knownTowns.find((t) => lower.includes(t.toLowerCase()));
  if (matched) return matched;
  const cleaned = fallbackCity.replace(', Kenya', '').replace('(Overview)', '').trim();
  return cleaned === 'All Kenya' || !cleaned ? 'Kenya' : cleaned;
}

// Convert google.maps.places.Place instance to app Lead
export function transformPlaceToLead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  place: any,
  cityContext: string = 'Nairobi, Kenya'
): Lead {
  const rawWebsite = place.websiteURI || place.website_uri || place.website || null;
  const hasWebsite = Boolean(rawWebsite && typeof rawWebsite === 'string' && rawWebsite.trim().length > 3);

  const displayName =
    typeof place.displayName === 'object'
      ? place.displayName?.text || 'Local Business'
      : place.displayName || place.name || 'Local Business';

  const formattedAddress = place.formattedAddress || place.formatted_address || cityContext;

  let lat = 0;
  let lng = 0;
  if (place.location) {
    if (typeof place.location.lat === 'function') {
      lat = place.location.lat();
      lng = place.location.lng();
    } else {
      lat = Number(place.location.lat) || 0;
      lng = Number(place.location.lng) || 0;
    }
  }

  const rating = Number(place.rating) || 0;
  const userRatingCount = Number(place.userRatingCount || place.user_ratings_total) || 0;
  const types = place.types || [];
  const { category, label } = inferCategory(types, displayName);

  const cleanCity = inferCityFromAddress(formattedAddress, cityContext);

  const websiteAnalysis = !hasWebsite
    ? calculateWebsiteOpportunity(displayName, category, rating, userRatingCount, cleanCity)
    : undefined;

  const adsAnalysis = calculateAdsOpportunity(
    displayName,
    category,
    rating,
    userRatingCount,
    cleanCity,
    hasWebsite
  );

  let leadType: Lead['leadType'] = 'both';
  if (!hasWebsite && adsAnalysis.opportunityScore < 70) {
    leadType = 'no_website';
  } else if (hasWebsite && adsAnalysis.opportunityScore >= 55) {
    leadType = 'ads_opportunity';
  }

  return {
    id: place.id || place.place_id || `place-${Math.random().toString(36).substring(2, 9)}`,
    name: displayName,
    category,
    categoryLabel: label,
    address: formattedAddress,
    city: cleanCity,
    country: 'Kenya',
    location: { lat, lng },
    rating,
    userRatingCount,
    hasWebsite,
    websiteUrl: hasWebsite ? rawWebsite : null,
    phoneNumber:
      place.nationalPhoneNumber || place.internationalPhoneNumber || place.formatted_phone_number || undefined,
    googleMapsUrl:
      place.googleMapsURI ||
      place.googleMapsUri ||
      (place.id ? `https://maps.google.com/?q=place_id:${place.id}` : undefined),
    primaryType: types[0] || 'point_of_interest',
    leadType,
    websiteAnalysis,
    adsAnalysis,
    pipelineStatus: 'new',
  };
}

export interface SearchPlacesResult {
  leads: Lead[];
  totalScanned: number;
  error?: string;
}

export interface SearchPlacesOptions {
  minReviews?: number;
  batchIndex?: number;
  preferViewportBounds?: boolean;
  bypassCache?: boolean;
}

const PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'websiteURI',
  'nationalPhoneNumber',
  'types',
  'googleMapsURI',
  'businessStatus',
];

// Short-lived cache (15 min) to avoid redundant API calls & quota burn on repeated clicks/reloads
const CACHE_TTL_MS = 15 * 60 * 1000;
const memoryCache = new Map<string, { timestamp: number; result: SearchPlacesResult }>();

function getCachedSearch(key: string): SearchPlacesResult | null {
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.result;
  }
  try {
    const raw = sessionStorage.getItem(`cr_cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { timestamp: number; result: SearchPlacesResult };
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.result.leads.length > 0) {
        memoryCache.set(key, parsed);
        return parsed.result;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function setCachedSearch(key: string, result: SearchPlacesResult) {
  if (result.leads.length === 0) return;
  const entry = { timestamp: Date.now(), result };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`cr_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

function splitBoundsIntoQuadrants(
  bounds: google.maps.LatLngBounds
): google.maps.LatLngBoundsLiteral[] {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const midLat = (ne.lat() + sw.lat()) / 2;
  const midLng = (ne.lng() + sw.lng()) / 2;

  return [
    { north: ne.lat(), south: midLat, east: midLng, west: sw.lng() }, // NW
    { north: ne.lat(), south: midLat, east: ne.lng(), west: midLng }, // NE
    { north: midLat, south: sw.lat(), east: midLng, west: sw.lng() }, // SW
    { north: midLat, south: sw.lat(), east: ne.lng(), west: midLng }, // SE
  ];
}

function toBoundsLiteral(bounds: google.maps.LatLngBounds): google.maps.LatLngBoundsLiteral {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: ne.lat(),
    south: sw.lat(),
    east: ne.lng(),
    west: sw.lng(),
  };
}

function buildOffsetCenters(center: { lat: number; lng: number }): Array<{ lat: number; lng: number }> {
  const delta = 0.035; // ~3.8km offsets to break the 20-result cap around a city
  return [
    center,
    { lat: center.lat + delta, lng: center.lng + delta },
    { lat: center.lat - delta, lng: center.lng - delta },
    { lat: center.lat + delta, lng: center.lng - delta },
  ];
}

function extractErrorDetails(reason: unknown): string {
  if (!reason) return '';
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extra = reason as any;
    return [reason.name, reason.message, extra.code, extra.status].filter(Boolean).join(' ');
  }
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

function isQuotaOrRateError(errMsg: string): boolean {
  const lower = errMsg.toLowerCase();
  return (
    lower.includes('overquota') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('over_query_limit') ||
    lower.includes('rate_limit') ||
    lower.includes('ratelimit') ||
    lower.includes('429')
  );
}

function isAuthOrKeyError(errMsg: string): boolean {
  const lower = errMsg.toLowerCase();
  return (
    lower.includes('referer') ||
    lower.includes('api_key') ||
    lower.includes('api key') ||
    lower.includes('permission_denied') ||
    lower.includes('request_denied') ||
    lower.includes('forbidden') ||
    lower.includes('403')
  );
}

async function runInWaves<T>(
  tasks: Array<() => Promise<T>>,
  waveSize = 3,
  delayMs = 120
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  for (let i = 0; i < tasks.length; i += waveSize) {
    const chunk = tasks.slice(i, i + waveSize);
    const settled = await Promise.allSettled(chunk.map((fn) => fn()));
    results.push(...settled);
    if (i + waveSize < tasks.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

/**
 * Runs multi-query / multi-hub searches against Google Maps Places API (New)
 * to gather a large, deduplicated pool of reliable Kenyan businesses (breaking the 20-result cap).
 */
export async function searchPlacesOnMap(
  placesLib: typeof google.maps.places | null,
  textQuery: string,
  locationBias?: { lat: number; lng: number } | google.maps.LatLngBounds,
  cityContext: string = 'All Kenya (Overview)',
  options: SearchPlacesOptions = {}
): Promise<SearchPlacesResult> {
  if (!placesLib?.Place?.searchByText) {
    return { leads: [], totalScanned: 0, error: 'Google Places library is still initializing.' };
  }

  const {
    minReviews = 15,
    batchIndex = 0,
    preferViewportBounds = false,
    bypassCache = false,
  } = options;
  const trimmedQuery = textQuery.trim();
  const isBroadDefault =
    !trimmedQuery ||
    trimmedQuery.includes(',') ||
    trimmedQuery.toLowerCase() === 'local businesses';

  const hasBounds = Boolean(locationBias && 'getNorthEast' in locationBias);
  let boundsKey = 'center';
  if (hasBounds && locationBias && 'getNorthEast' in locationBias) {
    const b = toBoundsLiteral(locationBias);
    boundsKey = `${b.north.toFixed(2)},${b.south.toFixed(2)},${b.east.toFixed(2)},${b.west.toFixed(2)}`;
  } else if (locationBias && 'lat' in locationBias) {
    boundsKey = `${locationBias.lat.toFixed(2)},${locationBias.lng.toFixed(2)}`;
  }

  const cacheKey = `${cityContext}|${trimmedQuery.toLowerCase()}|${minReviews}|${batchIndex}|${
    preferViewportBounds ? 'vp' : 'std'
  }|${boundsKey}`;

  if (!bypassCache) {
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const requests: Array<{ request: google.maps.places.SearchByTextRequest; hubCity: string }> = [];
  const minRatingFilter = minReviews >= 15 ? 3.0 : undefined;
  const nicheBatch = KENYA_NICHE_BATCHES[batchIndex % KENYA_NICHE_BATCHES.length];

  const isZoomedViewportSearch =
    preferViewportBounds &&
    hasBounds &&
    locationBias &&
    'getNorthEast' in locationBias &&
    Math.abs(locationBias.getNorthEast().lat() - locationBias.getSouthWest().lat()) < 4.5;

  if (cityContext === 'All Kenya (Overview)' && !isZoomedViewportSearch) {
    // Country-wide scan: fan out across 6 Kenyan cities in parallel waves
    const hubBatch = KENYA_HUB_BATCHES[batchIndex % KENYA_HUB_BATCHES.length];
    hubBatch.forEach((hub, idx) => {
      const niche = isBroadDefault ? nicheBatch[(idx + batchIndex) % nicheBatch.length] : trimmedQuery;
      requests.push({
        hubCity: hub.name,
        request: {
          textQuery: `${niche} in ${hub.name}, Kenya`,
          fields: PLACE_FIELDS,
          maxResultCount: 20,
          region: 'ke',
          language: 'en',
          ...(minRatingFilter ? { minRating: minRatingFilter } : {}),
          locationBias: {
            center: hub.center,
            radius: hub.radiusMeters,
          },
        },
      });
    });
  } else if (isBroadDefault) {
    // Focused city / area scan across 6 separate commercial niches (6 x 20 = up to 120 places)
    const cityLabel =
      cityContext === 'Near Me' || cityContext === 'All Kenya (Overview)' ? 'Kenya' : cityContext;
    const viewportBoundsLiteral =
      hasBounds && locationBias && 'getNorthEast' in locationBias
        ? toBoundsLiteral(locationBias)
        : undefined;

    nicheBatch.forEach((niche) => {
      const req: google.maps.places.SearchByTextRequest = {
        textQuery: viewportBoundsLiteral ? `${niche} in Kenya` : `${niche} in ${cityLabel}`,
        fields: PLACE_FIELDS,
        maxResultCount: 20,
        region: 'ke',
        language: 'en',
        ...(minRatingFilter ? { minRating: minRatingFilter } : {}),
      };

      if (viewportBoundsLiteral) {
        // Use locationBias (never throws INVALID_ARGUMENT on wide map rectangles)
        req.locationBias = viewportBoundsLiteral;
      } else if (locationBias && 'lat' in locationBias && 'lng' in locationBias) {
        req.locationBias = { center: locationBias, radius: 18000 };
      }

      requests.push({ request: req, hubCity: cityContext });
    });
  } else {
    // Specific single-niche search: split bounds into 4 biased quadrants or 4 offset centers
    const hasKenyaWord =
      trimmedQuery.toLowerCase().includes('kenya') ||
      trimmedQuery.toLowerCase().includes(cityContext.replace(', Kenya', '').toLowerCase());
    const baseQuery =
      hasBounds
        ? `${trimmedQuery} Kenya`
        : hasKenyaWord
        ? trimmedQuery
        : `${trimmedQuery} in ${cityContext === 'All Kenya (Overview)' ? 'Kenya' : cityContext}`;

    if (hasBounds && locationBias && 'getNorthEast' in locationBias) {
      const quadrants = splitBoundsIntoQuadrants(locationBias);
      quadrants.forEach((quadBounds) => {
        requests.push({
          hubCity: cityContext,
          request: {
            textQuery: trimmedQuery,
            fields: PLACE_FIELDS,
            maxResultCount: 20,
            region: 'ke',
            language: 'en',
            ...(minRatingFilter ? { minRating: minRatingFilter } : {}),
            locationBias: quadBounds,
          },
        });
      });
    } else if (locationBias && 'lat' in locationBias && 'lng' in locationBias) {
      const offsets = buildOffsetCenters(locationBias);
      offsets.forEach((pt, idx) => {
        requests.push({
          hubCity: cityContext,
          request: {
            textQuery:
              idx === 0
                ? baseQuery
                : `${trimmedQuery} ${cityContext.replace(', Kenya', '').replace('(Overview)', '')}`.trim(),
            fields: PLACE_FIELDS,
            maxResultCount: 20,
            region: 'ke',
            language: 'en',
            ...(minRatingFilter ? { minRating: minRatingFilter } : {}),
            locationBias: { center: pt, radius: 12000 },
          },
        });
      });
    } else {
      requests.push({
        hubCity: cityContext,
        request: {
          textQuery: baseQuery,
          fields: PLACE_FIELDS,
          maxResultCount: 20,
          region: 'ke',
          language: 'en',
          ...(minRatingFilter ? { minRating: minRatingFilter } : {}),
        },
      });
    }
  }

  try {
    const settled = await runInWaves(
      requests.map(({ request, hubCity }) => async () => {
        const { places } = await placesLib.Place.searchByText(request);
        return { places: places || [], hubCity };
      }),
      3,
      120
    );

    const deduped = new Map<string, Lead>();
    let quotaHit = false;
    let authHit = false;
    let anySuccess = false;
    let lastErrorDetail = '';

    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        anySuccess = true;
        for (const place of outcome.value.places) {
          // Skip permanently closed places for higher lead reliability
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const status = (place as any).businessStatus;
          if (status === 'CLOSED_PERMANENTLY') continue;

          const lead = transformPlaceToLead(place, outcome.value.hubCity);
          if (!deduped.has(lead.id)) {
            deduped.set(lead.id, lead);
          }
        }
      } else {
        const detail = extractErrorDetails(outcome.reason);
        lastErrorDetail = detail;
        console.warn('Places search sub-query rejected:', detail);
        if (isQuotaOrRateError(detail)) {
          quotaHit = true;
        } else if (isAuthOrKeyError(detail)) {
          authHit = true;
        }
      }
    }

    if (quotaHit) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      if (!anySuccess) {
        return {
          leads: [],
          totalScanned: 0,
          error: 'Google Maps Platform quota or rate limit reached. Please wait a moment or check your API quota.',
        };
      }
    }

    if (!anySuccess) {
      if (authHit) {
        return {
          leads: [],
          totalScanned: 0,
          error: 'Google Places API authorization failed. Ensure Places API (New) is enabled and HTTP referrers allow this domain.',
        };
      }
      return {
        leads: [],
        totalScanned: 0,
        error: lastErrorDetail
          ? `Google Places API error: ${lastErrorDetail}`
          : 'Unable to load businesses from Google Places right now. Please try another search or area.',
      };
    }

    const allLeads = Array.from(deduped.values()).sort(
      (a, b) => b.userRatingCount - a.userRatingCount
    );

    const result: SearchPlacesResult = {
      leads: allLeads,
      totalScanned: allLeads.length,
    };

    setCachedSearch(cacheKey, result);
    return result;
  } catch (err: unknown) {
    const detail = extractErrorDetails(err);
    console.error('Google Places search error:', detail);
    if (isQuotaOrRateError(detail)) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      return {
        leads: [],
        totalScanned: 0,
        error: 'Google Maps Platform daily quota reached. Please check your Maps API quota.',
      };
    }
    return {
      leads: [],
      totalScanned: 0,
      error: 'Unable to load businesses from Google Places right now. Please try another search or area.',
    };
  }
}
