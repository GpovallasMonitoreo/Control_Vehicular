import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; 
        this.activeTrips = [];
        this.simulationInterval = null;
        
        // Nuevas variables para el enfoque individual
        this.focusedTripId = null;
        this.routeLine = null;
        this.destMarker = null;
        this.tripDestinations = {}; // Guardará destinos simulados/reales

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
                        Control Logístico GPS
                    </h1>
                    <p class="text-emerald-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2 drop-shadow-md mt-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Radar Activo
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
                        <p class="text-[10px] font-bold uppercase tracking-widest text-center">Buscando señales...</p>
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
                    <span class="bg-primary text-white text-[9px] font-bold px-2 py-1 rounded uppercase animate-pulse">En Trayecto</span>
                </div>

                <div class="p-5 space-y-5">
                    <div class="relative border-l-2 border-[#324d67] ml-3 pl-4 space-y-4">
                        <div class="relative">
                            <span class="absolute -left-[23px] top-0.5 size-3 bg-white border-2 border-primary rounded-full"></span>
                            <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Origen</p>
                            <p class="text-xs text-white font-medium truncate">Base Naucalpan Centro</p>
                        </div>
                        <div class="relative">
                            <span class="absolute -left-[23px] top-0.5 size-3 bg-primary border-2 border-white rounded-full shadow-[0_0_10px_rgba(19,127,236,0.8)]"></span>
                            <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Destino</p>
                            <p class="text-xs text-white font-medium truncate" id="route-destination">Punto de Entrega Autorizado</p>
                        </div>
                    </div>

                    <div class="bg-[#1c2127] rounded-xl p-4 border border-[#324d67]">
                        <div class="flex justify-between items-end mb-2">
                            <div>
                                <p class="text-[9px] text-[#92adc9] uppercase font-bold tracking-widest">ETA (Llegada)</p>
                                <p class="text-xl font-black text-emerald-400 font-mono" id="route-eta">--:--</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] text-[#92adc9] uppercase font-bold tracking-widest">Faltan</p>
                                <p class="text-sm font-bold text-white font-mono" id="route-distance">-- km</p>
                            </div>
                        </div>
                        
                        <div class="relative w-full bg-[#111a22] h-2 rounded-full overflow-hidden border border-[#324d67]">
                            <div id="route-progress-bar" class="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full w-0 transition-all duration-1000"></div>
                        </div>
                        
                        <div class="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase">
                            <span id="route-speed" class="text-primary flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">speed</span> -- km/h</span>
                            <span id="route-status-text">En movimiento</span>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>

        <style>
            /* Leaflet Overrides para Dark Mode y Animaciones */
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

            /* Animación Línea de Ruta (Dashed moving) */
            .route-path-animated {
                stroke-dasharray: 10 15;
                animation: dash 20s linear infinite;
            }
            @keyframes dash { to { stroke-dashoffset: -1000; } }
        </style>
        `;
    }

    async onMount() {
        this.initMap();
        await this.loadActiveTrips();
    }

    initMap() {
        this.map = L.map('tracking-map', { zoomControl: false }).setView([19.4785, -99.2396], 13);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        // Obtenemos los viajes activos (Ajusta los status según tu DB)
        const { data: trips, error } = await supabase
            .from('trips')
            .select(`
                id, status, driver_id, vehicle_id, 
                profiles (full_name, photo_url),
                vehicles (economic_number, plate, model)
            `)
            .in('status', ['in_progress', 'open', 'approved']); // Estatus que indican que está fuera de base

        if (error) { console.error("Error cargando telemetría:", error); return; }

        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        // Generar coordenadas base y destinos para la sesión
        this.generateSimulatedCoordinates();

        this.renderSidebarList();
        this.updateMapMarkers();

        // Iniciar loop de movimiento
        if (this.activeTrips.length > 0 && !this.simulationInterval) {
            this.startSimulationLoop();
        }
    }

    generateSimulatedCoordinates() {
        const baseLat = 19.4785; // Naucalpan
        const baseLng = -99.2396;

        this.activeTrips.forEach((trip, index) => {
            if (!this.tripDestinations[trip.id]) {
                // Generar posición inicial dispersa
                const startLat = baseLat + ((Math.random() - 0.5) * 0.05);
                const startLng = baseLng + ((Math.random() - 0.5) * 0.05);
                
                // Generar un destino aleatorio (1 a 8 km de distancia)
                const destLat = startLat + ((Math.random() - 0.5) * 0.1);
                const destLng = startLng + ((Math.random() - 0.5) * 0.1);

                this.tripDestinations[trip.id] = {
                    current: [startLat, startLng],
                    dest: [destLat, destLng],
                    speed: Math.floor(Math.random() * (60 - 30 + 1)) + 30 // km/h
                };
            }
        });
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

        list.innerHTML = this.activeTrips.map(trip => {
            const isFocused = this.focusedTripId === trip.id;
            const bgClass = isFocused ? 'bg-[#233648] border-primary shadow-[0_0_15px_rgba(19,127,236,0.2)]' : 'bg-[#1c2127] border-[#324d67] hover:border-[#456b8f]';
            const data = this.tripDestinations[trip.id];
            
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
                    <span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">speed</span> ${data.speed} km/h
                    </span>
                </div>
            </div>
            `;
        }).join('');
    }

    updateMapMarkers() {
        this.activeTrips.forEach(trip => {
            const data = this.tripDestinations[trip.id];
            const isFocused = this.focusedTripId === trip.id;

            if (this.markers[trip.id]) {
                // Actualizar posición e icono si cambia de foco
                this.markers[trip.id].setLatLng(data.current);
                this.markers[trip.id].setIcon(this.createMarkerIcon(trip, isFocused));
                this.markers[trip.id].setZIndexOffset(isFocused ? 1000 : 0);
            } else {
                // Crear nuevo marcador
                const marker = L.marker(data.current, { 
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
        this.focusedTripId = tripId;
        const trip = this.activeTrips.find(t => t.id === tripId);
        const data = this.tripDestinations[tripId];
        
        if (!trip || !data) return;

        // Actualizar UI
        document.getElementById('sidebar-title').innerText = "Ruta Específica";
        document.getElementById('btn-view-all').classList.remove('hidden');
        this.renderSidebarList(); // Para iluminar el seleccionado

        // Limpiar mapa previo
        this.clearRouteGraphics();

        // Obtener coords
        const startPos = data.current;
        const endPos = data.dest;

        // Dibujar Polilínea de Ruta Simulada (Dashed Line)
        this.routeLine = L.polyline([startPos, endPos], {
            color: '#137fec', 
            weight: 4, 
            opacity: 0.8,
            className: 'route-path-animated'
        }).addTo(this.map);

        // Marcador del Destino (Bandera/Punto Rojo)
        const destIcon = L.divIcon({
            className: 'custom-dest-marker',
            html: `<div class="bg-red-500 rounded-full w-4 h-4 border-2 border-white shadow-[0_0_15px_red]"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        this.destMarker = L.marker(endPos, { icon: destIcon }).addTo(this.map);

        // Ajustar el mapa para que se vea toda la ruta
        const bounds = L.latLngBounds([startPos, endPos]);
        this.map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });

        // Pintar Panel Inferior
        this.showRoutePanel(trip, data);
    }

    viewAllVehicles() {
        this.focusedTripId = null;
        document.getElementById('sidebar-title').innerText = "Flota Global";
        document.getElementById('btn-view-all').classList.add('hidden');
        
        this.clearRouteGraphics();
        this.hideRoutePanel();
        this.renderSidebarList();

        // Ajustar zoom para ver todos (agrupando coordenadas)
        if(this.activeTrips.length > 0) {
            const allCoords = this.activeTrips.map(t => this.tripDestinations[t.id].current);
            this.map.flyToBounds(L.latLngBounds(allCoords), { padding: [50, 50], duration: 1.5 });
        } else {
            this.map.flyTo([19.4785, -99.2396], 13);
        }
        
        this.updateMapMarkers(); // Para quitar el efecto 'focused'
    }

    clearRouteGraphics() {
        if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }
        if (this.destMarker) { this.map.removeLayer(this.destMarker); this.destMarker = null; }
    }

    showRoutePanel(trip, data) {
        const panel = document.getElementById('route-panel');
        
        document.getElementById('route-driver-img').style.backgroundImage = `url('${trip.profiles?.photo_url || ''}')`;
        document.getElementById('route-driver-name').innerText = trip.profiles?.full_name || 'Conductor';
        document.getElementById('route-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} • ${trip.vehicles?.plate}`;
        document.getElementById('route-destination').innerText = `Punto de Entrega (Simulado)`;
        document.getElementById('route-speed').innerHTML = `<span class="material-symbols-outlined text-[12px]">speed</span> ${data.speed} km/h`;

        // Calcular ETA real basado en coordenadas Leaflet (Retorna Metros)
        this.updateETAAndProgress(data);

        panel.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    }

    hideRoutePanel() {
        const panel = document.getElementById('route-panel');
        panel.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }

    updateETAAndProgress(data) {
        if(!this.focusedTripId) return;

        // Leaflet nos da distancia en metros entre dos latlng
        const pos = L.latLng(data.current);
        const dest = L.latLng(data.dest);
        const distanceMeters = pos.distanceTo(dest);
        
        // Asignamos una distancia inicial ficticia para la barra de progreso (Solo visual)
        if(!data.initialDistance) data.initialDistance = distanceMeters + 1000; 

        // Cálculo ETA
        const distanceKm = (distanceMeters / 1000).toFixed(1);
        const speedKmh = data.speed || 40;
        
        let etaMinutes = 0;
        if (speedKmh > 0) {
            const timeHours = distanceKm / speedKmh;
            etaMinutes = Math.round(timeHours * 60);
        }

        // Formatear Hora de Llegada
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + etaMinutes);
        const timeString = arrivalTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        // Progreso %
        let progress = 100 - ((distanceMeters / data.initialDistance) * 100);
        if(progress < 0) progress = 0;
        if(progress > 100) progress = 100;

        document.getElementById('route-distance').innerText = `${distanceKm} km`;
        document.getElementById('route-eta').innerText = timeString;
        document.getElementById('route-progress-bar').style.width = `${progress}%`;
        
        // Si ya llegó (menos de 50 metros)
        if (distanceMeters < 50) {
            document.getElementById('route-status-text').innerText = "Llegando a destino";
            document.getElementById('route-status-text').classList.replace('text-slate-500', 'text-green-400');
        }
    }

    // --- LOOP DE SIMULACIÓN DE MOVIMIENTO REAL ---
    startSimulationLoop() {
        this.simulationInterval = setInterval(() => {
            this.activeTrips.forEach(trip => {
                const data = this.tripDestinations[trip.id];
                const [lat, lng] = data.current;
                const [dLat, dLng] = data.dest;
                
                // Mover hacia el destino gradualmente (Interpolación lineal básica)
                // Se mueve un 2% de la distancia restante en cada tick para simular manejo
                const newLat = lat + ((dLat - lat) * 0.02);
                const newLng = lng + ((dLng - lng) * 0.02);
                
                data.current = [newLat, newLng];
                
                // Actualizar marcador
                if(this.markers[trip.id]) {
                    this.markers[trip.id].setLatLng(data.current);
                }
            });

            // Si hay uno enfocado, actualizar su panel (ETA, Distancia, Línea)
            if (this.focusedTripId) {
                const fData = this.tripDestinations[this.focusedTripId];
                if(this.routeLine) {
                    this.routeLine.setLatLngs([fData.current, fData.dest]);
                }
                this.updateETAAndProgress(fData);
            }

        }, 3000); // Se actualiza cada 3 segundos
    }
}
