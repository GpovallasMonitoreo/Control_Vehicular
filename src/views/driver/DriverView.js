import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        this.currentTrip = null;
        this.watchPositionId = null;
        this.gpsRetryCount = 0;
        this.maxGpsRetries = 3;
        
        // Sistema de logística completo
        this.tripLogistics = {
            // Tiempos
            startTime: null,
            exitTime: null,
            entryTime: null,
            exitGateTime: null,
            entryGateTime: null,
            
            // Kilometraje
            exitKm: null,
            entryKm: null,
            totalDistance: 0,
            
            // Estadísticas de viaje
            averageSpeed: 0,
            maxSpeed: 0,
            idleTime: 0,
            movingTime: 0,
            lastSpeed: 0,
            lastUpdateTime: null,
            lastPosition: null,
            
            // Detalles de solicitud y retorno
            requestDetails: null,
            returnDetails: null,
            
            // Código de emergencia
            emergencyCode: null,
            emergencyExpiry: null,
            
            // Firmas
            driverSignature: null,
            guardSignature: null,
            
            // Checklist
            checklistExit: {},
            
            // Notas
            notes: [],
            
            // Supervisor
            supervisor: null
        };
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <!-- HEADER MEJORADO CON INDICADOR GPS -->
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold truncate">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span id="gps-header-indicator" class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span id="profile-status" class="text-[#92adc9] text-[10px] font-bold uppercase">Sincronizado</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('modal-emergency').classList.remove('hidden')" class="h-10 w-10 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white">
                            <span class="material-symbols-outlined text-sm">emergency</span>
                        </button>
                        <button onclick="window.logoutDriver()" class="h-10 w-10 bg-[#233648] border border-[#324d67] rounded-full text-white flex items-center justify-center hover:text-red-400">
                            <span class="material-symbols-outlined text-sm">logout</span>
                        </button>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative pb-24">
                    
                    <!-- PESTAÑA UNIDAD -->
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70">Selección de Unidad</h3>
                        <div id="unidad-content" class="space-y-3"></div>
                    </section>

                    <!-- PESTAÑA CHECKLIST -->
                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">engineering</span> Proceso de Taller
                            </h3>
                            <div id="checklist-content" class="space-y-3"></div>
                        </div>
                    </section>

                    <!-- PESTAÑA RUTA - SIN MAPA, SOLO DATOS -->
                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        
                        <!-- Panel de control de ruta -->
                        <div class="p-5 space-y-4">
                            <!-- Mensaje de espera -->
                            <div id="route-waiting-msg" class="bg-[#192633] border border-[#233648] rounded-2xl p-8 text-center">
                                <span class="material-symbols-outlined text-5xl text-[#324d67] mb-3">gpp_maybe</span>
                                <h3 class="text-white font-bold text-lg">Esperando Salida</h3>
                                <p class="text-[#92adc9] text-xs mt-2">Muestra tu código al guardia para autorizar la salida</p>
                            </div>

                            <!-- Panel de información de viaje ACTIVO -->
                            <div id="active-trip-panel" class="hidden space-y-4">
                                <!-- Kilometraje y tiempos -->
                                <div class="bg-[#192633] rounded-2xl p-5 border border-primary/30">
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p class="text-[10px] text-[#92adc9] uppercase mb-1">Km Salida</p>
                                            <input type="number" id="exit-km-input" step="0.1" placeholder="0.0" 
                                                   class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-lg font-bold">
                                        </div>
                                        <div>
                                            <p class="text-[10px] text-[#92adc9] uppercase mb-1">Km Actual</p>
                                            <p id="current-km-display" class="text-2xl font-black text-primary">0.0</p>
                                        </div>
                                    </div>
                                    
                                    <!-- Progreso del viaje -->
                                    <div class="space-y-3">
                                        <div class="flex justify-between text-xs">
                                            <span class="text-[#92adc9]">Velocidad</span>
                                            <span id="live-speed" class="text-white font-bold">0 km/h</span>
                                        </div>
                                        <div class="flex justify-between text-xs">
                                            <span class="text-[#92adc9]">Distancia recorrida</span>
                                            <span id="live-distance" class="text-white font-bold">0.0 km</span>
                                        </div>
                                        <div class="flex justify-between text-xs">
                                            <span class="text-[#92adc9]">Combustible estimado</span>
                                            <span id="live-fuel" class="text-white font-bold">0.0 L</span>
                                        </div>
                                        <div class="flex justify-between text-xs">
                                            <span class="text-[#92adc9]">Tiempo transcurrido</span>
                                            <span id="trip-duration" class="text-white font-bold">00:00:00</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Botones de acción -->
                                <div class="space-y-2">
                                    <button id="btn-start-route" class="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase text-sm shadow-lg">
                                        <span class="material-symbols-outlined inline-block mr-2">play_arrow</span>
                                        INICIAR VIAJE
                                    </button>
                                    
                                    <button id="btn-pause-route" class="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase text-sm hidden">
                                        <span class="material-symbols-outlined inline-block mr-2">pause</span>
                                        PAUSAR SEGUIMIENTO
                                    </button>
                                    
                                    <button id="btn-end-route" class="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl uppercase text-sm hidden">
                                        <span class="material-symbols-outlined inline-block mr-2">stop</span>
                                        FINALIZAR VIAJE
                                    </button>
                                </div>

                                <!-- Notas del viaje -->
                                <div class="bg-[#192633] rounded-xl p-4 border border-[#233648]">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Notas del viaje</p>
                                    <textarea id="trip-notes" rows="2" 
                                              class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-sm"
                                              placeholder="Agregar notas del viaje..."></textarea>
                                    <button onclick="window.conductorModule.saveTripNotes()" 
                                            class="mt-2 w-full py-2 bg-[#233648] text-white rounded-lg text-xs uppercase">
                                        Guardar nota
                                    </button>
                                </div>
                            </div>

                            <!-- Estado del GPS -->
                            <div class="bg-[#111a22] border border-[#233648] rounded-xl p-4">
                                <div id="gps-status-indicator" class="text-center">
                                    <div class="flex items-center justify-center gap-2 text-slate-400">
                                        <span class="material-symbols-outlined">gps_fixed</span>
                                        <span class="text-xs font-bold">GPS Inactivo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- PESTAÑA PERFIL MEJORADA -->
                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-5">
                        <!-- Gafete digital -->
                        <div class="bg-white rounded-3xl p-6 shadow-2xl">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase">Gafete Digital</span>
                                    <h3 id="card-full-name" class="text-slate-900 text-xl font-bold mt-1">--</h3>
                                </div>
                                <div id="card-photo" class="h-16 w-16 bg-slate-100 rounded-xl bg-cover bg-center"></div>
                            </div>

                            <!-- Código de acceso -->
                            <div id="access-code-container" class="mb-6"></div>

                            <!-- Datos del conductor y supervisor -->
                            <div class="bg-slate-50 p-4 rounded-2xl mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-3 border-b border-slate-200 pb-2">
                                    <span class="material-symbols-outlined text-sm text-primary">badge</span> Datos
                                </h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-[10px] text-slate-500 uppercase">Supervisor</span>
                                        <span id="profile-manager" class="text-slate-800 text-xs font-bold">--</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-[10px] text-slate-500 uppercase">Cargo</span>
                                        <span id="profile-role" class="text-slate-800 text-xs font-bold">Conductor</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-[10px] text-slate-500 uppercase">Licencia</span>
                                        <span id="lic-number" class="text-slate-800 text-xs font-mono font-bold">--</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Resumen del viaje actual -->
                            <div id="trip-summary-container" class="hidden bg-primary/5 p-4 rounded-2xl border border-primary/20">
                                <h4 class="text-primary text-xs font-black uppercase mb-3">Viaje en curso</h4>
                                <div class="space-y-2 text-xs">
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Inicio:</span>
                                        <span id="summary-start-time" class="text-slate-900 font-bold">--:--</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Distancia:</span>
                                        <span id="summary-distance" class="text-slate-900 font-bold">0 km</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Consumo:</span>
                                        <span id="summary-fuel" class="text-slate-900 font-bold">0 L</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <!-- NAVEGACIÓN -->
                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-20 z-30">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active text-primary flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">directions_car</span>
                        <span class="text-[9px] font-bold uppercase">Unidad</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">engineering</span>
                        <span class="text-[9px] font-bold uppercase">Taller</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">route</span>
                        <span class="text-[9px] font-bold uppercase">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">badge</span>
                        <span class="text-[9px] font-bold uppercase">Pase</span>
                    </button>
                </nav>

                <!-- MODAL DE EMERGENCIA -->
                <div id="modal-emergency" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div class="bg-[#1c2127] w-full max-w-md rounded-3xl p-6 border border-red-500/30">
                        <span class="material-symbols-outlined text-5xl text-red-500 mb-4 block">emergency</span>
                        <h3 class="text-white font-bold text-lg mb-2">Código de Emergencia</h3>
                        <p class="text-[#92adc9] text-sm mb-6">¿Estás en una situación de emergencia? Esto alertará a todos los supervisores.</p>
                        
                        <div class="space-y-3">
                            <textarea id="emergency-desc" rows="3" 
                                      class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl"
                                      placeholder="Describe la emergencia..."></textarea>
                            
                            <button onclick="window.conductorModule.activateEmergency()" 
                                    class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase text-sm">
                                ACTIVAR EMERGENCIA
                            </button>
                            <button onclick="document.getElementById('modal-emergency').classList.add('hidden')" 
                                    class="w-full py-3 text-[#92adc9] hover:text-white transition-colors text-xs uppercase">
                                Cancelar
                            </button>
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
        this.setupEventListeners();

        // Suscripción en tiempo real a cambios en el viaje
        supabase.channel('driver_realtime')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips', 
                filter: `driver_id=eq.${this.userId}` 
            }, () => {
                this.loadDashboardState();
                if(navigator.vibrate) navigator.vibrate([100]);
            }).subscribe();
    }

    setupEventListeners() {
        // Persistencia del GPS cuando la app está en background
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.activeTab === 'ruta' && this.currentTrip?.status === 'in_progress') {
                this.startTracking();
            }
        });

        // Guardar notas automáticamente cada 30 segundos
        setInterval(() => {
            if (this.currentTrip?.status === 'in_progress') {
                this.saveTripNotes();
            }
        }, 30000);
    }

    // ==================== SISTEMA GPS MEJORADO ====================
    startTracking() {
        if (!navigator.geolocation) {
            alert("El dispositivo no tiene sensor GPS.");
            return;
        }

        // Limpiar watch anterior
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
        }

        const gpsIndicator = document.getElementById('gps-status-indicator');
        const headerIndicator = document.getElementById('gps-header-indicator');
        
        gpsIndicator.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-yellow-400">
                <span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                <span class="text-xs font-bold">Iniciando GPS...</span>
            </div>
        `;

        // Solicitar permisos y comenzar tracking
        navigator.geolocation.getCurrentPosition(
            // Success
            (pos) => {
                this.handleFirstPosition(pos);
                
                // Watch position para tracking continuo
                this.watchPositionId = navigator.geolocation.watchPosition(
                    (position) => this.handlePositionUpdate(position),
                    (error) => this.handleGPSError(error),
                    { 
                        enableHighAccuracy: true, 
                        maximumAge: 0,
                        timeout: 10000,
                        distanceFilter: 10 // Actualizar cada 10 metros
                    }
                );
            },
            // Error
            (err) => {
                this.handleGPSError(err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    handleFirstPosition(pos) {
        const { latitude, longitude, speed } = pos.coords;
        
        // Registrar hora de salida si es la primera posición
        if (!this.tripLogistics.startTime) {
            this.tripLogistics.startTime = new Date();
            this.tripLogistics.exitTime = new Date();
            this.tripLogistics.exitGateTime = new Date();
            
            // Actualizar en la base de datos
            this.updateTripInDatabase({
                start_time: this.tripLogistics.startTime.toISOString(),
                exit_time: this.tripLogistics.exitTime.toISOString(),
                exit_gate_time: this.tripLogistics.exitGateTime.toISOString(),
                status: 'in_progress'
            });
        }

        // Actualizar UI
        document.getElementById('gps-status-indicator').innerHTML = `
            <div class="flex items-center justify-center gap-2 text-emerald-400">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span class="text-xs font-bold">GPS Activo - Enviando datos...</span>
            </div>
        `;

        document.getElementById('gps-header-indicator').innerHTML = `
            <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
        `;
    }

    handlePositionUpdate(pos) {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = new Date();
        const speedKmh = Math.round((speed || 0) * 3.6);

        // Actualizar velocidad en UI
        document.getElementById('live-speed').innerText = `${speedKmh} km/h`;

        // Calcular distancia si tenemos posición anterior
        if (this.tripLogistics.lastPosition) {
            const distance = this.calculateDistance(
                this.tripLogistics.lastPosition.lat,
                this.tripLogistics.lastPosition.lng,
                latitude,
                longitude
            );

            // Solo sumar distancias razonables (< 500m)
            if (distance < 0.5) {
                this.tripLogistics.totalDistance += distance;
                
                // Calcular consumo (promedio 8 km/L)
                const fuelConsumption = this.tripLogistics.totalDistance / 8;
                
                // Actualizar UI
                document.getElementById('live-distance').innerText = this.tripLogistics.totalDistance.toFixed(1);
                document.getElementById('live-fuel').innerText = fuelConsumption.toFixed(1);
                
                // Actualizar estadísticas en perfil
                document.getElementById('summary-distance').innerText = this.tripLogistics.totalDistance.toFixed(1) + ' km';
                document.getElementById('summary-fuel').innerText = fuelConsumption.toFixed(1) + ' L';
            }

            // Calcular tiempo en movimiento
            const timeDiff = (now - this.tripLogistics.lastUpdateTime) / 1000;
            if (speedKmh > 1) {
                this.tripLogistics.movingTime += timeDiff;
            } else {
                this.tripLogistics.idleTime += timeDiff;
            }

            // Velocidad máxima
            if (speedKmh > this.tripLogistics.maxSpeed) {
                this.tripLogistics.maxSpeed = speedKmh;
            }

            // Velocidad promedio
            const totalHours = (now - this.tripLogistics.startTime) / 3600000;
            if (totalHours > 0) {
                this.tripLogistics.averageSpeed = this.tripLogistics.totalDistance / totalHours;
            }
        }

        // Actualizar tiempo transcurrido
        if (this.tripLogistics.startTime) {
            const duration = Math.floor((now - this.tripLogistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            document.getElementById('trip-duration').innerText = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Guardar posición para cálculos futuros
        this.tripLogistics.lastPosition = { lat: latitude, lng: longitude, timestamp: now };
        this.tripLogistics.lastUpdateTime = now;
        this.tripLogistics.lastSpeed = speedKmh;

        // ENVIAR A SUPABASE - TODOS LOS DATOS
        this.sendLocationToDatabase({
            lat: latitude,
            lng: longitude,
            speed: speedKmh,
            accuracy: accuracy,
            total_distance: this.tripLogistics.totalDistance,
            moving_time: this.tripLogistics.movingTime,
            idle_time: this.tripLogistics.idleTime,
            timestamp: now.toISOString()
        });
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    handleGPSError(err) {
        console.error("GPS Error:", err);
        const gpsIndicator = document.getElementById('gps-status-indicator');
        
        let errorMsg = 'Error de GPS';
        if (err.code === 1) errorMsg = 'Permiso denegado';
        if (err.code === 2) errorMsg = 'Señal no disponible';
        if (err.code === 3) errorMsg = 'Tiempo de espera agotado';

        gpsIndicator.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <div class="flex items-center gap-1 text-red-400">
                    <span class="material-symbols-outlined text-sm">gps_off</span>
                    <span class="text-xs">${errorMsg}</span>
                </div>
                <button onclick="window.conductorModule.startTracking()" 
                    class="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full">
                    Reintentar
                </button>
            </div>
        `;

        document.getElementById('gps-header-indicator').innerHTML = `
            <span class="relative rounded-full h-2 w-2 bg-red-500"></span>
        `;
    }

    stopTracking() {
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
            
            document.getElementById('gps-status-indicator').innerHTML = `
                <div class="flex items-center justify-center gap-2 text-slate-400">
                    <span class="material-symbols-outlined">gps_fixed</span>
                    <span class="text-xs font-bold">GPS Detenido</span>
                </div>
            `;

            document.getElementById('gps-header-indicator').innerHTML = `
                <span class="relative rounded-full h-2 w-2 bg-slate-500"></span>
            `;
        }
    }

    // ==================== FUNCIONES DE BASE DE DATOS ====================
    async sendLocationToDatabase(locationData) {
        if (!this.currentTrip) return;

        try {
            const { error } = await supabase.from('trip_locations').insert({
                trip_id: this.currentTrip.id,
                lat: locationData.lat,
                lng: locationData.lng,
                speed: locationData.speed,
                accuracy: locationData.accuracy,
                total_distance: locationData.total_distance,
                moving_time: locationData.moving_time,
                idle_time: locationData.idle_time,
                timestamp: locationData.timestamp
            });

            if (error) console.error('Error guardando ubicación:', error);
        } catch (error) {
            console.error('Error en sendLocationToDatabase:', error);
        }
    }

    async updateTripInDatabase(updates) {
        if (!this.currentTrip) return;

        try {
            const { error } = await supabase
                .from('trips')
                .update(updates)
                .eq('id', this.currentTrip.id);

            if (error) console.error('Error actualizando viaje:', error);
        } catch (error) {
            console.error('Error en updateTripInDatabase:', error);
        }
    }

    // ==================== FUNCIONES DEL VIAJE ====================
    async startTrip() {
        const exitKm = document.getElementById('exit-km-input').value;
        
        if (!exitKm) {
            alert('Ingresa el kilometraje de salida');
            return;
        }

        this.tripLogistics.exitKm = parseFloat(exitKm);
        this.tripLogistics.startTime = new Date();
        this.tripLogistics.exitTime = new Date();
        this.tripLogistics.exitGateTime = new Date();

        // Actualizar UI
        document.getElementById('btn-start-route').classList.add('hidden');
        document.getElementById('btn-pause-route').classList.remove('hidden');
        document.getElementById('btn-end-route').classList.remove('hidden');
        document.getElementById('route-waiting-msg').classList.add('hidden');
        document.getElementById('active-trip-panel').classList.remove('hidden');
        document.getElementById('trip-summary-container').classList.remove('hidden');
        document.getElementById('summary-start-time').innerText = this.tripLogistics.startTime.toLocaleTimeString();

        // Actualizar base de datos
        await this.updateTripInDatabase({
            status: 'in_progress',
            start_time: this.tripLogistics.startTime.toISOString(),
            exit_time: this.tripLogistics.exitTime.toISOString(),
            exit_gate_time: this.tripLogistics.exitGateTime.toISOString(),
            exit_km: this.tripLogistics.exitKm,
            request_details: {
                start_location: 'Base',
                start_time: this.tripLogistics.startTime.toISOString()
            }
        });

        // Iniciar GPS
        this.startTracking();
    }

    pauseTrip() {
        this.stopTracking();
        
        document.getElementById('btn-pause-route').classList.add('hidden');
        document.getElementById('btn-start-route').classList.remove('hidden');
        document.getElementById('btn-start-route').innerHTML = `
            <span class="material-symbols-outlined inline-block mr-2">play_arrow</span>
            REANUDAR VIAJE
        `;
    }

    async endTrip() {
        if (!confirm('¿Finalizar viaje? Se registrarán todos los datos.')) return;

        const entryKm = prompt('Ingresa el kilometraje de entrada:');
        if (!entryKm) return;

        this.tripLogistics.entryKm = parseFloat(entryKm);
        this.tripLogistics.entryTime = new Date();
        this.tripLogistics.entryGateTime = new Date();

        // Calcular distancia total
        const totalDistance = this.tripLogistics.entryKm - this.tripLogistics.exitKm;
        
        // Preparar datos completos para la base de datos
        const tripData = {
            status: 'completed',
            entry_time: this.tripLogistics.entryTime.toISOString(),
            entry_gate_time: this.tripLogistics.entryGateTime.toISOString(),
            entry_km: this.tripLogistics.entryKm,
            return_details: {
                end_time: this.tripLogistics.entryTime.toISOString(),
                total_distance: totalDistance,
                average_speed: this.tripLogistics.averageSpeed,
                max_speed: this.tripLogistics.maxSpeed,
                moving_time: this.tripLogistics.movingTime,
                idle_time: this.tripLogistics.idleTime,
                fuel_consumption: totalDistance / 8,
                route_summary: {
                    points: this.tripLogistics.lastPosition ? [this.tripLogistics.lastPosition] : []
                }
            }
        };

        // Guardar en Supabase
        await this.updateTripInDatabase(tripData);

        // Guardar resumen en tabla separada
        await supabase.from('trip_summaries').insert({
            trip_id: this.currentTrip.id,
            total_distance: totalDistance,
            average_speed: this.tripLogistics.averageSpeed,
            max_speed: this.tripLogistics.maxSpeed,
            moving_time_seconds: this.tripLogistics.movingTime,
            idle_time_seconds: this.tripLogistics.idleTime,
            fuel_consumption: totalDistance / 8,
            start_km: this.tripLogistics.exitKm,
            end_km: this.tripLogistics.entryKm,
            start_time: this.tripLogistics.startTime.toISOString(),
            end_time: this.tripLogistics.entryTime.toISOString()
        });

        this.stopTracking();
        alert('Viaje finalizado correctamente');
        await this.loadDashboardState();
        this.switchTab('unidad');
    }

    async saveTripNotes() {
        const notes = document.getElementById('trip-notes').value;
        if (!notes || !this.currentTrip) return;

        if (!this.tripLogistics.notes) this.tripLogistics.notes = [];
        this.tripLogistics.notes.push({
            text: notes,
            timestamp: new Date().toISOString()
        });

        await this.updateTripInDatabase({
            notes: this.tripLogistics.notes
        });
    }

    async activateEmergency() {
        const description = document.getElementById('emergency-desc').value;
        
        // Generar código de emergencia
        const emergencyCode = 'EMG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryTime = new Date(Date.now() + 30 * 60000); // 30 minutos

        await this.updateTripInDatabase({
            emergency_code: emergencyCode,
            emergency_expiry: expiryTime.toISOString(),
            notes: [...(this.tripLogistics.notes || []), {
                type: 'emergency',
                description: description,
                code: emergencyCode,
                timestamp: new Date().toISOString()
            }]
        });

        // Enviar notificación a supervisores (simulado)
        console.log('EMERGENCIA ACTIVADA:', emergencyCode);

        alert(`EMERGENCIA REGISTRADA\nCódigo: ${emergencyCode}\nMantén la calma, ayuda en camino.`);
        document.getElementById('modal-emergency').classList.add('hidden');
    }

    // ==================== FUNCIONES EXISTENTES ADAPTADAS ====================
    async loadProfileData() {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(p) {
            this.profile = p;
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('card-full-name').innerText = p.full_name;
            document.getElementById('card-photo').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('lic-number').innerText = p.license_number || 'No Registrada';
            
            if (p.role === 'supervisor' || p.role === 'admin') {
                document.getElementById('profile-manager').innerText = 'Supervisor';
                document.getElementById('profile-role').innerText = p.role === 'admin' ? 'Administrador' : 'Supervisor';
            } else {
                document.getElementById('profile-manager').innerText = p.supervisor_name || 'Central COV';
                document.getElementById('profile-role').innerText = 'Conductor';
            }
        }
    }

    async loadDashboardState() {
        const { data: trips } = await supabase
            .from('trips')
            .select(`*, vehicles(*)`)
            .eq('driver_id', this.userId)
            .neq('status', 'closed')
            .order('created_at', { ascending: false })
            .limit(1);

        const trip = trips && trips.length > 0 ? trips[0] : null;
        this.currentTrip = trip;

        const unityCont = document.getElementById('unidad-content');
        const waitingMsg = document.getElementById('route-waiting-msg');
        const activePanel = document.getElementById('active-trip-panel');
        const btnStart = document.getElementById('btn-start-route');
        const btnPause = document.getElementById('btn-pause-route');
        const btnEnd = document.getElementById('btn-end-route');

        if (!trip) {
            await this.renderAvailableUnits(unityCont);
            document.getElementById('profile-status').innerText = "Disponible";
            this.renderAccessCode(null);
            if (waitingMsg) waitingMsg.classList.remove('hidden');
            if (activePanel) activePanel.classList.add('hidden');
            this.stopTracking();
        } else {
            unityCont.innerHTML = `
                <div class="bg-primary/10 border border-primary/30 p-5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-primary uppercase mb-2">Unidad Asignada</p>
                    <h2 class="text-4xl font-black text-white">${trip.vehicles.plate}</h2>
                    <p class="text-sm text-[#92adc9] mt-2">${trip.vehicles.model} • ECO-${trip.vehicles.economic_number}</p>
                </div>
            `;

            this.renderAccessCode(trip);

            if (trip.status === 'in_progress' || trip.status === 'driver_accepted') {
                document.getElementById('profile-status').innerText = 
                    trip.status === 'in_progress' ? "EN RUTA" : "Esperando autorización";
                
                if (waitingMsg) waitingMsg.classList.add('hidden');
                if (activePanel) activePanel.classList.remove('hidden');

                // Configurar botones
                if (trip.status === 'in_progress') {
                    btnStart.classList.add('hidden');
                    btnPause.classList.remove('hidden');
                    btnEnd.classList.remove('hidden');
                    
                    // Cargar datos existentes
                    this.tripLogistics.startTime = trip.start_time ? new Date(trip.start_time) : null;
                    this.tripLogistics.exitKm = trip.exit_km;
                    
                    if (trip.start_time) {
                        document.getElementById('summary-start-time').innerText = 
                            new Date(trip.start_time).toLocaleTimeString();
                        document.getElementById('trip-summary-container').classList.remove('hidden');
                    }

                    if (trip.exit_km) {
                        document.getElementById('exit-km-input').value = trip.exit_km;
                    }

                    // Iniciar GPS automáticamente
                    if (this.activeTab === 'ruta') {
                        setTimeout(() => this.startTracking(), 1000);
                    }
                } else {
                    btnStart.classList.remove('hidden');
                    btnPause.classList.add('hidden');
                    btnEnd.classList.add('hidden');
                    
                    btnStart.onclick = () => this.startTrip();
                }
            } else {
                document.getElementById('profile-status').innerText = "Trámite Interno";
                if (waitingMsg) waitingMsg.classList.remove('hidden');
                if (activePanel) activePanel.classList.add('hidden');
                this.stopTracking();
            }
        }
    }

    async renderAvailableUnits(container) {
        const { data: vehs } = await supabase.from('vehicles').select('*').eq('status', 'active');
        if(!vehs || vehs.length === 0) { 
            container.innerHTML = '<p class="text-slate-500 text-center py-10 border border-dashed border-[#233648] rounded-xl">Sin unidades activas.</p>'; 
            return; 
        }
        
        container.innerHTML = vehs.map(v => `
            <div onclick="window.conductorModule.requestUnit('${v.id}')" class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary transition-all">
                <div>
                    <p class="text-white font-black text-lg">${v.plate}</p>
                    <p class="text-[10px] text-[#92adc9] mt-1">${v.model}</p>
                </div>
                <button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase">Solicitar</button>
            </div>
        `).join('');
    }

    async requestUnit(id) {
        if(!confirm("¿Solicitar esta unidad?")) return;
        
        document.getElementById('unidad-content').innerHTML = `
            <div class="text-center py-10 bg-[#111a22] rounded-2xl">
                <div class="animate-spin text-primary mb-3"><span class="material-symbols-outlined text-4xl">autorenew</span></div>
                <p class="text-white font-bold">Generando folio...</p>
            </div>
        `;

        const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const { error } = await supabase.from('trips').insert({ 
            driver_id: this.userId, 
            vehicle_id: id, 
            status: 'requested',
            access_code: accessCode,
            request_details: {
                requested_at: new Date().toISOString(),
                vehicle_id: id
            }
        });

        if (error) alert("Error: " + error.message);
        await this.loadDashboardState();
        this.switchTab('checklist');
    }

    renderAccessCode(trip) {
        const container = document.getElementById('access-code-container');
        
        if (trip && (trip.status === 'driver_accepted' || trip.status === 'in_progress')) {
            const code = trip.access_code || 'ERROR';
            container.innerHTML = `
                <div class="bg-white p-6 rounded-2xl border-2 border-primary/20 text-center">
                    <p class="text-[10px] text-slate-500 uppercase mb-2">Clave de Salida</p>
                    <span class="text-5xl font-black text-slate-900 tracking-widest font-mono">${code}</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="bg-slate-200 p-6 rounded-2xl text-center opacity-70">
                    <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">lock</span>
                    <p class="text-xs font-black text-slate-500">Pase Bloqueado</p>
                </div>
            `;
        }
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('active', 'text-primary');

        if (tabId === 'ruta' && this.currentTrip?.status === 'in_progress') {
            setTimeout(() => this.startTracking(), 500);
        } else if (tabId !== 'ruta') {
            // No detenemos el GPS, solo pausamos UI si no es necesario
        }
    }
}
