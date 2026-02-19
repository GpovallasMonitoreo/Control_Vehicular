import { supabase } from '../../config/supabaseClient.js';

export class ScannerView {
    constructor() {
        this.html5QrCode = null;
        this.isProcessing = false;
        this.pendingTrip = null; // Memoria para el Paso 1 (Vehículo detectado)
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
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Doble Validación (Unidad + Código)</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                <div class="flex flex-col gap-4 relative">
                     <div id="step-1-blocker" class="hidden absolute inset-0 z-20 bg-[#0d141c]/90 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-emerald-500/50">
                        <div class="text-center p-6">
                            <span class="material-symbols-outlined text-5xl text-emerald-400 mb-2">directions_car</span>
                            <h3 class="text-white font-black text-xl uppercase tracking-widest">Unidad Detectada</h3>
                            <p class="text-[#92adc9] text-xs mt-2">Ahora ingresa el código del conductor a la derecha.</p>
                            <button onclick="window.scannerView.resetScan()" class="mt-4 bg-red-600/20 text-red-500 text-xs px-4 py-2 rounded-lg border border-red-500/30">Cancelar</button>
                        </div>
                     </div>

                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col group">
                        <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 backdrop-blur-sm p-3 text-center z-10">
                            <p class="text-white text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-tighter">
                                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> PASO 1: Escanear QR Unidad
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

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl h-full min-h-[350px] relative overflow-hidden transition-all duration-300">
                    <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-7xl text-slate-700">document_scanner</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Vehículo</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el QR pegado físicamente en la unidad para iniciar la validación.</p>
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
            const val = document.getElementById('scan-input').value;
            if(val && !this.isProcessing) {
                this.isProcessing = true;
                this.handleStepOne(val);
            }
        };
    }

    resetScan() {
        this.pendingTrip = null;
        this.isProcessing = false;
        document.getElementById('step-1-blocker').classList.add('hidden');
        document.getElementById('result-area').innerHTML = `
            <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner mx-auto">
                <span class="material-symbols-outlined text-7xl text-slate-700">document_scanner</span>
            </div>
            <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Vehículo</h3>
            <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el QR pegado físicamente en la unidad para iniciar la validación.</p>
        `;
        // Reactivamos escaneo continuo
        setTimeout(() => { this.isProcessing = false; }, 1000);
    }

    // PASO 1: VALIDAR VEHÍCULO
    async handleStepOne(rawCode) {
        const cleanCode = rawCode.trim();

        // Si ya tenemos un viaje pendiente y el guardia mete 5 letras o 6 números, procesamos el PASO 2.
        if (this.pendingTrip) {
            return; // Ignora el escáner si ya estamos esperando el código manual
        }

        try {
            // Validamos que el código escaneado sea un UUID (Formato de ID de Supabase)
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanCode);
            
            if (!isUUID) throw new Error("Por favor, escanea el QR físico de la UNIDAD primero.");

            // Buscamos si ESA unidad tiene un viaje asignado y autorizado o en ruta
            const { data: trip, error } = await supabase
                .from('trips')
                .select('*, profiles:driver_id(*), vehicles:vehicle_id(*)')
                .eq('vehicle_id', cleanCode)
                .neq('status', 'closed')
                .maybeSingle();

            if (error) throw error;
            if (!trip) throw new Error("ESTA UNIDAD NO TIENE UN VIAJE ACTIVO");
            if (trip.status === 'requested') throw new Error("UNIDAD NO LIBERADA POR TALLER AÚN");

            // ÉXITO PASO 1: Bloqueamos cámara y pasamos al Paso 2
            this.pendingTrip = trip;
            if(navigator.vibrate) navigator.vibrate([100]);
            
            document.getElementById('step-1-blocker').classList.remove('hidden');
            this.renderStepTwoUI(trip);

        } catch (e) {
            this.renderError(e.message);
            setTimeout(() => this.resetScan(), 4000);
        } finally {
            this.isProcessing = false;
        }
    }

    // PASO 2: SOLICITAR CÓDIGO AL GUARDIA
    renderStepTwoUI(trip) {
        const area = document.getElementById('result-area');
        area.innerHTML = `
            <div class="w-full h-full flex flex-col animate-fade-in-up">
                <div class="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6 shadow-inner text-left">
                    <p class="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Unidad Identificada</p>
                    <h2 class="text-3xl font-black text-white leading-none">ECO-${trip.vehicles?.economic_number}</h2>
                    <p class="text-white font-mono mt-1 text-sm">${trip.vehicles?.plate}</p>
                </div>

                <div class="flex-1 flex flex-col items-center justify-center">
                    <span class="material-symbols-outlined text-6xl text-[#92adc9] mb-4">password</span>
                    <h3 class="text-xl font-black text-white mb-2 uppercase">Ingrese Código de Autorización</h3>
                    <p class="text-[#92adc9] text-xs mb-6">Pídale al conductor su código de 5 letras o el código de 6 números del taller.</p>
                    
                    <input id="driver-code-input" type="text" maxlength="6" autocomplete="off" class="w-full max-w-[250px] bg-[#111a22] border-2 border-[#324d67] text-white font-black rounded-xl p-4 text-center tracking-[12px] text-3xl font-mono uppercase mb-4 focus:border-emerald-500 outline-none transition-colors" placeholder="•••••">
                    
                    <button id="btn-verify-code" class="w-full max-w-[250px] py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest">
                        Verificar Código
                    </button>
                </div>
            </div>
        `;

        // Focus automático al input
        setTimeout(() => document.getElementById('driver-code-input').focus(), 100);

        document.getElementById('btn-verify-code').onclick = () => {
            const inputCode = document.getElementById('driver-code-input').value.trim().toUpperCase();
            this.handleStepTwo(inputCode);
        };
    }

    // VERIFICACIÓN FINAL
    handleStepTwo(inputCode) {
        if (!inputCode) return;

        // Validamos si el código coincide con el del conductor O con el de emergencia del taller
        const isDriverCode = this.pendingTrip.access_code === inputCode;
        const isEmergencyCode = this.pendingTrip.emergency_code === inputCode;

        if (isDriverCode || isEmergencyCode) {
            this.renderFinalConfirmation(this.pendingTrip);
        } else {
            document.getElementById('driver-code-input').classList.add('border-red-500');
            document.getElementById('driver-code-input').value = "";
            if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
            alert("CÓDIGO INCORRECTO. Verifique con el conductor.");
        }
    }

    renderFinalConfirmation(trip) {
        const isEntry = trip.status === 'in_progress';
        
        document.getElementById('result-area').innerHTML = `
            <div class="w-full h-full flex flex-col animate-fade-in">
                <div class="flex items-center justify-between mb-6">
                    <div class="text-left">
                        <span class="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest">Coincidencia Exacta</span>
                        <h2 class="text-3xl font-black text-white mt-2 uppercase tracking-tighter">${isEntry ? 'RETORNO' : 'SALIDA AUTORIZADA'}</h2>
                    </div>
                    <span class="material-symbols-outlined text-5xl text-emerald-400">gpp_good</span>
                </div>

                <div class="bg-[#111a22] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div class="flex items-center gap-6 relative z-10">
                        <div class="size-24 rounded-2xl bg-slate-700 bg-cover bg-center border-2 border-white/20 shadow-lg" style="background-image: url('${trip.profiles?.photo_url || ''}')"></div>
                        <div class="text-left flex-1">
                            <p class="text-[#92adc9] text-[10px] font-black uppercase tracking-widest">Identidad de Operador</p>
                            <h3 class="text-white text-xl font-bold leading-tight">${trip.profiles?.full_name || 'Desconocido'}</h3>
                            <p class="text-emerald-400 font-mono text-sm mt-1 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span> Verificado</p>
                        </div>
                    </div>
                </div>

                <div class="mt-auto pt-8">
                    <button id="btn-gate-action" class="w-full py-6 rounded-2xl font-black text-xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">
                        ABRIR BARRERA (${isEntry ? 'ENTRADA' : 'SALIDA'})
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-gate-action').onclick = () => this.executeGateRegistration(trip);
    }

    renderError(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 border-red-500 bg-red-500/10 mb-8">
                    <span class="material-symbols-outlined text-7xl text-red-500 mb-4">cancel</span>
                    <h2 class="text-3xl font-black text-red-500 uppercase mb-2 leading-none">RECHAZADO</h2>
                    <p class="text-white text-sm uppercase font-bold tracking-widest">${msg}</p>
                </div>
                <button onclick="window.scannerView.resetScan()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67]">ESCANEAR DE NUEVO</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    async executeGateRegistration(trip) {
        const btn = document.getElementById('btn-gate-action');
        btn.innerText = "Sincronizando con Base..."; btn.disabled = true;

        const isExit = trip.status !== 'in_progress';
        
        const { error } = await supabase
            .from('trips')
            .update({ 
                status: isExit ? 'in_progress' : 'arrived', 
                [isExit ? 'exit_gate_time' : 'entry_gate_time']: new Date().toISOString()
            })
            .eq('id', trip.id);

        if (error) {
            alert("Error de red: " + error.message);
            btn.disabled = false;
        } else {
            this.resetScan(); // Limpia para el siguiente carro
            document.getElementById('result-area').innerHTML = `
                <div class="flex flex-col items-center animate-fade-in">
                    <div class="size-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.5)] mb-6">
                        <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                    </div>
                    <h2 class="text-3xl font-black text-white uppercase tracking-tighter">BARRERA LIBERADA</h2>
                    <p class="text-emerald-400 font-bold uppercase tracking-widest mt-2">GPS del vehículo notificado.</p>
                </div>
            `;
            setTimeout(() => { if(document.getElementById('result-area')) this.resetScan(); }, 4000);
        }
    }
}
