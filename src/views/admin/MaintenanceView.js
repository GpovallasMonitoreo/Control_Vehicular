import { supabase } from '../../config/supabaseClient.js';

export class MaintenanceView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-4xl">build_circle</span>
                        Mantenimiento Preventivo
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal">Gestión de servicios, bitácora técnica y reportes.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button id="btn-export-maintenance" class="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">download</span>
                        <span>Exportar Excel</span>
                    </button>
                    <button onclick="window.maintenance.openScheduleModal()" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Programar Servicio</span>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-[#324d67] shadow-sm">
                    <div class="flex justify-between items-start">
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Salud de Flota</p>
                        <span class="material-symbols-outlined text-gray-400">inventory_2</span>
                    </div>
                    <p id="fleet-health" class="text-white text-3xl font-black">--%</p>
                    <div class="w-full bg-[#324d67] h-1.5 rounded-full mt-2">
                        <div id="fleet-health-bar" class="bg-green-500 h-full rounded-full transition-all duration-1000" style="width: 0%;"></div>
                    </div>
                </div>

                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-[#324d67] shadow-sm">
                    <div class="flex justify-between items-start">
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Pendientes</p>
                        <span class="material-symbols-outlined text-yellow-500">schedule</span>
                    </div>
                    <p id="stat-pending" class="text-white text-3xl font-black">--</p>
                    <span class="text-yellow-500 text-xs font-bold uppercase">En espera</span>
                </div>

                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-blue-500/30 shadow-sm">
                    <div class="flex justify-between items-start text-blue-400">
                        <p class="text-xs font-bold uppercase tracking-wider">En Revisión</p>
                        <span class="material-symbols-outlined">engineering</span>
                    </div>
                    <p id="stat-review" class="text-white text-3xl font-black">--</p>
                    <span class="text-blue-400 text-xs font-bold uppercase">En taller / Proceso</span>
                </div>

                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-green-500/30 shadow-sm">
                    <div class="flex justify-between items-start text-green-500">
                        <p class="text-xs font-bold uppercase tracking-wider">Terminados</p>
                        <span class="material-symbols-outlined">task_alt</span>
                    </div>
                    <p id="stat-completed" class="text-white text-3xl font-black">--</p>
                    <span class="text-green-500 text-xs font-bold uppercase">Histórico mes</span>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
                <div class="lg:col-span-2 bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden flex flex-col shadow-xl">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]">
                        <h4 class="text-lg font-bold text-white">Agenda Técnica de Unidades</h4>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="bg-[#111a22] text-[#92adc9] uppercase text-[10px] font-black sticky top-0 z-10 border-b border-[#324d67]">
                                <tr>
                                    <th class="px-6 py-4">Programado</th>
                                    <th class="px-6 py-4">Unidad</th>
                                    <th class="px-6 py-4">Tipo de Servicio</th>
                                    <th class="px-6 py-4">Estatus</th>
                                    <th class="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="maintenance-list" class="divide-y divide-[#324d67]/50 text-gray-300">
                                <tr><td colspan="5" class="px-6 py-20 text-center text-[#92adc9]"><span class="loader mx-auto"></span></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 flex flex-col shadow-xl">
                    <h5 class="text-sm font-bold uppercase tracking-widest text-[#92adc9] mb-4">Alertas Críticas</h5>
                    <div id="maintenance-alerts" class="space-y-4 overflow-y-auto pr-2 custom-scrollbar"></div>
                </div>
            </div>

            <div id="modal-schedule" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23] rounded-t-2xl">
                        <h3 id="modal-title" class="text-xl font-bold text-white">Programar Servicio</h3>
                        <button onclick="window.maintenance.closeModal()" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <form id="form-schedule" class="p-6 space-y-4">
                        <input type="hidden" id="edit-id">
                        <div>
                            <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-1">Vehículo (Unidad)</label>
                            <select id="schedule-vehicle" required class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary transition-all"></select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-1">Tipo de Servicio</label>
                            <input type="text" id="schedule-type" required placeholder="Ej: Afinación, Frenos..." class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-1">Fecha Programada</label>
                            <input type="date" id="schedule-date" required class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-1">Estado del Servicio</label>
                            <select id="schedule-status" required class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary">
                                <option value="scheduled">Pendiente</option>
                                <option value="in_review">En revisión</option>
                                <option value="completed">Terminado</option>
                            </select>
                        </div>
                        <button type="submit" id="btn-save-maintenance" class="w-full py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs mt-2">
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        window.maintenance = this;
        await this.loadMaintenanceData();
        await this.loadVehiclesToSelect();
        this.setupFormListener();
        
        // Listener para Exportar CSV
        document.getElementById('btn-export-maintenance').addEventListener('click', () => this.exportToCSV());
    }

    openScheduleModal(editData = null) {
        const modal = document.getElementById('modal-schedule');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('form-schedule');
        
        form.reset();
        
        if (editData) {
            title.innerText = "Editar Mantenimiento";
            document.getElementById('edit-id').value = editData.id;
            document.getElementById('schedule-vehicle').value = editData.vehicle_id;
            document.getElementById('schedule-type').value = editData.service_type;
            document.getElementById('schedule-date').value = editData.scheduled_date;
            document.getElementById('schedule-status').value = editData.status;
        } else {
            title.innerText = "Programar Servicio";
            document.getElementById('edit-id').value = "";
            document.getElementById('schedule-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('schedule-status').value = "scheduled";
        }
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-schedule').classList.add('hidden');
    }

    async loadVehiclesToSelect() {
        const { data: vehicles } = await supabase.from('vehicles').select('id, economic_number, model').eq('status', 'active');
        const select = document.getElementById('schedule-vehicle');
        if (vehicles && select) {
            select.innerHTML = '<option value="">Seleccionar Unidad...</option>' + 
                vehicles.map(v => `<option value="${v.id}">${v.economic_number} - ${v.model}</option>`).join('');
        }
    }

    setupFormListener() {
        const form = document.getElementById('form-schedule');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-maintenance');
            const editId = document.getElementById('edit-id').value;
            
            btn.disabled = true;
            btn.innerText = "Procesando...";

            const payload = {
                vehicle_id: document.getElementById('schedule-vehicle').value,
                service_type: document.getElementById('schedule-type').value,
                scheduled_date: document.getElementById('schedule-date').value,
                status: document.getElementById('schedule-status').value,
                updated_at: new Date()
            };

            let error;
            if (editId) {
                // Modo Edición
                const res = await supabase.from('maintenance_logs').update(payload).eq('id', editId);
                error = res.error;
            } else {
                // Modo Inserción
                payload.created_at = new Date();
                const res = await supabase.from('maintenance_logs').insert(payload);
                error = res.error;
            }

            if (error) {
                alert("Error en base de datos: " + error.message);
            } else {
                this.closeModal();
                await this.loadMaintenanceData();
            }
            btn.disabled = false;
            btn.innerText = "Guardar Cambios";
        });
    }

    async loadMaintenanceData() {
        try {
            const { data: logs, error } = await supabase
                .from('maintenance_logs')
                .select('*, vehicles (economic_number, model)')
                .order('scheduled_date', { ascending: true });

            if (error) throw error;
            
            this.currentLogs = logs; // Guardamos para exportación
            this.renderStats(logs);
            this.renderTable(logs);
            this.renderAlerts(logs);

        } catch (err) {
            console.error("Error cargando mantenimiento:", err);
        }
    }

    renderStats(logs) {
        const pending = logs.filter(l => l.status === 'scheduled').length;
        const review = logs.filter(l => l.status === 'in_review').length;
        const completed = logs.filter(l => l.status === 'completed').length;

        document.getElementById('stat-pending').innerText = pending;
        document.getElementById('stat-review').innerText = review;
        document.getElementById('stat-completed').innerText = completed;

        const total = logs.length || 1;
        const health = Math.round(((total - (pending + review)) / total) * 100);
        document.getElementById('fleet-health').innerText = `${health}%`;
        document.getElementById('fleet-health-bar').style.width = `${health}%`;
    }

    renderTable(logs) {
        const tbody = document.getElementById('maintenance-list');
        if (!logs.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-20 text-center text-slate-500">No hay mantenimientos en bitácora.</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const statusMap = {
                scheduled: { label: 'Pendiente', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
                in_review: { label: 'En revisión', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                completed: { label: 'Terminado', class: 'bg-green-500/10 text-green-500 border-green-500/20' }
            };
            const s = statusMap[log.status] || statusMap.scheduled;

            return `
            <tr class="hover:bg-[#1a212b] transition-all group">
                <td class="px-6 py-4 font-mono text-xs text-[#92adc9]">${new Date(log.scheduled_date).toLocaleDateString()}</td>
                <td class="px-6 py-4 font-black text-white uppercase">${log.vehicles?.economic_number || 'N/A'}<span class="block text-[10px] font-normal text-slate-500">${log.vehicles?.model || ''}</span></td>
                <td class="px-6 py-4 text-xs font-bold text-slate-300 uppercase">${log.service_type}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${s.class}">${s.label}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick='window.maintenance.openScheduleModal(${JSON.stringify(log)})' class="p-2 hover:bg-primary/20 text-[#92adc9] hover:text-primary rounded-lg transition-all">
                        <span class="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    renderAlerts(logs) {
        const container = document.getElementById('maintenance-alerts');
        const critical = logs.filter(l => l.status === 'scheduled' && new Date(l.scheduled_date) < new Date());
        
        if (!critical.length) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 opacity-20"><span class="material-symbols-outlined text-4xl mb-2">verified</span><p class="text-[10px] font-black uppercase">Sin retrasos</p></div>`;
            return;
        }

        container.innerHTML = critical.map(log => `
            <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-pulse">
                <p class="text-xs font-black text-red-500 uppercase tracking-widest mb-1">RETRASO CRÍTICO</p>
                <p class="text-sm text-white font-bold">${log.vehicles?.economic_number} - ${log.service_type}</p>
                <p class="text-[10px] text-slate-400 mt-1">Debió realizarse: ${new Date(log.scheduled_date).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    // --- FUNCIÓN DE EXPORTACIÓN CSV ---
    exportToCSV() {
        if (!this.currentLogs || this.currentLogs.length === 0) return alert("No hay datos para exportar");

        const headers = ["Fecha Programada", "Unidad", "Modelo", "Tipo de Servicio", "Estado Actual"];
        const rows = this.currentLogs.map(log => [
            log.scheduled_date,
            log.vehicles?.economic_number || 'N/A',
            log.vehicles?.model || 'N/A',
            log.service_type,
            log.status === 'completed' ? 'Terminado' : log.status === 'in_review' ? 'En revision' : 'Pendiente'
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Mantenimiento_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}