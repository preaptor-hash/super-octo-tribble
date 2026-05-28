import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Worker, Area } from '../types';

interface MapViewProps {
  workers: Worker[];
  areas: Area[];
  selectedAreaId?: string | null;
  radiusKm?: number;
  onSelectWorker?: (workerId: string) => void;
}

// Fix broken Leaflet icon assets in bundlers by merging options from CDN
const configureLeafletIcons = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

export const MapView: React.FC<MapViewProps> = ({
  workers,
  areas,
  selectedAreaId,
  radiusKm = 5,
  onSelectWorker
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    configureLeafletIcons();

    if (!mapContainerRef.current) return;

    // Centered in Trichy, Tamil Nadu
    const trichyCentroid: L.LatLngExpression = [10.7905, 78.7047];

    const map = L.map(mapContainerRef.current, {
      center: trichyCentroid,
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Premium light map tiles matching clean B2B CRM layout
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.featureGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Update Markers and Proximity Radius Circles
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear old markers
    markersLayer.clearLayers();

    // Clear old circle
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // Color mapper for statuses
    const getStatusColor = (status: string | null) => {
      switch (status) {
        case 'active': return '#10B981'; // Emerald
        case 'deployed': return '#3525CD'; // Primary Blue
        case 'draft': return '#F59E0B'; // Amber
        case 'blacklisted': return '#EF4444'; // Rose
        default: return '#64748B'; // Slate
      }
    };

    // Draw proximity query circle if an area is selected
    if (selectedAreaId) {
      const activeArea = areas.find(a => a.id === selectedAreaId);
      if (activeArea && activeArea.latitude && activeArea.longitude) {
        const areaLatLng: L.LatLngExpression = [activeArea.latitude, activeArea.longitude];
        
        // Draw elegant gradient circle
        const circle = L.circle(areaLatLng, {
          radius: radiusKm * 1000, // in meters
          color: '#4f46e5',
          fillColor: '#818cf8',
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: '4, 4'
        }).addTo(map);

        circleRef.current = circle;
        
        // Pan map smoothly to active search centroid
        map.setView(areaLatLng, 13);
      }
    }

    // Plot worker markers
    workers.forEach(w => {
      if (!w.location) return;

      const markerColor = getStatusColor(w.worker_status);
      
      // Custom SVG divIcon to bypass default bulky Leaflet markers
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="
          width: 14px; 
          height: 14px; 
          background-color: ${markerColor}; 
          border: 2px solid #ffffff; 
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const matchedArea = areas.find(a => a.id === w.area_id);

      // Construct popup content
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 160px;">
          <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #1e293b;">${w.full_name || 'Draft Worker'}</h4>
          <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">${w.skill_category || 'No Skill Specified'}</p>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            <div>📍 ${matchedArea ? matchedArea.name : 'Unknown Area'}</div>
            <div>📱 ${w.phone || 'No Phone'}</div>
            <div style="margin-top: 4px; font-weight: 700; color: ${markerColor};">Status: ${w.worker_status?.toUpperCase()}</div>
          </div>
          <button id="btn-popup-${w.id}" style="
            width: 100%;
            padding: 4px 8px;
            background-color: #3525CD;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
          ">View Full Profile</button>
        </div>
      `;

      const marker = L.marker([w.location.latitude, w.location.longitude], { icon: customIcon })
        .bindPopup(popupHtml, { closeButton: false })
        .addTo(markersLayer);

      // Attach custom click listener inside Leaflet popup DOM
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${w.id}`);
        if (btn && onSelectWorker) {
          btn.addEventListener('click', () => {
            onSelectWorker(w.id);
          });
        }
      });
    });

    // Auto-fit bounds of map to cover all pins if no area is active
    if (!selectedAreaId && workers.length > 0) {
      try {
        const bounds = markersLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (e) {
        console.error("Leaflet bounds error", e);
      }
    }
  }, [workers, areas, selectedAreaId, radiusKm, onSelectWorker]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200/50 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
      
      {/* Dynamic legend */}
      <div className="absolute top-3 right-3 z-[400] glass px-3 py-2 rounded-xl border border-white/50 text-[10px] font-bold text-slate-700 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span> Deployed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Draft Profile
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Blacklisted
        </div>
      </div>
    </div>
  );
};
export default MapView;
