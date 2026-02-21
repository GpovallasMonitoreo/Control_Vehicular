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
        this.unsubscribeRealtime = null;
        this.selectedVehicleForRequest = null;
        this.signaturePad = null;
        
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
                    
                    <!-- ========== PESTAÑA UNIDAD - LISTA DE UNIDADES DISPONIBLES ========== -->
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70">Unidades Disponibles</h3>
                        
                        <!-- Si NO hay viaje activo, mostrar selector de unidades -->
                        <div id="unidad-content" class="space-y-3"></div>
                        
                        <!-- Si HAY viaje activo, mostrar info de la unidad actual -->
                        <div id="current-trip-info" class="hidden">
                            <div class="bg-primary/10 border border-primary/30 p-5 rounded-2xl text-center">
                                <p class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Unidad Actual</p>
                                <h2 id="current-vehicle-plate" class="text-4xl font-black text-white leading-none">--</h2>
                                <p id="current-vehicle-model" class="text-sm text-[#92adc9] mt-2">--</p>
                                <div class="mt-4 flex justify-center">
                                    <span id="trip-status-badge" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"></span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- ========== PESTAÑA FORMULARIO - FORMULARIO DE SOLICITUD ========== -->
                    <section id="tab-formulario" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">assignment</span> Formulario de Solicitud
                            </h3>
                            
                            <div id="solicitud-form" class="space-y-4">
                                <!-- Mensaje si no hay unidad seleccionada -->
                                <div id="no-vehicle-selected-msg" class="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-3xl text-yellow-500 mb-2">info</span>
                                    <p class="text-white text-sm">Primero selecciona una unidad en la pestaña "Unidad"</p>
                                    <button onclick="window.conductorModule.switchTab('unidad')" 
                                            class="mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
                                        IR A UNIDADES
                                    </button>
                                </div>
                                
                                <!-- Contenido del formulario (se muestra cuando hay unidad seleccionada) -->
                                <div id="form-content" class="hidden space-y-4">
                                    <!-- Unidad seleccionada (solo lectura) -->
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Unidad seleccionada</label>
                                        <div id="selected-vehicle-display" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl font-bold">
                                            Cargando...
                                        </div>
                                    </div>
                                    
                                    <!-- Ubicación/Destino del viaje - con GPS -->
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">📍 Ubicación de destino</label>
                                        <div class="relative">
                                            <input type="text" id="solicitud-destino" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl pr-12" 
                                                   placeholder="Ej: Zona industrial, Centro, etc.">
                                            <button onclick="window.conductorModule.getCurrentLocationForDestination()" 
                                                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary/40 transition-colors">
                                                <span class="material-symbols-outlined text-sm">my_location</span>
                                            </button>
                                        </div>
                                        <div id="destination-coords" class="text-[10px] text-[#92adc9] mt-1 hidden">
                                            Lat: <span id="dest-lat">0</span>, Lon: <span id="dest-lon">0</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Motivo del viaje -->
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Motivo del viaje</label>
                                        <select id="solicitud-motivo" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl">
                                            <option value="">Seleccionar motivo...</option>
                                            <option value="Entrega">Entrega de mercancía</option>
                                            <option value="Recolección">Recolección</option>
                                            <option value="Mantenimiento">Llevar a taller</option>
                                            <option value="Traslado">Traslado interno</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    
                                    <!-- Jefe Directo / Encargado -->
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Jefe Directo / Encargado</label>
                                        <select id="solicitud-encargado" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl">
                                            <option value="">Seleccionar encargado...</option>
                                            <option value="Carlos López">Carlos López - Logística</option>
                                            <option value="María García">María García - Operaciones</option>
                                            <option value="Juan Martínez">Juan Martínez - Almacén</option>
                                        </select>
                                    </div>
                                    
                                    <!-- Último checklist de la unidad seleccionada -->
                                    <div id="last-checklist-container" class="hidden bg-[#111a22] p-4 rounded-xl border border-[#324d67] mt-4">
                                        <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Último checklist de esta unidad</h4>
                                        <div id="last-checklist-content" class="text-sm text-white">
                                            Cargando...
                                        </div>
                                    </div>
                                    
                                    <button onclick="window.conductorModule.enviarSolicitud()" 
                                            class="w-full py-5 bg-primary text-white font-black rounded-xl uppercase text-lg shadow-[0_0_30px_rgba(19,127,236,0.3)] mt-4 hover:bg-primary/90 transition-colors">
                                        ENVIAR SOLICITUD
                                    </button>
                                </div>
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
                                
                                <!-- Fotos de recepción tomadas por el taller -->
                                <div id="reception-photos-gallery" class="hidden bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Fotos de la recepción</h4>
                                    <div id="reception-photos-grid" class="grid grid-cols-3 gap-2"></div>
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
                                
                                <!-- Fotos de retorno tomadas por el taller -->
                                <div id="return-photos-gallery" class="hidden bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Fotos de la entrega</h4>
                                    <div id="return-photos-grid" class="grid grid-cols-3 gap-2"></div>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Instrucciones</p>
                                    <p class="text-white text-sm">Espera a que el mecánico realice la revisión final de la unidad.</p>
                                    <p class="text-[#92adc9] text-xs mt-2">Una vez completada la revisión, se liberará la unidad.</p>
                                </div>

                                <!-- Botón de confirmación del conductor -->
                                <div id="conductor-confirmacion-container" class="hidden">
                                    <button onclick="window.conductorModule.confirmarLiberacionTaller()" 
                                            class="w-full py-5 bg-green-600 text-white font-black rounded-xl uppercase text-lg">
                                        CONFIRMAR LIBERACIÓN
                                    </button>
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
                    <button onclick="window.conductorModule.switchTab('formulario')" id="nav-formulario" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">assignment</span>
                        <span class="text-[9px] font-bold uppercase">Formulario</span>
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

    async onMount() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.hash = '#login';
            return;
        }
        
        this.userId = session.user.id;
        console.log('✅ Usuario autenticado:', this.userId);
        
        await this.loadProfileData();
        await this.loadDashboardState();
        this.setupEventListeners();
        this.setupRealtimeSubscription();
        
        this.startBackgroundSync();
    }

    // ==================== SUSCRIPCIÓN EN TIEMPO REAL ====================
    setupRealtimeSubscription() {
        if (this.unsubscribeRealtime) {
            this.unsubscribeRealtime();
        }

        const subscription = supabase
            .channel('driver_realtime_' + this.userId)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips', 
                filter: `driver_id=eq.${this.userId}` 
            }, (payload) => {
                console.log('🔄 Cambio en tiempo real detectado:', payload);
                
                // Actualizar el viaje actual
                if (payload.new) {
                    this.currentTrip = payload.new;
                    
                    // Mostrar notificación según el tipo de cambio
                    if (payload.eventType === 'UPDATE') {
                        const oldStatus = payload.old?.status;
                        const newStatus = payload.new.status;
                        
                        if (oldStatus !== newStatus) {
                            this.handleStatusChange(newStatus);
                        }
                    }
                    
                    // Actualizar toda la UI sin recargar
                    this.updateUIByStatus(payload.new);
                    
                    // Actualizar componentes específicos según el estado
                    this.updateSpecificComponents(payload.new);
                }
            })
            .subscribe();

        this.unsubscribeRealtime = () => subscription.unsubscribe();
    }

    handleStatusChange(newStatus) {
        const messages = {
            'approved_for_taller': { title: 'Solicitud aprobada', msg: 'Dirígete a taller para la recepción inicial', type: 'success' },
            'driver_accepted': { title: 'Recepción completada', msg: 'Ya puedes pasar con el guardia para la salida', type: 'success' },
            'in_progress': { title: 'Viaje iniciado', msg: 'El guardia ha autorizado tu salida', type: 'success' },
            'returned': { title: 'Viaje terminado', msg: 'Dirígete a taller para la revisión final', type: 'warning' },
            'completed': { title: 'Unidad liberada', msg: 'El taller ha completado la revisión', type: 'success' }
        };

        if (messages[newStatus]) {
            this.showNotification(messages[newStatus].title, messages[newStatus].msg, messages[newStatus].type);
            
            // Cambiar a la pestaña correspondiente
            const tabMap = {
                'approved_for_taller': 'taller-inicial',
                'driver_accepted': 'unidad',
                'in_progress': 'ruta',
                'returned': 'taller-final',
                'completed': 'unidad'
            };
            
            if (tabMap[newStatus]) {
                this.switchTab(tabMap[newStatus]);
            }
        }
    }

    updateSpecificComponents(trip) {
        // Actualizar galería de fotos si existe
        if (trip.workshop_reception_photos && trip.workshop_reception_photos.length > 0) {
            this.renderReceptionPhotos(trip.workshop_reception_photos);
        }
        
        if (trip.workshop_return_photos && trip.workshop_return_photos.length > 0) {
            this.renderReturnPhotos(trip.workshop_return_photos);
        }
        
        // Mostrar firma si el taller ya completó la recepción
        if (trip.status === 'driver_accepted' && !trip.driver_signature) {
            document.getElementById('firma-recepcion-container')?.classList.remove('hidden');
        }
        
        // Mostrar confirmación si el taller ya completó la revisión final
        if (trip.status === 'completed' && !trip.driver_confirmed_at) {
            document.getElementById('conductor-confirmacion-container')?.classList.remove('hidden');
        }
    }

    renderReceptionPhotos(photos) {
        const gallery = document.getElementById('reception-photos-gallery');
        const grid = document.getElementById('reception-photos-grid');
        
        if (gallery && grid && photos.length > 0) {
            gallery.classList.remove('hidden');
            grid.innerHTML = photos.map(photo => `
                <img src="${photo.url}" class="w-full h-16 object-cover rounded-lg border border-primary/50 cursor-pointer" 
                     onclick="window.conductorModule.viewPhoto('${photo.url}')" />
            `).join('');
        }
    }

    renderReturnPhotos(photos) {
        const gallery = document.getElementById('return-photos-gallery');
        const grid = document.getElementById('return-photos-grid');
        
        if (gallery && grid && photos.length > 0) {
            gallery.classList.remove('hidden');
            grid.innerHTML = photos.map(photo => `
                <img src="${photo.url}" class="w-full h-16 object-cover rounded-lg border border-primary/50 cursor-pointer" 
                     onclick="window.conductorModule.viewPhoto('${photo.url}')" />
            `).join('');
        }
    }

    viewPhoto(url) {
        // Abrir foto en modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4';
        modal.innerHTML = `
            <div class="relative max-w-2xl max-h-full">
                <img src="${url}" class="max-w-full max-h-[80vh] rounded-xl" />
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ==================== GPS PARA UBICACIÓN DE DESTINO ====================
    getCurrentLocationForDestination() {
        if (!navigator.geolocation) {
            alert("El dispositivo no tiene sensor GPS.");
            return;
        }

        const btn = event.currentTarget;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>';
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                
                // Obtener dirección aproximada usando reverse geocoding (simplificado)
                this.getAddressFromCoordinates(latitude, longitude).then(address => {
                    document.getElementById('solicitud-destino').value = address;
                }).catch(() => {
                    document.getElementById('solicitud-destino').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                });
                
                document.getElementById('destination-coords').classList.remove('hidden');
                document.getElementById('dest-lat').innerText = latitude.toFixed(6);
                document.getElementById('dest-lon').innerText = longitude.toFixed(6);
                
                btn.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span>';
                btn.disabled = false;
            },
            (err) => {
                alert('Error obteniendo ubicación: ' + err.message);
                btn.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span>';
                btn.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    async getAddressFromCoordinates(lat, lon) {
        // Usar Nominatim (OpenStreetMap) para reverse geocoding
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        } catch (error) {
            return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        }
    }

    // ==================== SISTEMA DE NOTIFICACIONES ====================
    showNotification(title, message, type = 'info') {
        const modal = document.getElementById('notification-modal');
        const content = document.getElementById('notification-content');
        
        const colors = { info: 'primary', success: 'green-500', warning: 'orange-500', error: 'red-500' };
        const icons = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };
        
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
            
            if (this.unsubscribeRealtime) {
                this.unsubscribeRealtime();
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
        const { data: vehs } = await supabase
            .from('vehicles')
            .select('*')
            .eq('status', 'active');
            
        const container = document.getElementById('unidad-content');
        if (!container) return;
        
        if (!vehs || vehs.length === 0) { 
            container.innerHTML = '<p class="text-slate-500 text-center py-10 border border-dashed border-[#233648] rounded-xl">Sin unidades activas.</p>'; 
            return; 
        }
        
        container.innerHTML = vehs.map(v => `
            <div onclick="window.conductorModule.selectVehicleForRequest('${v.id}', '${v.plate}', '${v.model}', '${v.economic_number}')" class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary transition-all">
                <div>
                    <p class="text-white font-black text-lg">${v.plate}</p>
                    <p class="text-[10px] text-[#92adc9] mt-1">${v.model} · ECO-${v.economic_number}</p>
                </div>
                <button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase">Solicitar</button>
            </div>
        `).join('');
    }

    // ==================== FUNCIÓN CORREGIDA ====================
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
                .maybeSingle(); // CAMBIADO DE single() a maybeSingle()

            const container = document.getElementById('last-checklist-container');
            const content = document.getElementById('last-checklist-content');
            
            if (!container || !content) return;

            if (error) {
                console.error('Error cargando checklist:', error);
                container.classList.add('hidden');
                return;
            }

            if (!lastTrip?.workshop_checklist) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
            const check = lastTrip.workshop_checklist;
            
            content.innerHTML = `
                <div class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.liquid ? 'check_circle' : 'cancel'}</span> Líquido
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.oil ? 'check_circle' : 'cancel'}</span> Aceite
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.coolant ? 'check_circle' : 'cancel'}</span> Anticongelante
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.lights ? 'check_circle' : 'cancel'}</span> Luces
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.tires ? 'check_circle' : 'cancel'}</span> Llantas
                        </span>
                    </div>
                    <p class="text-[10px] text-[#92adc9] mt-2">Fecha: ${lastTrip.completed_at ? new Date(lastTrip.completed_at).toLocaleDateString() : 'N/A'}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error en loadLastChecklist:', error);
            const container = document.getElementById('last-checklist-container');
            if (container) container.classList.add('hidden');
        }
    }

    selectVehicleForRequest(vehicleId, plate, model, eco) {
        this.selectedVehicleForRequest = { id: vehicleId, plate, model, eco };
        
        // Cambiar a pestaña formulario
        this.switchTab('formulario');
        
        // Mostrar el contenido del formulario y ocultar el mensaje de "sin unidad"
        setTimeout(() => {
            const noVehicleMsg = document.getElementById('no-vehicle-selected-msg');
            const formContent = document.getElementById('form-content');
            const display = document.getElementById('selected-vehicle-display');
            
            if (noVehicleMsg) noVehicleMsg.classList.add('hidden');
            if (formContent) formContent.classList.remove('hidden');
            if (display) {
                display.innerHTML = `${plate} · ${model} (ECO-${eco})`;
            }
            
            // Cargar último checklist
            this.loadLastChecklist(vehicleId);
        }, 100);
    }

    async enviarSolicitud() {
        if (!this.selectedVehicleForRequest) {
            alert('Por favor selecciona una unidad primero');
            this.switchTab('unidad');
            return;
        }

        const destino = document.getElementById('solicitud-destino').value;
        const motivo = document.getElementById('solicitud-motivo').value;
        const encargado = document.getElementById('solicitud-encargado').value;
        
        if (!destino || !motivo || !encargado) {
            alert('Por favor completa todos los campos');
            return;
        }

        const btn = document.querySelector('[onclick="window.conductorModule.enviarSolicitud()"]');
        btn.disabled = true;
        btn.innerText = 'ENVIANDO...';

        // Obtener coordenadas si están disponibles
        const destLat = document.getElementById('dest-lat')?.innerText;
        const destLon = document.getElementById('dest-lon')?.innerText;
        
        const requestDetails = {
            destination: destino,
            motivo: motivo,
            supervisor: encargado,
            requested_at: new Date().toISOString(),
            destination_coords: (destLat && destLon) ? { lat: parseFloat(destLat), lon: parseFloat(destLon) } : null
        };

        const accessCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const { error } = await supabase.from('trips').insert({ 
            driver_id: this.userId, 
            vehicle_id: this.selectedVehicleForRequest.id, 
            status: 'requested',
            access_code: accessCode,
            destination: destino,
            motivo: motivo,
            supervisor: encargado,
            request_details: requestDetails
        });

        if (error) {
            alert("Error: " + error.message);
            btn.disabled = false;
            btn.innerText = 'ENVIAR SOLICITUD';
        } else {
            this.showNotification('Solicitud enviada', 'Espera la aprobación del supervisor', 'success');
            this.selectedVehicleForRequest = null;
            await this.loadDashboardState();
            this.switchTab('unidad');
        }
    }

    // ==================== FIRMA DE RECEPCIÓN EN TALLER ====================
    renderFirmaRecepcion() {
        const container = document.getElementById('firma-recepcion-container');
        container.classList.remove('hidden');
        
        setTimeout(() => {
            const canvas = document.getElementById('signature-pad');
            if (canvas) {
                // Cargar librería de firma si no existe
                if (typeof SignaturePad === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js';
                    script.onload = () => {
                        this.signaturePad = new SignaturePad(canvas, {
                            backgroundColor: '#1c2127',
                            penColor: '#ffffff',
                            velocityFilterWeight: 0.7,
                            minWidth: 0.5,
                            maxWidth: 2.5
                        });
                        canvas.addEventListener('mouseup', () => this.validateSignature());
                        canvas.addEventListener('touchend', () => this.validateSignature());
                    };
                    document.head.appendChild(script);
                } else {
                    this.signaturePad = new SignaturePad(canvas, {
                        backgroundColor: '#1c2127',
                        penColor: '#ffffff',
                        velocityFilterWeight: 0.7,
                        minWidth: 0.5,
                        maxWidth: 2.5
                    });
                    canvas.addEventListener('mouseup', () => this.validateSignature());
                    canvas.addEventListener('touchend', () => this.validateSignature());
                }
            }
        }, 500);
    }

    validateSignature() {
        const btn = document.getElementById('btn-confirmar-recepcion');
        btn.disabled = !(this.signaturePad && !this.signaturePad.isEmpty());
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
        btn.disabled = true;
        btn.innerText = 'PROCESANDO...';

        const signatureData = this.signaturePad.toDataURL('image/png');

        const { error } = await supabase
            .from('trips')
            .update({
                driver_signature: signatureData,
                reception_confirmed_at: new Date().toISOString(),
                status: 'driver_accepted'
            })
            .eq('id', this.currentTrip.id);

        if (error) {
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.innerText = 'FIRMAR RECEPCIÓN';
        } else {
            this.showNotification('Recepción confirmada', 'Ya puedes pasar con el guardia', 'success');
            this.switchTab('unidad');
        }
    }

    // ==================== CONFIRMAR LIBERACIÓN DEL TALLER ====================
    async confirmarLiberacionTaller() {
        const btn = document.querySelector('#conductor-confirmacion-container button');
        btn.disabled = true;
        btn.innerText = 'CONFIRMANDO...';

        const { error } = await supabase
            .from('trips')
            .update({
                driver_confirmed_at: new Date().toISOString()
            })
            .eq('id', this.currentTrip.id);

        if (error) {
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.innerText = 'CONFIRMAR LIBERACIÓN';
        } else {
            this.showNotification('Unidad liberada', 'Puedes solicitar una nueva unidad', 'success');
            this.currentTrip = null;
            this.selectedVehicleForRequest = null;
            await this.loadDashboardState();
            this.switchTab('unidad');
        }
    }

    // ==================== RESUMEN POST-VIAJE ====================
    cargarResumenViaje() {
        document.getElementById('resumen-distancia').innerText = 
            Math.round(this.tripLogistics.totalDistance) + ' km';
        document.getElementById('resumen-combustible').innerText = 
            Math.round(this.tripLogistics.totalDistance / 8) + ' L';
    }

    // ==================== PERFIL Y ESTADO ====================
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

        await this.updateUIByStatus(trip);
        
        if (!trip) {
            await this.loadAvailableUnits();
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

        if (trip && statusMap[trip.status]) {
            const status = statusMap[trip.status];
            document.getElementById('profile-status').innerText = status.text;
            document.getElementById('trip-status-badge').innerText = status.text;
            document.getElementById('trip-status-badge').className = `px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.color} text-white`;
            
            document.getElementById('current-vehicle-plate').innerText = trip.vehicles?.plate || '--';
            document.getElementById('current-vehicle-model').innerText = `${trip.vehicles?.model || ''} ECO-${trip.vehicles?.economic_number || ''}`;
            document.getElementById('current-trip-info').classList.remove('hidden');
            
            if (trip.status === 'approved_for_taller') {
                document.getElementById('taller-vehicle-info').innerText = 
                    `ECO-${trip.vehicles?.economic_number} - ${trip.vehicles?.plate}`;
            }
            
            // Actualizar componentes específicos
            this.updateSpecificComponents(trip);
            
        } else {
            document.getElementById('current-trip-info').classList.add('hidden');
            document.getElementById('profile-status').innerText = "Disponible";
        }

        // Ocultar formulario de solicitud si hay viaje activo
        if (trip && trip.status !== 'completed') {
            document.getElementById('solicitud-form').classList.add('hidden');
        } else {
            document.getElementById('solicitud-form').classList.remove('hidden');
        }
    }

    // ==================== FUNCIONES DEL VIAJE ====================
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
        
        const emergencyCode = 'EMG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryTime = new Date(Date.now() + 30 * 60000);

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

        alert(`EMERGENCIA REGISTRADA\nCódigo: ${emergencyCode}\nMantén la calma, ayuda en camino.`);
        document.getElementById('modal-emergency').classList.add('hidden');
    }

    // ==================== NAVEGACIÓN ====================
    switchTab(tabId) {
        this.activeTab = tabId;
        
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('active', 'text-primary');

        // Validación especial para formulario
        if (tabId === 'formulario') {
            if (!this.selectedVehicleForRequest) {
                // Si no hay unidad seleccionada, mostrar mensaje y ocultar formulario
                const noVehicleMsg = document.getElementById('no-vehicle-selected-msg');
                const formContent = document.getElementById('form-content');
                if (noVehicleMsg) noVehicleMsg.classList.remove('hidden');
                if (formContent) formContent.classList.add('hidden');
            } else {
                // Si hay unidad seleccionada, mostrar formulario
                const noVehicleMsg = document.getElementById('no-vehicle-selected-msg');
                const formContent = document.getElementById('form-content');
                const display = document.getElementById('selected-vehicle-display');
                
                if (noVehicleMsg) noVehicleMsg.classList.add('hidden');
                if (formContent) formContent.classList.remove('hidden');
                if (display) {
                    display.innerHTML = `${this.selectedVehicleForRequest.plate} · ${this.selectedVehicleForRequest.model} (ECO-${this.selectedVehicleForRequest.eco})`;
                }
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
