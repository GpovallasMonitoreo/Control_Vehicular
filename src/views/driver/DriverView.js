import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    
    render() {
        return `
        <div class="fixed inset-0 w-full h-full bg-[#0d141c] font-display flex justify-center overflow-hidden">
            
            <div class="w-full md:max-w-md bg-[#111a22] h-full relative shadow-2xl border-x border-[#233648] flex flex-col">
                
                <header class="w-full shrink-0 flex items-center justify-between border-b border-[#233648] px-5 py-4 bg-[#111a22] z-20">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div id="profile-avatar" class="shrink-0 h-12 w-12 rounded-full border-2 border-primary bg-slate-700 bg-cover bg-center shadow-lg"></div>
                        <div class="flex-1 min-w-0">
                            <h2 id="profile-name" class="text-white text-sm font-bold leading-tight truncate">Cargando...</h2>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="relative flex h-2 w-2 shrink-0">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span id="profile-status" class="text-[#92adc9] text-xs font-medium truncate">Conectado</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="window.location.reload()" class="flex items-center justify-center rounded-full h-10 w-10 bg-[#233648] border border-[#324d67] hover:bg-[#2d445a] transition-colors text-white">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                        </button>
                        <button onclick="window.logoutDriver()" class="flex items-center justify-center rounded-full h-10 w-10 bg-[#233648] border border-[#324d67] hover:bg-red-900/30 hover:border-red-500/50 transition-colors text-white hover:text-red-400">
                            <span class="material-symbols-outlined text-sm">logout</span>
                        </button>
                    </div>
                </header>

                <main class="flex-1 flex flex-col gap-5 p-5 overflow-y-auto scroll-smooth pb-24 w-full">
                    
                    <section id="status-banner" class="hidden w-full p-5 rounded-2xl shadow-lg animate-fade-in flex-col items-center justify-center text-center border-2 mx-auto">
                        <span id="status-icon" class="material-symbols-outlined text-4xl mb-2 text-white">info</span>
                        <h2 id="status-title" class="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">ESTADO</h2>
                        <p id="status-desc" class="text-xs font-bold text-white/90 uppercase tracking-widest">Descripción</p>
                    </section>

                    <section class="grid grid-cols-2 gap-3 w-full">
                        <div class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex flex-col items-center justify-center relative overflow-hidden group">
                            <div class="absolute top-2 right-2">
                                <span class="material-symbols-outlined text-[14px] text-success">verified</span>
                            </div>
                            <p class="text-[10px] text-[#92adc9] font-bold uppercase tracking-wider mb-1">Confianza</p>
                            <div class="flex items-baseline gap-1">
                                <span id="stat-score" class="text-3xl font-black text-white">--</span>
                                <span class="text-[10px] text-success font-bold">/100</span>
                            </div>
                            <div class="w-full h-1 bg-[#233648] rounded-full mt-2 overflow-hidden">
                                <div id="stat-bar" class="w-[0%] h-full bg-success rounded-full transition-all duration-1000"></div>
                            </div>
                        </div>
                        <div class="bg-[#192633] p-4 rounded-xl border border-[#233648] flex flex-col items-center justify-center relative overflow-hidden">
                            <p class="text-[10px] text-[#92adc9] font-bold uppercase tracking-wider mb-1">Puntos</p>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-warning text-xl">monetization_on</span>
                                <span class="text-3xl font-black text-white">2,450</span>
                            </div>
                        </div>
                    </section>

                    <section class="flex gap-3 w-full">
                        <button id="btn-dashboard-start" class="relative group flex-1 overflow-hidden rounded-xl bg-primary hover:bg-blue-600 text-white shadow-lg transition-all active:scale-[0.98]">
                            <div class="relative flex flex-col items-center justify-center h-24 gap-1 p-2">
                                <span class="material-symbols-outlined text-3xl">play_circle</span>
                                <span class="text-xs font-bold tracking-wide uppercase">Solicitar Unidad</span>
                            </div>
                        </button>
                        <button id="btn-dashboard-end" disabled class="relative group flex-1 overflow-hidden rounded-xl bg-[#233648] hover:bg-[#2d445a] text-white border border-[#344a5e] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                            <div class="relative flex flex-col items-center justify-center h-24 gap-1 p-2">
                                <span id="icon-dashboard-end" class="material-symbols-outlined text-3xl text-red-400">assignment_turned_in</span>
                                <span id="txt-dashboard-end" class="text-xs font-bold tracking-wide uppercase">Cerrar Viaje</span>
                            </div>
                        </button>
                    </section>

                    <section class="w-full rounded-2xl bg-white p-5 shadow-xl qr-brightness relative overflow-hidden">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex flex-col">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Gafete Digital</span>
                                <h3 id="card-name" class="text-slate-900 text-lg font-bold truncate max-w-[150px]">--</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                                <div id="card-photo" class="h-full w-full bg-cover bg-center"></div>
                            </div>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-4 flex flex-col items-center border border-slate-100">
                            <div class="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-2">
                                <img id="card-qr" alt="QR Conductor" class="w-32 h-32 opacity-90" src=""/>
                            </div>
                            <p id="card-id" class="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">ID: --</p>
                        </div>
                    </section>

                    <section id="vehicle-section" class="hidden w-full animate-fade-in-up">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-white text-xs font-semibold uppercase tracking-widest opacity-70">Vehículo Asignado</h3>
                        </div>
                        <div class="flex flex-col gap-4 rounded-xl bg-[#192633] p-4 shadow-lg border border-[#233648]">
                            <div class="flex justify-between items-start">
                                <div class="flex flex-col gap-1">
                                    <p id="veh-model" class="text-white text-base font-bold">--</p>
                                    <p class="text-[#92adc9] text-xs flex items-center gap-1">
                                        <span class="material-symbols-outlined text-sm">directions_car</span>
                                        <span id="veh-plate">--</span>
                                    </p>
                                </div>
                                <div id="veh-status-badge" class="bg-warning/10 text-warning px-2 py-1 rounded text-[10px] font-bold border border-warning/20">
                                    PENDIENTE
                                </div>
                            </div>
                        </div>
                    </section>
                    
                </main>

                <div class="shrink-0 w-full bg-[#111a22] border-t border-[#233648] z-30 safe-area-inset-bottom p-4 shadow-lg">
                    <button onclick="document.getElementById('modal-incident').classList.remove('hidden')" class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 shadow-lg transition-all active:scale-[0.98]">
                        <span class="material-symbols-outlined mr-2 text-[20px]">warning</span>
                        <span class="text-xs font-bold uppercase tracking-widest">Reportar Incidente / Multa</span>
                    </button>
                </div>

            </div>
            
            <div id="modal-request" class="hidden absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4">
                <div class="bg-[#1c2127] w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-3xl border-t sm:border border-[#324d67] shadow-2xl flex flex-col">
                    <div class="flex justify-between items-center p-6 border-b border-[#324d67] shrink-0">
                        <div><h3 class="text-white text-xl font-bold">Solicitud de Salida</h3></div>
                        <button onclick="document.getElementById('modal-request').classList.add('hidden')" class="text-slate-400 p-2"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-primary uppercase">1. Seleccionar Unidad</label>
                            <select id="request-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-4 text-lg outline-none focus:border-primary"></select>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-[#324d67]">
                            <label class="text-xs font-bold text-primary uppercase">2. Evidencia (Cámara)</label>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="relative"><input type="file" accept="image/*" capture="environment" id="req-img-1" class="hidden"><label for="req-img-1" id="lbl-req-1" class="flex flex-col items-center justify-center h-28 bg-[#111a22] border-2 border-dashed border-[#324d67] rounded-xl text-slate-400 cursor-pointer bg-cover bg-center"><span class="material-symbols-outlined">directions_car</span><span class="text-[10px]">FRENTE</span></label></div>
                                <div class="relative"><input type="file" accept="image/*" capture="environment" id="req-img-2" class="hidden"><label for="req-img-2" id="lbl-req-2" class="flex flex-col items-center justify-center h-28 bg-[#111a22] border-2 border-dashed border-[#324d67] rounded-xl text-slate-400 cursor-pointer bg-cover bg-center"><span class="material-symbols-outlined">local_shipping</span><span class="text-[10px]">LADOS</span></label></div>
                            </div>
                        </div>
                        <div class="space-y-2 pt-4 border-t border-[#324d67]">
                            <label class="text-xs font-bold text-primary uppercase">3. Checklist Inicial</label>
                            <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Llantas OK</span><input type="checkbox" id="check-tires" class="w-5 h-5 rounded bg-slate-800 text-primary"></label>
                            <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Luces OK</span><input type="checkbox" id="check-lights" class="w-5 h-5 rounded bg-slate-800 text-primary"></label>
                            <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Licencia Vigente</span><input type="checkbox" id="check-license" class="w-5 h-5 rounded bg-slate-800 text-primary"></label>
                            <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Uniforme Completo</span><input type="checkbox" id="check-uniform" class="w-5 h-5 rounded bg-slate-800 text-primary"></label>
                        </div>
                    </div>
                    <div class="p-6 border-t border-[#324d67] bg-[#151b23] shrink-0">
                        <button id="btn-confirm-request" disabled class="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">ENVIAR TODO</button>
                    </div>
                </div>
            </div>

            <div id="modal-return" class="hidden absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4">
                <div class="bg-[#1c2127] w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-3xl border-t sm:border border-[#324d67] shadow-2xl flex flex-col">
                    <div class="flex justify-between items-center p-6 border-b border-[#324d67] bg-orange-500/5 shrink-0">
                        <div><h3 class="text-white text-xl font-bold">Entrega de Unidad</h3><p class="text-orange-500 text-xs">Confirmar devolución</p></div>
                        <button onclick="document.getElementById('modal-return').classList.add('hidden')" class="text-slate-400 p-2"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div>
                            <label class="text-xs font-bold text-orange-500 uppercase mb-2 block">Km Final</label>
                            <input id="return-km" type="number" class="w-full bg-[#0d141c] border border-[#324d67] rounded-xl p-4 text-white font-mono text-2xl font-bold focus:border-orange-500 outline-none" placeholder="00000">
                        </div>
                        <div class="pt-4 border-t border-[#324d67]">
                            <label class="text-xs font-bold text-orange-500 uppercase mb-2 block">Nivel de Gasolina</label>
                            <select id="return-fuel" class="w-full bg-[#0d141c] border border-[#324d67] rounded-xl p-3 text-white font-bold outline-none focus:border-orange-500">
                                <option value="">Seleccionar...</option><option value="1/4">1/4</option><option value="1/2">1/2</option><option value="3/4">3/4</option><option value="lleno">Lleno</option>
                            </select>
                        </div>
                        <div class="space-y-4 pt-4 border-t border-[#324d67]">
                             <label class="text-xs font-bold text-orange-500 uppercase">Evidencia de Entrega (Cámara)</label>
                             <div class="grid grid-cols-2 gap-3">
                                <div class="relative"><input type="file" accept="image/*" capture="environment" id="ret-img-1" class="hidden"><label for="ret-img-1" id="lbl-ret-1" class="flex flex-col items-center justify-center h-24 bg-[#111a22] border-2 border-dashed border-[#324d67] rounded-xl text-slate-400 cursor-pointer bg-cover bg-center"><span class="material-symbols-outlined">directions_car</span></label></div>
                                <div class="relative"><input type="file" accept="image/*" capture="environment" id="ret-img-2" class="hidden"><label for="ret-img-2" id="lbl-ret-2" class="flex flex-col items-center justify-center h-24 bg-[#111a22] border-2 border-dashed border-[#324d67] rounded-xl text-slate-400 cursor-pointer bg-cover bg-center"><span class="material-symbols-outlined">local_shipping</span></label></div>
                             </div>
                        </div>
                        <div class="space-y-2 pt-4 border-t border-[#324d67]">
                            <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Unidad Limpia</span><input type="checkbox" id="check-clean" class="w-5 h-5 rounded bg-slate-800 text-orange-500 accent-orange-500"></label>
                        </div>
                    </div>
                    <div class="p-6 border-t border-[#324d67] bg-[#151b23] shrink-0">
                        <button id="btn-confirm-return" disabled class="w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">FINALIZAR ENTREGA</button>
                    </div>
                </div>
            </div>

            <div id="modal-incident" class="hidden absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm sm:p-4">
                <div class="bg-[#1c2127] w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-3xl border-t sm:border border-red-500/50 shadow-2xl flex flex-col border border-red-900">
                    <div class="flex justify-between items-center p-6 border-b border-red-900/50 bg-red-900/10 shrink-0">
                        <div>
                            <h3 class="text-white text-xl font-bold">Reportar Incidente</h3>
                            <p class="text-red-400 text-xs">Avisar a central inmediatamente</p>
                        </div>
                        <button onclick="document.getElementById('modal-incident').classList.add('hidden')" class="text-slate-400 p-2"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <div>
                            <label class="text-xs font-bold text-red-500 uppercase mb-2 block">Tipo de Incidente</label>
                            <select id="inc-type" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500">
                                <option value="accident">Choque / Colisión</option>
                                <option value="fine">Multa de Tránsito</option>
                                <option value="breakdown">Falla Mecánica</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-red-500 uppercase mb-2 block">Descripción</label>
                            <textarea id="inc-desc" rows="3" class="w-full bg-[#0d141c] border border-red-900 rounded-xl p-3 text-white outline-none focus:border-red-500 placeholder-slate-600" placeholder="¿Qué sucedió?"></textarea>
                        </div>
                        <div>
                             <label class="text-xs font-bold text-red-500 uppercase flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-sm">camera_alt</span> Evidencia</label>
                             <div class="relative">
                                <input type="file" accept="image/*" capture="environment" id="inc-img" class="hidden">
                                <label for="inc-img" id="lbl-inc" class="flex flex-col items-center justify-center h-32 bg-[#111a22] border-2 border-dashed border-red-900 rounded-xl text-red-400 cursor-pointer hover:border-red-500 hover:text-white transition-all bg-cover bg-center">
                                    <span class="material-symbols-outlined text-3xl">add_a_photo</span>
                                    <span class="text-xs uppercase font-bold mt-2">Tomar Foto</span>
                                </label>
                             </div>
                        </div>
                    </div>
                    <div class="p-6 border-t border-red-900/50 bg-[#151b23] shrink-0">
                        <button id="btn-send-incident" class="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">send</span> ENVIAR REPORTE
                        </button>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    async onMount() {
        const userId = 'd0c1e2f3-0000-0000-0000-000000000001'; 
        this.userId = userId;

        window.logoutDriver = () => { if(confirm("¿Cerrar sesión?")) { localStorage.clear(); location.hash='#login'; location.reload(); }};
        
        await this.loadProfileData(userId);
        
        this.subscription = supabase
            .channel('driver_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `driver_id=eq.${userId}` }, 
            (payload) => {
                if(payload.new.status === 'arrived') { if(navigator.vibrate) navigator.vibrate([200, 100, 200]); }
                this.refreshDashboardState();
            })
            .subscribe();

        await this.refreshDashboardState();
        
        this.setupRequestForm();
        this.setupReturnForm();
        this.setupIncidentForm();
    }

    async loadProfileData(id) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
        if(profile) {
            document.getElementById('profile-name').innerText = profile.full_name;
            document.getElementById('profile-avatar').style.backgroundImage = `url('${profile.photo_url || ''}')`;
            document.getElementById('card-name').innerText = profile.full_name;
            document.getElementById('card-id').innerText = `ID: ${profile.employee_id || id.substring(0,8).toUpperCase()}`;
            document.getElementById('card-photo').style.backgroundImage = `url('${profile.photo_url || ''}')`;
            document.getElementById('card-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${id}`;
            document.getElementById('stat-score').innerText = profile.trust_score || 98;
            document.getElementById('stat-bar').style.width = `${profile.trust_score || 98}%`;
        }
    }

    async refreshDashboardState() {
        const btnStart = document.getElementById('btn-dashboard-start');
        const btnEnd = document.getElementById('btn-dashboard-end');
        const txtEnd = document.getElementById('txt-dashboard-end');
        const iconEnd = document.getElementById('icon-dashboard-end');
        const vehSection = document.getElementById('vehicle-section');
        const banner = document.getElementById('status-banner');

        const { data: trip } = await supabase.from('trips').select(`*, vehicles(*)`).eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();

        banner.className = "hidden";
        btnStart.classList.remove('hidden'); btnStart.disabled = false;
        btnEnd.disabled = true;
        btnEnd.className = "relative group flex-1 overflow-hidden rounded-xl bg-[#233648] hover:bg-[#2d445a] text-white border border-[#344a5e] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
        iconEnd.className = "material-symbols-outlined text-3xl text-red-400";
        vehSection.classList.add('hidden');
        document.getElementById('profile-status').innerText = "Disponible";

        if (trip) {
            btnStart.classList.add('hidden');
            vehSection.classList.remove('hidden');
            document.getElementById('veh-model').innerText = trip.vehicles.model;
            document.getElementById('veh-plate').innerText = trip.vehicles.plate;
            
            banner.classList.remove('hidden');
            banner.classList.add('flex');

            if (trip.status === 'requested') {
                document.getElementById('profile-status').innerText = "Solicitando...";
                setBanner('yellow', 'PENDIENTE', 'Esperando Supervisor', 'hourglass_top');
                txtEnd.innerText = "Esperando...";
            } else if (trip.status === 'approved') {
                document.getElementById('profile-status').innerText = "Aprobado";
                setBanner('green', 'APROBADO', 'Dirígete a la Caseta de Salida', 'verified');
                txtEnd.innerText = "Salida Autorizada";
            } else if (trip.status === 'open') {
                document.getElementById('profile-status').innerText = "En Ruta";
                setBanner('blue', 'EN RUTA', 'GPS Activo - Regresar a Caseta', 'local_shipping');
                txtEnd.innerText = "Pasar por Caseta 1°"; 
            } else if (trip.status === 'arrived') {
                document.getElementById('profile-status').innerText = "En Patio";
                setBanner('orange', 'EN PATIO', 'Finaliza el Viaje Ahora', 'garage');
                btnEnd.disabled = false;
                btnEnd.className = "relative group flex-1 overflow-hidden rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all active:scale-[0.98] animate-pulse";
                iconEnd.className = "material-symbols-outlined text-3xl text-white";
                txtEnd.innerText = "FINALIZAR ENTREGA";
                btnEnd.onclick = () => document.getElementById('modal-return').classList.remove('hidden');
            }
        } else {
            btnStart.onclick = () => { this.loadVehiclesToSelect(); document.getElementById('modal-request').classList.remove('hidden'); };
        }

        function setBanner(color, title, desc, iconName) {
            banner.className = `w-full p-5 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center border-2 mx-auto border-${color}-500 bg-${color}-500/10 mb-4`;
            document.getElementById('status-title').innerText = title;
            document.getElementById('status-title').className = `text-2xl font-black text-${color}-500 uppercase tracking-tighter leading-none mb-1`;
            document.getElementById('status-desc').innerText = desc;
            document.getElementById('status-desc').className = `text-xs font-bold text-${color}-200 uppercase tracking-widest`;
            document.getElementById('status-icon').innerText = iconName;
            document.getElementById('status-icon').className = `material-symbols-outlined text-4xl mb-2 text-${color}-500`;
        }
    }

    processImage(file, labelId, color) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const lbl = document.getElementById(labelId);
            lbl.style.backgroundImage = `url('${e.target.result}')`;
            lbl.classList.remove('border-dashed', 'text-slate-400');
            lbl.classList.add('border-solid', `border-[${color}]`);
            lbl.innerHTML = '';
        };
        reader.readAsDataURL(file);
    }

    setupRequestForm() {
        const select = document.getElementById('request-select');
        const btn = document.getElementById('btn-confirm-request');
        const files = ['req-img-1', 'req-img-2'];
        const checks = ['check-tires', 'check-lights', 'check-license', 'check-uniform'];

        const validate = () => {
            const filesOk = files.every(id => document.getElementById(id).files.length > 0);
            const checksOk = checks.every(id => document.getElementById(id).checked);
            const selOk = select.value !== "";
            if(filesOk && checksOk && selOk) {
                btn.disabled = false; btn.className = "w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg";
            } else {
                btn.disabled = true; btn.className = "w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed";
            }
        };

        files.forEach((id, i) => document.getElementById(id).addEventListener('change', (e) => {
            if(e.target.files[0]) { this.processImage(e.target.files[0], `lbl-req-${i+1}`, '#137fec'); validate(); }
        }));
        checks.forEach(id => document.getElementById(id).addEventListener('change', validate));
        select.addEventListener('change', validate);
        
        btn.onclick = async () => {
            btn.innerText = "Enviando...";
            const requestData = { license: true, uniform: true, tires: true, lights: true, photos_taken: true, timestamp: new Date() };
            const { error } = await supabase.from('trips').insert({ 
                vehicle_id: select.value, 
                driver_id: this.userId, 
                status: 'requested', 
                request_details: requestData 
            });
            if(error) alert(error.message); else location.reload();
        };
    }

    setupReturnForm() {
        const btn = document.getElementById('btn-confirm-return');
        const inputs = ['return-km', 'return-fuel'];
        const files = ['ret-img-1', 'ret-img-2'];
        const checks = ['check-clean'];

        const validate = () => {
            const inputsOk = inputs.every(id => document.getElementById(id).value !== "");
            const filesOk = files.every(id => document.getElementById(id).files.length > 0);
            const checksOk = checks.every(id => document.getElementById(id).checked);
            if (inputsOk && filesOk && checksOk) {
                btn.disabled = false; btn.className = "w-full py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg";
            } else {
                btn.disabled = true; btn.className = "w-full py-4 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed";
            }
        };

        inputs.forEach(id => document.getElementById(id).addEventListener('input', validate));
        inputs.forEach(id => document.getElementById(id).addEventListener('change', validate));
        files.forEach((id, i) => document.getElementById(id).addEventListener('change', (e) => {
             if(e.target.files[0]) { this.processImage(e.target.files[0], `lbl-ret-${i+1}`, '#f97316'); validate(); }
        }));
        checks.forEach(id => document.getElementById(id).addEventListener('change', validate));

        btn.onclick = async () => {
            btn.innerText = "Finalizando...";
            const { data: trip } = await supabase.from('trips').select('id').eq('driver_id', this.userId).eq('status', 'arrived').single();
            const returnData = { 
                final_km: document.getElementById('return-km').value, 
                fuel_level: document.getElementById('return-fuel').value,
                timestamp: new Date() 
            };
            await supabase.from('trips').update({ status: 'closed', return_details: returnData }).eq('id', trip.id);
            location.reload();
        };
    }

    setupIncidentForm() {
        const btn = document.getElementById('btn-send-incident');
        const imgInput = document.getElementById('inc-img');
        
        imgInput.addEventListener('change', (e) => {
            if(e.target.files[0]) this.processImage(e.target.files[0], 'lbl-inc', '#ef4444');
        });

        btn.onclick = async () => {
            const type = document.getElementById('inc-type').value;
            const desc = document.getElementById('inc-desc').value;
            
            if(!desc) return alert("Por favor describe el incidente.");
            
            btn.innerText = "Enviando..."; btn.disabled = true;

            // Obtener vehículo actual si existe viaje
            const { data: trip } = await supabase.from('trips').select('vehicle_id').eq('driver_id', this.userId).neq('status', 'closed').maybeSingle();
            
            const { error } = await supabase.from('incidents').insert({
                driver_id: this.userId,
                vehicle_id: trip ? trip.vehicle_id : null,
                type: type,
                description: desc,
                severity: type === 'accident' ? 'critical' : 'medium',
                status: 'reported',
                created_at: new Date()
            });

            if(error) {
                alert("Error: " + error.message);
                btn.innerText = "ENVIAR REPORTE"; btn.disabled = false;
            } else {
                alert("Reporte enviado a central.");
                document.getElementById('modal-incident').classList.add('hidden');
                document.getElementById('inc-desc').value = "";
                // Reset visual button
                btn.innerText = "ENVIAR REPORTE"; btn.disabled = false;
            }
        };
    }

    async loadVehiclesToSelect() {
        const { data } = await supabase.from('vehicles').select('id, economic_number, model').eq('status', 'active');
        const select = document.getElementById('request-select');
        select.innerHTML = '<option value="">Selecciona unidad...</option>' + (data||[]).map(v => `<option value="${v.id}">${v.economic_number} - ${v.model}</option>`).join('');
    }
}