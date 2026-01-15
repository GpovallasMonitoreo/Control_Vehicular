import { supabase } from '../../config/supabaseClient.js';

export class AssignmentsView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in relative pb-20">
            <div class="flex justify-between items-center border-b border-[#324d67] pb-4">
                <h1 class="text-xl font-black text-white">Centro de Control</h1>
                <button onclick="window.location.reload()" class="p-2 bg-[#1c2127] rounded text-slate-400"><span class="material-symbols-outlined">refresh</span></button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
                <div class="bg-[#1c2127] rounded-xl border border-yellow-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-yellow-500/5"><h3 class="font-bold text-yellow-500">Solicitudes Pendientes</h3></div>
                    <div id="list-requests" class="flex-1 overflow-y-auto p-4 space-y-3"><p class="text-slate-500 text-center text-xs">Cargando...</p></div>
                </div>
                <div class="bg-[#1c2127] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-blue-500/5"><h3 class="font-bold text-blue-500">Viajes Activos</h3></div>
                    <div id="list-trips" class="flex-1 overflow-y-auto p-4 space-y-3"><p class="text-slate-500 text-center text-xs">Cargando...</p></div>
                </div>
            </div>

            <div id="modal-review" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] shadow-2xl animate-fade-in-up overflow-hidden">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                        <h3 class="text-xl font-bold text-white">Analizar Solicitud</h3>
                        <p class="text-sm text-[#92adc9]" id="review-subtitle">Conductor: --</p>
                    </div>
                    
                    <div class="p-6 space-y-4">
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <p class="text-[10px] font-bold text-[#92adc9] uppercase mb-3">Respuestas del Cuestionario</p>
                            <ul id="review-answers" class="space-y-2 text-sm text-white">
                                </ul>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button id="btn-reject-review" class="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">Rechazar</button>
                            <button id="btn-approve-review" class="flex-1 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg">APROBAR SOLICITUD</button>
                        </div>
                    </div>
                    <div class="bg-[#111a22] p-3 text-center border-t border-[#324d67]">
                        <button onclick="document.getElementById('modal-review').classList.add('hidden')" class="text-xs text-slate-500 hover:text-white underline">Cancelar revisión</button>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    async onMount() {
        await this.loadData();
        
        window.openReview = async (tripId) => {
            const { data: trip } = await supabase.from('trips')
                .select(`id, driver:profiles!trips_driver_id_fkey(full_name), request_details`)
                .eq('id', tripId).single();

            if(!trip) return alert("Error cargando datos");

            const modal = document.getElementById('modal-review');
            document.getElementById('review-subtitle').innerText = `Conductor: ${trip.driver.full_name}`;
            
            const answers = trip.request_details || {};
            const list = document.getElementById('review-answers');
            list.innerHTML = `
                <li class="flex items-center gap-2"><span class="text-green-500 material-symbols-outlined text-lg">${answers.license ? 'check_circle' : 'cancel'}</span> Licencia Vigente</li>
                <li class="flex items-center gap-2"><span class="text-green-500 material-symbols-outlined text-lg">${answers.uniform ? 'check_circle' : 'cancel'}</span> Uniforme Completo</li>
                <li class="flex items-center gap-2"><span class="text-green-500 material-symbols-outlined text-lg">${answers.health ? 'check_circle' : 'cancel'}</span> Salud Óptima</li>
                <li class="flex items-center gap-2"><span class="text-green-500 material-symbols-outlined text-lg">${answers.photos_start ? 'check_circle' : 'cancel'}</span> Fotos Iniciales</li>
                <li class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">Enviado: ${new Date(trip.request_details?.timestamp || Date.now()).toLocaleTimeString()}</li>
            `;

            document.getElementById('btn-approve-review').onclick = () => this.processDecision(tripId, 'approve');
            document.getElementById('btn-reject-review').onclick = () => this.processDecision(tripId, 'reject');

            modal.classList.remove('hidden');
        };
    }

    async processDecision(tripId, decision) {
        const modal = document.getElementById('modal-review');
        
        if (decision === 'approve') {
            const { error } = await supabase.from('trips').update({ status: 'approved' }).eq('id', tripId);
            if (!error) alert("✅ Solicitud Aprobada");
        } else {
            const { error } = await supabase.from('trips').delete().eq('id', tripId); 
            // Opcional: Liberar el vehículo
            // await supabase.from('vehicles').update({ status: 'available' })...
            if (!error) alert("❌ Solicitud Rechazada");
        }
        
        modal.classList.add('hidden');
        this.loadData();
    }

    async loadData() {
        // CORRECCIÓN: Aseguramos traer 'economic_number' en el join de vehicles
        const { data: requests } = await supabase.from('trips')
            .select(`
                id, 
                created_at, 
                vehicles(economic_number, model), 
                driver:profiles!trips_driver_id_fkey(full_name)
            `)
            .eq('status', 'requested')
            .order('created_at', {ascending:false});

        const { data: trips } = await supabase.from('trips')
            .select(`
                id, 
                vehicles(economic_number), 
                driver:profiles!trips_driver_id_fkey(full_name)
            `)
            .eq('status', 'open');

        const reqList = document.getElementById('list-requests');
        
        if(!requests?.length) {
            reqList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin pendientes</p>';
        } else {
            reqList.innerHTML = requests.map(r => {
                // Validación de seguridad por si vehicles viene null
                const eco = r.vehicles ? r.vehicles.economic_number : 'Sin Asignar';
                return `
                <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 flex justify-between items-center group hover:border-yellow-500/50 transition-colors">
                    <div>
                        <p class="text-white font-bold text-sm">${r.driver.full_name}</p>
                        <p class="text-[#92adc9] text-xs">Solicita Unidad: <span class="text-yellow-400 font-bold">${eco}</span></p>
                    </div>
                    <button onclick="window.openReview('${r.id}')" class="bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">
                        ANALIZAR
                    </button>
                </div>
            `}).join('');
        }

        const tripList = document.getElementById('list-trips');
        if(!trips?.length) {
            tripList.innerHTML = '<p class="text-slate-500 text-center text-xs">Nadie en ruta</p>';
        } else {
            tripList.innerHTML = trips.map(t => {
                const eco = t.vehicles ? t.vehicles.economic_number : '??';
                return `<div class="p-3 border border-slate-700 rounded text-sm text-white flex justify-between">
                    <span>${t.driver.full_name}</span>
                    <span class="text-primary font-bold">${eco}</span>
                </div>`
            }).join('');
        }
    }
}