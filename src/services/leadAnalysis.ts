import { LeadCategory, WebsiteOpportunityAnalysis, AdsOpportunityAnalysis, KeywordEstimate } from '../types/lead';

interface NicheMetric {
  avgTicketKes: number;
  estMonthlySearchVolume: number;
  avgCpcKes: number;
  highIntentKeywords: string[];
}

const CATEGORY_METRICS: Record<LeadCategory, NicheMetric> = {
  home_services: {
    avgTicketKes: 15000,
    estMonthlySearchVolume: 4200,
    avgCpcKes: 120,
    highIntentKeywords: [
      'plumber in city',
      'contractor near me',
      'electrical repair city',
      'hardware suppliers city',
      'roofing and construction city',
    ],
  },
  health_medical: {
    avgTicketKes: 12000,
    estMonthlySearchVolume: 3800,
    avgCpcKes: 110,
    highIntentKeywords: [
      'dental clinic in city',
      'medical centre near me',
      'specialist doctor city',
      'pharmacy open now city',
      'diagnostic lab city',
    ],
  },
  legal_financial: {
    avgTicketKes: 35000,
    estMonthlySearchVolume: 2100,
    avgCpcKes: 180,
    highIntentKeywords: [
      'advocates in city',
      'tax consultant city',
      'registered CPA Kenya',
      'company registration lawyer city',
      'audit firm near me',
    ],
  },
  automotive: {
    avgTicketKes: 10000,
    estMonthlySearchVolume: 3600,
    avgCpcKes: 85,
    highIntentKeywords: [
      'car garage near me',
      'auto spares city',
      'car service centre city',
      'wheel alignment city',
      'vehicle diagnostics city',
    ],
  },
  restaurants_food: {
    avgTicketKes: 2500,
    estMonthlySearchVolume: 7800,
    avgCpcKes: 35,
    highIntentKeywords: [
      'best restaurant in city',
      'nyama choma near me',
      'catering services city',
      'cafe and bakery city',
      'lunch delivery city',
    ],
  },
  retail_services: {
    avgTicketKes: 4500,
    estMonthlySearchVolume: 3100,
    avgCpcKes: 55,
    highIntentKeywords: [
      'salon and spa in city',
      'boutique shop city',
      'electronics store near me',
      'furniture showroom city',
      'printing services city',
    ],
  },
  other: {
    avgTicketKes: 8000,
    estMonthlySearchVolume: 2400,
    avgCpcKes: 70,
    highIntentKeywords: [
      'services in city',
      'trusted company near me',
      'best local provider city',
      'affordable quote city',
      'verified business city',
    ],
  },
};

/**
 * Calculates Website Opportunity metrics for Kenyan businesses lacking an official website.
 */
export function calculateWebsiteOpportunity(
  name: string,
  category: LeadCategory,
  rating: number,
  reviewsCount: number,
  city: string
): WebsiteOpportunityAnalysis {
  const metrics = CATEGORY_METRICS[category] || CATEGORY_METRICS.other;
  const cleanCity = city.replace(', Kenya', '').trim() || 'Kenya';

  // Rating factor (max 40 pts)
  const ratingFactor = rating > 0 ? Math.min(40, (rating / 5) * 40) : 18;
  // Reviews factor (max 40 pts)
  const reviewFactor = reviewsCount > 0 ? Math.min(40, Math.log10(Math.max(1, reviewsCount)) * 20) : 12;
  // Category commercial intent factor (max 20 pts)
  const commercialFactor = metrics.avgTicketKes >= 12000 ? 20 : metrics.avgTicketKes >= 4500 ? 15 : 10;

  const urgencyScore = Math.min(99, Math.round(ratingFactor + reviewFactor + commercialFactor));

  const estimatedLostClients = Math.max(4, Math.round((reviewsCount * 0.12) + (metrics.avgTicketKes >= 10000 ? 5 : 10)));
  const estimatedLostMonthlyRevenue = Math.round((estimatedLostClients * metrics.avgTicketKes * 0.65) / 500) * 500;

  const reputationText = reviewsCount > 0
    ? `${name} has built trust with a ${rating.toFixed(1)}★ rating across ${reviewsCount} Google reviews, yet customers searching online find no official website to inspect services, pricing, or branches.`
    : `${name} is listed on Google Maps in ${cleanCity}, but without a linked website, prospective clients cannot verify services, view past work, or request instant quotes online.`;

  return {
    urgencyScore,
    estimatedLostMonthlyRevenue,
    mobileTrafficLossPercent: 82,
    localCompetitorsWithWebsitesCount: 9,
    pitchAngles: {
      credibility: reputationText,
      leadCapture: `Over 80% of local searches in ${cleanCity} happen on mobile devices. Adding a fast mobile landing page with Click-to-WhatsApp and instant M-Pesa/quote booking prevents prospects from bouncing to competitors.`,
      localSeo: `Google Local search favors businesses with verified domains. Launching a fast, mobile-first site can boost Google Maps Pack visibility and capture an estimated KSh ${estimatedLostMonthlyRevenue.toLocaleString()}/mo in new inquiries.`,
    },
  };
}

/**
 * Calculates Ads Management Opportunity for Kenyan companies ripe for Google Search Ads & Maps Promoted Pins.
 */
export function calculateAdsOpportunity(
  name: string,
  category: LeadCategory,
  rating: number,
  reviewsCount: number,
  city: string,
  hasWebsite: boolean
): AdsOpportunityAnalysis {
  const metrics = CATEGORY_METRICS[category] || CATEGORY_METRICS.other;
  const cleanCity = city.replace(', Kenya', '').trim() || 'Kenya';

  // Commercial intent weighting (max 35 pts, fair floor across retail/food/services)
  const ticketWeight = Math.min(35, 12 + (metrics.avgTicketKes / 30000) * 23);
  // Review validation (max 40 pts, prioritizing >= 15 reliable reviews)
  const reviewScore =
    reviewsCount >= 50 && rating >= 4.0
      ? 40
      : reviewsCount >= 15 && rating >= 3.8
      ? 34
      : reviewsCount >= 15
      ? 28
      : reviewsCount >= 5
      ? 18
      : 10;
  // Category competition (max 25 pts)
  const competitionScore = metrics.avgCpcKes >= 100 ? 25 : metrics.avgCpcKes >= 55 ? 21 : 17;

  const opportunityScore = Math.min(98, Math.round(ticketWeight + reviewScore + competitionScore));

  const tier: 'High Priority' | 'Moderate' | 'Niche Growth' =
    opportunityScore >= 75 ? 'High Priority' : opportunityScore >= 60 ? 'Moderate' : 'Niche Growth';

  // Budget calculations in KES (~250+ targeted clicks/mo)
  const suggestedMonthlyBudget = Math.max(15000, Math.round((metrics.avgCpcKes * 260) / 1000) * 1000);
  const minCpc = Math.round(metrics.avgCpcKes * 0.8);
  const maxCpc = Math.round(metrics.avgCpcKes * 1.35);
  const potentialMonthlyClicks = Math.round(suggestedMonthlyBudget / metrics.avgCpcKes);

  const keywords: KeywordEstimate[] = metrics.highIntentKeywords.map((phrase, idx) => {
    const variance = 0.85 + ((idx % 3) * 0.15);
    return {
      keyword: phrase.replace('city', cleanCity),
      monthlySearchVolume: Math.round((metrics.estMonthlySearchVolume / metrics.highIntentKeywords.length) * variance),
      estimatedCpc: Math.round(metrics.avgCpcKes * (0.9 + (idx % 3) * 0.12)),
      competition: metrics.avgCpcKes >= 110 ? 'High' : 'Medium',
    };
  });

  const recommendedCampaigns = [
    {
      type: 'High-Intent Google Search (Call & WhatsApp Extensions)',
      description: `Exact-match campaigns targeting "${keywords[0]?.keyword || cleanCity}" so customers call or WhatsApp directly from Google Search.`,
      priority: 'Critical' as const,
    },
    {
      type: 'Google Maps Promoted Pins (Performance Max for Store Goals)',
      description: `Highlight ${name} at the top of Google Maps navigation across ${cleanCity} for nearby high-intent searches.`,
      priority: (category === 'home_services' || category === 'automotive' || category === 'health_medical')
        ? ('Critical' as const)
        : ('Recommended' as const),
    },
    {
      type: 'Meta & Instagram Click-to-WhatsApp Lead Ads',
      description: `Geo-fenced ads around ${cleanCity} driving high-converting WhatsApp Business inquiries and instant bookings.`,
      priority: 'Recommended' as const,
    },
    {
      type: 'Brand & Competitor Retargeting',
      description: 'Stay top-of-mind with local prospects comparing quotes across Nairobi, Mombasa, and regional hubs.',
      priority: 'Optional' as const,
    },
  ];

  const ratingSummary = reviewsCount > 0 ? `${rating.toFixed(1)}★ across ${reviewsCount} reviews` : 'verified Google Maps listing';
  const primaryPitchAngle = hasWebsite
    ? `${name} already has a web presence, but competitors in ${cleanCity} are capturing the top paid Google spots for queries worth KSh ${metrics.avgTicketKes.toLocaleString()} avg ticket. A KSh ${suggestedMonthlyBudget.toLocaleString()}/mo campaign can drive ~${potentialMonthlyClicks} targeted local clicks and calls.`
    : `${name} has a ${ratingSummary} in ${cleanCity}. Pairing a fast 1-page WhatsApp landing site with a KSh ${suggestedMonthlyBudget.toLocaleString()}/mo Google Search & Maps ad campaign can capture ~${potentialMonthlyClicks} high-intent buyers monthly.`;

  return {
    opportunityScore,
    tier,
    suggestedMonthlyBudget,
    estimatedCpcRange: [minCpc, maxCpc],
    potentialMonthlyClicks,
    recommendedCampaigns,
    suggestedKeywords: keywords,
    primaryPitchAngle,
  };
}
