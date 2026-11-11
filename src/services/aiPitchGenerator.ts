import { Lead } from '../types/lead';

export interface GeneratedPitch {
  type: 'website' | 'ads';
  title: string;
  emailSubject: string;
  emailBody: string;
  phoneScript: {
    hook: string;
    valueProp: string;
    objectionHandling: string;
    callToAction: string;
  };
  smsText: string;
  auditHighlights: string[];
}

export function generateWebDesignPitch(lead: Lead, agencyName: string = 'Digital Elevate Agency'): GeneratedPitch {
  const analysis = lead.websiteAnalysis;
  const lostRev = analysis ? `$${analysis.estimatedLostMonthlyRevenue.toLocaleString()}` : '$8,500';
  const reviews = lead.userRatingCount || 25;
  const rating = lead.rating || 4.8;
  const city = lead.city || 'your area';

  return {
    type: 'website',
    title: `Web Design & Local Lead Capture Pitch for ${lead.name}`,
    emailSubject: `Quick observation regarding ${lead.name}'s Google listing in ${city}`,
    emailBody: `Hi there ${lead.name} team,

I was looking up top-rated ${lead.categoryLabel.toLowerCase()} services in ${city} and came across your business listing on Google Maps. 

First off, congratulations on having such a strong reputation — maintaining a ${rating}★ rating across ${reviews} reviews is outstanding and proves you do exceptional work.

However, I noticed your Google profile doesn't have an official website linked. When customers search for "${lead.categoryLabel.toLowerCase()} in ${city}" on mobile phones, over 70% tap looking for an instant estimate, price breakdown, or direct booking form. 

Without a dedicated page, an estimated ${lostRev}/month in high-ticket jobs are quietly slipping to competitors down the street who have modern sites.

We build high-converting, mobile-first websites specifically for local ${lead.categoryLabel.toLowerCase()} businesses that:
1. Rank at the top of Google Local searches
2. Allow homeowners/clients to request a quote in 30 seconds
3. Showcase your ${reviews} five-star Google reviews prominently

Would you be open to a 5-minute call this Thursday to see a quick 1-page mock-up I put together for ${lead.name}? No strings attached.

Best regards,
Lead Partnerships Team | ${agencyName}`,
    phoneScript: {
      hook: `Hi, is this the owner of ${lead.name}? Hey, my name is [Name] with ${agencyName}. I’m calling because you have a stellar ${rating}★ rating on Google with ${reviews} reviews, but I noticed you don't have an official website connected to your profile.`,
      valueProp: `Right now, people in ${city} are searching for your exact services every day, but because there's no website, Google's algorithm pushes other companies above you, and callers don't have an easy way to see your work or request quotes online. We calculate you're losing around ${lostRev}/month in missed estimates.`,
      objectionHandling: `"We get all our business through word of mouth" -> "That's fantastic and speaks to your quality! That's actually why a modern site works so well for you — word of mouth clients still Google your name before hiring you to check credibility and phone number. A clean site protects that reputation."`,
      callToAction: `Can I send a 2-minute video preview of a sample layout we built for your business to your email or text? What’s the best email address?`,
    },
    smsText: `Hey ${lead.name} team! Loved seeing your ${rating}★ reviews on Google in ${city}. Did you know you're missing an official website on your Maps listing? You're losing an est. ${lostRev}/mo to competitors. Can I text you a free 1-page mockup? - [Name]`,
    auditHighlights: [
      `Google rating: ${rating}★ with ${reviews} reviews (High Trust)`,
      `No official website connected on Google Maps`,
      `Estimated lost monthly revenue: ${lostRev}`,
      `Mobile search bounce rate: ~78% due to missing booking/info flow`,
    ],
  };
}

export function generateAdsPitch(lead: Lead, agencyName: string = 'AdVantage Growth Partners'): GeneratedPitch {
  const analysis = lead.adsAnalysis;
  const budget = analysis ? `$${analysis.suggestedMonthlyBudget.toLocaleString()}` : '$1,500';
  const topKw = analysis?.suggestedKeywords[0]?.keyword || `emergency ${lead.categoryLabel.toLowerCase()} near me`;
  const rating = lead.rating || 4.8;
  const reviews = lead.userRatingCount || 30;
  const city = lead.city || 'your area';

  return {
    type: 'ads',
    title: `Google Ads & Local Service Ads Acceleration for ${lead.name}`,
    emailSubject: `Ad opportunity: Capturing high-intent ${lead.categoryLabel.toLowerCase()} leads in ${city}`,
    emailBody: `Hi ${lead.name} Management,

I analyzed local search demand for ${lead.categoryLabel.toLowerCase()} in ${city} this week. High-intent terms like "${topKw}" receive thousands of monthly searches from people ready to buy immediately.

Right now, competing companies are bidding aggressively on Google Ads and Google Guaranteed (Local Service Ads) to capture these inbound phone calls before customers even scroll down to the organic map results.

Given your stellar ${rating}★ track record across ${reviews} reviews, ${lead.name} has the exact review authority needed to dominate pay-per-lead advertising at a significantly lower cost-per-acquisition than your competitors.

Here is what we project for ${lead.name}:
• Suggested Starter Ad Budget: ${budget}/mo
• Projected Inbound Client Calls: ~${analysis?.potentialMonthlyClicks || 45} qualified leads/mo
• Primary Channels: Google Local Service Ads (pay only for booked calls) + High-Intent Exact Search

Could we schedule a brief 10-minute strategy review next week to walk through the keyword search volume report for your zip code?

Warm regards,
Senior Media Buyer | ${agencyName}`,
    phoneScript: {
      hook: `Hi, this is [Name] with ${agencyName}. I'm reaching out because we manage paid search campaigns for top-tier ${lead.categoryLabel.toLowerCase()} companies, and noticed ${lead.name} isn't currently running Google Local Service Ads or Search Ads in ${city}.`,
      valueProp: `With your ${rating}★ rating and ${reviews} reviews, you are actually in the top 10% of trustworthy businesses in the area. But competitors are buying the top 3 spots on Google, taking the highest-ticket emergency calls. A targeted ${budget}/mo campaign can generate an extra 30-50 high-ticket phone calls every month.`,
      objectionHandling: `"We tried ads before and they didn't work" -> "I hear that a lot! Most agencies bid on broad generic keywords that burn money on tire-kickers. We use negative keyword lists and Google Guaranteed badges so you only pay for actual qualified inbound phone calls from local customers."`,
      callToAction: `I have a 1-page keyword forecast showing exactly how many people in your zip codes searched for your services last month. Can I email that over?`,
    },
    smsText: `Hi ${lead.name}! Checked out your ${rating}★ profile in ${city}. Local search volume for "${topKw}" is up 40% this quarter, but competitors are dominating Google's top ad slots. Can I email you our free 1-page Ads Audit? - [Name]`,
    auditHighlights: [
      `Review authority: ${rating}★ with ${reviews} reviews (Ideal for 3x higher ad CTR)`,
      `Top keyword target: "${topKw}"`,
      `Suggested monthly media budget: ${budget}/mo`,
      `Recommended ad channel: Google Local Service Ads (Pay-per-lead) + Search`,
    ],
  };
}
