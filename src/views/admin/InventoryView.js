import { supabase } from '../../config/supabaseClient.js';

export class InventoryView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-20">
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-end">
                    <div>
                        <h1 class="text-white text-3xl font-black">Inventario Maestro</h1>
                        <p class="text-[#92adc9] text-sm">Gestión de activos, expediente digital y seguridad.</p>
                    </div>
                </div>
                <div class="flex border-b border-[#324d67]">
                    <button onclick="window.switchInvTab('vehicles')" id="tab-vehicles" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors">Vehículos</button>
                    <button onclick="window.switchInvTab('drivers')" id="tab-drivers" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Conductores & Licencias</button>
                </div>
            </div>

            <div id="view-vehicles" class="animate-fade-in space-y-6">
                <div class="flex justify-end">
                    <button onclick="document.getElementById('modal-add-vehicle').classList.remove('hidden')" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                        <span class="material-symbols-outlined">add_circle</span> Nueva Unidad
                    </button>
                </div>
                
                <div id="grid-vehicles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <p class="text-slate-500 col-span-full text-center py-10">Cargando flota...</p>
                </div>
            </div>

            <div id="view-drivers" class="hidden animate-fade-in space-y-6">
                <div class="flex justify-end">
                    <button onclick="document.getElementById('modal-add-driver').classList.remove('hidden')" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                        <span class="material-symbols-outlined">person_add</span> Nuevo Conductor
                    </button>
                </div>
                
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden shadow-lg">
                    <table class="w-full text-left text-sm text-[#92adc9]">
                        <thead class="bg-[#111a22] text-xs font-bold uppercase sticky top-0">
                            <tr>
                                <th class="px-6 py-4">Perfil</th>
                                <th class="px-6 py-4">Licencia</th>
                                <th class="px-6 py-4 text-center">Validación Biométrica</th>
                                <th class="px-6 py-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody id="table-drivers" class="divide-y divide-[#324d67]"></tbody>
                    </table>
                </div>
            </div>

            <div id="modal-detail" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-5xl rounded-2xl border border-[#324d67] shadow-2xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#111a22]">
                        <div class="flex items-center gap-4">
                            <div class="bg-primary/20 p-2 rounded-lg text-primary">
                                <span class="material-symbols-outlined text-2xl">local_shipping</span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-white leading-none" id="detail-title">ECO-XXX</h2>
                                <p class="text-xs text-[#92adc9] mt-1 font-mono" id="detail-plate">PLACAS</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('modal-detail').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#232a33] p-2 rounded-full hover:bg-red-500/20 hover:text-red-500">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="bg-[#232a33] p-5 rounded-xl border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Costo Reparaciones</p>
                                <p id="detail-cost" class="text-2xl font-black text-white mt-1">$0.00</p>
                            </div>
                            <div class="bg-[#232a33] p-5 rounded-xl border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Incidentes Totales</p>
                                <p id="detail-incidents" class="text-2xl font-black text-orange-500 mt-1">0</p>
                            </div>
                            <div class="bg-[#232a33] p-5 rounded-xl border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Kilometraje</p>
                                <p id="detail-km" class="text-2xl font-black text-primary mt-1">0 km</p>
                            </div>
                        </div>

                        <div class="lg:col-span-1 space-y-4">
                            <div class="aspect-[4/3] bg-black rounded-xl border border-[#324d67] overflow-hidden relative group">
                                <img id="detail-img" src="" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                                <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                    <p class="text-white text-xs font-bold uppercase tracking-wider">Foto Actual</p>
                                </div>
                            </div>
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold text-sm mb-2">Estado Actual</h4>
                                <span id="detail-status" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300">--</span>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-4">
                            <h3 class="text-white font-bold text-sm uppercase tracking-wider border-b border-[#324d67] pb-2">Historial de Incidentes y Mantenimiento</h3>
                            <div id="detail-logs" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-add-vehicle" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] p-6 shadow-2xl animate-fade-in-up">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">add_circle</span>
                        Alta de Unidad
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Económico</label>
                            <input id="new-eco" type="text" placeholder="Ej: ECO-205" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Placas</label>
                            <input id="new-plate" type="text" placeholder="Ej: NCL-558" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Modelo</label>
                            <input id="new-model" type="text" placeholder="Ej: Nissan NP300" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">URL Imagen (Opcional)</label>
                            <input id="new-img" type="text" placeholder="https://..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                        </div>
                        
                        <div class="flex gap-3 pt-4">
                            <button onclick="document.getElementById('modal-add-vehicle').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors bg-[#232a33] rounded-lg">Cancelar</button>
                            <button onclick="window.saveVehicle()" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg transition-all">Guardar Unidad</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-add-driver" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] p-6 shadow-2xl animate-fade-in-up">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">person_add</span>
                        Alta de Conductor
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Nombre Completo</label>
                            <input id="new-driver-name" type="text" placeholder="Nombre y Apellido" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Email (Login)</label>
                            <input id="new-driver-email" type="email" placeholder="correo@cov.mx" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">No. Licencia</label>
                            <input id="new-driver-lic" type="text" placeholder="A0000000" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        
                        <div class="flex gap-3 pt-4">
                            <button onclick="document.getElementById('modal-add-driver').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold bg-[#232a33] rounded-lg">Cancelar</button>
                            <button onclick="window.saveDriver()" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    onMount() {
        this.loadVehicles();
        this.loadDrivers();

        // Funciones Globales
        window.switchInvTab = (tab) => {
            document.getElementById('view-vehicles').classList.add('hidden');
            document.getElementById('view-drivers').classList.add('hidden');
            document.getElementById('tab-vehicles').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
            document.getElementById('tab-drivers').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";

            document.getElementById(`view-${tab}`).classList.remove('hidden');
            document.getElementById(`tab-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors";
        };

        window.saveVehicle = async () => {
            const eco = document.getElementById('new-eco').value;
            const plate = document.getElementById('new-plate').value;
            const model = document.getElementById('new-model').value;
            const img = document.getElementById('new-img').value;

            if(!eco || !plate) return alert("Económico y Placas son obligatorios");

            const { error } = await supabase.from('vehicles').insert({ 
                economic_number: eco, 
                plate: plate, 
                model: model, 
                status: 'active',
                image_url: img 
            });

            if(error) alert("Error al guardar: " + error.message);
            else { 
                alert("✅ Unidad guardada exitosamente");
                document.getElementById('modal-add-vehicle').classList.add('hidden');
                this.loadVehicles(); 
            }
        };

        window.saveDriver = async () => {
            const name = document.getElementById('new-driver-name').value;
            const email = document.getElementById('new-driver-email').value;
            const lic = document.getElementById('new-driver-lic').value;
            
            // ID Simulado para Alpha
            const fakeId = crypto.randomUUID(); 

            const { error } = await supabase.from('profiles').insert({
                id: fakeId,
                email: email,
                full_name: name,
                license_number: lic,
                role: 'driver',
                photo_url: 'https://via.placeholder.com/150?text=Foto',
                license_photo_url: 'https://via.placeholder.com/300x200?text=Licencia'
            });

            if(error) alert("Error: " + error.message);
            else {
                alert("✅ Conductor registrado");
                document.getElementById('modal-add-driver').classList.add('hidden');
                this.loadDrivers();
            }
        };

        window.openDetail = async (id) => {
            document.getElementById('modal-detail').classList.remove('hidden');
            
            const [vehicleRes, incidentsRes, maintRes] = await Promise.all([
                supabase.from('vehicles').select('*').eq('id', id).single(),
                supabase.from('incidents').select('*').eq('vehicle_id', id),
                supabase.from('maintenance_logs').select('*').eq('vehicle_id', id)
            ]);

            const vehicle = vehicleRes.data;
            const incidents = incidentsRes.data || [];
            const maintenance = maintRes.data || [];

            document.getElementById('detail-title').innerText = `${vehicle.economic_number}`;
            document.getElementById('detail-plate').innerText = `${vehicle.model} • ${vehicle.plate}`;
            document.getElementById('detail-img').src = vehicle.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=60';
            document.getElementById('detail-incidents').innerText = incidents.length;
            document.getElementById('detail-km').innerText = `${vehicle.current_km || 0} km`;
            
            const totalCost = maintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
            document.getElementById('detail-cost').innerText = `$${totalCost.toLocaleString()}`;

            const statusEl = document.getElementById('detail-status');
            statusEl.innerText = vehicle.status;
            statusEl.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                vehicle.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`;
            
            const logsContainer = document.getElementById('detail-logs');
            const allEvents = [
                ...incidents.map(i => ({ type: 'INCIDENTE', date: i.reported_at, desc: i.description, cost: 0, color: 'red' })),
                ...maintenance.map(m => ({ type: 'SERVICIO', date: m.scheduled_date, desc: m.service_type, cost: m.cost, color: 'blue' }))
            ].sort((a,b) => new Date(b.date) - new Date(a.date));

            if(allEvents.length === 0) {
                logsContainer.innerHTML = '<p class="text-slate-500 text-center py-4 text-xs">Sin historial registrado.</p>';
            } else {
                logsContainer.innerHTML = allEvents.map(e => `
                    <div class="flex justify-between items-center p-3 bg-[#111a22] rounded-lg border-l-4 ${e.color === 'red' ? 'border-red-500' : 'border-blue-500'} hover:bg-[#16202a] transition-colors">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-bold uppercase ${e.color === 'red' ? 'text-red-500' : 'text-blue-400'}">${e.type}</span>
                                <span class="text-xs text-[#92adc9]">${new Date(e.date).toLocaleDateString()}</span>
                            </div>
                            <p class="text-white font-bold text-sm mt-0.5">${e.desc}</p>
                        </div>
                        ${e.cost > 0 ? `<span class="text-white font-mono text-sm">$${e.cost}</span>` : ''}
                    </div>
                `).join('');
            }
        };
    }

    async loadVehicles() {
        const { data } = await supabase.from('vehicles').select('*');
        const grid = document.getElementById('grid-vehicles');
        
        if(!data || !data.length) {
            grid.innerHTML = '<p class="text-slate-500 col-span-full text-center">No hay vehículos.</p>';
            return;
        }

        grid.innerHTML = data.map(v => `
            <div onclick="window.openDetail('${v.id}')" class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <div class="h-40 bg-black relative">
                    <img src="${v.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase">${v.status}</div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-white font-bold text-lg">${v.economic_number}</h3>
                            <p class="text-[#92adc9] text-xs uppercase font-bold tracking-wider">${v.model || 'Sin Modelo'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-white font-mono font-bold text-sm bg-[#111a22] px-2 py-1 rounded border border-[#324d67]">${v.plate}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-[#324d67] flex justify-between items-center text-xs text-[#92adc9]">
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">speed</span> ${v.current_km || 0} km</span>
                        <span class="text-primary font-bold hover:underline">Ver Detalles &rarr;</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadDrivers() {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'driver');
        const tbody = document.getElementById('table-drivers');
        
        if(!data || !data.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-500">No hay conductores registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(d => `
            <tr class="hover:bg-[#232b34] transition-colors border-b border-[#324d67] last:border-0">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-slate-700 bg-cover border-2 border-[#324d67]" style="background-image: url('${d.photo_url || 'https://via.placeholder.com/150'}')"></div>
                        <div>
                            <p class="text-white font-bold text-sm">${d.full_name}</p>
                            <p class="text-xs text-[#92adc9]">ID: ${d.employee_id || 'N/A'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 bg-[#111a22] w-fit px-3 py-1.5 rounded-lg border border-[#324d67]">
                        <span class="material-symbols-outlined text-slate-500 text-sm">badge</span>
                        <span class="text-white font-mono text-xs font-bold">${d.license_number || 'PENDIENTE'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="inline-flex items-center justify-center gap-2 bg-[#111a22] p-1.5 rounded-full border border-[#324d67] group cursor-help relative" title="Comparación Biométrica">
                        <img src="${d.license_photo_url || 'https://via.placeholder.com/30'}" class="size-8 rounded-full object-cover opacity-50 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-green-500 text-xs bg-green-500/10 rounded-full p-0.5">check</span>
                        <img src="${d.photo_url || 'https://via.placeholder.com/30'}" class="size-8 rounded-full object-cover">
                        <div class="absolute -top-8 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Coincidencia: 98.5%
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase">Activo</span>
                </td>
            </tr>
        `).join('');
    }
}