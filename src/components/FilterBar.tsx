import React from 'react';
import { LeadCategory, SearchFilterState } from '../types/lead';
import { 
  Wrench, 
  Stethoscope, 
  Scale, 
  Car, 
  Utensils, 
  ShoppingBag, 
  Layers, 
  PhoneCall, 
  ArrowUpDown,
  Star
} from 'lucide-react';

interface FilterBarProps {
  filters: SearchFilterState;
  onFilterChange: <K extends keyof SearchFilterState>(key: K, value: SearchFilterState[K]) => void;
  totalResultsCount: number;
  noWebsiteCount: number;
  adsTargetCount: number;
}

const CATEGORIES: Array<{ id: LeadCategory | 'all'; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'All Niches', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'home_services', label: 'Home & Contracting', icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'health_medical', label: 'Health & Medical', icon: <Stethoscope className="w-3.5 h-3.5" /> },
  { id: 'legal_financial', label: 'Legal & Financial', icon: <Scale className="w-3.5 h-3.5" /> },
  { id: 'automotive', label: 'Automotive', icon: <Car className="w-3.5 h-3.5" /> },
  { id: 'restaurants_food', label: 'Food & Dining', icon: <Utensils className="w-3.5 h-3.5" /> },
  { id: 'retail_services', label: 'Retail & Specialty', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalResultsCount,
  noWebsiteCount,
  adsTargetCount,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 shadow-xs space-y-3">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange('category', cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Filters: Count Summary, Minimum Reviews/Rating, and Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
        {/* Results Metrics */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">
            {totalResultsCount} businesses located
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {noWebsiteCount} without websites
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {adsTargetCount} prime ad targets
          </span>
        </div>

        {/* Controls: Minimum rating, phone toggle, sort dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Has Phone Only */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={filters.hasPhoneOnly}
              onChange={(e) => onFilterChange('hasPhoneOnly', e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <PhoneCall className="w-3 h-3 text-slate-500" />
            <span>Phone Available</span>
          </label>

          {/* Min Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <select
              value={filters.minRating}
              onChange={(e) => onFilterChange('minRating', Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={0}>Any Rating</option>
              <option value={4.0}>4.0★ & up</option>
              <option value={4.5}>4.5★ & up</option>
              <option value={4.8}>4.8★ & up</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value as SearchFilterState['sortBy'])}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="urgency">Sort: Website Urgency</option>
              <option value="ads_score">Sort: Ads Opportunity</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="reviews">Sort: Most Reviews</option>
              <option value="name">Sort: Business Name</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
