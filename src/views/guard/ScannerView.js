import { supabase } from '../../config/supabaseClient.js';

export class ScannerView {
    constructor() {
        this.html5QrCode = null;
        window.scannerView = this;
    }

    render() {
        return `
        <div class="fixed inset-0 z-50 w-full h-full bg-[#0d141c] font-display flex flex-col overflow-hidden">
            
            <div class="flex items-center justify-between border-b border-[#324d67] p-4 bg-[#111a22] shrink-0 shadow-lg">
                <div class="flex items-center gap-3">
                    <div class="bg-emerald-500/20 p-2 rounded-lg text-emerald-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl">shield_person</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-white tracking-tight leading-none">Caseta de Vigilancia</h2>
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Control de Accesos COV</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white hover:border-primary transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar Cámara
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-[0_0_30px_rgba(0,0,0,0.5)] relative aspect-square flex flex-col group">
                        <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                        
                        <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                            <div class="w-full h-full border-2 border-emerald-500/50 rounded-xl relative">
                                <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
                                <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
                                <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
                                <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
                            </div>
                        </div>

                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 backdrop-blur-sm p-3 text-center z-10">
                            <p class="text-white text-xs font-bold flex items-center justify-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                LISTO PARA ESCANEAR GAFETE O PASE REMOTO
                            </p>
                        </div>
                     </div>
                     
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-bold rounded-xl p-4 placeholder-slate-600 focus:border-primary outline-none text-center tracking-widest" placeholder="INGRESAR ID MANUAL">
                        <button id="btn-validate" class="bg-primary hover:bg-blue-600 text-white font-bold px-6 rounded-xl transition-colors shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined">search</span>
                        </button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl h-full relative overflow-hidden">
                    <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-7xl text-slate-700">qr_code_2</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Validación</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Coloque el QR del conductor o el Pase de Emergencia frente a la cámara para autorizar el movimiento.</p>
                    
                    <div class="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                        <span class="material-symbols-outlined text-[200px]">verified_user</span>
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
            this.html5QrCode.pause(); 
            this.handleScan(decoded);
        }).catch(err => {
            console.error("Error al iniciar cámara:", err);
            document.getElementById('result-area').innerHTML = `
                <div class="text-red-400">
                    <span class="material-symbols-outlined text-5xl mb-2">videocam_off</span>
                    <p class="font-bold">Cámara no detectada</p>
                    <p class="text-xs mt-2">Asegúrate de dar permisos o usar un dispositivo móvil.</p>
                </div>`;
        });

        document.getElementById('btn-validate').onclick = () => {
            const manualCode = document.getElementById('scan-input').value;
            if(manualCode) this.handleScan(manualCode);
        };
    }

    async handleScan(code) {
        if(!code) return;
        const area = document.getElementById('result-area');
        area.innerHTML = `
            <div class="flex flex-col items-center animate-pulse">
                <div class="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p class="text-primary font-black uppercase tracking-widest text-sm">Consultando Nube...</p>
            </div>`;

        try {
            let data = null;
            let isEmergency = false;

            // 1. INTENTAR PARSEAR COMO PASE DE EMERGENCIA (JSON)
            try {
                const parsed = JSON.parse(code);
                if (parsed.type === 'emergency_pass') {
                    data = parsed;
                    isEmergency = true;
                }
            } catch (e) {
                // No es JSON, asumimos que es un ID de conductor estándar (UUID)
            }

            if (isEmergency) {
                // VALIDACIÓN DE PASE DE EMERGENCIA
                const now = Date.now();
                if (now > data.expires) {
                    throw new Error("PASE EXPIRADO. Este código solo es válido por 1 hora.");
                }

                // Buscar el viaje activo para esa unidad
                const { data: trip, error: tripErr } = await supabase
                    .from('trips')
                    .select(`*, vehicles(*), profiles(full_name, photo_url)`)
                    .eq('vehicle_id', data.v_id)
                    .neq('status', 'closed')
                    .maybeSingle();

                if (!trip) throw new Error("No hay un viaje activo registrado para esta unidad.");

                this.renderResult('orange', 'ACCESO REMOTO', 
                    `UNIDAD: ${trip.vehicles.economic_number}<br>PASE DE EMERGENCIA ACTIVO<br>Conductor: ${trip.profiles.full_name}`, 
                    { 
                        text: trip.status === 'driver_accepted' ? 'AUTORIZAR SALIDA' : 'AUTORIZAR ENTRADA', 
                        action: () => trip.status === 'driver_accepted' ? this.registerExit(trip.id) : this.registerEntry(trip.id) 
                    }
                );

            } else {
                // VALIDACIÓN ESTÁNDAR (POR ID DE CONDUCTOR)
                const { data: driver, error: dErr } = await supabase.from('profiles').select('*').eq('id', code.trim()).single();
                if(!driver) throw new Error("Gafete no reconocido en el sistema.");

                const { data: trip, error: tErr } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', driver.id).neq('status', 'closed').maybeSingle();

                if (!trip) {
                    this.renderResult('error', 'SIN VIAJE', `${driver.full_name}<br>No tiene una unidad asignada actualmente.`);
                    return;
                }

                // Flujos según estatus del viaje
                if (trip.status === 'requested') {
                    this.renderResult('yellow', 'EN REVISIÓN', 'El mecánico aún no libera la unidad.');
                } else if (trip.status === 'mechanic_approved') {
                    this.renderResult('yellow', 'POR FIRMAR', 'El conductor debe aceptar la unidad en su app.');
                } else if (trip.status === 'driver_accepted') {
                    this.renderResult('green', 'AUTORIZADO', `Salida permitida para:<br><b class="text-white">${trip.vehicles.economic_number} - ${trip.vehicles.plate}</b>`, 
                        { text: 'REGISTRAR SALIDA', action: () => this.registerExit(trip.id) });
                } else if (trip.status === 'in_progress') {
                    this.renderResult('blue', 'RETORNO', `Unidad regresando de ruta:<br><b class="text-white">${trip.vehicles.economic_number}</b>`, 
                        { text: 'REGISTRAR ENTRADA', action: () => this.registerEntry(trip.id) });
                } else if (trip.status === 'arrived') {
                    this.renderResult('orange', 'EN PATIO', 'La unidad ya está en base. Chofer debe cerrar viaje.');
                }
            }

        } catch (e) {
            this.renderResult('error', 'DENEGADO', e.message);
        }
    }

    renderResult(color, title, desc, btnObj = null) {
        const colors = {
            green: 'text-green-500 border-green-500 bg-green-500/10',
            orange: 'text-orange-500 border-orange-500 bg-orange-500/10',
            yellow: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
            blue: 'text-blue-500 border-blue-500 bg-blue-500/10',
            error: 'text-red-500 border-red-500 bg-red-500/10'
        };
        const c = colors[color] || colors.error;
        const icon = color === 'error' ? 'cancel' : color === 'green' || color === 'orange' ? 'verified' : 'pending';

        const area = document.getElementById('result-area');
        area.innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 ${c} mb-6 shadow-2xl">
                    <span class="material-symbols-outlined text-6xl mb-2">${icon}</span>
                    <h2 class="text-4xl font-black uppercase mb-3 leading-none">${title}</h2>
                    <p class="text-[#92adc9] text-sm leading-relaxed">${desc}</p>
                </div>
                ${btnObj ? `
                    <button id="btn-action" class="w-full py-5 rounded-2xl font-black text-xl bg-white text-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest">
                        ${btnObj.text}
                    </button>
                    <button onclick="window.location.reload()" class="mt-4 text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors">Cancelar y Volver</button>
                ` : `
                    <button onclick="window.location.reload()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67] hover:bg-[#2d445a]">VOLVER A ESCANEAR</button>
                `}
            </div>
        `;

        if(btnObj) document.getElementById('btn-action').onclick = btnObj.action;
    }

    async registerExit(tripId) {
        const btn = document.getElementById('btn-action');
        btn.innerText = "PROCESANDO..."; btn.disabled = true;

        const { error } = await supabase
            .from('trips')
            .update({ 
                status: 'in_progress', 
                exit_gate_time: new Date() 
            })
            .eq('id', tripId);

        if (error) {
            alert("Error: " + error.message);
            btn.disabled = false;
        } else {
            this.showSuccessOverlay("SALIDA REGISTRADA");
        }
    }

    async registerEntry(tripId) {
        const btn = document.getElementById('btn-action');
        btn.innerText = "PROCESANDO..."; btn.disabled = true;

        const { error } = await supabase
            .from('trips')
            .update({ 
                status: 'arrived', 
                entry_gate_time: new Date() 
            })
            .eq('id', tripId);

        if (error) {
            alert("Error: " + error.message);
            btn.disabled = false;
        } else {
            this.showSuccessOverlay("ENTRADA REGISTRADA");
        }
    }

    showSuccessOverlay(msg) {
        const area = document.getElementById('result-area');
        area.innerHTML = `
            <div class="flex flex-col items-center animate-fade-in">
                <div class="size-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-6">
                    <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase">${msg}</h2>
                <p class="text-emerald-400 font-bold mt-2 tracking-widest animate-pulse">BARRERA LIBERADA</p>
                <button onclick="window.location.reload()" class="mt-10 bg-[#233648] text-white px-8 py-3 rounded-xl font-bold uppercase text-sm">Siguiente Vehículo</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
