import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.vehicleLocations = {}; 
        this.focusedTripId = null;
        this.routeLine = null; // Capa para la línea azul de ruta
        this.destinationMarker = null; // Capa para el pin de destino

        this.baseCoords = [19.4326, -99.1332]; // CDMX Centro
        this.baseZoom = 11;
        this.naucalpanBase = [19.4785, -99.2396];

        window.trackingModule = this;
    }

    async waitForLeaflet() {
        return new Promise((resolve) => {
            if (window.L) return resolve();
            const interval = setInterval(() => {
                if (window.L) { clearInterval(interval); resolve(); }
            }, 100);
        });
    }

    async onMount() {
        await this.waitForLeaflet();
        this.initMap();
        await this.loadActiveTrips();
        this.setupRealtimeSubscription();
    }

    initMap() {
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

    async loadActiveTrips() {
        // Obtenemos los datos del viaje y el destino si existe
        const { data: trips } = await supabase
            .from('trips')
            .select('*, profiles(full_name, photo_url), vehicles(economic_number, plate, model)')
            .in('status', ['in_progress', 'open', 'approved']);
            
        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        if (this.activeTrips.length > 0) {
            const tripIds = this.activeTrips.map(t => t.id);
            // Obtenemos la última ubicación de cada viaje
            const { data: locations } = await supabase
                .from('trip_locations')
                .select('*')
                .in('trip_id', tripIds)
                .order('created_at', { ascending: false });

            if (locations) {
                locations.forEach(loc => {
                    if (!this.vehicleLocations[loc.trip_id]) this.vehicleLocations[loc.trip_id] = loc;
                });
            }
        }
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    setupRealtimeSubscription() {
        supabase.channel('tracking_live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, payload => {
                this.updateLiveLocation(payload.new);
            }).subscribe();
    }

    updateLiveLocation(newLoc) {
        if (!this.activeTrips.find(t => t.id === newLoc.trip_id)) return;
        this.vehicleLocations[newLoc.trip_id] = newLoc;
        
        this.renderSidebarList();
        this.updateMapMarkers();

        // Si el usuario está viendo este vehículo, actualizamos ruta y cámara
        if (this.focusedTripId === newLoc.trip_id) {
            this.drawRoute(newLoc.trip_id);
            this.map.panTo([newLoc.lat, newLoc.lng], { animate: true });
            document.getElementById('route-speed').innerText = Math.round(newLoc.speed || 0) + ' km/h';
        }
    }

    // --- DIBUJAR RUTA HACIA DESTINO ---
    drawRoute(tripId) {
        const L = window.L;
        const trip = this.activeTrips.find(t => t.id === tripId);
        const loc = this.vehicleLocations[tripId];

        // Limpiar capas previas de ruta
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);

        if (!loc || !trip) return;

        // Si el viaje tiene destino (lat/lng guardado en la tabla trips o trayectos)
        // Nota: Ajusta 'dest_lat' y 'dest_lng' según tus nombres de columna reales
        if (trip.dest_lat && trip.dest_lng) {
            const start = [loc.lat, loc.lng];
            const end = [trip.dest_lat, trip.dest_lng];

            // Dibujar línea de trayecto
            this.routeLine = L.polyline([start, end], {
                color: '#137fec',
                weight: 4,
                opacity: 0.6,
                dashArray: '10, 10' // Línea punteada para estilo logístico
            }).addTo(this.map);

            // Marcador de destino
            const destIcon = L.divIcon({
                className: 'dest-marker',
                html: `<div class="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_red]"></div>`,
                iconSize: [16, 16]
            });
            this.destinationMarker = L.marker(end, { icon: destIcon }).addTo(this.map);
            
            // Calcular distancia y ETA aproximado
            const distance = (L.latLng(start).distanceTo(L.latLng(end)) / 1000).toFixed(1);
            document.getElementById('route-panel-status').innerText = `A ${distance} km del destino`;
        } else {
            document.getElementById('route-panel-status').innerText = `En ruta (Sin destino fijado)`;
        }
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        list.innerHTML = this.activeTrips.map(trip => {
            const isFocused = this.focusedTripId === trip.id;
            return `
            <div class="p-3 rounded-xl border ${isFocused ? 'border-primary bg-primary/10 shadow-[0_0_10px_rgba(19,127,236,0.2)]' : 'border-[#324d67] bg-[#1c2127]'} cursor-pointer mb-2 transition-all" 
                 onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex items-center gap-3">
                    <div class="size-9 rounded-full bg-slate-800 bg-cover bg-center border border-[#324d67]" 
                         style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-white text-xs font-bold truncate">${trip.profiles?.full_name}</h4>
                        <p class="text-[10px] text-primary font-black uppercase">ECO-${trip.vehicles?.economic_number}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] font-mono text-emerald-400 font-bold">${Math.round(this.vehicleLocations[trip.id]?.speed || 0)} km/h</p>
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
                // Actualizar estilo si cambia el foco
                if(isFocused) this.markers[trip.id].getElement()?.classList.add('marker-focused');
                else this.markers[trip.id].getElement()?.classList.remove('marker-focused');
            } else {
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="marker-container"><div class="marker-label">ECO-${trip.vehicles?.economic_number}</div><div class="marker-dot"></div></div>`,
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
        
        this.map.flyTo(coords, 16, { duration: 1.5 });
        document.getElementById('btn-view-all').classList.remove('hidden');
        
        this.showRoutePanel(id);
        this.drawRoute(id); // <--- Dibujamos la línea de ruta
        this.renderSidebarList();
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        this.clearRouteGraphics();
        this.map.flyTo(this.baseCoords, this.baseZoom);
        document.getElementById('btn-view-all').classList.add('hidden');
        document.getElementById('route-panel').classList.add('opacity-0', 'pointer-events-none');
        this.renderSidebarList();
    }

    clearRouteGraphics() {
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);
        this.routeLine = null;
        this.destinationMarker = null;
    }

    showRoutePanel(id) {
        const trip = this.activeTrips.find(t => t.id === id);
        const loc = this.vehicleLocations[id];
        const panel = document.getElementById('route-panel');
        
        panel.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name;
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        document.getElementById('route-speed').innerText = (loc?.speed || 0) + ' km/h';
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
    }

    render() {
        return `
        <div class="h-full w-full relative animate-fade-in flex flex-col rounded-2xl overflow-hidden border border-[#324d67] bg-[#0d141c]">
            <div id="tracking-map" class="absolute inset-0 z-0 bg-[#0d141c]"></div>
            
            <div class="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div class="pointer-events-auto">
                    <h1 class="text-white text-2xl font-black drop-shadow-lg">Torre de Control GPS</h1>
                    <p class="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Posiciones en Tiempo Real
                    </p>
                </div>
                <div class="bg-[#111a22]/80 backdrop-blur-md border border-[#324d67] rounded-xl p-3 flex items-center gap-4 shadow-lg pointer-events-auto">
                    <div class="bg-primary/20 p-2 rounded-lg text-primary"><span class="material-symbols-outlined text-sm">local_shipping</span></div>
                    <div><p class="text-[9px] font-bold text-[#92adc9] uppercase">En Ruta</p><p id="track-active-count" class="text-lg font-black text-white leading-none">0</p></div>
                </div>
            </div>

            <div class="absolute top-28 bottom-6 left-6 w-72 bg-[#111a22]/90 backdrop-blur-xl border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] flex justify-between items-center">
                    <h3 class="font-bold text-white text-xs uppercase tracking-widest" id="sidebar-title">Unidades</h3>
                    <button id="btn-view-all" class="hidden bg-primary/20 text-primary text-[9px] font-bold px-2 py-1 rounded uppercase" onclick="window.trackingModule.viewAllVehicles()">Mapa Gral</button>
                </div>
                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-2"></div>
            </div>

            <div id="route-panel" class="absolute bottom-6 right-6 w-80 bg-[#111a22]/95 backdrop-blur-xl border border-primary/40 rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                <div class="p-4 border-b border-[#324d67] flex items-center gap-3">
                    <div class="size-10 rounded-full bg-slate-700 bg-cover bg-center border border-primary" id="route-driver-img"></div>
                    <div>
                        <h4 class="font-bold text-white text-xs" id="route-driver-name">--</h4>
                        <p class="text-[9px] text-[#92adc9] uppercase" id="route-vehicle-info">--</p>
                    </div>
                </div>
                <div class="p-4 space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-[#92adc9] font-bold uppercase" id="route-panel-status">Cargando ruta...</span>
                        <span id="route-speed" class="text-emerald-400 font-mono font-bold text-sm">0 km/h</span>
                    </div>
                    <div class="w-full bg-[#1c2127] h-1.5 rounded-full overflow-hidden border border-[#324d67]">
                        <div class="bg-primary h-full w-1/2 animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .marker-container { position: relative; display: flex; flex-direction: column; align-items: center; }
            .marker-dot { width: 12px; height: 12px; background: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
            .marker-label { background: #111a22; border: 1px solid #324d67; color: white; font-size: 8px; font-bold; padding: 1px 4px; border-radius: 3px; margin-bottom: 2px; white-space: nowrap; }
            .marker-focused .marker-dot { background: #137fec; width: 16px; height: 16px; box-shadow: 0 0 20px #137fec; }
            .marker-focused .marker-label { background: #137fec; border-color: #fff; font-size: 10px; }
        </style>
        `;
    }
}
