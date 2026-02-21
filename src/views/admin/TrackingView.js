import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.vehicleLocations = {}; 
        this.focusedTripId = null;
        this.routeLine = null; 
        this.routeMarkers = []; // NUEVO: Para manejar múltiples paradas
        this.realtimeChannel = null;
        this.updateInterval = null;

        // Configuración de vista inicial (Base Naucalpan - Guardia)
        this.baseCoords = [19.4326, -99.1332]; 
        this.baseZoom = 11;
        this.baseNaucalpan = [19.4785, -99.2396]; // Punto de salida y regreso

        window.trackingModule = this;
    }

    // --- SEGURIDAD: ESPERAR A QUE LEAFLET ESTÉ LISTO ---
    async waitForLeaflet() {
        return new Promise((resolve) => {
            if (window.L) return resolve();
            
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.L) { 
                    clearInterval(interval); 
                    resolve(); 
                } else if (attempts > 50) { 
                    clearInterval(interval);
                    console.error("❌ ERROR: La librería Leaflet no se cargó. Verifica el index.html.");
                    resolve(); 
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
        
        // Respaldo de actualización periódica
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
            
            const { data: locations, error } = await supabase
                .from('trip_locations')
                .select('*')
                .in('trip_id', tripIds)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            if (locations) {
                this.vehicleLocations = {};
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

    // ==================== MAGIA EN TIEMPO REAL (TIPO FACEBOOK) ====================
    setupRealtimeSubscription() {
        this.realtimeChannel = supabase
            .channel('tracking_realtime')
            // 1. Escuchar BROADCAST (GPS en tiempo real sin gastar base de datos)
            .on('broadcast', { event: 'location_update' }, payload => {
                this.handleIncomingLocation(payload.payload);
            })
            // 2. Escuchar TODO en la tabla trips (Insert y Updates)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'trips' },
                payload => {
                    this.handleTripChangeRealtime(payload);
                }
            )
            .subscribe((status) => {
                console.log('📡 Radar Realtime (Eventos + Broadcast):', status);
            });
    }

    // Esta función reacciona al instante cuando cambia algo en la base de datos
    async handleTripChangeRealtime(payload) {
        const tripData = payload.new || payload.old;
        if (!tripData) return;

        const validStatuses = ['in_progress', 'driver_accepted', 'approved_for_taller'];
        const isNowActive = validStatuses.includes(tripData.status);

        if (!isNowActive) {
            // El viaje terminó o se canceló: Lo quitamos al instante
            this.activeTrips = this.activeTrips.filter(t => String(t.id) !== String(tripData.id));
            if (this.map && this.markers[tripData.id]) {
                this.map.removeLayer(this.markers[tripData.id]);
                delete this.markers[tripData.id];
            }
            if (this.focusedTripId === tripData.id) this.viewAllVehicles();
            
        } else {
            // El viaje es nuevo o cambió su estado: Traemos su info completa (con conductor y unidad)
            const { data: fullTrip } = await supabase
                .from('trips')
                .select(`
                    id, status, destination, motivo, start_time, exit_km, request_details,
                    profiles:driver_id (id, full_name, photo_url),
                    vehicles:vehicle_id (economic_number, plate, model, current_km)
                `)
                .eq('id', tripData.id)
                .single();

            if (fullTrip) {
                const index = this.activeTrips.findIndex(t => String(t.id) === String(tripData.id));
                if (index >= 0) {
                    this.activeTrips[index] = fullTrip; // Actualiza sin recargar
                } else {
                    this.activeTrips.push(fullTrip); // Aparece un viaje nuevo mágicamente
                    this.showNotificationToast(`Nuevo viaje activo: ECO-${fullTrip.vehicles?.economic_number}`);
                }
            }
        }

        // Actualizamos la UI inmediatamente
        const activeCount = document.getElementById('track-active-count');
        if (activeCount) activeCount.innerText = this.activeTrips.length;
        
        this.renderSidebarList();
        if (this.map) this.updateMapMarkers();
        if (this.focusedTripId === tripData.id) this.drawRouteAndCalculateETA(tripData.id);
    }

    showNotificationToast(msg) {
        // Un pequeño feedback visual en el panel cuando salta algo nuevo
        const panel = document.createElement('div');
        panel.className = 'fixed top-24 right-6 bg-primary text-white text-xs font-bold px-4 py-3 rounded-lg shadow-2xl animate-fade-in-up z-50 flex items-center gap-2';
        panel.innerHTML = `<span class="material-symbols-outlined text-sm">notifications_active</span> ${msg}`;
        document.body.appendChild(panel);
        setTimeout(() => { panel.style.opacity = '0'; setTimeout(() => panel.remove(), 500); }, 4000);
    }

    setupPeriodicUpdate() {
        this.updateInterval = setInterval(() => {
            this.loadActiveTrips();
        }, 30000); // Se puede poner a 30s ya que el WebSocket hace el trabajo pesado
    }

    handleIncomingLocation(newLoc) {
        const tripExists = this.activeTrips.some(t => String(t.id) === String(newLoc.trip_id));
        if (!tripExists) return;

        this.vehicleLocations[newLoc.trip_id] = newLoc;
        if (this.map) this.updateSingleMarker(newLoc.trip_id);
        this.renderSidebarList();

        if (this.focusedTripId === newLoc.trip_id && this.map) {
            this.drawRouteAndCalculateETA(newLoc.trip_id);
            // Solo centra la cámara si el usuario no ha arrastrado el mapa manualmente
            this.map.panTo([newLoc.lat, newLoc.lng], { animate: true, duration: 1 });
            this.updateRoutePanel(newLoc.trip_id);
        }
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
            this.markers[tripId].setLatLng(coords);
            const popup = this.markers[tripId].getPopup();
            if (popup) popup.setContent(this.getMarkerPopupContent(trip, loc));
            
            if (isFocused) {
                this.markers[tripId].getElement()?.querySelector('.marker-container')?.classList.add('marker-focused');
                this.markers[tripId].getElement()?.querySelector('.marker-speed').innerText = `${Math.round(loc.speed || 0)} km/h`;
            }
        } else {
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
        this.activeTrips.forEach(trip => this.updateSingleMarker(trip.id));
    }

    // ==================== CÁLCULO DE MÚLTIPLES RUTAS Y TRAYECTOS ====================
    async drawRouteAndCalculateETA(tripId) {
        if (!this.map) return;
        const L = window.L;
        const trip = this.activeTrips.find(t => String(t.id) === String(tripId));
        const loc = this.vehicleLocations[tripId];

        // 1. Limpiar líneas y marcadores de parada anteriores
        if (this.routeLine) this.map.removeLayer(this.routeLine);
        if (this.routeMarkers.length > 0) {
            this.routeMarkers.forEach(m => this.map.removeLayer(m));
            this.routeMarkers = [];
        }

        if (!loc || !trip) return;

        const start = [loc.lat, loc.lng];
        let waypoints = [start];
        let stopsInfo = [];

        // 2. Extraer el plan de ruta dinámico del conductor
        if (trip.request_details?.route_plan && trip.request_details.route_plan.length > 0) {
            stopsInfo = trip.request_details.route_plan;
            stopsInfo.forEach(stop => waypoints.push([stop.lat, stop.lng]));
        } 
        // Fallback: Si no ha guardado un plan en el mapa, usar destino original
        else if (trip.request_details?.destination_coords) {
            const d = trip.request_details.destination_coords;
            waypoints.push([d.lat, d.lon]);
            stopsInfo.push({ lat: d.lat, lng: d.lon, name: trip.destination || 'Destino', type: 'stop' });
        }

        // 3. Trazar la Polyline conectando todos los puntos
        if (waypoints.length > 1) {
            this.routeLine = L.polyline(waypoints, {
                color: '#137fec', weight: 4, opacity: 0.6, dashArray: '10, 15'
            }).addTo(this.map);

            let totalDistanceMeters = 0;
            for (let i = 0; i < waypoints.length - 1; i++) {
                totalDistanceMeters += L.latLng(waypoints[i]).distanceTo(L.latLng(waypoints[i+1]));
            }

            // 4. Dibujar los pines de las paradas
            stopsInfo.forEach((stop, index) => {
                const isReturn = stop.type === 'return';
                const colorClass = isReturn ? 'bg-purple-500 shadow-[0_0_15px_purple]' : 'bg-red-500 shadow-[0_0_15px_red]';
                const iconHtml = `<div class="${colorClass} w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black">${index + 1}</div>`;
                
                const stopIcon = L.divIcon({ className: 'dest-marker', html: iconHtml, iconSize: [24, 24], iconAnchor: [12, 12] });
                const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(this.map);
                
                marker.bindTooltip(`<b>Parada ${index + 1}:</b><br>${stop.name}`, { direction: 'top', offset: [0, -10] });
                this.routeMarkers.push(marker);
            });

            // 5. Cálculos para el panel
            const distanceKm = (totalDistanceMeters / 1000).toFixed(1);
            const speed = loc.speed || 30;
            const timeHours = distanceKm / speed;
            const timeMinutes = Math.round(timeHours * 60);

            document.getElementById('route-speed').innerText = `${Math.round(speed)} km/h`;
            document.getElementById('route-eta').innerText = timeMinutes > 0 ? `~${timeMinutes} min` : '--';
            document.getElementById('route-distance').innerText = distanceKm > 0 ? `${distanceKm} km` : '--';
            
            // Si hay varias paradas, indicamos al administrador en qué plan está
            if (stopsInfo.length > 1) {
                const returnIncluded = stopsInfo.some(s => s.type === 'return');
                document.getElementById('route-dest-name').innerText = returnIncluded 
                    ? `Ruta Redonda (${stopsInfo.length} paradas)` 
                    : `Multi-Destino (${stopsInfo.length} paradas)`;
            } else {
                document.getElementById('route-dest-name').innerText = stopsInfo[0]?.name || "Destino";
            }
        } else {
            document.getElementById('route-dest-name').innerText = "Ruta no planeada aún";
        }
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
        if (loc) document.getElementById('route-speed').innerText = `${Math.round(loc.speed || 0)} km/h`;
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

            // Determinar si el conductor ya planeó su regreso
            const isReturning = trip.request_details?.is_returning;
            const returnBadge = isReturning ? `<span class="bg-purple-500/20 text-purple-400 text-[8px] px-1 rounded font-bold ml-1 border border-purple-500/30">RETORNO</span>` : '';

            return `
            <div class="p-3 rounded-xl border ${isFocused ? 'border-primary bg-primary/10 shadow-lg' : 'border-[#324d67] bg-[#1c2127] hover:border-primary/50'} cursor-pointer mb-2 transition-all" 
                 onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-slate-800 bg-cover bg-center border border-[#324d67]" 
                         style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h4 class="text-white text-xs font-bold truncate">${trip.profiles?.full_name}</h4>
                            <span class="text-[8px] ${loc ? 'text-emerald-400' : 'text-slate-500'} font-mono">${speed} km/h</span>
                        </div>
                        <div class="flex items-center mt-0.5">
                            <p class="text-[9px] text-primary font-black mr-2">ECO-${trip.vehicles?.economic_number}</p>
                            <span class="text-[8px] text-[#92adc9]">${statusText}</span>
                            ${returnBadge}
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
        
        // Refrescar UI (Bordes primarios en la lista)
        document.querySelectorAll('#tracking-list > div').forEach(el => {
            el.classList.remove('border-primary', 'bg-primary/10');
            el.classList.add('border-[#324d67]', 'bg-[#1c2127]');
        });
        
        const loc = this.vehicleLocations[id];
        const coords = loc ? [loc.lat, loc.lng] : this.baseNaucalpan;
        
        this.map.flyTo(coords, 15, { duration: 1.5 });
        
        document.getElementById('btn-view-all')?.classList.remove('hidden');
        document.getElementById('route-panel')?.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10');
        
        this.drawRouteAndCalculateETA(id);
        this.updateRoutePanel(id);
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    viewAllVehicles() {
        if (!this.map) return;
        this.focusedTripId = null;
        
        if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }
        if (this.routeMarkers.length > 0) { this.routeMarkers.forEach(m => this.map.removeLayer(m)); this.routeMarkers = []; }
        
        this.map.flyTo(this.baseCoords, this.baseZoom, { duration: 1.5 });
        
        document.getElementById('btn-view-all')?.classList.add('hidden');
        document.getElementById('route-panel')?.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10');
        
        this.renderSidebarList();
        this.updateMapMarkers();
    }

    destroy() {
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
        if (this.updateInterval) clearInterval(this.updateInterval);
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
                            <span class="text-[10px] text-slate-500 uppercase font-black">Plan de Ruta</span>
                            <span id="route-dest-name" class="text-white text-xs font-bold truncate" title="--">--</span>
                        </div>
                        <span id="route-speed" class="text-emerald-400 font-mono font-black text-lg ml-2">0</span>
                    </div>
                    <div class="grid grid-cols-2 gap-3 pt-2">
                        <div class="bg-[#1c2127] p-2 rounded-lg border border-[#324d67] text-center">
                            <span class="text-[9px] text-[#92adc9] uppercase block mb-0.5">Tiempo Restante</span>
                            <span id="route-eta" class="text-white font-bold text-xs font-mono">--</span>
                        </div>
                        <div class="bg-[#1c2127] p-2 rounded-lg border border-[#324d67] text-center">
                            <span class="text-[9px] text-[#92adc9] uppercase block mb-0.5">Dist. Faltante</span>
                            <span id="route-distance" class="text-white font-bold text-xs font-mono">--</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .marker-container { 
                position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
            }
            .marker-dot { 
                width: 14px; height: 14px; background: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 15px #10b981; transition: all 0.3s ease;
            }
            .marker-label { 
                background: #111a22; border: 1px solid #324d67; color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 12px; margin-bottom: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px;
            }
            .marker-speed {
                background: #1c2127; border: 1px solid #10b981; color: #10b981; font-size: 8px; font-weight: 900; padding: 1px 6px; border-radius: 10px; margin-top: 2px; white-space: nowrap; font-family: monospace;
            }
            .marker-focused .marker-dot { background: #137fec; width: 18px; height: 18px; box-shadow: 0 0 25px #137fec; border-width: 3px; }
            .marker-focused .marker-label { background: #137fec; font-size: 10px; border-color: white; box-shadow: 0 0 15px #137fec; }
            .marker-focused .marker-speed { border-color: #137fec; color: #137fec; }
            .leaflet-popup-content { margin: 10px; min-width: 180px; }
        </style>
        `;
    }
}
