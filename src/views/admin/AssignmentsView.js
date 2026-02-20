import { supabase } from '../../config/supabaseClient.js';

export class AssignmentsView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in relative pb-20">
            <div class="flex justify-between items-center border-b border-[#324d67] pb-4">
                <h1 class="text-xl font-black text-white">Centro de Control</h1>
                <button onclick="window.location.reload()" class="p-2 bg-[#1c2127] rounded text-slate-400"><span class="material-symbols-outlined">refresh</span></button>
            </div>

            <!-- Pestañas de navegación -->
            <div class="flex border-b border-[#324d67]">
                <button onclick="window.assignmentsView.switchTab('pendientes')" id="tab-pendientes" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors">Pendientes</button>
                <button onclick="window.assignmentsView.switchTab('pretrip')" id="tab-pretrip" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Pre-Viaje</button>
                <button onclick="window.assignmentsView.switchTab('activos')" id="tab-activos" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Activos</button>
            </div>

            <!-- Panel de Solicitudes Pendientes (status: 'requested') -->
            <div id="panel-pendientes" class="space-y-4">
                <div class="bg-[#1c2127] rounded-xl border border-yellow-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-yellow-500/5 flex justify-between items-center">
                        <h3 class="font-bold text-yellow-500">Solicitudes de Unidad</h3>
                        <span class="text-xs text-[#92adc9]" id="pendientes-count">0</span>
                    </div>
                    <div id="list-requests" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                        <p class="text-slate-500 text-center text-xs">Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- Panel de Checklists Pre-Viaje (status: 'pretrip_completed') -->
            <div id="panel-pretrip" class="hidden space-y-4">
                <div class="bg-[#1c2127] rounded-xl border border-orange-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-orange-500/5 flex justify-between items-center">
                        <h3 class="font-bold text-orange-500">Checklists Pre-Viaje Completados</h3>
                        <span class="text-xs text-[#92adc9]" id="pretrip-count">0</span>
                    </div>
                    <div id="list-pretrip" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                        <p class="text-slate-500 text-center text-xs">Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- Panel de Viajes Activos (status: 'in_progress') -->
            <div id="panel-activos" class="hidden space-y-4">
                <div class="bg-[#1c2127] rounded-xl border border-blue-500/30 overflow-hidden flex flex-col">
                    <div class="p-4 border-b border-slate-800 bg-blue-500/5 flex justify-between items-center">
                        <h3 class="font-bold text-blue-500">Viajes en Curso</h3>
                        <span class="text-xs text-[#92adc9]" id="activos-count">0</span>
                    </div>
                    <div id="list-trips" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                        <p class="text-slate-500 text-center text-xs">Cargando...</p>
                    </div>
                </div>
            </div>

            <!-- MODAL DE REVISIÓN DE CHECKLIST PRE-VIAJE -->
            <div id="modal-review" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
                <div class="bg-[#1c2127] w-full max-w-2xl rounded-2xl border border-[#324d67] shadow-2xl animate-fade-in-up overflow-hidden">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23] sticky top-0">
                        <h3 class="text-xl font-bold text-white">Revisar Checklist Pre-Viaje</h3>
                        <p class="text-sm text-[#92adc9]" id="review-subtitle">Conductor: --</p>
                    </div>
                    
                    <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <!-- Datos del conductor y unidad -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Información General</h4>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span class="text-[#92adc9]">Conductor:</span>
                                    <p class="text-white font-bold" id="review-driver"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Unidad:</span>
                                    <p class="text-white font-bold" id="review-vehicle"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Fecha:</span>
                                    <p class="text-white" id="review-date"></p>
                                </div>
                                <div>
                                    <span class="text-[#92adc9]">Hora:</span>
                                    <p class="text-white" id="review-time"></p>
                                </div>
                            </div>
                        </div>

                        <!-- Checklist de items -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Items Verificados</h4>
                            <div id="review-items" class="grid grid-cols-2 gap-3">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>

                        <!-- Fotos del pre-viaje -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-3">Fotos de la Unidad</h4>
                            <div id="review-photos" class="grid grid-cols-3 gap-3">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </div>

                    <div class="p-6 border-t border-[#324d67] bg-[#151b23] sticky bottom-0 flex gap-3">
                        <button id="btn-reject-review" class="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                            RECHAZAR
                        </button>
                        <button id="btn-approve-review" class="flex-1 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors shadow-lg">
                            APROBAR Y ENVIAR A GUARDIA
                        </button>
                    </div>
                    <div class="bg-[#111a22] p-3 text-center">
                        <button onclick="document.getElementById('modal-review').classList.add('hidden')" class="text-xs text-slate-500 hover:text-white underline">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            <!-- MODAL DE DETALLE DE VIAJE ACTIVO -->
            <div id="modal-trip-detail" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] shadow-2xl animate-fade-in-up overflow-hidden">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                        <h3 class="text-xl font-bold text-white">Detalle del Viaje</h3>
                    </div>
                    
                    <div class="p-6 space-y-4">
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                            <div class="flex items-center gap-3 mb-3">
                                <div id="trip-driver-avatar" class="w-12 h-12 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary"></div>
                                <div>
                                    <p class="text-white font-bold" id="trip-driver-name"></p>
                                    <p class="text-[#92adc9] text-xs" id="trip-vehicle-info"></p>
                                </div>
                            </div>
                            
                            <div class="space-y-2 text-sm border-t border-[#324d67] pt-3">
                                <div class="flex justify-between">
                                    <span class="text-[#92adc9]">Inicio:</span>
                                    <span class="text-white" id="trip-start-time"></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#92adc9]">Km salida:</span>
                                    <span class="text-white font-mono" id="trip-exit-km"></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#92adc9]">Km actuales:</span>
                                    <span class="text-white font-mono text-primary" id="trip-current-km"></span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-[#92adc9]">Duración:</span>
                                    <span class="text-white" id="trip-duration"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#111a22] p-3 text-center border-t border-[#324d67]">
                        <button onclick="document.getElementById('modal-trip-detail').classList.add('hidden')" class="text-xs text-slate-500 hover:text-white underline">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        window.assignmentsView = this;
        await this.loadData();
        
        // Actualizar cada 30 segundos
        setInterval(() => this.loadData(), 30000);
    }

    switchTab(tab) {
        // Ocultar todos los paneles
        document.getElementById('panel-pendientes').classList.add('hidden');
        document.getElementById('panel-pretrip').classList.add('hidden');
        document.getElementById('panel-activos').classList.add('hidden');
        
        // Quitar estilos activos de todas las pestañas
        document.getElementById('tab-pendientes').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
        document.getElementById('tab-pretrip').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
        document.getElementById('tab-activos').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
        
        // Activar panel y pestaña seleccionada
        document.getElementById(`panel-${tab}`).classList.remove('hidden');
        document.getElementById(`tab-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors";
    }

    async loadData() {
        await Promise.all([
            this.loadRequests(),
            this.loadPreTripChecklists(),
            this.loadActiveTrips()
        ]);
    }

    async loadRequests() {
        const { data: requests } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at, 
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('status', 'requested')
            .order('created_at', { ascending: false });

        const reqList = document.getElementById('list-requests');
        document.getElementById('pendientes-count').innerText = requests?.length || 0;
        
        if(!requests?.length) {
            reqList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin solicitudes pendientes</p>';
        } else {
            reqList.innerHTML = requests.map(r => {
                const eco = r.vehicles ? r.vehicles.economic_number : 'Sin Asignar';
                const plate = r.vehicles ? r.vehicles.plate : '';
                const date = new Date(r.created_at).toLocaleTimeString();
                
                return `
                <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-slate-700 bg-cover bg-center" style="background-image: url('${r.driver.photo_url || ''}')"></div>
                            <div>
                                <p class="text-white font-bold text-sm">${r.driver.full_name}</p>
                                <p class="text-[10px] text-[#92adc9]">${date}</p>
                            </div>
                        </div>
                        <span class="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded-full">Pendiente</span>
                    </div>
                    <div class="bg-[#111a22] p-2 rounded-lg mt-2">
                        <p class="text-xs text-[#92adc9]">Solicita unidad: <span class="text-white font-bold">ECO-${eco}</span> ${plate}</p>
                    </div>
                    <button onclick="window.assignmentsView.openRequest('${r.id}')" class="w-full mt-3 bg-primary/20 text-primary hover:bg-primary hover:text-white py-2 rounded-lg text-xs font-bold transition-all">
                        VER SOLICITUD
                    </button>
                </div>
            `}).join('');
        }
    }

    async loadPreTripChecklists() {
        const { data: pretrip } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at,
                pretrip_checklist,
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('status', 'pretrip_completed')
            .order('created_at', { ascending: false });

        const pretripList = document.getElementById('list-pretrip');
        document.getElementById('pretrip-count').innerText = pretrip?.length || 0;
        
        if(!pretrip?.length) {
            pretripList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin checklists pre-viaje</p>';
        } else {
            pretripList.innerHTML = pretrip.map(p => {
                const eco = p.vehicles ? p.vehicles.economic_number : 'Sin Asignar';
                const date = new Date(p.created_at).toLocaleString();
                const itemsCount = p.pretrip_checklist?.items ? Object.keys(p.pretrip_checklist.items).length : 0;
                const photosCount = p.pretrip_checklist?.photos ? p.pretrip_checklist.photos.length : 0;
                
                return `
                <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-slate-700 bg-cover bg-center" style="background-image: url('${p.driver.photo_url || ''}')"></div>
                            <div>
                                <p class="text-white font-bold text-sm">${p.driver.full_name}</p>
                                <p class="text-[10px] text-[#92adc9]">${date}</p>
                            </div>
                        </div>
                        <span class="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-1 rounded-full">Esperando</span>
                    </div>
                    <div class="bg-[#111a22] p-2 rounded-lg mt-2">
                        <p class="text-xs text-[#92adc9]">Unidad: <span class="text-white font-bold">ECO-${eco}</span></p>
                        <div class="flex gap-2 mt-1">
                            <span class="text-[10px] bg-[#233648] text-white px-2 py-0.5 rounded">${itemsCount} items</span>
                            <span class="text-[10px] bg-[#233648] text-white px-2 py-0.5 rounded">${photosCount} fotos</span>
                        </div>
                    </div>
                    <button onclick="window.assignmentsView.openPreTripReview('${p.id}')" class="w-full mt-3 bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white py-2 rounded-lg text-xs font-bold transition-all">
                        REVISAR CHECKLIST
                    </button>
                </div>
            `}).join('');
        }
    }

    async loadActiveTrips() {
        const { data: trips } = await supabase
            .from('trips')
            .select(`
                id, 
                start_time,
                exit_km,
                vehicles(economic_number, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('status', 'in_progress')
            .order('start_time', { ascending: false });

        const tripList = document.getElementById('list-trips');
        document.getElementById('activos-count').innerText = trips?.length || 0;
        
        if(!trips?.length) {
            tripList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin viajes activos</p>';
        } else {
            tripList.innerHTML = trips.map(t => {
                const startTime = t.start_time ? new Date(t.start_time).toLocaleTimeString() : '--:--';
                const duration = t.start_time ? this.calculateDuration(t.start_time) : '--:--';
                
                return `
                <div class="bg-[#151b23] p-4 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer" onclick="window.assignmentsView.showTripDetail('${t.id}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-700 bg-cover bg-center border-2 border-primary/30" style="background-image: url('${t.driver.photo_url || ''}')"></div>
                        <div class="flex-1">
                            <p class="text-white font-bold text-sm">${t.driver.full_name}</p>
                            <p class="text-[10px] text-[#92adc9]">ECO-${t.vehicles.economic_number} · ${t.vehicles.plate}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-primary font-mono">${duration}</p>
                            <p class="text-[10px] text-[#92adc9]">${startTime}</p>
                        </div>
                    </div>
                </div>
            `}).join('');
        }
    }

    calculateDuration(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    async openRequest(tripId) {
        // Por ahora solo redirigimos al modal de pre-trip review
        // ya que las solicitudes iniciales pasan directamente a pretrip
        this.openPreTripReview(tripId);
    }

    async openPreTripReview(tripId) {
        const { data: trip } = await supabase
            .from('trips')
            .select(`
                id, 
                created_at,
                pretrip_checklist,
                vehicles(economic_number, model, plate), 
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('id', tripId)
            .single();

        if(!trip) return alert("Error cargando datos");

        const modal = document.getElementById('modal-review');
        document.getElementById('review-subtitle').innerText = `Conductor: ${trip.driver.full_name}`;
        document.getElementById('review-driver').innerText = trip.driver.full_name;
        document.getElementById('review-vehicle').innerText = `ECO-${trip.vehicles.economic_number} ${trip.vehicles.plate}`;
        
        const date = new Date(trip.created_at);
        document.getElementById('review-date').innerText = date.toLocaleDateString();
        document.getElementById('review-time').innerText = date.toLocaleTimeString();

        // Mostrar items del checklist
        const items = trip.pretrip_checklist?.items || {};
        const itemsHtml = Object.entries(items).map(([key, value]) => `
            <div class="flex items-center gap-2 bg-[#1c2127] p-2 rounded-lg">
                <span class="material-symbols-outlined text-sm ${value ? 'text-green-500' : 'text-red-500'}">
                    ${value ? 'check_circle' : 'cancel'}
                </span>
                <span class="text-white text-xs capitalize">${key.replace('_', ' ')}</span>
            </div>
        `).join('');
        document.getElementById('review-items').innerHTML = itemsHtml;

        // Mostrar fotos
        const photos = trip.pretrip_checklist?.photos || [];
        const photosHtml = await Promise.all(photos.map(async (photo) => {
            if (photo.path) {
                const { data } = await supabase.storage
                    .from('trip-photos')
                    .createSignedUrl(photo.path, 3600);
                return `
                    <div class="relative group">
                        <img src="${data?.signedUrl}" class="w-full h-24 object-cover rounded-lg border border-primary/30">
                        <span class="absolute top-1 left-1 text-[8px] bg-black/70 text-white px-1 py-0.5 rounded">${photo.position}</span>
                    </div>
                `;
            }
            return '';
        })).then(html => html.join(''));
        
        document.getElementById('review-photos').innerHTML = photosHtml || '<p class="text-slate-500 text-xs col-span-3">Sin fotos</p>';

        document.getElementById('btn-approve-review').onclick = () => this.processDecision(tripId, 'approve');
        document.getElementById('btn-reject-review').onclick = () => this.processDecision(tripId, 'reject');

        modal.classList.remove('hidden');
    }

    async showTripDetail(tripId) {
        const { data: trip } = await supabase
            .from('trips')
            .select(`
                id,
                start_time,
                exit_km,
                vehicles(economic_number, model, plate),
                driver:profiles!trips_driver_id_fkey(full_name, photo_url)
            `)
            .eq('id', tripId)
            .single();

        if (!trip) return;

        // Obtener última ubicación
        const { data: lastLoc } = await supabase
            .from('trip_locations')
            .select('total_distance, moving_time')
            .eq('trip_id', tripId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        const modal = document.getElementById('modal-trip-detail');
        document.getElementById('trip-driver-name').innerText = trip.driver.full_name;
        document.getElementById('trip-vehicle-info').innerText = `ECO-${trip.vehicles.economic_number} · ${trip.vehicles.model}`;
        document.getElementById('trip-driver-avatar').style.backgroundImage = `url('${trip.driver.photo_url || ''}')`;
        document.getElementById('trip-start-time').innerText = trip.start_time ? new Date(trip.start_time).toLocaleString() : '--';
        document.getElementById('trip-exit-km').innerText = `${trip.exit_km || 0} km`;
        document.getElementById('trip-current-km').innerText = lastLoc ? `${Math.round(lastLoc.total_distance + (trip.exit_km || 0))} km` : `${trip.exit_km || 0} km`;
        document.getElementById('trip-duration').innerText = lastLoc ? this.formatDuration(lastLoc.moving_time) : '00:00:00';

        modal.classList.remove('hidden');
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async processDecision(tripId, decision) {
        const modal = document.getElementById('modal-review');
        
        if (decision === 'approve') {
            // Cambiar estado a 'driver_accepted' para que el guardia pueda escanear
            const { error } = await supabase
                .from('trips')
                .update({ 
                    status: 'driver_accepted',
                    request_details: {
                        ...(this.currentRequest?.request_details || {}),
                        reviewed_at: new Date().toISOString(),
                        reviewed_by: 'supervisor',
                        approved: true
                    }
                })
                .eq('id', tripId);
                
            if (!error) {
                alert("✅ Checklist aprobado. El conductor puede pasar con el guardia.");
            } else {
                alert("❌ Error al aprobar: " + error.message);
            }
        } else {
            // Si se rechaza, regresar a estado anterior o cancelar
            const { error } = await supabase
                .from('trips')
                .update({ 
                    status: 'rejected',
                    request_details: {
                        ...(this.currentRequest?.request_details || {}),
                        reviewed_at: new Date().toISOString(),
                        reviewed_by: 'supervisor',
                        rejected: true
                    }
                })
                .eq('id', tripId);
                
            if (!error) {
                alert("❌ Checklist rechazado");
            }
        }
        
        modal.classList.add('hidden');
        this.loadData();
    }
}
