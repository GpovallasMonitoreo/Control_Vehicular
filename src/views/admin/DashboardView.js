import { supabase } from '../../config/supabaseClient.js';

export class DashboardView {
    
    render() {
        return `
        <div class="flex flex-col gap-6 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 class="text-3xl font-black text-white tracking-tight">Panel de Control</h1>
                    <p class="text-[#92adc9] text-sm">Resumen operativo en tiempo real.</p>
                </div>
                <div class="flex gap-2">
                    <span class="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Sistema Operativo
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-[#1c2127] p-5 rounded-xl border border-[#324d67] shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span class="material-symbols-outlined text-6xl text-blue-500">directions_car</span>
                    </div>
                    <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Flota Total</p>
                    <p id="kpi-total-vehicles" class="text-3xl font-black text-white mt-1">--</p>
                    <span class="text-xs text-blue-400 font-bold mt-2 block">Unidades registradas</span>
                </div>

                <div class="bg-[#1c2127] p-5 rounded-xl border border-[#324d67] shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span class="material-symbols-outlined text-6xl text-green-500">local_shipping</span>
                    </div>
                    <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">En Ruta</p>
                    <p id="kpi-active-trips" class="text-3xl font-black text-white mt-1">--</p>
                    <span class="text-xs text-green-500 font-bold mt-2 block">Viajes activos ahora</span>
                </div>

                <div class="bg-[#1c2127] p-5 rounded-xl border border-[#324d67] shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span class="material-symbols-outlined text-6xl text-red-500">warning</span>
                    </div>
                    <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Incidentes (Mes)</p>
                    <p id="kpi-incidents" class="text-3xl font-black text-white mt-1">--</p>
                    <span class="text-xs text-red-400 font-bold mt-2 block">Reportes pendientes</span>
                </div>

                <div class="bg-[#1c2127] p-5 rounded-xl border border-[#324d67] shadow-lg relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span class="material-symbols-outlined text-6xl text-purple-500">garage</span>
                    </div>
                    <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Hormona</p>
                    <p id="kpi-available" class="text-3xl font-black text-white mt-1">--</p>
                    <span class="text-xs text-purple-400 font-bold mt-2 block">Listos para asignar</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 flex flex-col">
                    <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">history</span> Actividad Reciente
                    </h3>
                    <div id="recent-activity" class="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                        <p class="text-slate-500 text-sm text-center py-4">Cargando...</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 h-min">
                    <button onclick="window.location.hash='#assignments'" class="bg-[#111a22] hover:bg-[#1f2937] border border-[#324d67] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 group">
                        <div class="size-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-2xl">add_link</span>
                        </div>
                        <span class="text-white text-sm font-bold">Nueva Asignación</span>
                    </button>

                    <button onclick="window.location.hash='#inventory'" class="bg-[#111a22] hover:bg-[#1f2937] border border-[#324d67] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 group">
                        <div class="size-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-2xl">directions_car</span>
                        </div>
                        <span class="text-white text-sm font-bold">Ver Inventario</span>
                    </button>

                    <button onclick="window.location.hash='#incidents-admin'" class="bg-[#111a22] hover:bg-[#1f2937] border border-[#324d67] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 group">
                        <div class="size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <span class="text-white text-sm font-bold">Incidentes</span>
                    </button>

                    <button onclick="window.location.hash='#reports'" class="bg-[#111a22] hover:bg-[#1f2937] border border-[#324d67] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:-translate-y-1 group">
                        <div class="size-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-2xl">bar_chart</span>
                        </div>
                        <span class="text-white text-sm font-bold">Reportes</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        // Cargar KPIs reales
        const [vehicles, trips, incidents] = await Promise.all([
            supabase.from('vehicles').select('id, status'),
            supabase.from('trips').select('id').eq('status', 'open'),
            supabase.from('incidents').select('id').eq('status', 'pending')
        ]);

        const totalV = vehicles.data?.length || 0;
        const activeT = trips.data?.length || 0;
        const pendingI = incidents.data?.length || 0;
        const availableV = vehicles.data?.filter(v => v.status === 'active').length || 0;

        document.getElementById('kpi-total-vehicles').innerText = totalV;
        document.getElementById('kpi-active-trips').innerText = activeT;
        document.getElementById('kpi-incidents').innerText = pendingI;
        document.getElementById('kpi-available').innerText = availableV;

        // Cargar Actividad Reciente (Últimos 5 viajes)
        const { data: recentTrips } = await supabase
            .from('trips')
            .select(`exit_time, vehicles(economic_number), driver:profiles!trips_driver_id_fkey(full_name)`)
            .order('exit_time', { ascending: false })
            .limit(5);

        const activityContainer = document.getElementById('recent-activity');
        if (recentTrips && recentTrips.length > 0) {
            activityContainer.innerHTML = recentTrips.map(t => `
                <div class="flex items-center gap-3 p-3 rounded-lg bg-[#111a22] border border-slate-800">
                    <div class="size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-bold">
                        SAL
                    </div>
                    <div>
                        <p class="text-white text-sm font-bold">Salida: ${t.vehicles?.economic_number}</p>
                        <p class="text-[#92adc9] text-xs">${t.driver?.full_name} • ${new Date(t.exit_time).toLocaleTimeString()}</p>
                    </div>
                </div>
            `).join('');
        } else {
            activityContainer.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin actividad reciente.</p>';
        }
    }
}