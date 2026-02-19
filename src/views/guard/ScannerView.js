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
                        <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest mt-1">Control de Accesos COV</p>
                    </div>
                </div>
                <button onclick="window.location.reload()" class="px-4 py-2 rounded-lg bg-[#1c2127] border border-[#324d67] text-[#92adc9] text-xs font-bold hover:text-white transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">refresh</span> Reiniciar
                </button>
            </div>

            <div class="flex-1 p-6 overflow-y-auto w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                
                <div class="flex flex-col gap-4">
                     <div class="bg-black rounded-3xl overflow-hidden border-4 border-[#324d67] shadow-2xl relative aspect-square flex flex-col group">
                        <div id="reader" class="w-full flex-1 bg-black min-h-[300px]"></div>
                        <div class="absolute bottom-0 inset-x-0 bg-emerald-900/90 backdrop-blur-sm p-3 text-center z-10">
                            <p class="text-white text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-tighter">
                                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span> Escáner Físico Activo
                            </p>
                        </div>
                     </div>
                     
                     <div class="flex gap-2">
                        <input id="scan-input" type="text" class="flex-1 bg-[#111a22] border border-[#324d67] text-white font-black rounded-xl p-4 placeholder-slate-600 focus:border-primary outline-none text-center tracking-widest text-2xl font-mono uppercase" placeholder="QR O CÓDIGO">
                        <button id="btn-validate" class="bg-primary hover:bg-blue-600 text-white font-bold px-6 rounded-xl transition-all shadow-lg">
                            <span class="material-symbols-outlined">search</span>
                        </button>
                     </div>
                </div>

                <div id="result-area" class="bg-[#1c2127] rounded-3xl p-8 border border-[#324d67] flex flex-col items-center justify-center text-center shadow-2xl h-full min-h-[350px] relative overflow-hidden">
                    <div class="size-28 rounded-full bg-[#111a22] border-4 border-[#233648] flex items-center justify-center mb-6 shadow-inner">
                        <span class="material-symbols-outlined text-7xl text-slate-700">document_scanner</span>
                    </div>
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Esperando Lectura</h3>
                    <p class="text-[#92adc9] text-sm max-w-xs mx-auto">Escanee el <b>QR permanente de la unidad</b> o ingrese el código de 5 letras del conductor.</p>
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
            if(val && !this.isProcessing) {
                this.isProcessing = true;
                this.handleScan(val);
            }
        };
    }

    async handleScan(code) {
        const area = document.getElementById('result-area');
        const rawCode = code.trim();
        const upperCode = rawCode.toUpperCase();

        area.innerHTML = `
            <div class="flex flex-col items-center animate-pulse">
                <div class="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p class="text-primary font-black uppercase text-sm tracking-[4px]">Verificando Accesos...</p>
            </div>`;

        try {
            let trip = null;

            // 1. ¿ES EL QR FÍSICO DE LA UNIDAD? (Validación de formato UUID)
            const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawCode);
            
            if (isUUID) {
                // Buscamos si la unidad (o el conductor) escaneada tiene un viaje activo
                const { data } = await supabase
                    .from('trips')
                    .select('*, profiles:driver_id(*), vehicles:vehicle_id(*)')
                    .or(`vehicle_id.eq.${rawCode},driver_id.eq.${rawCode},id.eq.${rawCode}`)
                    .neq('status', 'closed')
                    .maybeSingle();
                trip = data;
            } 
            // 2. ¿ES EL CÓDIGO DE EMERGENCIA DEL TALLER? (6 Dígitos)
            else if (/^\d{6}$/.test(rawCode)) {
                const { data } = await supabase.from('trips').select('*, profiles:driver_id(*), vehicles:vehicle_id(*)').eq('emergency_code', rawCode).neq('status', 'closed').maybeSingle();
                trip = data;
            } 
            // 3. ¿ES EL CÓDIGO ALFANUMÉRICO DEL CONDUCTOR? (5 Letras/Números)
            else if (/^[A-Z0-9]{5}$/.test(upperCode)) {
                const { data } = await supabase.from('trips').select('*, profiles:driver_id(*), vehicles:vehicle_id(*)').eq('access_code', upperCode).neq('status', 'closed').maybeSingle();
                trip = data;
            } 
            // 4. ESCRITURA MANUAL (Busca por Placa o Número Económico de la unidad)
            else {
                const { data: vehicle } = await supabase.from('vehicles').select('id').or(`plate.eq.${upperCode},economic_number.eq.${upperCode}`).maybeSingle();
                if (vehicle) {
                    const { data } = await supabase.from('trips').select('*, profiles:driver_id(*), vehicles:vehicle_id(*)').eq('vehicle_id', vehicle.id).neq('status', 'closed').maybeSingle();
                    trip = data;
                }
            }

            // Si después de la búsqueda inteligente no se encontró nada:
            if (!trip) throw new Error("LA UNIDAD NO TIENE UN PASE ACTIVO");

            this.renderDriverProfile(trip);

        } catch (e) {
            this.renderError(e.message);
        } finally {
            this.isProcessing = false;
            document.getElementById('scan-input').value = ""; // Limpia el input
        }
    }

    renderDriverProfile(trip) {
        // ¿Está saliendo de base o regresando de ruta?
        const isEntry = trip.status === 'in_progress';
        
        // Colores según dirección
        const statusColor = isEntry ? 'text-blue-400' : 'text-emerald-400';
        const borderColor = isEntry ? 'border-blue-500' : 'border-emerald-500';

        // Evitar fallos si faltan datos del perfil
        const photoUrl = trip.profiles?.photo_url || '';
        const employeeId = trip.profiles?.employee_id || '---';

        document.getElementById('result-area').innerHTML = `
            <div class="w-full h-full flex flex-col animate-fade-in">
                
                <div class="flex items-center justify-between mb-8">
                    <div class="text-left">
                        <span class="bg-white/10 text-white text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest">Pase Confirmado</span>
                        <h2 class="text-3xl font-black text-white mt-2 uppercase tracking-tighter">${isEntry ? 'RETORNO' : 'SALIDA AUTORIZADA'}</h2>
                    </div>
                    <span class="material-symbols-outlined text-5xl ${statusColor}">verified</span>
                </div>

                <div class="bg-[#111a22] border-2 ${borderColor} rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div class="flex items-center gap-6 relative z-10">
                        <div class="size-24 rounded-2xl bg-slate-700 bg-cover bg-center border-2 border-white/20 shadow-lg" 
                             style="background-image: url('${photoUrl}')"></div>
                        <div class="text-left flex-1">
                            <p class="text-[#92adc9] text-[10px] font-black uppercase tracking-widest">Operador Asignado</p>
                            <h3 class="text-white text-xl font-bold leading-tight">${trip.profiles?.full_name || 'Desconocido'}</h3>
                            <p class="text-primary font-mono text-sm mt-1">ID: ${employeeId}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                        <div class="text-left">
                            <p class="text-[#92adc9] text-[9px] font-black uppercase">Unidad Escaneada</p>
                            <p class="text-white font-bold text-lg leading-none mt-1">ECO-${trip.vehicles?.economic_number}</p>
                        </div>
                        <div class="text-left">
                            <p class="text-[#92adc9] text-[9px] font-black uppercase">Placas</p>
                            <p class="text-white font-mono font-bold text-lg leading-none mt-1">${trip.vehicles?.plate}</p>
                        </div>
                    </div>
                </div>

                <div class="mt-auto pt-8">
                    <button id="btn-gate-action" class="w-full py-5 rounded-2xl font-black text-xl bg-white text-black shadow-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest">
                        REGISTRAR ${isEntry ? 'ENTRADA DE UNIDAD' : 'SALIDA DE UNIDAD'}
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
                    <span class="material-symbols-outlined text-7xl text-red-500 mb-4">gpp_bad</span>
                    <h2 class="text-4xl font-black text-red-500 uppercase mb-2 leading-none">DENEGADO</h2>
                    <p class="text-white text-sm uppercase font-bold tracking-widest">${msg}</p>
                </div>
                <button onclick="window.location.reload()" class="w-full py-4 rounded-2xl font-black text-lg bg-[#233648] text-white border border-[#324d67]">VOLVER A ESCANEAR</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    async executeGateRegistration(trip) {
        const btn = document.getElementById('btn-gate-action');
        btn.innerText = "ESPERE..."; btn.disabled = true;

        const isExit = trip.status !== 'in_progress';
        
        const { error } = await supabase
            .from('trips')
            .update({ 
                status: isExit ? 'in_progress' : 'arrived', 
                [isExit ? 'exit_gate_time' : 'entry_gate_time']: new Date().toISOString()
            })
            .eq('id', trip.id);

        if (error) {
            alert("Error al conectar con Central: " + error.message);
            btn.disabled = false;
        } else {
            this.showFinalSuccess(isExit ? "SALIDA REGISTRADA" : "ENTRADA REGISTRADA");
        }
    }

    showFinalSuccess(msg) {
        document.getElementById('result-area').innerHTML = `
            <div class="flex flex-col items-center animate-fade-in">
                <div class="size-32 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] mb-6">
                    <span class="material-symbols-outlined text-7xl animate-bounce">check_circle</span>
                </div>
                <h2 class="text-3xl font-black text-white uppercase tracking-tighter">${msg}</h2>
                <p class="text-emerald-400 font-bold uppercase tracking-widest mt-2">Barrera Operativa Libre</p>
                <button onclick="window.location.reload()" class="mt-10 bg-[#233648] text-white px-8 py-3 rounded-xl font-bold uppercase text-xs">Atender Siguiente</button>
            </div>
        `;
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
