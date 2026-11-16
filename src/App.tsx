import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  APIProvider,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { Lead, SearchFilterState, PipelineStatus } from './types/lead';
import { searchPlacesOnMap } from './services/placesService';
import { Navbar, CITIES } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { LeadCard } from './components/LeadCard';
import { MapView } from './components/MapView';
import { LeadDetailsModal } from './components/LeadDetailsModal';
import { SavedLeadsDrawer } from './components/SavedLeadsDrawer';
import { QuotaBanner } from './components/QuotaBanner';
import {
  Search,
  Map as MapIcon,
  ListFilter,
  RefreshCw,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const QUICK_KENYA_NICHES = [
  { label: 'All High-Demand Niches', query: '' },
  { label: 'Plumbers & Contractors', query: 'plumbers and hardware contractors' },
  { label: 'Auto Garages & Spares', query: 'auto repair garages' },
  { label: 'Dental & Medical Clinics', query: 'dental and medical clinics' },
  { label: 'Salons & Barbershops', query: 'beauty salons and barbershops' },
  { label: 'Advocates & Accountants', query: 'law firms and accountants' },
  { label: 'Hotels & Restaurants', query: 'restaurants and cafes' },
];

// Internal container component that has access to useMapsLibrary
const LeadHunterApp: React.FC = () => {
  const placesLib = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();

  // Core App State (populated strictly from live Google Maps Places API)
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isScanning, setIsScanning] = useState(Boolean(GOOGLE_MAPS_API_KEY));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [scanBatch, setScanBatch] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(
    GOOGLE_MAPS_API_KEY ? null : 'Google Maps API key is not configured.'
  );
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Kenya Map Viewport (Default: All Kenya multi-city overview)
  const [selectedCity, setSelectedCity] = useState('All Kenya (Overview)');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -0.8,
    lng: 37.2,
  });
  const [mapZoom, setMapZoom] = useState(6);
  const [currentBounds, setCurrentBounds] = useState<google.maps.LatLngBounds | null>(null);
  const hasRunInitialScan = useRef(false);

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

  // Filters State (default 15+ reviews for both No Website & Ads Management reliability)
  const [filters, setFilters] = useState<SearchFilterState>({
    searchQuery: '',
    city: 'All Kenya (Overview)',
    category: 'all',
    leadTypeFilter: 'no_website_only',
    minRating: 0,
    minReviews: 15,
    hasPhoneOnly: false,
    sortBy: 'reviews',
  });

  const handleFilterChange = <K extends keyof SearchFilterState>(
    key: K,
    value: SearchFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Monitor Maps API loading failures so scanning state never hangs
  useEffect(() => {
    if (
      apiStatus === APILoadingStatus.FAILED ||
      apiStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      setIsScanning(false);
      setSearchError('Google Maps failed to authorize or load. Check your API key or quota.');
    }
  }, [apiStatus]);

  // Perform Live Multi-Hub / Multi-Niche Google Maps Search in Kenya
  const performSearch = useCallback(
    async (
      query: string,
      bias?: { lat: number; lng: number } | google.maps.LatLngBounds,
      cityCtx?: string,
      options?: { append?: boolean; batchIndex?: number; minReviews?: number }
    ) => {
      if (!placesLib) {
        setIsScanning(false);
        setIsLoadingMore(false);
        return;
      }

      const append = options?.append ?? false;
      const batchIndex = options?.batchIndex ?? 0;
      const targetMinReviews = options?.minReviews ?? filters.minReviews;
      const targetCity = cityCtx || selectedCity;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsScanning(true);
        setScanBatch(0);
      }
      setSearchError(null);

      try {
        const { leads, error } = await searchPlacesOnMap(
          placesLib,
          query,
          bias,
          targetCity,
          { minReviews: targetMinReviews, batchIndex }
        );
        if (error) {
          setSearchError(error);
        }

        if (append) {
          setAllLeads((prev) => {
            const existingIds = new Set(prev.map((l) => l.id));
            const uniqueNew = leads.filter((l) => !existingIds.has(l.id));
            return [...prev, ...uniqueNew];
          });
          setScanBatch(batchIndex);
        } else {
          setAllLeads(leads);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setSearchError('Unable to reach Google Places API. Please try again.');
      } finally {
        setIsScanning(false);
        setIsLoadingMore(false);
      }
    },
    [placesLib, selectedCity, filters.minReviews]
  );

  // Automatically load initial nationwide Kenyan leads as soon as Google Places library is ready
  useEffect(() => {
    if (placesLib && !hasRunInitialScan.current) {
      hasRunInitialScan.current = true;
      performSearch('', { lat: -0.8, lng: 37.2 }, 'All Kenya (Overview)', {
        minReviews: 15,
        batchIndex: 0,
      });
    }
  }, [placesLib, performSearch]);

  // Switch Kenyan City / Town
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    handleFilterChange('city', cityName);
    const matched = CITIES.find((c) => c.name === cityName);
    if (matched) {
      setMapCenter(matched.center);
      setMapZoom(matched.zoom);
      setCurrentBounds(null);
      performSearch(filters.searchQuery, matched.center, cityName, {
        minReviews: filters.minReviews,
        batchIndex: 0,
      });
    }
  };

  // Locate User GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
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
        performSearch(filters.searchQuery, userLoc, 'Near Me', {
          minReviews: filters.minReviews,
          batchIndex: 0,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setSearchError('Could not retrieve your GPS location. Please select a Kenyan city from the dropdown.');
      },
      { timeout: 10000 }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(filters.searchQuery, mapCenter, selectedCity, {
      minReviews: filters.minReviews,
      batchIndex: 0,
    });
  };

  const handleSearchThisArea = () => {
    if (currentBounds) {
      performSearch(filters.searchQuery, currentBounds, selectedCity, {
        minReviews: filters.minReviews,
        batchIndex: 0,
      });
    } else {
      performSearch(filters.searchQuery, mapCenter, selectedCity, {
        minReviews: filters.minReviews,
        batchIndex: 0,
      });
    }
  };

  const handleLoadMoreLeads = () => {
    const nextBatch = scanBatch + 1;
    performSearch(
      filters.searchQuery,
      selectedCity === 'All Kenya (Overview)' ? mapCenter : currentBounds || mapCenter,
      selectedCity,
      {
        append: true,
        batchIndex: nextBatch,
        minReviews: filters.minReviews,
      }
    );
  };

  const handleQuickNicheScan = (query: string) => {
    handleFilterChange('searchQuery', query);
    handleFilterChange('category', 'all');
    performSearch(
      query,
      selectedCity === 'All Kenya (Overview)' ? mapCenter : currentBounds || mapCenter,
      selectedCity,
      { minReviews: filters.minReviews, batchIndex: 0 }
    );
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

    setAllLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipelineStatus: status, notes } : l))
    );

    setSelectedLead((prev) =>
      prev && prev.id === leadId ? { ...prev, pipelineStatus: status, notes } : prev
    );
  };

  // Reliable pool enforcing minReviews (default 15) across both No-Website and Ads Management
  const reliableLeads = useMemo(() => {
    if (filters.minReviews <= 0) return allLeads;
    return allLeads.filter((lead) => lead.userRatingCount >= filters.minReviews);
  }, [allLeads, filters.minReviews]);

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    return reliableLeads
      .filter((lead) => {
        if (filters.leadTypeFilter === 'no_website_only' && lead.hasWebsite) {
          return false;
        }
        if (filters.leadTypeFilter === 'ads_opportunity_only' && (lead.adsAnalysis?.opportunityScore || 0) < 60) {
          return false;
        }
        if (filters.category !== 'all' && lead.category !== filters.category) {
          return false;
        }
        if (filters.minRating > 0 && lead.rating < filters.minRating) {
          return false;
        }
        if (filters.hasPhoneOnly && !lead.phoneNumber) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
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
  }, [reliableLeads, filters]);

  const noWebsiteCount = useMemo(
    () => reliableLeads.filter((l) => !l.hasWebsite).length,
    [reliableLeads]
  );
  const adsTargetCount = useMemo(
    () => reliableLeads.filter((l) => (l.adsAnalysis?.opportunityScore || 0) >= 60).length,
    [reliableLeads]
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
        reliableResultsCount={reliableLeads.length}
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
          <span>Kenya Map</span>
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
          <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs text-slate-800 truncate">
                {filters.leadTypeFilter === 'no_website_only'
                  ? 'No-Website Prospects'
                  : filters.leadTypeFilter === 'ads_opportunity_only'
                  ? 'Ads Management Candidates'
                  : 'All Reliable Kenya Leads'}
              </span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono font-semibold shrink-0">
                {filteredLeads.length}
              </span>
            </div>

            {isScanning || isLoadingMore ? (
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isLoadingMore ? 'Scanning more hubs...' : `Scanning ${selectedCity}...`}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLoadMoreLeads}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shrink-0"
                title="Scan additional Kenyan towns & niches and merge into results"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Scan More Leads</span>
              </button>
            )}
          </div>

          {/* Quick Kenya Niche Scan Bar */}
          <div className="px-3 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap mr-1">
              Quick Scan:
            </span>
            {QUICK_KENYA_NICHES.map((niche) => (
              <button
                key={niche.label}
                onClick={() => handleQuickNicheScan(niche.query)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 whitespace-nowrap transition-colors"
              >
                {niche.label}
              </button>
            ))}
          </div>

          {/* API Error Alert */}
          {searchError && (
            <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Scrollable Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isScanning && allLeads.length === 0 ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-3"
                  >
                    <div className="flex gap-2">
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                      <div className="h-4 w-20 bg-rose-100 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-12 bg-slate-100 rounded-lg" />
                      <div className="h-12 bg-slate-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto text-slate-500">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">
                  {allLeads.length > 0
                    ? 'No leads match these active filters'
                    : `No businesses loaded for ${selectedCity} yet`}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {allLeads.length > 0
                    ? `${allLeads.length} businesses were scanned, but none match your active filters (${filters.minReviews}+ reviews & current niche/mode). Scan additional towns or adjust filters below.`
                    : 'Use the Quick Scan buttons above or enter a Kenyan business niche in the search bar.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {allLeads.length > 0 && (
                    <button
                      onClick={() => {
                        handleFilterChange('leadTypeFilter', 'all');
                        handleFilterChange('category', 'all');
                        handleFilterChange('minRating', 0);
                      }}
                      className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                    >
                      Show All ({reliableLeads.length} w/ {filters.minReviews}+ reviews)
                    </button>
                  )}
                  <button
                    onClick={handleLoadMoreLeads}
                    disabled={isLoadingMore}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                  >
                    {isLoadingMore ? 'Scanning...' : 'Scan More Kenyan Towns & Niches'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {filteredLeads.map((lead) => {
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
                })}

                {/* Load More Batch Footer */}
                <div className="pt-2 pb-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMoreLeads}
                    disabled={isLoadingMore || isScanning}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Scanning additional Kenyan towns & niches...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>
                          Load More {filters.minReviews}+ Review Leads (Batch {scanBatch + 2})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Kenyan Google Map */}
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
      region="KE"
      libraries={['places', 'marker', 'core']}
    >
      <LeadHunterApp />
    </APIProvider>
  );
}
