import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Lead, SearchFilterState, PipelineStatus } from './types/lead';
import { getProcessedSeedLeads } from './data/mockLeads';
import { searchPlacesOnMap } from './services/placesService';
import { Navbar, CITIES } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { LeadCard } from './components/LeadCard';
import { MapView } from './components/MapView';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { SavedLeadsDrawer } from './components/SavedLeadsDrawer';
import { QuotaBanner } from './components/QuotaBanner';
import { 
  Globe, 
  Megaphone, 
  Search, 
  Map as MapIcon, 
  ListFilter, 
  Sparkles, 
  HelpCircle,
  Download,
  Building2,
  RefreshCw
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Internal container component that has access to useMapsLibrary
const LeadHunterApp: React.FC = () => {
  const placesLib = useMapsLibrary('places');

  // Core App State
  const [allLeads, setAllLeads] = useState<Lead[]>(() => getProcessedSeedLeads());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Map viewport
  const [selectedCity, setSelectedCity] = useState('Austin, TX');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 30.2672,
    lng: -97.7431,
  });
  const [mapZoom, setMapZoom] = useState(13);
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null);

  // Saved Leads CRM (persisted in localStorage)
  const [savedLeads, setSavedLeads] = useState<Lead[]>(() => {
    try {
      const stored = localStorage.getItem('clientradar_saved_leads');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('clientradar_saved_leads', JSON.stringify(savedLeads));
    } catch {
      // Ignore quota errors
    }
  }, [savedLeads]);

  // Filters State
  const [filters, setFilters] = useState<SearchFilterState>({
    searchQuery: '',
    city: 'Austin, TX',
    category: 'all',
    leadTypeFilter: 'no_website_only', // Default to flagship feature requested
    minRating: 0,
    minReviews: 0,
    hasPhoneOnly: false,
    sortBy: 'urgency',
  });

  const handleFilterChange = <K extends keyof SearchFilterState>(
    key: K,
    value: SearchFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Switch City
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    handleFilterChange('city', cityName);
    const matched = CITIES.find((c) => c.name === cityName);
    if (matched) {
      setMapCenter(matched.center);
      setMapZoom(13);
      // Run search in new city
      performSearch(filters.searchQuery || 'contractors', matched.center, cityName);
    }
  };

  // Locate User GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(userLoc);
        setMapZoom(14);
        setSelectedCity('Near Me');
        performSearch(filters.searchQuery || 'local services', userLoc, 'Near Me');
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
      },
      { timeout: 10000 }
    );
  };

  // Perform Live Search
  const performSearch = async (
    query: string,
    bias?: { lat: number; lng: number } | google.maps.LatLngBounds,
    cityCtx?: string
  ) => {
    setIsScanning(true);
    const targetQuery = query.trim() || 'home services and contractors';
    const targetCity = cityCtx || selectedCity;

    try {
      const results = await searchPlacesOnMap(placesLib, targetQuery, bias, targetCity);
      if (results && results.length > 0) {
        setAllLeads(results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(filters.searchQuery, mapCenter, selectedCity);
  };

  const handleSearchThisArea = () => {
    if (currentBounds) {
      performSearch(filters.searchQuery || 'local businesses', currentBounds, selectedCity);
    } else {
      performSearch(filters.searchQuery || 'local businesses', mapCenter, selectedCity);
    }
  };

  // Lead Selection & Details Modal
  const handleSelectLead = (lead: Lead | null) => {
    setSelectedLead(lead);
    if (lead) {
      setIsDetailsOpen(true);
    }
  };

  // Toggle Save to Pipeline
  const handleToggleSave = (lead: Lead) => {
    setSavedLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      if (exists) {
        return prev.filter((l) => l.id !== lead.id);
      } else {
        return [...prev, { ...lead, savedAt: new Date().toISOString(), pipelineStatus: 'new' }];
      }
    });
  };

  const handleRemoveSavedLead = (leadId: string) => {
    setSavedLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleUpdateStatus = (leadId: string, status: PipelineStatus, notes?: string) => {
    setSavedLeads((prev) => {
      const exists = prev.some((l) => l.id === leadId);
      if (exists) {
        return prev.map((l) => (l.id === leadId ? { ...l, pipelineStatus: status, notes } : l));
      } else {
        const found = allLeads.find((l) => l.id === leadId);
        if (found) {
          return [...prev, { ...found, pipelineStatus: status, notes, savedAt: new Date().toISOString() }];
        }
        return prev;
      }
    });

    // Also update in allLeads state
    setAllLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipelineStatus: status, notes } : l))
    );
  };

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      // Flagship lead type filter
      if (filters.leadTypeFilter === 'no_website_only' && lead.hasWebsite) {
        return false;
      }
      if (filters.leadTypeFilter === 'ads_opportunity_only' && (lead.adsAnalysis?.opportunityScore || 0) < 60) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && lead.category !== filters.category) {
        return false;
      }

      // Rating filter
      if (filters.minRating > 0 && lead.rating < filters.minRating) {
        return false;
      }

      // Phone filter
      if (filters.hasPhoneOnly && !lead.phoneNumber) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'urgency') {
        const aScore = a.websiteAnalysis?.urgencyScore || 0;
        const bScore = b.websiteAnalysis?.urgencyScore || 0;
        return bScore - aScore;
      }
      if (filters.sortBy === 'ads_score') {
        const aScore = a.adsAnalysis?.opportunityScore || 0;
        const bScore = b.adsAnalysis?.opportunityScore || 0;
        return bScore - aScore;
      }
      if (filters.sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (filters.sortBy === 'reviews') {
        return b.userRatingCount - a.userRatingCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allLeads, filters]);

  const noWebsiteCount = useMemo(() => allLeads.filter((l) => !l.hasWebsite).length, [allLeads]);
  const adsTargetCount = useMemo(
    () => allLeads.filter((l) => (l.adsAnalysis?.opportunityScore || 0) >= 70).length,
    [allLeads]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Tier 2 Demo Quota Banner */}
      <QuotaBanner />

      {/* Top Navigation */}
      <Navbar
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => handleFilterChange('searchQuery', q)}
        onSearchSubmit={handleSearchSubmit}
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        leadTypeFilter={filters.leadTypeFilter}
        onLeadTypeFilterChange={(type) => handleFilterChange('leadTypeFilter', type)}
        savedLeadsCount={savedLeads.length}
        onOpenSavedDrawer={() => setIsSavedDrawerOpen(true)}
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
      />

      {/* Filter and Niche Pills Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        totalResultsCount={allLeads.length}
        noWebsiteCount={noWebsiteCount}
        adsTargetCount={adsTargetCount}
      />

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex bg-white border-b border-slate-200 px-4 py-2 shrink-0">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg ${
            mobileTab === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Leads List ({filteredLeads.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg ${
            mobileTab === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Google Map</span>
        </button>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Lead List View */}
        <div
          className={`w-full md:w-[480px] lg:w-[520px] xl:w-[560px] h-full flex flex-col bg-slate-50 border-r border-slate-200 shrink-0 ${
            mobileTab === 'map' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List Header Summary */}
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">
                {filters.leadTypeFilter === 'no_website_only'
                  ? '🌐 No-Website Prospects'
                  : filters.leadTypeFilter === 'ads_opportunity_only'
                  ? '📣 Ads Management Candidates'
                  : '📍 All Businesses'}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                {filteredLeads.length}
              </span>
            </div>

            {isScanning && (
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning area...</span>
              </div>
            )}
          </div>

          {/* Scrollable Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">No leads match these criteria</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try switching niches, resetting filters, or moving the map to scan adjacent neighborhoods.
                </p>
                <button
                  onClick={() => {
                    handleFilterChange('leadTypeFilter', 'all');
                    handleFilterChange('category', 'all');
                    handleFilterChange('minRating', 0);
                  }}
                  className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSaved = savedLeads.some((l) => l.id === lead.id);
                return (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedLead?.id === lead.id}
                    isSaved={isSaved}
                    onSelect={handleSelectLead}
                    onToggleSave={handleToggleSave}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Interactive Google Map */}
        <div
          className={`flex-1 h-full p-2 md:p-3 bg-slate-200 ${
            mobileTab === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          <MapView
            leads={filteredLeads}
            selectedLead={selectedLead}
            onSelectLead={handleSelectLead}
            center={mapCenter}
            zoom={mapZoom}
            onBoundsChanged={setCurrentBounds}
            onSearchThisArea={handleSearchThisArea}
          />
        </div>
      </div>

      {/* Modals & Slide-out Drawers */}
      <LeadDetailsModal
        isOpen={isDetailsOpen && selectedLead !== null}
        lead={selectedLead}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedLead(null);
        }}
        isSaved={selectedLead ? savedLeads.some((l) => l.id === selectedLead.id) : false}
        onToggleSave={handleToggleSave}
        onUpdateStatus={handleUpdateStatus}
      />

      <SavedLeadsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedLeads={savedLeads}
        onSelectLead={handleSelectLead}
        onRemoveLead={handleRemoveSavedLead}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default function App() {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      language="en"
      region="US"
      libraries={['places', 'marker', 'core']}
    >
      <LeadHunterApp />
    </APIProvider>
  );
}
