import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.tripLocations = {}; // Aquí guardaremos la lat/lng REAL de la base de datos
        
        // Variables para el enfoque individual
        this.focusedTripId = null;
        this.routeLine = null;
        this.destMarker = null;

        window.trackingModule = this;
    }

    render() {
        return `
        <div class="h-full w-full flex bg-[#0d141c] rounded-2xl overflow-hidden border border-[#324d67] shadow-2xl animate-fade-in">
            
            <div class="w-full md:w-96 bg-[#111a22] flex flex-col border-r border-[#324d67] z-20 shrink-0">
                
                <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                    <h1 class="text-white text-xl font-black flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary text-2xl animate-pulse">satellite_alt</span>
                        Torre de Control GPS
                    </h1>
                    <p class="text-emerald-400 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 mt-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Transmisión en Vivo
                    </p>
                </div>

                <div class="p-4 grid grid-cols-2 gap-3 border-b border-[#324d67]">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-3 flex flex-col justify-center">
                        <p class="text-[9px] font-bold text-[#92adc9] uppercase tracking-widest mb-1">En Ruta</p>
                        <p id="track-active-count" class="text-2xl font-black text-white leading-none">0</p>
                    </div>
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-3 flex flex-col justify-center">
                        <p class="text-[9px] font-bold text-[#92adc9] uppercase tracking-widest mb-1">Vel. Promedio</p>
                        <p id="track-avg-speed" class="text-2xl font-black text-emerald-400 leading-none">0 <span class="text-[10px] text-slate-400">km/h</span></p>
                    </div>
                </div>
                
                <div class="p-4 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]/50">
                    <h3 class="font-bold text-white text-xs uppercase tracking-widest" id="sidebar-title">Flota Global</h3>
                    <button id="btn-view-all" class="hidden bg-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider transition-colors" onclick="window.trackingModule.viewAllVehicles()">
                        Ver Todos
                    </button>
                </div>

                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <span class="material-symbols-outlined text-4xl mb-2 animate-spin">radar</span>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-center">Conectando a satélites...</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 relative">
                <div id="tracking-map" class="absolute inset-0 z-0 bg-[#0d141c]"></div>

                <div id="route-panel" class="absolute bottom-6 left-1/2 -translate-x-1/2 w-[400px] bg-[#111a22]/95 backdrop-blur-xl border border-primary/50 rounded-2xl z-20 flex flex-col shadow-[0_10px_40px_rgba(19,127,236,0.2)] transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-none">
                    
                    <div class="p-4 border-b border-[#324d67] flex justify-between items-start">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary" id="route-driver-img"></div>
                            <div>
                                <h4 class="font-black text-white text-sm" id="route-driver-name">Conductor</h4>
                                <p class="text-[10px] font-mono text-[#92adc9] uppercase tracking-widest" id="route-vehicle-info">ECO-00 • PLACAS</p>
                            </div>
                        </div>
                        <span class="bg-primary text-white text-[9px] font-bold px-2 py-1 rounded uppercase animate-pulse">Monitor Activo</span>
                    </div>

                    <div class="p-5 space-y-4">
                        <div class="bg-[#1c2127] rounded-xl p-4 border border-[#324d67]">
                            <div class="flex justify-between items-end mb-2">
                                <div>
                                    <p class="text-[9px] text-[#92adc9] uppercase font-bold tracking-widest">Coordenadas Actuales</p>
                                    <p class="text-xs font-black text-emerald-400 font-mono" id="route-coords">-- , --</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[9px] text-[#92adc9] uppercase font-bold tracking-widest">Última Actualización</p>
                                    <p class="text-xs font-bold text-white font-mono" id="route-time">Hace unos segundos</p>
                                </div>
                            </div>
                            
                            <div class="flex justify-between mt-4 text-[10px] font-bold text-slate-500 uppercase pt-3 border-t border-[#324d67]">
                                <span id="route-speed" class="text-primary flex items-center gap-1 text-sm"><span class="material-symbols-outlined text-[16px]">speed</span> -- km/h</span>
                                <span id="route-status-text" class="text-emerald-400 flex items-center gap-1"><span class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> GPS Transmitiendo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>

        <style>
            /* Leaflet Overrides para Dark Mode */
            .leaflet-container { background: #0d141c; font-family: 'Inter', sans-serif; }
            .leaflet-control-zoom a { background-color: #111a22 !important; color: #92adc9 !important; border-color: #324d67 !important; }
            .leaflet-control-zoom a:hover { background-color: #1c2127 !important; color: white !important; }
            .leaflet-control-attribution { display: none !important; }
            
            /* Marcador de Vehículo Normal */
            .custom-vehicle-marker { background: transparent; border: none; transition: all 0.3s ease; }
            .marker-container { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .marker-dot { width: 14px; height: 14px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #10b981; z-index: 2; position: relative;}
            .marker-label { background: #111a22; border: 1px solid #324d67; color: white; font-size: 9px; font-weight: bold; padding: 2px 5px; border-radius: 4px; margin-bottom: 3px; text-align: center; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.4);}
            
            /* Marcador de Vehículo Enfocado (Azul brillante) */
            .marker-focused .marker-dot { background-color: #137fec; box-shadow: 0 0 20px #137fec; width: 18px; height: 18px; }
            .marker-focused .marker-label { background: #137fec; border-color: #137fec; font-size: 11px; padding: 3px 8px; }
            .marker-pulse { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 24px; height: 24px; background-color: #137fec; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1;}
        </style>
        `;
    }

    async onMount() {
        this.initMap();
        await this.loadActiveTrips();
        this.setupRealtimeSubscription();
    }

    initMap() {
        // Coordenadas iniciales: Centro de la CDMX
        this.map = L.map('tracking-map', { zoomControl: false }).setView([19.4326, -99.1332], 11);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Mapa Oscuro (Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        // Obtenemos los viajes que el administrador/guardia hayan marcado como en ruta ('in_progress', 'open', etc)
        const { data: trips, error } = await supabase
            .from('trips')
            .select(`
                id, status, driver_id, vehicle_id, 
                profiles (full_name, photo_url),
                vehicles (economic_number, plate, model)
            `)
            .in('status', ['in_progress', 'open', 'approved']); 

        if (error) { console.error("Error cargando viajes:", error); return; }

        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        await this.loadRealLocations();
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    // NADA SIMULADO: Búsqueda de coordenadas reales enviadas por el conductor
    async loadRealLocations() {
        if (this.activeTrips.length === 0) return;
        
        const tripIds = this.activeTrips.map(t => t.id);

        // Suponiendo que la app del conductor guarda su GPS en 'trip_locations'
        // Extraemos solo el último registro (el más reciente) de cada viaje
        const { data, error } = await supabase
            .from('trip_locations')
            .select('*')
            .in('trip_id', tripIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error cargando coordenadas:", error);
            return;
        }

        // Filtramos para quedarnos solo con la ubicación más nueva de cada vehículo
        this.tripLocations = {};
        if (data) {
            data.forEach(loc => {
                if (!this.tripLocations[loc.trip_id]) {
                    this.tripLocations[loc.trip_id] = loc;
                }
            });
        }
    }

    // Suscripción REAL-TIME para mover el mapa en vivo
    setupRealtimeSubscription() {
        if (!supabase) return;
        
        this.subscription = supabase
            .channel('realtime_gps')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trip_locations' }, payload => {
                const newLoc = payload.new;
                
                // Si el viaje de esta coordenada está en nuestra lista de activos
                if (this.activeTrips.find(t => t.id === newLoc.trip_id)) {
                    // Actualizamos la memoria
                    this.tripLocations[newLoc.trip_id] = newLoc;
                    
                    // Re-renderizamos UI
                    this.updateMapMarkers();
                    this.renderSidebarList();
                    
                    // Si tenemos seleccionada esta unidad, actualizamos su panel inferior
                    if (this.focusedTripId === newLoc.trip_id) {
                        this.updateFocusedPanel(newLoc);
                    }
                }
            })
            .subscribe();
    }

    renderSidebarList() {
        const list = document.getElementById('tracking-list');
        
        if (this.activeTrips.length === 0) {
            list.innerHTML = `
                <div class="flex flex-col items-center justify-center h-40 text-slate-500 opacity-50">
                    <span class="material-symbols-outlined text-4xl mb-2">location_off</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest text-center">Ninguna unidad<br>en ruta activa</p>
                </div>`;
            return;
        }

        let avgSpeedSum = 0;
        let validSpeeds = 0;

        list.innerHTML = this.activeTrips.map(trip => {
            const locData = this.tripLocations[trip.id];
            const isFocused = this.focusedTripId === trip.id;
            const bgClass = isFocused ? 'bg-[#233648] border-primary shadow-[0_0_15px_rgba(19,127,236,0.2)]' : 'bg-[#1c2127] border-[#324d67] hover:border-[#456b8f]';
            
            // Si el conductor aún no manda datos GPS
            if (!locData) {
                return `
                <div class="${bgClass} rounded-xl p-3 cursor-pointer transition-all duration-300">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-3">
                            <div class="size-9 rounded-full bg-slate-700 bg-cover bg-center border border-[#324d67] grayscale" style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                            <div>
                                <h4 class="font-bold text-slate-400 text-xs leading-none mb-1">${trip.profiles?.full_name || 'Desconocido'}</h4>
                                <span class="text-[9px] font-black uppercase text-slate-500 tracking-widest">ECO-${trip.vehicles?.economic_number}</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-[#111a22] p-2 rounded-lg border border-[#324d67]/50 text-center">
                        <span class="text-[10px] font-bold text-orange-400 flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[12px]">satellite_alt</span> Esperando señal GPS...</span>
                    </div>
                </div>`;
            }

            // Datos reales del GPS
            const speed = locData.speed || 0;
            avgSpeedSum += speed;
            validSpeeds++;

            const isSpeeding = speed > 80;
            const speedColor = isSpeeding ? 'text-red-400' : 'text-emerald-400';

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
                    <span class="text-[10px] font-bold font-mono ${speedColor} flex items-center gap-1">
                        ${isSpeeding ? '<span class="material-symbols-outlined text-[12px]">warning</span>' : '<span class="material-symbols-outlined text-[12px]">speed</span>'} ${speed} km/h
                    </span>
                </div>
            </div>
            `;
        }).join('');

        // Actualizar promedio real
        const avg = validSpeeds > 0 ? Math.round(avgSpeedSum / validSpeeds) : 0;
        document.getElementById('track-avg-speed').innerHTML = `${avg} <span class="text-[10px] text-slate-400">km/h</span>`;
    }

    updateMapMarkers() {
        this.activeTrips.forEach(trip => {
            const locData = this.tripLocations[trip.id];
            if (!locData) return; // Si no hay GPS, no dibujamos punto

            const isFocused = this.focusedTripId === trip.id;
            const currentPos = [locData.lat, locData.lng];

            if (this.markers[trip.id]) {
                // El marcador ya existe, lo actualizamos fluidamente
                this.markers[trip.id].setLatLng(currentPos);
                this.markers[trip.id].setIcon(this.createMarkerIcon(trip, isFocused));
                this.markers[trip.id].setZIndexOffset(isFocused ? 1000 : 0);
            } else {
                // Nuevo marcador
                const marker = L.marker(currentPos, { 
                    icon: this.createMarkerIcon(trip, isFocused),
                    zIndexOffset: isFocused ? 1000 : 0 
                }).addTo(this.map);
                
                marker.on('click', () => this.focusVehicle(trip.id));
                this.markers[trip.id] = marker;
            }
        });
    }

    createMarkerIcon(trip, isFocused) {
        return L.divIcon({
            className: 'custom-vehicle-marker',
            html: `
                <div class="marker-container ${isFocused ? 'marker-focused' : ''}">
                    <div class="marker-label">ECO-${trip.vehicles?.economic_number}</div>
                    ${isFocused ? '<div class="marker-pulse"></div>' : ''}
                    <div class="marker-dot"></div>
                </div>
            `,
            iconSize: [60, 40],
            iconAnchor: [30, 40]
        });
    }

    // --- MODO FOCO (SELECCIÓN DE UNIDAD) ---
    focusVehicle(tripId) {
        const locData = this.tripLocations[tripId];
        if (!locData) {
            alert("Este conductor aún no ha transmitido señal GPS.");
            return;
        }

        this.focusedTripId = tripId;
        const trip = this.activeTrips.find(t => t.id === tripId);
        
        // UI Sidebar
        document.getElementById('sidebar-title').innerText = "Ruta Específica";
        document.getElementById('btn-view-all').classList.remove('hidden');
        this.renderSidebarList(); // Para iluminar el conductor en la lista

        // Mover cámara a la posición real del vehículo con un buen nivel de zoom
        this.map.flyTo([locData.lat, locData.lng], 16, { duration: 1.5 });

        // Pintar Panel Flotante Inferior
        const panel = document.getElementById('route-panel');
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name || 'Conductor';
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        
        this.updateFocusedPanel(locData);

        panel.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    }

    // Actualiza los textos del panel del coche enfocado
    updateFocusedPanel(locData) {
        document.getElementById('route-coords').innerText = `${locData.lat.toFixed(5)}, ${locData.lng.toFixed(5)}`;
        document.getElementById('route-speed').innerHTML = `<span class="material-symbols-outlined text-[16px]">speed</span> ${locData.speed || 0} km/h`;
        
        // Calcular tiempo relativo desde que mandó la última señal
        const now = new Date();
        const locTime = new Date(locData.created_at);
        const diffSeconds = Math.floor((now - locTime) / 1000);
        
        let timeString = "Hace unos segundos";
        if(diffSeconds > 60) timeString = `Hace ${Math.floor(diffSeconds/60)} minutos`;
        
        document.getElementById('route-time').innerText = timeString;

        // Si la señal es muy vieja, poner en rojo
        if(diffSeconds > 300) { // más de 5 minutos
            document.getElementById('route-status-text').innerHTML = `<span class="material-symbols-outlined text-[12px]">signal_disconnected</span> Sin señal reciente`;
            document.getElementById('route-status-text').classList.replace('text-emerald-400', 'text-red-400');
        } else {
            document.getElementById('route-status-text').innerHTML = `<span class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> Transmitiendo en vivo`;
            document.getElementById('route-status-text').classList.replace('text-red-400', 'text-emerald-400');
        }
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        document.getElementById('sidebar-title').innerText = "Flota Global";
        document.getElementById('btn-view-all').classList.add('hidden');
        
        // Ocultar panel de detalle
        const panel = document.getElementById('route-panel');
        panel.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
        
        this.renderSidebarList();

        // Ajustar zoom a CDMX General o agrupar todos los pines si los hay
        const validCoords = Object.values(this.tripLocations).map(loc => [loc.lat, loc.lng]);
        
        if(validCoords.length > 0) {
            this.map.flyToBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 14, duration: 1.5 });
        } else {
            this.map.flyTo([19.4326, -99.1332], 11);
        }
        
        this.updateMapMarkers(); // Quitar efecto visual azul
    }
}
