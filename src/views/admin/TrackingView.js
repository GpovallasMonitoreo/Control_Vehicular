import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.vehicleLocations = {}; 
        this.focusedTripId = null;
        this.baseCoords = [19.4326, -99.1332]; // CDMX/EdoMex
        this.baseZoom = 11;
        this.naucalpanBase = [19.4785, -99.2396];

        window.trackingModule = this;
    }

    // --- FUNCIÓN DE SEGURIDAD PARA ESPERAR A LEAFLET ---
    async waitForLeaflet() {
        return new Promise((resolve) => {
            if (window.L) return resolve();
            const interval = setInterval(() => {
                if (window.L) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    async onMount() {
        // Esperamos a que 'L' (Leaflet) esté definido globalmente
        await this.waitForLeaflet();
        
        this.initMap();
        await this.loadActiveTrips();
        this.setupRealtimeSubscription();
    }

    initMap() {
        // Ahora es seguro usar L
        const L = window.L; 
        
        this.map = L.map('tracking-map', { 
            zoomControl: false,
            attributionControl: false 
        }).setView(this.baseCoords, this.baseZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);
    }

    // ... (El resto de funciones: loadActiveTrips, render, etc. se mantienen igual)
    // Pero asegúrate de que donde uses L.marker o L.latLngBounds, 
    // uses window.L para evitar el error de referencia.

    render() {
        return `
        <div class="h-full w-full relative animate-fade-in flex flex-col rounded-2xl overflow-hidden border border-[#324d67] shadow-2xl bg-[#0d141c]">
            <div id="tracking-map" class="absolute inset-0 z-0 bg-[#0d141c]"></div>
            <div class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0d141c]/90 to-transparent z-10 pointer-events-none"></div>
            
            <div class="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div class="pointer-events-auto">
                    <h1 class="text-white text-3xl font-black flex items-center gap-3 drop-shadow-md">
                        <span class="material-symbols-outlined text-primary text-4xl animate-pulse">satellite_alt</span>
                        Torre de Control Logística
                    </h1>
                    <p class="text-emerald-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2 mt-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> GPS Realtime
                    </p>
                </div>
                <div class="flex gap-4 pointer-events-auto">
                    <div class="bg-[#111a22]/80 backdrop-blur-md border border-[#324d67] rounded-xl p-3 flex items-center gap-4 shadow-lg">
                        <div class="bg-primary/20 p-2 rounded-lg text-primary"><span class="material-symbols-outlined">local_shipping</span></div>
                        <div><p class="text-[10px] font-bold text-[#92adc9] uppercase tracking-widest">En Ruta</p><p id="track-active-count" class="text-xl font-black text-white leading-none">0</p></div>
                    </div>
                </div>
            </div>

            <div class="absolute top-32 bottom-6 left-6 w-80 bg-[#111a22]/90 backdrop-blur-xl border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl overflow-hidden pointer-events-auto" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center">
                    <h3 class="font-bold text-white text-sm uppercase tracking-widest" id="sidebar-title">Flota Global</h3>
                    <button id="btn-view-all" class="hidden bg-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase transition-colors" onclick="window.trackingModule.viewAllVehicles()">Ver Todos</button>
                </div>
                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2"></div>
            </div>

            <div id="route-panel" class="absolute bottom-6 right-6 w-96 bg-[#111a22]/95 backdrop-blur-xl border border-primary/50 rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                <div class="p-4 border-b border-[#324d67] flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary" id="route-driver-img"></div>
                        <div><h4 class="font-black text-white text-sm" id="route-driver-name">--</h4><p class="text-[10px] font-mono text-[#92adc9] uppercase tracking-widest" id="route-vehicle-info">--</p></div>
                    </div>
                </div>
                <div class="p-5">
                    <div class="bg-[#1c2127] rounded-xl p-4 border border-[#324d67]">
                        <span class="text-xs font-bold text-[#92adc9] uppercase tracking-widest">Velocidad Actual</span>
                        <p id="route-speed" class="text-2xl font-black text-emerald-400 font-mono mt-1">0 km/h</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async loadActiveTrips() {
        const { data: trips } = await supabase.from('trips').select('*, profiles(full_name, photo_url), vehicles(economic_number, plate, model)').in('status', ['in_progress', 'open', 'approved']);
        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        if (this.activeTrips.length > 0) {
            const tripIds = this.activeTrips.map(t => t.id);
            const { data: locations } = await supabase.from('trip_locations').select('*').in('trip_id', tripIds).order('created_at', { ascending: false });
            if (locations) {
                locations.forEach(loc => { if (!this.vehicleLocations[loc.trip_id]) this.vehicleLocations[loc.trip_id] = loc; });
            }
        }
        this.renderSidebarList();
        this.updateMapMarkers();
        if (!this.focusedTripId) this.viewAllVehicles();
    }

    setupRealtimeSubscription() {
        supabase.channel('realtime_tracking').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, payload => {
            this.updateLiveLocation(payload.new);
        }).subscribe();
    }

    updateLiveLocation(newLoc) {
        if (!this.activeTrips.find(t => t.id === newLoc.trip_id)) return;
        this.vehicleLocations[newLoc.trip_id] = newLoc;
        this.renderSidebarList();
        this.updateMapMarkers();
        if (this.focusedTripId === newLoc.trip_id) {
            document.getElementById('route-speed').innerHTML = `${Math.round(newLoc.speed || 0)} <span class="text-xs text-slate-500">km/h</span>`;
            this.map.panTo([newLoc.lat, newLoc.lng], { animate: true });
        }
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        if (this.activeTrips.length === 0) {
            list.innerHTML = `<p class="text-center py-10 text-slate-500 text-xs">Sin unidades activas.</p>`;
            return;
        }
        list.innerHTML = this.activeTrips.map(trip => {
            const loc = this.vehicleLocations[trip.id];
            const isFocused = this.focusedTripId === trip.id;
            return `
            <div class="p-3 rounded-xl border ${isFocused ? 'border-primary bg-primary/10' : 'border-[#324d67] bg-[#1c2127]'} cursor-pointer" onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex items-center gap-3">
                    <div class="size-8 rounded-full bg-slate-800 bg-cover bg-center" style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                    <div>
                        <h4 class="text-white text-xs font-bold">${trip.profiles?.full_name}</h4>
                        <p class="text-[9px] text-primary font-black uppercase">ECO-${trip.vehicles?.economic_number}</p>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    updateMapMarkers() {
        const L = window.L;
        this.activeTrips.forEach(trip => {
            const loc = this.vehicleLocations[trip.id];
            const coords = loc ? [loc.lat, loc.lng] : this.naucalpanBase;
            const isFocused = this.focusedTripId === trip.id;

            if (this.markers[trip.id]) {
                this.markers[trip.id].setLatLng(coords);
            } else {
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="marker-container ${isFocused ? 'marker-focused' : ''}"><div class="marker-label">ECO-${trip.vehicles?.economic_number}</div><div class="marker-dot"></div></div>`,
                    iconSize: [60, 40], iconAnchor: [30, 40]
                });
                this.markers[trip.id] = L.marker(coords, { icon }).addTo(this.map).on('click', () => this.focusVehicle(trip.id));
            }
        });
    }

    focusVehicle(id) {
        this.focusedTripId = id;
        const loc = this.vehicleLocations[id];
        const coords = loc ? [loc.lat, loc.lng] : this.naucalpanBase;
        this.map.flyTo(coords, 16);
        document.getElementById('btn-view-all').classList.remove('hidden');
        this.showRoutePanel(id);
        this.updateMapMarkers();
        this.renderSidebarList();
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        this.map.flyTo(this.baseCoords, this.baseZoom);
        document.getElementById('btn-view-all').classList.add('hidden');
        document.getElementById('route-panel').classList.add('opacity-0', 'pointer-events-none');
        this.updateMapMarkers();
        this.renderSidebarList();
    }

    showRoutePanel(id) {
        const trip = this.activeTrips.find(t => t.id === id);
        const loc = this.vehicleLocations[id];
        document.getElementById('route-panel').classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name;
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        document.getElementById('route-speed').innerText = (loc?.speed || 0) + ' km/h';
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
    }
}
