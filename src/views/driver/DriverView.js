import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.id = 'conductor';
        this.name = 'App Conductor';
        this.icon = 'fas fa-id-card';
        this.requiredPermission = 'conductor-module';
        this.session = null;
        this.currentAssignment = null; 
        this.qrCode = null;
        this.isTrackingLocation = false;
        this.watchPositionId = null;
        
        // Conexión a Supabase (usa la global de tu index o la importada)
        this.supabase = window.supabaseClient || supabase; 
        
        // Exponemos la clase al entorno global para que los onclick del HTML funcionen
        window.conductorModule = this;
    }

    render(session = null) {
        // Asignamos sesión o valores por defecto preventivos
        this.session = session || { name: 'Conductor', employeeId: 'ID-001' };
        
        // Ajusta esta variable según cómo guardes el ID real de tu usuario logueado
        this.userId = this.session.id || this.session.user_id || 'd0c1e2f3-0000-0000-0000-000000000001'; 

        // Iniciar la carga de datos inmediatamente después de renderizar el HTML
        setTimeout(() => this.initSupabaseData(), 100);

        return `
            <section id="conductor" class="module active h-full w-full bg-[#0d141c] relative font-display">
                
                <div class="module-card conductor-header-card" style="background: linear-gradient(135deg, var(--primary), #003366); color: white; margin: 0; border-radius: 0; padding: 15px 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="position: relative;">
                            <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; border: 2px solid rgba(255,255,255,0.4);">
                                ${this.getUserInitials(this.session.name)}
                            </div>
                            <div class="status-indicator" style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #2ecc71; border-radius: 50%; border: 2px solid #003366;"></div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.8;">Conductor</div>
                            <h3 style="margin: 0; font-size: 1.1rem; color: white;">${this.session.name.split(' ')[0]}</h3>
                        </div>
                        <button class="btn" onclick="window.conductorModule.reportIncident()" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,59,48,0.2); color: #ff3b30; border: 1px solid rgba(255,59,48,0.4); display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                    </div>
                </div>

                <div class="conductor-grid-layout" style="height: calc(100vh - 140px); overflow-y: auto; padding-bottom: 80px;">
                    
                    <div id="view-unidad" class="conductor-view-tab active" style="padding: 15px;">
                        <div class="module-card" style="background: #111a22; border: 1px solid #233648; border-radius: 12px; overflow: hidden;">
                            <div class="module-header" style="background: #192633; padding: 15px; border-bottom: 1px solid #233648;">
                                <div class="module-title" style="color: white; font-weight: bold;"><i class="fas fa-car" style="color: var(--primary);"></i> Gestión de Unidad</div>
                            </div>
                            <div style="padding: 20px;" id="container-unidad">
                                <div style="text-align:center; padding: 20px; color: #888;">Cargando unidades... <i class="fas fa-spinner fa-spin"></i></div>
                            </div>
                        </div>
                    </div>

                    <div id="view-checklist" class="conductor-view-tab" style="padding: 15px;">
                        <div class="module-card" style="background: #111a22; border: 1px solid #233648; border-radius: 12px; overflow: hidden;">
                            <div class="module-header" style="background: #192633; padding: 15px; border-bottom: 1px solid #233648;">
                                <div class="module-title" style="color: white; font-weight: bold;"><i class="fas fa-clipboard-check" style="color: var(--primary);"></i> Estado Mecánico</div>
                            </div>
                            <div style="padding: 20px;" id="container-checklist">
                                <div style="text-align:center; padding: 20px; color: #888;">Cargando estado...</div>
                            </div>
                        </div>
                    </div>

                    <div id="view-ruta" class="conductor-view-tab" style="padding: 15px;">
                        <div class="module-card" style="background: #111a22; border: 1px solid #233648; border-radius: 12px; overflow: hidden;">
                            <div class="module-header" style="background: #192633; padding: 15px; border-bottom: 1px solid #233648; display: flex; justify-content: space-between; align-items: center;">
                                <div class="module-title" style="color: white; font-weight: bold;"><i class="fas fa-map-marked-alt" style="color: var(--primary);"></i> Ruta Activa</div>
                                <label class="switch">
                                    <input type="checkbox" id="location-toggle" onchange="window.conductorModule.toggleLocationTracking(this.checked)">
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div style="padding: 20px;">
                                <div class="location-map" style="height: 150px; background: #192633; border: 1px solid #233648; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                                    <i class="fas fa-satellite-dish fa-2x" style="color: #3b82f6;"></i>
                                </div>
                                <div class="location-data" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                                    <div class="location-item" style="background: #192633; border: 1px solid #233648; padding: 15px; border-radius: 10px; text-align: center;">
                                        <div class="value" id="gps-speed" style="color: white; font-size: 1.8rem; font-weight: bold;">0</div>
                                        <div class="label" style="color: #888; font-size: 0.7rem; font-weight: bold;">KM/H</div>
                                    </div>
                                    <div class="location-item" style="background: #192633; border: 1px solid #233648; padding: 15px; border-radius: 10px; text-align: center;">
                                        <div class="value" id="gps-status" style="color: #888; font-size: 1rem; font-weight: bold; line-height: 2.8rem;">Inactivo</div>
                                        <div class="label" style="color: #888; font-size: 0.7rem; font-weight: bold;">ESTADO GPS</div>
                                    </div>
                                </div>
                                
                                <h5 style="margin: 0 0 10px 0; font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: bold;">Mensajes Rápidos</h5>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <button class="btn" style="background: #192633; border: 1px solid #233648; color: white; padding: 12px; border-radius: 8px;" onclick="window.conductorModule.sendMessage('Tráfico')">🚗 Tráfico</button>
                                    <button class="btn" style="background: #192633; border: 1px solid #233648; color: white; padding: 12px; border-radius: 8px;" onclick="window.conductorModule.sendMessage('En camino')">👍 En camino</button>
                                    <button class="btn" style="background: #192633; border: 1px solid #233648; color: white; padding: 12px; border-radius: 8px;" onclick="window.conductorModule.sendMessage('Retraso')">⏱️ Retraso</button>
                                    <button class="btn" style="background: #192633; border: 1px solid #233648; color: white; padding: 12px; border-radius: 8px;" onclick="window.conductorModule.sendMessage('Llegando')">🏁 Llegando</button>
                                </div>
                                
                                <div id="btn-finish-container" style="margin-top: 20px; display: none;">
                                    <button class="btn" style="background: #ef4444; color: white; width: 100%; padding: 15px; border-radius: 10px; font-weight: bold;" onclick="window.conductorModule.returnVehicle()">FINALIZAR VIAJE Y ENTREGAR</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="view-historial" class="conductor-view-tab" style="padding: 15px;">
                        <div class="module-card" style="background: #111a22; border: 1px solid #233648; border-radius: 12px; overflow: hidden;">
                            <div class="module-header" style="background: #192633; padding: 15px; border-bottom: 1px solid #233648;">
                                <div class="module-title" style="color: white; font-weight: bold;"><i class="fas fa-history" style="color: var(--primary);"></i> Historial Reciente</div>
                            </div>
                            <div style="padding: 0; overflow-x: auto;">
                                <table style="width: 100%; text-align: left; border-collapse: collapse;">
                                    <thead style="background: #15202b; color: #888; font-size: 0.8rem; text-transform: uppercase;">
                                        <tr><th style="padding: 12px 15px;">Fecha</th><th style="padding: 12px 15px;">Unidad</th><th style="padding: 12px 15px;">Estatus</th></tr>
                                    </thead>
                                    <tbody id="container-historial" style="color: white; font-size: 0.9rem;">
                                        <tr><td colspan="3" style="text-align:center; padding: 20px; color: #888;">Cargando historial...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="view-perfil" class="conductor-view-tab" style="padding: 15px;">
                        <div class="module-card" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                            <div style="background: #f8f9fa; padding: 25px; border-bottom: 1px solid #eee;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <h3 style="margin: 0; color: #1e293b; font-size: 1.5rem; font-weight: bold;">${this.session.name}</h3>
                                        <div style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">${this.session.employeeId || 'ID-001'}</div>
                                        <div style="margin-top: 8px;"><span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: bold;">OPERADOR</span></div>
                                    </div>
                                    <div style="width: 70px; height: 70px; background: #e0e0e0; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1;">
                                        <img src="https://ui-avatars.com/api/?name=${this.session.name}&background=random" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                </div>
                            </div>

                            <div style="padding: 25px;">
                                <h5 style="margin-bottom: 15px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px; font-weight: bold;"><i class="fas fa-folder-open" style="color: #3b82f6;"></i> Documentación</h5>
                                <div style="margin-bottom: 25px;">
                                    <div style="margin-bottom: 15px;">
                                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: #334155;">
                                            <strong>Licencia Tipo C</strong><span style="color: #10b981; font-weight: bold;">Vigente</span>
                                        </div>
                                        <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;"><div style="width: 80%; height: 100%; background: #10b981;"></div></div>
                                    </div>
                                </div>

                                <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
                                    <div style="font-weight: 900; color: #1e293b; margin-bottom: 5px; letter-spacing: 1px;">GAFETE DIGITAL DE SALIDA</div>
                                    <div id="qr-status" style="font-size: 0.8rem; color: #64748b; margin-bottom: 15px;">Calculando estatus...</div>
                                    
                                    <div style="background: white; padding: 15px; display: inline-block; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                                        <div id="badge-qr-code" style="width: 150px; height: 150px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas fa-qrcode fa-3x" style="color: #cbd5e1;"></i>
                                        </div>
                                    </div>
                                    <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 5px;">* Muestra este código al guardia en caseta.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="mobile-bottom-nav" style="position: absolute; bottom: 0; left: 0; right: 0; background: #111a22; border-top: 1px solid #233648; display: flex; justify-content: space-around; padding: 10px 5px; padding-bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 50;">
                    <button class="mobile-nav-btn active" onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad" style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; color: var(--primary); font-size: 0.7rem; gap: 5px; cursor: pointer; flex: 1;">
                        <i class="fas fa-car" style="font-size: 1.2rem;"></i><span style="font-weight: bold;">Unidad</span>
                    </button>
                    <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist" style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 0.7rem; gap: 5px; cursor: pointer; flex: 1;">
                        <i class="fas fa-check-square" style="font-size: 1.2rem;"></i><span style="font-weight: bold;">Check</span>
                    </button>
                    <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta" style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 0.7rem; gap: 5px; cursor: pointer; flex: 1;">
                        <i class="fas fa-route" style="font-size: 1.2rem;"></i><span style="font-weight: bold;">Ruta</span>
                    </button>
                    <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('historial')" id="nav-historial" style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 0.7rem; gap: 5px; cursor: pointer; flex: 1;">
                        <i class="fas fa-history" style="font-size: 1.2rem;"></i><span style="font-weight: bold;">Historial</span>
                    </button>
                    <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil" style="background: transparent; border: none; display: flex; flex-direction: column; align-items: center; color: #64748b; font-size: 0.7rem; gap: 5px; cursor: pointer; flex: 1;">
                        <i class="fas fa-id-card-alt" style="font-size: 1.2rem;"></i><span style="font-weight: bold;">Perfil</span>
                    </button>
                </div>

                <div id="incident-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; padding: 20px;">
                    <div style="background: #1c2127; width: 100%; max-width: 400px; border-radius: 16px; border: 1px solid #7f1d1d; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(127, 29, 29, 0.2); border-bottom: 1px solid #7f1d1d;">
                            <h3 style="margin: 0; color: white; font-weight: bold;">Reportar Incidente</h3>
                            <button onclick="window.conductorModule.closeModal()" style="background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">&times;</button>
                        </div>
                        <div style="padding: 20px;">
                            <select id="inc-type" style="width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 8px; background: #0d141c; border: 1px solid #7f1d1d; color: white;">
                                <option value="falla_mecanica">Falla Mecánica</option>
                                <option value="choque">Choque / Colisión</option>
                                <option value="multa">Multa de Tránsito</option>
                            </select>
                            <textarea id="incident-description" rows="3" placeholder="Describe lo sucedido..." style="width: 100%; padding: 12px; border-radius: 8px; background: #0d141c; border: 1px solid #7f1d1d; color: white; resize: none;"></textarea>
                        </div>
                        <div style="padding: 20px; border-top: 1px solid #7f1d1d; background: #151b23;">
                            <button onclick="window.conductorModule.submitIncident()" style="width: 100%; padding: 15px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Enviar Alerta</button>
                        </div>
                    </div>
                </div>

                <style>
                    .conductor-view-tab { display: none; animation: fadeIn 0.3s ease; } 
                    .conductor-view-tab.active { display: block; }
                    .mobile-nav-btn.active { color: #3b82f6 !important; }
                    .mobile-nav-btn.active i { transform: scale(1.1); transition: 0.2s; }
                    .switch { position: relative; display: inline-block; width: 50px; height: 24px; } .switch input { opacity: 0; width: 0; height: 0; } .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #334155; transition: .4s; border-radius: 24px; } .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; } input:checked + .slider { background-color: #10b981; } input:checked + .slider:before { transform: translateX(26px); }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
            </section>
        `;
    }

    // --- LÓGICA DE TABS Y TABS COLORS ---
    switchTab(tabId) {
        document.querySelectorAll('.conductor-view-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.mobile-nav-btn').forEach(el => {
            el.classList.remove('active');
            el.style.color = '#64748b'; // Inactivo
        });
        
        document.getElementById(`view-${tabId}`).classList.add('active');
        const activeBtn = document.getElementById(`nav-${tabId}`);
        activeBtn.classList.add('active');
        activeBtn.style.color = '#3b82f6'; // Activo
        
        if (tabId === 'perfil') this.generateBadgeQR();
    }

    getUserInitials(name) { return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CO'; }

    // --- INTEGRACIÓN SUPABASE ---
    async initSupabaseData() {
        if (!this.supabase) return console.error("Supabase no inicializado en DriverView");
        
        await this.loadCurrentDashboard();
        await this.loadAssignmentHistory();
        
        // Suscripción Realtime
        this.subscription = this.supabase
            .channel('conductor_trips')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, 
            (payload) => {
                if (window.app && window.app.showNotification) window.app.showNotification("Estado de viaje actualizado", "info");
                this.loadCurrentDashboard();
            })
            .subscribe();
    }

    async loadCurrentDashboard() {
        try {
            const { data: trip, error } = await this.supabase
                .from('trips')
                .select('*, vehicles(id, model, plate, status)')
                .eq('driver_id', this.userId)
                .neq('status', 'closed')
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            this.currentAssignment = trip;
            this.updateUIStatus();
        } catch (err) {
            console.error("Error cargando dashboard:", err);
        }
    }

    async loadAssignmentHistory() {
        const { data, error } = await this.supabase
            .from('trips')
            .select('*, vehicles(plate)')
            .eq('driver_id', this.userId)
            .eq('status', 'closed')
            .order('created_at', { ascending: false })
            .limit(10);
        
        const container = document.getElementById('container-historial');
        if (error || !data || data.length === 0) {
            container.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color:#888;">No hay viajes recientes.</td></tr>`;
            return;
        }

        container.innerHTML = data.map(h => `
            <tr style="border-bottom: 1px solid #233648;">
                <td style="padding:12px 15px;">${new Date(h.created_at).toLocaleDateString()}</td>
                <td style="padding:12px 15px; font-weight:bold;">${h.vehicles ? h.vehicles.plate : '---'}</td>
                <td style="padding:12px 15px;"><span style="background: #334155; color: #cbd5e1; font-size: 0.7rem; padding: 3px 8px; border-radius: 4px; font-weight: bold;">CERRADO</span></td>
            </tr>
        `).join('');
    }

    async updateUIStatus() {
        const contUnidad = document.getElementById('container-unidad');
        const contChecklist = document.getElementById('container-checklist');
        const btnFinish = document.getElementById('btn-finish-container');

        if (!this.currentAssignment) {
            btnFinish.style.display = 'none';
            contChecklist.innerHTML = `<div style="text-align:center; padding: 20px; color: #888;"><i class="fas fa-tools fa-3x" style="opacity:0.2; margin-bottom:10px;"></i><br>Solicita una unidad primero.</div>`;
            
            const { data: vehicles } = await this.supabase.from('vehicles').select('*').eq('status', 'active');
            
            if(!vehicles || vehicles.length === 0) {
                contUnidad.innerHTML = `<div style="text-align:center; padding: 20px; color: #888;">No hay unidades disponibles.</div>`;
                return;
            }

            contUnidad.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${vehicles.map(v => `
                        <div style="background: #192633; border: 1px solid #233648; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight:bold; color: white;">${v.model}</div>
                                <div style="color:#888; font-size:0.8rem;"><i class="fas fa-hashtag"></i> ${v.plate}</div>
                            </div>
                            <button style="background: var(--primary); color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;" onclick="window.conductorModule.requestVehicle('${v.id}')">SOLICITAR</button>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            const trip = this.currentAssignment;
            const veh = trip.vehicles;

            // Info de Unidad
            contUnidad.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 25px; border-radius: 12px; text-align: center;">
                    <div style="color: #10b981; font-size: 0.7rem; font-weight: bold; letter-spacing: 1px; margin-bottom: 5px;">UNIDAD ASIGNADA</div>
                    <h2 style="margin: 0; font-size: 2.2rem; color: white; font-weight: 900;">${veh.plate}</h2>
                    <p style="color: #cbd5e1; margin-bottom: 15px;">${veh.model}</p>
                    <div style="background: #111a22; border: 1px solid #233648; padding: 6px 12px; border-radius: 6px; display: inline-block; font-size: 0.8rem;">
                        ESTADO: <span style="color: #3b82f6; font-weight: bold;">${this.translateStatus(trip.status)}</span>
                    </div>
                </div>
            `;

            // Flujo Checklist
            if (trip.status === 'requested') {
                contChecklist.innerHTML = `
                    <div style="text-align:center; padding: 30px 10px;">
                        <i class="fas fa-cogs fa-spin fa-3x" style="color: #eab308; margin-bottom: 15px;"></i>
                        <h4 style="margin:0; color: white; font-weight: bold;">Revisión en Progreso</h4>
                        <p style="color: #888; font-size: 0.9rem; margin-top: 5px;">El mecánico está verificando la unidad.</p>
                    </div>
                `;
            } else if (trip.status === 'mechanic_approved') {
                contChecklist.innerHTML = `
                    <div style="text-align: center;">
                        <div style="color: #10b981; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> Taller Aprobó</div>
                        <div style="background: #192633; border: 1px solid #233648; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
                            <div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #233648; color: white; font-size: 0.9rem;"><span>Líquido</span><span style="color: #10b981; font-weight:bold;">OK</span></div>
                            <div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #233648; color: white; font-size: 0.9rem;"><span>Aceite</span><span style="color: #10b981; font-weight:bold;">OK</span></div>
                            <div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #233648; color: white; font-size: 0.9rem;"><span>Anticongelante</span><span style="color: #10b981; font-weight:bold;">OK</span></div>
                            <div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid #233648; color: white; font-size: 0.9rem;"><span>Luces y Llantas</span><span style="color: #10b981; font-weight:bold;">OK</span></div>
                            <div style="display:flex; justify-content:space-between; padding: 8px 0; color: white; font-size: 0.9rem;"><span>Fotos Evidencia</span><span style="color: #3b82f6; font-weight:bold;">CARGADAS</span></div>
                        </div>
                        <button style="background: var(--primary); color: white; width: 100%; padding: 15px; font-weight: bold; border: none; border-radius: 10px; cursor: pointer;" onclick="window.conductorModule.acceptChecklist('${trip.id}')">
                            ACEPTAR Y RECIBIR UNIDAD
                        </button>
                    </div>
                `;
            } else if (trip.status === 'driver_accepted' || trip.status === 'in_progress') {
                contChecklist.innerHTML = `
                    <div style="text-align: center; padding: 30px 20px;">
                        <div style="width: 80px; height: 80px; background: rgba(16, 185, 129, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #10b981;">
                            <i class="fas fa-check-double fa-3x"></i>
                        </div>
                        <h3 style="color: white; margin:0; font-weight: bold;">Unidad Recibida</h3>
                        <p style="color: #888; font-size: 0.9rem;">Pasa a caseta para escanear tu QR de salida.</p>
                    </div>
                `;
                if(trip.status === 'in_progress') btnFinish.style.display = 'block';
            }
        }
        this.generateBadgeQR();
    }

    async requestVehicle(vehicleId) {
        if(!confirm("Solicitar unidad para revisión mecánica. ¿Continuar?")) return;
        const { error } = await this.supabase.from('trips').insert({ vehicle_id: vehicleId, driver_id: this.userId, status: 'requested', created_at: new Date() });
        if(!error) { this.switchTab('checklist'); this.loadCurrentDashboard(); }
    }

    async acceptChecklist(tripId) {
        if(!confirm("¿Confirmas que la unidad está en orden y te haces responsable?")) return;
        const { error } = await this.supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', tripId);
        if(!error) { this.loadCurrentDashboard(); this.switchTab('perfil'); }
    }

    async returnVehicle() {
        if(!this.currentAssignment) return;
        if(!confirm("¿Finalizar el viaje y entregar unidad?")) return;
        const { error } = await this.supabase.from('trips').update({ status: 'closed' }).eq('id', this.currentAssignment.id);
        if(!error) {
            this.stopLocationTracking(); 
            document.getElementById('location-toggle').checked = false;
            this.currentAssignment = null;
            this.loadCurrentDashboard();
            this.loadAssignmentHistory();
            this.switchTab('unidad');
        }
    }

    generateBadgeQR() {
        const qrContainer = document.getElementById('badge-qr-code');
        const statusText = document.getElementById('qr-status');
        if (!qrContainer) return;

        if (this.currentAssignment && (this.currentAssignment.status === 'driver_accepted' || this.currentAssignment.status === 'in_progress')) {
            const qrData = { conductor: this.session.name, unidad: this.currentAssignment.vehicles.plate, trip_id: this.currentAssignment.id, status: 'autorizado' };
            const encoded = encodeURIComponent(JSON.stringify(qrData));
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}" style="width:100%; height:100%;">`;
            statusText.innerHTML = `Asignado a: <strong style="color:#3b82f6;">${this.currentAssignment.vehicles.plate}</strong>`;
        } else {
            qrContainer.innerHTML = `<i class="fas fa-qrcode fa-3x" style="color: #cbd5e1;"></i>`;
            statusText.innerHTML = `<span style="color:#ef4444; font-weight: bold;">Sin pase autorizado</span>`;
        }
    }

    toggleLocationTracking(isActive) { isActive ? this.startLocationTracking() : this.stopLocationTracking(); }

    startLocationTracking() {
        if (!navigator.geolocation) return alert("GPS no soportado.");
        document.getElementById('gps-status').innerText = "Activo";
        document.getElementById('gps-status').style.color = "#10b981";
        
        this.watchPositionId = navigator.geolocation.watchPosition(
            (pos) => { document.getElementById('gps-speed').innerText = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(0) : '0'; },
            (err) => { document.getElementById('gps-status').innerText = "Error GPS"; document.getElementById('gps-status').style.color = "#ef4444"; },
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    }

    stopLocationTracking() {
        if (this.watchPositionId) navigator.geolocation.clearWatch(this.watchPositionId);
        document.getElementById('gps-speed').innerText = "0";
        document.getElementById('gps-status').innerText = "Inactivo";
        document.getElementById('gps-status').style.color = "#888";
    }

    reportIncident() { document.getElementById('incident-modal').style.display='flex'; }
    closeModal() { document.getElementById('incident-modal').style.display='none'; }
    
    async submitIncident() {
        const type = document.getElementById('inc-type').value;
        const desc = document.getElementById('incident-description').value;
        if(!desc) return alert("Describe el incidente.");
        
        const vehId = this.currentAssignment ? this.currentAssignment.vehicle_id : null;
        const { error } = await this.supabase.from('incidents').insert({ driver_id: this.userId, vehicle_id: vehId, type: type, description: desc, status: 'reported' });
        
        if(!error) { this.closeModal(); document.getElementById('incident-description').value = ""; alert("Incidente reportado."); }
    }

    async sendMessage(msg) { alert("Mensaje enviado: " + msg); }
    translateStatus(s) { const dict = { 'requested': 'Revisión Taller', 'mechanic_approved': 'Por Firmar', 'driver_accepted': 'Pase Autorizado', 'in_progress': 'En Ruta', 'closed': 'Cerrado' }; return dict[s] || s; }
}
