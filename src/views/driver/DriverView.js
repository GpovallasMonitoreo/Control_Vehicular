import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null;
        this.profile = null;
        this.currentTrip = null;
        this.watchPositionId = null;
        this.map = null; // Para la ruta en vivo
        this.marker = null;
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold truncate">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="relative flex h-2 w-2">
                                    <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span class="relative rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span id="profile-status" class="text-[#92adc9] text-[10px] font-bold uppercase">Disponible</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.logoutDriver()" class="h-10 w-10 bg-[#233648] border border-[#324d67] rounded-full text-white flex items-center justify-center">
                        <span class="material-symbols-outlined text-sm">logout</span>
                    </button>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative pb-24">
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4">
                        <h3 class="text-white text-xs font-bold uppercase tracking-widest opacity-70">Selección de Unidad</h3>
                        <div id="unidad-content" class="space-y-3"></div>
                    </section>

                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4">
                        <div class="bg-[#192633] border border-[#233648] rounded-2xl p-5 shadow-xl">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">fact_check</span> Validación Mecánica
                            </h3>
                            <div id="checklist-content" class="space-y-3">
                                </div>
                        </div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        <div id="live-map" class="w-full flex-1 bg-slate-900"></div>
                        <div class="p-5 bg-[#111a22] border-t border-[#233648] grid grid-cols-2 gap-4">
                            <div class="bg-[#192633] p-3 rounded-xl border border-[#233648] text-center">
                                <p class="text-[10px] text-[#92adc9] font-bold uppercase mb-1">Velocidad</p>
                                <span id="live-speed" class="text-2xl font-black text-white">0</span> <small class="text-white/50 text-[10px]">km/h</small>
                            </div>
                            <div class="bg-[#192633] p-3 rounded-xl border border-[#233648] text-center">
                                <p class="text-[10px] text-[#92adc9] font-bold uppercase mb-1">Distancia</p>
                                <span id="live-distance" class="text-2xl font-black text-white">0.0</span> <small class="text-white/50 text-[10px]">km</small>
                            </div>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-5">
                        <div class="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
                            <div class="w-full flex justify-between items-start mb-6">
                                <div class="text-left">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gafete Digital</span>
                                    <h3 id="card-full-name" class="text-slate-900 text-xl font-bold leading-none">--</h3>
                                </div>
                                <div class="h-14 w-14 bg-slate-100 rounded-xl border border-slate-200 bg-cover bg-center shadow-md" id="card-photo"></div>
                            </div>

                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 w-full">
                                <div id="qr-container" class="bg-white p-2 rounded-xl shadow-inner border border-slate-200 mx-auto w-fit">
                                    <img id="card-qr" class="w-40 h-40 opacity-20" src="" alt="QR Acceso">
                                </div>
                                <p id="qr-status-msg" class="text-[10px] text-slate-500 font-bold mt-3 uppercase tracking-tighter">Sin unidad vinculada</p>
                            </div>

                            <div class="w-full text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 class="text-slate-800 text-xs font-black uppercase mb-3 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm text-primary">description</span> Documentos
                                </h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center border-b pb-2">
                                        <span class="text-[11px] text-slate-500 font-bold uppercase">Licencia de Conducir</span>
                                        <span id="lic-number" class="text-slate-800 text-xs font-mono font-bold">--</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-[11px] text-slate-500 font-bold uppercase">Vigencia</span>
                                        <span id="lic-expiry" class="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase">Vigente</span>
                                    </div>
                                </div>
                            </div>
                            <button onclick="window.print()" class="mt-4 w-full py-3 bg-[#111a22] text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined text-sm">print</span> Imprimir Gafete de Salida
                            </button>
                        </div>
                    </section>
                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-20 z-30 pb-safe">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active text-primary flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">directions_car</span><span class="text-[9px] font-bold uppercase">Unidad</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">fact_check</span><span class="text-[9px] font-bold uppercase">Check</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">route</span><span class="text-[9px] font-bold uppercase">Ruta</span>
                    </button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn text-slate-500 flex flex-col items-center gap-1">
                        <span class="material-symbols-outlined">person</span><span class="text-[9px] font-bold uppercase">Perfil</span>
                    </button>
                </nav>

                <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-sm">
                    <div class="bg-[#1c2127] w-full rounded-t-3xl p-6 border-t border-red-500/30">
                        <h3 class="text-white font-bold text-lg mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-red-500">warning</span> Reportar Incidente</h3>
                        <textarea id="inc-desc" class="w-full bg-[#111a22] border border-[#233648] text-white p-4 rounded-xl outline-none mb-4 h-32" placeholder="Describe lo sucedido..."></textarea>
                        <div class="flex gap-3">
                            <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs">Cancelar</button>
                            <button id="btn-send-incident" class="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold uppercase text-xs">Enviar Reporte</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async onMount() {
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        
        await this.loadProfileData();
        await this.loadDashboardState();
        this.initLiveMap();

        // Suscripción a cambios en Supabase
        supabase.channel('driver_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
            this.loadDashboardState();
        }).subscribe();
    }

    // --- MAPA EN VIVO ---
    initLiveMap() {
        if (!window.L) return;
        this.map = L.map('live-map', { zoomControl: false }).setView([19.4326, -99.1332], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
        
        this.marker = L.marker([19.4326, -99.1332], {
            icon: L.divIcon({ className: 'bg-primary w-4 h-4 rounded-full border-2 border-white shadow-lg' })
        }).addTo(this.map);
    }

    startTracking() {
        if (!navigator.geolocation) return;
        this.watchPositionId = navigator.geolocation.watchPosition((pos) => {
            const { latitude, longitude, speed } = pos.coords;
            const latlng = [latitude, longitude];
            this.map.panTo(latlng);
            this.marker.setLatLng(latlng);
            document.getElementById('live-speed').innerText = Math.round((speed || 0) * 3.6);
        }, null, { enableHighAccuracy: true });
    }

    // --- CARGA DE ESTADOS ---
    async loadProfileData() {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(p) {
            this.profile = p;
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('card-full-name').innerText = p.full_name;
            document.getElementById('card-photo').style.backgroundImage = `url('${p.photo_url || ''}')`;
            document.getElementById('lic-number').innerText = p.license_number || 'A-XXXXXXXX';
        }
    }

    async loadDashboardState() {
        const { data: trip } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();
        this.currentTrip = trip;
        
        const unityCont = document.getElementById('unidad-content');
        const checkCont = document.getElementById('checklist-content');

        if (!trip) {
            this.renderAvailableUnits(unityCont);
            document.getElementById('profile-status').innerText = "Disponible";
            this.generateQR(null);
        } else {
            unityCont.innerHTML = `
                <div class="bg-primary/10 border border-primary/30 p-5 rounded-2xl text-center">
                    <p class="text-[10px] font-bold text-primary uppercase mb-1">Unidad Asignada</p>
                    <h2 class="text-2xl font-black text-white">${trip.vehicles.plate}</h2>
                    <p class="text-xs text-slate-400 mt-1">${trip.vehicles.model}</p>
                </div>
            `;

            // Lógica de Checklist y Mecánico
            this.renderMechanicChecklist(trip, checkCont);
            this.generateQR(trip);

            if (trip.status === 'in_progress') {
                document.getElementById('profile-status').innerText = "En Ruta";
                this.startTracking();
            }
        }
    }

    async renderAvailableUnits(container) {
        const { data: vehs } = await supabase.from('vehicles').select('*').eq('status', 'active');
        if(!vehs || vehs.length === 0) { container.innerHTML = '<p class="text-slate-500 text-center py-10">Sin unidades disponibles.</p>'; return; }
        
        container.innerHTML = vehs.map(v => `
            <div onclick="window.conductorModule.requestUnit('${v.id}')" class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex justify-between items-center cursor-pointer hover:border-primary">
                <div><p class="text-white font-bold">${v.plate}</p><p class="text-[10px] text-slate-500">${v.model}</p></div>
                <span class="material-symbols-outlined text-primary">add_circle</span>
            </div>
        `).join('');
    }

    renderMechanicChecklist(trip, container) {
        const items = [
            { n: 'Líquidos y Aceite', k: 'oil' },
            { n: 'Anticongelante', k: 'coolant' },
            { n: 'Sistema de Luces', k: 'lights' },
            { n: 'Estado de Llantas', k: 'tires' }
        ];

        if (trip.status === 'requested') {
            container.innerHTML = `
                <div class="text-center py-6">
                    <div class="animate-spin text-primary mb-3"><span class="material-symbols-outlined text-4xl">autorenew</span></div>
                    <p class="text-white font-bold">Solicitud Pendiente</p>
                    <p class="text-xs text-slate-500 mt-2">Dirígete con el <b class="text-primary">MECÁNICO</b> para la validación física de la unidad.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="space-y-2 mb-6">
                    ${items.map(i => `
                        <div class="flex justify-between items-center bg-[#111a22] p-3 rounded-lg border border-[#233648]">
                            <span class="text-xs text-white">${i.n}</span>
                            <span class="text-[10px] font-black text-green-500 uppercase">OK - Verificado</span>
                        </div>
                    `).join('')}
                </div>
                <div class="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30 mb-4">
                    <p class="text-[10px] text-blue-400 font-bold uppercase mb-1">Evidencia Mecánica</p>
                    <p class="text-xs text-white">Fotos frontales, traseras y laterales verificadas en sistema.</p>
                </div>
                <button onclick="window.conductorModule.confirmReception('${trip.id}')" class="w-full py-4 bg-primary text-white font-black rounded-xl uppercase text-xs shadow-lg">Confirmar y Recibir Unidad</button>
            `;
        }
    }

    async requestUnit(id) {
        if(!confirm("¿Deseas solicitar esta unidad para revisión?")) return;
        await supabase.from('trips').insert({ driver_id: this.userId, vehicle_id: id, status: 'requested' });
        this.loadDashboardState();
    }

    async confirmReception(id) {
        await supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', id);
        this.switchTab('perfil');
        this.loadDashboardState();
    }

    generateQR(trip) {
        const qrImg = document.getElementById('card-qr');
        const statusMsg = document.getElementById('qr-status-msg');

        if (trip && (trip.status === 'driver_accepted' || trip.status === 'in_progress')) {
            const data = JSON.stringify({
                t_id: trip.id,
                v_id: trip.vehicle_id,
                plate: trip.vehicles.plate,
                d_id: this.userId,
                auth: 'OK'
            });
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}&color=0d141c`;
            qrImg.classList.remove('opacity-20');
            statusMsg.innerHTML = `PASE AUTORIZADO: <b class="text-primary">${trip.vehicles.plate}</b>`;
        } else {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=empty`;
            qrImg.classList.add('opacity-20');
            statusMsg.innerText = "Sin unidad vinculada";
        }
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active', 'text-primary'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('active', 'text-primary');
        if(tabId === 'ruta') {
            setTimeout(() => this.map.invalidateSize(), 200);
        }
    }

    translateStatus(s) {
        const d = { requested: 'En Taller', mechanic_approved: 'Aprobado Taller', driver_accepted: 'Pase Activo', in_progress: 'En Ruta' };
        return d[s] || s;
    }
}
