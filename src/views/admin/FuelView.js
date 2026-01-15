import { supabase } from '../../config/supabaseClient.js';

export class FuelView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight">Gestión de Combustible</h1>
                    <p class="text-[#92adc9] text-sm font-normal">Monitoreo de costos, consumo y eficiencia.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center bg-[#233648] rounded-lg px-3 py-2 border border-[#324d67]">
                        <span class="material-symbols-outlined text-[#92adc9] text-lg mr-2">calendar_today</span>
                        <span class="text-white text-sm font-medium">Este Mes</span>
                    </div>
                    <button class="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold shadow-lg">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Registrar Carga</span>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#233648] border border-[#324d67] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#92adc9] text-sm font-medium">Costo Total (Mes)</p>
                        <span class="material-symbols-outlined text-[#92adc9]">payments</span>
                    </div>
                    <p id="kpi-cost" class="text-white text-3xl font-bold leading-tight">$0.00</p>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#233648] border border-[#324d67] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#92adc9] text-sm font-medium">Eficiencia Promedio</p>
                        <span class="material-symbols-outlined text-[#92adc9]">speed</span>
                    </div>
                    <p id="kpi-efficiency" class="text-white text-3xl font-bold leading-tight">-- KM/L</p>
                </div>
                <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#233648] border border-[#324d67] shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-[#92adc9] text-sm font-medium">Litros Consumidos</p>
                        <span class="material-symbols-outlined text-[#92adc9]">local_gas_station</span>
                    </div>
                    <p id="kpi-liters" class="text-white text-3xl font-bold leading-tight">0 L</p>
                </div>
            </div>

            <div id="alert-section" class="hidden w-full">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div class="flex gap-4">
                        <div class="size-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-red-500">warning</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="text-white text-base font-bold leading-tight">Anomalía Detectada</p>
                            <p class="text-gray-300 text-sm font-normal leading-normal">La unidad <span class="font-bold text-white">ECO-205</span> reportó una caída de rendimiento del 40%.</p>
                        </div>
                    </div>
                    <button class="shrink-0 flex items-center justify-center rounded-lg h-9 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                        Investigar
                    </button>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <h3 class="text-white text-lg font-bold">Transacciones Recientes</h3>
                <div class="overflow-hidden rounded-xl border border-[#324d67] bg-[#233648] shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm text-gray-400">
                            <thead class="bg-[#1c2b3a] text-xs uppercase text-gray-300 font-semibold">
                                <tr>
                                    <th class="px-6 py-4">Fecha</th>
                                    <th class="px-6 py-4">Unidad</th>
                                    <th class="px-6 py-4">Estación</th>
                                    <th class="px-6 py-4 text-right">Litros</th>
                                    <th class="px-6 py-4 text-right">Costo</th>
                                    <th class="px-6 py-4 text-right">Rendimiento</th>
                                </tr>
                            </thead>
                            <tbody id="fuel-table-body" class="divide-y divide-[#324d67]">
                                <tr><td colspan="6" class="px-6 py-8 text-center">Cargando registros...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        console.log("Vista de Combustible cargada.");
        await this.loadFuelData();
    }

    async loadFuelData() {
        try {
            // Consulta a Supabase: Tabla fuel_logs + info del vehículo
            const { data: logs, error } = await supabase
                .from('fuel_logs')
                .select(`
                    *,
                    vehicles (economic_number)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.calculateKPIs(logs);
            this.renderTable(logs);

        } catch (err) {
            console.error("Error cargando combustible:", err);
            document.getElementById('fuel-table-body').innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-400">Error: ${err.message}</td></tr>`;
        }
    }

    calculateKPIs(logs) {
        if (!logs || logs.length === 0) return;

        // Sumar Costos y Litros
        const totalCost = logs.reduce((acc, log) => acc + (log.cost || 0), 0);
        const totalLiters = logs.reduce((acc, log) => acc + (log.liters || 0), 0);
        
        // Calcular Eficiencia Promedio (evitando división por cero)
        const efficiencyLogs = logs.filter(l => l.efficiency_calc > 0);
        const avgEfficiency = efficiencyLogs.length > 0 
            ? (efficiencyLogs.reduce((acc, log) => acc + log.efficiency_calc, 0) / efficiencyLogs.length).toFixed(1)
            : 0;

        // Actualizar DOM
        document.getElementById('kpi-cost').innerText = `$${totalCost.toLocaleString('es-MX', {minimumFractionDigits: 2})}`;
        document.getElementById('kpi-liters').innerText = `${totalLiters.toLocaleString()} L`;
        document.getElementById('kpi-efficiency').innerText = `${avgEfficiency} KM/L`;

        // Mostrar alerta si la eficiencia es muy baja (Simulación lógica)
        if (avgEfficiency > 0 && avgEfficiency < 5) {
            document.getElementById('alert-section').classList.remove('hidden');
        }
    }

    renderTable(logs) {
        const tbody = document.getElementById('fuel-table-body');
        
        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-[#92adc9]">No hay registros de combustible este mes.</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr class="hover:bg-[#2a4055] transition-colors border-b border-[#324d67]">
                <td class="px-6 py-4 font-medium text-white">
                    ${new Date(log.created_at).toLocaleDateString()} <span class="text-xs text-gray-500">${new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-gray-500 text-lg">local_shipping</span>
                        <span class="text-white font-medium">${log.vehicles?.economic_number || 'N/A'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-[#92adc9]">${log.station_name || 'Desconocida'}</td>
                <td class="px-6 py-4 text-right tabular-nums text-white">${log.liters} L</td>
                <td class="px-6 py-4 text-right tabular-nums font-bold text-emerald-400">$${log.cost}</td>
                <td class="px-6 py-4 text-right">
                    <span class="inline-flex items-center gap-1 rounded-full ${log.efficiency_calc < 5 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'} px-2 py-1 text-xs font-medium border">
                        ${log.efficiency_calc || '--'} km/L
                    </span>
                </td>
            </tr>
        `).join('');
    }
}