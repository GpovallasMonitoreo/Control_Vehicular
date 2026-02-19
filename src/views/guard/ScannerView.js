import { supabase } from '../../config/supabaseClient.js';

export class ScannerView {
    constructor() {
        this.html5QrCode = null;
        this.isProcessing = false;
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
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Validación de Accesos en Tiempo Real</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar Escáner
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col group">
                        <div id="reader" class="w-full flex-1 bg-black"></div>
                        
                        <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                            <div class="w-full h-full border-2 border-emerald-500/30 rounded-xl relative">
                                <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
                                <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
                                <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
                                <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
                            </div>
                        </div>

                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 backdrop-blur-sm p-3 text-center z-10">
                            <p class="text-white text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-tighter">
                                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Escaneo en Vivo Activo
                            </p>
                        </div>
                     </div>
                     
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-black rounded-xl p-4 placeholder-slate-600 focus:border-primary outline-none text-center tracking-widest text-2xl font-mono uppercase" placeholder="ID MANUAL">
                        <button id="btn-validate" class="bg-primary hover:bg-blue-600 text-white font-bold px-6 rounded-xl transition-all shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined">search</span>
                        </button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl h-full relative overflow-hidden transition-all duration-500">
                    <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-7xl text-slate-700">qr_code_scanner</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Validación</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Coloque el QR del conductor frente a la cámara para autorizar el movimiento de la unidad.</p>
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
                this.handleScan(decoded);
            }
        }).catch(err => console.error("Error cámara:", err));

        document.getElementById('btn-validate').onclick = () => {
            const val = document.getElementById('scan-input').value;
            if(val) this.handleScan(val);
        };
    }

    async handleScan(code) {
        const area = document.getElementById('result-area');
        const cleanCode = code.trim();

        // Loading State
        area.innerHTML = `
            <div class="flex flex-col items-center animate-pulse">
                <div class="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p class="text-primary font-black uppercase text-sm tracking-[4px]">Verificando Credenciales...</p>
            </div>`;

        try {
            // Buscamos el viaje, el chofer y el vehículo en una sola consulta relacional
            const { data: trip, error } = await supabase
                .from('trips')
                .select(\`
                    *,
                    profiles:driver_id (full_name, photo_url, employee_id, role),
                    vehicles:vehicle_id (economic_number, plate, model, brand)
                \`)
                .or(\`id.eq.\${cleanCode},emergency_code.eq.\${cleanCode}\`)
                .neq('status', 'closed')
                .maybeSingle();

            if (error) throw error;
            if (!trip) throw new Error("IDENTIFICACIÓN NO RECONOCIDA O SIN VIAJE ACTIVO");

            // Si es código de emergencia, validar expiración
            if (trip.emergency_code === cleanCode && trip.emergency_expiry) {
                if (new Date() > new Date(trip.emergency_expiry)) {
                    throw new Error("EL CÓDIGO DE EMERGENCIA HA EXPIRADO");
                }
            }

            this.renderDriverProfile(trip);

        } catch (e) {
            this.renderError(e.message);
        } finally {
            this.isProcessing = false;
        }
    }

    renderDriverProfile(trip) {
        const isEntry = trip.status === 'in_progress';
        const canPass = trip.status === 'driver_accepted' || trip.status === 'in_progress' || trip.emergency_code;
        
        const statusColor = isEntry ? 'text-blue-400' : 'text-emerald-400';
        const borderColor = isEntry ? 'border-blue-500' : 'border-emerald-500';

        document.getElementById('result-area').innerHTML = `
            <div class="w-full h-full flex flex-col animate-fade-in">
                <div class="flex items-center justify-between mb-8">
                    <div class="text-left">
                        <span class="bg-white/10 text-white text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest">Validación Exitosa</span>
                        <h2 class="text-3xl font-black text-white mt-2 uppercase tracking-tighter">\${isEntry ? 'RETORNO UNIDAD' : 'SALIDA AUTORIZADA'}</h2>
                    </div>
                    <span class="material-symbols-outlined text-5xl \${statusColor}">verified</span>
                </div>

                <div class="bg-[#111a22] border-2 \${borderColor} rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div class="flex items-center gap-6 relative z-10">
                        <div class="size-24 rounded-2xl bg-slate-700 bg-cover bg-center border-2 border-white/20 shadow-lg" 
                             style="background-image: url('\${trip.profiles.photo_url || ''}')"></div>
                        <div class="text-left flex-1">
                            <p class="text-[#92adc9] text-[10px] font-black uppercase tracking-widest">Operador Autorizado</p>
                            <h3 class="text-white text-xl font-bold leading-tight">\${trip.profiles.full_name}</h3>
                            <p class="text-primary font-mono text-sm mt-1">ID: \${trip.profiles.employee_id || '---'}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                        <div class="text-left">
                            <p class="text-[#92adc9] text-[9px] font-black uppercase">Unidad</p>
                            <p class="text-white font-bold">ECO-\${trip.vehicles.economic_number}</p>
                        </div>
                        <div class="text-left">
                            <p class="text-[#92adc9] text-[9px] font-black uppercase">Placas</p>
                            <p class="text-white font-mono font-bold">\${trip.vehicles.plate}</p>
                        </div>
                    </div>

                    <span class="material-symbols-outlined absolute -bottom-8 -right-8 text-[150px] opacity-5 text-white">local_shipping</span>
                </div>

                <div class="mt-auto pt-8">
                    <button id="btn-gate-action" class="w-full py-5 rounded-2xl font-black text-xl bg-white text-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3">
                        <span class="material-symbols-outlined text-3xl">door_sliding</span>
                        REGISTRAR \${isEntry ? 'ENTRADA' : 'SALIDA'}
                    </button>
                    <p class="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-widest">Al presionar se liberará la bitácora y se actualizará el GPS</p>
                </div>
            </div>
        `;

        document.getElementById('btn-gate-action').onclick = () => this.executeGateRegistration(trip);
    }

    renderError(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 border-red-500 bg-red-500/10 mb-8 shadow-2xl">
                    <span class="material-symbols-outlined text-7xl text-red-500 mb-4">cancel</span>
                    <h2 class="text-4xl font-black text-red-500 uppercase mb-2 leading-none">ACCESO DENEGADO</h2>
                    <p class="text-white text-base font-bold leading-relaxed uppercase tracking-tighter">\${msg}</p>
                </div>
                <button onclick="window.location.reload()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a] transition-all">VOLVER A INTENTAR</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    async executeGateRegistration(trip) {
        const btn = document.getElementById('btn-gate-action');
        btn.innerText = "PROCESANDO..."; btn.disabled = true;

        const isExit = trip.status !== 'in_progress';
        const nextStatus = isExit ? 'in_progress' : 'arrived';
        const timeColumn = isExit ? 'exit_gate_time' : 'entry_gate_time';

        const { error } = await supabase
            .from('trips')
            .update({ 
                status: nextStatus, 
                [timeColumn]: new Date().toISOString(),
                emergency_code: null // Se quema el código al usarlo
            })
            .eq('id', trip.id);

        if (error) {
            alert("Error de red: " + error.message);
            btn.disabled = false;
        } else {
            this.showFinalSuccess(isExit ? "SALIDA REGISTRADA" : "ENTRADA REGISTRADA");
        }
    }

    showFinalSuccess(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="flex flex-col items-center animate-fade-in">
                <div class="size-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-6">
                    <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase tracking-tighter">\${msg}</h2>
                <p class="text-emerald-400 font-bold mt-2 tracking-widest animate-pulse uppercase">Barrera Liberada</p>
                <button onclick="window.location.reload()" class="mt-10 bg-[#233648] text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest border border-[#324d67]">Siguiente Vehículo</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
