import React, { useCallback, useEffect, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import { Lead } from '../types/lead';
import { Globe, Megaphone, Phone, ExternalLink, Star, MapPin, Sparkles } from 'lucide-react';

interface MapViewProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
  center: { lat: number; lng: number };
  zoom: number;
  onBoundsChanged?: (bounds: google.maps.LatLngBounds | null) => void;
  onSearchThisArea?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  leads,
  selectedLead,
  onSelectLead,
  center,
  zoom,
  onBoundsChanged,
  onSearchThisArea,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [activeInfoWindowLead, setActiveInfoWindowLead] = React.useState<Lead | null>(null);
  const [hasMovedSinceLastSearch, setHasMovedSinceLastSearch] = React.useState(false);
  const isInitialMount = useRef(true);

  // Sync selected lead from list to map info window
  useEffect(() => {
    if (selectedLead) {
      setActiveInfoWindowLead(selectedLead);
      if (map && selectedLead.location.lat && selectedLead.location.lng) {
        map.panTo(selectedLead.location);
        if (map.getZoom() && (map.getZoom() ?? 0) < 14) {
          map.setZoom(14);
        }
      }
    }
  }, [selectedLead, map]);

  // Pan to center when city/center prop changes
  useEffect(() => {
    if (map && center.lat && center.lng) {
      map.panTo(center);
    }
  }, [center, map]);

  const handleCameraChange = useCallback(
    (ev: MapCameraChangedEvent) => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      setHasMovedSinceLastSearch(true);
      if (map && onBoundsChanged) {
        const bounds = map.getBounds();
        onBoundsChanged(bounds || null);
      }
    },
    [map, onBoundsChanged]
  );

  const handleSearchAreaClick = () => {
    setHasMovedSinceLastSearch(false);
    if (onSearchThisArea) {
      onSearchThisArea();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={center}
        defaultZoom={zoom}
        onCameraChanged={handleCameraChange}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {leads.map((lead) => {
          if (!lead.location || !lead.location.lat || !lead.location.lng) return null;
          
          const isSelected = selectedLead?.id === lead.id;
          const isNoWebsite = !lead.hasWebsite;
          const isHighAds = (lead.adsAnalysis?.opportunityScore || 0) >= 70;

          // Color & Icon logic
          let pinBg = 'bg-slate-700';
          let borderCol = 'border-slate-800';
          let badgeText = 'Lead';
          let badgeIcon = <MapPin className="w-3.5 h-3.5 text-white" />;

          if (isNoWebsite && isHighAds) {
            pinBg = 'bg-amber-600';
            borderCol = 'border-amber-700';
            badgeText = 'No Site + Ads';
            badgeIcon = <Sparkles className="w-3.5 h-3.5 text-white" />;
          } else if (isNoWebsite) {
            pinBg = 'bg-rose-600';
            borderCol = 'border-rose-700';
            badgeText = 'No Website';
            badgeIcon = <Globe className="w-3.5 h-3.5 text-white stroke-[2.5]" />;
          } else if (isHighAds) {
            pinBg = 'bg-indigo-600';
            borderCol = 'border-indigo-700';
            badgeText = 'Ads Target';
            badgeIcon = <Megaphone className="w-3.5 h-3.5 text-white" />;
          } else {
            pinBg = 'bg-emerald-600';
            borderCol = 'border-emerald-700';
            badgeText = 'Competitor';
          }

          return (
            <AdvancedMarker
              key={lead.id}
              position={lead.location}
              title={`${lead.name} (${badgeText})`}
              zIndex={isSelected ? 99 : isNoWebsite ? 50 : 30}
              onClick={() => {
                setActiveInfoWindowLead(lead);
              }}
            >
              <div
                className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border text-white font-medium text-xs cursor-pointer transition-all duration-200 transform ${
                  isSelected ? 'scale-110 ring-4 ring-blue-500/40 z-50' : 'hover:scale-105'
                } ${pinBg} ${borderCol}`}
              >
                {badgeIcon}
                <span className="font-semibold max-w-[120px] truncate">{lead.name.split(' ')[0]}</span>
                
                {/* Micro urgency indicator */}
                {isNoWebsite && (
                  <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse ml-0.5" />
                )}
              </div>
            </AdvancedMarker>
          );
        })}

        {/* InfoWindow for clicked or active lead */}
        {activeInfoWindowLead && activeInfoWindowLead.location && (
          <InfoWindow
            position={activeInfoWindowLead.location}
            onCloseClick={() => {
              setActiveInfoWindowLead(null);
            }}
            pixelOffset={[0, -25]}
          >
            <div className="p-2 max-w-[280px] text-slate-800">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">
                    {activeInfoWindowLead.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{activeInfoWindowLead.categoryLabel}</p>
                </div>
                {!activeInfoWindowLead.hasWebsite ? (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    No Website
                  </span>
                ) : (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    Ads Target
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 my-1.5">
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                  {activeInfoWindowLead.rating}
                </span>
                <span className="text-slate-400">•</span>
                <span>{activeInfoWindowLead.userRatingCount} reviews</span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-1 mb-2">
                {activeInfoWindowLead.address}
              </p>

              {/* Opportunity Highlights */}
              {!activeInfoWindowLead.hasWebsite && activeInfoWindowLead.websiteAnalysis && (
                <div className="bg-rose-50 border border-rose-200 rounded p-1.5 mb-2 text-[11px] text-rose-900">
                  <span className="font-semibold block">Missing Website Urgency: {activeInfoWindowLead.websiteAnalysis.urgencyScore}/100</span>
                  <span>Est. lost revenue: ~${activeInfoWindowLead.websiteAnalysis.estimatedLostMonthlyRevenue.toLocaleString()}/mo</span>
                </div>
              )}

              {activeInfoWindowLead.adsAnalysis && (
                <div className="bg-indigo-50 border border-indigo-200 rounded p-1.5 mb-2 text-[11px] text-indigo-900">
                  <span className="font-semibold block">Ads Score: {activeInfoWindowLead.adsAnalysis.opportunityScore}/100</span>
                  <span>Suggested Ad Budget: ${activeInfoWindowLead.adsAnalysis.suggestedMonthlyBudget.toLocaleString()}/mo</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => onSelectLead(activeInfoWindowLead)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg text-center transition-colors"
                >
                  View Pitch & Audit
                </button>
                {activeInfoWindowLead.googleMapsUrl && (
                  <a
                    href={activeInfoWindowLead.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {/* Floating "Search This Area" Button */}
      {hasMovedSinceLastSearch && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={handleSearchAreaClick}
            className="flex items-center gap-2 bg-white/95 hover:bg-white text-slate-800 font-semibold text-xs py-2 px-4 rounded-full shadow-lg border border-slate-200 backdrop-blur transition-all duration-150 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
            <span>Search This Map Area</span>
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-md text-[11px] text-slate-700 space-y-1">
        <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 mb-1">Marker Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
          <span>No Website Lead (Web Design)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0" />
          <span>High Ads Management Potential</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600 shrink-0" />
          <span>No Website + Prime Ads Target</span>
        </div>
      </div>
    </div>
  );
};
