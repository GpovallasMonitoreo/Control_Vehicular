import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null;
        this.profile = null;
        this.currentTrip = null;
        this.watchPositionId = null;
        this.incidentImages = []; // Para acumular fotos de accidentes
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden text-slate-300">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-gradient-to-r from-[#111a22] to-[#192633] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div class="relative">
                            <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                            <div class="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-[#111a22]"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-[10px] text-[#92adc9] font-bold uppercase tracking-wider">Operador Activo</div>
                            <h2 id="profile-name" class="text-white text-sm font-bold leading-tight truncate">Cargando...</h2>
                        </div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="document.getElementById('modal-incident').classList.remove('hidden')" class="flex items-center justify-center rounded-full h-10 w-10 bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/40 transition-colors">
                            <span class="material-symbols-outlined text-sm">emergency_home</span>
                        </button>
                        <button onclick="window.location.reload()" class="flex items-center justify-center rounded-full h-10 w-10 bg-[#233648] border border-[#324d67] text-white">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                        </button>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0d141c] pb-24">
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-primary">directions_car</span>
                            <h3 class="text-white font-bold uppercase tracking-wider">Gestión de Unidad</h3>
                        </div>
                        <div id="unidad-content" class="space-y-3"></div>
                    </section>

                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center gap-2 mb-4">
                            <span class="material-symbols-outlined text-primary">fact_check</span>
                            <h3 class="text-white font-bold uppercase tracking-wider">Estado Mecánico</h3>
                        </div>
                        <div id="checklist-content" class="bg-[#111a22] border border-[#233648] rounded-2xl p-6 shadow-xl"></div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-white font-bold uppercase tracking-wider">Ruta Activa</h3>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggle-tracking" class="sr-only peer">
                                <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>
                        <div class="bg-[#111a22] p-5 rounded-2xl border border-[#233648] space-y-4">
                             <div class="grid grid-cols-2 gap-3">
                                <div class="bg-[#1c2127] p-4 rounded-xl text-center border border-[#324d67]">
                                    <div id="track-speed" class="text-3xl font-black text-white">0</div>
                                    <div class="text-[10px] text-slate-500 font-bold uppercase">KM/H</div>
                                </div>
                                <div class="bg-[#1c2127] p-4 rounded-xl text-center border border-[#324d67]">
                                    <div id="track-distance" class="text-3xl font-black text-white">0.0</div>
                                    <div class="text-[10px] text-slate-500 font-bold uppercase">Km Viaje</div>
                                </div>
                             </div>
                             <button id="btn-finish-trip" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hidden uppercase tracking-widest">Finalizar Entrega</button>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-6 animate-fade-in">
                        <div class="bg-white rounded-3xl overflow-hidden shadow-2xl text-slate-800">
                            <div class="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 id="profile-full-name" class="text-xl font-black m-0 leading-none">--</h3>
                                    <p id="profile-id" class="text-xs text-slate-500 mt-1 font-mono tracking-tighter">ID: --</p>
                                </div>
                                <div id="profile-large-avatar" class="h-14 w-14 bg-slate-200 rounded-2xl bg-cover bg-center border border-slate-300"></div>
                            </div>
                            <div class="p-6 flex flex-col items-center">
                                <div class="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 mb-2">
                                    <img id="card-qr" class="w-40 h-40" src=""/>
                                </div>
                                <p class="text-[10px] font-bold text-primary uppercase tracking-widest" id="qr-assignment-status">Pase Digital</p>
                            </div>
                        </div>

                        <div class="bg-[#111a22] border border-[#233648] rounded-3xl p-6 space-y-4 shadow-xl">
                            <h4 class="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">folder_shared</span> Expediente Digital
                            </h4>
                            
                            <div class="flex items-center justify-between p-3 bg-[#1c2127] rounded-xl border border-[#324d67]">
                                <div class="flex items-center gap-3">
                                    <span class="material-symbols-outlined text-blue-400">badge</span>
                                    <span class="text-xs font-bold text-white">Licencia de Conducir</span>
                                </div>
                                <div class="flex gap-2">
                                    <input type="file" id="file-license" class="hidden" onchange="window.conductorModule.uploadDoc('license', this)">
                                    <label for="file-license" class="text-[10px] bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors">SUBIR</label>
                                    <button id="view-license" class="hidden text-slate-400"><span class="material-symbols-outlined text-sm">visibility</span></button>
                                </div>
                            </div>

                            <div class="flex items-center justify-between p-3 bg-[#1c2127] rounded-xl border border-[#324d67]">
                                <div class="flex items-center gap-3">
                                    <span class="material-symbols-outlined text-emerald-400">medical_services</span>
                                    <span class="text-xs font-bold text-white">Examen Médico</span>
                                </div>
                                <div class="flex gap-2">
                                    <input type="file" id="file-medical" class="hidden" onchange="window.conductorModule.uploadDoc('medical', this)">
                                    <label for="file-medical" class="text-[10px] bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-primary hover:text-white transition-colors">SUBIR</label>
                                    <button id="view-medical" class="hidden text-slate-400"><span class="material-symbols-outlined text-sm">visibility</span></button>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-16 px-2 z-30 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active flex flex-col items-center justify-center w-full h-full text-primary transition-all">
                        <span class="material-symbols-outlined text-xl mb-0.5">local_shipping</span>
                        <span class="text-[9px] font-bold uppercase tracking-tighter">Unidad</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500">
                        <span class="material-symbols-outlined text-xl mb-0.5">fact_check</span>
                        <span class="text-[9px] font-bold uppercase tracking-tighter">Check</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500">
                        <span class="material-symbols-outlined text-xl mb-0.5">near_me</span>
                        <span class="text-[9px] font-bold uppercase tracking-tighter">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn flex flex-col items-center justify-center w-full h-full text-slate-500">
                        <span class="material-symbols-outlined text-xl mb-0.5">account_circle</span>
                        <span class="text-[9px] font-bold uppercase tracking-tighter">Perfil</span>
                    </button>
                </nav>

                <div id="modal-incident" class="hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-sm p-0 sm:p-4">
                    <div class="bg-[#1c2127] w-full sm:max-w-md h-full sm:h-auto max-h-[95vh] sm:rounded-3xl flex flex-col shadow-2xl border-t sm:border border-red-500/30 overflow-hidden">
                        <div class="p-6 border-b border-red-500/20 bg-red-900/10 flex justify-between items-center shrink-0">
                            <div>
                                <h3 class="text-white text-xl font-black uppercase italic tracking-tighter">Reportar Accidente</h3>
                                <p class="text-red-400 text-[10px] font-bold uppercase tracking-widest">Canal de emergencia directo</p>
                            </div>
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="bg-red-500/20 text-red-500 p-2 rounded-full"><span class="material-symbols-outlined">close</span></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2">Tipo de Suceso</label>
                                <select id="inc-type" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-4 outline-none focus:border-red-500">
                                    <option value="accident">Choque / Colisión</option>
                                    <option value="fine">Infracción / Multa</option>
                                    <option value="breakdown">Falla Mecánica Grave</option>
                                    <option value="theft">Robo / Asalto</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2">Evidencia Fotográfica (Obligatorio)</label>
                                <div class="grid grid-cols-2 gap-3" id="incident-images-grid">
                                    <div class="relative aspect-video">
                                        <input type="file" accept="image/*" capture="environment" id="inc-cam" class="hidden" onchange="window.conductorModule.captureIncidentImage(this)">
                                        <label for="inc-cam" class="flex flex-col items-center justify-center w-full h-full bg-[#111a22] border-2 border-dashed border-[#324d67] rounded-2xl text-slate-500 hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer">
                                            <span class="material-symbols-outlined text-3xl">add_a_photo</span>
                                            <span class="text-[9px] font-bold mt-1">TOMAR FOTO</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2">Descripción de los Hechos</label>
                                <textarea id="inc-desc" rows="4" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-2xl p-4 outline-none focus:border-red-500 text-sm placeholder:text-slate-600" placeholder="¿Qué ocurrió? Indica ubicación y si hay heridos..."></textarea>
                            </div>
                        </div>

                        <div class="p-6 border-t border-[#324d67] bg-[#151b23] shrink-0">
                            <button id="btn-submit-incident" onclick="window.conductorModule.saveIncident()" class="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-900/20 transition-all active:scale-95 uppercase tracking-widest text-sm">Enviar Reporte de Auxilio</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async onMount() {
        this.userId = localStorage.getItem('userId') || 'd0c1e2f3-0000-0000-0000-000000000001'; 
        
        window.logoutDriver = () => { if(confirm("¿Cerrar sesión?")) { localStorage.clear(); location.hash='#login'; location.reload(); }};

        await this.loadProfileData();
        await this.loadDashboardState();
        
        this.setupTrackingToggle();

        // Suscripción a cambios
        supabase.channel('driver_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, () => this.loadDashboardState()).subscribe();
    }

    // --- NAVEGACIÓN ---
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('text-primary'); el.classList.add('text-slate-500'); });
        
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('text-primary');
        document.getElementById(`nav-${tabId}`).classList.remove('text-slate-500');
        
        if(tabId === 'perfil') this.generateQR();
    }

    // --- CARGA DE PERFIL Y DOCUMENTOS ---
    async loadProfileData() {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(profile) {
            this.profile = profile;
            document.getElementById('profile-name').innerText = profile.full_name;
            document.getElementById('profile-full-name').innerText = profile.full_name;
            document.getElementById('profile-id').innerText = `ID: ${profile.employee_id || 'SIN-ID'}`;
            
            const avatar = profile.photo_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=137fec&color=fff`;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${avatar}')`;
            document.getElementById('profile-large-avatar').style.backgroundImage = `url('${avatar}')`;
            
            // Mostrar botones de vista si existen documentos
            if(profile.license_url) document.getElementById('view-license').classList.remove('hidden');
            if(profile.medical_url) document.getElementById('view-medical').classList.remove('hidden');
        }
    }

    // --- SUBIDA DE DOCUMENTOS (Licencia / Médico) ---
    async uploadDoc(type, input) {
        const file = input.files[0];
        if(!file) return;

        const label = input.nextElementSibling;
        label.innerText = "SUBIENDO...";
        
        const fileName = `${this.userId}_${type}_${Date.now()}`;
        const { data, error } = await supabase.storage.from('driver-docs').upload(fileName, file);

        if(error) {
            alert("Error al subir: " + error.message);
            label.innerText = "REINTENTAR";
        } else {
            const { data: { publicUrl } } = supabase.storage.from('driver-docs').getPublicUrl(fileName);
            const dbField = type === 'license' ? 'license_url' : 'medical_url';
            
            await supabase.from('profiles').update({ [dbField]: publicUrl }).eq('id', this.userId);
            label.innerText = "LISTO ✅";
            label.className = "text-[10px] bg-green-500/20 text-green-500 px-3 py-1.5 rounded-lg font-bold";
            document.getElementById(`view-${type}`).classList.remove('hidden');
        }
    }

    // --- REPORTE DE ACCIDENTE CON FOTOS ---
    captureIncidentImage(input) {
        if(input.files && input.files[0]) {
            const file = input.files[0];
            this.incidentImages.push(file);
            
            const grid = document.getElementById('incident-images-grid');
            const preview = document.createElement('div');
            preview.className = "relative aspect-video rounded-2xl overflow-hidden border border-[#324d67]";
            preview.innerHTML = `
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/20"></div>
            `;
            grid.prepend(preview);
        }
    }

    async saveIncident() {
        const desc = document.getElementById('inc-desc').value;
        const type = document.getElementById('inc-type').value;
        const btn = document.getElementById('btn-submit-incident');

        if(!desc || this.incidentImages.length === 0) return alert("Por favor describe lo sucedido y toma al menos una foto de evidencia.");

        btn.innerText = "ENVIANDO REPORTE...";
        btn.disabled = true;

        try {
            const uploadedUrls = [];
            for (let img of this.incidentImages) {
                const fName = `incident_${Date.now()}_${img.name}`;
                const { data } = await supabase.storage.from('incident-evidence').upload(fName, img);
                if(data) {
                    const { data: { publicUrl } } = supabase.storage.from('incident-evidence').getPublicUrl(fName);
                    uploadedUrls.push(publicUrl);
                }
            }

            const { error } = await supabase.from('incidents').insert({
                driver_id: this.userId,
                vehicle_id: this.currentTrip?.vehicle_id,
                type: type,
                description: desc,
                evidence_urls: uploadedUrls,
                severity: (type === 'accident' || type === 'theft') ? 'critical' : 'medium',
                status: 'reported'
            });

            if(!error) {
                alert("¡REPORTE ENVIADO! El centro de control ha sido notificado.");
                document.getElementById('modal-incident').classList.add('hidden');
                this.incidentImages = [];
                document.getElementById('inc-desc').value = "";
            }
        } catch (e) { alert("Error: " + e.message); }
        finally { btn.innerText = "Enviar Reporte de Auxilio"; btn.disabled = false; }
    }

    // --- DASHBOARD Y QR ---
    async loadDashboardState() {
        const { data: trip } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();
        this.currentTrip = trip;
        
        const cont = document.getElementById('unidad-content');
        if(!trip) {
            cont.innerHTML = `<div class="bg-[#1c2127] p-8 rounded-3xl border border-[#233648] text-center space-y-4">
                <div class="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto"><span class="material-symbols-outlined text-3xl">search</span></div>
                <p class="text-sm">No tienes unidades asignadas.</p>
                <button onclick="window.conductorModule.loadAvailable()" class="w-full py-3 bg-primary text-white font-bold rounded-xl">Solicitar Unidad</button>
            </div>`;
        } else {
            cont.innerHTML = `<div class="bg-gradient-to-br from-primary/20 to-transparent p-6 rounded-3xl border border-primary/30 text-center">
                <p class="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Unidad en Operación</p>
                <h2 class="text-4xl font-black text-white leading-none">${trip.vehicles.plate}</h2>
                <p class="text-slate-400 mt-2 text-sm">${trip.vehicles.model}</p>
            </div>`;
        }
        this.generateQR();
    }

    generateQR() {
        const qrImg = document.getElementById('card-qr');
        if(!qrImg) return;
        if (this.currentTrip) {
            const data = { t_id: this.currentTrip.id, v_id: this.currentTrip.vehicle_id, d_id: this.userId };
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(data))}&color=111a22`;
            document.getElementById('qr-assignment-status').innerText = "PASE AUTORIZADO ✅";
            document.getElementById('qr-assignment-status').className = "text-[10px] font-black text-emerald-500 uppercase tracking-widest";
        } else {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=no_trip&color=cbd5e1`;
            document.getElementById('qr-assignment-status').innerText = "SIN ASIGNACIÓN ACTIVA";
            document.getElementById('qr-assignment-status').className = "text-[10px] font-black text-slate-400 uppercase tracking-widest";
        }
    }

    // (Omitidos por brevedad los métodos de tracking e historial que ya tenías y funcionan bien)
    setupTrackingToggle() { /* ... */ }
    async loadHistory() { /* ... */ }
}
