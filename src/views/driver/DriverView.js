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
        this.selectedVehicleForRequest = null;
        this.profile = null;
        this.signaturePad = null;
        this.accessCode = null; // Para almacenar el código generado
        
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
            requestDetails: {},
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
            workshopAccepted: false
        };
        
        // Archivos de fotos
        this.receptionPhotoFile = null;
        this.deliveryPhotoFile = null;
        
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
                    
                    <!-- PESTAÑA UNIDAD - Selección de unidad -->
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70 px-1">Unidades Disponibles</h3>
                        
                        <!-- Loader -->
                        <div id="unidad-loader" class="flex justify-center py-10 hidden">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        
                        <!-- Si no hay viaje activo, mostrar selector de unidades -->
                        <div id="unidad-content" class="space-y-3"></div>
                        
                        <!-- Mensaje cuando no hay unidades -->
                        <div id="no-units-message" class="hidden text-slate-500 text-center py-10 border border-dashed border-[#233648] rounded-xl">
                            <span class="material-symbols-outlined text-4xl mb-2">directions_car_off</span>
                            <p class="text-sm">Sin unidades activas</p>
                        </div>
                        
                        <!-- Si hay viaje en progreso, mostrar info de la unidad actual -->
                        <div id="current-trip-info" class="hidden">
                            <div class="bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/30 p-5 rounded-2xl text-center backdrop-blur-sm">
                                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Unidad Actual</p>
                                <h2 id="current-vehicle-plate" class="text-4xl font-black text-white leading-none">--</h2>
                                <p id="current-vehicle-model" class="text-sm text-[#92adc9] mt-2">--</p>
                                <div class="mt-4 flex justify-center">
                                    <span id="trip-status-badge" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Código de acceso para mostrar cuando el viaje está aprobado -->
                        <div id="access-code-container" class="hidden mt-4 bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-2xl animate-pulse">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-white text-[8px] font-bold uppercase opacity-80">Código de acceso para guardia</p>
                                    <p id="access-code-display" class="text-white text-3xl font-mono font-black tracking-widest">------</p>
                                </div>
                                <span class="material-symbols-outlined text-4xl text-white/50">qr_code_scanner</span>
                            </div>
                            <p class="text-green-200 text-[8px] mt-2">Muestra este código al guardia al salir</p>
                        </div>
                    </section>

                    <!-- PESTAÑA SOLICITUD - Formulario para pedir unidad -->
                    <section id="tab-solicitud" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">assignment</span> Solicitar Unidad
                            </h3>
                            
                            <div id="solicitud-form" class="space-y-4">
                                <div class="bg-primary/10 p-3 rounded-xl border border-primary/30 mb-2">
                                    <p class="text-[10px] text-primary uppercase font-bold">Conductor</p>
                                    <p id="conductor-nombre" class="text-white font-bold">Cargando...</p>
                                </div>

                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Seleccionar Unidad *</label>
                                    <select id="solicitud-vehicle" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl">
                                        <option value="">Seleccionar unidad...</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Ubicación de Destino *</label>
                                    <input type="text" id="solicitud-destino" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" 
                                           placeholder="Ej: Zona industrial, Centro, etc.">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Motivo del Viaje *</label>
                                    <select id="solicitud-motivo" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl">
                                        <option value="">Seleccionar motivo...</option>
                                        <option value="Entrega">Entrega de mercancía</option>
                                        <option value="Recolección">Recolección</option>
                                        <option value="Mantenimiento">Llevar a taller</option>
                                        <option value="Traslado">Traslado interno</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Jefe Directo *</label>
                                    <input type="text" id="solicitud-jefe" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" 
                                           placeholder="Nombre del jefe directo">
                                </div>
                                
                                <!-- Último checklist de la unidad seleccionada -->
                                <div id="last-checklist-container" class="hidden bg-[#111a22] p-4 rounded-xl border border-[#324d67] mt-4">
                                    <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Último checklist de esta unidad</h4>
                                    <div id="last-checklist-content" class="text-sm text-white">
                                        Selecciona una unidad para ver su último checklist
                                    </div>
                                </div>
                                
                                <button onclick="window.conductorModule.enviarSolicitud()" 
                                        class="w-full py-5 bg-primary text-white font-black rounded-xl uppercase text-lg shadow-[0_0_30px_rgba(19,127,236,0.3)] mt-4">
                                    ENVIAR SOLICITUD
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- PESTAÑA TALLER - Recepción inicial en taller -->
                    <section id="tab-taller-inicial" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-orange-500">engineering</span> Recepción en Taller
                            </h3>
                            
                            <div id="taller-inicial-content" class="space-y-4">
                                <div class="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-4xl text-orange-500 mb-2">info</span>
                                    <p class="text-white text-sm">Tu solicitud fue aprobada. Debes pasar a taller para la revisión inicial.</p>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Unidad asignada</p>
                                    <h4 id="taller-vehicle-info" class="text-white font-bold text-lg">--</h4>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Instrucciones</p>
                                    <p class="text-white text-sm">Espera a que el mecánico realice la revisión y tome las fotos correspondientes.</p>
                                    <p class="text-[#92adc9] text-xs mt-2">Una vez completada la recepción, podrás firmar y continuar.</p>
                                </div>
                                
                                <div id="firma-recepcion-container" class="hidden mt-4">
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Firma de recepción</label>
                                    <canvas id="signature-pad" class="w-full h-32 bg-[#1c2127] border border-[#324d67] rounded-xl touch-none"></canvas>
                                    <div class="flex gap-2 mt-2">
                                        <button onclick="window.conductorModule.clearSignature()" 
                                                class="flex-1 py-2 bg-[#233648] text-white rounded-lg text-xs uppercase">
                                            Limpiar
                                        </button>
                                    </div>
                                    
                                    <button id="btn-confirmar-recepcion" 
                                            onclick="window.conductorModule.confirmarRecepcionTaller()" 
                                            class="w-full mt-4 py-5 bg-orange-600 text-white font-black rounded-xl uppercase text-lg disabled:opacity-50"
                                            disabled>
                                        FIRMAR RECEPCIÓN
                                    </button>
                                </div>
                            </div>
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

                    <!-- PESTAÑA TALLER FINAL - Recepción post-viaje -->
                    <section id="tab-taller-final" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-purple-500">assignment_turned_in</span> Entrega en Taller
                            </h3>
                            
                            <div id="taller-final-content" class="space-y-4">
                                <div class="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-4xl text-purple-500 mb-2">info</span>
                                    <p class="text-white text-sm">Tu viaje ha terminado. Debes pasar a taller para la revisión final.</p>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Resumen del viaje</p>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-white">Distancia:</span>
                                        <span id="resumen-distancia" class="text-primary font-bold">0 km</span>
                                    </div>
                                    <div class="flex justify-between text-xs mt-1">
                                        <span class="text-white">Combustible:</span>
                                        <span id="resumen-combustible" class="text-primary font-bold">0 L</span>
                                    </div>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Instrucciones</p>
                                    <p class="text-white text-sm">Espera a que el mecánico realice la revisión final de la unidad.</p>
                                    <p class="text-[#92adc9] text-xs mt-2">Una vez completada la revisión, se liberará la unidad.</p>
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

                            <!-- Fotos de recepción -->
                            <div id="reception-photo-container" class="hidden mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-2">Foto de Recepción</h4>
                                <img id="reception-photo-display" class="w-full rounded-xl border-2 border-primary/30 cursor-pointer" 
                                     onclick="window.conductorModule.viewReceptionPhoto()"
                                     src="" alt="Foto de recepción">
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
                    <button onclick="window.conductorModule.switchTab('solicitud')" id="nav-solicitud" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">assignment</span>
                        <span class="text-[9px] font-bold uppercase">Solicitar</span>
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
                        <h3 class="text-white font-bold text-lg mb-2">Reporte de Incidente</h3>
                        <p class="text-[#92adc9] text-sm mb-6">Describe la situación de emergencia</p>
                        
                        <div class="space-y-3">
                            <textarea id="emergency-desc" rows="3" 
                                      class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl"
                                      placeholder="Describe lo sucedido..."></textarea>
                            
                            <button onclick="window.conductorModule.activateEmergency()" 
                                    class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase text-sm">
                                REPORTAR EMERGENCIA
                            </button>
                            <button onclick="document.getElementById('modal-emergency').classList.add('hidden')" 
                                    class="w-full py-3 text-[#92adc9] hover:text-white transition-colors text-xs uppercase">
                                Cancelar
                            </button>
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

    // ==================== MÉTODOS PRINCIPALES ====================

    async onMount() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                console.log('❌ No hay sesión activa, redirigiendo a login');
                window.location.hash = '#login';
                return;
            }
            
            this.userId = session.user.id;
            console.log('✅ Usuario autenticado:', this.userId);
            
            // Verificar que el userId no sea null
            if (!this.userId) {
                console.error('❌ userId es null después de la autenticación');
                window.location.hash = '#login';
                return;
            }
            
            await this.loadProfileData();
            await this.loadDashboardState();
            this.setupEventListeners();
            
            this.startBackgroundSync();

            // Configurar suscripción en tiempo real - IMPORTANTE para actualización automática
            supabase.channel('driver_realtime_' + this.userId)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'trips', 
                    filter: `driver_id=eq.${this.userId}` 
                }, async (payload) => {
                    console.log('🔄 Cambio detectado en viaje:', payload);
                    
                    if (payload.new) {
                        await this.handleTripUpdate(payload.new);
                        
                        // Mostrar código de acceso cuando el viaje está aprobado
                        if (payload.new.status === 'driver_accepted' && payload.new.access_code) {
                            this.showAccessCode(payload.new.access_code);
                        }
                    }
                })
                .subscribe();
                
            // Configurar actualización periódica (cada 5 segundos)
            this.updateInterval = setInterval(async () => {
                if (navigator.onLine) {
                    await this.loadDashboardState();
                }
            }, 5000);
                
        } catch (error) {
            console.error('❌ Error en onMount:', error);
            window.location.hash = '#login';
        }
    }

    // ==================== SISTEMA DE NOTIFICACIONES ====================
    
    showNotification(title, message, type = 'info') {
        const modal = document.getElementById('notification-modal');
        const content = document.getElementById('notification-content');
        
        if (!modal || !content) return;
        
        const colors = { 
            info: 'primary', 
            success: 'green-500', 
            warning: 'orange-500', 
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
        this.backgroundSyncInterval = setInterval(() => {
            if (this.pendingLocations.length > 0 && navigator.onLine) {
                this.syncPendingLocations();
            }
        }, 30000);
        
        window.addEventListener('online', () => {
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
                this.pendingLocations = [...locations, ...this.pendingLocations];
            }
        } catch (error) {
            this.pendingLocations = [...locations, ...this.pendingLocations];
        }
    }

    // ==================== MANEJADOR DE ACTUALIZACIONES ====================
    
    async handleTripUpdate(updatedTrip) {
        const previousStatus = this.currentTrip?.status;
        this.currentTrip = updatedTrip;
        
        switch(updatedTrip.status) {
            case 'approved_for_taller':
                this.showNotification('Solicitud aprobada', 'Dirígete a taller para la recepción inicial', 'success');
                this.switchTab('taller-inicial');
                break;
                
            case 'driver_accepted':
                this.showNotification('Recepción completada', 'Ya puedes pasar con el guardia para la salida', 'success');
                if (updatedTrip.access_code) {
                    this.showAccessCode(updatedTrip.access_code);
                }
                break;
                
            case 'in_progress':
                if (previousStatus !== 'in_progress') {
                    this.showNotification('Viaje iniciado', 'El guardia ha autorizado tu salida', 'success');
                    this.startTracking();
                }
                break;
                
            case 'returned':
                this.showNotification('Viaje terminado', 'Dirígete a taller para la revisión final', 'warning');
                this.stopTracking();
                this.switchTab('taller-final');
                this.cargarResumenViaje();
                break;
                
            case 'completed':
                this.showNotification('Unidad liberada', 'El taller ha completado la revisión', 'success');
                this.loadDashboardState();
                this.switchTab('unidad');
                break;
        }
        
        await this.loadDashboardState();
    }

    // ==================== MOSTRAR CÓDIGO DE ACCESO ====================
    
    showAccessCode(code) {
        const container = document.getElementById('access-code-container');
        const display = document.getElementById('access-code-display');
        
        if (container && display) {
            display.innerText = code;
            container.classList.remove('hidden');
            
            // Hacer que parpadee para llamar la atención
            setTimeout(() => {
                container.classList.add('opacity-90');
            }, 10000);
        }
    }

    // ==================== CONFIGURACIÓN ====================
    
    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (this.currentTrip?.status === 'in_progress') {
                console.log('GPS continúa en background');
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
            
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
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
        
        if (gpsIndicator) {
            gpsIndicator.innerHTML = `
                <div class="flex items-center justify-center gap-2 text-yellow-400">
                    <span class="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>
                    <span class="text-xs font-bold">Iniciando GPS...</span>
                </div>
            `;
        }

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

        const gpsIndicator = document.getElementById('gps-status-indicator');
        if (gpsIndicator) {
            gpsIndicator.innerHTML = `
                <div class="flex items-center justify-center gap-2 text-emerald-400">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span class="text-xs font-bold">GPS Activo - Enviando datos...</span>
                </div>
            `;
        }

        const gpsHeader = document.getElementById('gps-header-indicator');
        if (gpsHeader) {
            gpsHeader.innerHTML = `
                <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
            `;
        }
    }

    handlePositionUpdate(pos) {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = new Date();
        const speedKmh = Math.round((speed || 0) * 3.6);

        const speedEl = document.getElementById('live-speed');
        if (speedEl) speedEl.innerText = `${speedKmh} km/h`;

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
                
                const distanceEl = document.getElementById('live-distance');
                if (distanceEl) distanceEl.innerText = this.tripLogistics.totalDistance.toFixed(1);
                
                const fuelEl = document.getElementById('live-fuel');
                if (fuelEl) fuelEl.innerText = fuelConsumption.toFixed(1);
                
                const summaryDistance = document.getElementById('summary-distance');
                if (summaryDistance) summaryDistance.innerText = this.tripLogistics.totalDistance.toFixed(1) + ' km';
                
                const summaryFuel = document.getElementById('summary-fuel');
                if (summaryFuel) summaryFuel.innerText = fuelConsumption.toFixed(1) + ' L';
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
            
            const durationEl = document.getElementById('trip-duration');
            if (durationEl) {
                durationEl.innerText = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
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
        if (!gpsIndicator) return;
        
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

        const gpsHeader = document.getElementById('gps-header-indicator');
        if (gpsHeader) {
            gpsHeader.innerHTML = `
                <span class="relative rounded-full h-2 w-2 bg-red-500"></span>
            `;
        }
    }

    stopTracking() {
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
            
            const gpsIndicator = document.getElementById('gps-status-indicator');
            if (gpsIndicator) {
                gpsIndicator.innerHTML = `
                    <div class="flex items-center justify-center gap-2 text-slate-400">
                        <span class="material-symbols-outlined">gps_fixed</span>
                        <span class="text-xs font-bold">GPS Detenido</span>
                    </div>
                `;
            }

            const gpsHeader = document.getElementById('gps-header-indicator');
            if (gpsHeader) {
                gpsHeader.innerHTML = `
                    <span class="relative rounded-full h-2 w-2 bg-slate-500"></span>
                `;
            }
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

    // ==================== FUNCIONES DE SOLICITUD ====================
    
    async loadAvailableUnits() {
        try {
            const { data: vehs, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('status', 'active');
                
            if (error) throw error;
            
            const select = document.getElementById('solicitud-vehicle');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar unidad...</option>' + 
                    (vehs?.map(v => `<option value="${v.id}">ECO-${v.economic_number} - ${v.plate} (${v.model})</option>`).join('') || '');
            }
        } catch (error) {
            console.error('Error cargando unidades:', error);
        }
    }

    async loadAvailableUnitsForMainView() {
        const container = document.getElementById('unidad-content');
        const loader = document.getElementById('unidad-loader');
        const noUnitsMsg = document.getElementById('no-units-message');
        
        if (!container) return;
        
        if (loader) loader.classList.remove('hidden');
        if (container) container.classList.add('hidden');
        if (noUnitsMsg) noUnitsMsg.classList.add('hidden');
        
        try {
            const { data: vehs, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('status', 'active');
                
            if (error) throw error;
            
            if (!vehs || vehs.length === 0) {
                if (noUnitsMsg) noUnitsMsg.classList.remove('hidden');
            } else {
                if (container) {
                    container.classList.remove('hidden');
                    container.innerHTML = vehs.map(v => `
                        <div onclick="window.conductorModule.selectVehicleForRequest('${v.id}', '${v.plate}', '${v.model}', '${v.economic_number}')" 
                             class="bg-gradient-to-r from-[#192633] to-[#1a2533] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary hover:scale-[1.02] transition-all active:scale-95">
                            <div>
                                <p class="text-white font-black text-lg">${v.plate}</p>
                                <p class="text-[10px] text-[#92adc9] mt-1">${v.model} · ECO-${v.economic_number}</p>
                            </div>
                            <button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-lg">
                                Solicitar
                            </button>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error cargando unidades:', error);
            if (noUnitsMsg) {
                noUnitsMsg.innerHTML = '<span class="material-symbols-outlined text-4xl mb-2 text-red-500">error</span><p class="text-sm">Error de conexión</p>';
                noUnitsMsg.classList.remove('hidden');
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    }

    async loadLastChecklist(vehicleId) {
        if (!vehicleId) return;
        
        try {
            const { data: lastTrip, error } = await supabase
                .from('trips')
                .select('workshop_checklist, completed_at')
                .eq('vehicle_id', vehicleId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const container = document.getElementById('last-checklist-container');
            const content = document.getElementById('last-checklist-content');
            
            if (!container || !content) return;
            
            if (error || !lastTrip?.workshop_checklist) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
            const check = lastTrip.workshop_checklist;
            
            content.innerHTML = `
                <div class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <span class="text-${check.liquid ? 'green' : 'red'}-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.liquid ? 'check_circle' : 'cancel'}</span> Líquido
                        </span>
                        <span class="text-${check.oil ? 'green' : 'red'}-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.oil ? 'check_circle' : 'cancel'}</span> Aceite
                        </span>
                        <span class="text-${check.coolant ? 'green' : 'red'}-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.coolant ? 'check_circle' : 'cancel'}</span> Anticongelante
                        </span>
                        <span class="text-${check.lights ? 'green' : 'red'}-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.lights ? 'check_circle' : 'cancel'}</span> Luces
                        </span>
                        <span class="text-${check.tires ? 'green' : 'red'}-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.tires ? 'check_circle' : 'cancel'}</span> Llantas
                        </span>
                    </div>
                    <p class="text-[10px] text-[#92adc9] mt-2">Fecha: ${new Date(lastTrip.completed_at).toLocaleDateString()}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando checklist:', error);
            const container = document.getElementById('last-checklist-container');
            if (container) container.classList.add('hidden');
        }
    }

    selectVehicleForRequest(vehicleId, plate, model, eco) {
        this.selectedVehicleForRequest = { id: vehicleId, plate, model, eco };
        this.switchTab('solicitud');
        
        setTimeout(() => {
            const select = document.getElementById('solicitud-vehicle');
            if (select) {
                select.value = vehicleId;
                this.loadLastChecklist(vehicleId);
            }
        }, 500);
    }

    // ==================== MÉTODO ENVIAR SOLICITUD CORREGIDO ====================

    async enviarSolicitud() {
        // VERIFICACIÓN CRÍTICA: Asegurar que userId existe
        if (!this.userId) {
            console.error('❌ Error: userId es null');
            alert('Error de sesión. Por favor, recarga la página.');
            return;
        }

        const vehicleId = document.getElementById('solicitud-vehicle').value;
        const destino = document.getElementById('solicitud-destino').value;
        const motivo = document.getElementById('solicitud-motivo').value;
        const jefeDirecto = document.getElementById('solicitud-jefe').value;
        
        // Validaciones
        if (!vehicleId) {
            alert('Por favor selecciona una unidad');
            return;
        }
        
        if (!destino) {
            alert('Por favor ingresa el destino');
            document.getElementById('solicitud-destino').focus();
            return;
        }
        
        if (!motivo) {
            alert('Por favor selecciona el motivo del viaje');
            document.getElementById('solicitud-motivo').focus();
            return;
        }
        
        if (!jefeDirecto) {
            alert('Por favor ingresa el nombre del jefe directo');
            document.getElementById('solicitud-jefe').focus();
            return;
        }

        // Deshabilitar botón mientras se procesa
        const btn = document.querySelector('[onclick="window.conductorModule.enviarSolicitud()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'ENVIANDO...';
        }

        try {
            // Generar código de acceso (6 caracteres alfanuméricos)
            const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.accessCode = accessCode;
            
            // Crear objeto de solicitud - SOLO con las columnas que existen en la tabla
            const newTrip = {
                driver_id: this.userId,
                vehicle_id: vehicleId,
                status: 'requested',
                access_code: accessCode,
                destination: destino,
                supervisor: jefeDirecto,
                request_details: {
                    destination: destino,
                    motivo: motivo,
                    supervisor: jefeDirecto,
                    requested_at: new Date().toISOString(),
                    vehicle_id: vehicleId
                },
                created_at: new Date().toISOString()
            };

            console.log('📤 Enviando solicitud:', newTrip);

            const { data, error } = await supabase
                .from('trips')
                .insert([newTrip])
                .select();

            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }

            console.log('✅ Solicitud creada:', data);
            
            // Limpiar formulario
            document.getElementById('solicitud-destino').value = '';
            document.getElementById('solicitud-vehicle').value = '';
            document.getElementById('solicitud-motivo').value = '';
            document.getElementById('solicitud-jefe').value = '';
            
            // Ocultar el checklist
            const checklistContainer = document.getElementById('last-checklist-container');
            if (checklistContainer) checklistContainer.classList.add('hidden');
            
            this.showNotification('✅ Solicitud enviada', 'Espera la aprobación del supervisor', 'success');
            
            // Cambiar a la pestaña de unidad para ver el estado
            this.switchTab('unidad');
            
            // Recargar el estado del dashboard
            await this.loadDashboardState();

        } catch (error) {
            console.error('❌ Error enviando solicitud:', error);
            
            // Mostrar mensaje de error más específico
            let errorMessage = 'Error al enviar la solicitud';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }
            if (error.details) {
                errorMessage += ' (' + error.details + ')';
            }
            if (error.code) {
                errorMessage += ` (Código: ${error.code})`;
            }
            
            alert(errorMessage);
            this.showNotification('❌ Error', 'No se pudo enviar la solicitud', 'error');
            
        } finally {
            // Restaurar botón
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'ENVIAR SOLICITUD';
            }
        }
    }

    // ==================== FIRMA DE RECEPCIÓN EN TALLER ====================
    
    renderFirmaRecepcion() {
        const container = document.getElementById('firma-recepcion-container');
        if (!container) return;
        
        container.classList.remove('hidden');
        
        setTimeout(() => {
            const canvas = document.getElementById('signature-pad');
            if (canvas && window.SignaturePad) {
                this.signaturePad = new window.SignaturePad(canvas, {
                    backgroundColor: '#1c2127',
                    penColor: '#ffffff',
                    velocityFilterWeight: 0.7,
                    minWidth: 0.5,
                    maxWidth: 2.5
                });
                
                canvas.addEventListener('mouseup', () => this.validateSignature());
                canvas.addEventListener('touchend', () => this.validateSignature());
            }
        }, 500);
    }

    validateSignature() {
        const btn = document.getElementById('btn-confirmar-recepcion');
        if (btn) {
            btn.disabled = !(this.signaturePad && !this.signaturePad.isEmpty());
        }
    }

    clearSignature() {
        if (this.signaturePad) {
            this.signaturePad.clear();
            this.validateSignature();
        }
    }

    async confirmarRecepcionTaller() {
        if (!this.signaturePad || this.signaturePad.isEmpty()) {
            alert('Debes firmar de conformidad');
            return;
        }

        const btn = document.getElementById('btn-confirmar-recepcion');
        if (!btn) return;
        
        btn.disabled = true;
        btn.innerText = 'PROCESANDO...';

        try {
            const signatureData = this.signaturePad.toDataURL('image/png');

            const { error } = await supabase
                .from('trips')
                .update({
                    driver_signature: signatureData,
                    reception_confirmed_at: new Date().toISOString()
                })
                .eq('id', this.currentTrip.id);

            if (error) throw error;

            this.showNotification('Recepción confirmada', 'Ya puedes pasar con el guardia', 'success');
            this.switchTab('unidad');
            
        } catch (error) {
            console.error('Error confirmando recepción:', error);
            alert('Error: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'FIRMAR RECEPCIÓN';
        }
    }

    // ==================== RESUMEN POST-VIAJE ====================
    
    cargarResumenViaje() {
        const distanciaEl = document.getElementById('resumen-distancia');
        const combustibleEl = document.getElementById('resumen-combustible');
        
        if (distanciaEl) {
            distanciaEl.innerText = Math.round(this.tripLogistics.totalDistance) + ' km';
        }
        
        if (combustibleEl) {
            combustibleEl.innerText = Math.round(this.tripLogistics.totalDistance / 8) + ' L';
        }
    }

    // ==================== PERFIL Y ESTADO ====================
    
    async loadProfileData() {
        if (!this.userId) return;
        
        try {
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
                
                const profileName = document.getElementById('profile-name');
                if (profileName) profileName.innerText = p.full_name || 'Conductor';
                
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) profileAvatar.style.backgroundImage = `url('${p.photo_url || ''}')`;
                
                const cardName = document.getElementById('card-full-name');
                if (cardName) cardName.innerText = p.full_name || 'Conductor';
                
                const cardPhoto = document.getElementById('card-photo');
                if (cardPhoto) cardPhoto.style.backgroundImage = `url('${p.photo_url || ''}')`;
                
                const licNumber = document.getElementById('lic-number');
                if (licNumber) licNumber.innerText = p.license_number || 'No Registrada';
                
                const profileManager = document.getElementById('profile-manager');
                if (profileManager) profileManager.innerText = p.supervisor_name || 'Central COV';
                
                const profileRole = document.getElementById('profile-role');
                if (profileRole) profileRole.innerText = 'Conductor';

                // Mostrar nombre del conductor en el formulario de solicitud
                const conductorNombre = document.getElementById('conductor-nombre');
                if (conductorNombre) conductorNombre.innerText = p.full_name || 'Conductor';
            }
        } catch (error) {
            console.error('Error en loadProfileData:', error);
        }
    }

    async loadDashboardState() {
        if (!this.userId) {
            console.log('No hay userId, no se puede cargar dashboard');
            return;
        }
        
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select(`*, vehicles(*)`)
                .eq('driver_id', this.userId)
                .neq('status', 'closed')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            const trip = trips && trips.length > 0 ? trips[0] : null;
            this.currentTrip = trip;

            // Actualizar UI según el estado
            await this.updateUIByStatus(trip);
            
            // Cargar unidades disponibles si no hay viaje
            if (!trip) {
                await this.loadAvailableUnitsForMainView();
            }
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    async updateUIByStatus(trip) {
        const statusMap = {
            'requested': { text: 'Solicitud enviada', color: 'bg-yellow-500', tab: 'unidad' },
            'approved_for_taller': { text: 'Dirígete a taller', color: 'bg-orange-500', tab: 'taller-inicial' },
            'driver_accepted': { text: 'Listo para salida', color: 'bg-green-500', tab: 'unidad' },
            'in_progress': { text: 'En ruta', color: 'bg-primary', tab: 'ruta' },
            'returned': { text: 'Regresado - Ir a taller', color: 'bg-purple-500', tab: 'taller-final' },
            'completed': { text: 'Viaje completado', color: 'bg-emerald-500', tab: 'unidad' }
        };

        const titleUnits = document.querySelector('#tab-unidad h3');
        const unitsContent = document.getElementById('unidad-content');
        const noUnitsMsg = document.getElementById('no-units-message');
        const profileStatus = document.getElementById('profile-status');

        if (trip && statusMap[trip.status]) {
            const status = statusMap[trip.status];
            if (profileStatus) profileStatus.innerText = status.text;
            
            const badge = document.getElementById('trip-status-badge');
            if (badge) { 
                badge.innerText = status.text; 
                badge.className = `px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.color} text-white`; 
            }
            
            const plateEl = document.getElementById('current-vehicle-plate');
            if (plateEl) plateEl.innerText = trip.vehicles?.plate || '--';
            
            const modelEl = document.getElementById('current-vehicle-model');
            if (modelEl) modelEl.innerText = `${trip.vehicles?.model || ''} ECO-${trip.vehicles?.economic_number || ''}`;
            
            const currentTripInfo = document.getElementById('current-trip-info');
            if (currentTripInfo) currentTripInfo.classList.remove('hidden');
            
            if (titleUnits) titleUnits.classList.add('hidden');
            if (unitsContent) unitsContent.classList.add('hidden');
            if (noUnitsMsg) noUnitsMsg.classList.add('hidden');
            
            // Mostrar código de acceso si el viaje está en estado driver_accepted
            if (trip.status === 'driver_accepted' && trip.access_code) {
                this.showAccessCode(trip.access_code);
            }
            
            if (trip.status === 'approved_for_taller') {
                const tInfo = document.getElementById('taller-vehicle-info');
                if (tInfo) tInfo.innerText = `ECO-${trip.vehicles?.economic_number} - ${trip.vehicles?.plate}`;
            }
            
            if (trip.status === 'in_progress' && this.activeTab === 'ruta') {
                setTimeout(() => this.startTracking(), 500);
            }
            if (trip.status !== 'in_progress') {
                this.stopTracking();
            }
            
        } else {
            const currentTripInfo = document.getElementById('current-trip-info');
            if (currentTripInfo) currentTripInfo.classList.add('hidden');
            
            // Ocultar código de acceso
            const accessContainer = document.getElementById('access-code-container');
            if (accessContainer) accessContainer.classList.add('hidden');
            
            if (profileStatus) profileStatus.innerText = "Disponible";
            this.stopTracking();
            
            if (titleUnits) titleUnits.classList.remove('hidden');
            await this.loadAvailableUnitsForMainView();
        }
    }

    // ==================== FUNCIONES DEL VIAJE ====================
    
    async saveTripNotes() {
        const notes = document.getElementById('trip-notes')?.value;
        if (!notes || !this.currentTrip) return;

        if (!this.tripLogistics.notes) this.tripLogistics.notes = [];
        this.tripLogistics.notes.push({
            text: notes,
            timestamp: new Date().toISOString()
        });

        await this.updateTripInDatabase({
            notes: this.tripLogistics.notes
        });
        
        // Limpiar el textarea después de guardar
        const notesEl = document.getElementById('trip-notes');
        if (notesEl) notesEl.value = '';
        
        this.showNotification('Nota guardada', 'Se agregó al registro del viaje', 'success');
    }

    async activateEmergency() {
        const description = document.getElementById('emergency-desc')?.value;
        
        if (!description) {
            alert('Por favor describe la emergencia');
            return;
        }
        
        if (!this.currentTrip) {
            alert('No hay un viaje activo');
            return;
        }
        
        const emergencyCode = 'EMG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryTime = new Date(Date.now() + 30 * 60000);

        try {
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

            alert(`🚨 EMERGENCIA REGISTRADA\nCódigo: ${emergencyCode}\nMantén la calma, ayuda en camino.`);
            
            // Cerrar modal
            const modal = document.getElementById('modal-emergency');
            if (modal) modal.classList.add('hidden');
            
            // Limpiar textarea
            const descEl = document.getElementById('emergency-desc');
            if (descEl) descEl.value = '';
            
        } catch (error) {
            console.error('Error reportando emergencia:', error);
            alert('Error al reportar emergencia');
        }
    }

    // ==================== NAVEGACIÓN ====================
    
    switchTab(tabId) {
        this.activeTab = tabId;
        
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        
        const tabEl = document.getElementById(`tab-${tabId}`);
        if (tabEl) tabEl.classList.remove('hidden');
        
        const navEl = document.getElementById(`nav-${tabId}`);
        if (navEl) navEl.classList.add('active', 'text-primary');

        if (tabId === 'solicitud') {
            this.loadAvailableUnits();
        }

        if (tabId === 'unidad') {
            this.loadDashboardState();
        }

        if (tabId === 'ruta' && this.currentTrip?.status === 'in_progress') {
            setTimeout(() => this.startTracking(), 500);
        }
        
        if (tabId === 'perfil') {
            this.loadProfileData();
        }
    }

    // ==================== LIMPIEZA ====================
    
    destroy() {
        if (this.backgroundSyncInterval) {
            clearInterval(this.backgroundSyncInterval);
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.stopTracking();
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
