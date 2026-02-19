import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null;
        this.profile = null;
        this.currentTrip = null;
        this.trackingInterval = null;
        this.watchPositionId = null;
        this.incidentImages = []; // Para gestionar múltiples fotos de accidentes
        
        window.conductorModule = this;
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

                <main class="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0d141c] pb-24">
                    
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
                        <div class="flex items-center justify-between mb-4 text-white">
                            <h3 class="font-bold uppercase tracking-wider flex items-center gap-2"><span class="material-symbols-outlined text-primary">map</span> Ruta Activa</h3>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggle-tracking" class="sr-only peer">
                                <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>
                        <div class="h-48 bg-[#192633] rounded-xl border border-[#233648] flex items-center justify-center mb-4 relative overflow-hidden">
                            <span class="material-symbols-outlined text-5xl text-slate-600">satellite_alt</span>
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
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="window.conductorModule.sendQuickMessage('Tráfico')" class="bg-[#192633] border border-[#233648] text-white py-3 rounded-lg text-sm">🚗 Tráfico</button>
                            <button onclick="window.conductorModule.sendQuickMessage('En camino')" class="bg-[#192633] border border-[#233648] text-white py-3 rounded-lg text-sm">👍 En camino</button>
                        </div>
                        <button id="btn-finish-trip" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg mt-6 hidden">FINALIZAR VIAJE</button>
                    </section>

                    <section id="tab-historial" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4 text-white font-bold uppercase tracking-wider">
                            <span class="material-symbols-outlined text-primary">history</span> Historial
                        </div>
                        <div class="bg-[#111a22] rounded-xl border border-[#233648] overflow-hidden">
                            <table class="w-full text-left text-sm text-slate-300"><tbody id="history-list" class="divide-y divide-[#233648]"></tbody></table>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="bg-white rounded-2xl overflow-hidden shadow-xl">
                            <div class="bg-slate-50 p-6 border-b border-slate-200">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 id="profile-full-name" class="text-slate-900 text-xl font-bold m-0">--</h3>
                                        <div id="profile-id" class="text-slate-500 text-sm mt-1">ID-000</div>
                                    </div>
                                    <div id="profile-large-avatar" class="h-16 w-16 bg-slate-200 rounded-xl bg-cover bg-center border border-slate-300"></div>
                                </div>
                            </div>
                            
                            <div class="p-6 space-y-6">
                                <div>
                                    <h5 class="text-slate-800 font-bold mb-3 flex items-center gap-2 border-b pb-2">
                                        <span class="material-symbols-outlined text-primary">folder_shared</span> Documentos Personales
                                    </h5>
                                    <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center group hover:border-primary transition-colors relative">
                                        <input type="file" id="input-license-file" accept="image/*" capture="environment" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                        <div id="license-preview-container" class="hidden mb-2"><img id="license-preview" class="h-20 mx-auto rounded border"></div>
                                        <span class="material-symbols-outlined text-slate-400 text-3xl group-hover:text-primary">upload_file</span>
                                        <p class="text-xs text-slate-500 mt-1 font-bold uppercase">Actualizar Foto de Licencia</p>
                                        <div id="license-progress" class="hidden w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden"><div class="bg-primary h-full w-0 transition-all"></div></div>
                                    </div>
                                </div>

                                <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                                    <div class="font-black text-slate-800 tracking-widest mb-1 text-sm">PASE DE VINCULACIÓN DIGITAL</div>
                                    <div id="qr-assignment-status" class="text-xs text-slate-500 mb-4 font-bold">Sin vehículo</div>
                                    <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3 mx-auto w-fit">
                                        <img id="card-qr" alt="QR Salida" class="w-32 h-32 opacity-90 mx-auto" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=empty"/>
                                    </div>
                                    <div class="text-[9px] text-slate-400 uppercase font-bold">* QR Dinámico: Chofer + Unidad + Autorización</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-16 px-2 z-30 pb-safe">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active flex flex-col items-center justify-center w-full h-full text-primary transition-colors"><span class="material-symbols-outlined text-xl mb-0.5">directions_car</span><span class="text-[10px] font-bold">Unidad</span></button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 transition-colors"><span class="material-symbols-outlined text-xl mb-0.5">fact_check</span><span class="text-[10px] font-bold">Check</span></button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 transition-colors"><span class="material-symbols-outlined text-xl mb-0.5">route</span><span class="text-[10px] font-bold">Ruta</span></button>
                    <button onclick="window.conductorModule.switchTab('historial')" id="nav-historial" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 transition-colors"><span class="material-symbols-outlined text-xl mb-0.5">history</span><span class="text-[10px] font-bold">Historial</span></button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500 transition-colors"><span class="material-symbols-outlined text-xl mb-0.5">badge</span><span class="text-[10px] font-bold">Perfil</span></button>
                </nav>

                <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4">
                    <div class="bg-[#1c2127] w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-3xl border-t sm:border border-red-500/50 shadow-2xl flex flex-col">
                        <div class="flex justify-between items-center p-6 border-b border-red-900/50 bg-red-900/10 shrink-0">
                            <div><h3 class="text-white text-xl font-bold uppercase tracking-tighter">Reportar Incidente / Siniestro</h3></div>
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="text-slate-400 p-2"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <select id="inc-type" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500">
                                <option value="accident">Choque / Colisión</option>
                                <option value="breakdown">Falla Mecánica</option>
                                <option value="fine">Multa de Tránsito</option>
                                <option value="theft">Robo / Cristalazo</option>
                            </select>
                            <textarea id="inc-desc" rows="3" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500 placeholder-slate-600" placeholder="¿Qué sucedió exactamente?"></textarea>
                            
                            <div class="bg-[#111a22] border border-red-900/30 rounded-xl p-4">
                                <label class="text-[10px] font-bold text-red-400 uppercase block mb-2">Evidencia del momento (Cámara)</label>
                                <div class="flex gap-2">
                                    <input type="file" id="input-incident-camera" accept="image/*" capture="environment" class="hidden">
                                    <label for="input-incident-camera" class="flex-1 h-12 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer font-bold text-xs transition-colors">
                                        <span class="material-symbols-outlined text-sm">photo_camera</span> TOMAR FOTO
                                    </label>
                                </div>
                                <div id="incident-preview-grid" class="grid grid-cols-3 gap-2 mt-4">
                                    </div>
                            </div>
                        </div>
                        <div class="p-6 border-t border-red-900/50 bg-[#151b23]">
                            <button id="btn-send-incident" class="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-xs">Enviar Reporte Crítico</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <style>
            .nav-btn.active { color: #137fec; }
            .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            .tab-content { height: 100%; }
        </style>
        `;
    }

    async onMount() {
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        
        window.logoutDriver = () => { if(confirm("¿Cerrar sesión?")) { localStorage.clear(); location.hash='#login'; location.reload(); }};

        await this.loadProfileData();
        await this.loadDashboardState();
        await this.loadHistory();
        
        this.setupTrackingToggle();
        this.setupIncidentForm();
        this.setupDocumentUpload(); // NUEVO: Listener de documentos

        this.subscription = supabase
            .channel('driver_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, 
            (payload) => {
                if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
                this.loadDashboardState();
            }).subscribe();
    }

    // --- NUEVO: CARGA DE DOCUMENTOS (LICENCIA) ---
    setupDocumentUpload() {
        const input = document.getElementById('input-license-file');
        const progress = document.getElementById('license-progress');
        const progressBar = progress.querySelector('div');
        const previewCont = document.getElementById('license-preview-container');
        const previewImg = document.getElementById('license-preview');

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Preview local
            previewImg.src = URL.createObjectURL(file);
            previewCont.classList.remove('hidden');
            progress.classList.remove('hidden');

            const fileName = `${this.userId}_license_${Date.now()}.png`;
            
            // Subida a Supabase Storage (Asumiendo que tienes un bucket 'driver-docs')
            const { data, error } = await supabase.storage
                .from('driver-docs')
                .upload(fileName, file, {
                    onUploadProgress: (p) => {
                        progressBar.style.width = `${(p.loaded / p.total) * 100}%`;
                    }
                });

            if (!error) {
                // Actualizar perfil con el nuevo URL
                const { publicUrl } = supabase.storage.from('driver-docs').getPublicUrl(fileName);
                await supabase.from('profiles').update({ license_photo_url: publicUrl }).eq('id', this.userId);
                alert("Licencia actualizada exitosamente");
                progress.classList.add('hidden');
            } else {
                alert("Error al subir: " + error.message);
            }
        });
    }

    // --- NUEVO: CAPTURA DE FOTOS EN INCIDENTES ---
    setupIncidentForm() {
        const cameraInput = document.getElementById('input-incident-camera');
        const previewGrid = document.getElementById('incident-preview-grid');
        const sendBtn = document.getElementById('btn-send-incident');

        cameraInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.incidentImages.push(file);
            
            // Crear miniatura
            const div = document.createElement('div');
            div.className = "aspect-square rounded border border-red-500/30 bg-cover bg-center relative";
            div.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
            div.innerHTML = `<button class="absolute -top-1 -right-1 bg-red-600 rounded-full size-4 text-[10px] flex items-center justify-center text-white">×</button>`;
            
            div.querySelector('button').onclick = () => {
                this.incidentImages = this.incidentImages.filter(f => f !== file);
                div.remove();
            };
            
            previewGrid.appendChild(div);
        });

        sendBtn.onclick = async () => {
            const desc = document.getElementById('inc-desc').value;
            if(!desc) return alert("Por favor describe lo sucedido.");
            
            sendBtn.innerText = "ENVIANDO REPORTE...";
            sendBtn.disabled = true;

            // Subir imágenes antes de crear el registro
            const photoUrls = [];
            for (const img of this.incidentImages) {
                const name = `incident_${Date.now()}_${img.name}`;
                const { data } = await supabase.storage.from('incident-evidence').upload(name, img);
                if (data) {
                    const { publicUrl } = supabase.storage.from('incident-evidence').getPublicUrl(name);
                    photoUrls.push(publicUrl);
                }
            }

            const { error } = await supabase.from('incidents').insert({
                driver_id: this.userId,
                vehicle_id: this.currentTrip?.vehicle_id,
                type: document.getElementById('inc-type').value,
                description: desc,
                evidence_urls: photoUrls,
                created_at: new Date()
            });

            if(!error) {
                alert("REPORTE ENVIADO. Central ha sido notificada.");
                this.incidentImages = [];
                previewGrid.innerHTML = '';
                document.getElementById('inc-desc').value = "";
                document.getElementById('modal-incident').classList.add('hidden');
            } else {
                alert("Error: " + error.message);
            }
            sendBtn.innerText = "Enviar Reporte Crítico";
            sendBtn.disabled = false;
        };
    }

    // --- MÉTODOS DE SOPORTE EXISTENTES (Mantenidos) ---
    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('active', 'text-primary');
            el.classList.add('text-slate-500');
        });
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`tab-${tabId}`).classList.add('block');
        const activeBtn = document.getElementById(`nav-${tabId}`);
        activeBtn.classList.remove('text-slate-500');
        activeBtn.classList.add('active', 'text-primary');
        if(tabId === 'perfil') this.generateQR();
    }

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
        const { data: trip } = await supabase.from('trips').select(`*, vehicles(id, model, plate, status)`).eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();
        this.currentTrip = trip;
        const unidadContainer = document.getElementById('unidad-content');
        const checkContainer = document.getElementById('checklist-content');
        if (!trip) {
            await this.renderAvailableVehicles(unidadContainer);
            checkContainer.innerHTML = `<div class="text-center text-slate-400 py-8">No hay unidad asignada.</div>`;
            document.getElementById('btn-finish-trip').classList.add('hidden');
        } else {
            unidadContainer.innerHTML = `<div class="bg-success/10 border border-success/30 rounded-xl p-5 text-center"><div class="text-[10px] text-success font-bold uppercase mb-1">Asignada</div><div class="text-3xl font-black text-white mb-1">${trip.vehicles.plate}</div><div class="text-sm text-slate-300 mb-4">${trip.vehicles.model}</div><span class="text-white font-bold text-xs">Estatus: ${this.translateStatus(trip.status)}</span></div>`;
            if (trip.status === 'requested') {
                checkContainer.innerHTML = `<div class="text-center py-8"><span class="material-symbols-outlined text-4xl text-warning mb-2 animate-bounce">handyman</span><h4 class="text-white font-bold mb-1">En taller</h4><p class="text-xs text-slate-400">El mecánico está verificando la unidad.</p></div>`;
            } else if (trip.status === 'mechanic_approved') {
                checkContainer.innerHTML = this.renderChecklistForm(trip);
            } else if (trip.status === 'driver_accepted' || trip.status === 'in_progress') {
                checkContainer.innerHTML = `<div class="text-center py-8"><span class="material-symbols-outlined text-3xl text-success">check_circle</span><h4 class="text-white font-bold mb-1">Unidad Autorizada</h4><p class="text-xs text-slate-400">Pase activo para caseta.</p></div>`;
                if(trip.status === 'in_progress') document.getElementById('btn-finish-trip').classList.remove('hidden');
            }
        }
        this.generateQR();
    }

    async renderAvailableVehicles(container) {
        const { data: vehicles } = await supabase.from('vehicles').select('*').eq('status', 'active');
        if (!vehicles || vehicles.length === 0) { container.innerHTML = `<div class="text-center p-8 text-slate-400">Sin unidades activas.</div>`; return; }
        container.innerHTML = vehicles.map(v => `<div class="bg-[#192633] border border-[#233648] rounded-xl p-4 flex justify-between items-center"><div><div class="text-white font-bold">${v.model}</div><div class="text-slate-400 text-xs">${v.plate}</div></div><button onclick="window.conductorModule.requestSpecificVehicle('${v.id}')" class="bg-primary px-4 py-2 rounded-lg text-xs font-bold text-white">SOLICITAR</button></div>`).join('');
    }

    async requestSpecificVehicle(vehicleId) {
        const { error } = await supabase.from('trips').insert({ vehicle_id: vehicleId, driver_id: this.userId, status: 'requested', created_at: new Date() });
        if(!error) this.loadDashboardState();
    }

    renderChecklistForm(trip) {
        return `<div class="text-center mb-6"><h4 class="text-white text-lg font-bold">Verifica y Acepta</h4></div><div class="space-y-1 mb-6 bg-[#192633] rounded-lg p-2 border"> <div class="flex justify-between p-2 border-b border-[#233648] text-white text-xs"><span>Líquido / Aceite</span><span class="text-success font-bold">OK</span></div><div class="flex justify-between p-2 text-white text-xs"><span>Llantas / Luces</span><span class="text-success font-bold">OK</span></div></div><button onclick="window.conductorModule.acceptUnit('${trip.id}')" class="w-full py-4 bg-primary text-white font-bold rounded-xl">RECIBIR UNIDAD</button>`;
    }

    async acceptUnit(tripId) {
        const { error } = await supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', tripId);
        if(!error) { this.loadDashboardState(); this.switchTab('perfil'); }
    }

    generateQR() {
        const qrImg = document.getElementById('card-qr');
        const statusText = document.getElementById('qr-assignment-status');
        if (this.currentTrip && (this.currentTrip.status === 'driver_accepted' || this.currentTrip.status === 'in_progress')) {
            const qrData = { driver: this.profile?.full_name, vehicle: this.currentTrip.vehicles.plate, trip: this.currentTrip.id, time: Date.now() };
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrData))}&color=111a22`;
            qrImg.classList.remove('opacity-20');
            statusText.innerHTML = `Asignado: <strong class="text-primary">${this.currentTrip.vehicles.plate}</strong>`;
        } else {
            qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=empty";
            qrImg.classList.add('opacity-20');
            statusText.innerText = "Sin vehículo asignado";
        }
    }

    setupTrackingToggle() {
        document.getElementById('toggle-tracking').addEventListener('change', (e) => {
            if(e.target.checked) this.startTracking(); else this.stopTracking();
        });
    }

    startTracking() {
        if (!navigator.geolocation) return;
        this.watchPositionId = navigator.geolocation.watchPosition((pos) => {
            document.getElementById('track-speed').innerText = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(0) : '0';
        });
    }

    stopTracking() {
        if (this.watchPositionId) navigator.geolocation.clearWatch(this.watchPositionId);
        document.getElementById('track-speed').innerText = "0";
    }

    async loadHistory() {
        const { data: trips } = await supabase.from('trips').select('*, vehicles(plate)').eq('driver_id', this.userId).eq('status', 'closed').order('created_at', { ascending: false }).limit(10);
        const tbody = document.getElementById('history-list');
        if(trips) tbody.innerHTML = trips.map(t => `<tr class="hover:bg-[#192633] transition-colors"><td class="px-4 py-3 whitespace-nowrap">${new Date(t.created_at).toLocaleDateString()}</td><td class="px-4 py-3 font-bold text-white">${t.vehicles?.plate || '---'}</td><td class="px-4 py-3"><span class="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded">CERRADO</span></td></tr>`).join('');
    }

    sendQuickMessage(m) { alert("Enviado: " + m); }

    translateStatus(s) {
        const dict = { 'requested': 'Taller', 'mechanic_approved': 'Aprobado', 'driver_accepted': 'Autorizado', 'in_progress': 'Ruta', 'closed': 'Cerrado' };
        return dict[s] || s;
    }
}
