import { LeadCategory, WebsiteOpportunityAnalysis, AdsOpportunityAnalysis, KeywordEstimate } from '../types/lead';

interface NicheMetric {
  avgTicket: number;
  estMonthlySearchVolume: number;
  avgCpc: number;
  highIntentKeywords: string[];
}

const CATEGORY_METRICS: Record<LeadCategory, NicheMetric> = {
  home_services: {
    avgTicket: 850,
    estMonthlySearchVolume: 4800,
    avgCpc: 24.50,
    highIntentKeywords: ['emergency service near me', 'licensed contractor', 'free estimate today', 'local installation repair', 'same day dispatch'],
  },
  health_medical: {
    avgTicket: 1200,
    estMonthlySearchVolume: 3900,
    avgCpc: 18.20,
    highIntentKeywords: ['urgent appointment', 'best specialist in city', 'accepting new patients', 'top rated care', 'insurance accepted'],
  },
  legal_financial: {
    avgTicket: 3500,
    estMonthlySearchVolume: 2200,
    avgCpc: 45.00,
    highIntentKeywords: ['free consultation', 'attorney near me', 'experienced lawyer', 'financial advisor consult', 'tax specialist'],
  },
  automotive: {
    avgTicket: 550,
    estMonthlySearchVolume: 3200,
    avgCpc: 12.80,
    highIntentKeywords: ['auto repair open now', 'brake inspection near me', 'engine diagnostic service', 'mechanic quote', 'mobile mechanic'],
  },
  restaurants_food: {
    avgTicket: 65,
    estMonthlySearchVolume: 8500,
    avgCpc: 3.50,
    highIntentKeywords: ['best food near me', 'table reservation tonight', 'catering delivery service', 'private party venue', 'lunch specials'],
  },
  retail_services: {
    avgTicket: 180,
    estMonthlySearchVolume: 2800,
    avgCpc: 6.20,
    highIntentKeywords: ['store open near me', 'custom orders in-store', 'local boutique gift', 'same day pickup', 'repair workshop'],
  },
  other: {
    avgTicket: 400,
    estMonthlySearchVolume: 2000,
    avgCpc: 9.50,
    highIntentKeywords: ['professional service near me', 'top rated company', 'affordable quote', 'local expert consultation', 'verified reviews'],
  },
};

/**
 * Calculates Website Opportunity metrics for businesses that lack a modern website.
 */
export function calculateWebsiteOpportunity(
  name: string,
  category: LeadCategory,
  rating: number,
  reviewsCount: number,
  city: string
): WebsiteOpportunityAnalysis {
  const metrics = CATEGORY_METRICS[category] || CATEGORY_METRICS.other;
  
  // Calculate Urgency Score:
  // High ratings + substantial reviews without a site = highest urgency
  // Rating factor (max 40 pts)
  const ratingFactor = Math.min(40, (rating / 5) * 40);
  // Reviews factor (max 40 pts): 50 reviews gets ~35 pts
  const reviewFactor = Math.min(40, Math.log10(Math.max(1, reviewsCount)) * 20);
  // Category commercial intent factor (max 20 pts)
  const commercialFactor = metrics.avgTicket > 500 ? 20 : metrics.avgTicket > 150 ? 15 : 10;
  
  const urgencyScore = Math.min(99, Math.round(ratingFactor + reviewFactor + commercialFactor));

  // Estimated lost monthly clients
  const estimatedLostClients = Math.max(3, Math.round((reviewsCount * 0.15) + (metrics.avgTicket > 500 ? 5 : 12)));
  const estimatedLostMonthlyRevenue = Math.round(estimatedLostClients * metrics.avgTicket * 0.7);

  return {
    urgencyScore,
    estimatedLostMonthlyRevenue,
    mobileTrafficLossPercent: 78,
    localCompetitorsWithWebsitesCount: Math.max(6, Math.floor(Math.random() * 10) + 8),
    pitchAngles: {
      credibility: `${name} has an impressive ${rating}★ rating from ${reviewsCount} happy customers on Google, but when new high-value clients search online, there is no official landing page to showcase services, pricing, or credentials.`,
      leadCapture: `Over 75% of local mobile searches in ${city} result in an immediate phone call or online booking form. Without a direct mobile-optimized booking flow, interested customers bounce straight to competitors.`,
      localSeo: `Google's local search algorithm heavily penalizes businesses without a linked domain. Having a fast 1-page site can double local map pack visibility and capture an estimated $${estimatedLostMonthlyRevenue.toLocaleString()}/mo in untapped business.`,
    },
  };
}

/**
 * Calculates Ads Management Opportunity for companies ripe for Google Ads / Local Service Ads.
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

  // Commercial intent weighting
  const ticketWeight = Math.min(40, (metrics.avgTicket / 3000) * 40);
  // Review validation: Having > 10 reviews with 4.0+ is ideal for Google Ads conversion rate
  const reviewScore = rating >= 4.2 && reviewsCount >= 10 ? 35 : reviewsCount >= 5 ? 25 : 15;
  // Category competition:
  const competitionScore = metrics.avgCpc > 15 ? 25 : 15;

  const opportunityScore = Math.min(98, Math.round(ticketWeight + reviewScore + competitionScore));

  const tier: 'High Priority' | 'Moderate' | 'Niche Growth' = 
    opportunityScore >= 75 ? 'High Priority' : opportunityScore >= 55 ? 'Moderate' : 'Niche Growth';

  // Budget calculations based on local CPC
  const suggestedMonthlyBudget = Math.round(metrics.avgCpc * 55 / 50) * 50; // ~55 clicks/mo minimum
  const minCpc = Number((metrics.avgCpc * 0.85).toFixed(2));
  const maxCpc = Number((metrics.avgCpc * 1.35).toFixed(2));
  const potentialMonthlyClicks = Math.round(suggestedMonthlyBudget / metrics.avgCpc);

  const keywords: KeywordEstimate[] = metrics.highIntentKeywords.map((phrase) => {
    const cleanCity = city || 'local';
    return {
      keyword: `${phrase.replace('city', cleanCity)}`,
      monthlySearchVolume: Math.round(metrics.estMonthlySearchVolume / metrics.highIntentKeywords.length * (0.8 + Math.random() * 0.4)),
      estimatedCpc: Number((metrics.avgCpc * (0.9 + Math.random() * 0.3)).toFixed(2)),
      competition: metrics.avgCpc > 20 ? 'High' : 'Medium',
    };
  });

  const recommendedCampaigns = [
    {
      type: 'Google Local Service Ads (LSA / Google Guaranteed)',
      description: 'Pay-per-lead phone calls with official Google verification badge at the very top of search results.',
      priority: (category === 'home_services' || category === 'legal_financial') ? ('Critical' as const) : ('Recommended' as const),
    },
    {
      type: 'High-Intent Google Search Campaign',
      description: `Exact-match targeting for "${keywords[0]?.keyword || 'emergency services'}" capturing high-ticket buyers at the exact moment of search.`,
      priority: 'Critical' as const,
    },
    {
      type: 'Google Maps Promoted Pins & Local Extension',
      description: 'Sponsor top pin placement when people browse nearby map navigation for your trade.',
      priority: 'Recommended' as const,
    },
    {
      type: 'Meta & Retargeting Lead Funnel',
      description: 'Re-engage callers and local profile visitors with social proof reviews and limited seasonal promotions.',
      priority: 'Optional' as const,
    },
  ];

  const primaryPitchAngle = hasWebsite 
    ? `${name} already has a foundational web presence, but competitors in ${city} are buying up the top 3 ad spots for search queries worth $${metrics.avgTicket} avg ticket. An optimized $${suggestedMonthlyBudget.toLocaleString()}/mo search campaign can deliver an estimated ~${potentialMonthlyClicks} qualified inbound phone calls.`
    : `${name} has the customer satisfaction (${rating}★ across ${reviewsCount} reviews) to dominate paid Google Local Service Ads, where leads convert at 28% without requiring a complex multi-page site.`;

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
