import { supabase } from '../../config/supabaseClient.js';

export class AssignmentsView {
    constructor() {
        this.currentRequest = null;
        window.assignmentsView = this;
    }
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in relative pb-20">
            <div class="flex justify-between items-center border-b border-[#324d67] pb-4">
                <h1 class="text-xl font-black text-white">Centro de Control</h1>
                <button onclick="window.location.reload()" class="p-2 bg-[#1c2127] rounded text-slate-400"><span class="material-symbols-outlined">refresh</span></button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
                <!-- SOLICITUDES PENDIENTES (requested) -->
                <div class="bg-[#1c2127] rounded-xl border border-yellow-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-yellow-500/5 flex justify-between items-center">
                        <h3 class="font-bold text-yellow-500 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">pending_actions</span> Solicitudes Pendientes
                        </h3>
                        <span id="requests-count" class="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full">0</span>
                    </div>
                    <div id="list-requests" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                        <p class="text-slate-500 text-center text-xs">Cargando...</p>
                    </div>
                </div>

                <!-- EN TALLER - RECEPCIÓN INICIAL (approved_for_taller) -->
                <div class="bg-[#1c2127] rounded-xl border border-orange-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-orange-500/5 flex justify-between items-center">
                        <h3 class="font-bold text-orange-500 flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">engineering</span> En Taller (Recepción)
                        </h3>
                        <span id="taller-count" class="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded-full">0</span>
                    </div>
                    <div id="list-taller" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
                        <p class="text-slate-500 text-center text-xs">Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- MODAL DE REVISIÓN DE SOLICITUD -->
            <div id="modal-review" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
                <div class="bg-[#1c2127] w-full max-w-2xl rounded-2xl border border-[#324d67] shadow-2xl animate-fade-in-up overflow-hidden">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23] sticky top-0 flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold text-white">Revisar Solicitud</h3>
                            <p class="text-sm text-[#92adc9]" id="review-subtitle">Conductor: --</p>
                        </div>
                        <button onclick="document.getElementById('modal-review').classList.add('hidden')" class="text-slate-400 hover:text-white">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <!-- Datos de la solicitud -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Detalles de la Solicitud</h4>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span class="text-[#92adc9]">Conductor:</span>
                                    <p class="text-white font-bold" id="review-driver"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Unidad solicitada:</span>
                                    <p class="text-white font-bold" id="review-vehicle"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Destino:</span>
                                    <p class="text-white" id="review-destination"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Motivo:</span>
                                    <p class="text-white" id="review-motivo"></p>
                                </div>
                                <div class="col-span-2">
                                    <span class="text-[#92adc9]">Encargado de área:</span>
                                    <p class="text-white font-bold" id="review-supervisor"></p>
                                </div>
                            </div>
                        </div>

                        <!-- Último checklist del vehículo (historial) -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Último checklist de la unidad</h4>
                            <div id="last-checklist-info" class="text-sm text-white">
                                Cargando...
                            </div>
                        </div>
                    </div>

                    <div class="p-6 border-t border-[#324d67] bg-[#151b23] sticky bottom-0 flex gap-3">
                        <button id="btn-reject-review" class="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                            RECHAZAR
                        </button>
                        <button id="btn-approve-review" class="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-400 transition-colors shadow-lg flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">engineering</span> ENVIAR A TALLER
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODAL DE INCIDENCIAS (para cuando taller rechaza) -->
            <div id="modal-incident" class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl animate-fade-in-up overflow-hidden">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                        <h3 class="text-xl font-bold text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-red-500">warning</span> Registrar Incidencia
                        </h3>
                    </div>
                    
                    <div class="p-6 space-y-4">
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <p class="text-sm text-white mb-2" id="incident-vehicle-info"></p>
                            <textarea id="incident-description" rows="4" 
                                      class="w-full bg-[#0d141c] border border-[#324d67] text-white p-3 rounded-lg text-sm"
                                      placeholder="Describe el problema encontrado..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Responsable</label>
                            <select id="incident-responsible" class="w-full bg-[#111a22] border border-[#324d67] text-white p-3 rounded-lg">
                                <option value="unidad">Falla de la unidad</option>
                                <option value="conductor">Responsabilidad del conductor</option>
                                <option value="externo">Causa externa</option>
                            </select>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" 
                                    class="flex-1 py-3 bg-[#233648] text-white rounded-lg">
                                Cancelar
                            </button>
                            <button onclick="window.assignmentsView.saveIncident()" 
                                    class="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold">
                                GUARDAR INCIDENCIA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadData();
        // Actualizar cada 10 segundos
        setInterval(() => this.loadData(), 10000);
    }

    async loadData() {
        await Promise.all([
            this.loadRequests(),
            this.loadTallerReceptions()
        ]);
    }

    async loadRequests() {
        const { data: requests } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at,
                request_details,
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('status', 'requested')
            .order('created_at', { ascending: false });

        const reqList = document.getElementById('list-requests');
        document.getElementById('requests-count').innerText = requests?.length || 0;
        
        if(!requests?.length) {
            reqList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin solicitudes pendientes</p>';
        } else {
            reqList.innerHTML = requests.map(r => {
                const details = r.request_details || {};
                return `
                <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center" style="background-image: url('${r.driver.photo_url || ''}')"></div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm">${r.driver.full_name}</p>
                            <p class="text-[10px] text-[#92adc9]">${new Date(r.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div class="bg-[#111a22] p-3 rounded-lg space-y-2 text-xs">
                        <p><span class="text-[#92adc9]">Unidad:</span> <span class="text-white font-bold">ECO-${r.vehicles?.economic_number}</span></p>
                        <p><span class="text-[#92adc9]">Destino:</span> <span class="text-white">${details.destination || 'No especificado'}</span></p>
                        <p><span class="text-[#92adc9]">Motivo:</span> <span class="text-white">${details.motivo || 'No especificado'}</span></p>
                        <p><span class="text-[#92adc9]">Encargado:</span> <span class="text-white">${details.supervisor || 'No especificado'}</span></p>
                    </div>
                    
                    <button onclick="window.assignmentsView.openRequest('${r.id}')" 
                            class="w-full mt-3 bg-primary/20 text-primary hover:bg-primary hover:text-white py-2 rounded-lg text-xs font-bold transition-all">
                        REVISAR SOLICITUD
                    </button>
                </div>
            `}).join('');
        }
    }

    async loadTallerReceptions() {
        const { data: trips } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at,
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('status', 'approved_for_taller')
            .order('created_at', { ascending: false });

        const tallerList = document.getElementById('list-taller');
        document.getElementById('taller-count').innerText = trips?.length || 0;
        
        if(!trips?.length) {
            tallerList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin vehículos en recepción</p>';
        } else {
            tallerList.innerHTML = trips.map(t => `
                <div class="bg-[#151b23] p-4 rounded-lg border border-orange-500/30 hover:border-orange-500 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center" style="background-image: url('${t.driver.photo_url || ''}')"></div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm">${t.driver.full_name}</p>
                            <p class="text-[10px] text-orange-400">ECO-${t.vehicles?.economic_number} · ${t.vehicles?.plate}</p>
                        </div>
                    </div>
                    <p class="text-xs text-[#92adc9] mt-2">Esperando recepción en taller</p>
                </div>
            `).join('');
        }
    }

    async openRequest(tripId) {
        const { data: trip } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at,
                request_details,
                vehicle_id,
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('id', tripId)
            .single();

        if(!trip) return;

        this.currentRequest = trip;
        const details = trip.request_details || {};

        document.getElementById('review-subtitle').innerText = `Conductor: ${trip.driver.full_name}`;
        document.getElementById('review-driver').innerText = trip.driver.full_name;
        document.getElementById('review-vehicle').innerText = `ECO-${trip.vehicles?.economic_number} ${trip.vehicles?.plate}`;
        document.getElementById('review-destination').innerText = details.destination || 'No especificado';
        document.getElementById('review-motivo').innerText = details.motivo || 'No especificado';
        document.getElementById('review-supervisor').innerText = details.supervisor || 'No especificado';

        // Cargar último checklist de la unidad
        await this.loadLastChecklist(trip.vehicle_id);

        document.getElementById('btn-approve-review').onclick = () => this.approveRequest(tripId);
        document.getElementById('btn-reject-review').onclick = () => this.rejectRequest(tripId);

        document.getElementById('modal-review').classList.remove('hidden');
    }

    async loadLastChecklist(vehicleId) {
        const { data: lastTrip } = await supabase
            .from('trips')
            .select('workshop_checklist, completed_at')
            .eq('vehicle_id', vehicleId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        const container = document.getElementById('last-checklist-info');
        
        if (!lastTrip?.workshop_checklist) {
            container.innerHTML = '<p class="text-slate-400 text-sm">No hay checklist previo para esta unidad</p>';
            return;
        }

        const check = lastTrip.workshop_checklist;
        container.innerHTML = `
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                    <span class="text-green-400 text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">${check.liquid ? 'check_circle' : 'cancel'}</span> Líquido
                    </span>
                    <span class="text-green-400 text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">${check.oil ? 'check_circle' : 'cancel'}</span> Aceite
                    </span>
                    <span class="text-green-400 text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">${check.coolant ? 'check_circle' : 'cancel'}</span> Anticongelante
                    </span>
                    <span class="text-green-400 text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">${check.lights ? 'check_circle' : 'cancel'}</span> Luces
                    </span>
                    <span class="text-green-400 text-xs flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">${check.tires ? 'check_circle' : 'cancel'}</span> Llantas
                    </span>
                </div>
                <p class="text-[10px] text-[#92adc9] mt-2">Fecha: ${new Date(lastTrip.completed_at).toLocaleDateString()}</p>
            </div>
        `;
    }

    async approveRequest(tripId) {
        const btn = document.getElementById('btn-approve-review');
        btn.innerHTML = 'PROCESANDO...';
        btn.disabled = true;

        const { error } = await supabase
            .from('trips')
            .update({ 
                status: 'approved_for_taller',
                approved_at: new Date().toISOString()
            })
            .eq('id', tripId);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Solicitud aprobada. El conductor debe acudir a taller.');
            document.getElementById('modal-review').classList.add('hidden');
            this.loadData();
        }
    }

    async rejectRequest(tripId) {
        if (!confirm('¿Rechazar esta solicitud?')) return;

        const { error } = await supabase
            .from('trips')
            .update({ 
                status: 'rejected',
                rejected_at: new Date().toISOString()
            })
            .eq('id', tripId);

        if (!error) {
            alert('❌ Solicitud rechazada');
            document.getElementById('modal-review').classList.add('hidden');
            this.loadData();
        }
    }
}
