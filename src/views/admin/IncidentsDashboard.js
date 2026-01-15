import { supabase } from '../../config/supabaseClient.js';

export class IncidentsDashboard {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-white text-3xl font-black">Centro de Incidentes</h1>
                    <p class="text-[#92adc9] text-sm">Bitácora de seguridad y reporte de daños.</p>
                </div>
                <div class="flex gap-2">
                    <button class="bg-[#1c2127] text-white px-4 py-2 rounded-lg border border-[#324d67] text-sm font-bold flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">filter_list</span> Filtrar
                    </button>
                    <button class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-red-900/20">
                        Exportar PDF
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl flex flex-col gap-2">
                    <div class="flex justify-between">
                        <span class="text-[#92adc9] text-xs font-bold uppercase">Críticos</span>
                        <span class="material-symbols-outlined text-red-500">warning</span>
                    </div>
                    <p id="count-critical" class="text-3xl font-black text-white">0</p>
                    <span class="text-red-500 text-xs font-bold">Requieren atención</span>
                </div>
                <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl flex flex-col gap-2">
                    <div class="flex justify-between">
                        <span class="text-[#92adc9] text-xs font-bold uppercase">Pendientes</span>
                        <span class="material-symbols-outlined text-yellow-500">pending</span>
                    </div>
                    <p id="count-pending" class="text-3xl font-black text-white">0</p>
                    <span class="text-[#92adc9] text-xs">En cola de revisión</span>
                </div>
                <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl flex flex-col gap-2">
                    <div class="flex justify-between">
                        <span class="text-[#92adc9] text-xs font-bold uppercase">Resueltos</span>
                        <span class="material-symbols-outlined text-green-500">check_circle</span>
                    </div>
                    <p class="text-3xl font-black text-white">--</p>
                    <span class="text-green-500 text-xs font-bold">Histórico</span>
                </div>
            </div>

            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden flex-1 flex flex-col shadow-lg">
                <div class="overflow-auto custom-scrollbar">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-[#111a22] text-[#92adc9] font-bold uppercase text-xs sticky top-0">
                            <tr>
                                <th class="px-6 py-4">Fecha</th>
                                <th class="px-6 py-4">Unidad</th>
                                <th class="px-6 py-4">Reportado Por</th>
                                <th class="px-6 py-4">Descripción</th>
                                <th class="px-6 py-4">Prioridad</th>
                                <th class="px-6 py-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody id="incidents-list" class="divide-y divide-[#324d67] text-white">
                            <tr><td colspan="6" class="p-8 text-center text-[#92adc9]">Cargando incidentes...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadIncidents();
    }

    async loadIncidents() {
        try {
            const { data: incidents, error } = await supabase
                .from('incidents')
                .select(`
                    *,
                    vehicles (economic_number),
                    profiles (full_name)
                `)
                .order('created_at', { ascending: false });

            if(error) throw error;

            this.renderTable(incidents);
            this.updateStats(incidents);

        } catch (err) {
            console.error(err);
        }
    }

    renderTable(incidents) {
        const tbody = document.getElementById('incidents-list');
        if(!incidents.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-[#92adc9]">No hay incidentes reportados.</td></tr>';
            return;
        }

        tbody.innerHTML = incidents.map(inc => `
            <tr class="hover:bg-[#324d67]/20 transition-colors">
                <td class="px-6 py-4">
                    <span class="font-mono text-xs text-[#92adc9]">#${inc.id.slice(0,4)}</span>
                    <div class="text-xs font-bold">${new Date(inc.created_at).toLocaleDateString()}</div>
                </td>
                <td class="px-6 py-4 font-bold">${inc.vehicles?.economic_number || 'N/A'}</td>
                <td class="px-6 py-4 text-sm">${inc.profiles?.full_name || 'Guardia/Admin'}</td>
                <td class="px-6 py-4 max-w-xs truncate text-slate-300" title="${inc.description}">${inc.description}</td>
                <td class="px-6 py-4">
                    ${this.getSeverityBadge(inc.severity)}
                </td>
                <td class="px-6 py-4 text-right">
                    ${this.getStatusBadge(inc.status)}
                </td>
            </tr>
        `).join('');
    }

    getSeverityBadge(severity) {
        const colors = {
            'low': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'medium': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            'critical': 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        return `<span class="px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${colors[severity] || colors.low}">${severity}</span>`;
    }

    getStatusBadge(status) {
        return status === 'pending' 
            ? `<span class="flex items-center gap-1 text-yellow-500 text-xs font-bold justify-end"><span class="size-2 rounded-full bg-yellow-500"></span> Pendiente</span>`
            : `<span class="flex items-center gap-1 text-green-500 text-xs font-bold justify-end"><span class="size-2 rounded-full bg-green-500"></span> Resuelto</span>`;
    }

    updateStats(incidents) {
        document.getElementById('count-pending').innerText = incidents.filter(i => i.status === 'pending').length;
        document.getElementById('count-critical').innerText = incidents.filter(i => i.severity === 'critical').length;
    }
}