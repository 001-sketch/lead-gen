import React from 'react';
import { 
  Globe, 
  Megaphone, 
  Search, 
  MapPin, 
  BookmarkCheck, 
  Navigation,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  leadTypeFilter: 'all' | 'no_website_only' | 'ads_opportunity_only';
  onLeadTypeFilterChange: (type: 'all' | 'no_website_only' | 'ads_opportunity_only') => void;
  savedLeadsCount: number;
  onOpenSavedDrawer: () => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

export const CITIES = [
  { name: 'Austin, TX', center: { lat: 30.2672, lng: -97.7431 } },
  { name: 'Chicago, IL', center: { lat: 41.8781, lng: -87.6298 } },
  { name: 'Los Angeles, CA', center: { lat: 34.0522, lng: -118.2437 } },
  { name: 'New York, NY', center: { lat: 40.7128, lng: -74.0060 } },
  { name: 'Miami, FL', center: { lat: 25.7617, lng: -80.1918 } },
  { name: 'Houston, TX', center: { lat: 29.7604, lng: -95.3698 } },
  { name: 'Denver, CO', center: { lat: 39.7392, lng: -104.9903 } },
  { name: 'London, UK', center: { lat: 51.5074, lng: -0.1278 } },
  { name: 'Toronto, CA', center: { lat: 43.6532, lng: -79.3832 } },
];

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCity,
  onCityChange,
  leadTypeFilter,
  onLeadTypeFilterChange,
  savedLeadsCount,
  onOpenSavedDrawer,
  onUseCurrentLocation,
  isLocating,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-40">
      {/* Top Bar: Brand, Global Mode Switcher, and Saved Drawer */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">
                Client<span className="text-blue-400">Radar</span>
              </h1>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                PROSPECTING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Google Maps Client Intelligence: No-Website & Ads Management Discovery
            </p>
          </div>
        </div>

        {/* Primary Engine Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            onClick={() => onLeadTypeFilterChange('no_website_only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              leadTypeFilter === 'no_website_only'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>No-Website Leads</span>
          </button>

          <button
            onClick={() => onLeadTypeFilterChange('ads_opportunity_only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              leadTypeFilter === 'ads_opportunity_only'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Ads Management Opportunities</span>
          </button>

          <button
            onClick={() => onLeadTypeFilterChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              leadTypeFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <span>All Leads</span>
          </button>
        </div>

        {/* Right Action: Saved Leads Pipeline */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSavedDrawer}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl border border-slate-700 transition-colors text-xs font-semibold shadow-sm"
          >
            <BookmarkCheck className="w-4 h-4 text-blue-400" />
            <span>Pipeline</span>
            <span className="bg-blue-600 text-white text-[11px] font-mono px-2 py-0.5 rounded-full">
              {savedLeadsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Bar: City Picker & Search Query Form */}
      <div className="bg-slate-800/60 border-t border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-2.5">
          {/* City Dropdown & GPS button */}
          <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0">
            <div className="relative flex-1 md:w-56">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className="p-2 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors shrink-0"
              title="Use Current GPS Location"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={onSearchSubmit} className="relative flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search business niche on Google Maps (e.g. plumbers, dentists, roofers, auto repair)..."
                className="w-full bg-slate-900 text-white placeholder-slate-400 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0 shadow-sm"
            >
              Scan Google Maps
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
