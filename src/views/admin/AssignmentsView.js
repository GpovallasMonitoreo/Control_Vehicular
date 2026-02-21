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
                <button onclick="window.assignmentsView.loadData()" class="p-2 bg-[#1c2127] rounded text-slate-400 hover:text-white transition-colors">
                    <span class="material-symbols-outlined">refresh</span>
                </button>
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
        try {
            const { data: requests, error } = await supabase
                .from('trips')
                .select(`
                    id, 
                    created_at,
                    destination,
                    motivo,
                    supervisor,
                    vehicles:economico!trips_vehicle_id_fkey(
                        economic_number, 
                        model, 
                        plate
                    ),
                    driver:profiles!trips_driver_id_fkey(
                        full_name, 
                        photo_url
                    )
                `)
                .eq('status', 'requested')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const reqList = document.getElementById('list-requests');
            const countSpan = document.getElementById('requests-count');
            
            if (countSpan) countSpan.innerText = requests?.length || 0;
            
            if (!requests || requests.length === 0) {
                if (reqList) reqList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin solicitudes pendientes</p>';
                return;
            }

            if (reqList) {
                reqList.innerHTML = requests.map(r => {
                    const eco = r.vehicles?.economic_number || 'Sin Asignar';
                    return `
                    <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center" 
                                 style="background-image: url('${r.driver?.photo_url || ''}')"></div>
                            <div class="flex-1">
                                <p class="text-white font-bold text-sm">${r.driver?.full_name || 'Desconocido'}</p>
                                <p class="text-[10px] text-[#92adc9]">${new Date(r.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div class="bg-[#111a22] p-3 rounded-lg space-y-2 text-xs">
                            <p><span class="text-[#92adc9]">Unidad:</span> 
                               <span class="text-white font-bold">ECO-${eco}</span></p>
                            <p><span class="text-[#92adc9]">Destino:</span> 
                               <span class="text-white">${r.destination || 'No especificado'}</span></p>
                            <p><span class="text-[#92adc9]">Motivo:</span> 
                               <span class="text-white">${r.motivo || 'No especificado'}</span></p>
                            <p><span class="text-[#92adc9]">Encargado:</span> 
                               <span class="text-white">${r.supervisor || 'No especificado'}</span></p>
                        </div>
                        
                        <button onclick="window.assignmentsView.openRequest('${r.id}')" 
                                class="w-full mt-3 bg-primary/20 text-primary hover:bg-primary hover:text-white py-2 rounded-lg text-xs font-bold transition-all">
                            REVISAR SOLICITUD
                        </button>
                    </div>
                `}).join('');
            }
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
            const reqList = document.getElementById('list-requests');
            if (reqList) {
                reqList.innerHTML = '<p class="text-red-500 text-center text-xs">Error al cargar solicitudes</p>';
            }
        }
    }

    async loadTallerReceptions() {
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select(`
                    id, 
                    created_at,
                    vehicles:economico!trips_vehicle_id_fkey(
                        economic_number, 
                        plate
                    ),
                    driver:profiles!trips_driver_id_fkey(
                        full_name, 
                        photo_url
                    )
                `)
                .eq('status', 'approved_for_taller')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tallerList = document.getElementById('list-taller');
            const countSpan = document.getElementById('taller-count');
            
            if (countSpan) countSpan.innerText = trips?.length || 0;
            
            if (!trips || trips.length === 0) {
                if (tallerList) tallerList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin vehículos en recepción</p>';
                return;
            }

            if (tallerList) {
                tallerList.innerHTML = trips.map(t => `
                    <div class="bg-[#151b23] p-4 rounded-lg border border-orange-500/30 hover:border-orange-500 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center" 
                                 style="background-image: url('${t.driver?.photo_url || ''}')"></div>
                            <div class="flex-1">
                                <p class="text-white font-bold text-sm">${t.driver?.full_name || 'Desconocido'}</p>
                                <p class="text-[10px] text-orange-400">ECO-${t.vehicles?.economic_number || '??'} · ${t.vehicles?.plate || ''}</p>
                            </div>
                        </div>
                        <p class="text-xs text-[#92adc9] mt-2">Esperando recepción en taller</p>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error cargando recepciones:', error);
            const tallerList = document.getElementById('list-taller');
            if (tallerList) {
                tallerList.innerHTML = '<p class="text-red-500 text-center text-xs">Error al cargar</p>';
            }
        }
    }

    async openRequest(tripId) {
        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .select(`
                    id, 
                    created_at,
                    destination,
                    motivo,
                    supervisor,
                    vehicle_id,
                    vehicles:economico!trips_vehicle_id_fkey(
                        economic_number, 
                        model, 
                        plate
                    ), 
                    driver:profiles!trips_driver_id_fkey(
                        full_name, 
                        photo_url
                    )
                `)
                .eq('id', tripId)
                .single();

            if (error) throw error;
            if (!trip) return;

            this.currentRequest = trip;

            const subtitle = document.getElementById('review-subtitle');
            const driverEl = document.getElementById('review-driver');
            const vehicleEl = document.getElementById('review-vehicle');
            const destEl = document.getElementById('review-destination');
            const motivoEl = document.getElementById('review-motivo');
            const supEl = document.getElementById('review-supervisor');

            if (subtitle) subtitle.innerText = `Conductor: ${trip.driver?.full_name || 'Desconocido'}`;
            if (driverEl) driverEl.innerText = trip.driver?.full_name || 'Desconocido';
            if (vehicleEl) vehicleEl.innerText = `ECO-${trip.vehicles?.economic_number || '??'} ${trip.vehicles?.plate || ''}`;
            if (destEl) destEl.innerText = trip.destination || 'No especificado';
            if (motivoEl) motivoEl.innerText = trip.motivo || 'No especificado';
            if (supEl) supEl.innerText = trip.supervisor || 'No especificado';

            // Cargar último checklist de la unidad
            await this.loadLastChecklist(trip.vehicle_id);

            const approveBtn = document.getElementById('btn-approve-review');
            const rejectBtn = document.getElementById('btn-reject-review');
            
            if (approveBtn) approveBtn.onclick = () => this.approveRequest(tripId);
            if (rejectBtn) rejectBtn.onclick = () => this.rejectRequest(tripId);

            const modal = document.getElementById('modal-review');
            if (modal) modal.classList.remove('hidden');

        } catch (error) {
            console.error('Error abriendo solicitud:', error);
            alert('Error al cargar los datos de la solicitud');
        }
    }

    async loadLastChecklist(vehicleId) {
        const container = document.getElementById('last-checklist-info');
        if (!container) return;

        try {
            const { data: lastTrip, error } = await supabase
                .from('trips')
                .select('workshop_checklist, completed_at')
                .eq('vehicle_id', vehicleId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            
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
                    <p class="text-[10px] text-[#92adc9] mt-2">Fecha: ${lastTrip.completed_at ? new Date(lastTrip.completed_at).toLocaleDateString() : 'N/A'}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando checklist:', error);
            container.innerHTML = '<p class="text-red-400 text-sm">Error al cargar checklist</p>';
        }
    }

    async approveRequest(tripId) {
        const btn = document.getElementById('btn-approve-review');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = 'PROCESANDO...';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('trips')
                .update({ 
                    status: 'approved_for_taller',
                    approved_at: new Date().toISOString()
                })
                .eq('id', tripId);

            if (error) throw error;

            alert('✅ Solicitud aprobada. El conductor debe acudir a taller.');
            
            const modal = document.getElementById('modal-review');
            if (modal) modal.classList.add('hidden');
            
            this.loadData();

        } catch (error) {
            console.error('Error aprobando:', error);
            alert('Error: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async rejectRequest(tripId) {
        if (!confirm('¿Rechazar esta solicitud?')) return;

        const btn = document.getElementById('btn-reject-review');
        if (!btn) return;
        
        const originalText = btn.innerHTML;
        btn.innerHTML = 'RECHAZANDO...';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('trips')
                .update({ 
                    status: 'rejected',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', tripId);

            if (error) throw error;

            alert('❌ Solicitud rechazada');
            
            const modal = document.getElementById('modal-review');
            if (modal) modal.classList.add('hidden');
            
            this.loadData();

        } catch (error) {
            console.error('Error rechazando:', error);
            alert('Error: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}
