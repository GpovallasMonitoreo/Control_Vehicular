import { supabase } from '../../config/supabaseClient.js';

export class ReportsView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <div class="flex flex-col gap-4">
                <h1 class="text-white text-3xl font-black flex items-center gap-3">
                    <span class="material-symbols-outlined text-primary text-4xl">analytics</span>
                    Inteligencia de Desempeño (SLA Avanzado)
                </h1>
                
                <div class="flex border-b border-[#324d67] shrink-0">
                    <button onclick="window.switchTab('kpis')" id="tab-kpis" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">groups</span> Rendimiento Conductores
                    </button>
                    <button onclick="window.switchTab('audit')" id="tab-audit" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">fact_check</span> Auditoría Seguridad
                    </button>
                    <button onclick="window.switchTab('settings')" id="tab-settings" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">settings_input_component</span> Reglas SLA
                    </button>
                </div>
            </div>

            <div id="view-kpis" class="animate-fade-in space-y-6 overflow-hidden flex flex-col h-full">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1c2127] p-4 rounded-2xl border border-[#324d67] shrink-0">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <select id="kpi-filter" class="bg-[#111a22] border border-[#324d67] text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary w-full md:w-64">
                            <option value="all">Todos los Conductores</option>
                            <option value="risk">En Zona de Riesgo (< 80%)</option>
                            <option value="top">Excelencia Operativa (> 95%)</option>
                        </select>
                    </div>
                    <div class="flex gap-2 w-full md:w-auto">
                        <button id="btn-export-sla" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-sm">download</span> CSV (Tabla)
                        </button>
                        <button onclick="window.reports.exportFullReportPDF()" class="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">
                            <span class="material-symbols-outlined text-sm">picture_as_pdf</span> Reporte PDF
                        </button>
                    </div>
                </div>

                <div id="drivers-kpi-grid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                    <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                        <span class="loader mb-4"></span>
                        <p class="font-bold animate-pulse">Calculando métricas algorítmicas...</p>
                    </div>
                </div>
            </div>

            <div id="view-audit" class="hidden animate-fade-in space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-[#1c2127] border border-[#324d67] p-6 rounded-xl relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">monitoring</span></div>
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-widest z-10 relative">Score Promedio de Flota</p>
                        <div class="flex items-end gap-2 z-10 relative">
                            <p id="avg-fleet-score" class="text-4xl font-black text-white mt-2">--</p>
                            <p class="text-xs text-slate-400 mb-1">pts</p>
                        </div>
                    </div>
                    <div class="bg-[#1c2127] border border-[#324d67] p-6 rounded-xl relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">car_crash</span></div>
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-widest z-10 relative">Siniestralidad Promedio</p>
                        <div class="flex items-end gap-2 z-10 relative">
                            <p id="avg-sinister-rate" class="text-4xl font-black text-orange-400 mt-2">--</p>
                            <p class="text-[10px] text-slate-400 mb-1 leading-tight">incidentes<br>/10k km</p>
                        </div>
                    </div>
                    <div class="bg-[#1c2127] border border-[#324d67] p-6 rounded-xl relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">task_alt</span></div>
                        <p class="text-[#92adc9] text-xs font-bold uppercase tracking-widest z-10 relative">Cumplimiento Checklist</p>
                        <div class="flex items-end gap-2 z-10 relative">
                            <p id="avg-checklist-rate" class="text-4xl font-black text-green-400 mt-2">--%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="view-settings" class="hidden animate-fade-in max-w-2xl mx-auto w-full">
                <div class="bg-[#1c2127] border border-[#324d67] rounded-3xl overflow-hidden shadow-2xl">
                    <div class="p-6 border-b border-[#324d67] bg-[#151b23]">
                        <h3 class="text-xl font-bold text-white">Reglas de Negocio SLA</h3>
                        <p class="text-[#92adc9] text-xs mt-1">Define el peso de las penalizaciones para el cálculo del Score algorítmico.</p>
                    </div>
                    <form id="form-sla-settings" class="p-8 space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Multa Tránsito (-pts)</label>
                                <input type="number" id="cfg-fine" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-red-500 font-mono text-center" placeholder="10">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Choque/Siniestro Crítico (-pts)</label>
                                <input type="number" id="cfg-critical" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-red-500 font-mono text-center" placeholder="30">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Incidente Menor (-pts)</label>
                                <input type="number" id="cfg-minor" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-orange-500 font-mono text-center" placeholder="5">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Checklist Incompleto (-pts)</label>
                                <input type="number" id="cfg-checklist" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-yellow-500 font-mono text-center" placeholder="2">
                            </div>
                        </div>
                        <hr class="border-[#324d67]">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Límite Riesgo (Score < X)</label>
                                <input type="number" id="cfg-risk" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-primary font-mono text-center" placeholder="80">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-[#92adc9] uppercase mb-2 tracking-widest">Umbral Excelencia (Score > X)</label>
                                <input type="number" id="cfg-top" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-xl p-3 outline-none focus:border-green-500 font-mono text-center" placeholder="95">
                            </div>
                        </div>
                        <button type="submit" class="w-full py-4 bg-primary hover:bg-blue-600 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
                            Actualizar Algoritmo SLA
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

        await this.loadSLASettings(); 
        await this.loadDriverKPIs();
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
            document.getElementById('cfg-fine').value = data.fine_penalty;
            document.getElementById('cfg-critical').value = data.critical_penalty;
            document.getElementById('cfg-minor').value = data.minor_penalty;
            document.getElementById('cfg-checklist').value = data.checklist_penalty;
            document.getElementById('cfg-risk').value = data.risk_threshold;
            document.getElementById('cfg-top').value = data.top_threshold;
        } else {
            // Default silencioso
            this.rules = { fine_penalty: 10, critical_penalty: 30, minor_penalty: 5, checklist_penalty: 2, risk_threshold: 80, top_threshold: 95 };
        }
    }

    async saveSLASettings(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerText = "Recalculando...";
        
        const settings = {
            fine_penalty: parseInt(document.getElementById('cfg-fine').value) || 10,
            critical_penalty: parseInt(document.getElementById('cfg-critical').value) || 30,
            minor_penalty: parseInt(document.getElementById('cfg-minor').value) || 5,
            checklist_penalty: parseInt(document.getElementById('cfg-checklist').value) || 2,
            risk_threshold: parseInt(document.getElementById('cfg-risk').value) || 80,
            top_threshold: parseInt(document.getElementById('cfg-top').value) || 95,
            updated_at: new Date()
        };

        const { error } = await supabase.from('sla_settings').update(settings).eq('id', 'default_config');
        
        if (!error) {
            alert("✅ Algoritmo actualizado. Los scores de la flota han cambiado.");
            await this.loadSLASettings();
            await this.loadDriverKPIs();
            window.switchTab('kpis');
        } else {
            alert("Error: " + error.message);
        }
        btn.innerText = "Actualizar Algoritmo SLA";
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

            let globalTotalKm = 0;
            let globalIncidents = 0;
            let globalChecklistSum = 0;
            let driversWithTrips = 0;

            const driverStats = drivers.map(driver => {
                const myTrips = trips.filter(t => t.driver_id === driver.id);
                const myIncidents = incidents.filter(i => i.driver_id === driver.id);
                
                let score = 100;
                let totalKm = 0;
                let checklistPasses = 0;
                let criticalIncidents = 0;

                // Penalizaciones
                myIncidents.forEach(inc => {
                    if (inc.type === 'fine' || inc.type === 'multa') score -= this.rules.fine_penalty;
                    else if (inc.severity === 'critical') { score -= this.rules.critical_penalty; criticalIncidents++; }
                    else score -= this.rules.minor_penalty;
                });

                // Viajes y Checklist
                myTrips.forEach(t => {
                    if (t.status === 'closed') {
                        const dist = (t.entry_km || 0) - (t.exit_km || 0);
                        if (dist > 0) totalKm += dist;
                    }
                    
                    // Asumimos que request_details trae booleans (ej: tires: true, lights: true)
                    // Evaluamos si pasó la inspección visual (al menos 3 de 4)
                    if (t.request_details) {
                        const checks = [t.request_details.tires, t.request_details.lights, t.request_details.uniform, t.request_details.license];
                        const passed = checks.filter(Boolean).length;
                        if (passed >= 3) checklistPasses++;
                        else score -= this.rules.checklist_penalty;
                    }
                });

                // Calculo de nuevas métricas medibles
                const complianceRate = myTrips.length > 0 ? Math.round((checklistPasses / myTrips.length) * 100) : 100;
                
                // Siniestralidad: Incidentes graves por cada 10,000 km
                let sinisterIndex = 0;
                if (totalKm > 0) {
                    sinisterIndex = ((criticalIncidents / totalKm) * 10000).toFixed(2);
                }

                if (score < 0) score = 0;

                // Sumas globales para la pestaña de Auditoría
                if(myTrips.length > 0) {
                    globalTotalKm += totalKm;
                    globalIncidents += criticalIncidents;
                    globalChecklistSum += complianceRate;
                    driversWithTrips++;
                }

                return {
                    ...driver,
                    score: Math.round(score),
                    totalKm,
                    totalTrips: myTrips.length,
                    totalIncidents: myIncidents.filter(i => i.type !== 'fine').length,
                    totalFines: myIncidents.filter(i => i.type === 'fine' || i.type === 'multa').length,
                    complianceRate,
                    sinisterIndex
                };
            });

            // Ordenar por score descendente
            driverStats.sort((a,b) => b.score - a.score);

            this.allStats = driverStats;
            this.renderCards(driverStats);
            
            // Render Stats de Flota (Pestaña 2)
            const avgScore = driverStats.reduce((sum, s) => sum + s.score, 0) / (driverStats.length || 1);
            const avgChecklist = driversWithTrips > 0 ? (globalChecklistSum / driversWithTrips) : 100;
            const avgSinister = globalTotalKm > 0 ? ((globalIncidents / globalTotalKm) * 10000).toFixed(2) : 0;

            document.getElementById('avg-fleet-score').innerText = Math.round(avgScore);
            document.getElementById('avg-checklist-rate').innerText = Math.round(avgChecklist) + "%";
            document.getElementById('avg-sinister-rate').innerText = avgSinister;

        } catch (err) { console.error("Error calculando KPIs:", err); }
    }

    renderCards(stats) {
        const grid = document.getElementById('drivers-kpi-grid');
        
        if (stats.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-[#92adc9]">No se encontraron conductores con estos filtros.</div>`;
            return;
        }

        grid.innerHTML = stats.map(stat => {
            let color = 'text-green-500';
            let border = 'border-[#324d67]';
            let bgBar = 'bg-green-500';
            let tag = '<span class="bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Excelencia</span>';
            
            if (stat.score < this.rules.risk_threshold) { 
                color = 'text-red-500'; 
                border = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'; 
                bgBar = 'bg-red-500'; 
                tag = '<span class="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest animate-pulse">Riesgo Alto</span>';
            } else if (stat.score < this.rules.top_threshold) {
                color = 'text-yellow-500';
                bgBar = 'bg-yellow-500';
                tag = '<span class="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">Promedio</span>';
            }

            // Métrica de siniestralidad color
            const sinColor = stat.sinisterIndex > 0 ? 'text-red-400' : 'text-green-400';

            return `
            <div class="bg-[#1c2127] border ${border} rounded-2xl p-6 relative flex flex-col h-full hover:-translate-y-1 transition-transform">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="size-12 rounded-full bg-[#111a22] bg-cover bg-center border-2 border-[#324d67] shadow-inner" style="background-image: url('${stat.photo_url || `https://ui-avatars.com/api/?name=${stat.full_name}&background=111a22&color=fff`}')"></div>
                        <div>
                            <h3 class="text-white font-black text-sm leading-tight">${stat.full_name}</h3>
                            <p class="text-[10px] text-[#92adc9] font-mono mt-0.5">ID: ${stat.employee_id || '---'}</p>
                        </div>
                    </div>
                    ${tag}
                </div>

                <div class="mb-5">
                    <div class="flex justify-between items-end mb-1">
                        <p class="text-[10px] text-[#92adc9] uppercase font-black tracking-widest">SLA Score</p>
                        <p class="text-3xl font-black ${color} leading-none">${stat.score}</p>
                    </div>
                    <div class="w-full bg-[#111a22] h-1.5 rounded-full overflow-hidden">
                        <div class="${bgBar} h-full transition-all duration-1000" style="width: ${stat.score}%"></div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-4 bg-[#111a22] p-3 rounded-xl border border-[#324d67]">
                    <div>
                        <p class="text-[9px] text-[#92adc9] uppercase font-bold">Índice Siniestralidad</p>
                        <p class="text-sm font-mono font-bold ${sinColor}">${stat.sinisterIndex} <span class="text-[8px] text-slate-500">/ 10k km</span></p>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] text-[#92adc9] uppercase font-bold">Cuidado (Checklist)</p>
                        <p class="text-sm font-mono font-bold ${stat.complianceRate >= 90 ? 'text-green-400' : 'text-orange-400'}">${stat.complianceRate}% <span class="text-[8px] text-slate-500">Ok</span></p>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-2 text-center mt-auto pt-4 border-t border-[#324d67]/50">
                    <div><p class="text-[9px] text-[#92adc9] uppercase font-bold">Viajes</p><p class="text-white font-mono text-sm">${stat.totalTrips}</p></div>
                    <div><p class="text-[9px] text-[#92adc9] uppercase font-bold">Recorrido</p><p class="text-white font-mono text-sm">${(stat.totalKm/1000).toFixed(1)}k</p></div>
                    <div><p class="text-[9px] text-red-500/80 uppercase font-bold">Multas</p><p class="text-red-400 font-mono text-sm">${stat.totalFines}</p></div>
                    <div><p class="text-[9px] text-orange-500/80 uppercase font-bold">Fallas</p><p class="text-orange-400 font-mono text-sm">${stat.totalIncidents}</p></div>
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
        const headers = ["Conductor", "ID", "Score SLA", "Viajes Totales", "Km Recorridos", "Multas", "Fallas/Siniestros", "Indice Siniestralidad (x 10k km)", "Cumplimiento Checklist %"];
        const rows = this.allStats.map(s => [
            s.full_name, s.employee_id, s.score, s.totalTrips, s.totalKm, s.totalFines, s.totalIncidents, s.sinisterIndex, s.complianceRate
        ]);
        
        let csv = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `SLA_Conductores_Avanzado_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    exportFullReportPDF() {
        if (!this.allStats) return alert("Faltan datos para el reporte.");
        
        // Un reporte de impresión estilizado
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <html>
            <head>
                <title>Reporte Ejecutivo SLA Conductores</title>
                <style>
                    body{font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding:40px; color:#333;}
                    .header{text-align:center; border-bottom:2px solid #137fec; padding-bottom:20px; margin-bottom:30px;}
                    h1{color:#111a22; margin:0 0 10px 0;}
                    table{width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;}
                    th{background:#f1f5f9; color:#475569; padding:12px; text-align:left; border-bottom:2px solid #cbd5e1;}
                    td{padding:12px; border-bottom:1px solid #e2e8f0;}
                    .score-high{color:#10b981; font-weight:bold;}
                    .score-low{color:#ef4444; font-weight:bold;}
                    .footer{margin-top:40px; font-size:10px; color:#94a3b8; text-align:center;}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>REPORTE EJECUTIVO DE DESEMPEÑO (SLA)</h1>
                    <p>Métricas algorítmicas de conductores de la flota COV. Generado el ${new Date().toLocaleDateString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>CONDUCTOR</th>
                            <th>ID EMPLEADO</th>
                            <th>SCORE GLOBAL</th>
                            <th>KM RECORRIDOS</th>
                            <th>SINIESTRALIDAD (10k)</th>
                            <th>CHECKLIST %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.allStats.map(s => `
                            <tr>
                                <td><strong>${s.full_name}</strong></td>
                                <td>${s.employee_id || 'N/A'}</td>
                                <td class="${s.score >= this.rules.top_threshold ? 'score-high' : s.score < this.rules.risk_threshold ? 'score-low' : ''}">${s.score} pts</td>
                                <td>${Number(s.totalKm).toLocaleString()}</td>
                                <td>${s.sinisterIndex}</td>
                                <td>${s.complianceRate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    * El Índice de Siniestralidad calcula el número de incidentes graves reportados por cada 10,000 kilómetros recorridos.<br>
                    * Documento generado automáticamente por el Sistema de Gestión Vehicular COV.
                </div>
                <script>
                    window.onload = () => { window.print(); setTimeout(window.close, 1000); }
                </script>
            </body>
            </html>
        `);
        reportWindow.document.close();
    }
}
