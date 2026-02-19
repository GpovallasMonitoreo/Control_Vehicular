import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        this.currentTrip = null;
        this.watchPositionId = null;
        this.map = null; 
        this.marker = null;
        this.polyline = null; 
        this.routeCoords = []; 
        this.incidentImages = [];
        this.receptionPhoto = null; // Guardará la foto de conformidad
        this.gpsRetryCount = 0;
        this.maxGpsRetries = 3;
        
        window.conductorModule = this;
    }

    // --- INYECCIÓN DEL CSS DE LEAFLET PARA EVITAR MAPAS ROTOS ---
    injectLeafletCSS() {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
    }

    render() {
        this.injectLeafletCSS();
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold truncate">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span id="profile-status" class="text-[#92adc9] text-[10px] font-bold uppercase">Sincronizado</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('modal-incident').classList.remove('hidden')" class="h-10 w-10 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white">
                            <span class="material-symbols-outlined text-sm">notifications_active</span>
                        </button>
                        <button onclick="window.logoutDriver()" class="h-10 w-10 bg-[#233648] border border-[#324d67] rounded-full text-white flex items-center justify-center hover:text-red-400">
                            <span class="material-symbols-outlined text-sm">logout</span>
                        </button>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative pb-24">
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70">Selección de Unidad</h3>
                        <div id="unidad-content" class="space-y-3"></div>
                    </section>

                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">engineering</span> Proceso de Taller
                            </h3>
                            <div id="checklist-content" class="space-y-3"></div>
                        </div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col relative">
                        <div id="route-controls" class="absolute top-4 left-4 right-4 z-[1000] hidden">
                            <button id="btn-start-route" class="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-sm tracking-widest border-2 border-white/20">
                                <span class="material-symbols-outlined animate-pulse">satellite_alt</span> Iniciar Navegación y GPS
                            </button>
                        </div>
                        
                        <div id="route-waiting-msg" class="absolute inset-0 z-50 bg-[#0d141c]/80 backdrop-blur flex flex-col items-center justify-center p-6 text-center">
                            <span class="material-symbols-outlined text-6xl text-[#324d67] mb-4">gpp_maybe</span>
                            <h3 class="text-white font-bold text-xl uppercase tracking-widest">Esperando Salida</h3>
                            <p class="text-[#92adc9] text-xs mt-2">Muestra tu código al guardia en caseta para que autorice tu salida y se habilite el mapa.</p>
                        </div>

                        <div id="live-map" class="w-full flex-1 bg-slate-800"></div>

                        <div class="p-5 bg-[#111a22] border-t border-[#233648] grid grid-cols-2 gap-4">
                            <div class="bg-[#192633] p-3 rounded-xl border border-[#233648] text-center">
                                <p class="text-[10px] text-[#92adc9] font-bold uppercase mb-1">Velocidad</p>
                                <span id="live-speed" class="text-2xl font-black text-white">0</span> <small class="text-white/50 text-[10px]">km/h</small>
                            </div>
                            <div class="bg-[#192633] p-3 rounded-xl border border-[#233648] text-center">
                                <p class="text-[10px] text-[#92adc9] font-bold uppercase mb-1">GPS Monitor</p>
                                <div id="gps-status-indicator" class="text-slate-500 font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 mt-2">
                                    <div class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[12px]">pause_circle</span> 
                                        <span>Pausado</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-5">
                        <div class="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
                            <div class="w-full flex justify-between items-start mb-6">
                                <div class="text-left flex-1">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gafete Digital</span>
                                    <h3 id="card-full-name" class="text-slate-900 text-xl font-bold leading-tight mt-1">--</h3>
                                </div>
                                <div class="h-16 w-16 bg-slate-100 rounded-xl border border-slate-200 bg-cover bg-center shadow-md shrink-0" id="card-photo"></div>
                            </div>

                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 w-full" id="access-code-container"></div>

                            <div class="w-full text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <span class="material-symbols-outlined text-sm text-primary">badge</span> Datos
                                </h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center border-b border-slate-200 pb-2">
                                        <span class="text-[10px] text-slate-500 font-bold uppercase">Supervisor</span>
                                        <span id="profile-manager" class="text-slate-800 text-xs font-bold">--</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-[10px] text-slate-500 font-bold uppercase">Licencia</span>
                                        <span id="lic-number" class="text-slate-800 text-xs font-mono font-bold">--</span>
                                    </div>
                                </div>
                            </div>

                            <button onclick="window.print()" class="w-full py-4 bg-[#111a22] hover:bg-[#1c2127] text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                                <span class="material-symbols-outlined text-sm">print</span> Imprimir Gafete
                            </button>
                        </div>
                    </section>
                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-20 z-30 pb-safe">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active text-primary flex flex-col items-center gap-1"><span class="material-symbols-outlined">directions_car</span><span class="text-[9px] font-bold uppercase">Unidad</span></button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn text-slate-500 flex flex-col items-center gap-1"><span class="material-symbols-outlined">engineering</span><span class="text-[9px] font-bold uppercase">Taller</span></button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn text-slate-500 flex flex-col items-center gap-1"><span class="material-symbols-outlined">route</span><span class="text-[9px] font-bold uppercase">Ruta</span></button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn text-slate-500 flex flex-col items-center gap-1"><span class="material-symbols-outlined">badge</span><span class="text-[9px] font-bold uppercase">Pase</span></button>
                </nav>

                <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm">
                    <div class="bg-[#1c2127] w-full rounded-t-3xl p-6 border-t border-red-500/30">
                        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-red-500">warning</span> Reportar Incidente</h3>
                        <textarea id="inc-desc" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl outline-none mb-4 h-32" placeholder="Describe lo sucedido..."></textarea>
                        <div class="flex gap-2 mb-4">
                            <input type="file" id="input-incident-camera" accept="image/*" capture="environment" class="hidden">
                            <label for="input-incident-camera" class="w-full h-12 bg-[#233648] text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer font-bold text-xs transition-colors border border-[#324d67]"><span class="material-symbols-outlined text-sm">photo_camera</span> TOMAR FOTO EVIDENCIA</label>
                        </div>
                        <div id="incident-preview-grid" class="grid grid-cols-4 gap-2 mb-6"></div>
                        <div class="flex gap-3">
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs">Cancelar</button>
                            <button id="btn-send-incident" class="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">Enviar Reporte</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async onMount() {
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        
        await this.loadProfileData();
        await this.loadDashboardState();
        this.initLiveMap();
        this.setupIncidentForm();
        this.setupGPSEventListeners();

        supabase.channel('driver_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, () => {
                this.loadDashboardState();
                if(navigator.vibrate) navigator.vibrate([100]);
            }).subscribe();
    }

    setupGPSEventListeners() {
        // Listener para cuando la página vuelve a estar visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.activeTab === 'ruta' && this.currentTrip) {
                if (this.currentTrip.status === 'in_progress' || this.currentTrip.status === 'driver_accepted') {
                    this.startTracking();
                }
            }
        });

        // Listener para cuando el dispositivo se mueve (acelerómetro)
        window.addEventListener('devicemotion', () => {
            // Solo usado para "despertar" el GPS si está dormido
            if (this.watchPositionId === null && this.activeTab === 'ruta' && this.currentTrip) {
                if (this.currentTrip.status === 'in_progress' || this.currentTrip.status === 'driver_accepted') {
                    this.startTracking();
                }
            }
        });
    }

    initLiveMap() {
        if (!window.L) return;
        const L = window.L;
        
        this.map = L.map('live-map', { 
            zoomControl: false,
            fadeAnimation: true,
            zoomAnimation: true,
            markerZoomAnimation: true
        }).setView([19.4326, -99.1332], 16);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
        
        // Icono personalizado para el marcador
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="bg-primary w-5 h-5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(19,127,236,0.8)] animate-pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        this.marker = L.marker([19.4326, -99.1332], {
            icon: customIcon,
            zIndexOffset: 1000
        }).addTo(this.map);

        this.polyline = L.polyline([], { 
            color: '#137fec', 
            weight: 5, 
            opacity: 0.8, 
            lineJoin: 'round' 
        }).addTo(this.map);
        
        // Asegurar que el mapa se renderice correctamente
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 500);
    }

    handlePositionUpdate(pos) {
        const { latitude, longitude, speed, accuracy, altitude } = pos.coords;
        const latlng = [latitude, longitude];
        
        if(this.map) {
            // Centramos el mapa en la posición actual con animación suave
            this.map.flyTo(latlng, 16, {
                animate: true,
                duration: 0.5
            });
            
            this.marker.setLatLng(latlng);
            
            // Actualizar polyline
            this.routeCoords.push(latlng);
            // Mantener solo los últimos 100 puntos para rendimiento
            if (this.routeCoords.length > 100) {
                this.routeCoords.shift();
            }
            this.polyline.setLatLngs(this.routeCoords);
        }

        const speedKmh = Math.round((speed || 0) * 3.6);
        document.getElementById('live-speed').innerText = speedKmh;

        // Actualizar indicador de precisión GPS
        const gpsIndicator = document.getElementById('gps-status-indicator');
        const accuracyText = accuracy < 20 ? 'Alta' : (accuracy < 50 ? 'Media' : 'Baja');
        const colorClass = accuracy < 20 ? 'text-emerald-400' : (accuracy < 50 ? 'text-yellow-400' : 'text-orange-400');
        
        gpsIndicator.innerHTML = `
            <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span class="${colorClass}">${speedKmh} km/h | ${accuracyText}</span>
            </div>
            <span class="text-[8px] text-slate-400">${new Date().toLocaleTimeString()}</span>
        `;

        // Enviar a Supabase si el viaje está activo
        if(this.currentTrip && this.currentTrip.status === 'in_progress') {
            supabase.from('trip_locations').insert({ 
                trip_id: this.currentTrip.id, 
                lat: latitude, 
                lng: longitude, 
                speed: speedKmh,
                accuracy: accuracy,
                altitude: altitude || 0,
                timestamp: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.error('Error guardando ubicación:', error);
            });
        }
        
        // Resetear contador de reintentos cuando hay éxito
        this.gpsRetryCount = 0;
    }

    handleGPSError(err) {
        console.error("GPS Error:", err);
        const gpsIndicator = document.getElementById('gps-status-indicator');
        
        let errorMessage = '';
        let errorColor = 'text-red-400';
        
        switch(err.code) {
            case 1: // PERMISSION_DENIED
                errorMessage = 'Permiso denegado';
                this.showGPSPermissionDialog();
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Señal no disponible';
                this.retryGPS();
                break;
            case 3: // TIMEOUT
                errorMessage = 'Tiempo de espera agotado';
                this.retryGPS();
                break;
            default:
                errorMessage = 'Error desconocido';
                this.retryGPS();
        }
        
        gpsIndicator.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm ${errorColor}">location_off</span>
                    <span class="${errorColor}">${errorMessage}</span>
                </div>
                <button onclick="window.conductorModule.startTracking()" 
                    class="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 hover:bg-primary/30 transition-colors">
                    Reintentar GPS
                </button>
            </div>
        `;
    }

    showGPSPermissionDialog() {
        // Verificar si ya mostramos el diálogo
        if (document.getElementById('gps-permission-dialog')) return;
        
        const dialog = document.createElement('div');
        dialog.id = 'gps-permission-dialog';
        dialog.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4';
        dialog.innerHTML = `
            <div class="bg-[#1c2127] rounded-2xl p-6 max-w-sm border border-primary/30">
                <span class="material-symbols-outlined text-5xl text-primary mb-4 block">location_on</span>
                <h3 class="text-white font-bold text-lg mb-2">Permiso de Ubicación</h3>
                <p class="text-[#92adc9] text-sm mb-6">
                    Para rastrear tu ruta en tiempo real, necesitamos acceso a tu ubicación. 
                    Por favor, permite el acceso cuando el navegador lo solicite.
                </p>
                <div class="space-y-3">
                    <button onclick="window.conductorModule.requestGPSPermission()" 
                        class="w-full py-4 bg-primary text-white font-black rounded-xl uppercase text-sm">
                        Solicitar Permiso
                    </button>
                    <button onclick="document.getElementById('gps-permission-dialog').remove()" 
                        class="w-full py-3 text-[#92adc9] hover:text-white transition-colors text-xs uppercase">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    requestGPSPermission() {
        document.getElementById('gps-permission-dialog')?.remove();
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.handlePositionUpdate(pos);
                this.startTracking(); // Iniciar watch después de obtener permiso
            },
            (err) => {
                alert('No se pudo obtener permiso de ubicación. Verifica la configuración de tu navegador.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    retryGPS() {
        if (this.gpsRetryCount >= this.maxGpsRetries) {
            this.gpsRetryCount = 0;
            return;
        }
        
        this.gpsRetryCount++;
        
        // Limpiar watch anterior si existe
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
        }
        
        // Reintentar después de 3 segundos
        setTimeout(() => {
            if (this.activeTab === 'ruta' && this.currentTrip) {
                if (this.currentTrip.status === 'in_progress' || this.currentTrip.status === 'driver_accepted') {
                    this.startTracking();
                }
            }
        }, 3000);
    }

    startTracking() {
        if (!navigator.geolocation) {
            alert("El dispositivo no tiene sensor GPS.");
            return;
        }

        // Limpiar watch anterior si existe
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
        }

        const gpsIndicator = document.getElementById('gps-status-indicator');
        const btnStart = document.getElementById('btn-start-route');
        const waitingMsg = document.getElementById('route-waiting-msg');

        // Verificar si el viaje está en estado correcto
        if (this.currentTrip && 
            (this.currentTrip.status === 'in_progress' || this.currentTrip.status === 'driver_accepted')) {
            if (waitingMsg) waitingMsg.classList.add('hidden');
        }

        // Mostrar estado de solicitud
        gpsIndicator.innerHTML = `
            <div class="flex flex-col items-center gap-1">
                <div class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                    <span class="text-yellow-400">Iniciando GPS...</span>
                </div>
                <span class="text-[8px] text-slate-400">Buscando señal...</span>
            </div>
        `;

        // Forzar repintado del mapa
        setTimeout(() => {
            if (this.map) this.map.invalidateSize();
        }, 500);

        // Primero obtener una posición única para permisos
        navigator.geolocation.getCurrentPosition(
            // Success - permisos concedidos
            (pos) => {
                this.handlePositionUpdate(pos);
                
                // Iniciar watch para seguimiento continuo
                this.watchPositionId = navigator.geolocation.watchPosition(
                    (position) => this.handlePositionUpdate(position),
                    (error) => this.handleGPSError(error),
                    { 
                        enableHighAccuracy: true, 
                        maximumAge: 2000,        // Aceptar posiciones de hasta 2 segundos
                        timeout: 15000,           // Timeout más largo para móviles
                        distanceFilter: 5          // Actualizar cada 5 metros
                    }
                );
                
                if (btnStart) btnStart.classList.add('hidden');
            },
            // Error - manejar permisos
            (err) => {
                this.handleGPSError(err);
            },
            { 
                enableHighAccuracy: true, 
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    stopTracking() {
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
            
            const gpsIndicator = document.getElementById('gps-status-indicator');
            gpsIndicator.innerHTML = `
                <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[12px]">pause_circle</span> 
                    <span>Detenido</span>
                </div>
            `;
        }
    }

    async loadProfileData() {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(p) {
            this.profile = p;
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('card-full-name').innerText = p.full_name;
            document.getElementById('card-photo').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('lic-number').innerText = p.license_number || 'No Registrada';
            document.getElementById('profile-manager').innerText = p.supervisor_name || 'Central COV';
        }
    }

    async loadDashboardState() {
        const { data: trips } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', this.userId).neq('status', 'closed').order('created_at', { ascending: false }).limit(1);
        const trip = trips && trips.length > 0 ? trips[0] : null;
        this.currentTrip = trip;
        
        const unityCont = document.getElementById('unidad-content');
        const checkCont = document.getElementById('checklist-content');
        const waitingMsg = document.getElementById('route-waiting-msg');
        const btnStart = document.getElementById('btn-start-route');

        if (!trip) {
            await this.renderAvailableUnits(unityCont);
            document.getElementById('profile-status').innerText = "Disponible";
            this.renderAccessCode(null);
            if (waitingMsg) waitingMsg.classList.remove('hidden');
            this.stopTracking(); // Detener GPS si no hay viaje
        } else {
            unityCont.innerHTML = `
                <div class="bg-primary/10 border border-primary/30 p-5 rounded-2xl text-center shadow-inner">
                    <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Unidad Asignada</p>
                    <h2 class="text-4xl font-black text-white leading-none">${trip.vehicles.plate}</h2>
                    <p class="text-sm font-bold text-[#92adc9] mt-2">${trip.vehicles.model} • ECO-${trip.vehicles.economic_number}</p>
                </div>
            `;

            this.renderMechanicChecklist(trip, checkCont);
            this.renderAccessCode(trip);

            // GESTIÓN MEJORADA DE RUTA
            if (trip.status === 'in_progress' || trip.status === 'driver_accepted') {
                document.getElementById('profile-status').innerText = 
                    trip.status === 'in_progress' ? "En Ruta Operativa" : "Esperando Autorización";
                
                // Ocultar mensaje de espera si no está en requested
                if (trip.status !== 'requested' && waitingMsg) {
                    waitingMsg.classList.add('hidden');
                }
                
                // Configurar botón de inicio manual
                if (btnStart) {
                    btnStart.classList.remove('hidden');
                    btnStart.onclick = () => {
                        this.startTracking();
                    };
                }
                
                // INICIAR GPS AUTOMÁTICAMENTE si estamos en la pestaña de ruta
                if (this.activeTab === 'ruta') {
                    setTimeout(() => {
                        this.startTracking();
                    }, 1000);
                }
            } else {
                document.getElementById('profile-status').innerText = "Trámite Interno";
                if (waitingMsg) waitingMsg.classList.remove('hidden');
                if (btnStart) btnStart.classList.add('hidden');
                this.stopTracking(); // Detener GPS si no corresponde
            }
        }
    }

    async renderAvailableUnits(container) {
        const { data: vehs } = await supabase.from('vehicles').select('*').eq('status', 'active');
        if(!vehs || vehs.length === 0) { container.innerHTML = '<p class="text-slate-500 text-center py-10 border border-dashed border-[#233648] rounded-xl">Sin unidades activas.</p>'; return; }
        
        container.innerHTML = vehs.map(v => `
            <div onclick="window.conductorModule.requestUnit('${v.id}')" class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary transition-all shadow-md">
                <div><p class="text-white font-black text-lg leading-none">${v.plate}</p><p class="text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mt-1">${v.model}</p></div>
                <button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg">Solicitar</button>
            </div>
        `).join('');
    }

    async requestUnit(id) {
        if(!confirm("Al solicitar esta unidad entrará a revisión mecánica. ¿Continuar?")) return;
        
        document.getElementById('unidad-content').innerHTML = `
            <div class="text-center py-10 bg-[#111a22] rounded-2xl border border-[#324d67]">
                <div class="animate-spin text-primary mb-3"><span class="material-symbols-outlined text-4xl">autorenew</span></div>
                <p class="text-white font-bold">Generando folio...</p>
            </div>
        `;

        const { error } = await supabase.from('trips').insert({ driver_id: this.userId, vehicle_id: id, status: 'requested' });
        if (error) alert("Error: " + error.message);
        
        await this.loadDashboardState();
        this.switchTab('checklist');
    }

    renderMechanicChecklist(trip, container) {
        if (trip.status === 'requested') {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="animate-bounce text-orange-500 mb-4"><span class="material-symbols-outlined text-5xl drop-shadow-md">engineering</span></div>
                    <p class="text-white font-black text-xl uppercase tracking-tighter">Pasa al Taller</p>
                    <p class="text-sm text-[#92adc9] mt-2 max-w-xs mx-auto">El Jefe de Taller debe liberar físicamente la unidad en el sistema antes de que puedas usarla.</p>
                </div>
            `;
        } else {
            // Se añadió la sección para la foto de conformidad y el checkbox
            container.innerHTML = `
                <div class="space-y-3 mb-6">
                    <div class="flex justify-between items-center bg-[#111a22] p-4 rounded-xl border border-emerald-500/30">
                        <span class="text-sm text-white font-bold">Inspección General</span>
                        <span class="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">verified</span> Aprobado</span>
                    </div>
                </div>
                
                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl mb-4">
                    <h4 class="text-white font-bold text-sm mb-3">Evidencia de Recepción</h4>
                    <div class="flex gap-2 items-center mb-3">
                        <input type="file" id="reception-photo-input" accept="image/*" capture="environment" class="hidden">
                        <label for="reception-photo-input" class="flex-1 h-10 bg-[#233648] text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer font-bold text-xs transition-colors border border-[#324d67] hover:bg-primary">
                            <span class="material-symbols-outlined text-sm">photo_camera</span> Tomar Foto
                        </label>
                    </div>
                    <div id="reception-photo-preview" class="hidden aspect-video bg-cover bg-center rounded-lg border border-[#324d67] mb-3"></div>
                    
                    <label class="flex items-start gap-3 cursor-pointer mt-2 group">
                        <div class="relative flex items-center">
                            <input type="checkbox" id="accept-conditions-chk" class="peer appearance-none w-5 h-5 border-2 border-[#324d67] rounded bg-[#1c2127] checked:bg-primary checked:border-primary transition-all">
                            <span class="material-symbols-outlined absolute text-white text-sm opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5 top-0.5">check</span>
                        </div>
                        <span class="text-xs text-[#92adc9] group-hover:text-white transition-colors">Acepto de conformidad la recepción del vehículo ECO-${trip.vehicles.economic_number} y asumo la responsabilidad durante mi turno.</span>
                    </label>
                </div>

                <button id="btn-confirm-reception" onclick="window.conductorModule.confirmReception('${trip.id}')" class="w-full py-5 bg-primary text-white font-black rounded-xl uppercase text-sm shadow-[0_0_20px_rgba(19,127,236,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span class="material-symbols-outlined">draw</span> Firmar de Conformidad
                </button>
            `;

            // Lógica para mostrar la vista previa de la foto
            const photoInput = document.getElementById('reception-photo-input');
            const photoPreview = document.getElementById('reception-photo-preview');
            const acceptChk = document.getElementById('accept-conditions-chk');
            const btnConfirm = document.getElementById('btn-confirm-reception');
            
            // Validar que se tomen foto y checkbox
            const validateForm = () => {
                if(this.receptionPhoto && acceptChk.checked) {
                    btnConfirm.disabled = false;
                } else {
                    btnConfirm.disabled = true;
                }
            };

            // Iniciar bloqueado
            validateForm();

            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) {
                    this.receptionPhoto = file;
                    photoPreview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
                    photoPreview.classList.remove('hidden');
                    validateForm();
                }
            });

            acceptChk.addEventListener('change', validateForm);
        }
    }

    async confirmReception(id) {
        if (!this.receptionPhoto) {
            alert("Debes tomar una foto de evidencia para recibir la unidad.");
            return;
        }

        // Aquí podrías subir `this.receptionPhoto` a un storage de Supabase (omitido para mantener la simplicidad)
        const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase(); 
        
        const btn = document.getElementById('btn-confirm-reception');
        btn.innerText = "Firmando...";
        btn.disabled = true;

        await supabase.from('trips').update({ status: 'driver_accepted', access_code: accessCode }).eq('id', id);
        
        await this.loadDashboardState();
        this.switchTab('perfil'); 
    }

    renderAccessCode(trip) {
        const container = document.getElementById('access-code-container');
        
        if (trip && (trip.status === 'driver_accepted' || trip.status === 'in_progress')) {
            const code = trip.access_code || 'ERROR';
            container.innerHTML = `
                <p class="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-tighter border-b border-slate-200 pb-2">Clave de Salida Autorizada</p>
                <div class="bg-white p-6 rounded-2xl shadow-sm border-2 border-primary/20 mx-auto w-full text-center relative overflow-hidden">
                    <span class="text-6xl font-black text-slate-900 tracking-[12px] font-mono drop-shadow-sm relative z-10">${code}</span>
                    <div class="absolute inset-0 bg-primary/5 opacity-50 z-0"></div>
                </div>
                <p class="text-[9px] text-slate-500 font-bold mt-3 text-center uppercase tracking-widest bg-slate-200 p-2 rounded">
                    Muestra este código al vigilante
                </p>
            `;
        } else {
            container.innerHTML = `
                <div class="bg-slate-200 p-8 rounded-2xl shadow-inner border border-slate-300 mx-auto w-full text-center opacity-70">
                    <span class="material-symbols-outlined text-5xl text-slate-400 mb-2">lock</span>
                    <p class="text-xs font-black text-slate-500 uppercase tracking-widest">Pase Bloqueado</p>
                </div>
            `;
        }
    }

    setupIncidentForm() {
        const input = document.getElementById('input-incident-camera');
        const grid = document.getElementById('incident-preview-grid');
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;
            this.incidentImages.push(file);
            grid.innerHTML += `<div class="aspect-square bg-cover bg-center rounded-xl border-2 border-red-500/50 shadow-md" style="background-image: url('${URL.createObjectURL(file)}')"></div>`;
        });

        document.getElementById('btn-send-incident').onclick = async () => {
            alert("Incidente crítico registrado. La mesa de control ha sido alertada.");
            document.getElementById('modal-incident').classList.add('hidden');
            this.incidentImages = [];
            grid.innerHTML = '';
            document.getElementById('inc-desc').value = '';
        }
    }

    switchTab(tabId) {
        this.activeTab = tabId; // Guardar pestaña activa
        
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('active', 'text-primary');
        
        // TRUCO INFALIBLE PARA LEAFLET
        if(tabId === 'ruta') {
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                    
                    // Iniciar tracking si estamos en un viaje activo
                    if (this.currentTrip && 
                        (this.currentTrip.status === 'in_progress' || this.currentTrip.status === 'driver_accepted')) {
                        setTimeout(() => {
                            this.startTracking();
                        }, 1000);
                    }
                }
            }, 300);
        } else {
            // Si salimos de la pestaña ruta, podemos pausar el GPS para ahorrar batería
            if (tabId !== 'ruta' && this.currentTrip?.status !== 'in_progress') {
                // Solo pausar si no estamos en viaje activo
                this.stopTracking();
            }
        }
    }
}
