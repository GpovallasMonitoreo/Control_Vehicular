import { supabase } from '../../config/supabaseClient.js';

export class TrackingView {
    constructor() {
        this.map = null;
        this.markers = {}; // Guardará los pines del mapa
        this.activeTrips = [];
        this.simulationInterval = null;
        window.trackingModule = this;
    }

    render() {
        return `
        <div class="h-full w-full relative animate-fade-in flex flex-col rounded-2xl overflow-hidden border border-[#324d67] shadow-2xl">
            
            <div id="tracking-map" class="absolute inset-0 z-0 bg-[#0d141c]"></div>

            <div class="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0d141c]/90 to-transparent z-10 pointer-events-none"></div>
            
            <div class="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                <div class="pointer-events-auto">
                    <h1 class="text-white text-3xl font-black flex items-center gap-3 drop-shadow-md">
                        <span class="material-symbols-outlined text-primary text-4xl animate-pulse">satellite_alt</span>
                        Torre de Control GPS
                    </h1>
                    <p class="text-emerald-400 text-sm font-bold tracking-widest uppercase flex items-center gap-2 drop-shadow-md mt-1">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Transmisión en Vivo
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

            <div class="absolute top-32 bottom-6 left-6 w-80 bg-[#111a22]/80 backdrop-blur-md border border-[#324d67] rounded-2xl z-20 flex flex-col shadow-2xl overflow-hidden pointer-events-auto transform transition-transform" id="tracking-sidebar">
                <div class="p-4 border-b border-[#324d67] bg-[#151b23]/50 flex justify-between items-center">
                    <h3 class="font-bold text-white text-sm uppercase tracking-widest">Unidades Activas</h3>
                    <button class="text-slate-400 hover:text-white" onclick="window.trackingModule.loadActiveTrips()"><span class="material-symbols-outlined text-[18px]">refresh</span></button>
                </div>
                
                <div id="tracking-list" class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <span class="material-symbols-outlined text-4xl mb-2">radar</span>
                        <p class="text-xs font-bold uppercase tracking-widest">Escaneando señal...</p>
                    </div>
                </div>
            </div>
            
        </div>

        <style>
            /* Estilos para los marcadores personalizados del mapa */
            .custom-vehicle-marker { background: transparent; border: none; }
            .marker-container { position: relative; display: flex; flex-direction: column; items-center; justify-content: center; }
            .marker-dot { width: 16px; height: 16px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #10b981; margin: 0 auto; z-index: 2; position: relative;}
            .marker-pulse { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 16px; height: 16px; background-color: #10b981; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: 1;}
            .marker-label { background: #111a22; border: 1px solid #324d67; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; text-align: center; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.3);}
            
            /* Leaflet Overrides para Dark Mode */
            .leaflet-container { background: #0d141c; font-family: 'Inter', sans-serif; }
            .leaflet-control-zoom a { background-color: #111a22 !important; color: #92adc9 !important; border-color: #324d67 !important; }
            .leaflet-control-zoom a:hover { background-color: #1c2127 !important; color: white !important; }
            .leaflet-control-attribution { background: rgba(17, 26, 34, 0.7) !important; color: #64748b !important; }
        </style>
        `;
    }

    async onMount() {
        // Inicializar el mapa de Leaflet
        this.initMap();
        
        // Cargar datos de la BD
        await this.loadActiveTrips();

        // Suscribirse a cambios en tiempo real (si implementaste la telemetría)
        this.setupRealtimeSubscription();
    }

    initMap() {
        // Coordenadas iniciales: Naucalpan de Juárez (Ajusta si es necesario)
        this.map = L.map('tracking-map', {
            zoomControl: false // Quitamos el zoom por defecto para reubicarlo
        }).setView([19.4785, -99.2396], 13);

        // Agregamos control de zoom abajo a la derecha para que no estorbe con el header
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Mapa Base Oscuro especial para logística (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadActiveTrips() {
        // Buscar viajes que estén en progreso
        const { data: trips, error } = await supabase
            .from('trips')
            .select(`
                id, status, driver_id, vehicle_id, 
                profiles (full_name, photo_url),
                vehicles (economic_number, plate, model)
            `)
            .eq('status', 'in_progress'); // O 'open', según como lo manejes

        if (error) {
            console.error("Error cargando telemetría:", error);
            return;
        }

        this.activeTrips = trips || [];
        document.getElementById('track-active-count').innerText = this.activeTrips.length;

        // Renderizar lista en el panel lateral
        this.renderSidebarList();

        // Si hay viajes, pintar los pines en el mapa
        // (Nota: Como actualmente no tienes tabla de coordenadas, simularé posiciones 
        // alrededor de Naucalpan basadas en el ID del viaje para que veas la magia visual).
        this.updateMapMarkers();
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

        list.innerHTML = this.activeTrips.map((trip, index) => {
            // Velocidad simulada para la demo (en producción leerás de trip_locations)
            const speed = Math.floor(Math.random() * (60 - 20 + 1)) + 20; 
            avgSpeedSum += speed;
            
            // Simular un status de tráfico
            const isSpeeding = speed > 55;
            const speedColor = isSpeeding ? 'text-red-400' : 'text-emerald-400';

            return `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-3 hover:border-primary cursor-pointer transition-colors" onclick="window.trackingModule.focusVehicle('${trip.id}')">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <div class="size-8 rounded-full bg-slate-700 bg-cover bg-center border border-[#324d67]" style="background-image: url('${trip.profiles?.photo_url || `https://ui-avatars.com/api/?name=${trip.profiles?.full_name}&background=137fec&color=fff`}')"></div>
                        <div>
                            <h4 class="font-bold text-white text-xs leading-none">${trip.profiles?.full_name || 'Desconocido'}</h4>
                            <span class="text-[9px] text-[#92adc9] font-mono">ECO-${trip.vehicles?.economic_number}</span>
                        </div>
                    </div>
                    <span class="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Activo</span>
                </div>
                <div class="flex justify-between items-center bg-[#111a22] p-2 rounded-lg border border-[#324d67]/50 mt-2">
                    <span class="text-[10px] text-slate-400">${trip.vehicles?.plate} • ${trip.vehicles?.model}</span>
                    <span class="text-xs font-bold font-mono ${speedColor} flex items-center gap-1">
                        ${isSpeeding ? '<span class="material-symbols-outlined text-[12px]">warning</span>' : ''} ${speed} km/h
                    </span>
                </div>
            </div>
            `;
        }).join('');

        // Actualizar promedio
        const avg = Math.round(avgSpeedSum / this.activeTrips.length);
        document.getElementById('track-avg-speed').innerHTML = `${avg} <span class="text-[10px] text-slate-400">km/h</span>`;
    }

    updateMapMarkers() {
        // Base coordinate (Naucalpan)
        const baseLat = 19.4785;
        const baseLng = -99.2396;

        this.activeTrips.forEach((trip, index) => {
            // SIMULACIÓN: Desplazar coordenadas un poco para cada vehículo 
            // *En producción, aquí tomas lat/lng de tu base de datos*
            const offsetLat = baseLat + (Math.sin(index) * 0.03);
            const offsetLng = baseLng + (Math.cos(index) * 0.03);

            if (this.markers[trip.id]) {
                // Si el marcador ya existe, lo movemos con animación fluida
                this.markers[trip.id].setLatLng([offsetLat, offsetLng]);
            } else {
                // Crear el icono customizado en HTML
                const customIcon = L.divIcon({
                    className: 'custom-vehicle-marker',
                    html: `
                        <div class="marker-container">
                            <div class="marker-label">ECO-${trip.vehicles?.economic_number}</div>
                            <div class="marker-pulse"></div>
                            <div class="marker-dot"></div>
                        </div>
                    `,
                    iconSize: [60, 40],
                    iconAnchor: [30, 40] // Centrado abajo
                });

                // Crear marcador y guardarlo en el diccionario
                const marker = L.marker([offsetLat, offsetLng], { icon: customIcon }).addTo(this.map);
                
                // Popup al hacer clic en el pin
                marker.bindPopup(`
                    <div class="font-display">
                        <strong style="color:#111a22;">${trip.profiles?.full_name}</strong><br>
                        Unidad: ${trip.vehicles?.model} (${trip.vehicles?.plate})
                    </div>
                `);

                this.markers[trip.id] = marker;
            }
        });

        // Simular movimiento cada 5 segundos si hay unidades (Solo visual para la demo)
        if (this.activeTrips.length > 0 && !this.simulationInterval) {
            this.simulateMovement();
        }
    }

    focusVehicle(tripId) {
        const marker = this.markers[tripId];
        if (marker) {
            this.map.flyTo(marker.getLatLng(), 15, { duration: 1.5 });
            marker.openPopup();
        }
    }

    // Opcional: Escuchar en tiempo real a Supabase
    setupRealtimeSubscription() {
        if (!supabase) return;
        this.subscription = supabase
            .channel('public:trips')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, payload => {
                this.loadActiveTrips(); // Recargar si un chofer inicia o termina viaje
            })
            .subscribe();
    }

    // Efecto de simulación visual de movimiento (Puedes borrarlo cuando conectes GPS real)
    simulateMovement() {
        this.simulationInterval = setInterval(() => {
            Object.values(this.markers).forEach(marker => {
                const pos = marker.getLatLng();
                // Mover aleatoriamente una fracción pequeñísima
                const newLat = pos.lat + (Math.random() - 0.5) * 0.001;
                const newLng = pos.lng + (Math.random() - 0.5) * 0.001;
                marker.setLatLng([newLat, newLng]);
            });
            // Refrescar las velocidades falsas en la barra lateral
            this.renderSidebarList();
        }, 5000);
    }
}
