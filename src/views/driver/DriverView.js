import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null; 
        this.currentTrip = null;
        
        // NUEVO: Interruptor maestro para el GPS (Desactivado por ahora)
        this.gpsEnabled = false; 
        
        this.watchPositionId = null;
        this.gpsRetryCount = 0;
        this.maxGpsRetries = 3;
        this.backgroundSyncInterval = null;
        this.pendingLocations = [];
        this.selectedVehicleForRequest = null;
        this.profile = null;
        this.signaturePad = null;
        this.accessCode = null;
        this.realtimeChannel = null;
        this.updateInterval = null;
        
        // Variables para la ruta
        this.routeStops = [];
        this.isReturning = false;
        this.driverMap = null;
        this.myLocationMarker = null;
        this.driverMarkers = [];
        this.estimatedTimeMinutes = 0; 
        
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
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold truncate">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span id="gps-header-indicator" class="relative flex h-2 w-2 hidden">
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
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70 px-1">Unidades Disponibles</h3>
                        
                        <div id="unidad-loader" class="flex justify-center py-10 hidden">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        
                        <div id="unidad-content" class="space-y-3"></div>
                        
                        <div id="no-units-message" class="hidden text-slate-500 text-center py-10 border border-dashed border-[#233648] rounded-xl">
                            <span class="material-symbols-outlined text-4xl mb-2">directions_car_off</span>
                            <p class="text-sm">Sin unidades activas</p>
                        </div>
                        
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

                        <div id="access-code-container" class="hidden mt-4 bg-gradient-to-r from-green-600 to-emerald-600 p-5 rounded-2xl animate-pulse">
                            <div class="flex flex-col items-center justify-center text-center">
                                <p id="qr-instruction-title" class="text-white text-[10px] font-bold uppercase opacity-90 mb-2">Código QR para Guardia</p>
                                <div class="bg-white p-2 rounded-lg mb-3 shadow-lg">
                                    <img id="access-qr-image" src="" alt="Código QR" class="w-32 h-32 object-contain" />
                                </div>
                                <p id="access-code-display" class="text-white text-2xl font-mono font-black tracking-widest">------</p>
                                <p id="qr-instruction-text" class="text-green-100 text-[10px] mt-2 font-bold">Muestra este código al guardia al SALIR</p>
                            </div>
                        </div>

                        <div id="return-to-workshop-container" class="hidden mt-4 bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-2xl animate-pulse">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-white text-[8px] font-bold uppercase opacity-80">Viaje finalizado</p>
                                    <p class="text-white text-xl font-black leading-tight">Dirígete a taller para revisión final</p>
                                </div>
                                <span class="material-symbols-outlined text-4xl text-white/50">engineering</span>
                            </div>
                            <p class="text-purple-200 text-[8px] mt-2">El guardia ha registrado tu retorno. Pasa a taller para la revisión final de la unidad.</p>
                        </div>
                    </section>

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
                                    <div class="flex justify-between items-center mb-2">
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase">Rutas / Destinos *</label>
                                        <button onclick="window.conductorModule.addDestinoInput()" class="text-[10px] bg-[#233648] text-primary px-2 py-1 rounded hover:bg-[#324d67] transition-colors font-bold flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[12px]">add</span> Agregar ruta
                                        </button>
                                    </div>
                                    <div id="destinos-container" class="space-y-2">
                                        <div class="flex gap-2 items-center">
                                            <span class="w-6 h-6 rounded-full bg-primary text-[10px] flex items-center justify-center font-black text-white shrink-0">1</span>
                                            <input type="text" class="solicitud-destino-input w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" placeholder="Ej: Zona industrial, Centro, etc.">
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Motivo del Viaje *</label>
                                    <input type="text" id="solicitud-motivo" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" 
                                           placeholder="Ej: Entrega de mercancía, Reunión, etc.">
                                </div>
                                
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Jefe Directo *</label>
                                    <input type="text" id="solicitud-jefe" class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" 
                                           placeholder="Nombre del jefe directo">
                                </div>
                                
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

                    <section id="tab-taller-inicial" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-orange-500">engineering</span> Recepción en Taller (Paso 1)
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
                                    <p class="text-white text-sm">Espera a que el mecánico realice la revisión.</p>
                                    <p class="text-[#92adc9] text-xs mt-2">Una vez completada la recepción, podrás continuar.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        <div class="p-5 space-y-4">
                            <div id="route-waiting-msg" class="bg-[#192633] border border-[#233648] rounded-2xl p-8 text-center">
                                <span class="material-symbols-outlined text-5xl text-[#324d67] mb-3">gpp_maybe</span>
                                <h3 class="text-white font-bold text-lg">Esperando Salida</h3>
                                <p class="text-[#92adc9] text-xs mt-2">Presenta tu código QR al guardia en la entrada para iniciar el viaje</p>
                                <div class="mt-4 flex justify-center">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            </div>

                            <div id="active-trip-panel" class="hidden space-y-4">
                                
                                <div id="estimated-time-panel" class="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center">
                                    <div class="flex items-center gap-2 text-emerald-400">
                                        <span class="material-symbols-outlined text-lg">schedule</span>
                                        <span class="text-xs font-bold uppercase">Tiempo Estimado de Ruta</span>
                                    </div>
                                    <div class="text-white font-black text-lg" id="route-estimated-time">-- min</div>
                                </div>

                                <div class="bg-[#192633] rounded-xl overflow-hidden border border-[#233648] flex flex-col shadow-lg">
                                    <div id="driver-map" class="w-full h-48 z-0 relative bg-[#111a22]"></div>
                                    
                                    <div class="p-3 bg-[#111a22]">
                                        <div class="flex justify-between items-center mb-2">
                                            <p class="text-[10px] text-[#92adc9] uppercase font-bold flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[12px]">format_list_bulleted</span> Puntos de Ruta
                                            </p>
                                            <button onclick="window.conductorModule.toggleReturnTrip()" 
                                                    id="btn-return-trip" 
                                                    class="text-[9px] bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded font-bold uppercase transition-colors shadow-md">
                                                Marcar Regreso
                                            </button>
                                        </div>
                                        
                                        <ul id="route-stops-list" class="space-y-2 text-xs text-white mb-3 max-h-32 overflow-y-auto custom-scrollbar">
                                            <li class="text-slate-500 text-center py-2 text-[10px] border border-dashed border-[#324d67] rounded-lg">
                                                Agrega puntos a tu ruta tocando el mapa
                                            </li>
                                        </ul>
                                        
                                        <button onclick="window.conductorModule.saveRoutePlan()" 
                                                class="w-full py-2.5 bg-green-600 text-white rounded-lg text-xs uppercase font-black shadow-lg transition-colors hover:bg-green-500 flex justify-center items-center gap-2">
                                            <span class="material-symbols-outlined text-[16px]">save</span> Guardar Ruta
                                        </button>
                                    </div>
                                </div>

                                <div id="live-stats-panel" class="hidden bg-[#192633] rounded-2xl p-5 border border-primary/30">
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div class="bg-[#111a22] p-3 rounded-xl shadow-inner">
                                            <p class="text-[8px] text-[#92adc9] uppercase font-bold">Velocidad</p>
                                            <p id="live-speed" class="text-2xl font-black text-primary">0</p>
                                            <p class="text-[8px] text-[#92adc9]">km/h</p>
                                        </div>
                                        <div class="bg-[#111a22] p-3 rounded-xl shadow-inner">
                                            <p class="text-[8px] text-[#92adc9] uppercase font-bold">Distancia Recorrida</p>
                                            <p id="live-distance" class="text-2xl font-black text-primary">0.0</p>
                                            <p class="text-[8px] text-[#92adc9]">km</p>
                                        </div>
                                    </div>
                                    <div class="space-y-3">
                                        <div class="flex justify-between text-xs bg-[#111a22] p-3 rounded-xl">
                                            <span class="text-[#92adc9] font-bold">Combustible estimado</span>
                                            <span id="live-fuel" class="text-white font-black">0.0 L</span>
                                        </div>
                                        <div class="flex justify-between text-xs bg-[#111a22] p-3 rounded-xl">
                                            <span class="text-[#92adc9] font-bold">Tiempo en ruta</span>
                                            <span id="trip-duration" class="text-white font-black font-mono">00:00:00</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                                    <span class="material-symbols-outlined text-2xl text-blue-400 mb-2">qr_code_scanner</span>
                                    <p class="text-white text-xs font-bold">El guardia marca tu inicio y fin de ruta escaneando tu QR.</p>
                                </div>

                                <div class="bg-[#192633] rounded-xl p-4 border border-[#233648]">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2 flex items-center gap-1 font-bold">
                                        <span class="material-symbols-outlined text-sm">note_add</span> Notas del viaje
                                    </p>
                                    <textarea id="trip-notes" rows="2" 
                                              class="w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl text-sm focus:border-primary focus:outline-none"
                                              placeholder="Ej. Tráfico pesado, pausa para comer..."></textarea>
                                    <button onclick="window.conductorModule.saveTripNotes()" 
                                            class="mt-3 w-full py-2 bg-[#233648] border border-[#324d67] text-white rounded-lg text-xs uppercase font-bold hover:bg-[#2d445a] transition-colors">
                                        Guardar nota
                                    </button>
                                </div>
                            </div>

                            <div class="hidden bg-[#111a22] border border-[#233648] rounded-xl p-4 shadow-lg mt-4" id="gps-container">
                                <div id="gps-status-indicator" class="text-center">
                                    <div class="flex items-center justify-center gap-2 text-slate-400">
                                        <span class="material-symbols-outlined">gps_fixed</span>
                                        <span class="text-xs font-bold">GPS Inactivo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-taller-final" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-purple-500">assignment_turned_in</span> Entrega en Taller (Paso 2)
                            </h3>
                            
                            <div id="taller-final-content" class="space-y-4">
                                <div id="taller-normal-message" class="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-4xl text-purple-500 mb-2">info</span>
                                    <p class="text-white text-sm">Has regresado del viaje. El taller está realizando la revisión final.</p>
                                </div>

                                <div id="taller-incident-message" class="hidden bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-4xl text-red-500 mb-2">warning</span>
                                    <p class="text-white text-sm font-bold">INCIDENCIA REPORTADA</p>
                                    <p id="incident-description" class="text-[#92adc9] text-xs mt-2"></p>
                                    <p class="text-red-400 text-[10px] mt-3">La unidad está en espera hasta que se resuelva la incidencia</p>
                                </div>
                                
                                <div id="resumen-viaje-panel" class="hidden bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-3">Resumen del viaje</p>
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <p class="text-[#92adc9] text-[9px]">Distancia</p>
                                            <p id="resumen-distancia" class="text-white font-bold text-lg">0 km</p>
                                        </div>
                                        <div>
                                            <p class="text-[#92adc9] text-[9px]">Combustible</p>
                                            <p id="resumen-combustible" class="text-white font-bold text-lg">0 L</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-[#111a22] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Estado de la revisión</p>
                                    <div class="flex justify-between text-[10px] text-[#92adc9] mb-2">
                                        <span>Esperando taller</span>
                                        <span>En revisión</span>
                                        <span>Liberado</span>
                                    </div>
                                    <div class="h-2 bg-[#233648] rounded-full overflow-hidden">
                                        <div id="final-progress" class="h-full w-1/3 bg-purple-500 rounded-full"></div>
                                    </div>
                                </div>
                                
                                <div id="conductor-confirmacion-container" class="hidden">
                                    <button onclick="window.conductorModule.confirmarLiberacionTaller()" 
                                            class="w-full py-5 bg-green-600 text-white font-black rounded-xl uppercase text-lg hover:bg-green-500 transition-all shadow-lg">
                                        CONFIRMAR LIBERACIÓN DE UNIDAD
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

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

                            <div id="trip-summary-container" class="hidden bg-primary/5 p-4 rounded-2xl border border-primary/20">
                                <h4 class="text-primary text-xs font-black uppercase mb-3">Viaje en curso</h4>
                                <div class="space-y-2 text-xs">
                                    <div class="flex justify-between">
                                        <span class="text-slate-600">Inicio:</span>
                                        <span id="summary-start-time" class="text-slate-900 font-bold">--:--</span>
                                    </div>
                                    <div class="flex justify-between hidden">
                                        <span class="text-slate-600">Distancia:</span>
                                        <span id="summary-distance" class="text-slate-900 font-bold">0 km</span>
                                    </div>
                                    <div class="flex justify-between hidden">
                                        <span class="text-slate-600">Consumo:</span>
                                        <span id="summary-fuel" class="text-slate-900 font-bold">0 L</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

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

                <div id="modal-emergency" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div class="bg-[#1c2127] w-full max-w-md rounded-3xl p-6 border border-red-500/30">
                        <span class="material-symbols-outlined text-5xl text-red-500 mb-4 block">emergency</span>
                        <h3 class="text-white font-bold text-lg mb-2">Reporte de Incidente</h3>
                        <p class="text-[#92adc9] text-sm mb-6">Describe la situación</p>
                        
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
            
            if (!this.userId) {
                console.error('❌ userId es null después de la autenticación');
                window.location.hash = '#login';
                return;
            }
            
            await this.loadProfileData();
            await this.loadDashboardState();
            this.setupEventListeners();
            
            this.startBackgroundSync();

            // Configurar suscripción en tiempo real
            this.setupRealtimeSubscription();

            // Configurar actualización periódica
            this.updateInterval = setInterval(async () => {
                if (navigator.onLine) {
                    await this.loadDashboardState();
                }
            }, 3000);
                
        } catch (error) {
            console.error('❌ Error en onMount:', error);
            window.location.hash = '#login';
        }
    }

    setupRealtimeSubscription() {
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }

        this.realtimeChannel = supabase
            .channel('driver_realtime_' + this.userId)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'trips', 
                filter: `driver_id=eq.${this.userId}` 
            }, async (payload) => {
                console.log('🔄 Cambio detectado en viaje:', payload);
                
                if (payload.new) {
                    await this.handleTripUpdate(payload.new);
                    
                    // Mostrar código de acceso cuando el viaje está listo para salir
                    if (payload.new.status === 'driver_accepted' && payload.new.access_code) {
                        this.showAccessCode(payload.new.access_code, 'exit');
                        this.showNotification('🔑 Viaje aprobado', 'Tu código de acceso está listo', 'success');
                    }
                    
                    // Iniciar seguimiento cuando el viaje está en progreso (Guardia escaneó QR SALIDA)
                    if (payload.new.status === 'in_progress') {
                        if (!this.tripLogistics.startTime) {
                            this.tripLogistics.startTime = new Date();
                            this.updateTripInDatabase({ start_time: this.tripLogistics.startTime.toISOString() });
                        }
                        this.startTracking();
                        this.showNotification('🚗 Viaje iniciado', 'El guardia ha autorizado tu salida', 'success');
                        
                        const accessContainer = document.getElementById('access-code-container');
                        if (accessContainer) accessContainer.classList.add('hidden');
                    }
                    
                    // Mostrar mensaje de ir a taller cuando el guardia escanea el retorno (QR ENTRADA)
                    if (payload.new.status === 'awaiting_return_checklist') {
                        this.showReturnToWorkshopMessage();
                        this.showNotification('🏁 Viaje finalizado', 'Dirígete a taller para la revisión final', 'warning');
                        this.cargarResumenViaje();
                        this.switchTab('taller-final');
                        
                        const accessContainer = document.getElementById('access-code-container');
                        if (accessContainer) accessContainer.classList.add('hidden');
                    }

                    // Viaje completado - Permitir nueva solicitud
                    if (payload.new.status === 'completed') {
                        this.showNotification('✅ Unidad liberada', 'Puedes solicitar una nueva unidad', 'success');
                        this.currentTrip = null;
                        this.routeStops = [];
                        this.isReturning = false;
                        await this.loadDashboardState();
                        this.switchTab('unidad');
                    }

                    // Incidencia reportada - Mostrar mensaje de espera
                    if (payload.new.status === 'incident_report') {
                        this.showIncidentMessage(payload.new);
                    }
                }
            })
            .subscribe((status) => {
                console.log('📡 Estado de suscripción:', status);
            });
    }

    showReturnToWorkshopMessage() {
        const container = document.getElementById('return-to-workshop-container');
        if (container) {
            container.classList.remove('hidden');
            setTimeout(() => {
                container.classList.add('opacity-80');
            }, 10000);
        }
    }

    showIncidentMessage(trip) {
        const normalMsg = document.getElementById('taller-normal-message');
        const incidentMsg = document.getElementById('taller-incident-message');
        const incidentDesc = document.getElementById('incident-description');
        
        if (normalMsg) normalMsg.classList.add('hidden');
        if (incidentMsg) incidentMsg.classList.remove('hidden');
        if (incidentDesc) incidentDesc.innerText = trip.incident_description || 'Incidencia reportada durante la revisión';
        
        this.showNotification('⚠️ Incidencia', 'La unidad está en espera por revisión', 'warning');
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
        
        if (updatedTrip.status === 'completed') {
            this.currentTrip = null;
            this.routeStops = [];
            this.isReturning = false;
        } else {
            this.currentTrip = updatedTrip;
        }
        
        switch(updatedTrip.status) {
            case 'approved_for_taller':
                this.showNotification('✅ Solicitud aprobada', 'Dirígete a taller para la revisión inicial', 'success');
                this.switchTab('taller-inicial');
                break;
                
            case 'driver_accepted':
                this.showNotification('🔑 Recepción completada', 'Ya puedes pasar con el guardia', 'success');
                if (updatedTrip.access_code) {
                    this.showAccessCode(updatedTrip.access_code, 'exit');
                }
                break;
                
            case 'in_progress':
                if (previousStatus !== 'in_progress') {
                    this.showNotification('🚗 Viaje iniciado', 'El guardia ha autorizado tu salida', 'success');
                    this.startTracking();
                    this.switchTab('ruta');
                }
                break;
                
            case 'awaiting_return_checklist':
                this.showNotification('🏁 Viaje finalizado', 'Dirígete a taller para la revisión final', 'warning');
                this.stopTracking();
                this.showReturnToWorkshopMessage();
                this.cargarResumenViaje();
                this.switchTab('taller-final');
                break;
                
            case 'incident_report':
                this.showIncidentMessage(updatedTrip);
                this.switchTab('taller-final');
                break;
                
            case 'completed':
                await this.loadDashboardState();
                this.switchTab('unidad');
                break;
        }
        
        await this.loadDashboardState();
    }

    // ==================== MOSTRAR CÓDIGO DE ACCESO ====================
    
    showAccessCode(code, type = 'exit') {
        const container = document.getElementById('access-code-container');
        const display = document.getElementById('access-code-display');
        const qrImage = document.getElementById('access-qr-image');
        const instructionTitle = document.getElementById('qr-instruction-title');
        const instructionText = document.getElementById('qr-instruction-text');
        
        if (container && display && qrImage) {
            display.innerText = code;
            
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`;
            
            if (type === 'return') {
                instructionTitle.innerText = "Código QR de Retorno";
                instructionText.innerText = "Muestra este código al guardia al ENTRAR a base";
                container.classList.replace('from-green-600', 'from-purple-600');
                container.classList.replace('to-emerald-600', 'to-blue-600');
            } else {
                instructionTitle.innerText = "Código QR de Salida";
                instructionText.innerText = "Muestra este código al guardia al SALIR";
                container.classList.replace('from-purple-600', 'from-green-600');
                container.classList.replace('to-blue-600', 'to-emerald-600');
            }

            container.classList.remove('hidden');
        }
    }

    // ==================== CONFIGURACIÓN ====================
    
    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (this.currentTrip?.status === 'in_progress') {
                console.log('App en background');
            }
        });

        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
        }
    }

    // ==================== LOGOUT ====================
    
    async logout() {
        if (!confirm('¿Estás seguro que deseas cerrar sesión?')) return;

        try {
            if (this.backgroundSyncInterval) clearInterval(this.backgroundSyncInterval);
            if (this.updateInterval) clearInterval(this.updateInterval);
            if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
            
            this.stopTracking();
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            localStorage.clear();
            window.location.hash = '#login';
            window.location.reload();
        }
    }

    // ==================== GPS Y MAPA ====================
    
    startTracking() {
        // Bloqueo temporal para no encender el GPS
        if (!this.gpsEnabled) return; 

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
                    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000, distanceFilter: 10 }
                );
            },
            (err) => { this.handleGPSError(err); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    handleFirstPosition(pos) {
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
            gpsHeader.classList.remove('hidden');
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
                if (fuelEl) fuelEl.innerText = fuelConsumption.toFixed(1) + ' L';
                
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

            if (speedKmh > this.tripLogistics.maxSpeed) this.tripLogistics.maxSpeed = speedKmh;

            const totalHours = (now - this.tripLogistics.startTime) / 3600000;
            if (totalHours > 0) this.tripLogistics.averageSpeed = this.tripLogistics.totalDistance / totalHours;
        }

        if (this.tripLogistics.startTime) {
            const duration = Math.floor((now - this.tripLogistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            
            const durationEl = document.getElementById('trip-duration');
            if (durationEl) {
                durationEl.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        this.tripLogistics.lastPosition = { lat: latitude, lng: longitude, timestamp: now };
        this.tripLogistics.lastUpdateTime = now;
        this.tripLogistics.lastSpeed = speedKmh;

        this.updateMapMarker(latitude, longitude);

        if (this.currentTrip?.status === 'in_progress') {
            const locationData = {
                lat: latitude, lng: longitude, speed: speedKmh, accuracy: accuracy,
                total_distance: Math.round(this.tripLogistics.totalDistance * 10) / 10,
                moving_time: Math.round(this.tripLogistics.movingTime),
                idle_time: Math.round(this.tripLogistics.idleTime),
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
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    deg2rad(deg) { return deg * (Math.PI/180); }

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
            gpsHeader.classList.remove('hidden');
            gpsHeader.innerHTML = `<span class="relative rounded-full h-2 w-2 bg-red-500"></span>`;
        }
    }

    stopTracking() {
        if (!this.gpsEnabled) return; // Bloqueo temporal de GPS

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
                gpsHeader.classList.add('hidden');
            }
        }
    }

    // ==================== FUNCIONES DEL MAPA Y OSRM (TIEMPO ESTIMADO) ====================

    async initDriverMap() {
        if (this.driverMap || !window.L || !this.currentTrip) return;

        try {
            const L = window.L;
            // Si el GPS está inactivo usará coordenadas por defecto (CDMX en este caso)
            const center = this.tripLogistics.lastPosition 
                ? [this.tripLogistics.lastPosition.lat, this.tripLogistics.lastPosition.lng] 
                : [19.4326, -99.1332];

            this.driverMap = L.map('driver-map', { zoomControl: true, attributionControl: false }).setView(center, 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
                maxZoom: 19, subdomains: 'abcd'
            }).addTo(this.driverMap);

            const carIconHtml = `<div class="bg-[#10b981] w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_#10b981] animate-pulse"></div>`;
            const carIcon = L.divIcon({ className: 'local-car-marker', html: carIconHtml, iconSize: [16, 16], iconAnchor: [8, 8] });

            if (this.tripLogistics.lastPosition) {
                this.myLocationMarker = L.marker(
                    [this.tripLogistics.lastPosition.lat, this.tripLogistics.lastPosition.lng], 
                    { icon: carIcon }
                ).addTo(this.driverMap);
            }

            this.driverMap.on('click', (e) => {
                this.addStopFromMap(e.latlng.lat, e.latlng.lng);
            });

            if (this.currentTrip?.request_details?.route_plan) {
                this.routeStops = this.currentTrip.request_details.route_plan;
                this.isReturning = this.currentTrip.request_details.is_returning || false;
            }

            this.renderRouteStops();
            this.updateMapMarkers();
            this.updateReturnButtonUI();
            this.estimateRouteTime(); 

            setTimeout(() => this.driverMap.invalidateSize(), 400);
        } catch (e) {
            console.error("Error iniciando mapa:", e);
        }
    }

    updateMapMarker(lat, lng) {
        if (this.myLocationMarker && this.driverMap) {
            this.myLocationMarker.setLatLng([lat, lng]);
            this.driverMap.panTo([lat, lng]);
        }
    }

    updateMapMarkers() {
        if (!this.driverMap || !window.L) return;

        const L = window.L;
        this.driverMarkers.forEach(m => this.driverMap.removeLayer(m));
        this.driverMarkers = [];

        this.routeStops.forEach((stop, i) => {
            const isReturn = stop.type === 'return';
            const color = isReturn ? 'bg-purple-500' : 'bg-primary';
            
            const iconHtml = `<div class="${color} w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-lg">${i+1}</div>`;
            const icon = L.divIcon({ className: 'custom-stop-marker', html: iconHtml, iconSize: [24, 24], iconAnchor: [12, 12] });
            
            const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(this.driverMap);
            marker.bindPopup(stop.name);
            this.driverMarkers.push(marker);
        });

        if (this.driverMarkers.length > 0) {
            const group = new L.featureGroup(this.driverMarkers);
            if (this.myLocationMarker) group.addLayer(this.myLocationMarker);
            this.driverMap.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 15 });
        }
    }

    async addStopFromMap(lat, lng) {
        this.showNotification('Agregando punto...', 'Extrayendo dirección', 'info');
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
            const data = await res.json();
            const name = data.display_name ? data.display_name.split(',')[0] : 'Punto en mapa';
            this.addRouteStop(lat, lng, name, 'stop');
        } catch (e) {
            this.addRouteStop(lat, lng, 'Ubicación manual', 'stop');
        }
    }

    addRouteStop(lat, lng, name, type) {
        this.routeStops.push({ 
            id: 'stop_' + Date.now(), lat, lng, name, type, timestamp: new Date().toISOString() 
        });
        this.renderRouteStops();
        this.updateMapMarkers();
        this.estimateRouteTime(); 
    }

    removeRouteStop(index) {
        if (this.routeStops[index].type === 'return') { 
            this.isReturning = false; 
            this.updateReturnButtonUI(); 
            const accessContainer = document.getElementById('access-code-container');
            if (accessContainer) accessContainer.classList.add('hidden');
        }
        this.routeStops.splice(index, 1);
        this.renderRouteStops();
        this.updateMapMarkers();
        this.estimateRouteTime(); 
    }

    async estimateRouteTime() {
        const timeEl = document.getElementById('route-estimated-time');
        if (!timeEl) return;
        
        if (this.routeStops.length === 0) {
            timeEl.innerText = '-- min';
            return;
        }

        let coordinates = [];
        if (this.tripLogistics.lastPosition) {
            coordinates.push(`${this.tripLogistics.lastPosition.lng},${this.tripLogistics.lastPosition.lat}`);
        }
        this.routeStops.forEach(stop => coordinates.push(`${stop.lng},${stop.lat}`));

        if (coordinates.length < 2) {
            timeEl.innerText = '-- min';
            return;
        }

        try {
            timeEl.innerText = 'Calculando...';
            const coordString = coordinates.join(';');
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`);
            const data = await res.json();
            
            if (data.routes && data.routes.length > 0) {
                const durationSeconds = data.routes[0].duration;
                this.estimatedTimeMinutes = Math.ceil(durationSeconds / 60);
                
                if (this.estimatedTimeMinutes > 60) {
                    const h = Math.floor(this.estimatedTimeMinutes / 60);
                    const m = this.estimatedTimeMinutes % 60;
                    timeEl.innerText = `${h}h ${m}m`;
                } else {
                    timeEl.innerText = `${this.estimatedTimeMinutes} min`;
                }
            } else {
                timeEl.innerText = 'N/A';
            }
        } catch (error) {
            console.error("Error estimando tiempo de ruta:", error);
            timeEl.innerText = 'Error';
        }
    }

    toggleReturnTrip() {
        this.isReturning = !this.isReturning;
        
        if (this.isReturning) {
            this.addRouteStop(19.4326, -99.1332, 'Base Central', 'return'); 
            this.showNotification('Regreso marcado', 'Muestra el QR al guardia para registrar entrada', 'success');
            
            if (this.currentTrip && this.currentTrip.access_code) {
                this.showAccessCode(this.currentTrip.access_code, 'return');
            }
        } else {
            this.routeStops = this.routeStops.filter(s => s.type !== 'return');
            this.renderRouteStops();
            this.updateMapMarkers();
            this.estimateRouteTime();
            
            const accessContainer = document.getElementById('access-code-container');
            if (accessContainer) accessContainer.classList.add('hidden');
        }
        this.updateReturnButtonUI();
    }

    updateReturnButtonUI() {
        const btn = document.getElementById('btn-return-trip');
        if (!btn) return;
        
        if (this.isReturning) {
            btn.classList.replace('bg-slate-700', 'bg-purple-600');
            btn.classList.replace('hover:bg-slate-600', 'hover:bg-purple-500');
            btn.innerHTML = '<span class="material-symbols-outlined text-[10px] align-middle mr-1">keyboard_return</span>Regreso Activo';
        } else {
            btn.classList.replace('bg-purple-600', 'bg-slate-700');
            btn.classList.replace('hover:bg-purple-500', 'hover:bg-slate-600');
            btn.innerHTML = 'Marcar Regreso';
        }
    }

    renderRouteStops() {
        const list = document.getElementById('route-stops-list');
        if (!list) return;

        if (this.routeStops.length === 0) {
            list.innerHTML = '<li class="text-slate-500 text-center py-2 text-[10px] border border-dashed border-[#324d67] rounded-lg">Agrega puntos a tu ruta tocando el mapa</li>';
            return;
        }

        list.innerHTML = this.routeStops.map((stop, index) => `
            <li class="flex justify-between items-center bg-[#1c2127] p-2 rounded-lg border border-[#324d67] group">
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="w-5 h-5 rounded-full ${stop.type === 'return' ? 'bg-purple-500' : 'bg-primary'} text-[10px] flex items-center justify-center font-black text-white shrink-0 shadow">${index + 1}</span>
                    <div class="flex flex-col overflow-hidden">
                        <span class="truncate font-bold text-[11px]" title="${stop.name}">${stop.name}</span>
                        <span class="text-[8px] text-[#92adc9]">${stop.type === 'return' ? 'Trayecto final' : 'Parada intermedia'}</span>
                    </div>
                </div>
                <button onclick="window.conductorModule.removeRouteStop(${index})" class="text-slate-500 hover:text-red-500 p-1 shrink-0 bg-[#111a22] rounded-md border border-[#233648]">
                    <span class="material-symbols-outlined text-[14px]">delete</span>
                </button>
            </li>
        `).join('');
    }

    async saveRoutePlan() {
        if (!this.currentTrip) return;

        const btn = document.querySelector('[onclick="window.conductorModule.saveRoutePlan()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="animate-spin inline-block mr-2 text-[16px]">⏳</span> GUARDANDO...';
        }

        try {
            const currentDetails = this.currentTrip.request_details || {};
            const newDetails = { 
                ...currentDetails, 
                route_plan: this.routeStops, 
                is_returning: this.isReturning 
            };

            await this.updateTripInDatabase({ request_details: newDetails });
            
            this.showNotification('✅ Ruta Guardada', 'Se ha actualizado el plan de viaje', 'success');

            if (btn) {
                btn.classList.replace('bg-green-600', 'bg-emerald-500');
                btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> RUTA CONFIRMADA';
                
                setTimeout(() => { 
                    btn.disabled = false;
                    btn.classList.replace('bg-emerald-500', 'bg-green-600');
                    btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span> Guardar Ruta'; 
                }, 2500);
            }
        } catch (e) {
            this.showNotification('❌ Error', 'No se pudo guardar la ruta', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = 'Guardar Ruta'; }
        }
    }

    // ==================== FUNCIONES DE SOLICITUD Y MÚLTIPLES RUTAS ====================
    
    addDestinoInput() {
        const container = document.getElementById('destinos-container');
        if (!container) return;
        
        const count = container.querySelectorAll('.solicitud-destino-input').length + 1;
        
        const div = document.createElement('div');
        div.className = "flex gap-2 items-center mt-2 animate-fade-in-up";
        div.innerHTML = `
            <span class="w-6 h-6 rounded-full bg-slate-600 text-[10px] flex items-center justify-center font-black text-white shrink-0">${count}</span>
            <input type="text" class="solicitud-destino-input w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" placeholder="Destino / Parada extra">
            <button onclick="this.parentElement.remove(); window.conductorModule.updateDestinosCount();" class="text-red-500 p-2 hover:bg-red-500/10 rounded-lg shrink-0">
                <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
        `;
        container.appendChild(div);
    }
    
    updateDestinosCount() {
        const container = document.getElementById('destinos-container');
        if (!container) return;
        const bubbles = container.querySelectorAll('span.rounded-full');
        bubbles.forEach((bubble, index) => {
            bubble.innerText = index + 1;
        });
    }

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
            const { data: vehs, error } = await supabase.from('vehicles').select('*').eq('status', 'active');
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
                            <button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-lg">Solicitar</button>
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

    async enviarSolicitud() {
        if (this.currentTrip && this.currentTrip.status !== 'completed') {
            this.showNotification('❌ No disponible', 'Ya tienes un viaje en curso', 'error');
            return;
        }

        if (!this.userId) {
            alert('Error de sesión. Por favor, recarga la página.');
            return;
        }

        const vehicleId = document.getElementById('solicitud-vehicle').value;
        const motivo = document.getElementById('solicitud-motivo').value;
        const jefeDirecto = document.getElementById('solicitud-jefe').value;
        
        const destinoInputs = document.querySelectorAll('.solicitud-destino-input');
        let destinosArray = [];
        destinoInputs.forEach(input => {
            if(input.value.trim() !== '') destinosArray.push(input.value.trim());
        });
        
        if (!vehicleId) { alert('Por favor selecciona una unidad'); return; }
        if (destinosArray.length === 0) { alert('Por favor ingresa al menos un destino'); return; }
        if (!motivo) { alert('Por favor ingresa el motivo del viaje'); return; }
        if (!jefeDirecto) { alert('Por favor ingresa el nombre del jefe directo'); return; }

        const destinoPrincipalStr = destinosArray.join(' -> '); 

        const btn = document.querySelector('[onclick="window.conductorModule.enviarSolicitud()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'ENVIANDO...';
        }

        try {
            const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            this.accessCode = accessCode;
            
            const newTrip = {
                driver_id: this.userId,
                vehicle_id: vehicleId,
                status: 'requested',
                access_code: accessCode,
                destination: destinoPrincipalStr, 
                supervisor: jefeDirecto,
                request_details: {
                    destinos_lista: destinosArray, 
                    destination: destinoPrincipalStr,
                    motivo: motivo,
                    supervisor: jefeDirecto,
                    requested_at: new Date().toISOString(),
                    vehicle_id: vehicleId
                },
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('trips').insert([newTrip]).select();

            if (error) throw error;

            const destinosContainer = document.getElementById('destinos-container');
            if(destinosContainer) {
                destinosContainer.innerHTML = `
                <div class="flex gap-2 items-center">
                    <span class="w-6 h-6 rounded-full bg-primary text-[10px] flex items-center justify-center font-black text-white shrink-0">1</span>
                    <input type="text" class="solicitud-destino-input w-full bg-[#111a22] border border-[#233648] text-white p-3 rounded-xl" placeholder="Ej: Zona industrial, Centro, etc.">
                </div>`;
            }
            document.getElementById('solicitud-vehicle').value = '';
            document.getElementById('solicitud-motivo').value = '';
            document.getElementById('solicitud-jefe').value = '';
            
            const checklistContainer = document.getElementById('last-checklist-container');
            if (checklistContainer) checklistContainer.classList.add('hidden');
            
            this.showNotification('✅ Solicitud enviada', 'Espera la aprobación del supervisor', 'success');
            
            this.switchTab('unidad');
            await this.loadDashboardState();

        } catch (error) {
            console.error('❌ Error enviando solicitud:', error);
            alert('Error al enviar la solicitud: ' + (error.message || 'Intente de nuevo.'));
            this.showNotification('❌ Error', 'No se pudo enviar la solicitud', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'ENVIAR SOLICITUD';
            }
        }
    }

    // ==================== RESUMEN Y ESTADOS ====================

    cargarResumenViaje() {
        // Al estar el GPS apagado, no calcularemos distancias ahora, dejamos esto seguro
        const distanciaEl = document.getElementById('resumen-distancia');
        const combustibleEl = document.getElementById('resumen-combustible');
        
        if (distanciaEl) distanciaEl.innerText = Math.round(this.tripLogistics.totalDistance) + ' km';
        if (combustibleEl) combustibleEl.innerText = Math.round(this.tripLogistics.totalDistance / 8) + ' L';
    }

    async confirmarLiberacionTaller() {
        if (!this.currentTrip) return;
        try {
            const { error } = await supabase.from('trips').update({
                status: 'completed',
                completed_at: new Date().toISOString()
            }).eq('id', this.currentTrip.id);

            if (error) throw error;
            this.showNotification('✅ Unidad liberada', 'Puedes solicitar una nueva unidad', 'success');
        } catch (error) {
            console.error('Error liberando unidad:', error);
            this.showNotification('❌ Error', 'No se pudo liberar la unidad', 'error');
        }
    }

    async loadProfileData() {
        if (!this.userId) return;
        try {
            const { data: p, error } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
            if (error) return;
            
            if(p) {
                this.profile = p;
                const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
                const setBg = (id, url) => { const el = document.getElementById(id); if (el) el.style.backgroundImage = `url('${url}')`; };
                
                setEl('profile-name', p.full_name || 'Conductor');
                setBg('profile-avatar', p.photo_url || '');
                setEl('card-full-name', p.full_name || 'Conductor');
                setBg('card-photo', p.photo_url || '');
                setEl('lic-number', p.license_number || 'No Registrada');
                setEl('profile-manager', p.supervisor_name || 'Central COV');
                setEl('conductor-nombre', p.full_name || 'Conductor');
            }
        } catch (error) {
            console.error('Error en loadProfileData:', error);
        }
    }

    async loadDashboardState() {
        if (!this.userId) return;
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
            if (trip && trip.status !== 'completed') {
                this.currentTrip = trip;
            } else {
                this.currentTrip = null;
            }

            await this.updateUIByStatus(trip);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        }
    }

    async updateUIByStatus(trip) {
        const statusMap = {
            'requested': { text: 'Solicitud enviada', color: 'bg-yellow-500' },
            'approved_for_taller': { text: 'Dirígete a taller (Paso 1)', color: 'bg-orange-500' },
            'driver_accepted': { text: 'Listo para salir', color: 'bg-green-500' },
            'in_progress': { text: 'En ruta', color: 'bg-primary' },
            'awaiting_return_checklist': { text: 'Regresado - Ve a taller', color: 'bg-purple-500' },
            'incident_report': { text: 'INCIDENCIA', color: 'bg-red-500' },
            'completed': { text: 'Viaje completado', color: 'bg-emerald-500' }
        };

        const titleUnits = document.querySelector('#tab-unidad h3');
        const unitsContent = document.getElementById('unidad-content');
        const noUnitsMsg = document.getElementById('no-units-message');
        const profileStatus = document.getElementById('profile-status');
        const solicitudBtn = document.querySelector('[onclick="window.conductorModule.switchTab(\'solicitud\')"]');
        const returnMsg = document.getElementById('return-to-workshop-container');

        if (trip && statusMap[trip.status] && trip.status !== 'completed') {
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
            
            if (trip.status === 'awaiting_return_checklist') {
                if (returnMsg) returnMsg.classList.remove('hidden');
                this.cargarResumenViaje();
            } else {
                if (returnMsg) returnMsg.classList.add('hidden');
            }
            
            if (solicitudBtn) { solicitudBtn.classList.add('opacity-50'); solicitudBtn.disabled = true; }
            
            if (trip.status === 'driver_accepted' && trip.access_code) {
                this.showAccessCode(trip.access_code, 'exit');
            } else if (this.isReturning && trip.status === 'in_progress') {
                this.showAccessCode(trip.access_code, 'return');
            }
            
            if (trip.status === 'approved_for_taller') {
                const tInfo = document.getElementById('taller-vehicle-info');
                if (tInfo) tInfo.innerText = `ECO-${trip.vehicles?.economic_number} - ${trip.vehicles?.plate}`;
            }

            if (trip.status === 'incident_report') this.showIncidentMessage(trip);
            
            if (trip.status === 'in_progress' && this.activeTab === 'ruta') {
                setTimeout(() => {
                    this.initDriverMap();
                    this.startTracking();
                }, 500);
            }
            
            if (trip.status !== 'in_progress') this.stopTracking();
            
        } else {
            const currentTripInfo = document.getElementById('current-trip-info');
            if (currentTripInfo) currentTripInfo.classList.add('hidden');
            
            const accessContainer = document.getElementById('access-code-container');
            if (accessContainer) accessContainer.classList.add('hidden');
            
            if (returnMsg) returnMsg.classList.add('hidden');
            
            const normalMsg = document.getElementById('taller-normal-message');
            const incidentMsg = document.getElementById('taller-incident-message');
            if (normalMsg) normalMsg.classList.remove('hidden');
            if (incidentMsg) incidentMsg.classList.add('hidden');
            
            if (profileStatus) profileStatus.innerText = "Disponible";
            this.stopTracking();
            
            if (titleUnits) titleUnits.classList.remove('hidden');
            await this.loadAvailableUnitsForMainView();
            
            if (solicitudBtn) { solicitudBtn.classList.remove('opacity-50'); solicitudBtn.disabled = false; }
        }
    }

    // ==================== FUNCIONES DEL VIAJE (NOTAS Y EMERGENCIA) ====================
    
    async saveTripNotes() {
        const notes = document.getElementById('trip-notes')?.value;
        if (!notes || !this.currentTrip) return;

        if (!this.tripLogistics.notes) this.tripLogistics.notes = [];
        this.tripLogistics.notes.push({ text: notes, timestamp: new Date().toISOString() });

        await this.updateTripInDatabase({ notes: this.tripLogistics.notes });
        
        const notesEl = document.getElementById('trip-notes');
        if (notesEl) notesEl.value = '';
        this.showNotification('✅ Nota guardada', 'Se agregó al registro del viaje', 'success');
    }

    async activateEmergency() {
        const description = document.getElementById('emergency-desc')?.value;
        if (!description) { alert('Por favor describe la emergencia'); return; }
        if (!this.currentTrip) { alert('No hay un viaje activo'); return; }
        
        const emergencyCode = 'EMG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryTime = new Date(Date.now() + 30 * 60000);

        try {
            await this.updateTripInDatabase({
                emergency_code: emergencyCode,
                emergency_expiry: expiryTime.toISOString(),
                notes: [...(this.tripLogistics.notes || []), {
                    type: 'emergency', description: description, code: emergencyCode, timestamp: new Date().toISOString()
                }]
            });

            alert(`🚨 EMERGENCIA REGISTRADA\nCódigo: ${emergencyCode}\nMantén la calma, ayuda en camino.`);
            
            const modal = document.getElementById('modal-emergency');
            if (modal) modal.classList.add('hidden');
            
            const descEl = document.getElementById('emergency-desc');
            if (descEl) descEl.value = '';
            
        } catch (error) {
            console.error('Error reportando emergencia:', error);
            alert('Error al reportar emergencia');
        }
    }

    // ==================== ACTUALIZAR SUPABASE ====================
    
    async updateTripInDatabase(updates) {
        if (!this.currentTrip) return;
        try {
            const { error } = await supabase.from('trips').update(updates).eq('id', this.currentTrip.id);
            if (error) console.error('Error actualizando viaje:', error);
        } catch (error) {
            console.error('Error en updateTripInDatabase:', error);
        }
    }

    // ==================== NAVEGACIÓN ====================
    
    switchTab(tabId) {
        if (tabId === 'solicitud' && this.currentTrip && this.currentTrip.status !== 'completed') {
            this.showNotification('❌ No disponible', 'Ya tienes un viaje en curso', 'error');
            return;
        }

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

        if (tabId === 'solicitud') this.loadAvailableUnits();
        if (tabId === 'unidad') this.loadDashboardState();
        if (tabId === 'ruta') {
            if (this.currentTrip?.status === 'in_progress') {
                document.getElementById('route-waiting-msg')?.classList.add('hidden');
                document.getElementById('active-trip-panel')?.classList.remove('hidden');
                setTimeout(() => {
                    this.initDriverMap();
                    this.startTracking();
                }, 300);
            } else {
                document.getElementById('route-waiting-msg')?.classList.remove('hidden');
                document.getElementById('active-trip-panel')?.classList.add('hidden');
            }
        }
        if (tabId === 'taller-final') {
            if (this.currentTrip?.status === 'incident_report') this.showIncidentMessage(this.currentTrip);
        }
        if (tabId === 'perfil') this.loadProfileData();
    }

    destroy() {
        if (this.backgroundSyncInterval) clearInterval(this.backgroundSyncInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
        this.stopTracking();
    }
}

window.logoutDriver = function() {
    if (window.conductorModule && typeof window.conductorModule.logout === 'function') {
        window.conductorModule.logout();
    } else {
        localStorage.clear();
        window.location.hash = '#login';
        window.location.reload();
    }
};
