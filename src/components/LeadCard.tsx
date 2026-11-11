import React from 'react';
import { Lead } from '../types/lead';
import { 
  Globe, 
  Megaphone, 
  Star, 
  MapPin, 
  Phone, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  AlertTriangle, 
  TrendingUp,
  ExternalLink 
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (lead: Lead) => void;
  onToggleSave: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  isSelected,
  isSaved,
  onSelect,
  onToggleSave,
}) => {
  const isNoWebsite = !lead.hasWebsite;
  const webScore = lead.websiteAnalysis?.urgencyScore || 0;
  const adsScore = lead.adsAnalysis?.opportunityScore || 0;

  return (
    <div
      onClick={() => onSelect(lead)}
      className={`group relative bg-white rounded-xl p-4 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header Badges & Bookmark */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {lead.categoryLabel}
          </span>

          {isNoWebsite ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
              <Globe className="w-3 h-3 text-rose-600" />
              No Website
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Globe className="w-3 h-3 text-emerald-600" />
              Website Live
            </span>
          )}

          {adsScore >= 70 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Megaphone className="w-3 h-3 text-indigo-600" />
              Top Ads Target
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(lead);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            isSaved
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
          title={isSaved ? 'Saved to CRM' : 'Save Lead'}
        >
          {isSaved ? <BookmarkCheck className="w-4 h-4 fill-blue-600" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {/* Business Name & Address */}
      <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
        {lead.name}
      </h3>

      <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
        <div className="flex items-center gap-1 font-bold text-amber-600">
          <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
          <span>{lead.rating.toFixed(1)}</span>
        </div>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">{lead.userRatingCount} reviews</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">{lead.city}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 line-clamp-1">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{lead.address}</span>
      </div>

      {/* Opportunity Highlights Bar */}
      <div className="pt-2.5 pb-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
        {/* Left: Web Design Metric */}
        {isNoWebsite ? (
          <div className="bg-rose-50/70 rounded-lg p-2 border border-rose-100">
            <div className="flex items-center justify-between text-[11px] text-rose-900 font-semibold mb-0.5">
              <span>Web Urgency</span>
              <span className="font-bold">{webScore}/100</span>
            </div>
            <div className="w-full bg-rose-200/70 h-1.5 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-rose-600 h-full rounded-full" 
                style={{ width: `${webScore}%` }} 
              />
            </div>
            <span className="text-[10px] text-rose-700 block truncate">
              ~${lead.websiteAnalysis?.estimatedLostMonthlyRevenue.toLocaleString()}/mo lost
            </span>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60">
            <span className="text-[10px] text-slate-500 block font-medium">Domain Linked</span>
            <a 
              href={lead.websiteUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 truncate"
            >
              <span className="truncate">{lead.websiteUrl?.replace(/^https?:\/\/(www\.)?/, '')}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          </div>
        )}

        {/* Right: Ads Management Metric */}
        <div className="bg-indigo-50/70 rounded-lg p-2 border border-indigo-100">
          <div className="flex items-center justify-between text-[11px] text-indigo-900 font-semibold mb-0.5">
            <span>Ads Potential</span>
            <span className="font-bold">{adsScore}/100</span>
          </div>
          <div className="w-full bg-indigo-200/70 h-1.5 rounded-full overflow-hidden mb-1">
            <div 
              className="bg-indigo-600 h-full rounded-full" 
              style={{ width: `${adsScore}%` }} 
            />
          </div>
          <span className="text-[10px] text-indigo-700 block truncate">
            Rec: ${lead.adsAnalysis?.suggestedMonthlyBudget.toLocaleString()}/mo spend
          </span>
        </div>
      </div>

      {/* Footer Quick Action Bar */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {lead.phoneNumber ? (
          <a
            href={`tel:${lead.phoneNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium py-1 px-2 rounded hover:bg-slate-100 transition-colors"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>{lead.phoneNumber}</span>
          </a>
        ) : (
          <span className="text-slate-400 text-[11px]">Phone via Maps</span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(lead);
          }}
          className="flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 group-hover:translate-x-0.5 transition-all text-xs"
        >
          <span>Pitches & Audit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
