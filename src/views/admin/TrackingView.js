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
        this.realtimeChannel = null;
        this.updateInterval = null;

        // Configuración de vista inicial (CDMX y EdoMex)
        this.baseCoords = [19.4326, -99.1332]; 
        this.baseZoom = 11;
        this.baseNaucalpan = [19.4785, -99.2396];

        window.trackingModule = this;
    }

    // --- SEGURIDAD: ESPERAR A QUE LEAFLET ESTÉ LISTO (MEJORADO) ---
    async waitForLeaflet() {
        return new Promise((resolve) => {
            if (window.L) return resolve();
            
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.L) { 
                    clearInterval(interval); 
                    resolve(); 
                } else if (attempts > 50) { // Timeout de 5 segundos
                    clearInterval(interval);
                    console.error("❌ ERROR: La librería Leaflet no se cargó. Verifica el index.html.");
                    resolve(); // Resuelve para no bloquear la app
                }
            }, 100);
        });
    }

    async onMount() {
        await this.waitForLeaflet();
        if (window.L) {
            this.initMap();
        }
        await this.loadActiveTrips();
        this.setupRealtimeSubscription();
        this.setupPeriodicUpdate();
    }

    initMap() {
        const L = window.L; 
        this.map = L.map('tracking-map', { 
            zoomControl: false,
            attributionControl: false 
        }).setView(this.baseCoords, this.baseZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Capa de mapa oscura estilo logístico
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        try {
            // Traemos viajes activos con sus relaciones
            const { data: trips, error } = await supabase
                .from('trips')
                .select(`
                    id,
                    status,
                    destination,
                    motivo,
                    start_time,
                    exit_km,
                    request_details,
                    profiles:driver_id (
                        id,
                        full_name, 
                        photo_url
                    ),
                    vehicles:vehicle_id (
                        economic_number, 
                        plate, 
                        model,
                        current_km
                    )
                `)
                .in('status', ['in_progress', 'driver_accepted', 'approved_for_taller'])
                .order('created_at', { ascending: false });
                
            if (error) throw error;

            this.activeTrips = trips || [];
            
            const activeCount = document.getElementById('track-active-count');
            if (activeCount) activeCount.innerText = this.activeTrips.length;

            // Obtener última ubicación de cada viaje activo
            if (this.activeTrips.length > 0) {
                await this.loadLatestLocations();
            }
            
            this.renderSidebarList();
            if (this.map) this.updateMapMarkers();

        } catch (error) {
            console.error("Error cargando viajes activos:", error);
        }
    }

    async loadLatestLocations() {
        try {
            const tripIds = this.activeTrips.map(t => t.id);
            
            // Obtener la última ubicación de cada viaje
            const { data: locations, error } = await supabase
                .from('trip_locations')
                .select('*')
                .in('trip_id', tripIds)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            if (locations) {
                // Limpiar ubicaciones anteriores
                this.vehicleLocations = {};
                
                // Guardar solo la más reciente de cada viaje
                locations.forEach(loc => {
                    if (!this.vehicleLocations[loc.trip_id] || 
                        new Date(loc.timestamp) > new Date(this.vehicleLocations[loc.trip_id].timestamp)) {
                        this.vehicleLocations[loc.trip_id] = loc;
                    }
                });
            }
        } catch (error) {
            console.error("Error cargando ubicaciones:", error);
        }
    }

    setupRealtimeSubscription() {
        // Escuchar nuevas ubicaciones en tiempo real vía Broadcast y cambios en DB
        this.realtimeChannel = supabase
            .channel('tracking_realtime')
            .on('broadcast', { event: 'location_update' }, payload => {
                this.handleIncomingLocation(payload.payload);
            })
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trips',
                    filter: `status=in.(in_progress,driver_accepted,approved_for_taller)`
                },
                payload => {
                    this.handleTripUpdate(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('📡 Tracking Realtime (Broadcast + DB):', status);
            });
    }

    setupPeriodicUpdate() {
        // Actualizar cada 10 segundos por si acaso
        this.updateInterval = setInterval(() => {
            this.loadActiveTrips();
        }, 10000);
    }

    handleIncomingLocation(newLoc) {
        // Verificar si el viaje sigue activo
        const tripExists = this.activeTrips.some(t => String(t.id) === String(newLoc.trip_id));
        if (!tripExists) return;

        // Actualizar ubicación
        this.vehicleLocations[newLoc.trip_id] = newLoc;
        
        // Actualizar marcador en el mapa
        if (this.map) this.updateSingleMarker(newLoc.trip_id);
        
        // Actualizar lista lateral
        this.renderSidebarList();

        // Si estamos siguiendo a este conductor, actualizar ruta y panel
        if (this.focusedTripId === newLoc.trip_id && this.map) {
            this.drawRouteAndCalculateETA(newLoc.trip_id);
            this.map.panTo([newLoc.lat, newLoc.lng], { animate: true });
            this.updateRoutePanel(newLoc.trip_id);
        }
    }

    handleTripUpdate(updatedTrip) {
        // Si el viaje ya no está activo, removerlo
        if (!['in_progress', 'driver_accepted', 'approved_for_taller'].includes(updatedTrip.status)) {
            this.activeTrips = this.activeTrips.filter(t => String(t.id) !== String(updatedTrip.id));
            
            // Remover marcador del mapa
            if (this.map && this.markers[updatedTrip.id]) {
                this.map.removeLayer(this.markers[updatedTrip.id]);
                delete this.markers[updatedTrip.id];
            }
            
            // Limpiar ruta si era el enfocado
            if (this.focusedTripId === updatedTrip.id) {
                this.viewAllVehicles();
            }
        } else {
            // Actualizar información del viaje
            const index = this.activeTrips.findIndex(t => String(t.id) === String(updatedTrip.id));
            if (index >= 0) {
                // Conservar las relaciones anidadas
                this.activeTrips[index] = { ...this.activeTrips[index], ...updatedTrip };
            } else {
                this.loadActiveTrips(); // Recargar completo si es un viaje nuevo para traer relaciones
            }
        }
        
        const activeCount = document.getElementById('track-active-count');
        if (activeCount) activeCount.innerText = this.activeTrips.length;
        
        this.renderSidebarList();
    }

    updateSingleMarker(tripId) {
        if (!this.map) return;
        
        const L = window.L;
        const trip = this.activeTrips.find(t => String(t.id) === String(tripId));
        const loc = this.vehicleLocations[tripId];
        
        if (!trip || !loc) return;

        const coords = [loc.lat, loc.lng];
        const isFocused = this.focusedTripId === tripId;

        if (this.markers[tripId]) {
            // Actualizar posición
            this.markers[tripId].setLatLng(coords);
            
            // Actualizar popup si existe
            const popup = this.markers[tripId].getPopup();
            if (popup) {
                popup.setContent(this.getMarkerPopupContent(trip, loc));
            }
        } else {
            // Crear nuevo marcador
            const icon = L.divIcon({
                className: 'custom-marker',
                html: this.getMarkerHtml(trip, loc, isFocused),
                iconSize: [80, 50],
                iconAnchor: [40, 50]
            });
            
            this.markers[tripId] = L.marker(coords, { icon })
                .addTo(this.map)
                .on('click', () => this.focusVehicle(tripId))
                .bindPopup(this.getMarkerPopupContent(trip, loc));
        }
    }

    getMarkerHtml(trip, loc, isFocused) {
        const speed = Math.round(loc?.speed || 0);
        const eco = trip.vehicles?.economic_number || '?';
        const focusedClass = isFocused ? 'marker-focused' : '';
        
        return `
            <div class="marker-container ${focusedClass}">
                <div class="marker-label">ECO-${eco}</div>
                <div class="marker-dot"></div>
                <div class="marker-speed">${speed} km/h</div>
            </div>
        `;
    }

    getMarkerPopupContent(trip, loc) {
        const speed = Math.round(loc?.speed || 0);
        const lastUpdate = loc?.timestamp ? new Date(loc.timestamp).toLocaleTimeString() : 'Desconocido';
        
        return `
            <div class="text-center min-w-[150px]">
                <p class="font-bold text-sm">${trip.profiles?.full_name || 'Conductor'}</p>
                <p class="text-xs text-gray-600">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                <div class="mt-2 text-xs">
                    <p>📍 ${trip.destination?.substring(0, 30) || 'Sin destino'}</p>
                    <p class="text-primary font-bold mt-1">⚡ ${speed} km/h</p>
                    <p class="text-gray-500 text-[9px] mt-1">🕐 ${lastUpdate}</p>
                </div>
            </div>
        `;
    }

    updateMapMarkers() {
        if (!this.map) return;
        this.activeTrips.forEach(trip => {
            this.updateSingleMarker(trip.id);
        });
    }

    // --- CÁLCULO DE RUTA, DISTANCIA Y TIEMPO ---
    async drawRouteAndCalculateETA(tripId) {
        if (!this.map) return;
        
        const L = window.L;
        const trip = this.activeTrips.find(t => String(t.id) === String(tripId));
        const loc = this.vehicleLocations[tripId];

        // Limpiar capas anteriores
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);

        if (!loc || !trip || !trip.destination) return;

        const start = [loc.lat, loc.lng];
        
        // Si tenemos coordenadas de destino guardadas
        let end = null;
        if (trip.request_details?.destination_coords) {
            end = [
                trip.request_details.destination_coords.lat,
                trip.request_details.destination_coords.lon
            ];
        }

        // Dibujar línea de trayectoria
        if (end) {
            this.routeLine = L.polyline([start, end], {
                color: '#137fec',
                weight: 4,
                opacity: 0.5,
                dashArray: '10, 15'
            }).addTo(this.map);

            // Pin de Destino
            const destIcon = L.divIcon({
                className: 'dest-marker',
                html: `<div class="bg-red-500 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_red] animate-pulse"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            this.destinationMarker = L.marker(end, { icon: destIcon }).addTo(this.map);

            // Calcular distancia y tiempo
            const distanceMeters = L.latLng(start).distanceTo(L.latLng(end));
            const distanceKm = (distanceMeters / 1000).toFixed(1);
            const speed = loc.speed || 30;
            const timeHours = distanceKm / speed;
            const timeMinutes = Math.round(timeHours * 60);

            // Actualizar panel
            document.getElementById('route-speed').innerText = `${Math.round(speed)} km/h`;
            document.getElementById('route-eta').innerText = timeMinutes > 0 ? `~${timeMinutes} min` : '--';
            document.getElementById('route-distance').innerText = distanceKm > 0 ? `${distanceKm} km` : '--';
        }
        
        document.getElementById('route-dest-name').innerText = trip.destination || "Destino no especificado";
    }

    updateRoutePanel(tripId) {
        const trip = this.activeTrips.find(t => String(t.id) === String(tripId));
        const loc = this.vehicleLocations[tripId];
        
        if (trip) {
            document.getElementById('route-driver-name').innerText = trip.profiles?.full_name || '--';
            document.getElementById('route-vehicle-info').innerText = 
                `ECO-${trip.vehicles?.economic_number || '?'} • ${trip.vehicles?.plate || '--'}`;
            
            const imgEl = document.getElementById('route-driver-img');
            if (imgEl) {
                imgEl.style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
            }
        }
        
        if (loc) {
            document.getElementById('route-speed').innerText = `${Math.round(loc.speed || 0)} km/h`;
        }
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        if (!list) return;

        if (this.activeTrips.length === 0) {
            list.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <span class="material-symbols-outlined text-4xl mb-2">route</span>
                    <p class="text-xs">Sin viajes activos</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.activeTrips.map(trip => {
            const loc = this.vehicleLocations[trip.id];
            const isFocused = this.focusedTripId === trip.id;
            const speed = Math.round(loc?.speed || 0);
            const statusText = {
                'in_progress': 'En ruta',
                'driver_accepted': 'Listo para salir',
                'approved_for_taller': 'En taller'
            }[trip.status] || trip.status;

            return `
            <div class="p-3 rounded-xl border ${isFocused ? 'border-primary bg-primary/10 shadow-lg' : 'border-[#324d67] bg-[#1c2127] hover:border-primary/50'} cursor-pointer mb-2 transition-all" 
                 onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-slate-800 bg-cover bg-center border border-[#324d67]" 
                         style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h4 class="text-white text-xs font-bold truncate">${trip.profiles?.full_name}</h4>
                            <span class="text-[8px] ${loc ? 'text-emerald-400' : 'text-slate-500'} font-mono">
                                ${speed} km/h
                            </span>
                        </div>
                        <div class="flex items-center gap-2 mt-0.5">
                            <p class="text-[9px] text-primary font-black">ECO-${trip.vehicles?.economic_number}</p>
                            <span class="text-[8px] text-[#92adc9]">${statusText}</span>
                        </div>
                        <p class="text-[8px] text-[#92adc9] truncate mt-1">📍 ${trip.destination?.substring(0, 30) || 'Sin destino'}</p>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    focusVehicle(id) {
        if (!this.map) return;
        this.focusedTripId = id;
        const loc = this.vehicleLocations[id];
        const coords = loc ? [loc.lat, loc.lng] : this.baseNaucalpan;
        
        this.map.flyTo(coords, 16, { duration: 1.5 });
        
        const viewAllBtn = document.getElementById('btn-view-all');
        if (viewAllBtn) viewAllBtn.classList.remove('hidden');
        
        // Mostrar panel de ruta
        const routePanel = document.getElementById('route-panel');
        routePanel.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        
        this.drawRouteAndCalculateETA(id);
        this.updateRoutePanel(id);
        this.renderSidebarList();
        
        // Destacar marcador
        this.updateMapMarkers();
    }

    viewAllVehicles() {
        if (!this.map) return;
        this.focusedTripId = null;
        
        // Limpiar línea de ruta
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
        if (this.destinationMarker) {
            this.map.removeLayer(this.destinationMarker);
            this.destinationMarker = null;
        }
        
        this.map.flyTo(this.baseCoords, this.baseZoom, { duration: 1.5 });
        
        const viewAllBtn = document.getElementById('btn-view-all');
        if (viewAllBtn) viewAllBtn.classList.add('hidden');
        
        // Ocultar panel de ruta
        const routePanel = document.getElementById('route-panel');
        routePanel.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
        
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    showRoutePanel(id) {
        const trip = this.activeTrips.find(t => String(t.id) === String(id));
        const panel = document.getElementById('route-panel');
        
        panel.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name || '--';
        document.getElementById('route-vehicle-info').innerText = 
            `ECO-${trip.vehicles?.economic_number || '?'} • ${trip.vehicles?.plate || '--'}`;
        
        const imgEl = document.getElementById('route-driver-img');
        if (imgEl) {
            imgEl.style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
        }
    }

    // Limpiar recursos al salir
    destroy() {
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
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
                    <div class="bg-primary/20 p-2 rounded-lg text-primary">
                        <span class="material-symbols-outlined">local_shipping</span>
                    </div>
                    <div>
                        <p class="text-[9px] font-bold text-[#92adc9] uppercase">Unidades Activas</p>
                        <p id="track-active-count" class="text-xl font-black text-white leading-none">0</p>
                    </div>
                </div>
            </div>

            <div class="absolute top-32 bottom-6 left-6 w-72 bg-[#111a22]/90 backdrop-blur-xl border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]/50">
                    <h3 class="font-bold text-white text-xs uppercase tracking-widest">Viajes Activos</h3>
                    <button id="btn-view-all" class="hidden bg-primary text-white text-[10px] font-black px-2 py-1 rounded uppercase shadow-lg shadow-primary/20 hover:bg-primary/80 transition-colors" 
                            onclick="window.trackingModule.viewAllVehicles()">
                        Ver Todo
                    </button>
                </div>
                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-3">
                    <div class="text-center py-8 text-slate-500">
                        <span class="material-symbols-outlined text-4xl mb-2">route</span>
                        <p class="text-xs">Cargando viajes activos...</p>
                    </div>
                </div>
            </div>

            <div id="route-panel" class="absolute bottom-6 right-6 w-80 bg-[#111a22]/95 backdrop-blur-xl border border-primary/40 rounded-2xl z-20 flex flex-col shadow-2xl pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                <div class="p-4 border-b border-[#324d67] flex items-center gap-3">
                    <div class="size-12 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary" id="route-driver-img"></div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-white text-sm truncate" id="route-driver-name">--</h4>
                        <p class="text-[9px] text-[#92adc9] font-bold uppercase tracking-tighter" id="route-vehicle-info">--</p>
                    </div>
                </div>
                <div class="p-5 space-y-4">
                    <div class="flex justify-between items-center">
                        <div class="flex flex-col flex-1 min-w-0">
                            <span class="text-[10px] text-slate-500 uppercase font-black">Destino</span>
                            <span id="route-dest-name" class="text-white text-xs font-bold truncate" title="--">--</span>
                        </div>
                        <span id="route-speed" class="text-emerald-400 font-mono font-black text-lg ml-2">0</span>
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
            .marker-container { 
                position: relative; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
            }
            .marker-dot { 
                width: 14px; 
                height: 14px; 
                background: #10b981; 
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 0 15px #10b981;
                transition: all 0.3s ease;
            }
            .marker-label { 
                background: #111a22; 
                border: 1px solid #324d67; 
                color: white; 
                font-size: 9px; 
                font-weight: 900; 
                padding: 2px 8px; 
                border-radius: 12px; 
                margin-bottom: 4px; 
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                letter-spacing: 0.5px;
            }
            .marker-speed {
                background: #1c2127;
                border: 1px solid #10b981;
                color: #10b981;
                font-size: 8px;
                font-weight: 900;
                padding: 1px 6px;
                border-radius: 10px;
                margin-top: 2px;
                white-space: nowrap;
                font-family: monospace;
            }
            .marker-focused .marker-dot { 
                background: #137fec; 
                width: 18px; 
                height: 18px; 
                box-shadow: 0 0 25px #137fec; 
                border-width: 3px; 
            }
            .marker-focused .marker-label { 
                background: #137fec; 
                font-size: 10px; 
                border-color: white;
                box-shadow: 0 0 15px #137fec;
            }
            .marker-focused .marker-speed {
                border-color: #137fec;
                color: #137fec;
            }
            .leaflet-popup-content {
                margin: 10px;
                min-width: 180px;
            }
            .dest-marker {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.2); }
                100% { opacity: 1; transform: scale(1); }
            }
        </style>
        `;
    }
}
