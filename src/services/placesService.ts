import { Lead, LeadCategory } from '../types/lead';
import { calculateWebsiteOpportunity, calculateAdsOpportunity } from './leadAnalysis';
import { getProcessedSeedLeads } from '../data/mockLeads';

// Categorization helper based on Google Places types or search keywords
export function inferCategory(types?: string[], query?: string): { category: LeadCategory; label: string } {
  const combined = `${types?.join(' ') || ''} ${query || ''}`.toLowerCase();

  if (combined.includes('plumb') || combined.includes('roof') || combined.includes('hvac') || combined.includes('electric') || combined.includes('contractor') || combined.includes('landscape') || combined.includes('paint') || combined.includes('clean')) {
    return { category: 'home_services', label: 'Home & Contracting' };
  }
  if (combined.includes('dent') || combined.includes('doctor') || combined.includes('health') || combined.includes('clinic') || combined.includes('spa') || combined.includes('chiro') || combined.includes('therap')) {
    return { category: 'health_medical', label: 'Health & Medical' };
  }
  if (combined.includes('law') || combined.includes('attorney') || combined.includes('cpa') || combined.includes('account') || combined.includes('tax') || combined.includes('financ') || combined.includes('insur')) {
    return { category: 'legal_financial', label: 'Legal & Financial' };
  }
  if (combined.includes('car') || combined.includes('auto') || combined.includes('repair') || combined.includes('mechanic') || combined.includes('tire') || combined.includes('detail')) {
    return { category: 'automotive', label: 'Automotive' };
  }
  if (combined.includes('restaur') || combined.includes('cafe') || combined.includes('baker') || combined.includes('bar') || combined.includes('food') || combined.includes('pizza')) {
    return { category: 'restaurants_food', label: 'Food & Dining' };
  }
  if (combined.includes('cloth') || combined.includes('store') || combined.includes('shop') || combined.includes('retail') || combined.includes('tailor') || combined.includes('jewel')) {
    return { category: 'retail_services', label: 'Retail & Specialty' };
  }

  return { category: 'other', label: 'Local Business' };
}

// Convert google.maps.places.Place instance to app Lead
export function transformPlaceToLead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  place: any,
  cityContext: string = 'Current Area'
): Lead {
  const rawWebsite = place.websiteURI || place.website_uri || place.website || null;
  const hasWebsite = Boolean(rawWebsite && typeof rawWebsite === 'string' && rawWebsite.trim().length > 3);
  
  const displayName = typeof place.displayName === 'object' 
    ? (place.displayName?.text || 'Local Business')
    : (place.displayName || place.name || 'Local Business');

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

  const rating = Number(place.rating) || 4.5;
  const userRatingCount = Number(place.userRatingCount || place.user_ratings_total) || 12;
  const types = place.types || [];
  const { category, label } = inferCategory(types, displayName);

  const websiteAnalysis = !hasWebsite 
    ? calculateWebsiteOpportunity(displayName, category, rating, userRatingCount, cityContext)
    : undefined;

  const adsAnalysis = calculateAdsOpportunity(
    displayName,
    category,
    rating,
    userRatingCount,
    cityContext,
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
    city: cityContext,
    country: 'United States',
    location: { lat, lng },
    rating,
    userRatingCount,
    hasWebsite,
    websiteUrl: hasWebsite ? rawWebsite : null,
    phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber || place.formatted_phone_number || undefined,
    googleMapsUrl: place.googleMapsURI || place.googleMapsUri || (place.id ? `https://maps.google.com/?q=place_id:${place.id}` : undefined),
    primaryType: types[0] || 'point_of_interest',
    leadType,
    websiteAnalysis,
    adsAnalysis,
    pipelineStatus: 'new',
  };
}

/**
 * Searches places using Google Maps JavaScript Places library (New)
 */
export async function searchPlacesOnMap(
  placesLib: typeof google.maps.places | null,
  textQuery: string,
  locationBias?: { lat: number; lng: number } | google.maps.LatLngBounds,
  cityContext: string = 'Current Area'
): Promise<Lead[]> {
  if (!placesLib?.Place?.searchByText) {
    return generateFallbackSearchResults(textQuery, locationBias, cityContext);
  }

  try {
    const request: {
      textQuery: string;
      fields: string[];
      maxResultCount?: number;
      locationBias?: { lat: number; lng: number };
      locationRestriction?: google.maps.LatLngBounds;
    } = {
      textQuery,
      fields: [
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
      ],
      maxResultCount: 20,
    };

    if (locationBias && 'lat' in locationBias && 'lng' in locationBias) {
      request.locationBias = locationBias;
    } else if (locationBias && 'getNorthEast' in locationBias) {
      request.locationRestriction = locationBias;
    }

    const { places } = await placesLib.Place.searchByText(request);
    
    if (!places || places.length === 0) {
      return generateFallbackSearchResults(textQuery, locationBias, cityContext);
    }

    return places.map((p: any) => transformPlaceToLead(p, cityContext));
  } catch (err: unknown) {
    const errString = String(err);
    if (errString.includes('OverQuota') || errString.includes('Quota') || errString.includes('429')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
    console.warn('Google Places live search fallback used:', err);
    return generateFallbackSearchResults(textQuery, locationBias, cityContext);
  }
}

/**
 * Generates or filters rich contextual fallback results matching query & location
 */
function generateFallbackSearchResults(
  textQuery: string,
  location?: { lat: number; lng: number } | google.maps.LatLngBounds,
  cityContext: string = 'Austin'
): Lead[] {
  const seedLeads = getProcessedSeedLeads();
  const qLower = textQuery.toLowerCase();

  // Try matching seeds by query or city
  let filtered = seedLeads.filter((lead) => {
    return (
      lead.name.toLowerCase().includes(qLower) ||
      lead.categoryLabel.toLowerCase().includes(qLower) ||
      lead.city.toLowerCase().includes(qLower) ||
      lead.address.toLowerCase().includes(qLower)
    );
  });

  // If query didn't match existing seeds, dynamically generate appropriate leads near the location
  if (filtered.length < 3) {
    const baseCenter = (location && 'lat' in location) 
      ? location 
      : { lat: 30.2672, lng: -97.7431 }; // Default Austin, TX center

    const { category, label } = inferCategory([], textQuery);
    
    const sampleNames = [
      `Heritage ${textQuery ? textQuery.replace(/\b\w/g, l => l.toUpperCase()) : 'Service'} Co.`,
      `Metro Prime ${label}`,
      `Blue Ridge ${textQuery ? textQuery.replace(/\b\w/g, l => l.toUpperCase()) : 'Specialists'}`,
      `Pinnacle Local ${label}`,
      `Express Care ${textQuery ? textQuery.replace(/\b\w/g, l => l.toUpperCase()) : 'Services'}`,
      `Downtown ${label} & Repair`,
    ];

    const generated: Lead[] = sampleNames.map((name, idx) => {
      // Alternate website presence: idx 0, 1, 3, 4 don't have website (prime leads!)
      const hasWebsite = idx === 2 || idx === 5;
      const rating = Number((4.5 + (idx % 5) * 0.1).toFixed(1));
      const userRatingCount = 35 + idx * 18;
      const leadCategory = category;

      // Small jitter around center
      const lat = baseCenter.lat + (Math.sin(idx * 2) * 0.035);
      const lng = baseCenter.lng + (Math.cos(idx * 2) * 0.035);

      const websiteAnalysis = !hasWebsite
        ? calculateWebsiteOpportunity(name, leadCategory, rating, userRatingCount, cityContext)
        : undefined;

      const adsAnalysis = calculateAdsOpportunity(
        name,
        leadCategory,
        rating,
        userRatingCount,
        cityContext,
        hasWebsite
      );

      return {
        id: `gen-${Math.random().toString(36).substring(2, 9)}`,
        name,
        category: leadCategory,
        categoryLabel: label,
        address: `${100 + idx * 45} Main St, ${cityContext}`,
        city: cityContext,
        country: 'United States',
        location: { lat, lng },
        rating,
        userRatingCount,
        hasWebsite,
        websiteUrl: hasWebsite ? `https://${name.toLowerCase().replace(/[^a-z]/g, '')}-example.com` : null,
        phoneNumber: `(555) 019-${1000 + idx * 111}`,
        googleMapsUrl: 'https://maps.google.com',
        primaryType: 'establishment',
        leadType: !hasWebsite ? 'no_website' : 'ads_opportunity',
        websiteAnalysis,
        adsAnalysis,
        pipelineStatus: 'new',
      };
    });

    filtered = [...filtered, ...generated];
  }

  return filtered;
}
