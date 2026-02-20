import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null; 
        this.currentTrip = null;
        this.watchPositionId = null;
        this.gpsRetryCount = 0;
        this.maxGpsRetries = 3;
        this.backgroundSyncInterval = null;
        this.pendingLocations = [];
        
        // Sistema de logística completo
        this.tripLogistics = {
            startTime: null,
            exitTime: null,
            entryTime: null,
            exitGateTime: null,
            entryGateTime: null,
            exitKm: null,
            entryKm: null,
            totalDistance: 0,
            averageSpeed: 0,
            maxSpeed: 0,
            idleTime: 0,
            movingTime: 0,
            lastSpeed: 0,
            lastUpdateTime: null,
            lastPosition: null,
            requestDetails: null,
            returnDetails: null,
            emergencyCode: null,
            emergencyExpiry: null,
            driverSignature: null,
            guardSignature: null,
            checklistExit: {},
            notes: [],
            supervisor: null,
            deliveryPhotoFile: null,
            deliverySignature: null,
            deliveryTime: null,
            deliveryKm: null,
            deliveryFuel: null,
            workshopAccepted: false,
            // Nuevos campos para checklist de salida
            preTripPhotos: [],
            preTripChecklist: {}
        };
        
        // Archivos de fotos
        this.receptionPhotoFile = null;
        this.deliveryPhotoFile = null;
        this.preTripPhotoFiles = [];
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <!-- HEADER -->
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
                        <button onclick="window.conductorModule.logout()" class="h-10 w-10 bg-[#233648] border border-[#324d67] rounded-full text-white flex items-center justify-center hover:text-red-400">
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

                    <!-- PESTAÑA CHECKLIST PRE-VIAJE (NUEVO) -->
                    <section id="tab-pretrip" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">assignment_turned_in</span> Checklist Pre-Viaje
                            </h3>
                            <div id="pretrip-content" class="space-y-3"></div>
                        </div>
                    </section>

                    <!-- PESTAÑA CHECKLIST TALLER (RECEPCIÓN) -->
                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">engineering</span> Recepción en Taller
                            </h3>
                            <div id="checklist-content" class="space-y-3"></div>
                        </div>
                    </section>

                    <!-- PESTAÑA RUTA -->
                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        <div class="p-5 space-y-4">
                            <div id="route-waiting-msg" class="bg-[#192633] border border-[#233648] rounded-2xl p-8 text-center">
                                <span class="material-symbols-outlined text-5xl text-[#324d67] mb-3">gpp_maybe</span>
                                <h3 class="text-white font-bold text-lg">Esperando Salida</h3>
                                <p class="text-[#92adc9] text-xs mt-2">Esperando autorización del guardia...</p>
                                <div class="mt-4 flex justify-center">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            </div>

                            <div id="active-trip-panel" class="hidden space-y-4">
                                <div class="bg-[#192633] rounded-2xl p-5 border border-primary/30">
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p class="text-[10px] text-[#92adc9] uppercase mb-1">Km Salida</p>
                                            <p id="exit-km-display" class="text-2xl font-black text-primary">0.0</p>
                                            <input type="hidden" id="exit-km-input" value="0">
                                        </div>
                                        <div>
                                            <p class="text-[10px] text-[#92adc9] uppercase mb-1">Km Actual</p>
                                            <p id="current-km-display" class="text-2xl font-black text-primary">0.0</p>
                                        </div>
                                    </div>
                                    
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

                    <!-- PESTAÑA PERFIL -->
                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-5">
                        <div class="bg-white rounded-3xl p-6 shadow-2xl">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <span class="text-[9px] font-black text-slate-400 uppercase">Gafete Digital</span>
                                    <h3 id="card-full-name" class="text-slate-900 text-xl font-bold mt-1">--</h3>
                                </div>
                                <div id="card-photo" class="h-16 w-16 bg-slate-100 rounded-xl bg-cover bg-center"></div>
                            </div>

                            <div id="access-code-container" class="mb-6"></div>

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

                            <!-- Fotos de recepción y entrega -->
                            <div id="reception-photo-container" class="hidden mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-2">Foto de Recepción</h4>
                                <img id="reception-photo-display" class="w-full rounded-xl border-2 border-primary/30 cursor-pointer" 
                                     onclick="window.conductorModule.viewReceptionPhoto()"
                                     src="" alt="Foto de recepción">
                            </div>

                            <div id="delivery-photo-container" class="hidden mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-2">Foto de Entrega a Taller</h4>
                                <img id="delivery-photo-display" class="w-full rounded-xl border-2 border-primary/30 cursor-pointer" 
                                     onclick="window.conductorModule.viewDeliveryPhoto()"
                                     src="" alt="Foto de entrega">
                            </div>

                            <!-- Fotos Pre-Viaje -->
                            <div id="pretrip-photos-container" class="hidden mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-2">Fotos Pre-Viaje</h4>
                                <div id="pretrip-photos-grid" class="grid grid-cols-3 gap-2"></div>
                            </div>

                            <!-- Datos de entrega a taller -->
                            <div id="delivery-data-container" class="hidden mb-4 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                                <h4 class="text-primary text-xs font-black uppercase mb-3">Entrega a Taller</h4>
                                <div class="space-y-2 text-xs">
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Kilometraje entrega:</span>
                                        <span id="delivery-km-display" class="text-slate-900 font-bold">0 km</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Combustible:</span>
                                        <span id="delivery-fuel-display" class="text-slate-900 font-bold">0 L</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Hora entrega:</span>
                                        <span id="delivery-time-display" class="text-slate-900 font-bold">--:--</span>
                                    </div>
                                </div>
                            </div>

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
                    <button onclick="window.conductorModule.switchTab('pretrip')" id="nav-pretrip" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">assignment</span>
                        <span class="text-[9px] font-bold uppercase">Pre-Viaje</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">route</span>
                        <span class="text-[9px] font-bold uppercase">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">engineering</span>
                        <span class="text-[9px] font-bold uppercase">Taller</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">badge</span>
                        <span class="text-[9px] font-bold uppercase">Pase</span>
                    </button>
                </nav>

                <!-- MODAL DE EMERGENCIA MEJORADO -->
                <div id="modal-emergency" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
                    <div class="bg-[#1c2127] w-full max-w-md rounded-3xl p-6 border border-red-500/30 max-h-[90vh] overflow-y-auto">
                        <span class="material-symbols-outlined text-5xl text-red-500 mb-4 block">emergency</span>
                        <h3 class="text-white font-bold text-lg mb-2">Reporte de Incidente</h3>
                        <p class="text-[#92adc9] text-sm mb-6">Selecciona el tipo de incidente y describe lo sucedido.</p>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase mb-2 block">Tipo de Incidente</label>
                                <select id="incident-type" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-sm">
                                    <option value="">Seleccionar tipo...</option>
                                    <optgroup label="Colisiones">
                                        <option value="rear_end">Colisión por alcance (trasera)</option>
                                        <option value="frontal">Colisión frontal</option>
                                        <option value="side_impact">Impacto lateral (T-Bone)</option>
                                        <option value="sideswipe">Deslizamiento lateral (refilón)</option>
                                        <option value="multi_vehicle">Múltiples vehículos (carambola)</option>
                                        <option value="single_vehicle">Choque de un solo vehículo</option>
                                    </optgroup>
                                    <optgroup label="Accidentes">
                                        <option value="rollover">Vuelco</option>
                                        <option value="blind_spot">Accidente de punto ciego</option>
                                        <option value="pedestrian">Atropello a peatón</option>
                                        <option value="cyclist">Atropello a ciclista</option>
                                    </optgroup>
                                    <optgroup label="Otros">
                                        <option value="mechanical">Falla mecánica</option>
                                        <option value="weather">Condiciones climáticas</option>
                                        <option value="road">Condiciones del camino</option>
                                        <option value="other">Otro</option>
                                    </optgroup>
                                </select>
                            </div>
                            
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase mb-2 block">Descripción detallada</label>
                                <textarea id="emergency-desc" rows="4" 
                                          class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-sm"
                                          placeholder="Describe lo sucedido incluyendo lugar, hora y detalles relevantes..."></textarea>
                            </div>
                            
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase mb-2 block">Ubicación</label>
                                <input type="text" id="incident-location" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-sm"
                                       placeholder="Dirección o referencia">
                                <button onclick="window.conductorModule.getCurrentLocation()" class="mt-2 text-xs bg-[#233648] text-white p-2 rounded-lg w-full">
                                    Usar ubicación actual
                                </button>
                            </div>
                            
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase mb-2 block">Fotos del incidente</label>
                                <input type="file" id="incident-photos" accept="image/*" multiple class="hidden">
                                <button onclick="document.getElementById('incident-photos').click()" 
                                        class="w-full py-3 bg-[#233648] text-white rounded-lg flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined text-sm">add_a_photo</span>
                                    Agregar fotos
                                </button>
                                <div id="incident-photos-preview" class="grid grid-cols-3 gap-2 mt-3"></div>
                            </div>
                            
                            <div class="flex gap-3 pt-4">
                                <button onclick="document.getElementById('modal-emergency').classList.add('hidden')" 
                                        class="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs">
                                    Cancelar
                                </button>
                                <button onclick="window.conductorModule.submitIncident()" 
                                        class="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">
                                    Reportar Incidente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL DE NOTIFICACIÓN -->
                <div id="notification-modal" class="hidden absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div id="notification-content" class="bg-[#1c2127] w-full max-w-sm rounded-3xl p-6 border border-primary/30 animate-fade-in-up"></div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        // OBTENER EL USUARIO DE LA SESIÓN
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            console.error('❌ No hay sesión activa');
            alert('Sesión expirada. Por favor inicia sesión nuevamente.');
            window.location.hash = '#login';
            return;
        }
        
        this.userId = session.user.id;
        console.log('✅ Usuario autenticado:', this.userId);
        
        await this.loadProfileData();
        await this.loadDashboardState();
        this.setupEventListeners();
        
        // Iniciar sincronización en background
        this.startBackgroundSync();

        // Suscripción en tiempo real para detectar cambios
        supabase.channel('driver_realtime')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'trips', 
                filter: `driver_id=eq.${this.userId}` 
            }, (payload) => {
                console.log('🔄 Cambio detectado en viaje:', payload);
                this.handleTripUpdate(payload.new);
                this.showNotification('Viaje actualizado', 'El estado del viaje ha cambiado');
            })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'trips', 
                filter: `driver_id=eq.${this.userId}` 
            }, (payload) => {
                console.log('🔄 Nuevo viaje asignado:', payload);
                this.handleTripUpdate(payload.new);
                this.showNotification('Nuevo viaje', 'Se te ha asignado un nuevo viaje');
            })
            .subscribe();
    }

    // ==================== SISTEMA DE NOTIFICACIONES ====================
    showNotification(title, message, type = 'info') {
        const modal = document.getElementById('notification-modal');
        const content = document.getElementById('notification-content');
        
        const colors = {
            info: 'primary',
            success: 'green-500',
            warning: 'yellow-500',
            error: 'red-500'
        };
        
        const icons = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error'
        };
        
        content.innerHTML = `
            <div class="text-center">
                <span class="material-symbols-outlined text-5xl text-${colors[type]} mb-4">${icons[type]}</span>
                <h3 class="text-white font-bold text-xl mb-2">${title}</h3>
                <p class="text-[#92adc9] text-sm mb-6">${message}</p>
                <button onclick="document.getElementById('notification-modal').classList.add('hidden')" 
                        class="w-full py-3 bg-${colors[type]} text-white font-bold rounded-xl">
                    Cerrar
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        if (navigator.vibrate) {
            navigator.vibrate(type === 'error' ? [200, 100, 200] : [100]);
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 5000);
    }

    // ==================== SISTEMA DE GPS EN BACKGROUND ====================
    startBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('✅ Service Worker registrado');
            }).catch(err => {
                console.log('❌ Error registrando Service Worker:', err);
            });
        }
        
        this.backgroundSyncInterval = setInterval(() => {
            if (this.pendingLocations.length > 0 && navigator.onLine) {
                this.syncPendingLocations();
            }
        }, 30000);
        
        window.addEventListener('online', () => {
            console.log('📶 Conexión restaurada, sincronizando...');
            this.syncPendingLocations();
        });
    }

    async syncPendingLocations() {
        if (this.pendingLocations.length === 0 || !this.currentTrip) return;
        
        const locations = [...this.pendingLocations];
        this.pendingLocations = [];
        
        try {
            const { error } = await supabase.from('trip_locations').insert(
                locations.map(loc => ({
                    trip_id: this.currentTrip.id,
                    ...loc
                }))
            );
            
            if (error) {
                console.error('Error enviando ubicaciones:', error);
                this.pendingLocations = [...locations, ...this.pendingLocations];
            }
        } catch (error) {
            console.error('Error en sync:', error);
            this.pendingLocations = [...locations, ...this.pendingLocations];
        }
    }

    // ==================== MANEJADOR DE ACTUALIZACIONES ====================
    async handleTripUpdate(updatedTrip) {
        const previousStatus = this.currentTrip?.status;
        this.currentTrip = updatedTrip;
        
        if (updatedTrip.status === 'in_progress' && previousStatus !== 'in_progress') {
            console.log('🚀 Viaje iniciado por guardia');
            this.showNotification('Viaje iniciado', 'El guardia ha autorizado tu salida', 'success');
            
            document.getElementById('profile-status').innerText = "EN RUTA";
            document.getElementById('route-waiting-msg').classList.add('hidden');
            document.getElementById('active-trip-panel').classList.remove('hidden');
            
            if (updatedTrip.exit_km) {
                this.tripLogistics.exitKm = updatedTrip.exit_km;
                document.getElementById('exit-km-display').innerText = updatedTrip.exit_km.toFixed(1);
                document.getElementById('exit-km-input').value = updatedTrip.exit_km;
            }
            
            setTimeout(() => this.startTracking(), 1000);
        }
        else if (updatedTrip.status === 'workshop_delivered' && previousStatus !== 'workshop_delivered') {
            console.log('🔧 Unidad entregada a taller');
            this.showNotification('Entrega a taller', 'La unidad ha sido recibida en taller', 'success');
            
            document.getElementById('profile-status').innerText = "En Taller";
            
            if (updatedTrip.delivery_details) {
                this.tripLogistics.deliveryKm = updatedTrip.delivery_details.km;
                this.tripLogistics.deliveryFuel = updatedTrip.delivery_details.fuel;
                this.tripLogistics.deliveryTime = updatedTrip.delivery_details.time;
                
                document.getElementById('delivery-km-display').innerText = updatedTrip.delivery_details.km + ' km';
                document.getElementById('delivery-fuel-display').innerText = updatedTrip.delivery_details.fuel + ' L';
                document.getElementById('delivery-time-display').innerText = new Date(updatedTrip.delivery_details.time).toLocaleTimeString();
                document.getElementById('delivery-data-container').classList.remove('hidden');
            }
            
            this.stopTracking();
            this.loadDashboardState();
        }
        else if (updatedTrip.status === 'completed' && previousStatus !== 'completed') {
            console.log('🏁 Viaje completado');
            this.showNotification('Viaje completado', 'El taller ha finalizado el servicio', 'success');
            
            document.getElementById('profile-status').innerText = "Viaje Completado";
            document.getElementById('active-trip-panel').classList.add('hidden');
            document.getElementById('route-waiting-msg').classList.remove('hidden');
            
            const totalDistance = updatedTrip.return_details?.total_distance || this.tripLogistics.totalDistance;
            this.showNotification('Resumen', `Distancia total: ${totalDistance.toFixed(1)} km`, 'info');
            
            this.stopTracking();
            this.loadDashboardState();
        }
        else if (updatedTrip.status === 'pretrip_completed' && previousStatus !== 'pretrip_completed') {
            console.log('✅ Checklist pre-viaje completado');
            this.showNotification('Checklist completado', 'Ya puedes pasar con el guardia', 'success');
            this.loadDashboardState();
        }
        else {
            this.loadDashboardState();
        }
    }

    // ==================== CONFIGURACIÓN ====================
    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (this.currentTrip?.status === 'in_progress') {
                console.log('Visibilidad cambiada, GPS continúa:', document.hidden ? 'background' : 'foreground');
            }
        });

        setInterval(() => {
            if (this.currentTrip?.status === 'in_progress') {
                this.saveTripNotes();
            }
        }, 30000);
    }

    // ==================== LOGOUT ====================
    async logout() {
        if (!confirm('¿Estás seguro que deseas cerrar sesión?')) return;

        try {
            if (this.backgroundSyncInterval) {
                clearInterval(this.backgroundSyncInterval);
            }
            
            this.stopTracking();
            
            if (this.currentTrip && this.currentTrip.status === 'in_progress') {
                const shouldEndTrip = confirm('Tienes un viaje en progreso. ¿Quieres finalizarlo antes de salir?');
                if (shouldEndTrip) {
                    await this.endTrip();
                }
            }

            await supabase.auth.signOut();

        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            localStorage.clear();
            window.location.hash = '#login';
            window.location.reload();
        }
    }

    // ==================== GPS ====================
    startTracking() {
        if (!navigator.geolocation) {
            alert("El dispositivo no tiene sensor GPS.");
            return;
        }

        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
        }

        const gpsIndicator = document.getElementById('gps-status-indicator');
        
        gpsIndicator.innerHTML = `
            <div class="flex items-center justify-center gap-2 text-yellow-400">
                <span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                <span class="text-xs font-bold">Iniciando GPS...</span>
            </div>
        `;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.handleFirstPosition(pos);
                
                this.watchPositionId = navigator.geolocation.watchPosition(
                    (position) => this.handlePositionUpdate(position),
                    (error) => this.handleGPSError(error),
                    { 
                        enableHighAccuracy: true, 
                        maximumAge: 0,
                        timeout: 10000,
                        distanceFilter: 10
                    }
                );
            },
            (err) => {
                this.handleGPSError(err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    handleFirstPosition(pos) {
        if (!this.tripLogistics.startTime && this.currentTrip?.status === 'in_progress') {
            this.tripLogistics.startTime = new Date();
            
            this.updateTripInDatabase({
                start_time: this.tripLogistics.startTime.toISOString()
            });
        }

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

        document.getElementById('live-speed').innerText = `${speedKmh} km/h`;

        if (this.tripLogistics.lastPosition) {
            const distance = this.calculateDistance(
                this.tripLogistics.lastPosition.lat,
                this.tripLogistics.lastPosition.lng,
                latitude,
                longitude
            );

            if (distance < 0.5) {
                this.tripLogistics.totalDistance += distance;
                
                const fuelConsumption = this.tripLogistics.totalDistance / 8;
                
                document.getElementById('live-distance').innerText = this.tripLogistics.totalDistance.toFixed(1);
                document.getElementById('live-fuel').innerText = fuelConsumption.toFixed(1);
                
                document.getElementById('summary-distance').innerText = this.tripLogistics.totalDistance.toFixed(1) + ' km';
                document.getElementById('summary-fuel').innerText = fuelConsumption.toFixed(1) + ' L';
            }

            const timeDiff = (now - this.tripLogistics.lastUpdateTime) / 1000;
            if (speedKmh > 1) {
                this.tripLogistics.movingTime += timeDiff;
            } else {
                this.tripLogistics.idleTime += timeDiff;
            }

            if (speedKmh > this.tripLogistics.maxSpeed) {
                this.tripLogistics.maxSpeed = speedKmh;
            }

            const totalHours = (now - this.tripLogistics.startTime) / 3600000;
            if (totalHours > 0) {
                this.tripLogistics.averageSpeed = this.tripLogistics.totalDistance / totalHours;
            }
        }

        if (this.tripLogistics.startTime) {
            const duration = Math.floor((now - this.tripLogistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            document.getElementById('trip-duration').innerText = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        this.tripLogistics.lastPosition = { lat: latitude, lng: longitude, timestamp: now };
        this.tripLogistics.lastUpdateTime = now;
        this.tripLogistics.lastSpeed = speedKmh;

        if (this.currentTrip?.status === 'in_progress') {
            const locationData = {
                lat: latitude,
                lng: longitude,
                speed: speedKmh,
                accuracy: accuracy,
                total_distance: this.tripLogistics.totalDistance,
                moving_time: this.tripLogistics.movingTime,
                idle_time: this.tripLogistics.idleTime,
                timestamp: now.toISOString()
            };
            
            this.pendingLocations.push(locationData);
            this.syncPendingLocations();
        }
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

    // ==================== BASE DE DATOS ====================
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
        alert('El viaje se iniciará automáticamente cuando el guardia escanee tu código');
    }

    async endTrip() {
        if (!this.currentTrip) return;
        
        const totalDistance = this.tripLogistics.totalDistance;
        
        const tripData = {
            entry_time: new Date().toISOString(),
            entry_gate_time: new Date().toISOString(),
            entry_km: totalDistance,
            return_details: {
                end_time: new Date().toISOString(),
                total_distance: totalDistance,
                average_speed: this.tripLogistics.averageSpeed,
                max_speed: this.tripLogistics.maxSpeed,
                moving_time: this.tripLogistics.movingTime,
                idle_time: this.tripLogistics.idleTime,
                fuel_consumption: totalDistance / 8
            }
        };

        await this.updateTripInDatabase(tripData);
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

    // ==================== REPORTE DE INCIDENTES MEJORADO ====================
    getCurrentLocation() {
        if (!navigator.geolocation) {
            alert("GPS no disponible");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                document.getElementById('incident-location').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            },
            (err) => {
                alert("No se pudo obtener ubicación");
            }
        );
    }

    async submitIncident() {
        const type = document.getElementById('incident-type').value;
        const description = document.getElementById('emergency-desc').value;
        const location = document.getElementById('incident-location').value;
        const photoInput = document.getElementById('incident-photos');
        const photoFiles = photoInput.files;
        
        if (!type || !description) {
            alert("Selecciona el tipo de incidente y describe lo sucedido");
            return;
        }

        const emergencyCode = 'INC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const photoUrls = [];

        // Subir fotos si existen
        if (photoFiles.length > 0) {
            const bucketName = 'incident-photos';
            
            for (let i = 0; i < photoFiles.length; i++) {
                const file = photoFiles[i];
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${this.userId}/${this.currentTrip?.id || 'no-trip'}/incident_${Date.now()}_${i}.${fileExt}`;
                
                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, file);
                    
                if (!error) {
                    photoUrls.push(fileName);
                }
            }
        }

        const incidentData = {
            trip_id: this.currentTrip?.id || null,
            driver_id: this.userId,
            incident_type: type,
            description: description,
            location: location,
            photo_urls: photoUrls,
            reported_at: new Date().toISOString(),
            emergency_code: emergencyCode,
            status: 'reported'
        };

        await supabase.from('incidents').insert(incidentData);

        this.showNotification('Incidente reportado', `Código: ${emergencyCode}`, 'warning');
        document.getElementById('modal-emergency').classList.add('hidden');
        
        // Limpiar formulario
        document.getElementById('incident-type').value = '';
        document.getElementById('emergency-desc').value = '';
        document.getElementById('incident-location').value = '';
        document.getElementById('incident-photos-preview').innerHTML = '';
    }

    // ==================== PERFIL Y CHECKLIST ====================
    async loadProfileData() {
        if (!this.userId) return;
        
        const { data: p, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.userId)
            .single();
            
        if (error) {
            console.error('Error cargando perfil:', error);
            return;
        }
        
        if(p) {
            this.profile = p;
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('card-full-name').innerText = p.full_name;
            document.getElementById('card-photo').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('lic-number').innerText = p.license_number || 'No Registrada';
            document.getElementById('profile-manager').innerText = p.supervisor_name || 'Central COV';
            document.getElementById('profile-role').innerText = 'Conductor';
        }
    }

    async loadDashboardState() {
        if (!this.userId) return;
        
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

            const vehicleData = trip.vehicles;
            
            if (trip.status === 'in_progress') {
                document.getElementById('profile-status').innerText = "EN RUTA";
                
                if (waitingMsg) waitingMsg.classList.add('hidden');
                if (activePanel) activePanel.classList.remove('hidden');

                if (trip.start_time) {
                    this.tripLogistics.startTime = new Date(trip.start_time);
                    document.getElementById('summary-start-time').innerText = 
                        new Date(trip.start_time).toLocaleTimeString();
                    document.getElementById('trip-summary-container').classList.remove('hidden');
                }

                if (trip.exit_km) {
                    this.tripLogistics.exitKm = trip.exit_km;
                    document.getElementById('exit-km-display').innerText = trip.exit_km.toFixed(1);
                    document.getElementById('exit-km-input').value = trip.exit_km;
                }

                if (this.activeTab === 'ruta') {
                    setTimeout(() => this.startTracking(), 1000);
                }
                
            } else if (trip.status === 'pretrip_completed') {
                document.getElementById('profile-status').innerText = "Listo para salida";
                
                if (waitingMsg) waitingMsg.classList.remove('hidden');
                if (activePanel) activePanel.classList.add('hidden');
                this.stopTracking();
            } else if (trip.status === 'driver_accepted') {
                document.getElementById('profile-status').innerText = "Completa checklist pre-viaje";
                
                if (waitingMsg) waitingMsg.classList.add('hidden');
                if (activePanel) activePanel.classList.add('hidden');
                this.stopTracking();
                
                // Redirigir a pre-viaje si no está completado
                if (this.activeTab !== 'pretrip') {
                    this.switchTab('pretrip');
                }
            } else if (trip.status === 'workshop_delivered') {
                document.getElementById('profile-status').innerText = "En Taller";
                
                if (waitingMsg) waitingMsg.classList.remove('hidden');
                if (activePanel) activePanel.classList.add('hidden');
                this.stopTracking();
                
                if (trip.delivery_details) {
                    document.getElementById('delivery-km-display').innerText = trip.delivery_details.km + ' km';
                    document.getElementById('delivery-fuel-display').innerText = trip.delivery_details.fuel + ' L';
                    document.getElementById('delivery-time-display').innerText = new Date(trip.delivery_details.time).toLocaleTimeString();
                    document.getElementById('delivery-data-container').classList.remove('hidden');
                }
                
                if (trip.delivery_details?.photo) {
                    this.displayDeliveryPhoto(trip.delivery_details.photo);
                }
            } else {
                document.getElementById('profile-status').innerText = "Trámite Interno";
                if (waitingMsg) waitingMsg.classList.remove('hidden');
                if (activePanel) activePanel.classList.add('hidden');
                this.stopTracking();
            }
        }

        // Renderizar checklists
        const preTripCont = document.getElementById('pretrip-content');
        const checkCont = document.getElementById('checklist-content');
        
        if (trip) {
            this.renderPreTripChecklist(trip, preTripCont);
            this.renderWorkshopChecklist(trip, checkCont);
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
        this.switchTab('pretrip');
    }

    // ==================== NUEVO: CHECKLIST PRE-VIAJE ====================
    renderPreTripChecklist(trip, container) {
        if (trip.status !== 'driver_accepted' && trip.status !== 'requested') {
            container.innerHTML = '';
            return;
        }

        const pretripItems = [
            { id: 'license', label: 'Licencia vigente', icon: 'badge' },
            { id: 'uniform', label: 'Uniforme completo', icon: 'checkroom' },
            { id: 'health', label: 'Salud óptima', icon: 'favorite' },
            { id: 'vehicle_clean', label: 'Vehículo limpio', icon: 'spray' },
            { id: 'mirrors', label: 'Espejos ajustados', icon: 'settings' },
            { id: 'seatbelt', label: 'Cinturón de seguridad', icon: 'seat' },
            { id: 'brakes', label: 'Frenos funcionando', icon: 'car_crash' },
            { id: 'lights', label: 'Luces funcionando', icon: 'light' },
            { id: 'tires', label: 'Llantas en buen estado', icon: 'tire_repair' }
        ];

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl">
                    <h4 class="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">checklist</span>
                        Checklist de Salida
                    </h4>
                    
                    <div class="space-y-3 mb-6">
                        ${pretripItems.map(item => `
                            <label class="flex items-center gap-3 p-2 bg-[#1c2127] rounded-lg cursor-pointer">
                                <input type="checkbox" id="pretrip-${item.id}" class="pretrip-checkbox w-5 h-5 accent-primary">
                                <span class="material-symbols-outlined text-[#92adc9] text-sm">${item.icon}</span>
                                <span class="text-white text-sm flex-1">${item.label}</span>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl mb-4">
                        <h5 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Fotos de la unidad</h5>
                        <p class="text-[10px] text-slate-500 mb-3">Toma fotos de los 4 costados, adelante y atrás</p>
                        
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <button onclick="window.conductorModule.takePreTripPhoto('front')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_upward</span>
                                Frente
                            </button>
                            <button onclick="window.conductorModule.takePreTripPhoto('back')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_downward</span>
                                Atrás
                            </button>
                            <button onclick="window.conductorModule.takePreTripPhoto('left')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_left</span>
                                Lado izquierdo
                            </button>
                            <button onclick="window.conductorModule.takePreTripPhoto('right')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_right</span>
                                Lado derecho
                            </button>
                        </div>
                        
                        <div id="pretrip-photos-grid" class="grid grid-cols-3 gap-2 mt-3">
                            <!-- Las fotos se insertarán aquí dinámicamente -->
                        </div>
                    </div>
                    
                    <button id="btn-complete-pretrip" 
                            onclick="window.conductorModule.completePreTrip('${trip.id}')" 
                            class="w-full py-5 bg-primary text-white font-black rounded-xl uppercase text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled>
                        COMPLETAR CHECKLIST
                    </button>
                </div>
            </div>
        `;

        // Validar que todos los checkboxes estén marcados
        const checkboxes = document.querySelectorAll('.pretrip-checkbox');
        const btnComplete = document.getElementById('btn-complete-pretrip');
        
        const validatePreTrip = () => {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const hasPhotos = this.preTripPhotoFiles.length >= 6; // 4 costados + frente + atrás
            btnComplete.disabled = !(allChecked && hasPhotos);
        };

        checkboxes.forEach(cb => {
            cb.addEventListener('change', validatePreTrip);
        });
    }

    takePreTripPhoto(position) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validar imagen
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona una imagen válida');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB');
                return;
            }
            
            // Guardar foto
            this.preTripPhotoFiles.push({ file, position });
            
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const grid = document.getElementById('pretrip-photos-grid');
                const photoDiv = document.createElement('div');
                photoDiv.className = 'relative group';
                photoDiv.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-20 object-cover rounded-lg border-2 border-primary/30">
                    <span class="absolute top-1 left-1 text-[8px] bg-black/70 text-white px-1 py-0.5 rounded">${position}</span>
                    <button onclick="this.parentElement.remove()" class="absolute top-1 right-1 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                `;
                grid.appendChild(photoDiv);
            };
            reader.readAsDataURL(file);
            
            // Validar completado
            const btnComplete = document.getElementById('btn-complete-pretrip');
            const checkboxes = document.querySelectorAll('.pretrip-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            btnComplete.disabled = !(allChecked && this.preTripPhotoFiles.length >= 6);
        };
        
        input.click();
    }

    async completePreTrip(tripId) {
        const btn = document.getElementById('btn-complete-pretrip');
        btn.innerHTML = 'PROCESANDO...';
        btn.disabled = true;
        
        try {
            const bucketName = 'trip-photos';
            const photoPaths = [];
            
            // Subir todas las fotos
            for (let i = 0; i < this.preTripPhotoFiles.length; i++) {
                const { file, position } = this.preTripPhotoFiles[i];
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${this.userId}/${tripId}/pretrip_${position}_${Date.now()}_${i}.${fileExt}`;
                
                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, file);
                    
                if (!error) {
                    photoPaths.push({ position, path: fileName });
                }
            }
            
            // Obtener valores de checkboxes
            const checkboxes = document.querySelectorAll('.pretrip-checkbox');
            const checklistValues = {};
            checkboxes.forEach(cb => {
                const id = cb.id.replace('pretrip-', '');
                checklistValues[id] = cb.checked;
            });
            
            // Actualizar viaje
            const { error } = await supabase
                .from('trips')
                .update({
                    status: 'pretrip_completed',
                    pretrip_checklist: {
                        completed_at: new Date().toISOString(),
                        items: checklistValues,
                        photos: photoPaths
                    },
                    request_details: {
                        ...(this.currentTrip?.request_details || {}),
                        pretrip_completed: true,
                        pretrip_time: new Date().toISOString()
                    }
                })
                .eq('id', tripId);
                
            if (error) throw error;
            
            this.showNotification('Checklist completado', 'Ya puedes pasar con el guardia', 'success');
            setTimeout(() => this.loadDashboardState(), 1000);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al completar checklist');
            btn.innerHTML = 'COMPLETAR CHECKLIST';
            btn.disabled = false;
        }
    }

    // ==================== CHECKLIST DE TALLER (RECEPCIÓN POST-VIAJE) ====================
    renderWorkshopChecklist(trip, container) {
        if (trip.status !== 'in_progress') {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl">
                    <h4 class="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-orange-500">engineering</span>
                        Checklist de Recepción en Taller
                    </h4>
                    
                    <!-- Verificaciones técnicas -->
                    <div class="bg-[#1c2127] p-4 rounded-xl mb-4">
                        <h5 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Verificaciones técnicas</h5>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="check-liquid" class="workshop-checkbox accent-primary">
                                <span class="text-white text-xs">Líquido de frenos</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="check-oil" class="workshop-checkbox accent-primary">
                                <span class="text-white text-xs">Aceite</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="check-coolant" class="workshop-checkbox accent-primary">
                                <span class="text-white text-xs">Anticongelante</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="check-lights" class="workshop-checkbox accent-primary">
                                <span class="text-white text-xs">Luces</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="check-tires" class="workshop-checkbox accent-primary">
                                <span class="text-white text-xs">Llantas</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Fotos de la unidad -->
                    <div class="bg-[#1c2127] p-4 rounded-xl mb-4">
                        <h5 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Fotos de la unidad</h5>
                        <p class="text-[10px] text-slate-500 mb-3">Toma fotos de los 4 costados, adelante y atrás</p>
                        
                        <div class="grid grid-cols-2 gap-3 mb-3">
                            <button onclick="window.conductorModule.takeWorkshopPhoto('front')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_upward</span>
                                Frente
                            </button>
                            <button onclick="window.conductorModule.takeWorkshopPhoto('back')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_downward</span>
                                Atrás
                            </button>
                            <button onclick="window.conductorModule.takeWorkshopPhoto('left')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_left</span>
                                Lado izquierdo
                            </button>
                            <button onclick="window.conductorModule.takeWorkshopPhoto('right')" class="p-3 bg-[#233648] rounded-lg text-white text-xs">
                                <span class="material-symbols-outlined text-sm block mb-1">arrow_right</span>
                                Lado derecho
                            </button>
                        </div>
                        
                        <div id="workshop-photos-grid" class="grid grid-cols-3 gap-2 mt-3"></div>
                    </div>
                    
                    <!-- Foto del conductor con la unidad -->
                    <div class="bg-[#1c2127] p-4 rounded-xl mb-4">
                        <h5 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Foto del conductor con la unidad</h5>
                        <button onclick="window.conductorModule.takeDriverPhoto()" class="w-full p-4 bg-[#233648] rounded-lg text-white text-sm flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">add_a_photo</span>
                            Tomar foto
                        </button>
                        <div id="driver-photo-preview" class="hidden mt-3">
                            <img id="driver-photo-img" class="w-full rounded-lg border-2 border-primary/30">
                        </div>
                    </div>
                    
                    <!-- Incidentes no reportados -->
                    <div class="bg-[#1c2127] p-4 rounded-xl mb-4">
                        <h5 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Incidentes no reportados</h5>
                        <textarea id="unreported-incidents" rows="3" 
                                  class="w-full bg-[#111a22] border border-[#324d67] text-white p-3 rounded-xl text-sm"
                                  placeholder="Describe cualquier incidente que no haya sido reportado durante el viaje..."></textarea>
                    </div>
                    
                    <button id="btn-complete-workshop" 
                            onclick="window.conductorModule.completeWorkshop('${trip.id}')" 
                            class="w-full py-5 bg-orange-600 text-white font-black rounded-xl uppercase text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled>
                        COMPLETAR RECEPCIÓN
                    </button>
                </div>
            </div>
        `;

        // Validación del checklist
        const workshopCheckboxes = document.querySelectorAll('.workshop-checkbox');
        const btnComplete = document.getElementById('btn-complete-workshop');
        
        const validateWorkshop = () => {
            const allChecked = Array.from(workshopCheckboxes).every(cb => cb.checked);
            const hasPhotos = this.workshopPhotos?.length >= 5; // 4 costados + frente/atrás
            const hasDriverPhoto = this.driverPhotoFile;
            btnComplete.disabled = !(allChecked && hasPhotos && hasDriverPhoto);
        };

        workshopCheckboxes.forEach(cb => {
            cb.addEventListener('change', validateWorkshop);
        });
    }

    takeWorkshopPhoto(position) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona una imagen válida');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB');
                return;
            }
            
            if (!this.workshopPhotos) this.workshopPhotos = [];
            this.workshopPhotos.push({ file, position });
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const grid = document.getElementById('workshop-photos-grid');
                const photoDiv = document.createElement('div');
                photoDiv.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-16 object-cover rounded-lg border-2 border-primary/30">
                `;
                grid.appendChild(photoDiv);
            };
            reader.readAsDataURL(file);
            
            // Validar
            const checkboxes = document.querySelectorAll('.workshop-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const btnComplete = document.getElementById('btn-complete-workshop');
            btnComplete.disabled = !(allChecked && this.workshopPhotos.length >= 5 && this.driverPhotoFile);
        };
        
        input.click();
    }

    takeDriverPhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona una imagen válida');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar los 5MB');
                return;
            }
            
            this.driverPhotoFile = file;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('driver-photo-preview');
                const img = document.getElementById('driver-photo-img');
                img.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            
            // Validar
            const checkboxes = document.querySelectorAll('.workshop-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const btnComplete = document.getElementById('btn-complete-workshop');
            btnComplete.disabled = !(allChecked && this.workshopPhotos?.length >= 5 && this.driverPhotoFile);
        };
        
        input.click();
    }

    async completeWorkshop(tripId) {
        const btn = document.getElementById('btn-complete-workshop');
        btn.innerHTML = 'PROCESANDO...';
        btn.disabled = true;
        
        try {
            const bucketName = 'trip-photos';
            const workshopPhotos = [];
            
            // Subir fotos del taller
            if (this.workshopPhotos) {
                for (let i = 0; i < this.workshopPhotos.length; i++) {
                    const { file, position } = this.workshopPhotos[i];
                    const fileExt = file.name.split('.').pop() || 'jpg';
                    const fileName = `${this.userId}/${tripId}/workshop_${position}_${Date.now()}_${i}.${fileExt}`;
                    
                    const { error } = await supabase.storage
                        .from(bucketName)
                        .upload(fileName, file);
                        
                    if (!error) {
                        workshopPhotos.push({ position, path: fileName });
                    }
                }
            }
            
            // Subir foto del conductor
            let driverPhotoPath = null;
            if (this.driverPhotoFile) {
                const fileExt = this.driverPhotoFile.name.split('.').pop() || 'jpg';
                driverPhotoPath = `${this.userId}/${tripId}/driver_${Date.now()}.${fileExt}`;
                
                await supabase.storage
                    .from(bucketName)
                    .upload(driverPhotoPath, this.driverPhotoFile);
            }
            
            // Obtener incidentes no reportados
            const unreportedIncidents = document.getElementById('unreported-incidents').value;
            
            // Actualizar viaje
            const { error } = await supabase
                .from('trips')
                .update({
                    status: 'completed',
                    workshop_checklist: {
                        completed_at: new Date().toISOString(),
                        liquid: document.getElementById('check-liquid').checked,
                        oil: document.getElementById('check-oil').checked,
                        coolant: document.getElementById('check-coolant').checked,
                        lights: document.getElementById('check-lights').checked,
                        tires: document.getElementById('check-tires').checked,
                        photos: workshopPhotos,
                        driver_photo: driverPhotoPath,
                        unreported_incidents: unreportedIncidents
                    },
                    entry_km: this.tripLogistics.totalDistance + (this.currentTrip?.exit_km || 0),
                    return_details: {
                        ...(this.currentTrip?.return_details || {}),
                        workshop_time: new Date().toISOString(),
                        workshop_completed: true,
                        unreported_incidents: unreportedIncidents
                    }
                })
                .eq('id', tripId);
                
            if (error) throw error;
            
            // Si hay incidentes no reportados, guardarlos
            if (unreportedIncidents) {
                await supabase.from('incidents').insert({
                    trip_id: tripId,
                    driver_id: this.userId,
                    incident_type: 'unreported',
                    description: unreportedIncidents,
                    reported_at: new Date().toISOString(),
                    reported_by: 'workshop',
                    status: 'reported'
                });
            }
            
            this.showNotification('Recepción completada', 'Unidad entregada correctamente', 'success');
            setTimeout(() => this.loadDashboardState(), 1000);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error al completar recepción');
            btn.innerHTML = 'COMPLETAR RECEPCIÓN';
            btn.disabled = false;
        }
    }

    // ==================== MÉTODOS DE FOTOS EXISTENTES ====================
    async viewReceptionPhoto() {
        if (!this.currentTrip?.reception_photo_path) return;
        
        try {
            const { data, error } = await supabase.storage
                .from('trip-photos')
                .createSignedUrl(this.currentTrip.reception_photo_path, 60);
            
            if (error) throw error;
            
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error) {
            console.error('Error al ver foto:', error);
        }
    }

    async viewDeliveryPhoto() {
        const deliveryPhoto = this.currentTrip?.delivery_details?.photo;
        if (!deliveryPhoto) return;
        
        try {
            const { data, error } = await supabase.storage
                .from('trip-photos')
                .createSignedUrl(deliveryPhoto, 60);
            
            if (error) throw error;
            
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error) {
            console.error('Error al ver foto:', error);
        }
    }

    async displayReceptionPhoto() {
        if (!this.currentTrip?.reception_photo_path) return;
        
        try {
            const { data, error } = await supabase.storage
                .from('trip-photos')
                .createSignedUrl(this.currentTrip.reception_photo_path, 300);
            
            if (error) throw error;
            
            if (data?.signedUrl) {
                document.getElementById('reception-photo-display').src = data.signedUrl;
                document.getElementById('reception-photo-container').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al mostrar foto:', error);
        }
    }

    async displayDeliveryPhoto(photoPath) {
        try {
            const { data, error } = await supabase.storage
                .from('trip-photos')
                .createSignedUrl(photoPath, 300);
            
            if (error) throw error;
            
            if (data?.signedUrl) {
                document.getElementById('delivery-photo-display').src = data.signedUrl;
                document.getElementById('delivery-photo-container').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al mostrar foto:', error);
        }
    }

    renderAccessCode(trip) {
        const container = document.getElementById('access-code-container');
        
        if (trip && (trip.status === 'driver_accepted' || trip.status === 'pretrip_completed' || trip.status === 'in_progress' || trip.status === 'workshop_delivered')) {
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

        if (tabId === 'perfil') {
            if (this.currentTrip?.reception_photo_path) {
                this.displayReceptionPhoto();
            }
            if (this.currentTrip?.delivery_details?.photo) {
                this.displayDeliveryPhoto(this.currentTrip.delivery_details.photo);
            }
        }

        if (tabId === 'ruta' && this.currentTrip?.status === 'in_progress') {
            setTimeout(() => this.startTracking(), 500);
        }
    }
}

// Función global de respaldo
window.logoutDriver = function() {
    if (window.conductorModule && typeof window.conductorModule.logout === 'function') {
        window.conductorModule.logout();
    } else {
        localStorage.clear();
        window.location.hash = '#login';
        window.location.reload();
    }
};
