import { supabase } from '../../config/supabaseClient.js';

export class FleetView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black flex items-center gap-3">
                        <span class="material-symbols-outlined text-4xl text-blue-500">local_shipping</span>
                        Inteligencia de Flota
                    </h1>
                    <p class="text-[#92adc9] text-sm font-medium">Hoja de vida por unidad, multas y rendimiento.</p>
                </div>
                <button id="btn-export-csv" class="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95">
                    <span class="material-symbols-outlined">download_for_offline</span>
                    EXPORTAR A EXCEL (CSV)
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-[#1c2127] p-5 rounded-2xl border border-red-500/30 flex items-center gap-4 shadow-lg">
                    <div class="p-3 bg-red-500/10 rounded-xl text-red-500"><span class="material-symbols-outlined text-3xl">receipt_long</span></div>
                    <div><p class="text-slate-400 text-[10px] uppercase font-black tracking-widest">Total Multas</p><h3 id="fleet-fines" class="text-3xl font-black text-white leading-none mt-1">--</h3></div>
                </div>
                <div class="bg-[#1c2127] p-5 rounded-2xl border border-blue-500/30 flex items-center gap-4 shadow-lg">
                    <div class="p-3 bg-blue-500/10 rounded-xl text-blue-500"><span class="material-symbols-outlined text-3xl">speed</span></div>
                    <div><p class="text-slate-400 text-[10px] uppercase font-black tracking-widest">Km Acumulados</p><h3 id="fleet-km" class="text-3xl font-black text-white leading-none mt-1">--</h3></div>
                </div>
                <div class="bg-[#1c2127] p-5 rounded-2xl border border-green-500/30 flex items-center gap-4 shadow-lg">
                    <div class="p-3 bg-green-500/10 rounded-xl text-green-500"><span class="material-symbols-outlined text-3xl">local_gas_station</span></div>
                    <div><p class="text-slate-400 text-[10px] uppercase font-black tracking-widest">Gasto Combustible</p><h3 id="fleet-fuel" class="text-3xl font-black text-white leading-none mt-1">--</h3></div>
                </div>
                <div class="bg-[#1c2127] p-5 rounded-2xl border border-orange-500/30 flex items-center gap-4 shadow-lg">
                    <div class="p-3 bg-orange-500/10 rounded-xl text-orange-500"><span class="material-symbols-outlined text-3xl">report_problem</span></div>
                    <div><p class="text-slate-400 text-[10px] uppercase font-black tracking-widest">Incidentes</p><h3 id="fleet-incidents" class="text-3xl font-black text-white leading-none mt-1">--</h3></div>
                </div>
            </div>

            <div class="bg-[#1c2127] rounded-2xl border border-[#324d67] overflow-hidden flex flex-col shadow-2xl flex-1 min-h-[500px]">
                <div class="p-6 border-b border-[#324d67] bg-[#151b23] flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 class="font-bold text-white text-lg">Historial Operativo por Unidad</h3>
                    <input id="fleet-search" type="text" placeholder="Buscar ECO-XXX..." class="w-full md:w-72 bg-[#0d141c] border border-[#324d67] text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500">
                </div>
                
                <div class="flex-1 overflow-y-auto p-0 custom-scrollbar">
                    <table id="table-to-export" class="w-full text-left border-collapse">
                        <thead class="bg-[#111a22] text-[10px] text-[#92adc9] uppercase font-black sticky top-0 z-10 border-b border-[#324d67]">
                            <tr>
                                <th class="p-5">Unidad / Modelo</th>
                                <th class="p-5">Estado</th>
                                <th class="p-5 text-center">Viajes</th>
                                <th class="p-5 text-center">Multas</th>
                                <th class="p-5 text-center">Accidentes</th>
                                <th class="p-5 text-right">Km Recorridos</th>
                                <th class="p-5">Último Operador</th>
                            </tr>
                        </thead>
                        <tbody id="fleet-table-body" class="text-sm divide-y divide-[#324d67]/50">
                            <tr><td colspan="7" class="p-20 text-center text-slate-500">Calculando métricas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        `;
    }

    async onMount() {
        await this.loadFleetData();
        
        // Listener del Buscador
        document.getElementById('fleet-search').addEventListener('input', (e) => {
            const val = e.target.value.toUpperCase();
            document.querySelectorAll('#fleet-table-body tr').forEach(row => {
                row.style.display = row.innerText.toUpperCase().includes(val) ? '' : 'none';
            });
        });

        // Listener de Exportación
        document.getElementById('btn-export-csv').addEventListener('click', () => this.exportToCSV());
    }

    async loadFleetData() {
        try {
            const [vehiclesRes, tripsRes, incidentsRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('economic_number'),
                supabase.from('trips').select('vehicle_id, entry_km, exit_km, status, driver:profiles(full_name)'),
                supabase.from('incidents').select('vehicle_id, type') 
            ]);

            const vehicles = vehiclesRes.data || [];
            const trips = tripsRes.data || [];
            const incidents = incidentsRes.data || [];

            let totalFines = 0;
            let totalKmFleet = 0;
            let totalIncidents = 0;

            this.dataForExport = vehicles.map(v => {
                const vTrips = trips.filter(t => t.vehicle_id === v.id);
                const vIncidents = incidents.filter(i => i.vehicle_id === v.id);
                
                const fines = vIncidents.filter(i => i.type === 'fine' || i.type === 'multa').length;
                const accidents = vIncidents.filter(i => i.type !== 'fine' && i.type !== 'multa').length;
                
                const kmRecorridos = vTrips.reduce((acc, t) => {
                    if (t.status === 'closed' && t.entry_km > t.exit_km) return acc + (t.entry_km - t.exit_km);
                    return acc;
                }, 0);

                const lastTrip = vTrips[vTrips.length - 1];
                const lastDriver = lastTrip ? lastTrip.driver.full_name : 'N/A';

                totalFines += fines;
                totalKmFleet += kmRecorridos;
                totalIncidents += accidents;

                return { ...v, fines, accidents, tripCount: vTrips.length, kmRecorridos, lastDriver };
            });

            document.getElementById('fleet-fines').innerText = totalFines;
            document.getElementById('fleet-km').innerText = totalKmFleet.toLocaleString() + " km";
            document.getElementById('fleet-incidents').innerText = totalIncidents;
            document.getElementById('fleet-fuel').innerText = Math.round(totalKmFleet / 7.5).toLocaleString() + " L";

            const tbody = document.getElementById('fleet-table-body');
            tbody.innerHTML = this.dataForExport.map(v => `
                <tr class="hover:bg-[#1a212b] transition-all">
                    <td class="p-5"><div class="flex flex-col"><span class="text-white font-black font-mono text-lg">${v.economic_number}</span><span class="text-[#92adc9] text-[11px] uppercase">${v.model}</span></div></td>
                    <td class="p-5"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase border ${v.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}">${v.status === 'active' ? 'Activo' : 'Baja'}</span></td>
                    <td class="p-5 text-center text-white font-bold">${v.tripCount}</td>
                    <td class="p-5 text-center">${v.fines > 0 ? `<span class="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-black">${v.fines}</span>` : '0'}</td>
                    <td class="p-5 text-center">${v.accidents > 0 ? `<span class="text-orange-500 font-black">${v.accidents}</span>` : '0'}</td>
                    <td class="p-5 text-right font-mono text-white">${v.kmRecorridos.toLocaleString()} km</td>
                    <td class="p-5 text-white text-xs font-medium">${v.lastDriver}</td>
                </tr>
            `).join('');

        } catch (err) {
            console.error(err);
        }
    }

    // --- FUNCIÓN DE EXPORTACIÓN ---
    exportToCSV() {
        if (!this.dataForExport || this.dataForExport.length === 0) return alert("No hay datos para exportar");

        // Cabeceras
        const headers = ["Unidad", "Modelo", "Placa", "Estado", "Total Viajes", "Multas", "Accidentes", "Kilometraje Total", "Ultimo Conductor"];
        
        // Formatear filas
        const rows = this.dataForExport.map(v => [
            v.economic_number,
            v.model,
            v.plate || 'S/P',
            v.status,
            v.tripCount,
            v.fines,
            v.accidents,
            v.kmRecorridos,
            v.lastDriver
        ]);

        // Crear contenido CSV (Delimitado por comas)
        let csvContent = headers.join(",") + "\n";
        rows.forEach(rowArray => {
            let row = rowArray.join(",");
            csvContent += row + "\n";
        });

        // Crear el archivo y descargar con compatibilidad Excel (BOM UTF-8)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Flota_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}