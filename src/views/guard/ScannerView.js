import { supabase } from '../../config/supabaseClient.js';

export class ScannerView {
    constructor() {
        this.html5QrCode = null;
        this.isProcessing = false;
        this.pendingTrip = null;
        this.currentAction = null;
        window.scannerView = this;
    }

    render() {
        return `
        <div class="fixed inset-0 z-50 w-full h-full bg-[#0d141c] font-display flex flex-col overflow-hidden">
            
            <div class="flex items-center justify-between border-b border-[#324d67] p-4 bg-[#111a22] shrink-0 shadow-lg">
                <div class="flex items-center gap-3">
                    <div class="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                        <span class="material-symbols-outlined text-2xl">shield_person</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-white tracking-tight leading-none">Caseta de Vigilancia</h2>
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Control de Accesos</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.scannerView.showEmergencyInfo()" class="px-3 py-2 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-500 text-xs font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">info</span> Códigos de emergencia
                    </button>
                    <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
                <div class="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div class="flex flex-col gap-4 relative">
                         <div id="step-1-blocker" class="hidden absolute inset-0 z-20 bg-[#0d141c]/90 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-emerald-500/50">
                            <div class="text-center p-6">
                                <span class="material-symbols-outlined text-5xl text-emerald-400 mb-2">directions_car</span>
                                <h3 class="text-white font-black text-xl uppercase tracking-widest">Unidad Detectada</h3>
                                <p class="text-[#92adc9] text-xs mt-2" id="step-1-message">Verificando...</p>
                                <button onclick="window.scannerView.resetScan()" class="mt-4 bg-red-600/20 text-red-500 text-xs px-4 py-2 rounded-lg border border-red-500/30">Cancelar</button>
                            </div>
                         </div>

                         <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col group">
                            <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                            <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 text-center z-10">
                                <p class="text-white text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-tighter">
                                    <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> ESCANEAR QR DE UNIDAD
                                </p>
                            </div>
                         </div>
                         
                         <div class="flex gap-2">
                            <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-black rounded-xl p-4 placeholder-slate-600 focus:border-primary outline-none text-center tracking-[4px] text-lg font-mono uppercase" placeholder="UUID MANUAL DE UNIDAD">
                            <button id="btn-validate" class="bg-primary hover:bg-blue-600 text-white font-bold px-6 rounded-xl transition-all shadow-lg">
                                <span class="material-symbols-outlined">search</span>
                            </button>
                         </div>
                    </div>

                    <div id="result-area" class="bg-[#1c2127] rounded-3xl p-6 border border-[#324d67] flex flex-col items-center justify-start text-center shadow-2xl min-h-[500px] relative overflow-y-auto custom-scrollbar transition-all duration-300">
                        <div class="w-full">
                            <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner mx-auto">
                                <span class="material-symbols-outlined text-7xl text-slate-700">qr_code_scanner</span>
                            </div>
                            <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Escáner Activo</h3>
                            <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el QR de la unidad para iniciar el proceso correspondiente.</p>
                            
                            <!-- Información de códigos de emergencia -->
                            <div id="emergency-info-panel" class="hidden mt-6 w-full border-t border-[#324d67] pt-4 animate-fade-in">
                                <p class="text-[10px] font-bold text-orange-500 uppercase mb-2 tracking-widest">Códigos de emergencia activos</p>
                                <div id="emergency-codes-list" class="space-y-2 text-xs max-h-[200px] overflow-y-auto custom-scrollbar">
                                    <p class="text-slate-500 text-center">Cargando...</p>
                                </div>
                            </div>

                            <!-- Códigos de acceso generados por taller -->
                            <div id="access-codes-panel" class="mt-4 w-full border-t border-[#324d67] pt-4">
                                <p class="text-[10px] font-bold text-emerald-500 uppercase mb-2 tracking-widest">Códigos de acceso activos</p>
                                <div id="access-codes-list" class="space-y-2 text-xs max-h-[150px] overflow-y-auto custom-scrollbar">
                                    <p class="text-slate-500 text-center">Cargando...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        `;
    }

    onMount() {
        this.html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };
        
        this.html5QrCode.start({ facingMode: "environment" }, config, (decoded) => {
            if(!this.isProcessing) {
                this.isProcessing = true;
                this.handleStepOne(decoded);
            }
        }).catch(err => console.error("Error cámara:", err));

        document.getElementById('btn-validate').onclick = () => {
            const val = document.getElementById('scan-input').value.trim();
            if(val && !this.isProcessing) {
                this.isProcessing = true;
                this.handleStepOne(val);
            }
        };
        
        this.loadEmergencyCodes();
        this.loadAccessCodes();
    }

    async loadEmergencyCodes() {
        try {
            const { data: trips } = await supabase
                .from('trips')
                .select('id, vehicles(economic_number, plate), emergency_code, emergency_expiry')
                .not('emergency_code', 'is', null)
                .gt('emergency_expiry', new Date().toISOString());
                
            const list = document.getElementById('emergency-codes-list');
            if (!list) return;
            
            if (!trips || trips.length === 0) {
                list.innerHTML = '<p class="text-slate-500 text-xs">No hay códigos de emergencia activos</p>';
                return;
            }
            
            list.innerHTML = trips.map(t => `
                <div class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 flex justify-between items-center">
                    <div>
                        <span class="text-orange-500 font-mono font-bold text-sm">${t.emergency_code}</span>
                        <p class="text-[10px] text-[#92adc9]">ECO-${t.vehicles?.economic_number}</p>
                    </div>
                    <button onclick="window.scannerView.useEmergencyCode('${t.emergency_code}')" 
                            class="text-[8px] bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full hover:bg-orange-500 hover:text-white transition-colors">
                        Usar
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando códigos:', error);
        }
    }

    async loadAccessCodes() {
        try {
            const { data: trips } = await supabase
                .from('trips')
                .select('id, access_code, vehicles(economic_number, plate), driver:driver_id(full_name)')
                .eq('status', 'driver_accepted')
                .not('access_code', 'is', null);
                
            const list = document.getElementById('access-codes-list');
            if (!list) return;
            
            if (!trips || trips.length === 0) {
                list.innerHTML = '<p class="text-slate-500 text-xs">No hay códigos de acceso activos</p>';
                return;
            }
            
            list.innerHTML = trips.map(t => `
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 flex justify-between items-center">
                    <div class="text-left">
                        <span class="text-emerald-500 font-mono font-bold text-sm">${t.access_code}</span>
                        <p class="text-[8px] text-[#92adc9]">ECO-${t.vehicles?.economic_number} · ${t.driver?.full_name || ''}</p>
                    </div>
                    <button onclick="window.scannerView.useAccessCode('${t.access_code}')" 
                            class="text-[8px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-full hover:bg-emerald-500 hover:text-white transition-colors">
                        Usar
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error cargando códigos:', error);
        }
    }

    useAccessCode(code) {
        document.getElementById('scan-input').value = code;
        this.handleStepOne(code);
    }

    useEmergencyCode(code) {
        document.getElementById('scan-input').value = code;
        this.handleStepOne(code);
    }

    showEmergencyInfo() {
        const panel = document.getElementById('emergency-info-panel');
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.loadEmergencyCodes();
        }
    }

    resetScan() {
        this.pendingTrip = null;
        this.currentAction = null;
        this.isProcessing = false;
        document.getElementById('step-1-blocker').classList.add('hidden');
        document.getElementById('result-area').innerHTML = `
            <div class="w-full">
                <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner mx-auto">
                    <span class="material-symbols-outlined text-7xl text-slate-700">qr_code_scanner</span>
                </div>
                <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Escáner Activo</h3>
                <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el QR de la unidad para iniciar el proceso correspondiente.</p>
                <div id="emergency-info-panel" class="hidden mt-6 w-full border-t border-[#324d67] pt-4 animate-fade-in">
                    <p class="text-[10px] font-bold text-orange-500 uppercase mb-2 tracking-widest">Códigos de emergencia activos</p>
                    <div id="emergency-codes-list" class="space-y-2 text-xs max-h-[200px] overflow-y-auto custom-scrollbar">
                        <p class="text-slate-500 text-center">Cargando...</p>
                    </div>
                </div>
                <div id="access-codes-panel" class="mt-4 w-full border-t border-[#324d67] pt-4">
                    <p class="text-[10px] font-bold text-emerald-500 uppercase mb-2 tracking-widest">Códigos de acceso activos</p>
                    <div id="access-codes-list" class="space-y-2 text-xs max-h-[150px] overflow-y-auto custom-scrollbar">
                        <p class="text-slate-500 text-center">Cargando...</p>
                    </div>
                </div>
            </div>
        `;
        this.loadAccessCodes();
        this.loadEmergencyCodes();
        setTimeout(() => { this.isProcessing = false; }, 1000);
    }

    // PASO 1: VALIDAR VEHÍCULO
    async handleStepOne(rawCode) {
        const cleanCode = rawCode.trim();

        if (this.pendingTrip) {
            this.isProcessing = false;
            return;
        }

        try {
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanCode);
            
            // Si es un código de 6 dígitos (puede ser acceso normal o emergencia)
            if (/^[A-Z0-9]{6}$/.test(cleanCode)) {
                // Primero buscar como código de acceso normal
                let { data: trip, error } = await supabase
                    .from('trips')
                    .select('*, profiles:driver_id(*), vehicles:vehicle_id(*)')
                    .eq('access_code', cleanCode)
                    .eq('status', 'driver_accepted')
                    .maybeSingle();

                if (trip) {
                    this.pendingTrip = trip;
                    this.currentAction = 'exit';
                    
                    document.getElementById('step-1-blocker').classList.remove('hidden');
                    document.getElementById('step-1-message').innerText = 'Código válido - Autorizar salida';
                    this.renderExitConfirmation(trip);
                    return;
                }

                // Si no, buscar como código de emergencia
                const { data: emergencyTrip } = await supabase
                    .from('trips')
                    .select('*, profiles:driver_id(*), vehicles:vehicle_id(*)')
                    .eq('emergency_code', cleanCode)
                    .gt('emergency_expiry', new Date().toISOString())
                    .maybeSingle();

                if (emergencyTrip) {
                    this.pendingTrip = emergencyTrip;
                    this.currentAction = 'emergency_exit';
                    
                    document.getElementById('step-1-blocker').classList.remove('hidden');
                    document.getElementById('step-1-message').innerText = 'Acceso de emergencia';
                    this.renderEmergencyConfirmation(emergencyTrip);
                    return;
                }

                throw new Error("Código inválido o expirado");
            }

            // Si es UUID, buscar por vehicle_id
            if (!isUUID) {
                throw new Error("Código no válido. Escanea el QR de la unidad o ingresa código de 6 dígitos.");
            }

            const { data: trip, error } = await supabase
                .from('trips')
                .select('*, profiles:driver_id(*), vehicles:vehicle_id(*)')
                .eq('vehicle_id', cleanCode)
                .in('status', ['driver_accepted', 'in_progress', 'awaiting_return_checklist', 'incident_report'])
                .maybeSingle();

            if (error) throw error;
            if (!trip) throw new Error("Esta unidad no tiene un viaje activo");

            let action = null;
            let actionMessage = '';

            switch(trip.status) {
                case 'driver_accepted':
                    action = 'exit';
                    actionMessage = 'Salida - Ingrese código de acceso';
                    this.pendingTrip = trip;
                    this.currentAction = action;
                    document.getElementById('step-1-blocker').classList.remove('hidden');
                    document.getElementById('step-1-message').innerText = actionMessage;
                    this.renderAccessCodeInput(trip);
                    break;
                    
                case 'in_progress':
                    action = 'return';
                    actionMessage = 'Retorno a base - Registrar llegada';
                    this.pendingTrip = trip;
                    this.currentAction = action;
                    document.getElementById('step-1-blocker').classList.remove('hidden');
                    document.getElementById('step-1-message').innerText = actionMessage;
                    this.renderReturnConfirmation(trip);
                    break;
                    
                case 'awaiting_return_checklist':
                    action = 'workshop_return';
                    actionMessage = 'Unidad lista para revisión final';
                    this.pendingTrip = trip;
                    this.currentAction = action;
                    document.getElementById('step-1-blocker').classList.remove('hidden');
                    document.getElementById('step-1-message').innerText = actionMessage;
                    this.renderWorkshopReturnMessage(trip);
                    break;
                    
                case 'incident_report':
                    action = 'incident';
                    actionMessage = '⚠️ UNIDAD CON INCIDENCIA';
                    this.renderIncidentMessage(trip);
                    break;
                    
                default:
                    throw new Error(`Estado no válido: ${trip.status}`);
            }

            if(navigator.vibrate) navigator.vibrate([100]);

        } catch (e) {
            this.renderError(e.message);
            setTimeout(() => this.resetScan(), 4000);
        } finally {
            this.isProcessing = false;
        }
    }

    // UI para ingresar código de acceso (solo para salida)
    renderAccessCodeInput(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4 shadow-inner text-left">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Unidad Identificada</p>
                            <h2 class="text-3xl font-black text-white leading-none">ECO-${trip.vehicles?.economic_number}</h2>
                            <p class="text-white font-mono mt-1 text-sm">${trip.vehicles?.plate}</p>
                        </div>
                        <span class="bg-emerald-500/20 text-emerald-400 text-[10px] px-3 py-1 rounded-full border border-emerald-500/30 font-bold">
                            SALIDA
                        </span>
                    </div>
                    <div class="mt-3 pt-3 border-t border-[#324d67]">
                        <p class="text-xs text-[#92adc9]">Conductor: <span class="text-white font-bold">${trip.profiles?.full_name}</span></p>
                    </div>
                </div>

                <div class="flex flex-col items-center justify-center py-4">
                    <span class="material-symbols-outlined text-6xl text-[#92adc9] mb-4">password</span>
                    <h3 class="text-xl font-black text-white mb-2 uppercase">Ingrese Código de Acceso</h3>
                    <p class="text-[#92adc9] text-xs mb-6 text-center">Verificar código proporcionado por el conductor</p>
                    
                    <input id="driver-code-input" type="text" maxlength="6" autocomplete="off" 
                           class="w-full max-w-[250px] bg-[#111a22] border-2 border-[#324d67] text-white font-black rounded-xl p-4 text-center tracking-[12px] text-3xl font-mono uppercase mb-4 focus:border-emerald-500 outline-none transition-colors" 
                           placeholder="••••••">
                    
                    <button id="btn-verify-code" 
                            class="w-full max-w-[250px] py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all uppercase tracking-widest">
                        Verificar Código
                    </button>
                    
                    <button onclick="window.scannerView.resetScan()" class="mt-4 text-[#92adc9] text-xs hover:text-white transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-verify-code').onclick = () => {
            const inputCode = document.getElementById('driver-code-input').value.trim().toUpperCase();
            if (inputCode === trip.access_code) {
                this.registerExit(trip);
            } else {
                alert('❌ Código incorrecto');
            }
        };
    }

    // Confirmación de retorno (sin pedir kilometraje)
    renderReturnConfirmation(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in">
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-5xl text-blue-500">login</span>
                        <div class="text-left">
                            <h2 class="text-2xl font-black text-white">RETORNO A BASE</h2>
                            <p class="text-[#92adc9] text-xs">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                        </div>
                    </div>

                    <div class="bg-[#111a22] p-4 rounded-xl text-left mb-4">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Conductor</p>
                        <p class="text-white font-bold">${trip.profiles?.full_name}</p>
                        <p class="text-[10px] text-[#92adc9] mt-2">Destino: ${trip.destination}</p>
                    </div>

                    <div class="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                        <p class="text-emerald-400 text-sm font-bold">✅ Viaje finalizado correctamente</p>
                        <p class="text-[#92adc9] text-xs mt-1">El conductor debe pasar a taller para revisión final</p>
                    </div>
                </div>

                <button id="btn-register-return" class="w-full py-5 rounded-2xl font-black text-lg bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all uppercase tracking-widest mb-3">
                    REGISTRAR RETORNO
                </button>
                
                <button onclick="window.scannerView.resetScan()" class="w-full py-3 rounded-xl font-black text-sm bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    CANCELAR
                </button>
            </div>
        `;

        document.getElementById('btn-register-return').onclick = () => this.registerReturn(trip);
    }

    // Mensaje para cuando ya debe ir a taller
    renderWorkshopReturnMessage(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in">
                <div class="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
                    <span class="material-symbols-outlined text-5xl text-purple-500 mb-4">engineering</span>
                    <h2 class="text-2xl font-black text-white mb-2">UNIDAD LISTA PARA TALLER</h2>
                    <p class="text-[#92adc9] text-sm mb-6">El viaje ya fue finalizado. El conductor debe pasar a taller para la revisión final.</p>

                    <div class="bg-[#111a22] p-4 rounded-xl text-left">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Unidad</p>
                        <p class="text-white font-bold">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                        <p class="text-[10px] text-[#92adc9] mt-2">Conductor: ${trip.profiles?.full_name}</p>
                    </div>
                </div>

                <button onclick="window.scannerView.resetScan()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    ESCANEAR OTRA UNIDAD
                </button>
            </div>
        `;
    }

    // Confirmación de salida (sin pedir kilometraje)
    renderExitConfirmation(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in">
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-5xl text-emerald-500">logout</span>
                        <div class="text-left">
                            <h2 class="text-2xl font-black text-white">SALIDA AUTORIZADA</h2>
                            <p class="text-[#92adc9] text-xs">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                        </div>
                    </div>

                    <div class="bg-[#111a22] p-4 rounded-xl text-left mb-4">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Conductor</p>
                        <p class="text-white font-bold">${trip.profiles?.full_name}</p>
                        <p class="text-[10px] text-[#92adc9] mt-2">Destino: ${trip.destination}</p>
                    </div>

                    <div class="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                        <p class="text-emerald-400 text-sm font-bold">✅ Código verificado correctamente</p>
                    </div>
                </div>

                <button id="btn-register-exit" class="w-full py-5 rounded-2xl font-black text-lg bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-all uppercase tracking-widest mb-3">
                    ABRIR BARRERA
                </button>
                
                <button onclick="window.scannerView.resetScan()" class="w-full py-3 rounded-xl font-black text-sm bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    CANCELAR
                </button>
            </div>
        `;

        document.getElementById('btn-register-exit').onclick = () => this.registerExit(trip);
    }

    renderEmergencyConfirmation(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in">
                <div class="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="material-symbols-outlined text-5xl text-orange-500">emergency</span>
                        <div class="text-left">
                            <h2 class="text-2xl font-black text-white">ACCESO DE EMERGENCIA</h2>
                            <p class="text-[#92adc9] text-xs">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                        </div>
                    </div>

                    <div class="bg-[#111a22] p-4 rounded-xl text-left mb-4">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Conductor</p>
                        <p class="text-white font-bold">${trip.profiles?.full_name}</p>
                        <p class="text-orange-400 font-mono text-xs mt-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">schedule</span> 
                            Expira: ${new Date(trip.emergency_expiry).toLocaleTimeString()}
                        </p>
                    </div>

                    <div class="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
                        <p class="text-orange-400 text-sm font-bold">⚠️ Acceso de emergencia autorizado</p>
                    </div>
                </div>

                <button id="btn-register-emergency" class="w-full py-5 rounded-2xl font-black text-lg bg-orange-600 text-white shadow-lg hover:bg-orange-500 transition-all uppercase tracking-widest mb-3">
                    ABRIR BARRERA (EMERGENCIA)
                </button>
                
                <button onclick="window.scannerView.resetScan()" class="w-full py-3 rounded-xl font-black text-sm bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    CANCELAR
                </button>
            </div>
        `;

        document.getElementById('btn-register-emergency').onclick = () => this.registerExit(trip, 'emergency');
    }

    renderIncidentMessage(trip) {
        const area = document.getElementById('result-area');
        
        area.innerHTML = `
            <div class="w-full animate-fade-in">
                <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                    <span class="material-symbols-outlined text-5xl text-red-500 mb-4">warning</span>
                    <h2 class="text-2xl font-black text-red-500 mb-2">UNIDAD CON INCIDENCIA</h2>
                    <p class="text-white text-sm mb-4">Esta unidad tiene una incidencia reportada y no puede circular hasta que sea resuelta.</p>
                    
                    <div class="bg-[#111a22] p-4 rounded-xl text-left mb-4">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Detalles de la incidencia</p>
                        <p class="text-white text-sm">${trip.incident_description || 'No especificada'}</p>
                    </div>

                    <div class="bg-[#111a22] p-4 rounded-xl text-left">
                        <p class="text-[10px] text-[#92adc9] uppercase mb-1">Unidad</p>
                        <p class="text-white font-bold">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                        <p class="text-[10px] text-[#92adc9] mt-2">Conductor: ${trip.profiles?.full_name}</p>
                    </div>
                </div>
                
                <button onclick="window.scannerView.resetScan()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    ESCANEAR OTRA UNIDAD
                </button>
            </div>
        `;
    }

    renderError(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 border-red-500 bg-red-500/10 mb-8">
                    <span class="material-symbols-outlined text-7xl text-red-500 mb-4">cancel</span>
                    <h2 class="text-3xl font-black text-red-500 uppercase mb-2 leading-none">RECHAZADO</h2>
                    <p class="text-white text-sm uppercase font-bold tracking-widest">${msg}</p>
                </div>
                <button onclick="window.scannerView.resetScan()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-colors">
                    ESCANEAR DE NUEVO
                </button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    // ==================== REGISTROS ====================

    async registerExit(trip, type = 'normal') {
        const btn = document.getElementById('btn-register-exit') || document.getElementById('btn-register-emergency');
        if (btn) {
            btn.innerText = "PROCESANDO..."; 
            btn.disabled = true;
        }

        const updates = { 
            status: 'in_progress',
            exit_gate_time: new Date().toISOString(),
            start_time: new Date().toISOString(),
            exit_km: trip.vehicles?.current_km || 0
        };

        if (type === 'emergency') {
            updates.emergency_used_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('trips')
            .update(updates)
            .eq('id', trip.id);

        if (error) {
            alert("Error: " + error.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = type === 'emergency' ? "ABRIR BARRERA (EMERGENCIA)" : "ABRIR BARRERA";
            }
        } else {
            this.showSuccess("Salida registrada correctamente", type === 'emergency' ? 'orange' : 'emerald');
            this.resetScan();
        }
    }

    async registerReturn(trip) {
        const btn = document.getElementById('btn-register-return');
        if (btn) {
            btn.innerText = "PROCESANDO..."; 
            btn.disabled = true;
        }

        const { error } = await supabase
            .from('trips')
            .update({
                status: 'awaiting_return_checklist',
                entry_gate_time: new Date().toISOString(),
                entry_time: new Date().toISOString(),
                entry_km: trip.vehicles?.current_km || 0
            })
            .eq('id', trip.id);

        if (error) {
            alert("Error: " + error.message);
            if (btn) {
                btn.disabled = false;
                btn.innerText = "REGISTRAR RETORNO";
            }
        } else {
            this.showSuccess("Retorno registrado - El conductor debe pasar a taller", 'blue');
            this.resetScan();
        }
    }

    showSuccess(message, color = 'emerald') {
        document.getElementById('result-area').innerHTML = `
            <div class="flex flex-col items-center animate-fade-in">
                <div class="size-32 rounded-full bg-${color}-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.5)] mb-6">
                    <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase tracking-tighter text-center">¡REGISTRADO!</h2>
                <p class="text-${color}-400 font-bold uppercase tracking-widest mt-2 text-center">${message}</p>
                <button onclick="window.scannerView.resetScan()" class="mt-6 px-6 py-2 bg-[#233648] text-white rounded-lg text-sm">
                    Escanear otra unidad
                </button>
            </div>
        `;
        this.loadEmergencyCodes();
        this.loadAccessCodes();
    }
}
