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
        this.realtimeChannel = null;
        this.updateInterval = null;
        this.forceUpdateInterval = null;
        
        // Variables para Ping Inteligente y Broadcast
        this.lastBroadcastTime = 0;
        this.lastBroadcastPos = null;
        this.broadcastChannel = null; 
        
        // Variables para Gestión de Rutas y Mapa del Conductor
        this.driverMap = null;
        this.driverMarkers = [];
        this.routeStops = [];
        this.isReturning = false;
        
        // Variables para Vehículo Local y Segundo Plano
        this.myLocationMarker = null; 
        this.wakeLock = null;
        
        // Sistema de logística
        this.tripLogistics = {
            startTime: null,
            exitTime: null,
            entryTime: null,
            exitGateTime: null,
            entryGateTime: null,
            exitKm: null,
            entryKm: null,
            totalDistance: 0,
            lastSpeed: 0,
            lastUpdateTime: null,
            lastPosition: null,
            emergencyCode: null,
            emergencyExpiry: null,
            notes: []
        };
        
        window.conductorModule = this;
        
        // Recuperador de segundo plano: Si el usuario minimizó la app y vuelve, forzar sync
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.currentTrip?.status === 'in_progress') {
                this.requestWakeLock();
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(pos => this.handlePositionUpdate(pos));
                }
            }
        });
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 border-b border-[#233648] px-5 py-3 bg-[#111a22] z-20">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div id="profile-avatar" class="shrink-0 h-10 w-10 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                            <div>
                                <h2 id="profile-name" class="text-white text-sm font-bold">Cargando...</h2>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span id="connection-indicator" class="relative flex h-2 w-2">
                                        <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span id="profile-status" class="text-[#92adc9] text-[9px] font-bold uppercase">Conectado</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="document.getElementById('modal-emergency').classList.remove('hidden')" class="h-9 w-9 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                <span class="material-symbols-outlined text-sm">emergency</span>
                            </button>
                            <button onclick="window.conductorModule.logout()" class="h-9 w-9 bg-[#233648] border border-[#324d67] rounded-full text-white flex items-center justify-center hover:text-red-400 transition-all">
                                <span class="material-symbols-outlined text-sm">logout</span>
                            </button>
                        </div>
                    </div>

                    <div id="access-code-banner" class="hidden mt-3 bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-xl animate-pulse">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-white text-[8px] font-bold uppercase opacity-80">Código de acceso</p>
                                <p id="access-code-display" class="text-white text-2xl font-mono font-black tracking-widest">------</p>
                            </div>
                            <span class="material-symbols-outlined text-3xl text-white/50">qr_code</span>
                        </div>
                        <p class="text-green-200 text-[8px] mt-1">Muestra este código al guardia al salir</p>
                    </div>

                    <div id="incident-banner" class="hidden mt-3 bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-xl">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-white">warning</span>
                            <div>
                                <p class="text-white text-[10px] font-bold uppercase">Incidencia reportada</p>
                                <p id="incident-message" class="text-white/90 text-[8px]">Unidad en revisión - Espera resolución</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative pb-20" id="main-content">
                    
                    <section id="tab-unidad" class="tab-content block p-4 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70 px-1">Unidades Disponibles</h3>
                        
                        <div id="unidad-loader" class="flex justify-center py-10">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        
                        <div id="unidad-content" class="space-y-3 hidden"></div>
                        
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
                    </section>

                    <section id="tab-formulario" class="tab-content hidden p-4 space-y-4">
                        <div class="bg-gradient-to-br from-[#192633] to-[#1a2533] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#233648] pb-3">
                                <span class="material-symbols-outlined text-primary">assignment</span> Solicitar Unidad
                            </h3>
                            
                            <div id="solicitud-form" class="space-y-4">
                                <div id="no-vehicle-selected-msg" class="bg-yellow-500/10 border border-yellow-500/30 p-5 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-3xl text-yellow-500 mb-2">info</span>
                                    <p class="text-white text-sm mb-3">Primero selecciona una unidad</p>
                                    <button onclick="window.conductorModule.switchTab('unidad')" 
                                            class="px-6 py-3 bg-primary text-white text-xs font-bold rounded-lg w-full">
                                        VER UNIDADES DISPONIBLES
                                    </button>
                                </div>
                                
                                <div id="form-content" class="hidden space-y-4">
                                    <div class="bg-primary/10 p-4 rounded-xl border border-primary/30">
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-2">Unidad seleccionada</label>
                                        <div id="selected-vehicle-display" class="text-white font-bold text-lg">
                                            Cargando...
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">
                                            <span class="material-symbols-outlined text-sm align-middle">location_on</span> Ubicación de destino
                                        </label>
                                        <div class="relative">
                                            <input type="text" id="solicitud-destino" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl pr-12 text-sm" 
                                                   placeholder="Ej: Zona industrial, Centro...">
                                            <button onclick="window.conductorModule.getCurrentLocationForDestination()" 
                                                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary/40 transition-colors">
                                                <span class="material-symbols-outlined text-sm">my_location</span>
                                            </button>
                                        </div>
                                        <div id="destination-coords" class="text-[9px] text-[#92adc9] mt-1 hidden">
                                            Lat: <span id="dest-lat">0</span> | Lon: <span id="dest-lon">0</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">
                                            <span class="material-symbols-outlined text-sm align-middle">description</span> Motivo del viaje
                                        </label>
                                        <input type="text" id="solicitud-motivo" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl text-sm" 
                                               placeholder="Ej: Entrega, recolección, reunión...">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">
                                            <span class="material-symbols-outlined text-sm align-middle">supervisor_account</span> Jefe Inmediato
                                        </label>
                                        <input type="text" id="solicitud-jefe" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl text-sm" 
                                               placeholder="Nombre del jefe directo">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">
                                            <span class="material-symbols-outlined text-sm align-middle">business</span> Departamento
                                        </label>
                                        <input type="text" id="solicitud-departamento" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl text-sm" 
                                               placeholder="Ej: Logística, Ventas, Operaciones...">
                                    </div>
                                    
                                    <div id="last-checklist-container" class="hidden bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                                        <h4 class="text-[10px] font-bold text-[#92adc9] uppercase mb-3 flex items-center gap-1">
                                            <span class="material-symbols-outlined text-sm">checklist</span> Último checklist
                                        </h4>
                                        <div id="last-checklist-content" class="text-xs text-white"></div>
                                    </div>
                                    
                                    <button onclick="window.conductorModule.enviarSolicitud()" 
                                            class="w-full py-5 bg-primary text-white font-black rounded-xl uppercase text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                        ENVIAR SOLICITUD
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-taller-inicial" class="tab-content hidden p-4 space-y-4">
                        <div class="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-2xl p-5 shadow-xl">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="bg-orange-500/20 p-3 rounded-full">
                                    <span class="material-symbols-outlined text-3xl text-orange-500">engineering</span>
                                </div>
                                <div>
                                    <h3 class="text-white font-bold text-lg">Recepción en Taller</h3>
                                    <p class="text-orange-400 text-xs">Paso 1 de 3</p>
                                </div>
                            </div>
                            
                            <div id="taller-inicial-content" class="space-y-4">
                                <div class="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                                    <p class="text-white text-sm">Tu solicitud fue aprobada. Dirígete a taller.</p>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-1">Unidad asignada</p>
                                    <h4 id="taller-vehicle-info" class="text-white font-bold text-lg">--</h4>
                                </div>
                                
                                <div class="bg-[#111a22] p-4 rounded-xl">
                                    <div class="flex justify-between text-[10px] text-[#92adc9] mb-2">
                                        <span>Esperando taller</span>
                                        <span>En revisión</span>
                                        <span>Completado</span>
                                    </div>
                                    <div class="h-2 bg-[#233648] rounded-full overflow-hidden">
                                        <div class="h-full w-1/3 bg-orange-500 rounded-full" id="taller-progress"></div>
                                    </div>
                                </div>
                                
                                <div id="reception-photos-gallery" class="hidden">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Fotos tomadas</p>
                                    <div id="reception-photos-grid" class="grid grid-cols-3 gap-2"></div>
                                </div>
                                
                                <div id="taller-complete-message" class="hidden bg-green-600/20 border border-green-500/30 p-4 rounded-xl text-center">
                                    <span class="material-symbols-outlined text-3xl text-green-500 mb-2">check_circle</span>
                                    <p class="text-white text-sm">¡Recepción completada! Ya puedes pasar con el guardia.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        <div class="p-4 space-y-4">
                            <div id="route-waiting-msg" class="bg-[#192633] border border-[#233648] rounded-2xl p-8 text-center">
                                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <h3 class="text-white font-bold text-lg">Esperando Salida</h3>
                                <p class="text-[#92adc9] text-xs mt-2">Esperando autorización del guardia...</p>
                            </div>

                            <div id="active-trip-panel" class="hidden space-y-4">
                                
                                <div class="bg-[#192633] rounded-xl overflow-hidden border border-[#233648] flex flex-col shadow-lg">
                                    <div id="driver-map" class="w-full h-48 z-0 relative bg-[#111a22]"></div>
                                    <div class="p-3 bg-[#111a22]">
                                        <div class="flex gap-2 mb-3">
                                            <input type="text" id="route-search-input" class="flex-1 bg-[#1c2127] border border-[#324d67] text-white text-xs p-2 rounded-lg focus:outline-none focus:border-primary" placeholder="Buscar dirección (ej: Zocalo)...">
                                            <button onclick="window.conductorModule.searchAddress()" class="bg-primary text-white px-3 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                                <span class="material-symbols-outlined text-sm">search</span>
                                            </button>
                                        </div>
                                        
                                        <div class="flex justify-between items-center mb-2">
                                            <p class="text-[10px] text-[#92adc9] uppercase font-bold flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[12px]">format_list_bulleted</span> Trayectos
                                            </p>
                                            <button onclick="window.conductorModule.toggleReturnTrip()" id="btn-return-trip" class="text-[9px] bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded font-bold uppercase transition-colors shadow-md">
                                                Marcar Regreso
                                            </button>
                                        </div>
                                        
                                        <ul id="route-stops-list" class="space-y-2 text-xs text-white mb-3">
                                            <li class="text-slate-500 text-center py-2 text-[10px] border border-dashed border-[#324d67] rounded-lg">Busca o toca el mapa para agregar destinos</li>
                                        </ul>
                                        
                                        <button onclick="window.conductorModule.saveRoutePlan()" class="w-full py-2.5 bg-green-600 text-white rounded-lg text-xs uppercase font-black shadow-lg transition-colors hover:bg-green-500 flex justify-center items-center gap-2">
                                            <span class="material-symbols-outlined text-[16px]">save</span> Guardar Ruta
                                        </button>
                                    </div>
                                </div>

                                <div class="bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-2xl p-5 border border-primary/30">
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div class="bg-[#111a22] p-3 rounded-xl shadow-inner">
                                            <p class="text-[8px] text-[#92adc9] uppercase font-bold">Velocidad</p>
                                            <p id="live-speed" class="text-2xl font-black text-primary">0</p>
                                            <p class="text-[8px] text-[#92adc9]">km/h</p>
                                        </div>
                                        <div class="bg-[#111a22] p-3 rounded-xl shadow-inner">
                                            <p class="text-[8px] text-[#92adc9] uppercase font-bold">Distancia</p>
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
                                            <span class="text-[#92adc9] font-bold">Tiempo transcurrido</span>
                                            <span id="trip-duration" class="text-white font-black font-mono">00:00:00</span>
                                        </div>
                                    </div>
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

                            <div class="bg-[#111a22] border border-[#233648] rounded-xl p-4 shadow-lg">
                                <div id="gps-status-indicator" class="text-center">
                                    <div class="flex items-center justify-center gap-2 text-slate-400">
                                        <span class="material-symbols-outlined animate-pulse">gps_fixed</span>
                                        <span class="text-xs font-bold uppercase tracking-wider">GPS Inactivo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-taller-final" class="tab-content hidden p-4 space-y-4">
                        <div class="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-5 shadow-xl">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="bg-purple-500/20 p-3 rounded-full">
                                    <span class="material-symbols-outlined text-3xl text-purple-500">assignment_turned_in</span>
                                </div>
                                <div>
                                    <h3 class="text-white font-bold text-lg">Entrega en Taller</h3>
                                    <p class="text-purple-400 text-xs">Paso 3 de 3</p>
                                </div>
                            </div>
                            
                            <div id="taller-final-content" class="space-y-4">
                                <div class="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
                                    <p class="text-white text-sm">Viaje terminado. Dirígete a taller para revisión final.</p>
                                </div>
                                
                                <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
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
                                
                                <div id="return-photos-gallery" class="hidden bg-[#111a22] border border-[#324d67] p-4 rounded-xl">
                                    <p class="text-[10px] text-[#92adc9] uppercase mb-2">Fotos de entrega</p>
                                    <div id="return-photos-grid" class="grid grid-cols-3 gap-2"></div>
                                </div>
                                
                                <div class="bg-[#111a22] p-4 rounded-xl">
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
                                        CONFIRMAR LIBERACIÓN
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-4">
                        <div class="bg-white rounded-3xl p-6 shadow-2xl">
                            <div class="flex items-center gap-4 mb-6">
                                <div id="card-photo" class="h-16 w-16 rounded-2xl bg-slate-200 bg-cover bg-center border-2 border-primary"></div>
                                <div class="flex-1">
                                    <span class="text-[9px] font-black text-slate-400 uppercase">Conductor</span>
                                    <h3 id="card-full-name" class="text-slate-900 text-xl font-bold mt-1">--</h3>
                                </div>
                            </div>

                            <div class="bg-slate-50 p-4 rounded-2xl mb-4">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-3 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm text-primary">badge</span> Datos
                                </h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-[10px] text-slate-500">Licencia</span>
                                        <span id="lic-number" class="text-slate-800 text-xs font-mono font-bold">--</span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-slate-50 p-4 rounded-2xl">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-3 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm text-primary">history</span> Último viaje
                                </h4>
                                <div id="last-trip-info" class="text-xs">
                                    <div class="text-center py-4 text-slate-400" id="last-trip-loading">
                                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                        <p>Cargando...</p>
                                    </div>
                                    <div id="last-trip-content" class="hidden">
                                        <div class="bg-primary/5 p-3 rounded-xl mb-2">
                                            <p class="text-slate-600 text-[10px] uppercase">Unidad</p>
                                            <p id="last-trip-vehicle" class="text-slate-900 font-bold text-sm">--</p>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div class="bg-primary/5 p-2 rounded-lg">
                                                <p class="text-slate-600 text-[8px] uppercase">Fecha</p>
                                                <p id="last-trip-date" class="text-slate-900 font-bold text-xs">--</p>
                                            </div>
                                            <div class="bg-primary/5 p-2 rounded-lg">
                                                <p class="text-slate-600 text-[8px] uppercase">Distancia</p>
                                                <p id="last-trip-distance" class="text-slate-900 font-bold text-xs">-- km</p>
                                            </div>
                                        </div>
                                        <div class="bg-primary/5 p-2 rounded-lg">
                                            <p class="text-slate-600 text-[8px] uppercase">Destino</p>
                                            <p id="last-trip-destination" class="text-slate-900 font-bold text-xs truncate">--</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4 grid grid-cols-2 gap-2">
                                <div class="bg-slate-50 p-3 rounded-xl">
                                    <p class="text-[8px] text-slate-500 uppercase">Viajes totales</p>
                                    <p id="total-trips" class="text-slate-900 font-black text-xl">0</p>
                                </div>
                                <div class="bg-slate-50 p-3 rounded-xl">
                                    <p class="text-[8px] text-slate-500 uppercase">Km totales</p>
                                    <p id="total-km" class="text-slate-900 font-black text-xl">0</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-16 z-30">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active text-primary flex flex-col items-center justify-center flex-1 h-full">
                        <span class="material-symbols-outlined text-xl">directions_car</span>
                        <span class="text-[8px] font-bold uppercase mt-0.5">Unidad</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('formulario')" id="nav-formulario" class="nav-btn text-slate-500 flex flex-col items-center justify-center flex-1 h-full">
                        <span class="material-symbols-outlined text-xl">assignment</span>
                        <span class="text-[8px] font-bold uppercase mt-0.5">Solicitar</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn text-slate-500 flex flex-col items-center justify-center flex-1 h-full">
                        <span class="material-symbols-outlined text-xl">route</span>
                        <span class="text-[8px] font-bold uppercase mt-0.5">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn text-slate-500 flex flex-col items-center justify-center flex-1 h-full">
                        <span class="material-symbols-outlined text-xl">badge</span>
                        <span class="text-[8px] font-bold uppercase mt-0.5">Perfil</span>
                    </button>
                </nav>

                <div id="modal-emergency" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
                    <div class="bg-[#1c2127] w-full max-w-md rounded-3xl p-6 border border-red-500/30">
                        <span class="material-symbols-outlined text-5xl text-red-500 mb-4 block">emergency</span>
                        <h3 class="text-white font-bold text-lg mb-2">Reporte de Emergencia</h3>
                        <p class="text-[#92adc9] text-sm mb-6">Describe la situación</p>
                        
                        <textarea id="emergency-desc" rows="3" 
                                  class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl mb-4"
                                  placeholder="Describe lo sucedido..."></textarea>
                        
                        <button onclick="window.conductorModule.activateEmergency()" 
                                class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase text-sm mb-2">
                            REPORTAR EMERGENCIA
                        </button>
                        <button onclick="document.getElementById('modal-emergency').classList.add('hidden')" 
                                class="w-full py-3 text-[#92adc9] hover:text-white transition-colors text-xs uppercase">
                            Cancelar
                        </button>
                    </div>
                </div>

                <div id="notification-toast" class="hidden fixed bottom-20 left-4 right-4 z-40 animate-slide-up">
                    <div class="bg-[#1c2127] border border-primary/30 rounded-xl p-4 shadow-2xl">
                        <div class="flex items-center gap-3">
                            <div id="toast-icon" class="text-primary">
                                <span class="material-symbols-outlined">info</span>
                            </div>
                            <div class="flex-1">
                                <p id="toast-title" class="text-white text-sm font-bold"></p>
                                <p id="toast-message" class="text-[#92adc9] text-xs"></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    .leaflet-container { z-index: 0 !important; font-family: 'Inter', sans-serif; }
                    .custom-stop-marker { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); }
                    .local-car-marker { filter: drop-shadow(0 0 10px #10b981); transition: transform 1s ease-in-out; }
                </style>
            </div>
        </div>
        `;
    }

    // --- SOLICITAR MANTENER PANTALLA ENCENDIDA (SEGUNDO PLANO WEB) ---
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator && !this.wakeLock) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock liberado.');
                    this.wakeLock = null;
                });
                console.log('✅ Screen Wake Lock activado (App protegida en 2do plano).');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message} (Wake Lock falló)`);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock !== null) {
            this.wakeLock.release()
                .then(() => { this.wakeLock = null; });
        }
    }

    // ==================== LÓGICA DE MAPA Y RUTAS ====================
    async initDriverMap() {
        if (this.driverMap || !window.L) return;
        
        try {
            const L = window.L;
            const center = this.tripLogistics.lastPosition 
                ? [this.tripLogistics.lastPosition.lat, this.tripLogistics.lastPosition.lng] 
                : [19.4683, -99.2360]; 
                
            this.driverMap = L.map('driver-map', {
                zoomControl: false,
                attributionControl: false
            }).setView(center, 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 19
            }).addTo(this.driverMap);
            
            const carIconHtml = `<div class="bg-[#10b981] w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_#10b981] animate-pulse"></div>`;
            const carIcon = L.divIcon({ className: 'local-car-marker', html: carIconHtml, iconSize: [16, 16], iconAnchor: [8, 8] });
            
            if (this.tripLogistics.lastPosition) {
                this.myLocationMarker = L.marker([this.tripLogistics.lastPosition.lat, this.tripLogistics.lastPosition.lng], { icon: carIcon }).addTo(this.driverMap);
            }

            this.driverMap.on('click', (e) => {
                this.addStopFromMap(e.latlng.lat, e.latlng.lng);
            });
            
            if (this.currentTrip?.request_details?.route_plan) {
                this.routeStops = this.currentTrip.request_details.route_plan;
                this.isReturning = this.currentTrip.request_details.is_returning || false;
            } else if (this.currentTrip?.request_details?.destination_coords) {
                const destLat = this.currentTrip.request_details.destination_coords.lat;
                const destLon = this.currentTrip.request_details.destination_coords.lon;
                
                if (destLat !== 0 && destLon !== 0) {
                    const destName = this.currentTrip.destination || 'Destino Inicial';
                    this.routeStops = [{
                        id: 'stop_auto', lat: destLat, lng: destLon, name: destName, type: 'stop', timestamp: new Date().toISOString()
                    }];
                    this.saveRoutePlanSilently(); 
                }
            }

            this.renderRouteStops();
            this.updateMapMarkers();
            this.updateReturnButtonUI();

            setTimeout(() => this.driverMap.invalidateSize(), 400);
            
        } catch (e) {
            console.error("Error iniciando mapa:", e);
        }
    }

    async saveRoutePlanSilently() {
        if (!this.currentTrip) return;
        const currentDetails = this.currentTrip.request_details || {};
        await this.updateTripInDatabase({ 
            request_details: { ...currentDetails, route_plan: this.routeStops, is_returning: this.isReturning } 
        });
    }

    async searchAddress() {
        const input = document.getElementById('route-search-input');
        const query = input.value;
        if (!query) return;
        
        this.showToast('Buscando...', 'Consultando mapa', 'info');
        
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=es`);
            const data = await res.json();
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                const shortName = data[0].display_name.split(',')[0]; 
                
                this.addRouteStop(lat, lon, shortName, 'stop');
                if (this.driverMap) this.driverMap.flyTo([lat, lon], 15);
                input.value = '';
            } else {
                this.showToast('No encontrado', 'Intenta con otra dirección', 'warning');
            }
        } catch (e) {
            console.error('Error buscando:', e);
            this.showToast('Error', 'Fallo en la búsqueda de mapa', 'error');
        }
    }

    async addStopFromMap(lat, lng) {
        this.showToast('Agregando punto...', 'Extrayendo dirección', 'info');
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
    }

    removeRouteStop(index) {
        if (this.routeStops[index].type === 'return') {
            this.isReturning = false;
            this.updateReturnButtonUI();
        }
        this.routeStops.splice(index, 1);
        this.renderRouteStops();
        this.updateMapMarkers();
    }

    toggleReturnTrip() {
        this.isReturning = !this.isReturning;
        if (this.isReturning) {
            this.addRouteStop(19.4683, -99.2360, 'C. Hormona 2, Naucalpan, 53489 Naucalpan de Juárez, Méx.', 'return');
            this.showToast('Regreso marcado', 'Ruta hacia la base añadida', 'success');
        } else {
            this.routeStops = this.routeStops.filter(s => s.type !== 'return');
            this.renderRouteStops();
            this.updateMapMarkers();
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
            this.driverMarkers.push(marker);
        });
        
        if (this.driverMarkers.length > 0) {
            const group = new L.featureGroup(this.driverMarkers);
            if (this.myLocationMarker) {
                group.addLayer(this.myLocationMarker);
            }
            this.driverMap.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 15 });
        }
    }

    renderRouteStops() {
        const list = document.getElementById('route-stops-list');
        if (!list) return;
        
        if (this.routeStops.length === 0) {
            list.innerHTML = '<li class="text-slate-500 text-center py-2 text-[10px] border border-dashed border-[#324d67] rounded-lg">Busca o toca el mapa para agregar destinos</li>';
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
        
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin inline-block mr-2 text-[16px]">hourglass_empty</span> GUARDANDO...';
        
        const currentDetails = this.currentTrip.request_details || {};
        const newDetails = {
            ...currentDetails,
            route_plan: this.routeStops,
            is_returning: this.isReturning
        };
        
        await this.updateTripInDatabase({ request_details: newDetails });
        this.showToast('Ruta Guardada', 'Se ha actualizado el plan de viaje para torre de control', 'success');
        
        btn.classList.replace('bg-green-600', 'bg-emerald-500');
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check_circle</span> RUTA CONFIRMADA';
        
        setTimeout(() => { 
            btn.disabled = false;
            btn.classList.replace('bg-emerald-500', 'bg-green-600');
            btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">save</span> Guardar Ruta'; 
        }, 2500);
    }

    // ==================== RESTO DEL CÓDIGO ====================

    async onMount() {
        this.showLoader();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.hash = '#login';
            return;
        }
        
        this.userId = session.user.id;
        
        await Promise.all([
            this.loadProfileData(),
            this.loadDashboardState(),
            this.loadLastTripStats()
        ]);
        
        this.setupRealtimeSubscription();
        this.setupPeriodicUpdates();
        this.setupConnectionMonitor();
        this.startBackgroundSync();
        
        this.hideLoader();
    }

    async loadLastTripStats() {
        try {
            // Buscamos el viaje más reciente que esté finalizado
            const { data: lastTrip, error: lastError } = await supabase
                .from('trips')
                .select(`created_at, completed_at, destination, exit_km, entry_km, vehicles:vehicle_id(plate, economic_number)`)
                .eq('driver_id', this.userId)
                .in('status', ['completed', 'closed'])
                .order('completed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Obtenemos todos los completados para sumar el kilometraje total
            const { data: stats, error: statsError } = await supabase
                .from('trips')
                .select('id, entry_km, exit_km')
                .eq('driver_id', this.userId)
                .in('status', ['completed', 'closed']);

            const loading = document.getElementById('last-trip-loading');
            const content = document.getElementById('last-trip-content');
            
            if (loading) loading.classList.add('hidden');
            if (content) content.classList.remove('hidden');

            if (lastTrip && !lastError) {
                document.getElementById('last-trip-vehicle').innerText = `${lastTrip.vehicles?.plate || '---'} (ECO-${lastTrip.vehicles?.economic_number || '?'})`;
                document.getElementById('last-trip-date').innerText = lastTrip.completed_at ? new Date(lastTrip.completed_at).toLocaleDateString() : 'N/A';
                
                const exitKm = lastTrip.exit_km || 0;
                const entryKm = lastTrip.entry_km || 0;
                const distancia = Math.max(0, entryKm - exitKm); // Evita números negativos
                
                document.getElementById('last-trip-distance').innerText = `${Math.round(distancia)} km`;
                document.getElementById('last-trip-destination').innerText = lastTrip.destination || 'No especificado';
            } else {
                if (content) content.innerHTML = `<div class="text-center py-4 text-slate-400"><span class="material-symbols-outlined text-3xl mb-2">history</span><p class="text-xs">No hay viajes completados</p></div>`;
            }

            if (stats && !statsError) {
                document.getElementById('total-trips').innerText = stats.length;
                const totalKm = stats.reduce((sum, t) => {
                    const e = t.entry_km || 0;
                    const x = t.exit_km || 0;
                    return sum + Math.max(0, e - x);
                }, 0);
                document.getElementById('total-km').innerText = Math.round(totalKm);
            }
        } catch (error) { console.error('Error cargando estadísticas:', error); }
    }

    showLoader() { const loader = document.getElementById('unidad-loader'); if (loader) loader.classList.remove('hidden'); }
    hideLoader() { const loader = document.getElementById('unidad-loader'); if (loader) loader.classList.add('hidden'); }

    setupConnectionMonitor() {
        const indicator = document.getElementById('connection-indicator');
        const status = document.getElementById('profile-status');
        
        window.addEventListener('online', () => {
            indicator.innerHTML = `<span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative rounded-full h-2 w-2 bg-green-500"></span>`;
            status.innerText = 'Conectado';
            this.showToast('Conexión restaurada', 'Los datos se están sincronizando', 'success');
            this.syncPendingLocations();
        });
        
        window.addEventListener('offline', () => {
            indicator.innerHTML = `<span class="relative rounded-full h-2 w-2 bg-yellow-500"></span>`;
            status.innerText = 'Sin conexión';
            this.showToast('Sin conexión', 'Los datos se guardarán localmente', 'warning');
        });
    }

    setupPeriodicUpdates() {
        this.updateInterval = setInterval(async () => {
            if (navigator.onLine) {
                await this.loadDashboardState();
                if (this.activeTab === 'perfil') await this.loadLastTripStats();
            }
        }, 5000);
    }

    setupRealtimeSubscription() {
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);

        this.realtimeChannel = supabase
            .channel('driver_realtime_' + this.userId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, async (payload) => {
                if (payload.new) {
                    const oldStatus = this.currentTrip?.status;
                    const newStatus = payload.new.status;
                    this.currentTrip = payload.new;
                    
                    if (newStatus === 'completed') {
                        // Limpiar y resetear la UI a disponible de inmediato
                        this.currentTrip = null;
                        this.selectedVehicleForRequest = null;
                        await this.updateUIByStatus(null);
                        await this.loadLastTripStats();
                        this.switchTab('unidad');
                        this.showToast('✅ Viaje completado', 'Puedes solicitar una nueva unidad', 'success');
                    } else {
                        // Seguir el flujo normal
                        await this.updateUIByStatus(payload.new);
                        if (oldStatus && oldStatus !== newStatus) this.handleStatusChange(newStatus, payload.new);
                        this.updateSpecificComponents(payload.new);
                        if (newStatus === 'in_progress' && this.activeTab === 'ruta') this.startTracking();
                        if (newStatus === 'incident_report') this.showIncidentBanner(payload.new); else this.hideIncidentBanner();
                    }
                }
            }).subscribe();

        this.broadcastChannel = supabase.channel('tracking_realtime');
        this.broadcastChannel.subscribe();
    }

    showIncidentBanner(trip) {
        const banner = document.getElementById('incident-banner');
        const message = document.getElementById('incident-message');
        if (banner && message) {
            message.innerText = trip.incident_description || 'Unidad en revisión - Espera resolución del taller';
            banner.classList.remove('hidden');
        }
    }

    hideIncidentBanner() {
        const banner = document.getElementById('incident-banner');
        if (banner) banner.classList.add('hidden');
    }

    showToast(title, message, type = 'info') {
        const toast = document.getElementById('notification-toast');
        const icon = document.getElementById('toast-icon');
        const colors = { info: 'text-primary', success: 'text-green-500', warning: 'text-yellow-500', error: 'text-red-500' };
        const icons = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };
        
        icon.className = colors[type];
        icon.innerHTML = `<span class="material-symbols-outlined">${icons[type]}</span>`;
        document.getElementById('toast-title').innerText = title;
        document.getElementById('toast-message').innerText = message;
        
        toast.classList.remove('hidden');
        if (navigator.vibrate) navigator.vibrate(type === 'error' ? [200, 100, 200] : 100);
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }

    handleStatusChange(newStatus, tripData) {
        const messages = {
            'approved_for_taller': { title: '✅ Solicitud aprobada', msg: 'Dirígete a taller', type: 'success' },
            'driver_accepted': { title: '🔑 Listo para salir', msg: `Código: ${tripData.access_code || '---'}`, type: 'success' },
            'in_progress': { title: '🚗 Viaje iniciado', msg: 'GPS activado', type: 'success' },
            'awaiting_return_checklist': { title: '🏁 Viaje terminado', msg: 'Dirígete a taller', type: 'warning' },
            'incident_report': { title: '⚠️ Incidencia reportada', msg: 'Unidad en revisión - Espera al taller', type: 'error' },
            'completed': { title: '🎉 Unidad liberada', msg: 'Viaje completado', type: 'success' }
        };

        if (messages[newStatus]) {
            this.showToast(messages[newStatus].title, messages[newStatus].msg, messages[newStatus].type);
            const tabMap = { 'approved_for_taller': 'taller-inicial', 'driver_accepted': 'unidad', 'in_progress': 'ruta', 'awaiting_return_checklist': 'taller-final', 'incident_report': 'unidad', 'completed': 'unidad' };
            if (tabMap[newStatus]) {
                setTimeout(() => {
                    this.switchTab(tabMap[newStatus]);
                    if (newStatus === 'in_progress') setTimeout(() => this.startTracking(), 1000);
                }, 1500);
            }
        }
    }

    updateSpecificComponents(trip) {
        if (trip.workshop_reception_photos?.length > 0) this.renderReceptionPhotos(trip.workshop_reception_photos);
        if (trip.workshop_return_photos?.length > 0) this.renderReturnPhotos(trip.workshop_return_photos);
        if (trip.status === 'driver_accepted' && trip.access_code) this.showAccessCode(trip.access_code); else document.getElementById('access-code-banner')?.classList.add('hidden');
        if (trip.status === 'incident_report') this.showIncidentBanner(trip); else this.hideIncidentBanner();
        this.updateProgressBars(trip);
    }

    updateProgressBars(trip) {
        const p1 = document.getElementById('taller-progress');
        if (p1) {
            if (trip.status === 'approved_for_taller') p1.style.width = '33%';
            else if (trip.status === 'driver_accepted') p1.style.width = '66%';
            else if (trip.status === 'in_progress') p1.style.width = '100%';
        }
        const p2 = document.getElementById('final-progress');
        if (p2) {
            if (trip.status === 'awaiting_return_checklist') p2.style.width = '33%';
            else if (trip.status === 'completed') p2.style.width = '100%';
        }
    }

    showAccessCode(code) {
        const banner = document.getElementById('access-code-banner');
        if (banner) {
            document.getElementById('access-code-display').innerText = code;
            banner.classList.remove('hidden');
            setTimeout(() => banner.classList.add('opacity-50'), 120000);
        }
    }

    renderReceptionPhotos(photos) {
        const gallery = document.getElementById('reception-photos-gallery');
        const grid = document.getElementById('reception-photos-grid');
        const completeMsg = document.getElementById('taller-complete-message');
        if (gallery && grid) {
            gallery.classList.remove('hidden');
            grid.innerHTML = photos.map(p => `<div class="relative group cursor-pointer" onclick="window.conductorModule.viewPhoto('${p.url}')"><img src="${p.url}" class="w-full h-16 object-cover rounded-lg border border-primary/50" /><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"><span class="material-symbols-outlined text-white text-sm">zoom_in</span></div></div>`).join('');
            if (photos.length >= 6) document.getElementById('taller-complete-message')?.classList.remove('hidden');
        }
    }

    renderReturnPhotos(photos) {
        const gallery = document.getElementById('return-photos-gallery');
        const grid = document.getElementById('return-photos-grid');
        if (gallery && grid && photos.length > 0) {
            gallery.classList.remove('hidden');
            grid.innerHTML = photos.map(p => `<div class="relative group cursor-pointer" onclick="window.conductorModule.viewPhoto('${p.url}')"><img src="${p.url}" class="w-full h-16 object-cover rounded-lg border border-primary/50" /><div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"><span class="material-symbols-outlined text-white text-sm">zoom_in</span></div></div>`).join('');
        }
    }

    viewPhoto(url) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4';
        modal.innerHTML = `<div class="relative max-w-2xl w-full"><img src="${url}" class="w-full rounded-xl" /><button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"><span class="material-symbols-outlined">close</span></button></div>`;
        document.body.appendChild(modal);
    }

    getCurrentLocationForDestination() {
        if (!navigator.geolocation) return alert("El dispositivo no tiene GPS");
        const btn = event.currentTarget;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>';
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`);
                    const data = await res.json();
                    document.getElementById('solicitud-destino').value = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                } catch {
                    document.getElementById('solicitud-destino').value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                }
                document.getElementById('destination-coords').classList.remove('hidden');
                document.getElementById('dest-lat').innerText = latitude.toFixed(6);
                document.getElementById('dest-lon').innerText = longitude.toFixed(6);
                btn.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span>';
                btn.disabled = false;
            },
            (err) => { alert('Error GPS: ' + err.message); btn.innerHTML = '<span class="material-symbols-outlined text-sm">my_location</span>'; btn.disabled = false; },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    startBackgroundSync() {
        this.backgroundSyncInterval = setInterval(() => {
            if (this.pendingLocations.length > 0 && navigator.onLine) this.syncPendingLocations();
        }, 30000);
    }

    async syncPendingLocations() {
        if (this.pendingLocations.length === 0 || !this.currentTrip) return;
        const locations = [...this.pendingLocations];
        this.pendingLocations = [];
        
        try {
            const dataToInsert = locations.map(loc => ({
                trip_id: this.currentTrip.id, lat: Number(loc.lat), lng: Number(loc.lng),
                speed: Math.min(999, Math.round(loc.speed || 0)),
                accuracy: loc.accuracy ? Number(loc.accuracy.toFixed(2)) : null,
                timestamp: loc.timestamp
            }));
            const { error } = await supabase.from('trip_locations').insert(dataToInsert);
            if (error) {
                if (error.code === '23503' || error.code === '22003') console.warn('Error de datos, descartando');
                else this.pendingLocations = [...locations, ...this.pendingLocations];
            }
        } catch (error) {
            if (navigator.onLine) this.pendingLocations = [...locations, ...this.pendingLocations];
        }
    }

    startTracking() {
        if (!navigator.geolocation) return alert("El dispositivo no tiene GPS");

        if (this.watchPositionId) navigator.geolocation.clearWatch(this.watchPositionId);
        
        this.requestWakeLock();

        document.getElementById('route-waiting-msg')?.classList.add('hidden');
        document.getElementById('active-trip-panel')?.classList.remove('hidden');
        document.getElementById('gps-status-indicator').innerHTML = `
            <div class="flex items-center justify-center gap-2 text-yellow-400">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                <span class="text-xs font-bold">Buscando señal GPS...</span>
            </div>
        `;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.handleFirstPosition(pos);
                this.watchPositionId = navigator.geolocation.watchPosition(
                    (position) => this.handlePositionUpdate(position),
                    (error) => this.handleGPSError(error),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000, distanceFilter: 5 }
                );
                this.forceUpdateInterval = setInterval(() => {
                    if (this.currentTrip?.status === 'in_progress') this.updateDisplayStats();
                }, 2000);
            },
            (err) => { this.handleGPSError(err); setTimeout(() => this.startTrackingWithFallback(), 5000); },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
    }

    startTrackingWithFallback() {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.handleFirstPosition(pos);
                this.watchPositionId = navigator.geolocation.watchPosition(
                    (position) => this.handlePositionUpdate(position),
                    (error) => this.handleGPSError(error),
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
                );
            },
            (err) => {
                this.handleGPSError(err);
                document.getElementById('gps-status-indicator').innerHTML = `
                    <div class="flex flex-col items-center gap-2">
                        <div class="flex items-center gap-1 text-red-400">
                            <span class="material-symbols-outlined text-sm">gps_off</span>
                            <span class="text-xs">No se puede obtener ubicación</span>
                        </div>
                        <button onclick="window.conductorModule.startTracking()" class="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full">Reintentar</button>
                    </div>
                `;
            }
        );
    }

    handleFirstPosition(pos) {
        const { latitude, longitude, speed } = pos.coords;
        
        if (!this.tripLogistics.startTime && this.currentTrip?.status === 'in_progress') {
            this.tripLogistics.startTime = new Date();
            this.tripLogistics.lastPosition = { lat: latitude, lng: longitude };
            this.updateTripInDatabase({
                start_time: this.tripLogistics.startTime.toISOString(),
                exit_km: this.currentTrip.vehicles?.current_km || 0
            });
        }

        const speedKmh = Math.min(999, Math.round((speed || 0) * 3.6));
        document.getElementById('gps-status-indicator').innerHTML = `<div class="flex items-center justify-center gap-2 text-emerald-400"><div class="relative"><div class="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute"></div><div class="w-2 h-2 rounded-full bg-emerald-400 relative"></div></div><span class="text-xs font-bold ml-4">GPS Activo - ${speedKmh} km/h</span></div>`;
        document.getElementById('live-speed').innerText = speedKmh;
        
        if (this.driverMap) {
            this.driverMap.setView([latitude, longitude], 15);
        }
    }

    handlePositionUpdate(pos) {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = new Date();
        const currentTime = Date.now();
        const speedKmh = Math.min(999, Math.round((speed || 0) * 3.6));

        document.getElementById('live-speed').innerText = speedKmh;

        if (this.myLocationMarker) {
            this.myLocationMarker.setLatLng([latitude, longitude]);
        } else if (this.driverMap && window.L) {
            const carIconHtml = `<div class="bg-[#10b981] w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px_#10b981] animate-pulse"></div>`;
            const carIcon = window.L.divIcon({ className: 'local-car-marker', html: carIconHtml, iconSize: [16, 16], iconAnchor: [8, 8] });
            this.myLocationMarker = window.L.marker([latitude, longitude], { icon: carIcon }).addTo(this.driverMap);
        }

        if (this.tripLogistics.lastPosition) {
            const distance = this.calculateDistance(this.tripLogistics.lastPosition.lat, this.tripLogistics.lastPosition.lng, latitude, longitude);
            if (distance > 0.01) {
                this.tripLogistics.totalDistance += distance;
                const fuel = (this.tripLogistics.totalDistance / 8).toFixed(1);
                document.getElementById('live-distance').innerText = this.tripLogistics.totalDistance.toFixed(1);
                document.getElementById('live-fuel').innerText = fuel;
                document.getElementById('resumen-distancia').innerText = Math.round(this.tripLogistics.totalDistance) + ' km';
                document.getElementById('resumen-combustible').innerText = fuel + ' L';
            }
        }

        this.tripLogistics.lastPosition = { lat: latitude, lng: longitude };
        this.tripLogistics.lastUpdateTime = now;

        document.getElementById('gps-status-indicator').innerHTML = `<div class="flex items-center justify-center gap-2 text-emerald-400"><div class="relative"><div class="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute"></div><div class="w-2 h-2 rounded-full bg-emerald-400 relative"></div></div><span class="text-xs font-bold ml-4">${speedKmh} km/h · ${accuracy?.toFixed(0) || '?'}m</span></div>`;

        let shouldBroadcast = false;
        if (!this.lastBroadcastPos) {
            shouldBroadcast = true;
        } else {
            const timeDiff = currentTime - this.lastBroadcastTime;
            const distDiff = this.calculateDistance(this.lastBroadcastPos.lat, this.lastBroadcastPos.lng, latitude, longitude) * 1000;
            if (timeDiff > 15000 || distDiff > 15) {
                shouldBroadcast = true;
            }
        }

        if (shouldBroadcast && this.currentTrip?.status === 'in_progress') {
            if (this.broadcastChannel) {
                this.broadcastChannel.send({
                    type: 'broadcast',
                    event: 'location_update',
                    payload: { trip_id: this.currentTrip.id, lat: latitude, lng: longitude, speed: speedKmh, timestamp: now.toISOString() }
                });
            }
            this.lastBroadcastTime = currentTime;
            this.lastBroadcastPos = { lat: latitude, lng: longitude };

            this.pendingLocations.push({ lat: latitude, lng: longitude, speed: speedKmh, accuracy: accuracy, timestamp: now.toISOString() });
            
            if (this.pendingLocations.length >= 20) {
                this.syncPendingLocations();
            }
        }
    }

    updateDisplayStats() {
        if (!this.currentTrip || this.currentTrip.status !== 'in_progress') return;
        if (this.tripLogistics.startTime) {
            const now = new Date();
            const duration = Math.floor((now - this.tripLogistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            document.getElementById('trip-duration').innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; const dLat = this.deg2rad(lat2 - lat1); const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    deg2rad(deg) { return deg * (Math.PI/180); }

    handleGPSError(err) {
        const gpsIndicator = document.getElementById('gps-status-indicator');
        let errorMsg = 'Error de GPS';
        if (err.code === 1) errorMsg = 'Permiso denegado';
        if (err.code === 2) errorMsg = 'Señal no disponible';
        if (err.code === 3) errorMsg = 'Timeout';
        gpsIndicator.innerHTML = `<div class="flex flex-col items-center gap-2"><div class="flex items-center gap-1 text-red-400"><span class="material-symbols-outlined text-sm">gps_off</span><span class="text-xs">${errorMsg}</span></div><button onclick="window.conductorModule.startTracking()" class="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full">Reintentar</button></div>`;
    }

    stopTracking() {
        if (this.watchPositionId) {
            navigator.geolocation.clearWatch(this.watchPositionId);
            this.watchPositionId = null;
        }
        if (this.forceUpdateInterval) {
            clearInterval(this.forceUpdateInterval);
            this.forceUpdateInterval = null;
        }
        this.releaseWakeLock();
        
        const gpsIndicator = document.getElementById('gps-status-indicator');
        if (gpsIndicator) gpsIndicator.innerHTML = `<div class="flex items-center justify-center gap-2 text-slate-400"><span class="material-symbols-outlined">gps_fixed</span><span class="text-xs font-bold">GPS Detenido</span></div>`;
    }

    async updateTripInDatabase(updates) {
        if (!this.currentTrip) return;
        try {
            const { error } = await supabase.from('trips').update(updates).eq('id', this.currentTrip.id);
            if (error) console.error('Error:', error);
        } catch (error) { console.error('Error:', error); }
    }

    async enviarSolicitud() {
        if (!this.selectedVehicleForRequest) { this.switchTab('unidad'); return; }
        const destino = document.getElementById('solicitud-destino')?.value;
        const motivo = document.getElementById('solicitud-motivo')?.value;
        const jefe = document.getElementById('solicitud-jefe')?.value;
        const departamento = document.getElementById('solicitud-departamento')?.value;
        
        if (!destino || !motivo || !jefe || !departamento) { this.showToast('Campos incompletos', 'Completa todos los campos', 'warning'); return; }

        const btn = document.querySelector('[onclick="window.conductorModule.enviarSolicitud()"]');
        btn.disabled = true; btn.innerHTML = '<span class="animate-spin inline-block mr-2">⌛</span> ENVIANDO...';

        const destLat = document.getElementById('dest-lat')?.innerText;
        const destLon = document.getElementById('dest-lon')?.innerText;

        const parsedLat = parseFloat(destLat);
        const parsedLon = parseFloat(destLon);
        const hasValidCoords = parsedLat !== 0 && parsedLon !== 0 && !isNaN(parsedLat) && !isNaN(parsedLon);

        const { error } = await supabase.from('trips').insert({ 
            driver_id: this.userId, 
            vehicle_id: this.selectedVehicleForRequest.id, 
            status: 'requested', 
            destination: destino, 
            motivo: motivo, 
            supervisor: jefe, 
            departamento: departamento,
            request_details: {
                destination: destino,
                motivo: motivo,
                jefe_inmediato: jefe,
                departamento: departamento,
                requested_at: new Date().toISOString(),
                destination_coords: hasValidCoords ? { lat: parsedLat, lon: parsedLon } : null
            }
        });

        if (error) { this.showToast('Error', error.message, 'error'); } else {
            this.showToast('Solicitud enviada', 'Espera la aprobación', 'success');
            this.selectedVehicleForRequest = null;
            await this.loadDashboardState();
            this.switchTab('unidad');
        }
        btn.disabled = false; btn.innerHTML = 'ENVIAR SOLICITUD';
    }

    async loadAvailableUnits() {
        try {
            const { data: vehs, error } = await supabase.from('vehicles').select('*').eq('status', 'active');
            if (error) throw error;
            const container = document.getElementById('unidad-content');
            const noUnitsMsg = document.getElementById('no-units-message');
            document.getElementById('unidad-loader')?.classList.add('hidden');
            
            if (!vehs || vehs.length === 0) {
                if (noUnitsMsg) noUnitsMsg.classList.remove('hidden');
                if (container) container.classList.add('hidden');
                return;
            }
            if (noUnitsMsg) noUnitsMsg.classList.add('hidden');
            if (container) {
                container.classList.remove('hidden');
                container.innerHTML = vehs.map(v => `<div onclick="window.conductorModule.selectVehicleForRequest('${v.id}', '${v.plate}', '${v.model}', '${v.economic_number}')" class="bg-gradient-to-r from-[#192633] to-[#1a2533] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary hover:scale-[1.02] transition-all active:scale-95"><div><p class="text-white font-black text-lg">${v.plate}</p><p class="text-[10px] text-[#92adc9] mt-1">${v.model} · ECO-${v.economic_number}</p></div><button class="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase shadow-lg">Solicitar</button></div>`).join('');
            }
        } catch (error) { console.error('Error:', error); }
    }

    async loadLastChecklist(vehicleId) {
        if (!vehicleId) return;
        try {
            const { data: lastTrip, error } = await supabase.from('trips').select('workshop_checklist, completed_at').eq('vehicle_id', vehicleId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).maybeSingle();
            const container = document.getElementById('last-checklist-container');
            const content = document.getElementById('last-checklist-content');
            if (!container || !content) return;
            if (error || !lastTrip?.workshop_checklist) { container.classList.add('hidden'); return; }
            container.classList.remove('hidden');
            const check = lastTrip.workshop_checklist;
            const items = [{ label: 'Líquido', value: check.liquid }, { label: 'Aceite', value: check.oil }, { label: 'Anticongelante', value: check.coolant }, { label: 'Luces', value: check.lights }, { label: 'Llantas', value: check.tires }];
            content.innerHTML = `<div class="grid grid-cols-2 gap-2">${items.map(item => `<span class="text-${item.value ? 'green' : 'red'}-400 text-[10px] flex items-center gap-1"><span class="material-symbols-outlined text-xs">${item.value ? 'check_circle' : 'cancel'}</span>${item.label}</span>`).join('')}</div><p class="text-[8px] text-[#92adc9] mt-2">${lastTrip.completed_at ? new Date(lastTrip.completed_at).toLocaleDateString() : ''}</p>`;
        } catch (error) { document.getElementById('last-checklist-container')?.classList.add('hidden'); }
    }

    selectVehicleForRequest(vehicleId, plate, model, eco) {
        this.selectedVehicleForRequest = { id: vehicleId, plate, model, eco };
        this.switchTab('formulario');
        setTimeout(() => {
            document.getElementById('no-vehicle-selected-msg')?.classList.add('hidden');
            document.getElementById('form-content')?.classList.remove('hidden');
            const display = document.getElementById('selected-vehicle-display');
            if (display) display.innerHTML = `${plate} · ${model}<br><span class="text-primary text-sm">ECO-${eco}</span>`;
            this.loadLastChecklist(vehicleId);
        }, 100);
    }

    async confirmarLiberacionTaller() {
        const btn = document.querySelector('#conductor-confirmacion-container button');
        btn.disabled = true; 
        btn.innerHTML = '<span class="animate-spin inline-block mr-2">⌛</span> CONFIRMANDO...';
        
        const { error } = await supabase.from('trips')
            .update({ driver_confirmed_at: new Date().toISOString(), completed_at: new Date().toISOString(), status: 'completed' })
            .eq('id', this.currentTrip.id);
            
        if (error) { 
            this.showToast('Error', error.message, 'error'); 
            btn.disabled = false;
            btn.innerHTML = 'CONFIRMAR LIBERACIÓN';
        } else {
            this.showToast('¡Unidad liberada!', 'Puedes solicitar una nueva unidad', 'success');
            
            // Limpiar memoria
            this.currentTrip = null; 
            this.selectedVehicleForRequest = null;
            
            // Forzar UI a modo "Disponible"
            await this.updateUIByStatus(null);
            
            // Recargar datos
            await this.loadDashboardState(); 
            await this.loadLastTripStats(); 
            this.switchTab('unidad');
        }
    }

    async loadProfileData() {
        if (!this.userId) return;
        const { data: p, error } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if (error) return;
        if(p) {
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('card-full-name').innerText = p.full_name;
            document.getElementById('card-photo').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('lic-number').innerText = p.license_number || 'No registrada';
        }
    }

    async loadDashboardState() {
        if (!this.userId) return;
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select(`*, vehicles(*)`)
                .eq('driver_id', this.userId)
                .in('status', ['requested', 'approved_for_taller', 'driver_accepted', 'in_progress', 'awaiting_return_checklist', 'incident_report'])
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            const trip = trips?.length > 0 ? trips[0] : null;
            
            if (JSON.stringify(this.currentTrip) !== JSON.stringify(trip)) {
                this.currentTrip = trip;
                await this.updateUIByStatus(trip);
            }
            
            if (!trip) {
                await this.loadAvailableUnits();
            }
        } catch (error) { console.error('Error cargando estado:', error); }
    }

    async updateUIByStatus(trip) {
        const statusMap = { 
            'requested': { text: 'Solicitud enviada', color: 'bg-yellow-500', tab: 'unidad' }, 
            'approved_for_taller': { text: 'Dirígete a taller', color: 'bg-orange-500', tab: 'taller-inicial' }, 
            'driver_accepted': { text: 'Listo para salir', color: 'bg-green-500', tab: 'unidad' }, 
            'in_progress': { text: 'En ruta', color: 'bg-primary', tab: 'ruta' }, 
            'awaiting_return_checklist': { text: 'Regresado - Ir a taller', color: 'bg-purple-500', tab: 'taller-final' }, 
            'incident_report': { text: 'INCIDENCIA', color: 'bg-red-500', tab: 'unidad' } 
        };

        const titleUnits = document.querySelector('#tab-unidad h3');
        const unitsContent = document.getElementById('unidad-content');

        if (trip && statusMap[trip.status]) {
            const status = statusMap[trip.status];
            document.getElementById('profile-status').innerText = status.text;
            const badge = document.getElementById('trip-status-badge');
            if (badge) { 
                badge.innerText = status.text; 
                badge.className = `px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.color} text-white`; 
            }
            
            document.getElementById('current-vehicle-plate').innerText = trip.vehicles?.plate || '--';
            document.getElementById('current-vehicle-model').innerText = `${trip.vehicles?.model || ''} ECO-${trip.vehicles?.economic_number || ''}`;
            
            document.getElementById('current-trip-info')?.classList.remove('hidden');
            if (titleUnits) titleUnits.classList.add('hidden');
            if (unitsContent) unitsContent.classList.add('hidden');
            
            if (trip.status === 'approved_for_taller') document.getElementById('taller-vehicle-info').innerText = `ECO-${trip.vehicles?.economic_number} - ${trip.vehicles?.plate}`;
            if (trip.status === 'in_progress' && this.activeTab === 'ruta') setTimeout(() => this.startTracking(), 500);
            if (trip.status !== 'in_progress') this.stopTracking();
            this.updateSpecificComponents(trip);
            
        } else {
            document.getElementById('current-trip-info')?.classList.add('hidden');
            document.getElementById('profile-status').innerText = "Disponible";
            this.stopTracking();
            
            if (titleUnits) titleUnits.classList.remove('hidden');
            await this.loadAvailableUnits();
        }
    }

    async saveTripNotes() {
        const notes = document.getElementById('trip-notes').value;
        if (!notes || !this.currentTrip) return;
        if (!this.tripLogistics.notes) this.tripLogistics.notes = [];
        this.tripLogistics.notes.push({ text: notes, timestamp: new Date().toISOString() });
        await this.updateTripInDatabase({ notes: this.tripLogistics.notes });
        this.showToast('Nota guardada', 'Se agregó al registro del viaje', 'success');
        document.getElementById('trip-notes').value = '';
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active', 'text-primary'); el.classList.add('text-slate-500'); });
        
        document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
        const navElement = document.getElementById(`nav-${tabId}`);
        if (navElement) { navElement.classList.remove('text-slate-500'); navElement.classList.add('active', 'text-primary'); }

        if (tabId === 'formulario') {
            if (!this.selectedVehicleForRequest) { document.getElementById('no-vehicle-selected-msg')?.classList.remove('hidden'); document.getElementById('form-content')?.classList.add('hidden'); }
            else { document.getElementById('no-vehicle-selected-msg')?.classList.add('hidden'); document.getElementById('form-content')?.classList.remove('hidden'); }
        }

        if (tabId === 'ruta') {
            if (this.currentTrip?.status === 'in_progress') {
                document.getElementById('route-waiting-msg')?.classList.add('hidden');
                document.getElementById('active-trip-panel')?.classList.remove('hidden');
                setTimeout(() => {
                    this.startTracking();
                    this.initDriverMap();
                }, 300);
            } else {
                document.getElementById('route-waiting-msg')?.classList.remove('hidden');
                document.getElementById('active-trip-panel')?.classList.add('hidden');
                this.stopTracking();
            }
        } else {
            this.stopTracking();
        }

        if (tabId === 'perfil') { this.loadProfileData(); this.loadLastTripStats(); }
    }

    destroy() {
        if (this.backgroundSyncInterval) clearInterval(this.backgroundSyncInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
        if (this.broadcastChannel) supabase.removeChannel(this.broadcastChannel);
        this.releaseWakeLock();
        this.stopTracking();
    }

    async logout() {
        if (!confirm('¿Cerrar sesión?')) return;
        this.destroy();
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.hash = '#login';
        window.location.reload();
    }
}

window.logoutDriver = function() {
    if (window.conductorModule?.logout) { window.conductorModule.logout(); }
    else { localStorage.clear(); window.location.hash = '#login'; window.location.reload(); }
};
