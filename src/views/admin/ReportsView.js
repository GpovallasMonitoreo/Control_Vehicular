import { supabase } from '../../config/supabaseClient.js';

export class ReportsView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <div class="flex flex-col gap-4">
                <h1 class="text-white text-3xl font-black flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary text-4xl">analytics</span>
                    Inteligencia de Desempeño (SLA)
                </h1>
                
                <div class="flex border-b border-[#324d67]">
                    <button onclick="window.switchTab('kpis')" id="tab-kpis" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">groups</span> KPIs Conductores
                    </button>
                    <button onclick="window.switchTab('audit')" id="tab-audit" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">fact_check</span> Auditoría Seguridad
                    </button>
                    <button onclick="window.switchTab('settings')" id="tab-settings" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">settings_input_component</span> Configuración SLA
                    </button>
                </div>
            </div>

            <div id="view-kpis" class="animate-fade-in space-y-6">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1c2127] p-4 rounded-2xl border border-[#324d67]">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <select id="kpi-filter" class="bg-[#111a22] border border-[#324d67] text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary w-full md:w-64">
                            <option value="all">Todos los Conductores</option>
                            <option value="risk">Alerta de Riesgo</option>
                            <option value="top">Excelencia Operativa</option>
                        </select>
                    </div>
                    <button id="btn-export-sla" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 w-full md:w-auto justify-center">
                        <span class="material-symbols-outlined text-sm">download</span> DESCARGAR SLA (CSV)
                    </button>
                </div>

                <div id="drivers-kpi-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                        <span class="loader mb-4"></span>
                        <p class="font-bold animate-pulse">Sincronizando métricas...</p>
                    </div>
                </div>
            </div>

            <div id="view-audit" class="hidden animate-fade-in space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-[#1c2127] border border-[#324d67] p-6 rounded-xl">
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-widest">Score Promedio Flota</p>
                        <p id="avg-fleet-score" class="text-3xl font-black text-white mt-2">--</p>
                    </div>
                </div>
            </div>

            <div id="view-settings" class="hidden animate-fade-in max-w-2xl mx-auto w-full">
                <div class="bg-[#1c2127] border border-[#324d67] rounded-3xl overflow-hidden shadow-2xl">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                        <h3 class="text-xl font-bold text-white">Reglas de Negocio SLA</h3>
                        <p class="text-[#92adc9] text-xs">Define cuántos puntos se restan por cada falla detectada.</p>
                    </div>
                    <form id="form-sla-settings" class="p-8 space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Penalización Multa</label>
                                <input type="number" id="cfg-fine" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-red-500" placeholder="Ej: 10">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Incidente Crítico</label>
                                <input type="number" id="cfg-critical" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-red-500" placeholder="Ej: 30">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Incidente Leve</label>
                                <input type="number" id="cfg-minor" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-orange-500" placeholder="Ej: 5">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Checklist Fallido</label>
                                <input type="number" id="cfg-checklist" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-yellow-500" placeholder="Ej: 2">
                            </div>
                        </div>
                        <hr class="border-[#324d67]">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Umbral de Riesgo</label>
                                <input type="number" id="cfg-risk" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary" placeholder="Ej: 80">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Umbral Excelencia</label>
                                <input type="number" id="cfg-top" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-green-500" placeholder="Ej: 95">
                            </div>
                        </div>
                        <button type="submit" class="w-full py-4 bg-primary hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm">
                            Guardar Reglas SLA
                        </button>
                    </form>
                </div>
            </div>

        </div>
        `;
    }

    async onMount() {
        window.reports = this;
        this.setupTabs();
        
        // Listeners
        document.getElementById('kpi-filter').addEventListener('change', (e) => this.filterCards(e.target.value));
        document.getElementById('btn-export-sla').addEventListener('click', () => this.exportSLA());
        document.getElementById('form-sla-settings').addEventListener('submit', (e) => this.saveSLASettings(e));

        // Carga inicial
        await this.loadSLASettings(); // Primero cargamos las reglas
        await this.loadDriverKPIs();   // Luego calculamos los KPIs
    }

    setupTabs() {
        window.switchTab = (tabName) => {
            ['kpis', 'audit', 'settings'].forEach(t => {
                document.getElementById(`view-${t}`).classList.add('hidden');
                const btn = document.getElementById(`tab-${t}`);
                btn.classList.remove('text-primary', 'border-primary', 'font-bold');
                btn.classList.add('text-[#92adc9]', 'border-transparent', 'font-medium');
            });
            document.getElementById(`view-${tabName}`).classList.remove('hidden');
            const activeBtn = document.getElementById(`tab-${tabName}`);
            activeBtn.classList.add('text-primary', 'border-primary', 'font-bold');
            activeBtn.classList.remove('text-[#92adc9]', 'border-transparent');
        };
    }

    async loadSLASettings() {
        const { data } = await supabase.from('sla_settings').select('*').eq('id', 'default_config').single();
        if (data) {
            this.rules = data;
            // Poblar formulario
            document.getElementById('cfg-fine').value = data.fine_penalty;
            document.getElementById('cfg-critical').value = data.critical_penalty;
            document.getElementById('cfg-minor').value = data.minor_penalty;
            document.getElementById('cfg-checklist').value = data.checklist_penalty;
            document.getElementById('cfg-risk').value = data.risk_threshold;
            document.getElementById('cfg-top').value = data.top_threshold;
        } else {
            // Reglas por defecto si no hay conexión
            this.rules = { fine_penalty: 10, critical_penalty: 30, minor_penalty: 5, checklist_penalty: 2, risk_threshold: 80, top_threshold: 95 };
        }
    }

    async saveSLASettings(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerText = "Guardando...";
        
        const settings = {
            fine_penalty: parseInt(document.getElementById('cfg-fine').value),
            critical_penalty: parseInt(document.getElementById('cfg-critical').value),
            minor_penalty: parseInt(document.getElementById('cfg-minor').value),
            checklist_penalty: parseInt(document.getElementById('cfg-checklist').value),
            risk_threshold: parseInt(document.getElementById('cfg-risk').value),
            top_threshold: parseInt(document.getElementById('cfg-top').value),
            updated_at: new Date()
        };

        const { error } = await supabase.from('sla_settings').update(settings).eq('id', 'default_config');
        
        if (!error) {
            alert("✅ Reglas SLA actualizadas correctamente.");
            await this.loadSLASettings();
            await this.loadDriverKPIs();
            window.switchTab('kpis');
        } else {
            alert("Error: " + error.message);
        }
        btn.innerText = "Guardar Reglas SLA";
    }

    async loadDriverKPIs() {
        try {
            const [driversRes, tripsRes, incidentsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('role', 'driver'),
                supabase.from('trips').select('driver_id, status, exit_km, entry_km, request_details'),
                supabase.from('incidents').select('driver_id, severity, type')
            ]);

            const drivers = driversRes.data || [];
            const trips = tripsRes.data || [];
            const incidents = incidentsRes.data || [];

            const driverStats = drivers.map(driver => {
                const myTrips = trips.filter(t => t.driver_id === driver.id);
                const myIncidents = incidents.filter(i => i.driver_id === driver.id);
                
                let score = 100;
                let totalKm = 0;
                let checklistCompliance = 0;

                // Aplicar penalizaciones dinámicas desde config
                myIncidents.forEach(inc => {
                    if (inc.type === 'fine' || inc.type === 'multa') score -= this.rules.fine_penalty;
                    else if (inc.severity === 'critical') score -= this.rules.critical_penalty;
                    else score -= this.rules.minor_penalty;
                });

                myTrips.forEach(t => {
                    if (t.status === 'closed') {
                        const dist = (t.entry_km || 0) - (t.exit_km || 0);
                        if (dist > 0) totalKm += dist;
                    }
                    // Penalización si el uniforme o equipo no estaba completo
                    if (t.request_details && t.request_details.uniform === false) score -= this.rules.checklist_penalty;
                    if (t.request_details && t.request_details.uniform) checklistCompliance++;
                });

                const complianceRate = myTrips.length > 0 ? Math.round((checklistCompliance / myTrips.length) * 100) : 100;
                if (score < 0) score = 0;

                return {
                    ...driver,
                    score: Math.round(score),
                    totalKm,
                    totalTrips: myTrips.length,
                    totalIncidents: myIncidents.filter(i => i.type !== 'fine').length,
                    totalFines: myIncidents.filter(i => i.type === 'fine' || i.type === 'multa').length,
                    complianceRate
                };
            });

            this.allStats = driverStats;
            this.renderCards(driverStats);
            
            // Stats de Flota
            const avg = driverStats.reduce((sum, s) => sum + s.score, 0) / (driverStats.length || 1);
            document.getElementById('avg-fleet-score').innerText = Math.round(avg) + " pts";

        } catch (err) { console.error(err); }
    }

    renderCards(stats) {
        const grid = document.getElementById('drivers-kpi-grid');
        grid.innerHTML = stats.map(stat => {
            let color = 'text-green-500';
            let border = 'border-[#324d67]';
            let bg = 'bg-green-500';
            
            if (stat.score < this.rules.risk_threshold) { color = 'text-yellow-500'; border = 'border-yellow-500/50'; bg = 'bg-yellow-500'; }
            if (stat.score < 65) { color = 'text-red-500'; border = 'border-red-500/50'; bg = 'bg-red-500'; }

            return `
            <div class="bg-[#1c2127] border ${border} rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div class="flex items-center gap-4 mb-4">
                    <div class="size-14 rounded-full bg-slate-700 bg-cover border-2 border-[#324d67]" style="background-image: url('${stat.photo_url || ''}')"></div>
                    <div>
                        <h3 class="text-white font-bold">${stat.full_name}</h3>
                        <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-widest">${stat.employee_id || 'ID: ---'}</p>
                    </div>
                    <div class="ml-auto text-right">
                        <p class="text-[9px] text-[#92adc9] uppercase font-black">SLA</p>
                        <p class="text-3xl font-black ${color}">${stat.score}</p>
                    </div>
                </div>
                <div class="w-full bg-[#111a22] h-1.5 rounded-full overflow-hidden mb-4">
                    <div class="${bg} h-full transition-all duration-1000" style="width: ${stat.score}%"></div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-center border-t border-[#324d67] pt-4">
                    <div><p class="text-[9px] text-[#92adc9] uppercase font-bold">Viajes</p><p class="text-white font-bold text-lg">${stat.totalTrips}</p></div>
                    <div><p class="text-[9px] text-[#92adc9] uppercase font-bold">Km</p><p class="text-white font-bold text-lg">${stat.totalKm}</p></div>
                    <div><p class="text-[9px] text-red-500 uppercase font-bold">Multas</p><p class="text-red-500 font-bold text-lg">${stat.totalFines}</p></div>
                    <div><p class="text-[9px] text-orange-400 uppercase font-bold">Incid.</p><p class="text-orange-500 font-bold text-lg">${stat.totalIncidents}</p></div>
                </div>
            </div>
            `;
        }).join('');
    }

    filterCards(criteria) {
        if (!this.allStats) return;
        let filtered = this.allStats;
        if (criteria === 'risk') filtered = this.allStats.filter(s => s.score < this.rules.risk_threshold);
        if (criteria === 'top') filtered = this.allStats.filter(s => s.score >= this.rules.top_threshold);
        this.renderCards(filtered);
    }

    exportSLA() {
        if (!this.allStats) return;
        const headers = ["Conductor", "ID", "Score", "Viajes", "Km", "Multas", "Incidentes"];
        const rows = this.allStats.map(s => [s.full_name, s.employee_id, s.score, s.totalTrips, s.totalKm, s.totalFines, s.totalIncidents]);
        let csv = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SLA_Conductores_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}