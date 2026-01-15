import { supabase } from '../../config/supabaseClient.js';

export class ScannerView {
    render() {
        return `
        <div class="fixed inset-0 z-50 w-full h-full bg-[#0d141c] font-display flex flex-col overflow-hidden">
            
            <div class="flex items-center justify-between border-b border-[#324d67] p-4 bg-[#111a22] shrink-0 shadow-lg">
                <div>
                    <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-500">security</span>
                        Control de Acceso
                    </h2>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white hover:border-primary transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-2xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col">
                        <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                        <div class="absolute bottom-0 inset-x-0 bg-black/80 p-2 text-center z-10">
                            <p class="text-[#92adc9] text-xs font-bold animate-pulse">Escaneando QR...</p>
                        </div>
                     </div>
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-bold rounded-lg p-3 placeholder-slate-600 focus:border-primary outline-none" placeholder="ID Manual">
                        <button id="btn-validate" class="bg-[#324d67] hover:bg-primary text-white font-bold py-2 px-4 rounded-lg"><span class="material-symbols-outlined">search</span></button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-2xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-xl h-full min-h-[300px]">
                    <div class="size-24 rounded-full bg-[#111a22] border-2 border-[#324d67] flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined text-6xl text-slate-600">qr_code_scanner</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2">Esperando Escaneo</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el código QR del conductor.</p>
                </div>

            </div>
        </div>
        `;
    }

    onMount() {
        this.html5QrCode = new Html5Qrcode("reader");
        this.html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decoded) => {
            this.html5QrCode.pause(); this.handleScan(decoded);
        });
        document.getElementById('btn-validate').onclick = () => this.handleScan(document.getElementById('scan-input').value);
    }

    async handleScan(code) {
        if(!code) return;
        const area = document.getElementById('result-area');
        area.innerHTML = `<span class="loader"></span> Buscando...`;

        try {
            const { data: driver } = await supabase.from('profiles').select('*').eq('id', code.trim()).single();
            if(!driver) throw new Error("Conductor no encontrado");

            const { data: trip } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', driver.id).neq('status', 'closed').maybeSingle();

            if (!trip) {
                this.renderResult('error', 'Sin Asignación', 'Este conductor no tiene viajes activos.');
                return;
            }

            if (trip.status === 'requested') {
                this.renderResult('yellow', 'PENDIENTE', 'Supervisor no ha aprobado aún.');
            
            } else if (trip.status === 'approved') {
                this.renderResult('green', 'AUTORIZADO', `Unidad: ${trip.vehicles.economic_number}<br>Salida Autorizada`, 
                    { text: 'REGISTRAR SALIDA (BARRERA)', action: () => this.registerExit(trip.id) });

            } else if (trip.status === 'open') {
                this.renderResult('blue', 'REGRESANDO', `Unidad: ${trip.vehicles.economic_number}<br>Validar Entrada`, 
                    { text: 'REGISTRAR LLEGADA', action: () => this.registerEntry(trip.id) });

            } else if (trip.status === 'arrived') {
                this.renderResult('orange', 'EN PATIO', 'Esperando que el conductor cierre en su App.');
            }

        } catch (e) {
            this.renderResult('error', 'Error', e.message);
        }
    }

    renderResult(color, title, desc, btnObj = null) {
        const colors = {
            green: 'text-green-500 border-green-500 bg-green-500/10',
            red: 'text-red-500 border-red-500 bg-red-500/10',
            yellow: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
            blue: 'text-blue-500 border-blue-500 bg-blue-500/10',
            orange: 'text-orange-500 border-orange-500 bg-orange-500/10',
            error: 'text-slate-400 border-slate-600 bg-slate-800'
        };
        const c = colors[color] || colors.error;
        let html = `<div class="w-full p-6 rounded-xl border-4 ${c} mb-4"><h2 class="text-4xl font-black uppercase mb-2">${title}</h2><p class="text-white font-bold">${desc}</p></div>`;
        if(btnObj) html += `<button id="btn-action" class="w-full py-4 rounded-xl font-black text-xl bg-white text-black hover:scale-105 transition-transform">${btnObj.text}</button>`;
        else html += `<button onclick="location.reload()" class="text-slate-500 underline">Volver</button>`;
        const area = document.getElementById('result-area');
        area.innerHTML = html;
        if(btnObj) document.getElementById('btn-action').onclick = btnObj.action;
    }

    async registerExit(tripId) {
        const btn = document.getElementById('btn-action');
        btn.innerText = "Registrando..."; btn.disabled = true;

        // Se usa 'exit_time' (normalmente existe). Si falla, eliminar el campo time.
        const { error } = await supabase
            .from('trips')
            .update({ status: 'open', exit_time: new Date() })
            .eq('id', tripId);

        if (error) {
            console.error(error);
            alert("Error BD: " + error.message);
            btn.disabled = false;
        } else {
            alert("✅ Salida Registrada Exitosamente.");
            location.reload();
        }
    }

    async registerEntry(tripId) {
        const btn = document.getElementById('btn-action');
        btn.innerText = "Registrando..."; btn.disabled = true;

        // CORRECCIÓN: Eliminé 'entry_gate_time' porque no existe en tu tabla y causaba el error.
        // Solo actualizamos el status a 'arrived'.
        const { error } = await supabase
            .from('trips')
            .update({ status: 'arrived' }) // <--- CAMBIO AQUÍ (Sin fecha para evitar crash)
            .eq('id', tripId);

        if (error) {
            console.error(error);
            alert("Error BD: " + error.message);
            btn.disabled = false;
        } else {
            alert("✅ Entrada Registrada. El conductor ya puede finalizar en su App.");
            location.reload();
        }
    }
}