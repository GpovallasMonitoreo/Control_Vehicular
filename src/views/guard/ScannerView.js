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
                    <div class="bg-emerald-500/20 p-2 rounded-lg text-emerald-500">
                        <span class="material-symbols-outlined text-2xl">shield_person</span>
                    </div>
                    <div>
                        <h2 class="text-xl font-black text-white tracking-tight leading-none">Caseta de Vigilancia</h2>
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Validación de Accesos</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reintentar
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col group">
                        <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 backdrop-blur-sm p-3 text-center z-10">
                            <p class="text-white text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-tighter">
                                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Escaneo en Vivo Activo
                            </p>
                        </div>
                     </div>
                     
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-black rounded-xl p-4 placeholder-slate-600 focus:border-primary outline-none text-center tracking-widest text-2xl font-mono uppercase" placeholder="CÓDIGO">
                        <button id="btn-validate" class="bg-primary hover:bg-blue-600 text-white font-bold px-6 rounded-xl transition-all shadow-lg shadow-primary/20">
                            <span class="material-symbols-outlined">search</span>
                        </button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl h-full min-h-[350px] relative overflow-hidden">
                    <div class="size-24 rounded-full bg-[#111a22] border-2 border-[#324d67] flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined text-6xl text-slate-700">qr_code_2</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2">Esperando Validación</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el QR del conductor o ingrese el código de emergencia.</p>
                </div>

            </div>
        </div>
        `;
    }

    onMount() {
        this.html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };
        
        this.html5QrCode.start({ facingMode: "environment" }, config, 
            (decoded) => this.handleScan(decoded),
            (err) => { /* Errores de búsqueda de QR silenciados */ }
        ).catch(err => {
            console.error("Error cámara:", err);
        });

        document.getElementById('btn-validate').onclick = () => {
            const val = document.getElementById('scan-input').value;
            if(val) this.handleScan(val);
        };
    }

    async handleScan(code) {
        if(!code) return;
        const area = document.getElementById('result-area');
        area.innerHTML = `<div class="flex flex-col items-center animate-pulse"><div class="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-primary font-bold uppercase text-xs tracking-widest">Validando...</p></div>`;

        try {
            let trip = null;
            const cleanCode = code.trim();

            // --- ESCENARIO 1: ES UN QR DINÁMICO (JSON) ---
            if (cleanCode.startsWith('{')) {
                try {
                    const parsed = JSON.parse(cleanCode);
                    const tripId = parsed.t_id || parsed.trip_id;

                    if (tripId) {
                        // Buscamos el viaje directamente por su ID
                        const { data, error } = await supabase
                            .from('trips')
                            .select('*, vehicles(*), profiles(*)')
                            .eq('id', tripId)
                            .single();

                        if (error || !data) throw new Error("VIAJE NO ENCONTRADO O EXPIRADO");
                        trip = data;
                        
                        this.renderResult('green', 'GAFETE VALIDADO', 
                            `UNIDAD: ${trip.vehicles.economic_number}<br>Chofer: ${trip.profiles.full_name}<br>Placas: ${trip.vehicles.plate}`, 
                            { 
                                text: trip.status === 'driver_accepted' ? 'REGISTRAR SALIDA' : 'REGISTRAR ENTRADA', 
                                action: () => this.executeAction(trip) 
                            }
                        );
                        return;
                    }
                } catch (e) {
                    console.error("Error parseando JSON:", e);
                }
            }

            // --- ESCENARIO 2: ES UN CÓDIGO DE EMERGENCIA (6 DÍGITOS) ---
            if (/^\d{6}$/.test(cleanCode)) {
                const { data, error } = await supabase
                    .from('trips')
                    .select('*, vehicles(*), profiles(*)')
                    .eq('emergency_code', cleanCode)
                    .neq('status', 'closed')
                    .maybeSingle();

                if (!data) throw new Error("CÓDIGO INVÁLIDO O EXPIRADO");
                
                trip = data;
                this.renderResult('orange', 'ACCESO REMOTO', 
                    `UNIDAD: ${trip.vehicles.economic_number}<br>AUTORIZACIÓN POR TALLER<br>Chofer: ${trip.profiles.full_name}`, 
                    { 
                        text: (trip.status === 'driver_accepted' || trip.status === 'mechanic_approved') ? 'AUTORIZAR SALIDA' : 'AUTORIZAR ENTRADA', 
                        action: () => this.executeAction(trip) 
                    }
                );
                return;
            }

            // --- ESCENARIO 3: ES EL ID DEL CONDUCTOR (UUID) ---
            const { data: driver } = await supabase.from('profiles').select('*').eq('id', cleanCode).maybeSingle();
            if (driver) {
                const { data: tripData } = await supabase
                    .from('trips')
                    .select('*, vehicles(*), profiles(*)')
                    .eq('driver_id', driver.id)
                    .neq('status', 'closed')
                    .maybeSingle();

                if (!tripData) throw new Error("EL CONDUCTOR NO TIENE VIAJES ACTIVOS");
                
                const isEntry = tripData.status === 'in_progress';
                this.renderResult(isEntry ? 'blue' : 'green', isEntry ? 'RETORNO' : 'AUTORIZADO', 
                    `UNIDAD: ${tripData.vehicles.economic_number}<br>Chofer: ${driver.full_name}`, 
                    { text: isEntry ? 'REGISTRAR ENTRADA' : 'REGISTRAR SALIDA', action: () => this.executeAction(tripData) });
                return;
            }

            throw new Error("FORMATO DE CÓDIGO NO RECONOCIDO");

        } catch (e) {
            this.renderResult('error', 'ACCESO DENEGADO', e.message);
        }
    }

    renderResult(color, title, desc, btnObj = null) {
        const themes = {
            green: 'border-green-500 bg-green-500/10 text-green-500',
            orange: 'border-orange-500 bg-orange-500/10 text-orange-500',
            blue: 'border-blue-500 bg-blue-500/10 text-blue-500',
            yellow: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
            error: 'border-red-500 bg-red-500/10 text-red-500'
        };
        const theme = themes[color] || themes.error;

        document.getElementById('result-area').innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 ${theme} mb-6 shadow-2xl">
                    <h2 class="text-4xl font-black uppercase mb-3 leading-tight">${title}</h2>
                    <p class="text-white text-base font-bold leading-relaxed">${desc}</p>
                </div>
                ${btnObj ? `
                    <button id="btn-execute" class="w-full py-5 rounded-2xl font-black text-xl bg-white text-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest">
                        ${btnObj.text}
                    </button>
                    <button onclick="window.location.reload()" class="mt-4 text-[#92adc9] text-xs font-bold uppercase hover:text-white transition-colors">Cancelar</button>
                ` : `<button onclick="window.location.reload()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white">VOLVER A INTENTAR</button>`}
            </div>
        `;
        if(btnObj) document.getElementById('btn-execute').onclick = btnObj.action;
    }

    async executeAction(trip) {
        const btn = document.getElementById('btn-execute');
        btn.innerText = "REGISTRANDO..."; btn.disabled = true;

        const isExit = (trip.status === 'driver_accepted' || trip.status === 'approved' || trip.emergency_code);
        const newStatus = isExit ? 'in_progress' : 'arrived';
        const timeField = isExit ? 'exit_gate_time' : 'entry_gate_time';

        const { error } = await supabase.from('trips').update({ 
            status: newStatus, 
            [timeField]: new Date(),
            emergency_code: null 
        }).eq('id', trip.id);

        if (error) {
            alert("Error: " + error.message);
            btn.disabled = false;
        } else {
            this.showSuccess(isExit ? "SALIDA EXITOSA" : "ENTRADA EXITOSA");
        }
    }

    showSuccess(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="flex flex-col items-center animate-fade-in">
                <div class="size-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-6">
                    <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase">${msg}</h2>
                <button onclick="window.location.reload()" class="mt-10 bg-[#233648] text-white px-8 py-3 rounded-xl font-bold uppercase text-sm">Siguiente</button>
            </div>
        `;
    }
}
