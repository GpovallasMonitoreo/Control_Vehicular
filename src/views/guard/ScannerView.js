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
                    <div class="bg-emerald-500/20 p-2 rounded-lg text-emerald-500"><span class="material-symbols-outlined">shield_person</span></div>
                    <div>
                        <h2 class="text-xl font-black text-white leading-none">Caseta de Vigilancia</h2>
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Validación de Accesos</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all">Reiniciar</button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square">
                        <div id="reader" class="w-full h-full bg-black"></div>
                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 p-3 text-center z-10">
                            <p class="text-white text-xs font-bold uppercase">Escáner de Seguridad Activo</p>
                        </div>
                     </div>
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-black rounded-xl p-4 text-center tracking-[4px] text-xl outline-none" placeholder="CÓDIGO MANUAL">
                        <button id="btn-validate" class="bg-primary text-white font-bold px-6 rounded-xl transition-all shadow-lg"><span class="material-symbols-outlined">search</span></button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl min-h-[350px]">
                    <div class="size-24 rounded-full bg-[#111a22] flex items-center justify-center mb-6 border border-[#324d67]">
                        <span class="material-symbols-outlined text-6xl text-slate-700">qr_code_scanner</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Código</h3>
                    <p class="text-[#92adc9] text-sm">Escanee el QR dinámico del conductor o ingrese el código de 6 dígitos del Taller.</p>
                </div>
            </div>
        </div>
        `;
    }

    onMount() {
        this.html5QrCode = new Html5Qrcode("reader");
        this.html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, (decoded) => {
            this.handleScan(decoded);
        }).catch(err => {
            document.getElementById('result-area').innerHTML = `<p class="text-red-500 font-bold">Error de Cámara: Habilite los permisos en su navegador.</p>`;
        });

        document.getElementById('btn-validate').onclick = () => {
            const val = document.getElementById('scan-input').value;
            if(val) this.handleScan(val);
        };
    }

    async handleScan(code) {
        if(!code) return;
        const area = document.getElementById('result-area');
        area.innerHTML = `<div class="flex flex-col items-center animate-pulse"><div class="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-primary font-bold uppercase text-xs">Validando en Nube...</p></div>`;

        try {
            let cleanCode = code.trim();
            let trip = null;

            // --- PASO 1: ¿ES UN QR DINÁMICO (JSON)? ---
            if (cleanCode.startsWith('{')) {
                try {
                    const data = JSON.parse(cleanCode);
                    const tripId = data.t_id || data.trip_id;
                    if (tripId) {
                        const { data: tripData, error } = await supabase.from('trips').select('*, vehicles(*), profiles(*)').eq('id', tripId).single();
                        if (error || !tripData) throw new Error("VIAJE NO ENCONTRADO");
                        this.processTripResult(tripData);
                        return; // SALIDA EXITOSA
                    }
                } catch (e) { console.error("Error JSON:", e); }
            }

            // --- PASO 2: ¿ES UN CÓDIGO DE EMERGENCIA (6 DÍGITOS)? ---
            if (/^\d{6}$/.test(cleanCode)) {
                const { data: tripData } = await supabase.from('trips').select('*, vehicles(*), profiles(*)').eq('emergency_code', cleanCode).neq('status', 'closed').maybeSingle();
                if (tripData) {
                    this.renderResult('orange', 'PASE REMOTO', `UNIDAD: ${tripData.vehicles.economic_number}<br>Chofer: ${tripData.profiles.full_name}`, 
                        { text: tripData.status === 'in_progress' ? 'AUTORIZAR ENTRADA' : 'AUTORIZAR SALIDA', action: () => this.executeAction(tripData) });
                    return;
                }
                throw new Error("CÓDIGO INVÁLIDO O EXPIRADO");
            }

            // --- PASO 3: ¿ES UN ID DE CONDUCTOR (GAFETE FIJO)? ---
            const { data: driver } = await supabase.from('profiles').select('*').eq('id', cleanCode).maybeSingle();
            if (driver) {
                const { data: tripData } = await supabase.from('trips').select('*, vehicles(*), profiles(*)').eq('driver_id', driver.id).neq('status', 'closed').maybeSingle();
                if (!tripData) throw new Error(`El conductor ${driver.full_name} no tiene viajes activos.`);
                this.processTripResult(tripData);
                return;
            }

            throw new Error("EL CÓDIGO NO TIENE UN FORMATO VÁLIDO");

        } catch (e) {
            this.renderResult('error', 'ACCESO DENEGADO', e.message);
        }
    }

    processTripResult(trip) {
        if (trip.status === 'requested') {
            this.renderResult('yellow', 'PENDIENTE', `La unidad ${trip.vehicles.economic_number} sigue en manos del MECÁNICO.`);
        } else {
            const isEntry = trip.status === 'in_progress';
            this.renderResult(isEntry ? 'blue' : 'green', isEntry ? 'RETORNO' : 'AUTORIZADO', 
                `UNIDAD: ${trip.vehicles.economic_number}<br>Chofer: ${trip.profiles.full_name}`, 
                { text: isEntry ? 'REGISTRAR ENTRADA' : 'REGISTRAR SALIDA', action: () => this.executeAction(trip) });
        }
    }

    renderResult(color, title, desc, btnObj = null) {
        const themes = { green: 'border-green-500 bg-green-500/10 text-green-500', orange: 'border-orange-500 bg-orange-500/10 text-orange-500', blue: 'border-blue-500 bg-blue-500/10 text-blue-500', yellow: 'border-yellow-500 bg-yellow-500/10 text-yellow-500', error: 'border-red-500 bg-red-500/10 text-red-500' };
        document.getElementById('result-area').innerHTML = `
            <div class="w-full animate-fade-in-up">
                <div class="w-full p-8 rounded-3xl border-4 ${themes[color] || themes.error} mb-6 shadow-2xl">
                    <h2 class="text-4xl font-black uppercase mb-3 leading-tight">${title}</h2>
                    <p class="text-white text-base font-bold leading-relaxed">${desc}</p>
                </div>
                ${btnObj ? `<button id="btn-execute" class="w-full py-5 rounded-2xl font-black text-xl bg-white text-black hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">${btnObj.text}</button>` : `<button onclick="window.location.reload()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white">REINTENTAR</button>`}
            </div>`;
        if(btnObj) document.getElementById('btn-execute').onclick = btnObj.action;
    }

    async executeAction(trip) {
        const isExit = trip.status !== 'in_progress';
        const { error } = await supabase.from('trips').update({ status: isExit ? 'in_progress' : 'arrived', [isExit ? 'exit_gate_time' : 'entry_gate_time']: new Date(), emergency_code: null }).eq('id', trip.id);
        if (error) alert(error.message);
        else {
            document.getElementById('result-area').innerHTML = `<div class="flex flex-col items-center"><div class="size-24 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-6"><span class="material-symbols-outlined text-6xl">check</span></div><h2 class="text-white text-3xl font-black uppercase">¡ÉXITO!</h2><button onclick="window.location.reload()" class="mt-8 text-primary font-bold underline uppercase text-xs">Validar Siguiente</button></div>`;
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
    }
}
