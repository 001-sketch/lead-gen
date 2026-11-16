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

export function generateWebDesignPitch(lead: Lead, agencyName: string = 'Digital Elevate Kenya'): GeneratedPitch {
  const analysis = lead.websiteAnalysis;
  const lostRev = analysis ? `KSh ${analysis.estimatedLostMonthlyRevenue.toLocaleString()}` : 'KSh 85,000';
  const reviews = lead.userRatingCount || 0;
  const rating = lead.rating || 0;
  const city = lead.city || 'Kenya';
  const reputationLine =
    reviews > 0
      ? `maintaining a ${rating.toFixed(1)}★ rating across ${reviews} Google reviews`
      : `your verified presence on Google Maps in ${city}`;

  return {
    type: 'website',
    title: `Web Design & WhatsApp Lead Capture Pitch for ${lead.name}`,
    emailSubject: `Quick observation regarding ${lead.name}'s Google Maps listing in ${city}`,
    emailBody: `Hi ${lead.name} team,

I was searching for top ${lead.categoryLabel.toLowerCase()} businesses in ${city} on Google Maps and came across your profile.

First off, great work on ${reputationLine}—customers clearly trust what you deliver.

However, I noticed your Google Maps profile does not have an official website linked. When Kenyans search for "${lead.categoryLabel.toLowerCase()} in ${city}" on their phones, over 80% look for a fast website to check pricing, browse services, or tap directly into WhatsApp for an instant quote.

Without a dedicated website, an estimated ${lostRev}/month in high-value inquiries are slipping straight to competitors who have mobile-ready sites.

We build fast, mobile-first websites specifically for ${lead.categoryLabel.toLowerCase()} businesses in Kenya that:
1. Rank higher in Google Local & Maps searches across ${city}
2. Include 1-tap WhatsApp quote requests & phone call buttons
3. Showcase your services, location pin, and customer reviews professionally

Would you be open to a quick 5-minute call this week to see a free 1-page sample mockup I put together for ${lead.name}?

Best regards,
Lead Partnerships | ${agencyName}`,
    phoneScript: {
      hook: `Habari! Is this the owner or manager of ${lead.name}? My name is [Name] with ${agencyName}. I'm calling because I spotted your business on Google Maps in ${city}, and noticed you don't have an official website linked to your profile yet.`,
      valueProp: `Right now, customers across ${city} search on Google every day for ${lead.categoryLabel.toLowerCase()}, and without a website they can't see your full services or click straight to WhatsApp to request a quote. We estimate you could be missing around ${lostRev}/month in new inquiries.`,
      objectionHandling: `"We get our clients via referrals and walk-ins" -> "That's awesome and shows you do quality work! Even referral clients Google your business name first to check legitimacy and directions. A clean mobile site with a WhatsApp button makes sure you never lose those warm referrals."`,
      callToAction: `Can I send a quick 2-minute preview mockup built for ${lead.name} to your WhatsApp or email? Which number or email works best?`,
    },
    smsText: `Habari ${lead.name} team! Saw your Google Maps listing in ${city}. Did you know you don't have a website linked? Businesses without sites lose ~${lostRev}/mo to competitors. Can I share a free sample website mockup on WhatsApp? - [Name]`,
    auditHighlights: [
      reviews > 0
        ? `Google rating: ${rating.toFixed(1)}★ with ${reviews} reviews (Strong Social Proof)`
        : `Verified Google Maps listing in ${city} with no linked domain`,
      `No official website connected on Google Maps`,
      `Estimated lost monthly revenue: ${lostRev}`,
      `Mobile search drop-off: ~82% without instant WhatsApp/quote landing page`,
    ],
  };
}

export function generateAdsPitch(lead: Lead, agencyName: string = 'AdVantage Growth Kenya'): GeneratedPitch {
  const analysis = lead.adsAnalysis;
  const budget = analysis ? `KSh ${analysis.suggestedMonthlyBudget.toLocaleString()}` : 'KSh 25,000';
  const topKw = analysis?.suggestedKeywords[0]?.keyword || `${lead.categoryLabel.toLowerCase()} in ${lead.city || 'Kenya'}`;
  const rating = lead.rating || 0;
  const reviews = lead.userRatingCount || 0;
  const city = lead.city || 'Kenya';
  const trustLine =
    reviews > 0
      ? `Given your ${rating.toFixed(1)}★ reputation across ${reviews} reviews, ${lead.name} has the exact credibility needed to convert paid clicks at a much lower cost-per-lead than competitors.`
      : `With ${lead.name} already verified on Google Maps in ${city}, targeted ads can immediately place you above older competitors on high-intent local searches.`;

  return {
    type: 'ads',
    title: `Google Search, Maps Pins & WhatsApp Ads Strategy for ${lead.name}`,
    emailSubject: `Ad opportunity: Capturing high-intent ${lead.categoryLabel.toLowerCase()} clients in ${city}`,
    emailBody: `Hi ${lead.name} Management,

I analyzed local search demand for ${lead.categoryLabel.toLowerCase()} in ${city} this week. High-intent searches like "${topKw}" generate thousands of monthly queries from Kenyans ready to call or WhatsApp a provider immediately.

Right now, competing businesses are running Google Search Ads and Maps Promoted Pins to capture those calls before customers even scroll down to the organic map results.

${trustLine}

Here is what we project for ${lead.name}:
• Suggested Starter Ad Budget: ${budget}/mo
• Projected Inbound Inquiries & Clicks: ~${analysis?.potentialMonthlyClicks || 220}/mo
• Recommended Channels: Google Search Call Ads + Google Maps Promoted Pins + Click-to-WhatsApp Meta Ads

Could we schedule a brief 10-minute call next week to walk through the local keyword volume report for ${city}?

Warm regards,
Performance Marketing Lead | ${agencyName}`,
    phoneScript: {
      hook: `Habari, this is [Name] with ${agencyName}. We help ${lead.categoryLabel.toLowerCase()} businesses in ${city} get daily inbound calls and WhatsApp leads, and I noticed ${lead.name} isn't currently running Google Search or Maps Promoted Ads.`,
      valueProp: `Every day, buyers in ${city} search "${topKw}" on their phones and call the first 2 sponsored listings at the top of Google. With a targeted ${budget}/mo campaign, we can put ${lead.name} right at the top and drive ~${analysis?.potentialMonthlyClicks || 220} high-intent clicks and calls every month.`,
      objectionHandling: `"We boosted posts on Facebook/Instagram before and got time-wasters" -> "Totally understand! Boosting social posts reaches casual browsers. Google Search Ads target people actively searching for '${topKw}' right at the moment they need to hire and pay."`,
      callToAction: `I put together a 1-page keyword & ad forecast for ${city}. Can I share it with you on WhatsApp or email?`,
    },
    smsText: `Habari ${lead.name}! Checked out your Google profile in ${city}. Searches for "${topKw}" are surging, and competitors are capturing the top Google Ad slots. Can I send our free 1-page ${city} Ads Audit? - [Name]`,
    auditHighlights: [
      reviews > 0
        ? `Review authority: ${rating.toFixed(1)}★ with ${reviews} reviews (Boosts Ad CTR)`
        : `Verified Google Maps location in ${city}`,
      `Top keyword target: "${topKw}"`,
      `Suggested monthly media budget: ${budget}/mo`,
      `Recommended channels: Google Search Call Ads, Maps Pins & Click-to-WhatsApp`,
    ],
  };
}
