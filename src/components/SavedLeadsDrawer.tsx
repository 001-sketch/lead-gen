import React, { useState } from 'react';
import { Lead, PipelineStatus } from '../types/lead';
import { 
  X, 
  Download, 
  Trash2, 
  Phone, 
  Globe, 
  Megaphone, 
  Star, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SavedLeadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedLeads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onRemoveLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: PipelineStatus) => void;
}

export const SavedLeadsDrawer: React.FC<SavedLeadsDrawerProps> = ({
  isOpen,
  onClose,
  savedLeads,
  onSelectLead,
  onRemoveLead,
  onUpdateStatus,
}) => {
  if (!isOpen) return null;

  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'all'>('all');

  const filtered = statusFilter === 'all'
    ? savedLeads
    : savedLeads.filter((l) => (l.pipelineStatus || 'new') === statusFilter);

  const handleExportCSV = () => {
    if (savedLeads.length === 0) return;

    const headers = [
      'Business Name',
      'Category',
      'City',
      'Address',
      'Phone Number',
      'Google Rating',
      'Review Count',
      'Has Website',
      'Website URL',
      'Website Urgency Score',
      'Est Lost Monthly Revenue',
      'Ads Opportunity Score',
      'Suggested Monthly Ad Spend',
      'Pipeline Status',
      'Notes',
      'Google Maps URL',
    ];

    const rows = savedLeads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.categoryLabel}"`,
      `"${l.city}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.phoneNumber || ''}"`,
      l.rating,
      l.userRatingCount,
      l.hasWebsite ? 'YES' : 'NO',
      `"${l.websiteUrl || ''}"`,
      l.websiteAnalysis?.urgencyScore || '',
      l.websiteAnalysis?.estimatedLostMonthlyRevenue || '',
      l.adsAnalysis?.opportunityScore || '',
      l.adsAnalysis?.suggestedMonthlyBudget || '',
      `"${l.pipelineStatus || 'new'}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.googleMapsUrl || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ClientRadar_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 cursor-default"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Saved Leads Pipeline</span>
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                {savedLeads.length}
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">Manage your active outreach pipeline & export CSV</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={savedLeads.length === 0}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close pipeline drawer"
              className="p-2 text-slate-300 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer group"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {(['all', 'new', 'contacted', 'meeting_scheduled', 'proposal_sent', 'won'] as const).map((st) => {
            const labels: Record<string, string> = {
              all: 'All Leads',
              new: 'New',
              contacted: 'Contacted',
              meeting_scheduled: 'Meeting Set',
              proposal_sent: 'Pitched',
              won: 'Closed Won',
            };

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>

        {/* Lead List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No leads in this pipeline stage</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Bookmark businesses from the map or lead results list to start building your target outreach list.
              </p>
            </div>
          ) : (
            filtered.map((lead) => {
              const isNoWebsite = !lead.hasWebsite;

              return (
                <div
                  key={lead.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {lead.categoryLabel}
                        </span>
                        {isNoWebsite ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            No Website
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Website Active
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{lead.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{lead.address}</p>
                    </div>

                    <button
                      onClick={() => onRemoveLead(lead.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Remove from Saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                        {lead.rating}
                      </span>
                      {lead.phoneNumber && (
                        <a href={`tel:${lead.phoneNumber}`} className="text-slate-600 hover:text-blue-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{lead.phoneNumber}</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onSelectLead(lead);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs"
                    >
                      <span>Open Pitch & Audit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
