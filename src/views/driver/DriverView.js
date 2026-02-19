import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null;
        this.profile = null;
        this.currentTrip = null;
        this.vehicles = [];
        this.trackingInterval = null;
        this.watchPositionId = null;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-gradient-to-r from-[#111a22] to-[#192633] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div class="relative">
                            <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                            <div class="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-[#111a22]"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[10px] text-[#92adc9] font-bold uppercase tracking-wider">Conductor</div>
                            <h2 id="profile-name" class="text-white text-sm font-bold leading-tight truncate">Cargando...</h2>
                        </div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="document.getElementById('modal-incident').classList.remove('hidden')" class="flex items-center justify-center rounded-full h-10 w-10 bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/40 transition-colors">
                            <span class="material-symbols-outlined text-sm">notifications_active</span>
                        </button>
                        <button onclick="window.logoutDriver()" class="flex items-center justify-center rounded-full h-10 w-10 bg-[#233648] border border-[#324d67] hover:bg-red-900/30 hover:border-red-500/50 transition-colors text-white hover:text-red-400">
                            <span class="material-symbols-outlined text-sm">logout</span>
                        </button>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0d141c] pb-20">
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-primary">directions_car</span>
                            <h3 class="text-white font-bold uppercase tracking-wider">Gestión de Unidad</h3>
                        </div>
                        
                        <div id="unidad-content" class="space-y-3">
                            <div class="text-center p-8 text-slate-400">Cargando unidades...</div>
                        </div>
                    </section>

                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-primary">clipboard</span>
                            <h3 class="text-white font-bold uppercase tracking-wider">Estado Mecánico</h3>
                        </div>
                        
                        <div id="checklist-content" class="bg-[#111a22] border border-[#233648] rounded-xl p-5 shadow-lg">
                            <div class="text-center text-slate-400 py-8">No hay unidad asignada para revisar.</div>
                        </div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">map</span>
                                <h3 class="text-white font-bold uppercase tracking-wider">Ruta Activa</h3>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggle-tracking" class="sr-only peer">
                                <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>

                        <div class="h-48 bg-[#192633] rounded-xl border border-[#233648] flex items-center justify-center mb-4 relative overflow-hidden">
                            <span class="material-symbols-outlined text-5xl text-slate-600">satellite_alt</span>
                            <div class="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-[10px] text-success">
                                <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span> GPS Activo
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 mb-6">
                            <div class="bg-[#111a22] p-4 rounded-xl border border-[#233648] text-center">
                                <div id="track-speed" class="text-3xl font-black text-white">0</div>
                                <div class="text-[10px] text-slate-400 font-bold uppercase">KM/H</div>
                            </div>
                            <div class="bg-[#111a22] p-4 rounded-xl border border-[#233648] text-center">
                                <div id="track-distance" class="text-3xl font-black text-white">0.0</div>
                                <div class="text-[10px] text-slate-400 font-bold uppercase">Distancia (KM)</div>
                            </div>
                        </div>

                        <h5 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mensajes Rápidos</h5>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="window.conductorModule.sendQuickMessage('Tráfico')" class="bg-[#192633] hover:bg-[#233648] border border-[#233648] text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"><span class="material-symbols-outlined text-red-400">traffic</span> Tráfico</button>
                            <button onclick="window.conductorModule.sendQuickMessage('En camino')" class="bg-[#192633] hover:bg-[#233648] border border-[#233648] text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"><span class="material-symbols-outlined text-blue-400">thumb_up</span> En camino</button>
                            <button onclick="window.conductorModule.sendQuickMessage('Retraso')" class="bg-[#192633] hover:bg-[#233648] border border-[#233648] text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"><span class="material-symbols-outlined text-orange-400">timer</span> Retraso</button>
                            <button onclick="window.conductorModule.sendQuickMessage('Llegando')" class="bg-[#192633] hover:bg-[#233648] border border-[#233648] text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"><span class="material-symbols-outlined text-green-400">flag</span> Llegando</button>
                        </div>
                        
                        <div class="mt-6">
                            <button id="btn-finish-trip" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hidden">
                                FINALIZAR VIAJE Y ENTREGAR
                            </button>
                        </div>
                    </section>

                    <section id="tab-historial" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-primary">history</span>
                            <h3 class="text-white font-bold uppercase tracking-wider">Historial</h3>
                        </div>
                        <div class="bg-[#111a22] rounded-xl border border-[#233648] overflow-hidden">
                            <table class="w-full text-left text-sm text-slate-300">
                                <thead class="bg-[#192633] text-xs uppercase text-slate-400">
                                    <tr><th class="px-4 py-3">Fecha</th><th class="px-4 py-3">Unidad</th><th class="px-4 py-3">Estado</th></tr>
                                </thead>
                                <tbody id="history-list" class="divide-y divide-[#233648]">
                                    </tbody>
                            </table>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        
                        <div class="bg-white rounded-2xl overflow-hidden shadow-xl qr-brightness">
                            <div class="bg-slate-50 p-6 border-b border-slate-200">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 id="profile-full-name" class="text-slate-900 text-xl font-bold m-0">--</h3>
                                        <div id="profile-id" class="text-slate-500 text-sm mt-1">ID-000</div>
                                        <div class="mt-2"><span class="bg-primary text-white text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase">Operador A</span></div>
                                    </div>
                                    <div id="profile-large-avatar" class="h-16 w-16 bg-slate-200 rounded-xl bg-cover bg-center border border-slate-300"></div>
                                </div>
                            </div>
                            
                            <div class="p-6">
                                <h5 class="text-slate-800 font-bold mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                    <span class="material-symbols-outlined text-primary">folder_open</span> Documentación
                                </h5>
                                
                                <div class="space-y-4 mb-6">
                                    <div>
                                        <div class="flex justify-between text-xs mb-1">
                                            <strong class="text-slate-700">Licencia Tipo C</strong>
                                            <span class="text-success font-bold">Vigente (320 días)</span>
                                        </div>
                                        <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-success h-1.5 rounded-full" style="width: 80%"></div></div>
                                    </div>
                                    <div>
                                        <div class="flex justify-between text-xs mb-1">
                                            <strong class="text-slate-700">Examen Médico</strong>
                                            <span class="text-success font-bold">Vigente (180 días)</span>
                                        </div>
                                        <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-success h-1.5 rounded-full" style="width: 50%"></div></div>
                                    </div>
                                </div>

                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                                    <div class="font-black text-slate-800 tracking-widest mb-1 text-sm">PASE DE VINCULACIÓN</div>
                                    <div id="qr-assignment-status" class="text-xs text-slate-500 mb-4">Sin vehículo asignado</div>
                                    
                                    <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3 mx-auto w-fit">
                                        <img id="card-qr" alt="QR Salida" class="w-32 h-32 opacity-90 mx-auto" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=empty"/>
                                    </div>
                                    
                                    <div class="text-[9px] text-slate-400 mt-2">* Este QR debe ser escaneado por el guardia para autorizar la salida.</div>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-16 px-2 z-30 pb-safe">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active flex flex-col items-center justify-center w-full h-full text-primary transition-colors">
                        <span class="material-symbols-outlined text-xl mb-0.5">directions_car</span>
                        <span class="text-[10px] font-bold">Unidad</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-300 transition-colors">
                        <span class="material-symbols-outlined text-xl mb-0.5">fact_check</span>
                        <span class="text-[10px] font-bold">Check</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-300 transition-colors">
                        <span class="material-symbols-outlined text-xl mb-0.5">route</span>
                        <span class="text-[10px] font-bold">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('historial')" id="nav-historial" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-300 transition-colors">
                        <span class="material-symbols-outlined text-xl mb-0.5">history</span>
                        <span class="text-[10px] font-bold">Historial</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-300 transition-colors">
                        <span class="material-symbols-outlined text-xl mb-0.5">badge</span>
                        <span class="text-[10px] font-bold">Perfil</span>
                    </button>
                </nav>

                <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4">
                    <div class="bg-[#1c2127] w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-3xl border-t sm:border border-red-500/50 shadow-2xl flex flex-col">
                        <div class="flex justify-between items-center p-6 border-b border-red-900/50 bg-red-900/10 shrink-0">
                            <div><h3 class="text-white text-xl font-bold">Reportar Incidente</h3></div>
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="text-slate-400 p-2"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        <div class="p-6 space-y-4">
                            <select id="inc-type" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500">
                                <option value="accident">Choque / Colisión</option>
                                <option value="breakdown">Falla Mecánica</option>
                                <option value="other">Otro</option>
                            </select>
                            <textarea id="inc-desc" rows="3" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500 placeholder-slate-600" placeholder="¿Qué sucedió?"></textarea>
                            <button id="btn-send-incident" class="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">ENVIAR REPORTE</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <style>
            .nav-btn.active { color: #137fec; }
            .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        </style>
        `;
    }

    async onMount() {
        // Simulando ID de usuario logueado. En prod, sacar de Supabase Auth
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        
        window.conductorModule = this;
        window.logoutDriver = () => { if(confirm("¿Cerrar sesión?")) { localStorage.clear(); location.hash='#login'; location.reload(); }};

        await this.loadProfileData();
        await this.loadDashboardState();
        await this.loadHistory();
        
        this.setupTrackingToggle();
        this.setupIncidentForm();

        // Suscripción a cambios en los viajes (para actualizaciones en tiempo real del mecánico/guardia)
        this.subscription = supabase
            .channel('driver_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, 
            (payload) => {
                if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
                this.loadDashboardState();
            }).subscribe();
    }

    // --- NAVEGACIÓN TABS ---
    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Ocultar todos los contenidos
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));
        
        // Quitar active de botones nav
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        
        // Mostrar el tab seleccionado
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`tab-${tabId}`).classList.add('block');
        
        // Activar el botón
        const activeBtn = document.getElementById(`nav-${tabId}`);
        activeBtn.classList.remove('text-slate-500');
        activeBtn.classList.add('active', 'text-primary');

        if(tabId === 'perfil') this.generateQR();
    }

    // --- CARGA DE DATOS ---
    async loadProfileData() {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(profile) {
            this.profile = profile;
            document.getElementById('profile-name').innerText = profile.full_name;
            document.getElementById('profile-full-name').innerText = profile.full_name;
            document.getElementById('profile-id').innerText = `ID: ${profile.employee_id || 'N/A'}`;
            
            const bgImg = `url('${profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`}')`;
            document.getElementById('profile-avatar').style.backgroundImage = bgImg;
            document.getElementById('profile-large-avatar').style.backgroundImage = bgImg;
        }
    }

    async loadDashboardState() {
        // Buscar viaje activo
        const { data: trip } = await supabase.from('trips')
            .select(`*, vehicles(id, model, plate, status)`)
            .eq('driver_id', this.userId)
            .neq('status', 'closed')
            .maybeSingle();

        this.currentTrip = trip;
        const unidadContainer = document.getElementById('unidad-content');
        const checkContainer = document.getElementById('checklist-content');
        
        if (!trip) {
            // ESTADO 1: SIN VIAJE. Mostrar unidades disponibles para solicitar.
            await this.renderAvailableVehicles(unidadContainer);
            checkContainer.innerHTML = `<div class="text-center text-slate-400 py-8">No hay unidad asignada para revisar.</div>`;
            document.getElementById('btn-finish-trip').classList.add('hidden');
        } else {
            // ESTADO 2: VIAJE EN PROCESO
            
            // Renderizar info de unidad actual en la pestaña de Unidad
            unidadContainer.innerHTML = `
                <div class="bg-success/10 border border-success/30 rounded-xl p-5 text-center">
                    <div class="text-[10px] text-success font-bold uppercase tracking-widest mb-1">Unidad Asignada</div>
                    <div class="text-3xl font-black text-white mb-1">${trip.vehicles.plate}</div>
                    <div class="text-sm text-slate-300 mb-4">${trip.vehicles.model}</div>
                    <div class="inline-flex items-center gap-2 bg-[#111a22] px-3 py-1.5 rounded border border-[#233648] text-xs">
                        Estado Actual: <span class="text-white font-bold">${this.translateStatus(trip.status)}</span>
                    </div>
                </div>
            `;

            // Lógica de pestaña Checklist dependiente del estado del mecánico
            if (trip.status === 'requested') {
                checkContainer.innerHTML = `
                    <div class="text-center py-8">
                        <span class="material-symbols-outlined text-4xl text-warning mb-2 animate-bounce">handyman</span>
                        <h4 class="text-white font-bold mb-1">En revisión mecánica</h4>
                        <p class="text-xs text-slate-400">El mecánico está verificando la unidad. Espera su aprobación.</p>
                    </div>`;
            } else if (trip.status === 'mechanic_approved') {
                // El mecánico aprobó, el conductor debe verificar y aceptar.
                checkContainer.innerHTML = this.renderChecklistForm(trip);
            } else if (trip.status === 'driver_accepted' || trip.status === 'in_progress') {
                checkContainer.innerHTML = `
                    <div class="text-center py-8">
                        <div class="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span class="material-symbols-outlined text-3xl text-success">check_circle</span>
                        </div>
                        <h4 class="text-white font-bold mb-1">Unidad Aceptada</h4>
                        <p class="text-xs text-slate-400">Has verificado y aceptado las condiciones. Pasa por caseta.</p>
                    </div>`;
                
                if(trip.status === 'in_progress') {
                    document.getElementById('btn-finish-trip').classList.remove('hidden');
                    document.getElementById('btn-finish-trip').onclick = () => this.finishTrip(trip.id);
                }
            }
        }
        
        this.generateQR();
    }

    async renderAvailableVehicles(container) {
        const { data: vehicles } = await supabase.from('vehicles').select('*').eq('status', 'active');
        
        if (!vehicles || vehicles.length === 0) {
            container.innerHTML = `<div class="text-center p-8 text-slate-400 bg-[#192633] rounded-xl border border-[#233648]">No hay unidades activas en este momento.</div>`;
            return;
        }

        let html = `<div class="space-y-3">`;
        vehicles.forEach(v => {
            html += `
                <div class="bg-[#192633] border border-[#233648] rounded-xl p-4 flex justify-between items-center">
                    <div>
                        <div class="text-white font-bold">${v.model}</div>
                        <div class="text-slate-400 text-xs">${v.plate}</div>
                    </div>
                    <button onclick="window.conductorModule.requestSpecificVehicle('${v.id}')" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                        SOLICITAR
                    </button>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    // --- ACCIONES CORE ---
    async requestSpecificVehicle(vehicleId) {
        if(!confirm("¿Deseas solicitar esta unidad? Pasará a revisión del mecánico.")) return;
        
        const { error } = await supabase.from('trips').insert({
            vehicle_id: vehicleId,
            driver_id: this.userId,
            status: 'requested', // Se va al mecánico
            created_at: new Date()
        });

        if(error) alert("Error: " + error.message);
        else {
            this.loadDashboardState();
            this.switchTab('checklist');
        }
    }

    renderChecklistForm(trip) {
        // Checklist específico solicitado
        return `
            <div class="text-center mb-6">
                <div class="text-success text-xs font-bold uppercase tracking-widest mb-1">Revisión Lista</div>
                <h4 class="text-white text-lg font-bold">Verifica y Acepta</h4>
                <p class="text-slate-400 text-xs">El mecánico ha liberado la unidad.</p>
            </div>
            
            <div class="space-y-1 mb-6 bg-[#192633] rounded-lg p-2 border border-[#233648]">
                <div class="flex justify-between items-center p-2 border-b border-[#233648]"><span class="text-sm text-slate-300">Líquido</span><span class="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">OK</span></div>
                <div class="flex justify-between items-center p-2 border-b border-[#233648]"><span class="text-sm text-slate-300">Aceite</span><span class="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">OK</span></div>
                <div class="flex justify-between items-center p-2 border-b border-[#233648]"><span class="text-sm text-slate-300">Anticongelante</span><span class="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">OK</span></div>
                <div class="flex justify-between items-center p-2 border-b border-[#233648]"><span class="text-sm text-slate-300">Luces</span><span class="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">OK</span></div>
                <div class="flex justify-between items-center p-2 border-b border-[#233648]"><span class="text-sm text-slate-300">Llantas</span><span class="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">OK</span></div>
                <div class="flex justify-between items-center p-2"><span class="text-sm text-slate-300">Fotos 4 costados</span><span class="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">CARGADAS</span></div>
            </div>

            <button onclick="window.conductorModule.acceptUnit('${trip.id}')" class="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">
                ACEPTAR Y RECIBIR UNIDAD
            </button>
            <p class="text-[10px] text-center text-slate-500 mt-3">Al aceptar, confirmas que recibes la unidad en condiciones óptimas y se generará tu pase de salida.</p>
        `;
    }

    async acceptUnit(tripId) {
        // Al aceptar, el estatus cambia y ya puede generar su QR para salir por caseta
        const { error } = await supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', tripId);
        
        if(error) alert("Error al aceptar unidad: " + error.message);
        else {
            this.loadDashboardState();
            this.switchTab('perfil'); // Mandamos al perfil para que vea su QR de salida
            alert("Unidad aceptada. Muestra tu Gafete Digital en caseta para iniciar ruta.");
        }
    }

    async finishTrip(tripId) {
        if(!confirm("¿Estás seguro de finalizar el viaje y entregar la unidad?")) return;
        const { error } = await supabase.from('trips').update({ status: 'closed' }).eq('id', tripId);
        if(!error) {
            this.currentTrip = null;
            this.loadDashboardState();
            this.loadHistory();
            this.switchTab('unidad');
        }
    }

    // --- GAFETE DIGITAL / QR ---
    generateQR() {
        const qrImg = document.getElementById('card-qr');
        const statusText = document.getElementById('qr-assignment-status');
        
        if (this.currentTrip && (this.currentTrip.status === 'driver_accepted' || this.currentTrip.status === 'in_progress')) {
            // Requerimiento: Quien se la lleva, para qué, quien autoriza
            const qrData = {
                conductor: this.profile?.full_name || 'Desconocido',
                unidad: this.currentTrip.vehicles.plate,
                motivo: 'Ruta Operativa',
                autoriza: 'Admin/Mecánico',
                trip_id: this.currentTrip.id,
                status: 'autorizado'
            };
            
            const encoded = encodeURIComponent(JSON.stringify(qrData));
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}&color=111a22`;
            qrImg.classList.remove('opacity-20');
            
            statusText.innerHTML = `Asignado a: <strong class="text-primary">${this.currentTrip.vehicles.plate}</strong>`;
        } else {
            qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=empty&color=94a3b8";
            qrImg.classList.add('opacity-20');
            statusText.innerHTML = `<span class="text-orange-500">Sin pase autorizado actualmente</span>`;
        }
    }

    // --- RUTA Y SEGUIMIENTO ---
    setupTrackingToggle() {
        const toggle = document.getElementById('toggle-tracking');
        toggle.addEventListener('change', (e) => {
            if(e.target.checked) this.startTracking();
            else this.stopTracking();
        });
    }

    startTracking() {
        if (!navigator.geolocation) return alert("Geolocalización no soportada");
        
        this.watchPositionId = navigator.geolocation.watchPosition(
            (pos) => {
                const speed = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(0) : '0'; // m/s to km/h
                document.getElementById('track-speed').innerText = speed;
                
                // Aquí podrías guardar las coordenadas en Supabase periódicamente para el panel Admin
                if (this.currentTrip && this.currentTrip.status === 'in_progress') {
                    // supabase.from('trip_locations').insert({ trip_id: this.currentTrip.id, lat: pos.coords.latitude, lng: pos.coords.longitude, speed: speed })
                }
            },
            (err) => console.warn('GPS Error', err),
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
        
        // Simulación visual de distancia
        let dist = parseFloat(document.getElementById('track-distance').innerText);
        this.trackingInterval = setInterval(() => {
            dist += 0.1;
            document.getElementById('track-distance').innerText = dist.toFixed(1);
        }, 5000);
    }

    stopTracking() {
        if (this.watchPositionId) navigator.geolocation.clearWatch(this.watchPositionId);
        if (this.trackingInterval) clearInterval(this.trackingInterval);
        document.getElementById('track-speed').innerText = "0";
    }

    sendQuickMessage(msg) {
        alert(`Mensaje "${msg}" enviado a central.`);
        // Aquí insertar a supabase: tabla de alertas/mensajes
    }

    // --- HISTORIAL ---
    async loadHistory() {
        const { data: trips } = await supabase.from('trips')
            .select('*, vehicles(plate)')
            .eq('driver_id', this.userId)
            .eq('status', 'closed')
            .order('created_at', { ascending: false })
            .limit(10);
            
        const tbody = document.getElementById('history-list');
        if(!trips || trips.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-slate-500">Sin historial de viajes</td></tr>`;
            return;
        }
        
        tbody.innerHTML = trips.map(t => `
            <tr class="hover:bg-[#192633] transition-colors">
                <td class="px-4 py-3 whitespace-nowrap">${new Date(t.created_at).toLocaleDateString()}</td>
                <td class="px-4 py-3 font-bold text-white">${t.vehicles?.plate || '---'}</td>
                <td class="px-4 py-3"><span class="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded">FINALIZADO</span></td>
            </tr>
        `).join('');
    }

    // --- INCIDENTES ---
    setupIncidentForm() {
        document.getElementById('btn-send-incident').onclick = async () => {
            const desc = document.getElementById('inc-desc').value;
            if(!desc) return alert("Describe el incidente");
            
            // Supabase Insert logic omitido para mantener foco, pero aquí va.
            alert("Incidente reportado.");
            document.getElementById('modal-incident').classList.add('hidden');
            document.getElementById('inc-desc').value = "";
        };
    }

    translateStatus(s) {
        const dict = { 'requested': 'Revisión Mecánico', 'mechanic_approved': 'Aprobado Mecánico', 'driver_accepted': 'En Caseta / Salida', 'in_progress': 'En Ruta', 'closed': 'Finalizado' };
        return dict[s] || s;
    }
}
