import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.vehicleLocations = {}; // Aquí guardaremos los datos REALES del GPS
        
        // Enfoque individual
        this.focusedTripId = null;
        this.routeLine = null;
        this.destMarker = null;

        // Coordenadas base: CDMX y Estado de México (Zoom panorámico)
        this.baseCoords = [19.4326, -99.1332];
        this.baseZoom = 11;
        
        // Coordenadas Base Naucalpan (Punto de partida por defecto si no hay GPS aún)
        this.naucalpanBase = [19.4785, -99.2396];

        window.trackingModule = this;
    }

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
                    <p class="text-emerald-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2 drop-shadow-md mt-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Conexión Directa a Unidades
                    </p>
                </div>
                
                <div class="flex gap-4 pointer-events-auto">
                    <div class="bg-[#111a22]/80 backdrop-blur-md border border-[#324d67] rounded-xl p-3 flex items-center gap-4 shadow-lg">
                        <div class="bg-primary/20 p-2 rounded-lg text-primary"><span class="material-symbols-outlined">local_shipping</span></div>
                        <div>
                            <p class="text-[10px] font-bold text-[#92adc9] uppercase tracking-widest">En Ruta</p>
                            <p id="track-active-count" class="text-xl font-black text-white leading-none">0</p>
                        </div>
                    </div>
                    <div class="bg-[#111a22]/80 backdrop-blur-md border border-[#324d67] rounded-xl p-3 flex items-center gap-4 shadow-lg hidden sm:flex">
                        <div class="bg-orange-500/20 p-2 rounded-lg text-orange-500"><span class="material-symbols-outlined">speed</span></div>
                        <div>
                            <p class="text-[10px] font-bold text-[#92adc9] uppercase tracking-widest">Vel. Promedio</p>
                            <p id="track-avg-speed" class="text-xl font-black text-white leading-none">0 <span class="text-[10px] text-slate-400">km/h</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="absolute top-32 bottom-6 left-6 w-80 bg-[#111a22]/90 backdrop-blur-xl border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl overflow-hidden pointer-events-auto transition-all" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center">
                    <h3 class="font-bold text-white text-sm uppercase tracking-widest" id="sidebar-title">Flota Global</h3>
                    <button id="btn-view-all" class="hidden bg-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider transition-colors" onclick="window.trackingModule.viewAllVehicles()">
                        Ver Todos
                    </button>
                </div>
                
                <div class="p-3 border-b border-[#324d67]">
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-[#92adc9]"><span class="material-symbols-outlined text-[16px]">search</span></span>
                        <input type="text" class="w-full bg-[#1c2127] border border-[#324d67] text-white text-xs rounded-lg pl-9 py-2 outline-none focus:border-primary" placeholder="Buscar unidad o conductor...">
                    </div>
                </div>

                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <span class="material-symbols-outlined text-4xl mb-2 animate-spin">radar</span>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-center">Buscando señales GPS...</p>
                    </div>
                </div>
            </div>

            <div id="route-panel" class="absolute bottom-6 right-6 w-96 bg-[#111a22]/95 backdrop-blur-xl border border-primary/50 rounded-2xl z-20 flex flex-col shadow-[0_10px_40px_rgba(19,127,236,0.2)] pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                
                <div class="p-4 border-b border-[#324d67] flex justify-between items-start">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary" id="route-driver-img"></div>
                        <div>
                            <h4 class="font-black text-white text-sm" id="route-driver-name">Conductor</h4>
                            <p class="text-[10px] font-mono text-[#92adc9] uppercase tracking-widest" id="route-vehicle-info">ECO-00 • PLACAS</p>
                        </div>
                    </div>
                    <span class="bg-primary text-white text-[9px] font-bold px-2 py-1 rounded uppercase animate-pulse">GPS Activo</span>
                </div>

                <div class="p-5 space-y-5">
                    <div class="bg-[#1c2127] rounded-xl p-4 border border-[#324d67]">
                        <div class="flex justify-between items-center border-b border-[#324d67] pb-3 mb-3">
                            <span class="text-xs font-bold text-[#92adc9] uppercase tracking-widest">Velocidad Actual</span>
                            <span id="route-speed" class="text-2xl font-black text-emerald-400 font-mono">0 <span class="text-xs text-slate-500">km/h</span></span>
                        </div>
                        
                        <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                            <span>Estado de Conexión:</span>
                            <span id="route-status-text" class="text-emerald-400 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> En línea
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>

        <style>
            .custom-vehicle-marker { background: transparent; border: none; transition: all 0.5s ease; }
            .marker-container { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .marker-dot { width: 14px; height: 14px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #10b981; z-index: 2; position: relative;}
            .marker-label { background: #111a22; border: 1px solid #324d67; color: white; font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 4px; margin-bottom: 3px; text-align: center; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.4);}
            
            .marker-focused .marker-dot { background-color: #137fec; box-shadow: 0 0 20px #137fec; width: 18px; height: 18px; }
            .marker-focused .marker-label { background: #137fec; border-color: #137fec; font-size: 11px; padding: 3px 8px; }
            .marker-pulse { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; background-color: #137fec; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1;}

            .leaflet-container { background: #0d141c; font-family: 'Inter', sans-serif; }
            .leaflet-control-zoom a { background-color: #111a22 !important; color: #92adc9 !important; border-color: #324d67 !important; }
            .leaflet-control-zoom a:hover { background-color: #1c2127 !important; color: white !important; }
            .leaflet-control-attribution { display: none !important; }
        </style>
        `;
    }

    async onMount() {
        this.initMap();
        await this.loadActiveTrips();
        this.setupRealtimeSubscription();
    }

    initMap() {
        // Inicializar mostrando CDMX y EdoMex por defecto
        this.map = L.map('tracking-map', { zoomControl: false }).setView(this.baseCoords, this.baseZoom);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Mapa Base Oscuro especial para logística (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        // 1. Buscar viajes que estén en progreso
        const { data: trips, error } = await supabase
            .from('trips')
            .select(`
                id, status, driver_id, vehicle_id, 
                profiles (full_name, photo_url),
                vehicles (economic_number, plate, model)
            `)
            .in('status', ['in_progress', 'open', 'approved']);

        if (error) {
            console.error("Error cargando viajes:", error);
            return;
        }

        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        // 2. Extraer las posiciones GPS reales más recientes de los conductores
        if (this.activeTrips.length > 0) {
            const tripIds = this.activeTrips.map(t => t.id);
            
            const { data: locations } = await supabase
                .from('trip_locations')
                .select('*')
                .in('trip_id', tripIds)
                .order('created_at', { ascending: false });

            // Agrupar solo la última ubicación por viaje
            if (locations) {
                locations.forEach(loc => {
                    if (!this.vehicleLocations[loc.trip_id]) {
                        this.vehicleLocations[loc.trip_id] = loc;
                    }
                });
            }
        }

        this.renderSidebarList();
        this.updateMapMarkers();
        
        // Si hay viajes pero no hemos enfocado a ninguno, centrar el mapa general
        if (!this.focusedTripId) {
            this.viewAllVehicles();
        }
    }

    // --- SUSCRIPCIÓN EN TIEMPO REAL ---
    setupRealtimeSubscription() {
        if (!supabase) return;
        
        // Escuchar cuando el conductor reporta nueva coordenada en la tabla trip_locations
        this.subscriptionLocs = supabase
            .channel('realtime_locations')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, payload => {
                this.updateLiveLocation(payload.new);
            })
            .subscribe();
            
        // Escuchar si inician o terminan viajes
        this.subscriptionTrips = supabase
            .channel('realtime_trips')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, payload => {
                this.loadActiveTrips(); 
            })
            .subscribe();
    }

    updateLiveLocation(newLoc) {
        // Solo actualizar si el viaje está en nuestra lista de activos
        if (!this.activeTrips.find(t => t.id === newLoc.trip_id)) return;
        
        // Guardar la nueva posición real y velocidad
        this.vehicleLocations[newLoc.trip_id] = newLoc;
        
        // Refrescar UI
        this.renderSidebarList();
        this.updateMapMarkers();
        
        // Si tenemos a este vehículo enfocado, actualizamos su panel inferior
        if (this.focusedTripId === newLoc.trip_id) {
            document.getElementById('route-speed').innerHTML = `${newLoc.speed || 0} <span class="text-xs text-slate-500">km/h</span>`;
            
            // Hacer que la cámara lo siga suavemente en el mapa
            if (this.markers[newLoc.trip_id]) {
                this.map.panTo([newLoc.lat, newLoc.lng], { animate: true, duration: 1.0 });
            }
        }
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        
        if (this.activeTrips.length === 0) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center h-40 text-slate-500 opacity-50">
                    <span class="material-symbols-outlined text-4xl mb-2">location_off</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-center">Ninguna unidad<br>en ruta activa</p>
                </div>`;
            document.getElementById('track-avg-speed').innerHTML = `0 <span class="text-[10px] text-slate-400">km/h</span>`;
            return;
        }

        let avgSpeedSum = 0;
        let countWithSpeed = 0;

        list.innerHTML = this.activeTrips.map(trip => {
            const isFocused = this.focusedTripId === trip.id;
            const bgClass = isFocused ? 'bg-[#233648] border-primary shadow-[0_0_15px_rgba(19,127,236,0.2)]' : 'bg-[#1c2127] border-[#324d67] hover:border-[#456b8f]';
            
            // Leer datos reales
            const locData = this.vehicleLocations[trip.id];
            const speed = locData ? Math.round(locData.speed || 0) : 0;
            
            if (locData) {
                avgSpeedSum += speed;
                countWithSpeed++;
            }
            
            const isSpeeding = speed > 80; // Ejemplo: Alerta a más de 80km/h
            const speedColor = isSpeeding ? 'text-red-400' : speed > 0 ? 'text-emerald-400' : 'text-slate-500';
            const statusLabel = locData ? 'GPS OK' : 'Sin Señal';

            return `
            <div class="${bgClass} rounded-xl p-3 cursor-pointer transition-all duration-300" onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <div class="size-9 rounded-full bg-slate-700 bg-cover bg-center border border-[#324d67]" style="background-image: url('${trip.profiles?.photo_url || `https://ui-avatars.com/api/?name=${trip.profiles?.full_name}&background=137fec&color=fff`}')"></div>
                        <div>
                            <h4 class="font-bold text-white text-xs leading-none mb-1">${trip.profiles?.full_name || 'Desconocido'}</h4>
                            <span class="text-[9px] font-black uppercase text-primary tracking-widest">ECO-${trip.vehicles?.economic_number}</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center bg-[#111a22] p-2 rounded-lg border border-[#324d67]/50">
                    <span class="text-[10px] text-slate-400 font-mono">${trip.vehicles?.plate}</span>
                    <span class="text-[10px] font-bold ${speedColor} flex items-center gap-1">
                        ${isSpeeding ? '<span class="material-symbols-outlined text-[12px]">warning</span>' : ''} 
                        ${locData ? speed + ' km/h' : statusLabel}
                    </span>
                </div>
            </div>
            `;
        }).join('');

        // Actualizar promedio real
        const avg = countWithSpeed > 0 ? Math.round(avgSpeedSum / countWithSpeed) : 0;
        document.getElementById('track-avg-speed').innerHTML = `${avg} <span class="text-[10px] text-slate-400">km/h</span>`;
    }

    updateMapMarkers() {
        this.activeTrips.forEach(trip => {
            const locData = this.vehicleLocations[trip.id];
            const isFocused = this.focusedTripId === trip.id;

            // Si el vehículo aún no ha reportado GPS, lo ponemos en la Base por defecto
            const lat = locData ? locData.lat : this.naucalpanBase[0];
            const lng = locData ? locData.lng : this.naucalpanBase[1];

            if (this.markers[trip.id]) {
                // Actualizar posición real e icono fluidamente
                this.markers[trip.id].setLatLng([lat, lng]);
                this.markers[trip.id].setIcon(this.createMarkerIcon(trip, isFocused, locData));
                this.markers[trip.id].setZIndexOffset(isFocused ? 1000 : 0);
            } else {
                // Crear nuevo marcador
                const marker = L.marker([lat, lng], { 
                    icon: this.createMarkerIcon(trip, isFocused, locData),
                    zIndexOffset: isFocused ? 1000 : 0 
                }).addTo(this.map);
                
                marker.on('click', () => this.focusVehicle(trip.id));
                this.markers[trip.id] = marker;
            }
        });
    }

    createMarkerIcon(trip, isFocused, hasLocation) {
        // Color gris si no hay señal real, verde si hay señal, azul si está enfocado
        const dotColor = isFocused ? '#137fec' : hasLocation ? '#10b981' : '#64748b';
        
        return L.divIcon({
            className: 'custom-vehicle-marker',
            html: `
                <div class="marker-container ${isFocused ? 'marker-focused' : ''}">
                    <div class="marker-label">ECO-${trip.vehicles?.economic_number}</div>
                    ${isFocused ? '<div class="marker-pulse"></div>' : ''}
                    <div class="marker-dot" style="background-color: ${dotColor}; box-shadow: 0 0 10px ${dotColor};"></div>
                </div>
            `,
            iconSize: [60, 40],
            iconAnchor: [30, 40]
        });
    }

    // --- MODO FOCO (SEGUIMIENTO DE UNIDAD ÚNICA) ---
    focusVehicle(tripId) {
        this.focusedTripId = tripId;
        const trip = this.activeTrips.find(t => t.id === tripId);
        const locData = this.vehicleLocations[tripId];
        
        if (!trip) return;

        // Actualizar UI Botones
        document.getElementById('sidebar-title').innerText = "Ruta Específica";
        document.getElementById('btn-view-all').classList.remove('hidden');
        this.renderSidebarList(); // Para iluminar el seleccionado en la barra

        // Obtener Coordenadas para Volar la Cámara
        const lat = locData ? locData.lat : this.naucalpanBase[0];
        const lng = locData ? locData.lng : this.naucalpanBase[1];

        // Volar directo al vehículo
        this.map.flyTo([lat, lng], 16, { duration: 1.5 });

        // Pintar Panel Inferior
        this.showRoutePanel(trip, locData);
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        document.getElementById('sidebar-title').innerText = "Flota Global";
        document.getElementById('btn-view-all').classList.add('hidden');
        
        this.hideRoutePanel();
        this.renderSidebarList();

        // Ajustar zoom para ver CDMX / EdoMex completo o agrupar los que tengan señal
        const validLocs = Object.values(this.vehicleLocations);
        if (validLocs.length > 0) {
            const allCoords = validLocs.map(l => [l.lat, l.lng]);
            this.map.flyToBounds(L.latLngBounds(allCoords), { padding: [50, 50], maxZoom: 12, duration: 1.5 });
        } else {
            // Si no hay coords reales, mostrar mapa general de la ciudad
            this.map.flyTo(this.baseCoords, this.baseZoom, { duration: 1.5 });
        }
        
        this.updateMapMarkers(); // Quitar efecto 'focused'
    }

    showRoutePanel(trip, locData) {
        const panel = document.getElementById('route-panel');
        
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name || 'Conductor';
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        
        if (locData) {
            document.getElementById('route-speed').innerHTML = `${Math.round(locData.speed || 0)} <span class="text-xs text-slate-500">km/h</span>`;
            document.getElementById('route-status-text').innerHTML = `<span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> En línea`;
            document.getElementById('route-status-text').className = "text-emerald-400 flex items-center gap-1";
        } else {
            document.getElementById('route-speed').innerHTML = `0 <span class="text-xs text-slate-500">km/h</span>`;
            document.getElementById('route-status-text').innerHTML = `Esperando señal GPS...`;
            document.getElementById('route-status-text').className = "text-slate-500 flex items-center gap-1";
        }

        panel.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    }

    hideRoutePanel() {
        const panel = document.getElementById('route-panel');
        panel.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }
}
