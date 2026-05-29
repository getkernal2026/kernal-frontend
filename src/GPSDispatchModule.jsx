import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useKernal } from './KernalContext.jsx';
import { UI } from './ui.js';
import { DEMO_MODE } from './lib/demoMode.js';
import { supabase } from './lib/supabase.js';
import { api } from './lib/api.js';
import {
  MapPin, Truck, Wifi, WifiOff, Navigation, CheckCircle2, Clock, AlertCircle,
  RotateCcw, Zap, Radio, Activity, ChevronDown, ChevronUp, ArrowRight,
  Play, RefreshCw, Package, User, Phone, Hash, Signal
} from 'lucide-react';

// ── Tampa, FL — Metro Food Distribution ───────────────────────────────────────
const DEPOT = {
  lat: 27.9680, lng: -82.4432,
  name: 'Metro Food Distribution',
  address: '5401 E Hillsborough Ave, Tampa, FL 33610',
};

// Four Tampa delivery routes with real restaurant addresses & coordinates
// Exported so LogisticsModule's embedded map can share the same live data
export const INIT_ROUTES = [
  {
    id: 'RT-A', name: 'Route A — Downtown Core', locationId: 'LOC-A',
    driver: { name: 'Marcus T.', userId: 'U003', phone: '(813) 555-0142' },
    truck: 'Truck #1 — Ford F-350', plate: 'XK-4821',
    color: '#22d3ee', colorHex: 'cyan',
    status: 'en_route',           // idle | en_route | at_stop | returning | completed
    startTime: '06:30', estComplete: '12:45',
    totalWeight: '2,840 lbs', totalCases: 159,
    initialProgress: 2.3,         // past stop 2, heading to stop 3
    stops: [
      { id:'S-A1', seq:1, name:'Armature Works Market',   address:'1910 N Ola Ave, Tampa',       lat:27.9607, lng:-82.4577, status:'delivered',   eta:'07:15', arrival:'07:12', cases:34, weight:'480 lbs', orderRef:'SO-1042', contact:'Chef Rodriguez', pod:true  },
      { id:'S-A2', seq:2, name:'Ulele Restaurant',        address:'1810 N Highland Ave, Tampa',  lat:27.9541, lng:-82.4582, status:'delivered',   eta:'07:45', arrival:'07:51', cases:22, weight:'310 lbs', orderRef:'SO-1043', contact:'Chef Williams',  pod:true  },
      { id:'S-A3', seq:3, name:'Oxford Exchange',         address:'420 W Kennedy Blvd, Tampa',   lat:27.9439, lng:-82.4620, status:'in_progress', eta:'08:20',                  cases:18, weight:'245 lbs', orderRef:'SO-1044', contact:'Mgr. Davis'              },
      { id:'S-A4', seq:4, name:"Mise en Place",           address:'442 W Kennedy Blvd, Tampa',   lat:27.9438, lng:-82.4621, status:'pending',     eta:'09:00',                  cases:41, weight:'620 lbs', orderRef:'SO-1045', contact:'Chef Santos'             },
      { id:'S-A5', seq:5, name:"Bern's Steak House",      address:'1208 S Howard Ave, Tampa',    lat:27.9299, lng:-82.4774, status:'pending',     eta:'09:45',                  cases:28, weight:'710 lbs', orderRef:'SO-1046', contact:'Chef Martinez'           },
      { id:'S-A6', seq:6, name:'Hyde Park Cafe',          address:'1602 W Snow Ave, Tampa',      lat:27.9306, lng:-82.4819, status:'pending',     eta:'10:30',                  cases:16, weight:'475 lbs', orderRef:'SO-1047', contact:'Owner Patel'             },
    ],
  },
  {
    id: 'RT-B', name: 'Route B — Ybor City', locationId: 'LOC-A',
    driver: { name: 'Darnell W.', userId: 'U004', phone: '(813) 555-0287' },
    truck: 'Truck #2 — Freightliner M2', plate: 'MR-7734',
    color: '#a78bfa', colorHex: 'violet',
    status: 'at_stop',
    startTime: '06:15', estComplete: '12:30',
    totalWeight: '3,120 lbs', totalCases: 193,
    initialProgress: 2.0,         // at stop 2
    stops: [
      { id:'S-B1', seq:1, name:'Columbia Restaurant',     address:'2117 E 7th Ave, Tampa',       lat:27.9582, lng:-82.4393, status:'delivered',   eta:'07:00', arrival:'06:58', cases:55, weight:'890 lbs', orderRef:'SO-1050', contact:'Chef Gonzalez', pod:true  },
      { id:'S-B2', seq:2, name:'Carne Restaurant',        address:'1622 E 7th Ave, Tampa',       lat:27.9579, lng:-82.4440, status:'in_progress', eta:'07:30',                  cases:38, weight:'640 lbs', orderRef:'SO-1048', contact:'Chef Benstock'            },
      { id:'S-B3', seq:3, name:'Datz Tampa',              address:'2616 S MacDill Ave, Tampa',   lat:27.9282, lng:-82.4814, status:'pending',     eta:'08:30',                  cases:26, weight:'380 lbs', orderRef:'SO-1049', contact:'Mgr. Thompson'           },
      { id:'S-B4', seq:4, name:'Cafe Dufrain',            address:'707 Harbour Post Dr, Tampa',  lat:27.9414, lng:-82.4535, status:'pending',     eta:'09:15',                  cases:42, weight:'680 lbs', orderRef:'SO-1052', contact:'Chef Wilson'             },
      { id:'S-B5', seq:5, name:'The Independent Bar',     address:'5016 N Florida Ave, Tampa',   lat:27.9849, lng:-82.4738, status:'pending',     eta:'10:30',                  cases:32, weight:'530 lbs', orderRef:'SO-1053', contact:'Owner Clarke'            },
    ],
  },
  {
    id: 'RT-C', name: 'Route C — Westshore', locationId: 'LOC-B',
    driver: { name: 'Sofia R.', userId: 'U005', phone: '(813) 555-0398' },
    truck: 'Truck #3 — Isuzu NPR', plate: 'TL-2265',
    color: '#34d399', colorHex: 'emerald',
    status: 'en_route',
    startTime: '07:00', estComplete: '14:00',
    totalWeight: '2,450 lbs', totalCases: 158,
    initialProgress: 3.3,         // past stop 3, heading to stop 4
    stops: [
      { id:'S-C1', seq:1, name:"Eddie V's Prime Seafood", address:'4400 W Boy Scout Blvd, Tampa', lat:27.9474, lng:-82.5144, status:'delivered',   eta:'07:45', arrival:'07:48', cases:42, weight:'680 lbs', orderRef:'SO-1055', contact:'Chef Adams',  pod:true  },
      { id:'S-C2', seq:2, name:'Steelbach Restaurant',    address:'4200 George J Bean Pkwy, Tampa',lat:27.9793,lng:-82.5328, status:'delivered',   eta:'08:30', arrival:'08:33', cases:31, weight:'440 lbs', orderRef:'SO-1056', contact:'Chef Park',   pod:true  },
      { id:'S-C3', seq:3, name:'The Capital Grille',      address:'4342 W Boy Scout Blvd, Tampa', lat:27.9476, lng:-82.5130, status:'delivered',   eta:'09:15', arrival:'09:18', cases:24, weight:'385 lbs', orderRef:'SO-1057', contact:'Mgr. Chen',   pod:true  },
      { id:'S-C4', seq:4, name:"Maestro's Catering",      address:'4400 W Cypress St, Tampa',     lat:27.9527, lng:-82.5087, status:'in_progress', eta:'10:00',                  cases:33, weight:'480 lbs', orderRef:'SO-1058', contact:'Chef Nguyen'             },
      { id:'S-C5', seq:5, name:'Marriott Tampa Waterside',address:'700 S Florida Ave, Tampa',     lat:27.9414, lng:-82.4581, status:'pending',     eta:'11:30',                  cases:28, weight:'465 lbs', orderRef:'SO-1059', contact:'Chef Kim'                },
    ],
  },
  {
    id: 'RT-D', name: 'Route D — North Tampa', locationId: 'LOC-C',
    driver: { name: 'James P.', userId: 'U006', phone: '(813) 555-0451' },
    truck: 'Truck #4 — Ford Transit', plate: 'BA-9981',
    color: '#fbbf24', colorHex: 'amber',
    status: 'returning',
    startTime: '05:45', estComplete: '11:00',
    totalWeight: '1,890 lbs', totalCases: 127,
    initialProgress: 4.4,         // all stops done, heading back to depot
    stops: [
      { id:'S-D1', seq:1, name:'The Refinery',    address:'5137 N Florida Ave, Tampa',  lat:27.9800, lng:-82.4742, status:'delivered', eta:'06:30', arrival:'06:28', cases:29, weight:'430 lbs', orderRef:'SO-1060', contact:'Chef Brown',   pod:true },
      { id:'S-D2', seq:2, name:'Ichicoro Ane',    address:'4333 N Florida Ave, Tampa',  lat:27.9835, lng:-82.4739, status:'delivered', eta:'07:00', arrival:'07:02', cases:18, weight:'240 lbs', orderRef:'SO-1061', contact:'Chef Tanaka',  pod:true },
      { id:'S-D3', seq:3, name:'Rooster & Till',  address:'5012 N Florida Ave, Tampa',  lat:27.9849, lng:-82.4738, status:'delivered', eta:'07:30', arrival:'07:35', cases:33, weight:'510 lbs', orderRef:'SO-1062', contact:'Chef Johnson', pod:true },
      { id:'S-D4', seq:4, name:'Esker',           address:'5050 N Florida Ave, Tampa',  lat:27.9862, lng:-82.4737, status:'delivered', eta:'08:00', arrival:'08:05', cases:47, weight:'710 lbs', orderRef:'SO-1063', contact:'Chef Garcia',  pod:true },
    ],
  },
];

// Demo fallback — only used when DEMO_MODE=true.
// ACTIVE_ROUTES stays exported so LogisticsModule can reference the constant directly.
const ACTIVE_ROUTES = DEMO_MODE ? INIT_ROUTES : [];

// Palette for assigning colors to production routes (cycles)
const ROUTE_COLORS = ['#22d3ee','#a78bfa','#34d399','#fbbf24','#f87171','#60a5fa','#fb923c','#e879f9'];

// Map backend status strings → STATUS_META keys
function normalizeRouteStatus(s) {
  if (!s) return 'idle';
  const lower = s.toLowerCase();
  if (lower === 'in progress') return 'en_route';
  if (lower === 'dispatched')  return 'en_route';
  if (lower === 'completed')   return 'completed';
  if (lower === 'cancelled')   return 'idle';
  return 'idle';
}

function normalizeStopStatus(s) {
  if (!s) return 'pending';
  const lower = s.toLowerCase();
  if (lower === 'delivered' || lower === 'exception' || lower === 'skipped') return 'delivered';
  if (lower === 'in progress' || lower === 'in_progress') return 'in_progress';
  return 'pending';
}

// Transform an API delivery_route row into the shape MapView/FleetStatusView expect
function normalizeApiRoute(r, idx) {
  return {
    id:          r.id,
    name:        r.route_number || `Route ${idx + 1}`,
    driver:      { name: r.driver_name || 'Unknown', phone: '' },
    // truck field: the raw truck string from the DB (e.g. 'TRK-01')
    truck:       r.truck || r.route_number || '',
    route_number: r.route_number,
    driver_name:  r.driver_name,
    color:       ROUTE_COLORS[idx % ROUTE_COLORS.length],
    colorHex:    'cyan',
    status:      normalizeRouteStatus(r.status),
    startTime:   r.departure_time ? new Date(r.departure_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—',
    estComplete: '—',
    totalWeight: '—', totalCases: 0,
    initialProgress: 0,
    stops: (r.delivery_stops || []).map(s => ({
      id:          s.id,
      seq:         s.stop_number,
      stop_number: s.stop_number,
      name:        s.customer_name || 'Stop',
      customer_name: s.customer_name,
      address:     s.address || '',
      // Production stops have no lat/lng — MapView skips polylines gracefully
      lat: null, lng: null,
      status:      normalizeStopStatus(s.status),
      eta:         s.eta || null,
      cases: 0, weight: '—',
      orderRef:    s.order_id || null,
      contact:     '',
    })),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
}
function totalDistance(stops) {
  let d = haversineKm(DEPOT, stops[0]);
  for (let i = 0; i < stops.length - 1; i++) d += haversineKm(stops[i], stops[i+1]);
  d += haversineKm(stops[stops.length-1], DEPOT);
  return d;
}
function nearestNeighborTSP(stops) {
  const unvisited = [...stops];
  const result = [];
  let current = DEPOT;
  while (unvisited.length) {
    let best = 0, bestDist = Infinity;
    unvisited.forEach((s, i) => { const d = haversineKm(current, s); if (d < bestDist) { bestDist = d; best = i; } });
    result.push(unvisited.splice(best, 1)[0]);
    current = result[result.length-1];
  }
  return result;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function getTruckPos(route, tick) {
  const speed   = route.status === 'at_stop' ? 0 : 0.018;
  const raw     = route.initialProgress + tick * speed;
  const waypoints = [DEPOT, ...route.stops, DEPOT];
  const maxP    = waypoints.length - 1;
  const p       = Math.min(raw, maxP);
  const idx     = Math.min(Math.floor(p), maxP - 1);
  const t       = p - idx;
  const from    = waypoints[idx];
  const to      = waypoints[idx + 1];
  return { lat: lerp(from.lat, to.lat, t), lng: lerp(from.lng, to.lng, t) };
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_META = {
  en_route:  { label:'En Route',   color:'text-cyan-400',    dot:'bg-cyan-400',    badge:'bg-cyan-500/15 text-cyan-300'    },
  at_stop:   { label:'At Stop',    color:'text-amber-400',   dot:'bg-amber-400',   badge:'bg-amber-500/15 text-amber-300'  },
  returning: { label:'Returning',  color:'text-violet-400',  dot:'bg-violet-400',  badge:'bg-violet-500/15 text-violet-300'},
  idle:      { label:'Idle',       color:'text-gray-400',    dot:'bg-gray-500',    badge:'bg-gray-700/60 text-gray-400'    },
  completed: { label:'Completed',  color:'text-emerald-400', dot:'bg-emerald-400', badge:'bg-emerald-500/15 text-emerald-300'},
};
const STOP_STATUS = {
  delivered:   { icon: CheckCircle2, color: 'text-emerald-400' },
  in_progress: { icon: Navigation,   color: 'text-cyan-400'    },
  pending:     { icon: Clock,        color: 'text-gray-500'    },
};

// ── Map View ───────────────────────────────────────────────────────────────────
// Exported so LogisticsModule can embed it in the Delivery Operations dispatcher view
// livePositions: { [route_id]: { lat, lng, truck_id, speed_mph, heading } }
//   — passed in from the parent after a Realtime subscription; if absent, falls
//     back to the tick-based demo animation.
export function MapView({ routes, tick, isDark, selectedId, onSelect, livePositions = {} }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef({});   // keyed by route.id OR truck_id for live-only trucks
  const polylinesRef  = useRef([]);   // all polyline layers — cleared on routes change
  const [ready, setReady] = useState(!!window.L);

  // Load Leaflet from CDN once
  useEffect(() => {
    if (window.L) { setReady(true); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  // Build truck SVG icon
  const truckIcon = useCallback((color, isSelected) => {
    const border = isSelected ? '#ffffff' : color;
    const bg     = isSelected ? color : '#1e293b';
    const size   = isSelected ? 42 : 36;
    return window.L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2.5px solid ${border};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:pointer;transition:all 0.3s">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isSelected?'#fff':color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>`,
      iconSize: [size, size], iconAnchor: [size/2, size/2],
    });
  }, []);

  const stopIcon = useCallback((seq, status, color) => {
    const bg = status === 'delivered' ? '#059669' : status === 'in_progress' ? color : '#374151';
    const tc = status === 'delivered' ? '#fff' : status === 'in_progress' ? '#fff' : '#9ca3af';
    return window.L.divIcon({
      className: '',
      html: `<div style="width:26px;height:26px;background:${bg};border:2px solid ${bg === '#374151'?'#4b5563':bg};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:${tc};box-shadow:0 1px 4px rgba(0,0,0,0.4);">${status==='delivered'?'✓':seq}</div>`,
      iconSize: [26, 26], iconAnchor: [13, 13],
    });
  }, []);

  const depotIcon = window.L ? window.L.divIcon({
    className: '',
    html: `<div style="width:34px;height:34px;background:#0f172a;border:2.5px solid #22d3ee;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.5);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  }) : null;

  // ── Phase 1: Init base map (tile layer + depot) — runs once when Leaflet ready ──
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L   = window.L;
    const map = L.map(containerRef.current, {
      center: [27.9506, -82.4800], zoom: 12,
      zoomControl: true, attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon })
      .addTo(map)
      .bindPopup(`<b>${DEPOT.name}</b><br/>${DEPOT.address}`);

    mapRef.current = map;

    const obs = new ResizeObserver(() => map.invalidateSize());
    obs.observe(containerRef.current);
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      obs.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      polylinesRef.current = [];
    };
  }, [ready]); // eslint-disable-line

  // ── Phase 2: Rebuild route overlays whenever routes prop changes ──────────────
  // Handles both demo (rich stop coords) and production (truck_id only, no coords).
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L   = window.L;
    const map = mapRef.current;

    // Clear old polylines + truck markers
    polylinesRef.current.forEach(layer => map.removeLayer(layer));
    polylinesRef.current = [];
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    routes.forEach(route => {
      const color = route.color || '#22d3ee';
      // Only draw polylines/stop-markers when stops have coordinates (demo mode)
      const stopsWithCoords = (route.stops || []).filter(s => s.lat != null && s.lng != null);
      if (stopsWithCoords.length > 0) {
        const waypoints = [DEPOT, ...stopsWithCoords, DEPOT];
        const poly = L.polyline(waypoints.map(w => [w.lat, w.lng]), {
          color, weight: 3, opacity: 0.55, dashArray: '6,4',
        }).addTo(map);
        polylinesRef.current.push(poly);

        stopsWithCoords.forEach(stop => {
          L.marker([stop.lat, stop.lng], {
            icon: stopIcon(stop.seq || stop.stop_number, stop.status, color),
          }).addTo(map)
            .bindPopup(`<b>${stop.name || stop.customer_name}</b><br/>${stop.address || ''}<br/>ETA: ${stop.eta || '—'}`);
        });
      }

      // Truck marker — prefer live GPS, fall back to tick-sim (demo) or depot
      const live  = livePositions[route.id] || livePositions[route.truck];
      const hasTickSim = stopsWithCoords.length > 0;
      const initPos = live
        ? { lat: parseFloat(live.lat), lng: parseFloat(live.lng) }
        : hasTickSim ? getTruckPos(route, 0) : DEPOT;

      const driverName = typeof route.driver === 'object' ? route.driver?.name : route.driver_name || '';
      const marker = L.marker([initPos.lat, initPos.lng], {
        icon: truckIcon(color, false), zIndexOffset: 1000,
      }).addTo(map)
        .bindPopup(`<b>${route.truck || route.route_number}</b><br/>Driver: ${driverName}<br/>Status: ${STATUS_META[route.status]?.label || route.status || ''}`);
      marker.on('click', () => onSelect(route.id));
      markersRef.current[route.id] = marker;
    });
  }, [ready, routes]); // eslint-disable-line

  // ── Phase 3: Animate trucks on tick ──────────────────────────────────────────
  // Also handles production-only trucks that arrived via Realtime but have no
  // corresponding route in the routes prop (keyed by truck_id).
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L   = window.L;
    const map = mapRef.current;

    // Update markers that were created from routes
    routes.forEach(route => {
      const marker = markersRef.current[route.id];
      if (!marker) return;
      const color = route.color || '#22d3ee';
      const live  = livePositions[route.id] || livePositions[route.truck];
      const stopsWithCoords = (route.stops || []).filter(s => s.lat != null && s.lng != null);
      const pos = live
        ? { lat: parseFloat(live.lat), lng: parseFloat(live.lng) }
        : stopsWithCoords.length > 0 ? getTruckPos(route, tick) : null;
      if (pos) marker.setLatLng([pos.lat, pos.lng]);
      marker.setIcon(truckIcon(color, route.id === selectedId));
    });

    // Production fall-through: any truck in livePositions with no route entry yet
    // gets a plain marker so it still shows up on the map.
    Object.entries(livePositions).forEach(([key, loc]) => {
      if (!loc.lat || !loc.lng) return;
      if (!markersRef.current[key]) {
        const m = L.marker([parseFloat(loc.lat), parseFloat(loc.lng)], {
          icon: truckIcon('#22d3ee', key === selectedId), zIndexOffset: 1000,
        }).addTo(map)
          .bindPopup(`<b>${loc.truck_id}</b>${loc.driver_name ? `<br/>${loc.driver_name}` : ''}`);
        m.on('click', () => onSelect(key));
        markersRef.current[key] = m;
      } else {
        markersRef.current[key].setLatLng([parseFloat(loc.lat), parseFloat(loc.lng)]);
        markersRef.current[key].setIcon(truckIcon('#22d3ee', key === selectedId));
      }
    });
  }, [tick, selectedId, truckIcon, livePositions]); // eslint-disable-line

  // ── Pan to selected ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const route = routes.find(r => r.id === selectedId);
    const live  = livePositions[selectedId] || (route && (livePositions[route.id] || livePositions[route.truck]));
    if (live) {
      mapRef.current.panTo([parseFloat(live.lat), parseFloat(live.lng)], { animate: true, duration: 0.8 });
    } else if (route) {
      const stopsWithCoords = (route.stops || []).filter(s => s.lat != null);
      const pos = stopsWithCoords.length > 0 ? getTruckPos(route, tick) : null;
      if (pos) mapRef.current.panTo([pos.lat, pos.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedId]); // eslint-disable-line

  return (
    <div className="relative w-full" style={{ height: '480px' }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 rounded-xl overflow-hidden" style={{ zIndex: 0 }} />
    </div>
  );
}

// ── Route Optimizer ────────────────────────────────────────────────────────────
function RouteOptimizerView({ isDark }) {
  const [selectedRouteId, setSelectedRouteId] = useState('RT-A');
  const [optimized, setOptimized] = useState(null);
  const [running, setRunning] = useState(false);

  const route = ACTIVE_ROUTES.find(r => r.id === selectedRouteId);
  const origDist = useMemo(() => route ? totalDistance(route.stops) : 0, [route]);
  const optDist  = useMemo(() => optimized ? totalDistance(optimized) : null, [optimized]);
  const saving   = optDist ? ((origDist - optDist) / origDist * 100).toFixed(1) : null;

  const runOptimize = () => {
    setRunning(true);
    setOptimized(null);
    setTimeout(() => {
      setOptimized(nearestNeighborTSP([...route.stops]));
      setRunning(false);
    }, 900);
  };

  const card = isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-[#e2e8f0]';
  const sub  = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h3 className={`text-base font-bold ${isDark?'text-white':'text-slate-900'}`}>Route Optimizer</h3>
        <p className={`text-sm mt-0.5 ${sub}`}>Nearest-neighbor TSP algorithm — finds the shortest stop sequence from the warehouse and back.</p>
      </div>

      {/* Route selector */}
      <div className="flex gap-2 flex-wrap">
        {ACTIVE_ROUTES.map(r => (
          <button key={r.id} onClick={() => { setSelectedRouteId(r.id); setOptimized(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedRouteId===r.id ? 'border-transparent text-white' : `${card} ${sub}`}`}
            style={selectedRouteId===r.id ? { background: r.color, borderColor: r.color } : {}}>
            {r.id}
          </button>
        ))}
      </div>

      {/* Stats row */}
      {route && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Stops', val: route.stops.length },
            { label:'Current Distance', val: `${origDist.toFixed(1)} km` },
            { label:'Optimized Distance', val: optDist ? `${optDist.toFixed(1)} km` : '—' },
          ].map(({ label, val }) => (
            <div key={label} className={`${card} border rounded-xl p-3 text-center`}>
              <div className={`text-xs font-medium mb-1 ${sub}`}>{label}</div>
              <div className={`text-lg font-bold ${isDark?'text-white':'text-slate-900'}`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {saving && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
          <Zap size={16} className="text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-emerald-300">
            Optimization saves <span className="text-emerald-400 font-bold">{saving}%</span> distance — approximately {((origDist - optDist) * 0.621371).toFixed(1)} miles less per run.
          </span>
        </div>
      )}

      {/* Side-by-side stop lists */}
      {route && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current order */}
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${sub}`}>Current Order</div>
            <div className="space-y-1.5">
              {route.stops.map((stop, i) => (
                <div key={stop.id} className={`${card} border rounded-lg px-3 py-2 flex items-center gap-2`}>
                  <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: route.color + '22', color: route.color }}>{i+1}</span>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold truncate ${isDark?'text-white':'text-slate-900'}`}>{stop.name}</div>
                    <div className={`text-[10px] truncate ${sub}`}>{stop.address.split(',')[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimized order */}
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${sub}`}>Optimized Order</div>
            {!optimized ? (
              <div className={`${card} border rounded-xl p-6 flex flex-col items-center justify-center gap-3`} style={{ minHeight: '200px' }}>
                <button onClick={runOptimize} disabled={running}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ background: route.color }}>
                  {running ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  {running ? 'Optimizing…' : 'Run Optimizer'}
                </button>
                <p className={`text-xs text-center ${sub}`}>Nearest-neighbor TSP<br/>finds the shortest path</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {optimized.map((stop, i) => {
                  const origIdx = route.stops.findIndex(s => s.id === stop.id);
                  const moved   = origIdx !== i;
                  return (
                    <div key={stop.id} className={`border rounded-lg px-3 py-2 flex items-center gap-2 ${moved ? 'border-emerald-500/30 bg-emerald-500/8' : `${card} border-transparent bg-transparent ${card}`}`}>
                      <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: route.color + '22', color: route.color }}>{i+1}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold truncate ${isDark?'text-white':'text-slate-900'}`}>{stop.name}</div>
                        <div className={`text-[10px] truncate ${sub}`}>{stop.address.split(',')[0]}</div>
                      </div>
                      {moved && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          {origIdx+1}→{i+1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Fleet Status View ──────────────────────────────────────────────────────────
function FleetStatusView({ routes, tick, isDark }) {
  const [expanded, setExpanded] = useState(null);
  const card = isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-[#e2e8f0]';
  const sub  = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-3 max-w-3xl">
      <div>
        <h3 className={`text-base font-bold ${isDark?'text-white':'text-slate-900'}`}>Fleet Status</h3>
        <p className={`text-sm mt-0.5 ${sub}`}>Live position and delivery progress for all active trucks.</p>
      </div>
      {routes.map(route => {
        const sm = STATUS_META[route.status] || STATUS_META.idle;
        const pos = getTruckPos(route, tick);
        const delivered = route.stops.filter(s => s.status === 'delivered').length;
        const pct = Math.round((delivered / route.stops.length) * 100);
        const isOpen = expanded === route.id;
        return (
          <div key={route.id} className={`${card} border rounded-xl overflow-hidden`}>
            <button className="w-full text-left px-4 py-3.5 flex items-center gap-3" onClick={() => setExpanded(isOpen ? null : route.id)}>
              {/* Truck color dot */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: route.color + '22' }}>
                <Truck size={16} style={{ color: route.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${isDark?'text-white':'text-slate-900'}`}>{route.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sm.badge}`}>{sm.label}</span>
                </div>
                <div className={`text-xs mt-0.5 ${sub}`}>{route.driver.name} · {route.truck} · {route.plate}</div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className={`text-xs font-bold ${isDark?'text-white':'text-slate-800'}`}>{delivered}/{route.stops.length} stops</div>
                <div className={`text-[10px] ${sub}`}>{pct}% complete</div>
              </div>
              {isOpen ? <ChevronUp size={14} className={sub} /> : <ChevronDown size={14} className={sub} />}
            </button>

            {/* Progress bar */}
            <div className={`mx-4 mb-3 h-1.5 rounded-full overflow-hidden ${isDark?'bg-gray-700':'bg-gray-200'}`}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: route.color }} />
            </div>

            {/* Expanded details */}
            {isOpen && (
              <div className={`border-t ${isDark?'border-gray-700':'border-gray-200'} px-4 pb-4 pt-3`}>
                {/* Driver/position info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { icon: User,      label:'Driver',    val: route.driver.name },
                    { icon: Phone,     label:'Phone',     val: route.driver.phone },
                    { icon: Hash,      label:'Position',  val: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` },
                    { icon: Clock,     label:'Est. Done', val: route.estComplete },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label}>
                      <div className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${sub}`}>{label}</div>
                      <div className={`text-xs font-semibold flex items-center gap-1 ${isDark?'text-gray-200':'text-slate-700'}`}>
                        <Icon size={11} className={sub} />{val}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Stop list */}
                <div className="space-y-1.5">
                  {route.stops.map(stop => {
                    const StopIcon = STOP_STATUS[stop.status]?.icon || Clock;
                    const stColor  = STOP_STATUS[stop.status]?.color || 'text-gray-500';
                    return (
                      <div key={stop.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${isDark?'bg-gray-900/50':'bg-gray-50'}`}>
                        <StopIcon size={13} className={`flex-shrink-0 ${stColor}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-semibold ${isDark?'text-gray-200':'text-slate-800'}`}>{stop.seq}. {stop.name}</span>
                          <span className={`text-[10px] ml-2 ${sub}`}>{stop.address.split(',')[0]}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-[10px] ${sub}`}>{stop.arrival ? `Arrived ${stop.arrival}` : `ETA ${stop.eta}`}</div>
                          <div className={`text-[10px] ${sub}`}>{stop.cases} cases · {stop.weight}</div>
                        </div>
                        {stop.pod && <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" title="POD captured" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── GPS Telemetry View ─────────────────────────────────────────────────────────
// Replaced fake Traccar server UI with real Supabase Realtime feed.
// Props flow down from GPSDispatchModule which owns the Realtime subscription.
function GPSTelemetryView({ routes, tick, isDark, pings, realtimeStatus, livePositions }) {
  const card = isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-[#e2e8f0]';
  const sub  = isDark ? 'text-gray-400' : 'text-slate-500';

  // In demo mode, fall back to simulated pings seeded from tick
  const [demoPings, setDemoPings] = useState(() => DEMO_MODE ? [
    { id:1, truck_id:'TRK-01', driver_name:'Marcus T.',  color:'#22d3ee', lat:27.9512, lng:-82.4601, speed_mph:23, ts:'10:23:14.892' },
    { id:2, truck_id:'TRK-02', driver_name:'Darnell W.', color:'#a78bfa', lat:27.9579, lng:-82.4453, speed_mph:0,  ts:'10:23:17.445' },
    { id:3, truck_id:'TRK-03', driver_name:'Sofia R.',   color:'#34d399', lat:27.9487, lng:-82.5119, speed_mph:31, ts:'10:23:19.112' },
    { id:4, truck_id:'TRK-04', driver_name:'James P.',   color:'#fbbf24', lat:27.9650, lng:-82.4690, speed_mph:28, ts:'10:23:21.778' },
  ] : []);

  useEffect(() => {
    if (!DEMO_MODE || tick % 2 !== 0) return;
    const route = ACTIVE_ROUTES[tick % ACTIVE_ROUTES.length];
    const pos   = getTruckPos(route, tick);
    const now   = new Date();
    const ts    = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
    setDemoPings(prev => [
      { id: Date.now(), truck_id: route.id, driver_name: route.driver.name, color: route.color,
        lat: parseFloat(pos.lat.toFixed(5)), lng: parseFloat(pos.lng.toFixed(5)),
        speed_mph: route.status === 'at_stop' ? 0 : Math.round(15 + Math.random() * 25), ts },
      ...prev.slice(0, 49),
    ]);
  }, [tick]);

  const displayPings = DEMO_MODE ? demoPings : pings;

  // Status indicator config
  const statusCfg = {
    live:        { dot: 'bg-emerald-400 animate-pulse', label: 'Live', color: 'text-emerald-400' },
    connecting:  { dot: 'bg-amber-400 animate-pulse',   label: 'Connecting…', color: 'text-amber-400' },
    error:       { dot: 'bg-red-400',                   label: 'Disconnected', color: 'text-red-400' },
    demo:        { dot: 'bg-cyan-400 animate-pulse',    label: 'Demo Mode', color: 'text-cyan-400' },
  };
  const sc = statusCfg[realtimeStatus] || statusCfg.connecting;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Realtime connection card */}
      <div className={`${card} border rounded-xl p-4`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Radio size={15} className="text-emerald-400" />
          </div>
          <div>
            <div className={`text-sm font-bold ${isDark?'text-white':'text-slate-900'}`}>Supabase Realtime</div>
            <div className={`text-xs ${sub}`}>driver_locations · postgres_changes</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
            <span className={`text-xs font-semibold ${sc.color}`}>{sc.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Trucks',  val: routes.length },
            { label: 'Ping Interval',  val: '10 s' },
            { label: 'Transport',      val: 'WebSocket' },
          ].map(({ label, val }) => (
            <div key={label} className={`text-center p-2 rounded-lg ${isDark?'bg-gray-900/60':'bg-gray-50'}`}>
              <div className={`text-base font-bold ${isDark?'text-white':'text-slate-900'}`}>{val}</div>
              <div className={`text-[10px] ${sub}`}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Last-known positions */}
      <div>
        <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${sub}`}>Last Known Positions</div>
        <div className="space-y-2">
          {routes.map(route => {
            const live = !DEMO_MODE && livePositions[route.id];
            const pos  = live ? live : getTruckPos(route, tick);
            const sm   = STATUS_META[route.status] || STATUS_META.idle;
            const stale = live && ((Date.now() - new Date(live.updated_at).getTime()) > 5 * 60 * 1000);
            return (
              <div key={route.id} className={`${card} border rounded-xl px-4 py-3 flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: route.color + '22' }}>
                  <Signal size={14} style={{ color: route.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold ${isDark?'text-white':'text-slate-900'}`}>{route.truck.split(' — ')[0]}</div>
                  <div className={`text-[10px] ${sub}`}>{route.driver.name}</div>
                </div>
                <div className={`text-[10px] font-mono ${sub}`}>{parseFloat(pos.lat).toFixed(5)}, {parseFloat(pos.lng).toFixed(5)}</div>
                {live && live.speed_mph != null && (
                  <span className={`text-[10px] ${sub}`}>{parseFloat(live.speed_mph).toFixed(0)} mph</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sm.badge}`}>{sm.label}</span>
                <div className="flex items-center gap-1">
                  {stale
                    ? <WifiOff size={11} className="text-red-400" />
                    : <Wifi    size={11} className="text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live ping feed */}
      <div>
        <div className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${sub}`}>
          <Activity size={11} className="text-cyan-400" />
          {DEMO_MODE ? 'Simulated Ping Feed' : 'Live Realtime Feed'}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${DEMO_MODE ? 'text-cyan-400 bg-cyan-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
            {DEMO_MODE ? 'DEMO' : 'LIVE'}
          </span>
        </div>
        <div className={`${card} border rounded-xl overflow-hidden`}>
          {displayPings.length === 0 ? (
            <div className={`px-4 py-8 text-center text-xs ${sub}`}>
              Waiting for GPS pings from active trucks…
            </div>
          ) : (
            <div className={`font-mono text-[11px] divide-y ${isDark?'divide-gray-700/50':'divide-gray-100'}`} style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {displayPings.map(ping => (
                <div key={ping.id} className={`px-3 py-1.5 flex items-center gap-2 ${isDark?'hover:bg-gray-700/30':'hover:bg-gray-50'}`}>
                  <span className={`${sub} flex-shrink-0`}>{ping.ts}</span>
                  {ping.color && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: ping.color }} />}
                  <span className={`font-semibold ${isDark?'text-gray-200':'text-slate-800'} flex-shrink-0`}>
                    {ping.truck_id}{ping.driver_name ? ` (${ping.driver_name})` : ''}
                  </span>
                  <span className={sub}>→</span>
                  <span className="text-cyan-400">{parseFloat(ping.lat).toFixed(5)}, {parseFloat(ping.lng).toFixed(5)}</span>
                  {ping.speed_mph != null && (
                    <span className={`ml-auto ${sub} flex-shrink-0`}>{parseFloat(ping.speed_mph).toFixed(0)} mph</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Architecture note */}
      <div className={`text-xs ${sub} border ${isDark?'border-gray-700 bg-gray-800/30':'border-gray-200 bg-gray-50'} rounded-xl px-4 py-3`}>
        <span className="font-semibold text-cyan-400">Architecture:</span> Driver tablets run the Kernal Driver PWA, which posts GPS coordinates to <code className="text-cyan-300">POST /api/v1/logistics/driver-location</code> every 10 s. The backend upserts into <code className="text-cyan-300">driver_locations</code> and Supabase pushes the change to all subscribed dispatch clients via WebSocket — no polling required.
      </div>
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
export default function GPSDispatchModule() {
  // NOTE: Do NOT destructure useKernal() directly here — Rolldown's minifier
  // aliases destructured bindings to single-letter names (e, t, …) and will
  // collide with inner-scope variables (e.g. the setInterval handle).
  // Use full property access via a named intermediate to force distinct aliases.
  const gpsKernalCtx = useKernal();
  const gpsCanAccess = gpsKernalCtx.can;       // context exposes `can`, not `canAccess`
  const gpsSettings  = gpsKernalCtx.settings;
  const isDark = gpsSettings?.theme !== 'light';

  const [tab, setTab]         = useState('map');
  const [tick, setTick]       = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  // ── Live routes state ─────────────────────────────────────────────────────────
  // In demo: ACTIVE_ROUTES (pre-seeded Tampa routes with stop coordinates).
  // In production: fetched from GET /api/v1/logistics/routes (stops have no coords).
  const [liveRoutes, setLiveRoutes] = useState(ACTIVE_ROUTES);

  useEffect(() => {
    if (DEMO_MODE) return;
    api.logistics.routes.list({ status: 'Dispatched,In Progress', limit: 50 })
      .then(({ data }) => {
        const normalized = (data || []).map((r, i) => normalizeApiRoute(r, i));
        setLiveRoutes(normalized);
      })
      .catch(() => {/* non-fatal — stays empty; trucks still appear via livePositions */});
  }, []);

  // ── Live GPS state (Supabase Realtime) ──────────────────────────────────────
  // livePositions: { [route_id | truck_id]: driver_location row }
  const [livePositions,  setLivePositions]  = useState({});
  // realtimeStatus: 'connecting' | 'live' | 'error' | 'demo'
  const [realtimeStatus, setRealtimeStatus] = useState(DEMO_MODE ? 'demo' : 'connecting');
  // pings: rolling log of Realtime change events for the telemetry feed
  const [gpsRealtimePings, setGpsRealtimePings] = useState([]);

  // Seed initial positions from REST (so map isn't blank while Realtime connects)
  useEffect(() => {
    if (DEMO_MODE) return;
    api.logistics.driverLocations()
      .then(({ data }) => {
        const posMap = {};
        (data || []).forEach(loc => {
          const key = loc.route_id || loc.truck_id;
          posMap[key] = loc;
        });
        setLivePositions(posMap);
      })
      .catch(() => {/* non-fatal — map falls back to demo animation */});
  }, []);

  // Supabase Realtime subscription on driver_locations
  useEffect(() => {
    if (DEMO_MODE) return;
    const channel = supabase
      .channel('gps-dispatch-driver-locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        payload => {
          const loc = payload.new;
          if (!loc) return;
          if (loc.truck_id?.startsWith('REP-')) return;  // field-sales reps — not trucks
          const key = loc.route_id || loc.truck_id;
          setLivePositions(prev => ({ ...prev, [key]: loc }));

          // Add timestamped ping to telemetry feed (trucks only — reps already filtered above)
          const now = new Date();
          const ts  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`;
          setGpsRealtimePings(prev => [
            { id: Date.now(), truck_id: loc.truck_id, driver_name: loc.driver_name,
              lat: loc.lat, lng: loc.lng, speed_mph: loc.speed_mph, ts },
            ...prev.slice(0, 49),
          ]);
        },
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('live');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Simulation clock — advances truck positions.
  // Long handle name prevents Rolldown from aliasing it to the same letter as gpsCanAccess.
  useEffect(() => {
    const gpsTickIntervalHandle = setInterval(() => setTick(prev => prev + 1), 2000);
    return () => clearInterval(gpsTickIntervalHandle);
  }, []);

  const gpsModuleAccess = gpsCanAccess('gps');
  if (gpsModuleAccess === 'none') {
    return <div className="p-8 text-center text-gray-500">You don't have access to GPS Dispatch.</div>;
  }

  const bg    = isDark ? 'bg-gray-900' : 'bg-[#f8fafc]';
  const card  = isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-[#e2e8f0]';
  const sub   = isDark ? 'text-gray-400' : 'text-slate-500';
  const head  = isDark ? 'text-white'    : 'text-slate-900';

  // KPI strip totals
  const enRoute   = liveRoutes.filter(r => r.status === 'en_route').length;
  const atStop    = liveRoutes.filter(r => r.status === 'at_stop').length;
  const returning = liveRoutes.filter(r => r.status === 'returning').length;
  const totalDelivered = liveRoutes.flatMap(r => r.stops || []).filter(s => s.status === 'delivered').length;
  const totalStops     = liveRoutes.flatMap(r => r.stops || []).length;

  const TABS = [
    { id:'map',       label:'Live Map',        icon: MapPin      },
    { id:'optimizer', label:'Route Optimizer', icon: Navigation  },
    { id:'fleet',     label:'Fleet Status',    icon: Truck       },
    { id:'telemetry', label:'GPS Telemetry',   icon: Activity    },
  ];

  return (
    <div className={`${bg} min-h-full`}>
      {/* Top bar */}
      <div className={`border-b ${isDark?'border-gray-800':'border-[#e2e8f0]'} px-6 py-4`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className={`text-lg font-bold ${head}`}>Fleet Intelligence</h2>
            <p className={`text-xs mt-0.5 ${sub}`}>Real-time positioning · Route optimization · Traccar telemetry · Tampa, FL</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'live' || realtimeStatus === 'demo' ? 'bg-emerald-400 animate-pulse' : realtimeStatus === 'error' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            <span className={`text-xs font-semibold ${realtimeStatus === 'live' ? 'text-emerald-400' : realtimeStatus === 'demo' ? 'text-cyan-400' : realtimeStatus === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
              {realtimeStatus === 'live' ? `${liveRoutes.length} trucks live` : realtimeStatus === 'demo' ? 'Demo mode' : realtimeStatus === 'error' ? 'Realtime offline' : 'Connecting…'}
            </span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
          {[
            { label:'En Route',     val: enRoute,           color:'text-cyan-400'    },
            { label:'At Stop',      val: atStop,            color:'text-amber-400'   },
            { label:'Returning',    val: returning,         color:'text-violet-400'  },
            { label:'Stops Done',   val: totalDelivered,    color:'text-emerald-400' },
            { label:'Total Stops',  val: totalStops,        color: head              },
          ].map(({ label, val, color }) => (
            <div key={label} className={`${card} border rounded-xl px-3 py-2.5 text-center`}>
              <div className={`text-xl font-bold ${color}`}>{val}</div>
              <div className={`text-[10px] font-semibold ${sub} mt-0.5`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div id="kernal-module-tabs" className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === id
                  ? isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : isDark ? `border border-transparent ${sub} hover:bg-gray-800` : `border border-transparent ${sub} hover:bg-gray-100`
              }`}>
              <Icon size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {tab === 'map' && (
          <div className="space-y-4">
            <MapView routes={liveRoutes} tick={tick} isDark={isDark} selectedId={selectedId} onSelect={setSelectedId} livePositions={livePositions} />
            {/* Route legend below map */}
            <div className="flex flex-wrap gap-2">
              {liveRoutes.map(r => {
                const sm  = STATUS_META[r.status] || STATUS_META.idle;
                const del = r.stops.filter(s => s.status === 'delivered').length;
                return (
                  <button key={r.id} onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      selectedId === r.id
                        ? `border-2`
                        : `${card} border`
                    }`}
                    style={selectedId === r.id ? { borderColor: r.color, background: r.color + '18' } : {}}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: r.status === 'en_route' ? r.color : r.color + '80' }} />
                    <span className={isDark?'text-gray-200':'text-slate-700'}>{r.driver.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${sm.badge}`}>{sm.label}</span>
                    <span className={sub}>{del}/{r.stops.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {tab === 'optimizer' && <RouteOptimizerView isDark={isDark} />}
        {tab === 'fleet'     && <FleetStatusView routes={liveRoutes} tick={tick} isDark={isDark} />}
        {tab === 'telemetry' && (
          <GPSTelemetryView
            routes={liveRoutes}
            tick={tick}
            isDark={isDark}
            pings={gpsRealtimePings}
            realtimeStatus={realtimeStatus}
            livePositions={livePositions}
          />
        )}
      </div>
    </div>
  );
}
