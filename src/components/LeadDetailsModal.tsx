import React, { useState } from 'react';
import { Lead, PipelineStatus } from '../types/lead';
import { generateWebDesignPitch, generateAdsPitch } from '../services/aiPitchGenerator';
import { 
  X, 
  Globe, 
  Megaphone, 
  Phone, 
  ExternalLink, 
  Star, 
  MapPin, 
  Copy, 
  Check, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Building,
  Target
} from 'lucide-react';

interface LeadDetailsModalProps {
  isOpen?: boolean;
  lead: Lead | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: PipelineStatus, notes?: string) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  isOpen = true,
  lead,
  onClose,
  isSaved,
  onToggleSave,
  onUpdateStatus,
}) => {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState<'website' | 'ads' | 'crm'>('website');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [notes, setNotes] = useState(lead.notes || '');
  const [status, setStatus] = useState<PipelineStatus>(lead.pipelineStatus || 'new');

  // Close on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const webPitch = generateWebDesignPitch(lead);
  const adsPitch = generateAdsPitch(lead);

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleSaveNotes = () => {
    onUpdateStatus(lead.id, status, notes);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default"
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {lead.categoryLabel}
              </span>

              {!lead.hasWebsite ? (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  No Website Detected
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Website Active
                </span>
              )}

              {(lead.adsAnalysis?.opportunityScore || 0) >= 70 && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5" />
                  Prime Ads Candidate ({lead.adsAnalysis?.opportunityScore}/100)
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1">
              {lead.name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                {lead.rating} ({lead.userRatingCount} reviews)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {lead.address}
              </span>
              {lead.phoneNumber && (
                <>
                  <span>•</span>
                  <a href={`tel:${lead.phoneNumber}`} className="text-blue-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {lead.phoneNumber}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(lead)}
              className={`p-2 rounded-xl transition-colors ${
                isSaved ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isSaved ? 'Saved to Pipeline' : 'Save to Pipeline'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5 fill-white" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close dialog"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-all cursor-pointer group shadow-sm"
              title="Close dialog (Esc)"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('website')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'website'
                ? 'bg-white text-rose-700 border-rose-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <Globe className="w-4 h-4 text-rose-600" />
            <span>Web Design Pitch & Opportunity</span>
            {!lead.hasWebsite && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                Prime Lead
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'ads'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <Megaphone className="w-4 h-4 text-indigo-600" />
            <span>Ads Management Strategy & Forecast</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              Score: {lead.adsAnalysis?.opportunityScore || 75}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'crm'
                ? 'bg-white text-blue-700 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <Building className="w-4 h-4 text-blue-600" />
            <span>Outreach CRM & Pipeline</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: WEB DESIGN PROSPECTING */}
          {activeTab === 'website' && (
            <div className="space-y-6">
              {/* Top Banner Metric Summary */}
              {!lead.hasWebsite ? (
                <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent p-4 rounded-xl border border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Opportunity Verdict: High-Priority Web Design Client</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed max-w-xl">
                      {lead.name} has built strong organic reputation ({lead.rating}★ with {lead.userRatingCount} reviews) but is completely invisible to customers requiring online quotes, booking schedules, or credential checks.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg border border-rose-200 shadow-sm shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Lost Revenue</span>
                      <span className="text-lg font-extrabold text-rose-600">
                        ~${lead.websiteAnalysis?.estimatedLostMonthlyRevenue.toLocaleString() || '9,500'}/mo
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Urgency Score</span>
                      <span className="text-lg font-extrabold text-amber-600">
                        {lead.websiteAnalysis?.urgencyScore || 92}/100
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">Existing Domain Detected</span>
                    <p className="text-xs text-slate-600">
                      Website URL: <a href={lead.websiteUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-mono">{lead.websiteUrl}</a>
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                    Redesign / Landing Page Angle
                  </span>
                </div>
              )}

              {/* Pitch Angle Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>The Credibility Angle</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lead.websiteAnalysis?.pitchAngles.credibility || `Great reviews (${lead.rating}★), but missing a professional destination to showcase portfolio, licenses, and customer guarantees.`}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Instant Lead Capture</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lead.websiteAnalysis?.pitchAngles.leadCapture || `Over 70% of local consumers search on phones and want a fast 20-second form or direct click-to-call rather than navigating generic directories.`}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Local SEO Advantage</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lead.websiteAnalysis?.pitchAngles.localSeo || `Having a fast mobile site with localized schema markup boosts rank on Google Maps Pack by up to 2.4x.`}
                  </p>
                </div>
              </div>

              {/* Pitch Asset 1: Cold Email Outreach */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <h3 className="font-bold text-sm text-slate-900">Cold Email Outreach Copy</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(`Subject: ${webPitch.emailSubject}\n\n${webPitch.emailBody}`, 'email-web')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    {copiedSection === 'email-web' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs font-mono text-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-400 font-sans font-bold">Subject: </span>
                    <span className="font-semibold">{webPitch.emailSubject}</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="whitespace-pre-line font-sans text-xs text-slate-700 leading-relaxed">
                    {webPitch.emailBody}
                  </div>
                </div>
              </div>

              {/* Pitch Asset 2: Phone Script with Objection Handling */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-700" />
                    <h3 className="font-bold text-sm text-slate-900">Cold Call Opening Script & Objection Handling</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(`${webPitch.phoneScript.hook}\n\n${webPitch.phoneScript.valueProp}\n\nObjections:\n${webPitch.phoneScript.objectionHandling}\n\nCTA: ${webPitch.phoneScript.callToAction}`, 'phone-web')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    {copiedSection === 'phone-web' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-blue-600 block mb-0.5">Opening Hook:</span>
                    <p className="text-slate-700">{webPitch.phoneScript.hook}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-blue-600 block mb-0.5">Value Proposition & Urgency:</span>
                    <p className="text-slate-700">{webPitch.phoneScript.valueProp}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-rose-600 block mb-0.5">Overcoming Common Objection:</span>
                    <p className="text-slate-700 italic">{webPitch.phoneScript.objectionHandling}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADS MANAGEMENT PROSPECTING (SEPARATE FEATURE AS REQUESTED) */}
          {activeTab === 'ads' && (
            <div className="space-y-6">
              {/* Ads Opportunity Overview Card */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Paid Acquisition Intelligence
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      Ads Opportunity Score: {lead.adsAnalysis?.opportunityScore}/100 ({lead.adsAnalysis?.tier})
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                      {lead.adsAnalysis?.primaryPitchAngle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur px-4 py-3 rounded-xl border border-white/10 shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-200 block">Recommended Budget</span>
                      <span className="text-xl font-extrabold text-amber-300">
                        ${lead.adsAnalysis?.suggestedMonthlyBudget.toLocaleString()}/mo
                      </span>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-200 block">Inbound Calls/Mo</span>
                      <span className="text-xl font-extrabold text-emerald-300">
                        ~{lead.adsAnalysis?.potentialMonthlyClicks}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Keyword Cluster with CPC Estimates */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                    High-Intent Local Keyword Opportunities
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lead.adsAnalysis?.suggestedKeywords.map((kw, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-2.5 text-xs border border-white/5 space-y-1">
                        <div className="font-semibold text-white truncate" title={kw.keyword}>
                          "{kw.keyword}"
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-indigo-200">
                          <span>Vol: ~{kw.monthlySearchVolume.toLocaleString()}/mo</span>
                          <span className="font-bold text-amber-300">Est. CPC: ${kw.estimatedCpc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Campaign Architecture */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900">
                  Recommended Ad Campaigns to Pitch to {lead.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lead.adsAnalysis?.recommendedCampaigns.map((camp, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{camp.type}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          camp.priority === 'Recommended' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {camp.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{camp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ads Management Pitch Email */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-700" />
                    <h3 className="font-bold text-sm text-slate-900">Executive Ads Management Pitch Email</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(`Subject: ${adsPitch.emailSubject}\n\n${adsPitch.emailBody}`, 'email-ads')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    {copiedSection === 'email-ads' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs font-mono text-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-400 font-sans font-bold">Subject: </span>
                    <span className="font-semibold">{adsPitch.emailSubject}</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="whitespace-pre-line font-sans text-xs text-slate-700 leading-relaxed">
                    {adsPitch.emailBody}
                  </div>
                </div>
              </div>

              {/* Ads Cold Call Pitch */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-700" />
                    <h3 className="font-bold text-sm text-slate-900">Ads Management Phone Pitch Script</h3>
                  </div>
                  <button
                    onClick={() => handleCopy(`${adsPitch.phoneScript.hook}\n\n${adsPitch.phoneScript.valueProp}\n\nObjections:\n${adsPitch.phoneScript.objectionHandling}\n\nCTA: ${adsPitch.phoneScript.callToAction}`, 'phone-ads')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    {copiedSection === 'phone-ads' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-600 block mb-0.5">Opening Hook:</span>
                    <p className="text-slate-700">{adsPitch.phoneScript.hook}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-indigo-600 block mb-0.5">Value Proposition & ROI Math:</span>
                    <p className="text-slate-700">{adsPitch.phoneScript.valueProp}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-rose-600 block mb-0.5">Objection ("We burned money on ads before"):</span>
                    <p className="text-slate-700 italic">{adsPitch.phoneScript.objectionHandling}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRM PIPELINE & NOTES */}
          {activeTab === 'crm' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Lead Pipeline Status</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'won', 'not_interested'] as PipelineStatus[]).map((st) => {
                    const isCur = status === st;
                    const labels: Record<PipelineStatus, string> = {
                      new: 'New Prospect',
                      contacted: 'Contacted',
                      meeting_scheduled: 'Meeting Booked',
                      proposal_sent: 'Proposal Sent',
                      won: 'Deal Won',
                      not_interested: 'Archived / N.I.',
                    };

                    return (
                      <button
                        key={st}
                        onClick={() => {
                          setStatus(st);
                          onUpdateStatus(lead.id, st, notes);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                          isCur
                            ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {labels[st]}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">Outreach Notes & Next Steps</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter owner name, notes from call, follow-up date, or custom pricing..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      Save CRM Updates
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Maps & Contact Actions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-800">Direct Verification</span>
                  <p className="text-xs text-slate-500">Inspect the place directly on Google Maps or dial right away.</p>
                </div>

                <div className="flex items-center gap-2">
                  {lead.googleMapsUrl && (
                    <a
                      href={lead.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open on Google Maps</span>
                    </a>
                  )}

                  {lead.phoneNumber && (
                    <a
                      href={`tel:${lead.phoneNumber}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call {lead.phoneNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Lead ID: <span className="font-mono text-slate-600">{lead.id}</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Close Pitch Center
          </button>
        </div>
      </div>
    </div>
  );
};
