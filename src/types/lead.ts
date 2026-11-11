export type LeadCategory = 
  | 'home_services'
  | 'health_medical'
  | 'legal_financial'
  | 'automotive'
  | 'restaurants_food'
  | 'retail_services'
  | 'other';

export type LeadType = 'no_website' | 'ads_opportunity' | 'both';

export type PipelineStatus = 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'not_interested';

export interface KeywordEstimate {
  keyword: string;
  monthlySearchVolume: number;
  estimatedCpc: number;
  competition: 'High' | 'Medium' | 'Low';
}

export interface AdsOpportunityAnalysis {
  opportunityScore: number; // 0 - 100
  tier: 'High Priority' | 'Moderate' | 'Niche Growth';
  suggestedMonthlyBudget: number;
  estimatedCpcRange: [number, number];
  potentialMonthlyClicks: number;
  recommendedCampaigns: Array<{
    type: string;
    description: string;
    priority: 'Critical' | 'Recommended' | 'Optional';
  }>;
  suggestedKeywords: KeywordEstimate[];
  primaryPitchAngle: string;
}

export interface WebsiteOpportunityAnalysis {
  urgencyScore: number; // 0 - 100
  estimatedLostMonthlyRevenue: number;
  mobileTrafficLossPercent: number;
  localCompetitorsWithWebsitesCount: number;
  pitchAngles: {
    credibility: string;
    leadCapture: string;
    localSeo: string;
  };
}

export interface Lead {
  id: string;
  name: string;
  category: LeadCategory;
  categoryLabel: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  userRatingCount: number;
  priceLevel?: string;
  hasWebsite: boolean;
  websiteUrl?: string | null;
  phoneNumber?: string;
  googleMapsUrl?: string;
  primaryType?: string;
  
  // Lead classifications
  leadType: LeadType;
  websiteAnalysis?: WebsiteOpportunityAnalysis;
  adsAnalysis?: AdsOpportunityAnalysis;
  
  // CRM Tracking
  pipelineStatus?: PipelineStatus;
  savedAt?: string;
  notes?: string;
  contactEmail?: string;
}

export interface SearchFilterState {
  searchQuery: string;
  city: string;
  category: LeadCategory | 'all';
  leadTypeFilter: 'all' | 'no_website_only' | 'ads_opportunity_only';
  minRating: number;
  minReviews: number;
  hasPhoneOnly: boolean;
  sortBy: 'urgency' | 'rating' | 'reviews' | 'name' | 'ads_score';
}
