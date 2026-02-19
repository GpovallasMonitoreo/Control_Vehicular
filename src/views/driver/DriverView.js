import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.activeTab = 'unidad';
        this.userId = null;
        this.profile = null;
        this.currentTrip = null;
        this.map = null;
        this.pathLine = null;
        this.watchPositionId = null;
        
        window.conductorModule = this;
    }

    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold truncate tracking-tight">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="relative flex h-2 w-2"><span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                                <span id="profile-status" class="text-[#92adc9] text-[10px] font-bold uppercase">Disponible</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.logoutDriver()" class="text-slate-400 hover:text-red-400 transition-colors"><span class="material-symbols-outlined">logout</span></button>
                </header>

                <main class="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0d141c] pb-24">
                    
                    <section id="tab-unidad" class="tab-content block p-5 space-y-4 animate-fade-in">
                        <h3 class="text-white text-xs font-black uppercase tracking-widest opacity-60">Flota Disponible</h3>
                        <div id="unidad-content" class="space-y-3"></div>
                    </section>

                    <section id="tab-checklist" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div id="checklist-content"></div>
                    </section>

                    <section id="tab-ruta" class="tab-content hidden h-full flex flex-col">
                        <div id="driver-map" class="w-full flex-1 bg-slate-900"></div>
                        <div class="bg-[#111a22] border-t border-[#324d67] p-5 shrink-0">
                            <div class="flex justify-between items-center mb-4">
                                <div>
                                    <p class="text-[10px] text-[#92adc9] font-bold uppercase tracking-widest">Velocidad</p>
                                    <p id="track-speed" class="text-3xl font-black text-white">0 <span class="text-xs text-slate-500 font-normal">km/h</span></p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] text-[#92adc9] font-bold uppercase tracking-widest">Distancia</p>
                                    <p id="track-distance" class="text-xl font-black text-primary">0.0 km</p>
                                </div>
                            </div>
                            <button id="btn-finish-trip" class="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg hidden uppercase tracking-widest text-xs">Cerrar Viaje y Entrega</button>
                        </div>
                    </section>

                    <section id="tab-perfil" class="tab-content hidden p-5 space-y-4 animate-fade-in">
                        <div class="bg-white rounded-2xl overflow-hidden shadow-xl">
                            <div class="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 id="profile-full-name" class="text-slate-900 text-lg font-bold leading-none">--</h3>
                                    <p id="profile-id" class="text-slate-500 text-[10px] mt-1 font-mono uppercase tracking-tighter">ID: --</p>
                                </div>
                                <div id="profile-large-avatar" class="h-14 w-14 bg-slate-200 rounded-xl bg-cover bg-center border border-slate-200"></div>
                            </div>
                            <div class="p-6 space-y-5">
                                <div class="space-y-3">
                                    <h5 class="text-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <span class="material-symbols-outlined text-primary text-sm">badge</span> Licencia Federal
                                    </h5>
                                    <div class="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <label class="text-[9px] font-bold text-slate-400 uppercase">Número</label>
                                            <p id="doc-license-num" class="text-xs font-bold text-slate-700">--</p>
                                        </div>
                                        <div>
                                            <label class="text-[9px] font-bold text-slate-400 uppercase">Vigencia</label>
                                            <p id="doc-license-exp" class="text-xs font-bold text-slate-700">--</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                                    <div class="font-black tracking-widest text-[10px] opacity-50 mb-3">PASE DE SALIDA AUTORIZADO</div>
                                    <div class="bg-white p-3 rounded-xl inline-block mb-3">
                                        <img id="card-qr" class="w-32 h-32" src=""/>
                                    </div>
                                    <div id="qr-info" class="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Escanear en Caseta</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <nav class="absolute bottom-0 w-full bg-[#111a22] border-t border-[#233648] flex justify-around items-center h-16 px-2 z-30 pb-safe">
                    <button onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" class="nav-btn active flex flex-col items-center gap-1 text-[#92adc9] transition-all"><span class="material-symbols-outlined">directions_car</span><span class="text-[9px] font-bold uppercase">Unidad</span></button>
                    <button onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" class="nav-btn flex flex-col items-center gap-1 text-[#92adc9] transition-all"><span class="material-symbols-outlined">fact_check</span><span class="text-[9px] font-bold uppercase">Check</span></button>
                    <button onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" class="nav-btn flex flex-col items-center gap-1 text-[#92adc9] transition-all"><span class="material-symbols-outlined">map</span><span class="text-[9px] font-bold uppercase">Ruta</span></button>
                    <button onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" class="nav-btn flex flex-col items-center gap-1 text-[#92adc9] transition-all"><span class="material-symbols-outlined">person</span><span class="text-[9px] font-bold uppercase">Perfil</span></button>
                </nav>

                <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                    <div class="bg-[#1c2127] w-full rounded-2xl p-6 border border-red-500/30">
                        <h3 class="text-white font-bold mb-4">Reportar Incidente</h3>
                        <textarea id="inc-desc" class="w-full bg-[#0d141c] border border-[#324d67] text-white p-3 rounded-xl mb-4 h-24 outline-none" placeholder="Describe lo sucedido..."></textarea>
                        <button onclick="window.conductorModule.submitIncident()" class="w-full py-4 bg-red-600 text-white font-bold rounded-xl">Enviar Reporte</button>
                        <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="w-full mt-2 text-slate-500 text-xs">Cancelar</button>
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async onMount() {
        this.userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        await this.loadProfileData();
        await this.refreshDashboard();

        // Suscripción Realtime para detectar cuando el mecánico aprueba
        supabase.channel('trips_changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, 
        (payload) => {
            this.refreshDashboard();
            if(navigator.vibrate) navigator.vibrate(200);
        }).subscribe();
    }

    async refreshDashboard() {
        const { data: trip } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();
        this.currentTrip = trip;

        const unidadCont = document.getElementById('unidad-content');
        const checkCont = document.getElementById('checklist-content');

        if (!trip) {
            this.renderAvailableVehicles(unidadCont);
            checkCont.innerHTML = `<div class="text-center py-20 text-slate-500">No hay unidad asignada.</div>`;
            document.getElementById('profile-status').innerText = "Disponible";
        } else {
            unidadCont.innerHTML = `<div class="bg-[#192633] p-5 rounded-2xl border border-primary/30 text-center"><div class="text-[10px] text-primary font-bold uppercase mb-1">Unidad Asignada</div><div class="text-2xl font-black text-white">${trip.vehicles.plate}</div><p class="text-xs text-slate-400 mt-1">${trip.vehicles.model}</p></div>`;
            this.renderChecklist(trip, checkCont);
            document.getElementById('profile-status').innerText = this.translateStatus(trip.status);
        }
        this.generateQR();
    }

    renderChecklist(trip, container) {
        if (trip.status === 'requested') {
            container.innerHTML = `<div class="bg-[#1c2127] border border-orange-500/20 rounded-2xl p-8 text-center"><span class="material-symbols-outlined text-5xl text-orange-500 mb-4 animate-spin">build</span><h4 class="text-white font-bold uppercase">En Taller</h4><p class="text-xs text-slate-400 mt-2 leading-relaxed">Favor de dirigirse con el <b>Mecánico de Guardia</b> para la inspección física de la unidad.</p></div>`;
        } else if (trip.status === 'mechanic_approved') {
            container.innerHTML = `
                <div class="space-y-5">
                    <div class="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 text-center">
                        <span class="material-symbols-outlined text-green-500 text-4xl mb-2">verified</span>
                        <h4 class="text-white font-black uppercase">Unidad Liberada</h4>
                        <p class="text-[10px] text-slate-400">Verificado por Taller Central</p>
                    </div>
                    <div class="bg-[#1c2127] rounded-xl p-4 border border-[#324d67] space-y-2">
                        <div class="flex justify-between text-xs text-white"><span>Aceite y Líquidos</span><b class="text-green-400">OK</b></div>
                        <div class="flex justify-between text-xs text-white"><span>Llantas y Luces</span><b class="text-green-400">OK</b></div>
                        <div class="flex justify-between text-xs text-white"><span>Fotos Evidencia</span><b class="text-green-400">CARGADAS</b></div>
                    </div>
                    <button onclick="window.conductorModule.acceptUnit('${trip.id}')" class="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">Aceptar y Recibir Unidad</button>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center text-emerald-400"><span class="material-symbols-outlined text-5xl mb-4">check_circle</span><h4 class="font-bold">UNIDAD AUTORIZADA</h4><p class="text-xs opacity-70">Pase activo para el servicio actual.</p></div>`;
        }
    }

    async renderAvailableVehicles(container) {
        const { data: v } = await supabase.from('vehicles').select('*').eq('status', 'active');
        container.innerHTML = (v || []).map(veh => `
            <div class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex justify-between items-center">
                <div><p class="text-white font-bold text-sm">${veh.model}</p><p class="text-[10px] text-slate-400 font-mono">${veh.plate}</p></div>
                <button onclick="window.conductorModule.requestVehicle('${veh.id}')" class="bg-primary text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter">Solicitar</button>
            </div>
        `).join('');
    }

    generateQR() {
        const qrImg = document.getElementById('card-qr');
        const info = document.getElementById('qr-info');
        
        if (this.currentTrip && (this.currentTrip.status === 'driver_accepted' || this.currentTrip.status === 'in_progress')) {
            // Requisito: Quién, para qué, quién autoriza
            const qrPayload = {
                t_id: this.currentTrip.id,
                v_id: this.currentTrip.vehicle_id,
                plate: this.currentTrip.vehicles.plate,
                auth_by: 'MECANICO-CENTRAL',
                reason: 'SERVICIO-ACTIVO',
                driver: this.profile?.full_name
            };
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(JSON.stringify(qrPayload))}&color=0d141c`;
            qrImg.parentElement.classList.remove('opacity-20');
            info.innerHTML = `PASE ACTIVO: <span class="text-white">${this.currentTrip.vehicles.plate}</span>`;
            document.getElementById('qr-assignment-status').innerText = "ASIGNACIÓN VIGENTE";
        } else {
            qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=SIN-AUTORIZACION";
            qrImg.parentElement.classList.add('opacity-20');
            info.innerText = "ESPERANDO AUTORIZACIÓN";
        }
    }

    // --- LOGICA DE MAPA (RUTA EN VIVO) ---
    initMap() {
        if (this.map) return;
        const L = window.L;
        this.map = L.map('driver-map', { zoomControl: false }).setView([19.4785, -99.2396], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(this.map);
        this.pathLine = L.polyline([], { color: '#137fec', weight: 5, opacity: 0.8 }).addTo(this.map);
    }

    startTracking() {
        this.initMap();
        if (!navigator.geolocation) return;
        
        this.watchPositionId = navigator.geolocation.watchPosition(async (pos) => {
            const latlng = [pos.coords.latitude, pos.coords.longitude];
            const speed = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(0) : '0';
            
            this.map.panTo(latlng);
            this.pathLine.addLatLng(latlng);
            document.getElementById('track-speed').innerText = speed;

            // Enviar a Supabase para Torre de Control
            if (this.currentTrip) {
                await supabase.from('trip_locations').insert({
                    trip_id: this.currentTrip.id,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    speed: speed
                });
            }
        }, (err) => console.warn(err), { enableHighAccuracy: true });
    }

    // --- SOPORTE ---
    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('text-primary', 'active'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        document.getElementById(`nav-${tabId}`).classList.add('text-primary', 'active');
        
        if (tabId === 'ruta') this.startTracking();
        if (tabId === 'perfil') this.generateQR();
    }

    async loadProfileData() {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', this.userId).single();
        if(p) {
            this.profile = p;
            document.getElementById('profile-name').innerText = p.full_name;
            document.getElementById('profile-full-name').innerText = p.full_name;
            document.getElementById('profile-id').innerText = `ID: ${p.employee_id || '---'}`;
            document.getElementById('doc-license-num').innerText = p.license_number || 'PENDIENTE';
            document.getElementById('doc-license-exp').innerText = p.license_expiry || 'N/D';
            
            const avatar = `url('${p.photo_url || `https://ui-avatars.com/api/?name=${p.full_name}&background=137fec&color=fff`}')`;
            document.getElementById('profile-avatar').style.backgroundImage = avatar;
            document.getElementById('profile-large-avatar').style.backgroundImage = avatar;
        }
    }

    async requestVehicle(id) {
        const { error } = await supabase.from('trips').insert({ vehicle_id: id, driver_id: this.userId, status: 'requested' });
        if(!error) this.refreshDashboard();
    }

    async acceptUnit(tripId) {
        await supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', tripId);
        this.refreshDashboard();
        this.switchTab('perfil');
    }

    translateStatus(s) {
        const dict = { 'requested': 'En Taller', 'mechanic_approved': 'Listo', 'driver_accepted': 'Autorizado', 'in_progress': 'En Ruta' };
        return dict[s] || s;
    }
}
