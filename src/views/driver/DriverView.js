// assets/js/modules/conductor.js
if (typeof ConductorModule === 'undefined') {
    class ConductorModule {
        constructor() {
            this.id = 'conductor';
            this.name = 'App Conductor';
            this.icon = 'fas fa-id-card';
            this.requiredPermission = 'conductor-module';
            this.session = null;
            this.currentAssignment = null; // Guardará el viaje actual real
            this.qrCode = null;
            this.isTrackingLocation = false;
            this.watchPositionId = null;
            
            // Instancia global de Supabase
            this.supabase = window.supabaseClient;
            
            window.conductorModule = this;
        }

        render(session = null) {
            this.session = session;
            document.body.classList.add('is-conductor');
            
            // Extraer el ID del usuario de la sesión (ajusta 'id' según cómo lo guardes en auth.js)
            this.userId = session.id || session.user_id || session.employeeId; 

            // 1. Renderizar la estructura base (Esqueleto visual)
            const html = `
                <section id="conductor" class="module active">
                    
                    <div class="module-card conductor-header-card" style="background: linear-gradient(135deg, var(--primary), #003366); color: white;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="position: relative;">
                                <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; border: 2px solid rgba(255,255,255,0.4);">
                                    ${this.getUserInitials(session.name)}
                                </div>
                                <div class="status-indicator" style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #2ecc71; border-radius: 50%; border: 2px solid #003366;"></div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.8;">Conductor</div>
                                <h3 style="margin: 0; font-size: 1.1rem; color: white;">${session.name.split(' ')[0]}</h3>
                            </div>
                            <button class="btn" onclick="window.conductorModule.reportIncident()" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,59,48,0.2); color: #ff3b30; border: 1px solid rgba(255,59,48,0.4); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-exclamation-triangle"></i>
                            </button>
                        </div>
                    </div>

                    <div class="conductor-grid-layout pb-20">
                        
                        <div id="view-unidad" class="conductor-view-tab active">
                            <div class="module-card">
                                <div class="module-header"><div class="module-title"><i class="fas fa-car" style="color: var(--primary);"></i> Gestión de Unidad</div></div>
                                <div style="padding: 20px;" id="container-unidad">
                                    <div style="text-align:center; padding: 20px; color: #888;">Cargando unidades... <i class="fas fa-spinner fa-spin"></i></div>
                                </div>
                            </div>
                        </div>

                        <div id="view-checklist" class="conductor-view-tab">
                            <div class="module-card">
                                <div class="module-header">
                                    <div class="module-title"><i class="fas fa-clipboard-check" style="color: var(--primary);"></i> Estado Mecánico</div>
                                </div>
                                <div style="padding: 20px;" id="container-checklist">
                                    <div style="text-align:center; padding: 20px; color: #888;">Cargando estado...</div>
                                </div>
                            </div>
                        </div>

                        <div id="view-ruta" class="conductor-view-tab">
                            <div class="module-card">
                                <div class="module-header">
                                    <div class="module-title"><i class="fas fa-map-marked-alt" style="color: var(--primary);"></i> Ruta Activa</div>
                                    <label class="switch">
                                        <input type="checkbox" id="location-toggle" onchange="window.conductorModule.toggleLocationTracking(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div style="padding: 20px;">
                                    <div class="location-map"><i class="fas fa-satellite-dish fa-2x" style="color: #00b4d8;"></i></div>
                                    <div class="location-data">
                                        <div class="location-item"><div class="value" id="gps-speed">0</div><div class="label">KM/H</div></div>
                                        <div class="location-item"><div class="value" id="gps-status">Inactivo</div><div class="label">ESTADO GPS</div></div>
                                    </div>
                                    <h5 style="margin: 20px 0 10px; font-size: 0.8rem; color: var(--gray);">MENSAJES RÁPIDOS</h5>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <button class="btn btn-outline" style="justify-content: center;" onclick="window.conductorModule.sendMessage('Tráfico')">🚗 Tráfico</button>
                                        <button class="btn btn-outline" style="justify-content: center;" onclick="window.conductorModule.sendMessage('En camino')">👍 En camino</button>
                                        <button class="btn btn-outline" style="justify-content: center;" onclick="window.conductorModule.sendMessage('Retraso')">⏱️ Retraso</button>
                                        <button class="btn btn-outline" style="justify-content: center;" onclick="window.conductorModule.sendMessage('Llegando')">🏁 Llegando</button>
                                    </div>
                                    <div id="btn-finish-container" style="margin-top: 20px; display: none;">
                                        <button class="btn btn-danger" style="width: 100%; padding: 15px;" onclick="window.conductorModule.returnVehicle()">CERRAR VIAJE Y ENTREGAR</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="view-historial" class="conductor-view-tab">
                            <div class="module-card">
                                <div class="module-header"><div class="module-title"><i class="fas fa-history" style="color: var(--primary);"></i> Historial</div></div>
                                <div style="padding: 0;">
                                    <div class="table-responsive">
                                        <table class="modern-table" style="width: 100%;">
                                            <thead style="background: #f8f9fa;"><tr><th style="padding:15px;">Fecha</th><th>Unidad</th><th>Estado</th></tr></thead>
                                            <tbody id="container-historial">
                                                <tr><td colspan="3" style="text-align:center; padding: 20px;">Cargando historial...</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="view-perfil" class="conductor-view-tab">
                            <div class="module-card no-print" style="background: white; border-radius: 15px; overflow: hidden;">
                                <div style="background: #f8f9fa; padding: 25px; border-bottom: 1px solid #eee;">
                                    <div style="display: flex; justify-content: space-between; align-items: start;">
                                        <div>
                                            <h3 style="margin: 0; color: var(--dark); font-size: 1.5rem;">${session.name}</h3>
                                            <div style="color: var(--gray); font-size: 0.9rem; margin-top: 5px;">${session.employeeId || 'ID-001'}</div>
                                            <div style="margin-top: 8px;"><span class="badge" style="background: var(--primary); color: white;">OPERADOR</span></div>
                                        </div>
                                        <div style="width: 70px; height: 70px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
                                            <img src="https://ui-avatars.com/api/?name=${session.name}&background=random" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>
                                    </div>
                                </div>

                                <div style="padding: 25px;">
                                    <h5 style="margin-bottom: 15px; color: var(--dark); border-bottom: 2px solid #eee; padding-bottom: 5px;"><i class="fas fa-folder-open"></i> Documentación</h5>
                                    <div class="doc-list" style="margin-bottom: 25px;">
                                        <div style="margin-bottom: 15px;">
                                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;">
                                                <strong>Licencia Tipo C</strong><span style="color: var(--success);">Vigente</span>
                                            </div>
                                            <div style="height: 6px; background: #eee; border-radius: 3px; overflow: hidden;"><div style="width: 80%; height: 100%; background: var(--success);"></div></div>
                                        </div>
                                    </div>

                                    <div style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; text-align: center;">
                                        <div style="font-weight: 700; color: var(--dark); margin-bottom: 5px;">GAFETE DIGITAL DE SALIDA</div>
                                        <div id="qr-status" style="font-size: 0.8rem; color: var(--gray); margin-bottom: 15px;">Calculando estatus...</div>
                                        
                                        <div style="background: white; padding: 10px; display: inline-block; border-radius: 10px; border: 1px solid #eee; margin-bottom: 15px;">
                                            <div id="badge-qr-code" style="width: 150px; height: 150px; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: #fafafa; border: 1px dashed #ccc;">
                                                <i class="fas fa-qrcode fa-3x" style="color: #ddd;"></i>
                                            </div>
                                        </div>
                                        <div style="font-size: 0.7rem; color: #999; margin-top: 10px;">* Muestra este código al guardia en caseta.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="mobile-bottom-nav">
                        <button class="mobile-nav-btn active" onclick="window.conductorModule.switchTab('unidad')" id="nav-unidad"><i class="fas fa-car"></i><span>Unidad</span></button>
                        <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('checklist')" id="nav-checklist"><i class="fas fa-check-square"></i><span>Check</span></button>
                        <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('ruta')" id="nav-ruta"><i class="fas fa-route"></i><span>Ruta</span></button>
                        <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('historial')" id="nav-historial"><i class="fas fa-history"></i><span>Historial</span></button>
                        <button class="mobile-nav-btn" onclick="window.conductorModule.switchTab('perfil')" id="nav-perfil"><i class="fas fa-id-card-alt"></i><span>Perfil</span></button>
                    </div>

                    <div id="incident-modal" class="modal-overlay" style="display: none; z-index: 1000;">
                        <div class="modal-content">
                            <div class="modal-header"><h3>Reportar Incidente</h3><button class="modal-close" onclick="window.conductorModule.closeModal()">&times;</button></div>
                            <div class="modal-body">
                                <select id="inc-type" class="form-control" style="margin-bottom: 10px; padding: 10px; width: 100%; border-radius: 8px;">
                                    <option value="falla_mecanica">Falla Mecánica</option>
                                    <option value="choque">Choque / Colisión</option>
                                    <option value="multa">Multa de Tránsito</option>
                                </select>
                                <textarea id="incident-description" class="form-control" rows="3" placeholder="Describe lo sucedido..."></textarea>
                            </div>
                            <div class="modal-footer"><button class="btn btn-danger" onclick="window.conductorModule.submitIncident()">Enviar Alerta</button></div>
                        </div>
                    </div>
                </section>
                
                <style>
                    /* Se conservan tus estilos originales intactos */
                    .switch { position: relative; display: inline-block; width: 50px; height: 24px; } .switch input { opacity: 0; width: 0; height: 0; } .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; } .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; } input:checked + .slider { background-color: var(--success); } input:checked + .slider:before { transform: translateX(26px); }
                    .vehicle-request-card { background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; margin-bottom: 15px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.02); } .vehicle-request-card.selected { border: 2px solid var(--primary); background: #f0f7ff; }
                    .checklist-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
                    .location-map { height: 200px; background: #e0f2fe; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #b0bec5; margin-bottom: 20px; border: 1px solid #bae6fd;}
                    .location-data { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } .location-item { background: #fafafa; padding: 15px; text-align: center; border-radius: 12px; border: 1px solid #eee; }
                    .value { font-size: 1.5rem; font-weight: bold; color: var(--dark); } .label { font-size: 0.7rem; color: var(--gray); font-weight: bold; }
                    .mobile-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #eee; display: flex; justify-content: space-around; padding: 10px 5px; z-index: 99; padding-bottom: calc(10px + env(safe-area-inset-bottom));}
                    .mobile-nav-btn { background: none; border: none; display: flex; flex-direction: column; align-items: center; color: #aaa; font-size: 0.7rem; gap: 5px; cursor: pointer; }
                    .mobile-nav-btn.active { color: var(--primary); } .mobile-nav-btn i { font-size: 1.2rem; }
                    .conductor-grid-layout { height: calc(100vh - 160px); overflow-y: auto; }
                    .conductor-view-tab { display: none; animation: fadeIn 0.3s ease; } .conductor-view-tab.active { display: block; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                </style>
            `;

            // 2. Iniciar la carga de datos de Supabase en paralelo al renderizado
            setTimeout(() => this.initSupabaseData(), 100);

            return html;
        }

        // --- GESTIÓN DE VISTAS (TABS) (Mantenido y adaptado) ---
        switchTab(tabId) {
            document.querySelectorAll('.conductor-view-tab').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.mobile-nav-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(`view-${tabId}`).classList.add('active');
            document.getElementById(`nav-${tabId}`).classList.add('active');
            
            if (tabId === 'perfil') this.generateBadgeQR();
        }

        getUserInitials(name) { return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CO'; }

        // --- CONEXIÓN A SUPABASE ---
        async initSupabaseData() {
            if (!this.supabase) return console.error("Supabase no inicializado en ConductorModule");
            
            await this.loadCurrentDashboard();
            await this.loadAssignmentHistory();
            
            // Suscripción en Tiempo Real para cambios en la tabla 'trips'
            this.subscription = this.supabase
                .channel('conductor_trips')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `driver_id=eq.${this.userId}` }, 
                (payload) => {
                    console.log("Cambio en viaje detectado:", payload);
                    if (window.app && window.app.showNotification) window.app.showNotification("Estado de viaje actualizado", "info");
                    this.loadCurrentDashboard();
                })
                .subscribe();
        }

        async loadCurrentDashboard() {
            try {
                // Buscar si el conductor tiene un viaje abierto
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
                <tr>
                    <td style="padding:15px; color:#555; font-size: 0.85rem;">${new Date(h.created_at).toLocaleDateString()}</td>
                    <td style="padding:15px; font-weight:600;">${h.vehicles ? h.vehicles.plate : '---'}</td>
                    <td style="padding:15px;"><span class="badge" style="background:#eee; color:#555;">Finalizado</span></td>
                </tr>
            `).join('');
        }

        // --- LÓGICA DE ACTUALIZACIÓN DE INTERFAZ ---
        async updateUIStatus() {
            const contUnidad = document.getElementById('container-unidad');
            const contChecklist = document.getElementById('container-checklist');
            const btnFinish = document.getElementById('btn-finish-container');

            if (!this.currentAssignment) {
                // ESTADO 0: SIN VIAJE. Cargar catálogo de vehículos disponibles
                btnFinish.style.display = 'none';
                contChecklist.innerHTML = `<div style="text-align:center; padding: 20px; color: #888;"><i class="fas fa-tools fa-3x" style="opacity:0.2; margin-bottom:10px;"></i><br>Solicita una unidad primero.</div>`;
                
                const { data: vehicles } = await this.supabase.from('vehicles').select('*').eq('status', 'active');
                
                if(!vehicles || vehicles.length === 0) {
                    contUnidad.innerHTML = `<div style="text-align:center; padding: 20px; color: #888;">No hay unidades disponibles.</div>`;
                    return;
                }

                contUnidad.innerHTML = `
                    <div style="max-height:calc(100vh - 350px); overflow-y:auto; padding-right: 5px;">
                        ${vehicles.map(v => `
                            <div class="vehicle-request-card" style="border: 1px solid #e0e0e0; margin-bottom: 10px; padding: 15px; border-radius: 10px;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div>
                                        <div style="font-weight:700; color: var(--dark);">${v.model}</div>
                                        <div style="color:#888; font-size:0.8rem;"><i class="fas fa-car-side"></i> ${v.plate}</div>
                                    </div>
                                    <button class="btn btn-primary" style="padding: 8px 15px; font-size: 0.8rem;" onclick="window.conductorModule.requestVehicle('${v.id}')">SOLICITAR</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                // ESTADO 1+: TIENE UN VIAJE EN CURSO
                const trip = this.currentAssignment;
                const veh = trip.vehicles;

                // Vista Unidad (Solo muestra la que tiene asignada)
                contUnidad.innerHTML = `
                    <div style="background:#e8f5e9; padding:25px; border-radius:15px; text-align:center; border:1px solid #c8e6c9;">
                        <h5 style="color:#2e7d32; margin-bottom:5px; font-size: 0.8rem; letter-spacing: 1px;">UNIDAD ASIGNADA</h5>
                        <h2 style="margin:0; font-size: 2rem; color: var(--dark);">${veh.plate}</h2>
                        <p style="color:#666; margin-bottom:15px;">${veh.model}</p>
                        <div style="background: white; padding: 8px; border-radius: 8px; display: inline-block; font-size: 0.8rem; font-weight: bold;">
                            ESTADO: <span style="color: var(--primary);">${this.translateStatus(trip.status)}</span>
                        </div>
                    </div>
                `;

                // Vista Checklist (Depende del estatus del mecánico)
                if (trip.status === 'requested') {
                    contChecklist.innerHTML = `
                        <div style="text-align:center; padding: 30px 10px;">
                            <i class="fas fa-cogs fa-spin fa-3x" style="color: var(--warning); margin-bottom: 15px;"></i>
                            <h4 style="margin:0; color: var(--dark);">Revisión Mecánica en Progreso</h4>
                            <p style="color: var(--gray); font-size: 0.9rem; margin-top: 5px;">El taller está verificando la unidad. Espera su aprobación.</p>
                        </div>
                    `;
                } else if (trip.status === 'mechanic_approved') {
                    // El Mecánico ya aprobó el checklist, el conductor debe verificar y aceptar
                    contChecklist.innerHTML = `
                        <div style="background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="color: var(--success); font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;"><i class="fas fa-check-circle"></i> Taller Aprobó</div>
                            
                            <div style="text-align: left; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
                                <div class="checklist-item"><span>Líquido</span><span style="color: var(--success); font-weight:bold;">OK</span></div>
                                <div class="checklist-item"><span>Aceite</span><span style="color: var(--success); font-weight:bold;">OK</span></div>
                                <div class="checklist-item"><span>Anticongelante</span><span style="color: var(--success); font-weight:bold;">OK</span></div>
                                <div class="checklist-item"><span>Luces y Llantas</span><span style="color: var(--success); font-weight:bold;">OK</span></div>
                                <div class="checklist-item" style="border-bottom:none;"><span>Fotos Evidencia</span><span style="color: var(--primary); font-weight:bold;">CARGADAS</span></div>
                            </div>

                            <button class="btn btn-primary" onclick="window.conductorModule.acceptChecklist('${trip.id}')" style="width: 100%; padding: 15px; font-weight: 700; border-radius: 10px;">
                                ACEPTAR Y RECIBIR UNIDAD
                            </button>
                            <p style="font-size: 0.7rem; color: #999; margin-top: 10px;">Al aceptar, confirmas que recibes la unidad en estas condiciones y se genera tu QR de salida.</p>
                        </div>
                    `;
                } else if (trip.status === 'driver_accepted' || trip.status === 'in_progress') {
                    contChecklist.innerHTML = `
                        <div style="text-align: center; padding: 30px 20px;">
                            <div style="width: 80px; height: 80px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: var(--success);">
                                <i class="fas fa-check-double fa-3x"></i>
                            </div>
                            <h3 style="color: var(--dark); margin:0;">Unidad Recibida</h3>
                            <p style="color: var(--gray); font-size: 0.9rem;">Condiciones aceptadas. Pasa a caseta para escanear tu QR de salida.</p>
                        </div>
                    `;
                    
                    if(trip.status === 'in_progress') {
                        btnFinish.style.display = 'block'; // Mostrar botón de finalizar en la pestaña Ruta
                    } else {
                        btnFinish.style.display = 'none';
                    }
                }
            }
            this.generateBadgeQR();
        }

        // --- ACCIONES CON SUPABASE ---
        async requestVehicle(vehicleId) {
            if(!confirm("Solicitar unidad para revisión mecánica. ¿Continuar?")) return;
            
            const { error } = await this.supabase.from('trips').insert({
                vehicle_id: vehicleId,
                driver_id: this.userId,
                status: 'requested', // Se va a la cola del mecánico
                created_at: new Date()
            });

            if(error) {
                if (window.app && window.app.showNotification) window.app.showNotification(error.message, "error");
                console.error(error);
            } else {
                this.switchTab('checklist');
                this.loadCurrentDashboard(); // Refresca UI
            }
        }

        async acceptChecklist(tripId) {
            if(!confirm("¿Confirmas que la unidad está en orden y te haces responsable?")) return;
            
            const { error } = await this.supabase.from('trips').update({ status: 'driver_accepted' }).eq('id', tripId);
            
            if(error) {
                alert("Error al aceptar: " + error.message);
            } else {
                this.loadCurrentDashboard();
                this.switchTab('perfil'); // Mandarlo a ver su QR de salida
                if (window.app && window.app.showNotification) window.app.showNotification("Unidad aceptada exitosamente", "success");
            }
        }

        async returnVehicle() {
            if(!this.currentAssignment) return;
            if(!confirm("¿Finalizar el viaje y entregar unidad?")) return;
            
            const { error } = await this.supabase.from('trips').update({ status: 'closed' }).eq('id', this.currentAssignment.id);
            
            if(!error) {
                this.stopLocationTracking(); // Apagar GPS
                document.getElementById('location-toggle').checked = false;
                this.currentAssignment = null;
                this.loadCurrentDashboard();
                this.loadAssignmentHistory();
                this.switchTab('unidad');
                if (window.app && window.app.showNotification) window.app.showNotification("Viaje finalizado correctamente", "success");
            }
        }

        // --- GENERACIÓN DE QR DINÁMICO ---
        generateBadgeQR() {
            const qrContainer = document.getElementById('badge-qr-code');
            const statusText = document.getElementById('qr-status');
            
            if (!qrContainer) return;

            if (this.currentAssignment && (this.currentAssignment.status === 'driver_accepted' || this.currentAssignment.status === 'in_progress')) {
                // Generar QR con datos reales
                const qrData = {
                    conductor: this.session.name,
                    unidad: this.currentAssignment.vehicles.plate,
                    trip_id: this.currentAssignment.id,
                    status: 'autorizado'
                };
                const encoded = encodeURIComponent(JSON.stringify(qrData));
                qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}" style="width:100%; height:100%;">`;
                
                statusText.innerHTML = `Asignado a: <strong style="color:var(--primary)">${this.currentAssignment.vehicles.plate}</strong>`;
            } else {
                qrContainer.innerHTML = `<i class="fas fa-qrcode fa-3x" style="color: #eee;"></i>`;
                statusText.innerHTML = `<span style="color:var(--warning)">Sin pase autorizado</span>`;
            }
        }

        // --- GPS Y TELEMETRÍA ---
        toggleLocationTracking(isActive) {
            if(isActive) this.startLocationTracking();
            else this.stopLocationTracking();
        }

        startLocationTracking() {
            if (!navigator.geolocation) return alert("GPS no soportado en tu dispositivo.");
            
            document.getElementById('gps-status').innerText = "Activo";
            document.getElementById('gps-status').style.color = "var(--success)";
            
            this.watchPositionId = navigator.geolocation.watchPosition(
                (pos) => {
                    const speedKmh = pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(0) : '0';
                    document.getElementById('gps-speed').innerText = speedKmh;
                    
                    // Opcional: Insertar telemetría en Supabase si está 'in_progress'
                    // if(this.currentAssignment?.status === 'in_progress') {
                    //    this.supabase.from('telemetry').insert({trip_id: this.currentAssignment.id, lat: pos.coords.latitude, lng: pos.coords.longitude, speed: speedKmh})
                    // }
                },
                (err) => {
                    console.warn('Error GPS:', err);
                    document.getElementById('gps-status').innerText = "Error GPS";
                    document.getElementById('gps-status').style.color = "var(--danger)";
                },
                { enableHighAccuracy: true, maximumAge: 10000 }
            );
        }

        stopLocationTracking() {
            if (this.watchPositionId) navigator.geolocation.clearWatch(this.watchPositionId);
            document.getElementById('gps-speed').innerText = "0";
            document.getElementById('gps-status').innerText = "Inactivo";
            document.getElementById('gps-status').style.color = "var(--gray)";
        }

        // --- INCIDENTES Y MENSAJES ---
        reportIncident() { document.getElementById('incident-modal').style.display='flex'; }
        closeModal() { document.getElementById('incident-modal').style.display='none'; }
        
        async submitIncident() {
            const type = document.getElementById('inc-type').value;
            const desc = document.getElementById('incident-description').value;
            
            if(!desc) return alert("Por favor, ingresa una descripción.");
            
            const vehId = this.currentAssignment ? this.currentAssignment.vehicle_id : null;

            const { error } = await this.supabase.from('incidents').insert({
                driver_id: this.userId,
                vehicle_id: vehId,
                type: type,
                description: desc,
                status: 'reported'
            });

            if(!error) {
                if (window.app && window.app.showNotification) window.app.showNotification("Alerta enviada a central", "success");
                this.closeModal();
                document.getElementById('incident-description').value = "";
            } else {
                alert("Error al enviar alerta: " + error.message);
            }
        }

        async sendMessage(msg) {
            // Se puede implementar la inserción a una tabla 'messages' en Supabase aquí
            if (window.app && window.app.showNotification) window.app.showNotification("Mensaje rápido enviado: " + msg, "info");
        }

        translateStatus(s) {
            const dict = { 'requested': 'En Taller (Revisión)', 'mechanic_approved': 'Aprobado (Firma Conductor)', 'driver_accepted': 'Autorizado (Pase Caseta)', 'in_progress': 'En Ruta', 'closed': 'Cerrado' };
            return dict[s] || s;
        }
    }
    
    window.ConductorModule = ConductorModule;
}
