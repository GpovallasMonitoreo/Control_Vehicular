import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.vehicleLocations = {}; 
        this.focusedTripId = null;
        this.routeLine = null; 
        this.destinationMarker = null; 

        // Configuración de vista inicial (CDMX y EdoMex)
        this.baseCoords = [19.4326, -99.1332]; 
        this.baseZoom = 11;
        this.baseNaucalpan = [19.4785, -99.2396];

        window.trackingModule = this;
    }

    // --- SEGURIDAD: ESPERAR A QUE LEAFLET ESTÉ LISTO ---
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
        // Inicializamos el mapa en el contenedor 'tracking-map'
        this.map = L.map('tracking-map', { 
            zoomControl: false,
            attributionControl: false 
        }).setView(this.baseCoords, this.baseZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Capa de mapa oscura estilo logístico
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        // Traemos viajes activos con sus relaciones
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*, profiles(full_name, photo_url), vehicles(economic_number, plate, model)')
            .in('status', ['in_progress', 'open', 'approved']);
            
        if (error) return console.error("Error:", error);

        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        if (this.activeTrips.length > 0) {
            const tripIds = this.activeTrips.map(t => t.id);
            // Obtenemos la última posición conocida de cada uno
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
        // Escuchamos nuevas coordenadas enviadas por los conductores
        supabase.channel('tracking_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, payload => {
                this.handleIncomingLocation(payload.new);
            }).subscribe();
    }

    handleIncomingLocation(newLoc) {
        if (!this.activeTrips.find(t => t.id === newLoc.trip_id)) return;
        this.vehicleLocations[newLoc.trip_id] = newLoc;
        
        this.updateMapMarkers();
        this.renderSidebarList();

        // Si estamos siguiendo a este conductor, actualizamos su ruta y panel
        if (this.focusedTripId === newLoc.trip_id) {
            this.drawRouteAndCalculateETA(newLoc.trip_id);
            this.map.panTo([newLoc.lat, newLoc.lng], { animate: true });
        }
    }

    // --- CÁLCULO DE RUTA, DISTANCIA Y TIEMPO (SLA) ---
    drawRouteAndCalculateETA(tripId) {
        const L = window.L;
        const trip = this.activeTrips.find(t => t.id === tripId);
        const loc = this.vehicleLocations[tripId];

        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);

        if (!loc || !trip || !trip.dest_lat) return;

        const start = [loc.lat, loc.lng];
        const end = [trip.dest_lat, trip.dest_lng];

        // Dibujar línea de trayectoria
        this.routeLine = L.polyline([start, end], {
            color: '#137fec',
            weight: 4,
            opacity: 0.5,
            dashArray: '10, 15'
        }).addTo(this.map);

        // Pin de Destino
        const destIcon = L.divIcon({
            className: 'dest-marker',
            html: `<div class="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_red] animate-pulse"></div>`
        });
        this.destinationMarker = L.marker(end, { icon: destIcon }).addTo(this.map);

        // Cálculos matemáticos de llegada
        const distanceMeters = L.latLng(start).distanceTo(L.latLng(end));
        const distanceKm = (distanceMeters / 1000).toFixed(1);
        const speed = loc.speed || 30; // 30km/h por defecto si está parado
        const timeHours = distanceKm / speed;
        const timeMinutes = Math.round(timeHours * 60);

        // Actualizar panel inferior
        document.getElementById('route-speed').innerText = `${Math.round(speed)} km/h`;
        document.getElementById('route-eta').innerText = `Llegada aprox: ${timeMinutes} min`;
        document.getElementById('route-distance').innerText = `Faltan ${distanceKm} km`;
        document.getElementById('route-dest-name').innerText = trip.destination_name || "Destino Final";
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        list.innerHTML = this.activeTrips.map(trip => {
            const loc = this.vehicleLocations[trip.id];
            const isFocused = this.focusedTripId === trip.id;
            return `
            <div class="p-3 rounded-xl border ${isFocused ? 'border-primary bg-primary/10 shadow-lg' : 'border-[#324d67] bg-[#1c2127]'} cursor-pointer mb-2 transition-all" 
                 onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-slate-800 bg-cover bg-center border border-[#324d67]" 
                         style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                    <div class="flex-1">
                        <h4 class="text-white text-xs font-bold">${trip.profiles?.full_name}</h4>
                        <p class="text-[9px] text-primary font-black uppercase">ECO-${trip.vehicles?.economic_number}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-mono ${loc?.speed > 0 ? 'text-emerald-400' : 'text-slate-500'} font-bold">
                            ${Math.round(loc?.speed || 0)} km/h
                        </span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    updateMapMarkers() {
        const L = window.L;
        this.activeTrips.forEach(trip => {
            const loc = this.vehicleLocations[trip.id];
            const coords = loc ? [loc.lat, loc.lng] : this.baseNaucalpan;
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
        const coords = loc ? [loc.lat, loc.lng] : this.baseNaucalpan;
        
        this.map.flyTo(coords, 16, { duration: 1.5 });
        document.getElementById('btn-view-all').classList.remove('hidden');
        
        this.showRoutePanel(id);
        this.drawRouteAndCalculateETA(id);
        this.renderSidebarList();
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);
        
        this.map.flyTo(this.baseCoords, this.baseZoom);
        document.getElementById('btn-view-all').classList.add('hidden');
        document.getElementById('route-panel').classList.add('opacity-0', 'pointer-events-none');
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    showRoutePanel(id) {
        const trip = this.activeTrips.find(t => t.id === id);
        const panel = document.getElementById('route-panel');
        panel.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name;
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
    }

    render() {
        return `
        <div class="h-full w-full relative flex flex-col bg-[#0d141c] overflow-hidden">
            
            <div id="tracking-map" class="absolute inset-0 z-0 h-full w-full"></div>
            
            <div class="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div class="pointer-events-auto">
                    <h1 class="text-white text-2xl font-black drop-shadow-xl">Logística en Tiempo Real</h1>
                    <p class="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Radar de Flota Activo
                    </p>
                </div>
                <div class="bg-[#111a22]/90 backdrop-blur-md border border-[#324d67] rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-center gap-4">
                    <div class="bg-primary/20 p-2 rounded-lg text-primary"><span class="material-symbols-outlined">local_shipping</span></div>
                    <div>
                        <p class="text-[9px] font-bold text-[#92adc9] uppercase">Unidades Fuera</p>
                        <p id="track-active-count" class="text-xl font-black text-white leading-none">0</p>
                    </div>
                </div>
            </div>

            <div class="absolute top-32 bottom-6 left-6 w-72 bg-[#111a22]/90 backdrop-blur-xl border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]/50">
                    <h3 class="font-bold text-white text-xs uppercase tracking-widest">Conductores</h3>
                    <button id="btn-view-all" class="hidden bg-primary text-white text-[10px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-primary/20" onclick="window.trackingModule.viewAllVehicles()">Ver Todo</button>
                </div>
                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-3"></div>
            </div>

            <div id="route-panel" class="absolute bottom-6 right-6 w-80 bg-[#111a22]/95 backdrop-blur-xl border border-primary/40 rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                <div class="p-4 border-b border-[#324d67] flex items-center gap-3">
                    <div class="size-12 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary" id="route-driver-img"></div>
                    <div>
                        <h4 class="font-bold text-white text-sm" id="route-driver-name">--</h4>
                        <p class="text-[9px] text-[#92adc9] font-bold uppercase tracking-tighter" id="route-vehicle-info">--</p>
                    </div>
                </div>
                <div class="p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <div class="flex flex-col">
                            <span class="text-[10px] text-slate-500 uppercase font-black">Destino</span>
                            <span id="route-dest-name" class="text-white text-xs font-bold truncate max-w-[150px]">--</span>
                        </div>
                        <span id="route-speed" class="text-emerald-400 font-mono font-black text-lg">0 km/h</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3 pt-2">
                        <div class="bg-[#1c2127] p-2 rounded-lg border border-[#324d67] text-center">
                            <span class="text-[9px] text-[#92adc9] uppercase block mb-0.5">Tiempo</span>
                            <span id="route-eta" class="text-white font-bold text-xs font-mono">--</span>
                        </div>
                        <div class="bg-[#1c2127] p-2 rounded-lg border border-[#324d67] text-center">
                            <span class="text-[9px] text-[#92adc9] uppercase block mb-0.5">Distancia</span>
                            <span id="route-distance" class="text-white font-bold text-xs font-mono">--</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .marker-container { position: relative; display: flex; flex-direction: column; align-items: center; }
            .marker-dot { width: 14px; height: 14px; background: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
            .marker-label { background: #111a22; border: 1px solid #324d67; color: white; font-size: 8px; font-weight: 900; padding: 1px 5px; border-radius: 4px; margin-bottom: 3px; white-space: nowrap; shadow: 0 4px 6px rgba(0,0,0,0.3); }
            .marker-focused .marker-dot { background: #137fec; width: 18px; height: 18px; box-shadow: 0 0 20px #137fec; border-width: 3px; }
            .marker-focused .marker-label { background: #137fec; font-size: 10px; border-color: white; }
        </style>
        `;
    }
}
