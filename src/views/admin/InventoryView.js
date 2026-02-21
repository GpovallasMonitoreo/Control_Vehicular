import { supabase } from '../../config/supabaseClient.js';

export class InventoryView {
    constructor() {
        this.vehicles = [];
        this.drivers = [];
        this.inspections = [];
        this.inventory = [];
        this.services = []; 
        this.vehicleLogs = [];
        this.vehicleTrips = [];
        this.vehicleDocuments = [];
        this.allAppTrips = []; 
        this.vehicleAppTrips = []; 
        this.vehicleInspectionsPhotos = []; 
        this.selectedVehicle = null;
        this.pendingStockDeduction = [];
        this.realtimeChannel = null; 
        
        window.invModule = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-20 p-6">
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-end">
                    <div>
                        <h1 class="text-white text-3xl font-black">Inventario Maestro</h1>
                        <p class="text-[#92adc9] text-sm">Gestión de activos, expediente digital y seguridad.</p>
                    </div>
                </div>
                <div class="flex border-b border-[#324d67]">
                    <button onclick="window.invModule.switchMainTab('vehicles')" id="main-tab-vehicles" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors">Vehículos</button>
                    <button onclick="window.invModule.switchMainTab('drivers')" id="main-tab-drivers" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Conductores & Licencias</button>
                    <button onclick="window.invModule.switchMainTab('inspections')" id="main-tab-inspections" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Inspecciones</button>
                </div>
            </div>

            <div id="main-view-vehicles" class="animate-fade-in space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-[#92adc9] text-sm">Haz clic en cualquier unidad para ver expediente completo, bitácora o inspección.</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.invModule.openVehicleRegister()" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                            <span class="material-symbols-outlined">add_circle</span> Nueva Unidad
                        </button>
                    </div>
                </div>
                
                <div id="grid-vehicles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                        <p>Cargando flota...</p>
                    </div>
                </div>
            </div>

            <div id="main-view-drivers" class="hidden animate-fade-in space-y-6">
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

            <div id="main-view-inspections" class="hidden animate-fade-in space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-white text-xl font-bold">Historial de Inspecciones</h2>
                        <p class="text-[#92adc9] text-sm">Registro de verificaciones de estado de vehículos</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="date" id="filter-date" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm outline-none focus:border-primary">
                        <select id="filter-vehicle" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm outline-none focus:border-primary">
                            <option value="">Todos los vehículos</option>
                        </select>
                    </div>
                </div>
                <div id="inspections-list" class="space-y-4"></div>
            </div>

            <div id="global-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div id="global-modal-content" class="bg-[#1c2127] w-full border border-[#324d67] rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fade-in-up"></div>
            </div>

            <div id="modal-add-driver" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] p-6 shadow-2xl animate-fade-in-up">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">person_add</span> Alta de Conductor
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
                            <button onclick="document.getElementById('modal-add-driver').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold bg-[#232a33] hover:text-white rounded-lg">Cancelar</button>
                            <button onclick="window.invModule.saveDriver()" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="inv-notification-toast" class="hidden fixed bottom-6 right-6 z-50 bg-[#1c2127] border border-primary text-white p-4 rounded-xl shadow-2xl animate-fade-in-up flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">notifications_active</span>
                <p id="inv-notification-text" class="text-sm font-bold"></p>
            </div>

        </div>
        `;
    }

    async onMount() {
        await this.loadAllData();
        this.setupRealtimeSubscription(); 
    }

    setupRealtimeSubscription() {
        if (!supabase) return;
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);

        this.realtimeChannel = supabase
            .channel('inventory_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
                this.handleVehicleRealtimeUpdate(payload);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_inspections' }, () => {
                this.refreshInspections();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
                this.loadAllData(); 
            })
            .subscribe((status) => {
                console.log('📡 Inventario Realtime:', status);
            });
    }

    async handleVehicleRealtimeUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'INSERT') {
            this.vehicles.push(newRecord);
            this.showToast(`Nueva unidad registrada: ECO-${newRecord.economic_number}`);
        } 
        else if (eventType === 'UPDATE') {
            const index = this.vehicles.findIndex(v => v.id === newRecord.id);
            if (index !== -1) {
                this.vehicles[index] = newRecord;
                if (this.selectedVehicle && this.selectedVehicle.id === newRecord.id) {
                    this.selectedVehicle = newRecord;
                    this.updateActiveModalInfo();
                }
            }
        } 
        else if (eventType === 'DELETE') {
            this.vehicles = this.vehicles.filter(v => v.id !== oldRecord.id);
        }

        this.vehicles.sort((a, b) => (a.economic_number || '').localeCompare(b.economic_number || ''));
        this.renderVehiclesGrid();
        this.updateFilterSelects();
    }

    async refreshInspections() {
        const { data } = await supabase.from('vehicle_inspections').select('*, vehicles(economic_number, plate, model)').order('created_at', { ascending: false });
        if (data) {
            this.inspections = data;
            this.renderInspectionsList();
        }
    }

    showToast(msg, title = 'Aviso', type = 'info') {
        const toast = document.getElementById('inv-notification-toast');
        const text = document.getElementById('inv-notification-text');
        if (toast && text) {
            text.innerText = msg;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 4000);
        }
    }

    // --- CARGA DE DATOS SEGUROS ---
    async loadAllData() {
        if (!supabase) return;

        try {
            const [vehRes, drvRes, insRes, invRes, srvRes, docRes, tripsAllRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('economic_number'),
                supabase.from('profiles').select('*').eq('role', 'driver'),
                supabase.from('vehicle_inspections').select('*, vehicles(economic_number, plate, model)').order('created_at', { ascending: false }).then(r => r.error ? {data: []} : r),
                supabase.from('inventory_items').select('*').order('name').then(r => r.error ? {data: []} : r),
                supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock, sku))').then(r => r.error ? {data: []} : r),
                supabase.from('vehicle_documents').select('*').then(r => r.error ? {data: []} : r),
                supabase.from('trips').select('id, vehicle_id, status, destination, created_at, profiles:driver_id(full_name), workshop_reception_photos, workshop_return_photos').order('created_at', { ascending: false }).then(r => r.error ? {data: []} : r)
            ]);

            this.vehicles = vehRes.data || [];
            this.drivers = drvRes.data || [];
            this.inspections = insRes.data || [];
            this.inventory = invRes.data || [];
            this.services = srvRes.data || [];
            this.vehicleDocuments = docRes.data || [];
            this.allAppTrips = tripsAllRes.data || [];

            this.renderVehiclesGrid();
            this.renderDriversTable();
            this.renderInspectionsList();
            this.updateFilterSelects();
            
        } catch (error) {
            console.error("Error cargando inventario:", error);
            document.getElementById('grid-vehicles').innerHTML = '<p class="text-red-500 col-span-full text-center">Error al conectar con la base de datos.</p>';
        }
    }

    updateFilterSelects() {
        const select = document.getElementById('filter-vehicle');
        if (select) {
            const currentVal = select.value;
            select.innerHTML = '<option value="">Todos los vehículos</option>' + 
                this.vehicles.map(v => `<option value="${v.id}">ECO-${v.economic_number} - ${v.plate}</option>`).join('');
            select.value = currentVal; 
        }
    }

    switchMainTab(tab) {
        document.getElementById('main-view-vehicles').classList.add('hidden');
        document.getElementById('main-view-drivers').classList.add('hidden');
        document.getElementById('main-view-inspections').classList.add('hidden');
        
        document.getElementById('main-tab-vehicles').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
        document.getElementById('main-tab-drivers').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
        document.getElementById('main-tab-inspections').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";

        document.getElementById(`main-view-${tab}`).classList.remove('hidden');
        document.getElementById(`main-tab-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors";
    }

    renderVehiclesGrid() {
        const grid = document.getElementById('grid-vehicles');
        if(this.vehicles.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20 bg-[#111a22] border border-[#324d67] border-dashed rounded-xl">
                    <span class="material-symbols-outlined text-5xl text-slate-500 mb-2">directions_car</span>
                    <p class="text-slate-400 font-bold">No hay vehículos registrados</p>
                    <button onclick="window.invModule.openVehicleRegister()" class="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">Registrar Primer Unidad</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.vehicles.map(v => {
            const imgUrl = (v.image_url && v.image_url !== "0" && v.image_url !== "null") ? v.image_url : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=60';
            
            const activeTrip = this.allAppTrips.find(t => t.vehicle_id === v.id && ['requested', 'approved_for_taller', 'driver_accepted', 'in_progress'].includes(t.status));
            let statusName = v.status === 'active' ? 'Disponible' : (v.status === 'maintenance' ? 'En Taller' : 'Inactivo');
            let statusColor = v.status === 'active' ? 'border-green-500 text-green-400' : (v.status === 'maintenance' ? 'border-orange-500 text-orange-400' : 'border-red-500 text-red-400');
            
            if (activeTrip) {
                statusName = 'En Uso';
                statusColor = 'border-blue-500 text-blue-400 bg-blue-500/20';
            } else if (v.status === 'in_use') {
                statusName = 'En Uso';
                statusColor = 'border-blue-500 text-blue-400 bg-blue-500/20';
            }
            
            return `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(19,127,236,0.15)] hover:-translate-y-1 relative" onclick="window.invModule.openVehicleDetail('${v.id}')">
                <div class="h-40 bg-[#111a22] relative border-b border-[#324d67]">
                    <img src="${imgUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded border ${statusColor} uppercase tracking-widest shadow-lg">
                        ${statusName}
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-white font-bold text-lg leading-tight truncate pr-2" title="${v.brand} ${v.model}">${v.brand || 'Vehículo'} ${v.model || ''}</h3>
                            <span class="text-xs text-[#92adc9]">${v.year || '--'}</span>
                        </div>
                        <span class="bg-primary/20 text-primary text-xs font-black px-2 py-1 rounded border border-primary/30 shrink-0">ECO-${v.economic_number}</span>
                    </div>
                    <div class="text-sm text-[#92adc9] mb-4 bg-[#111a22] p-2 rounded-lg border border-[#324d67] text-center font-mono font-bold tracking-widest uppercase">
                        ${v.plate}
                    </div>
                    <div class="border-t border-[#324d67] pt-3 flex justify-between items-center">
                        <div class="text-xs text-[#92adc9] flex items-center gap-1 font-bold">
                            <span class="material-symbols-outlined text-[14px]">speed</span> ${Number(v.current_km || 0).toLocaleString()} km
                        </div>
                        <button onclick="event.stopPropagation(); window.invModule.openVehicleEdit('${v.id}')" class="text-xs bg-[#233648] text-white hover:bg-primary px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors z-10">
                            <span class="material-symbols-outlined text-sm">edit</span> Editar
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    renderDriversTable() {
        const tbody = document.getElementById('table-drivers');
        if(this.drivers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-500">No hay conductores registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = this.drivers.map(d => {
            const photoUrl = (d.photo_url && d.photo_url !== "0") ? d.photo_url : `https://ui-avatars.com/api/?name=${d.full_name}`;
            return `
            <tr class="hover:bg-[#232b34] transition-colors border-b border-[#324d67] last:border-0">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-slate-700 bg-cover border-2 border-[#324d67]" style="background-image: url('${photoUrl}')"></div>
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
                    <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest border border-green-500/20">Verificado</span>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest border border-green-500/20">Activo</span>
                </td>
            </tr>
        `}).join('');
    }

    renderInspectionsList() {
        const container = document.getElementById('inspections-list');
        if(this.inspections.length === 0) {
            container.innerHTML = '<div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-10 text-center"><p class="text-slate-500">No hay inspecciones de entrada/salida registradas.</p></div>';
            return;
        }

        container.innerHTML = this.inspections.map(i => {
            const date = new Date(i.created_at);
            const approvalColor = i.vehicle_approval === 'approved' ? 'green' : i.vehicle_approval === 'conditional' ? 'yellow' : 'red';
            const approvalText = i.vehicle_approval === 'approved' ? 'Aprobado' : i.vehicle_approval === 'conditional' ? 'Condicional' : 'Rechazado';
            
            return `
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden hover:border-${approvalColor}-500 transition-colors shadow-lg">
                    <div class="p-5">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-white font-bold text-lg">ECO-${i.vehicles?.economic_number || '--'} • <span class="text-primary font-mono text-sm">${i.vehicles?.plate || ''}</span></h3>
                                <p class="text-[#92adc9] text-sm">${i.vehicles?.model || ''}</p>
                            </div>
                            <div class="flex flex-col items-end gap-2">
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-${approvalColor}-500/20 text-${approvalColor}-400 border border-${approvalColor}-500/30 uppercase tracking-widest shadow-sm">
                                    ${approvalText}
                                </span>
                                <p class="text-xs text-[#92adc9] font-mono">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-widest">Inspector (Guardia)</p>
                                <p class="text-white text-sm font-medium mt-1">${i.inspector_name}</p>
                            </div>
                            <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-widest">Kilometraje</p>
                                <p class="text-white text-sm font-mono mt-1">${(i.current_km || 0).toLocaleString()} km</p>
                            </div>
                            <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-widest">Condición Reportada</p>
                                <p class="text-white text-sm font-medium mt-1 uppercase">${i.general_condition}</p>
                            </div>
                            <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67]">
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-widest">Nivel Combustible</p>
                                <p class="text-white text-sm font-medium mt-1 uppercase">${i.fuel_level}</p>
                            </div>
                        </div>
                        ${i.problems_detected ? `
                            <div class="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 relative overflow-hidden">
                                <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                                <p class="text-xs text-red-400 font-black mb-1 uppercase tracking-wider pl-2 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">warning</span> Problemas Detectados / Alertas</p>
                                <p class="text-slate-300 text-sm pl-2">${i.problems_detected}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    openVehicleRegister() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        content.className = "bg-[#1c2127] w-full max-w-4xl rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up overflow-y-auto max-h-[90vh] custom-scrollbar";
        
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4">
                <h3 class="font-black text-2xl text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-3xl">add_circle</span> Alta de Nueva Unidad
                </h3>
                <button onclick="document.getElementById('global-modal').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full hover:bg-red-500/20 hover:text-red-500">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="space-y-6">
                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-5 shadow-lg">
                        <h4 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-primary">id_card</span> Identificación
                        </h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">ID Interno (ECO)</label>
                                    <input id="new-eco" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Ej: 01">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Placas</label>
                                    <input id="new-plate" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors uppercase font-mono" placeholder="DEMO-01">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Marca</label>
                                    <input id="new-brand" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Ej: Ford">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Modelo</label>
                                    <input id="new-model" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Ej: F-150">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Año</label>
                                    <input type="number" id="new-year" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" value="${new Date().getFullYear()}" placeholder="2025">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Color</label>
                                    <input id="new-color" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Blanco">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">VIN (Número de Serie)</label>
                                <input id="new-vin" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors font-mono text-sm uppercase" placeholder="1FTFW1ET4EFA12345">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">URL Fotografía Vehículo</label>
                                <input id="new-img" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors text-xs" placeholder="https://...">
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-5 shadow-lg">
                        <h4 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-orange-500">settings_applications</span> Especificaciones Mecánicas
                        </h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Tipo de Vehículo</label>
                                    <select id="new-vehicle-type" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                                        <option value="">Seleccionar</option>
                                        <option value="Camioneta">Camioneta</option>
                                        <option value="Sedán">Sedán</option>
                                        <option value="SUV">SUV</option>
                                        <option value="Pickup">Pickup</option>
                                        <option value="Motocicleta">Motocicleta</option>
                                        <option value="Camión">Camión</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Motor</label>
                                    <input id="new-engine" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Ej: 5.0L V8">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Transmisión</label>
                                    <select id="new-transmission" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                                        <option value="">Seleccionar</option>
                                        <option value="Automática">Automática</option>
                                        <option value="Manual">Manual</option>
                                        <option value="CVT">CVT</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Combustible</label>
                                    <select id="new-fuel-type" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors">
                                        <option value="">Seleccionar</option>
                                        <option value="Gasolina">Gasolina</option>
                                        <option value="Diésel">Diésel</option>
                                        <option value="Híbrido">Híbrido</option>
                                        <option value="Eléctrico">Eléctrico</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Capacidad / Carga Máxima</label>
                                <input id="new-capacity" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors" placeholder="Ej: 5 pasajeros, 1000kg">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-5 shadow-lg">
                        <h4 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-green-500">verified_user</span> Documentación Legal
                        </h4>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Vigencia Tarjeta Circulación</label>
                                    <input type="date" id="new-license-expiry" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary text-sm cursor-pointer">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Estado TC</label>
                                    <select id="new-license-status" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary">
                                        <option value="vigente">Vigente</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="en proceso">En proceso</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Vigencia Póliza Seguro</label>
                                    <input type="date" id="new-insurance-expiry" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary text-sm cursor-pointer">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Estado Seguro</label>
                                    <select id="new-insurance-status" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary">
                                        <option value="vigente">Vigente</option>
                                        <option value="vencido">Vencido</option>
                                        <option value="en proceso">En proceso</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-5 shadow-lg">
                        <h4 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-purple-500">speed</span> Estado Operativo Base
                        </h4>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Kilometraje Inicial (Dashboard)</label>
                                <input type="number" id="new-initial-km" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-mono text-lg" placeholder="0" value="0">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Centro de Costos (Área)</label>
                                    <input id="new-cost-center" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="Ej: LOG-001">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Estatus Actual</label>
                                    <select id="new-status" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-bold">
                                        <option value="active">Activo / Disponible</option>
                                        <option value="maintenance">En Taller</option>
                                        <option value="inactive">De Baja</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-6 flex gap-4 border-t border-[#324d67] pt-6 bg-[#151b23] -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
                <button onclick="document.getElementById('global-modal').classList.add('hidden')" class="flex-1 bg-[#233648] hover:bg-[#2d445a] text-white py-4 rounded-xl font-bold transition-all border border-[#324d67]">
                    Cancelar
                </button>
                <button onclick="window.invModule.saveNewVehicle()" id="btn-save-vehicle" class="flex-1 bg-primary hover:bg-blue-600 text-white py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">save</span> Guardar Unidad
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    async saveNewVehicle() {
        const btn = document.getElementById('btn-save-vehicle');
        const initialKm = parseInt(document.getElementById('new-initial-km').value) || 0;
        
        const data = {
            economic_number: document.getElementById('new-eco').value,
            plate: document.getElementById('new-plate').value.toUpperCase(),
            brand: document.getElementById('new-brand').value,
            model: document.getElementById('new-model').value,
            year: document.getElementById('new-year').value,
            color: document.getElementById('new-color').value,
            vin: document.getElementById('new-vin').value,
            vehicle_type: document.getElementById('new-vehicle-type').value,
            engine: document.getElementById('new-engine').value,
            transmission: document.getElementById('new-transmission').value,
            fuel_type: document.getElementById('new-fuel-type').value,
            capacity: document.getElementById('new-capacity').value,
            license_expiry: document.getElementById('new-license-expiry').value || null,
            license_status: document.getElementById('new-license-status').value,
            insurance_expiry: document.getElementById('new-insurance-expiry').value || null,
            insurance_status: document.getElementById('new-insurance-status').value,
            initial_km: initialKm,
            current_km: initialKm,
            cost_center: document.getElementById('new-cost-center').value,
            status: document.getElementById('new-status').value,
            image_url: document.getElementById('new-img').value || null
        };

        if (!data.economic_number || !data.plate || !data.brand || !data.model) {
            alert("Los campos ECO, Placas, Marca y Modelo son obligatorios para crear el expediente.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Guardando...';

        try {
            const { data: newVeh, error } = await supabase.from('vehicles').insert([data]).select();
            if (error) throw error;
            
            // Try insert log, no catch builder
            const { error: logErr } = await supabase.from('vehicle_logs').insert([{
                vehicle_id: newVeh[0].id,
                date: new Date().toISOString().split('T')[0],
                odometer: initialKm,
                service_name: 'ALTA DE UNIDAD EN SISTEMA',
                parts_used: 'Registro inicial del expediente digital',
                total_cost: 0,
                quantity: 1,
                notes: `Vehículo registrado: ${data.brand} ${data.model} ${data.year}, Placas: ${data.plate}, ECO: ${data.economic_number}`
            }]);
            
            if(logErr) console.warn('No se pudo guardar el log inicial', logErr);
            
            document.getElementById('global-modal').classList.add('hidden');
            alert("✅ Unidad registrada exitosamente y lista para operar.");
            
        } catch (err) {
            alert("Error al guardar en base de datos: " + err.message);
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Guardar Unidad';
        }
    }

    async openVehicleDetail(id) {
        this.selectedVehicle = this.vehicles.find(v => v.id === id);
        if(!this.selectedVehicle) return;

        this.vehicleAppTrips = this.allAppTrips.filter(t => t.vehicle_id === id);
        this.vehicleInspectionsPhotos = this.vehicleAppTrips.filter(t => (t.workshop_reception_photos && t.workshop_reception_photos.length > 0) || (t.workshop_return_photos && t.workshop_return_photos.length > 0));

        const [logsRes, tripsRes, docsRes] = await Promise.all([
            supabase.from('vehicle_logs').select('*').eq('vehicle_id', id).order('date', {ascending: false}).then(r => r.error ? {data:[]} : r),
            supabase.from('vehicle_trips').select('*').eq('vehicle_id', id).order('start_date', {ascending: false}).then(r => r.error ? {data:[]} : r),
            supabase.from('vehicle_documents').select('*').eq('vehicle_id', id).order('uploaded_at', {ascending: false}).then(r => r.error ? {data:[]} : r)
        ]);
        
        this.vehicleLogs = logsRes?.data || [];
        this.vehicleTrips = tripsRes?.data || [];
        this.vehicleDocuments = docsRes?.data || [];
        
        const totalTripKm = this.vehicleTrips.reduce((sum, trip) => sum + Number(trip.distance_km || 0), 0);
        const currentKm = Number(this.selectedVehicle.initial_km || 0) + totalTripKm;
        
        if (currentKm !== Number(this.selectedVehicle.current_km) && currentKm > Number(this.selectedVehicle.current_km)) {
            await supabase.from('vehicles').update({ current_km: currentKm }).eq('id', id);
            this.selectedVehicle.current_km = currentKm;
        }
        
        this.updateActiveModalInfo();
        
        const modal = document.getElementById('global-modal');
        modal.classList.remove('hidden');
    }

    updateActiveModalInfo() {
        const content = document.getElementById('global-modal-content');
        if(!this.selectedVehicle) return;

        const totalTripKm = this.vehicleTrips.reduce((sum, trip) => sum + Number(trip.distance_km || 0), 0);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${this.selectedVehicle.id}&color=111a22`;
        
        const imgUrl = (this.selectedVehicle.image_url && this.selectedVehicle.image_url !== "0" && this.selectedVehicle.image_url !== "null") ? this.selectedVehicle.image_url : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=60';

        const activeTrip = this.vehicleAppTrips.find(t => ['requested', 'approved_for_taller', 'driver_accepted', 'in_progress'].includes(t.status));
        let statusName = this.selectedVehicle.status === 'active' ? 'Disponible' : (this.selectedVehicle.status === 'maintenance' ? 'En Taller' : 'Inactivo');
        let statusClass = this.selectedVehicle.status === 'active' ? 'border-green-500 text-green-400 bg-green-500/10' : (this.selectedVehicle.status === 'maintenance' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-red-500 text-red-400 bg-red-500/10');
        
        let destinationHtml = `<span class="flex items-center gap-1 text-slate-500"><span class="material-symbols-outlined text-[14px]">not_listed_location</span> Sin historial reciente</span>`;
        
        if (activeTrip) {
            statusName = 'En Uso';
            statusClass = 'border-blue-500 text-blue-400 bg-blue-500/10';
            destinationHtml = `<span class="text-blue-400 font-bold animate-pulse flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">directions_car</span> En ruta a: ${activeTrip.destination || 'Destino múltiple'}</span>`;
        } else if (this.selectedVehicle.status === 'in_use') {
            statusName = 'En Uso';
            statusClass = 'border-blue-500 text-blue-400 bg-blue-500/10';
        } else if (this.vehicleAppTrips[0]) {
            destinationHtml = `<span class="flex items-center gap-1 text-[#92adc9]"><span class="material-symbols-outlined text-[14px]">history</span> Últ. viaje: ${this.vehicleAppTrips[0].destination || 'No especificado'}</span>`;
        }

        content.className = "bg-[#0d141c] w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-[#324d67] overflow-hidden animate-fade-in-up font-display";
        
        content.innerHTML = `
            <div class="bg-gradient-to-r from-[#111a22] to-[#192633] border-b border-[#324d67] p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
                <div class="absolute -right-20 -top-20 opacity-5 pointer-events-none">
                    <span class="material-symbols-outlined text-[300px]">directions_car</span>
                </div>
                <div class="flex items-center gap-6 relative z-10">
                    <div class="bg-white p-2 rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform" onclick="window.invModule.printQR('${qrUrl}', '${this.selectedVehicle.plate}')" title="Imprimir QR Físico">
                        <img src="${qrUrl}" alt="QR Vehículo" class="w-20 h-20">
                        <div class="text-[9px] text-center text-slate-800 font-bold mt-1 uppercase tracking-widest">QR Unidad</div>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest">ECO-${this.selectedVehicle.economic_number}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusClass}">${statusName}</span>
                        </div>
                        <h2 class="text-3xl font-black text-white uppercase tracking-tight">${this.selectedVehicle.brand} ${this.selectedVehicle.model} <span class="text-primary">${this.selectedVehicle.year || ''}</span></h2>
                        <div class="flex gap-4 mt-2 text-sm text-[#92adc9] font-mono items-center">
                            <span class="bg-[#1c2127] border border-[#324d67] px-2 py-1 rounded text-white font-bold">${this.selectedVehicle.plate}</span>
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">speed</span> ${Number(this.selectedVehicle.current_km).toLocaleString()} km</span>
                            <div class="border-l border-[#324d67] pl-4 ml-2">
                                ${destinationHtml}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 relative z-10">
                    <button onclick="window.invModule.openVehicleEdit('${this.selectedVehicle.id}')" class="bg-[#233648] hover:bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-[#324d67] transition-colors">
                        <span class="material-symbols-outlined text-sm">edit</span> Editar Perfil
                    </button>
                    <button onclick="document.getElementById('global-modal').classList.add('hidden')" class="bg-[#1c2127] hover:bg-red-900/40 text-slate-400 hover:text-red-400 border border-[#324d67] hover:border-red-500/50 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div class="flex border-b border-[#324d67] bg-[#111a22] px-6 shrink-0 overflow-x-auto custom-scrollbar">
                <button onclick="window.invModule.switchVehicleTab(1)" id="veh-tab-1" class="py-4 px-6 text-sm font-bold border-b-2 border-primary text-primary transition-colors flex items-center gap-2 whitespace-nowrap">
                    <span class="material-symbols-outlined text-[18px]">info</span> Expediente Principal
                </button>
                <button onclick="window.invModule.switchVehicleTab(2)" id="veh-tab-2" class="py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
                    <span class="material-symbols-outlined text-[18px]">engineering</span> Datos Técnicos y Salud
                </button>
                <button onclick="window.invModule.switchVehicleTab(3)" id="veh-tab-3" class="py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
                    <span class="material-symbols-outlined text-[18px]">history</span> Bitácora y Servicios
                </button>
                <button onclick="window.invModule.switchVehicleTab(4)" id="veh-tab-4" class="py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap">
                    <span class="material-symbols-outlined text-[18px]">photo_library</span> Galería de Inspecciones
                </button>
                <div class="ml-auto flex items-center py-2 pl-4">
                    <button onclick="window.invModule.openLogRegister('${this.selectedVehicle.id}')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-900/20 transition-transform hover:scale-105 whitespace-nowrap">
                        <span class="material-symbols-outlined text-[16px]">build</span> Registrar Servicio
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-hidden bg-[#0d141c]">
                
                <div id="veh-tab-content-1" class="h-full overflow-y-auto p-6 custom-scrollbar block">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div class="lg:col-span-2 space-y-6">
                            <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg relative overflow-hidden">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                    <span class="material-symbols-outlined text-primary">feed</span> Ficha de Identificación
                                </h3>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">Económico</label><div class="text-white font-black text-lg">ECO-${this.selectedVehicle.economic_number}</div></div>
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">Placas</label><div class="text-white font-mono bg-[#1c2127] px-2 py-0.5 rounded border border-[#324d67] inline-block mt-1">${this.selectedVehicle.plate}</div></div>
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">VIN</label><div class="text-white font-mono text-sm mt-1">${this.selectedVehicle.vin || 'N/A'}</div></div>
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">Marca / Modelo</label><div class="text-white text-sm mt-1">${this.selectedVehicle.brand} ${this.selectedVehicle.model}</div></div>
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">Año</label><div class="text-white text-sm mt-1">${this.selectedVehicle.year || 'N/A'}</div></div>
                                    <div><label class="text-[10px] font-bold text-[#92adc9] uppercase">Color</label><div class="text-white text-sm mt-1 flex items-center gap-2"><span class="w-3 h-3 rounded-full border border-slate-400" style="background-color: ${this.getColorHex(this.selectedVehicle.color)}"></span> ${this.selectedVehicle.color || 'N/A'}</div></div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                    <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                        <span class="material-symbols-outlined text-orange-500">route</span> Telemetría Manual
                                    </h3>
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-end">
                                            <div>
                                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Km Actual</label>
                                                <span class="text-2xl font-black text-white">${Number(this.selectedVehicle.current_km).toLocaleString()}</span> <span class="text-[#92adc9] text-xs">km</span>
                                            </div>
                                            <div class="text-right">
                                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Km Inicial (Alta)</label>
                                                <span class="text-sm font-bold text-white">${Number(this.selectedVehicle.initial_km || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div class="bg-[#1c2127] p-3 rounded-lg border border-[#324d67]">
                                            <div class="flex justify-between items-center mb-1">
                                                <span class="text-xs text-[#92adc9]">Recorrido Histórico (Trayectos manuales):</span>
                                                <span class="text-sm font-bold text-primary">${totalTripKm.toLocaleString()} km</span>
                                            </div>
                                        </div>
                                        <button onclick="window.invModule.openTripRegister('${this.selectedVehicle.id}')" class="w-full bg-[#233648] hover:bg-[#2d445a] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#324d67]">
                                            <span class="material-symbols-outlined text-[16px]">add_location</span> Sumar Trayecto Manual
                                        </button>
                                    </div>
                                </div>

                                <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg flex flex-col">
                                    <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs shrink-0">
                                        <span class="material-symbols-outlined text-purple-400">notifications_active</span> Alertas de Vencimiento
                                    </h3>
                                    <div class="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                        ${this.getVehicleAlertsHTML()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg h-full flex flex-col">
                                <div class="flex justify-between items-center mb-4 border-b border-[#324d67] pb-2 shrink-0">
                                    <h3 class="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <span class="material-symbols-outlined text-green-500">folder_open</span> Documentos Digitales
                                    </h3>
                                    <button onclick="window.invModule.openDocumentUpload('${this.selectedVehicle.id}')" class="bg-primary/20 text-primary hover:bg-primary/30 p-1.5 rounded-lg transition-colors" title="Subir Documento Adicional">
                                        <span class="material-symbols-outlined text-sm">upload_file</span>
                                    </button>
                                </div>
                                
                                <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    ${this.getDocumentationHTML()}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div id="veh-tab-content-2" class="hidden h-full overflow-y-auto p-6 custom-scrollbar">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div class="space-y-6">
                            <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-6 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                    <span class="material-symbols-outlined text-blue-400">precision_manufacturing</span> Especificaciones de Fabrica
                                </h3>
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center border-b border-[#233648] pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Tipo de Vehículo</span>
                                        <span class="text-white text-sm font-medium">${this.selectedVehicle.vehicle_type || 'No especificado'}</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-[#233648] pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Motor</span>
                                        <span class="text-white text-sm font-medium font-mono">${this.selectedVehicle.engine || 'No especificado'}</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-[#233648] pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Transmisión</span>
                                        <span class="text-white text-sm font-medium">${this.selectedVehicle.transmission || 'No especificado'}</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-[#233648] pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Combustible</span>
                                        <span class="text-white text-sm font-medium">${this.selectedVehicle.fuel_type || 'No especificado'}</span>
                                    </div>
                                    <div class="flex justify-between items-center border-b border-[#233648] pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Capacidad/Carga</span>
                                        <span class="text-white text-sm font-medium">${this.selectedVehicle.capacity || 'No especificado'}</span>
                                    </div>
                                    <div class="flex justify-between items-center pb-2">
                                        <span class="text-xs font-bold text-[#92adc9] uppercase">Asignado a (Centro Costo)</span>
                                        <span class="bg-[#1c2127] text-white px-2 py-1 rounded text-xs border border-[#324d67] font-mono tracking-wider">${this.selectedVehicle.cost_center || 'No asignado'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-6 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                    <span class="material-symbols-outlined text-green-500">imagesmode</span> Fotografía de la Unidad
                                </h3>
                                <div class="aspect-video bg-[#0d141c] rounded-xl border border-[#324d67] overflow-hidden flex items-center justify-center relative group cursor-pointer" onclick="window.invModule.viewPhoto('${imgUrl}')">
                                    <img src="${imgUrl}" class="w-full h-full object-cover">
                                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span class="material-symbols-outlined text-white text-3xl">zoom_in</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-lg flex flex-col h-[700px]">
                            <div class="flex justify-between items-center border-b border-[#324d67] pb-2 mb-4 shrink-0">
                                <h3 class="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                                    <span class="material-symbols-outlined text-green-500">health_and_safety</span> Salud Total de Unidad
                                </h3>
                                <div id="overall-health-badge" class="text-2xl font-black text-green-400 font-mono text-right">100%</div>
                            </div>
                            
                            <div class="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-4 text-xs text-blue-400 shrink-0">
                                Ajusta el peso (%) que tiene cada pieza sobre el vehículo (debe sumar 100%) y su salud actual para calcular el estado global de la unidad.
                            </div>
                            
                            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3" id="components-container">
                                </div>
                            
                            <div class="mt-4 pt-4 border-t border-[#324d67] flex gap-3 shrink-0">
                                <button onclick="window.invModule.addComponentRow()" class="bg-[#233648] hover:bg-primary text-white px-3 py-2.5 rounded-lg text-xs font-bold transition-colors flex-1 flex items-center justify-center gap-1 shadow">
                                    <span class="material-symbols-outlined text-sm">add</span> Añadir Pieza
                                </button>
                                <button onclick="window.invModule.saveComponentsHealth()" class="bg-green-600 hover:bg-green-500 text-white px-3 py-2.5 rounded-lg text-xs font-bold transition-colors flex-1 flex items-center justify-center gap-1 shadow-lg shadow-green-900/20">
                                    <span class="material-symbols-outlined text-sm">save</span> Guardar Salud
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <div id="veh-tab-content-3" class="hidden h-full flex flex-col p-6">
                    <div class="flex justify-between items-end mb-4 shrink-0">
                        <div>
                            <h3 class="font-bold text-white text-lg">Historial de Mantenimiento Integral</h3>
                            <p class="text-xs text-[#92adc9]">Inversión total acumulada en refacciones y MO: <span class="font-mono text-green-400 font-bold">$${this.vehicleLogs.reduce((sum, log) => sum + Number(log.total_cost || 0), 0).toLocaleString()}</span></p>
                        </div>
                        <button onclick="window.invModule.generateMaintenanceReport()" class="bg-[#233648] hover:bg-[#2d445a] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border border-[#324d67]">
                            <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span> Imprimir Reporte
                        </button>
                    </div>

                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col">
                        <div class="overflow-x-auto flex-1 custom-scrollbar">
                            <table class="w-full text-left whitespace-nowrap">
                                <thead class="bg-[#1c2127] text-[10px] font-bold text-[#92adc9] uppercase tracking-widest sticky top-0 border-b border-[#324d67]">
                                    <tr>
                                        <th class="p-4">Fecha</th>
                                        <th class="p-4">Km al Servicio</th>
                                        <th class="p-4">Tipo de Servicio</th>
                                        <th class="p-4">Taller / Mecánico</th>
                                        <th class="p-4">Refacciones Aplicadas</th>
                                        <th class="p-4 text-right">Inversión Total</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[#324d67] text-sm text-slate-300">
                                    ${this.vehicleLogs.length === 0 ? `
                                        <tr><td colspan="6" class="p-10 text-center text-slate-500"><span class="material-symbols-outlined text-4xl block mb-2 opacity-50">handyman</span> No hay mantenimientos registrados en la bitácora para esta unidad.</td></tr>
                                    ` : this.vehicleLogs.map(log => `
                                        <tr class="hover:bg-[#192633] transition-colors">
                                            <td class="p-4 font-medium">${this.formatDate(log.date)}</td>
                                            <td class="p-4 font-mono">${Number(log.odometer).toLocaleString()} km</td>
                                            <td class="p-4 font-bold text-white"><span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs border border-primary/20">${log.service_name}</span></td>
                                            <td class="p-4 text-[#92adc9]">${log.mechanic || 'N/A'}</td>
                                            <td class="p-4 text-[11px] text-[#92adc9] max-w-xs truncate" title="${log.parts_used}">${log.parts_used || 'Ninguna'}</td>
                                            <td class="p-4 text-right font-mono font-bold text-green-400">$${Number(log.total_cost).toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="veh-tab-content-4" class="hidden h-full overflow-y-auto p-6 custom-scrollbar">
                    <h3 class="font-bold text-white mb-6 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                        <span class="material-symbols-outlined text-orange-500">photo_library</span> Historial Fotográfico de Inspecciones
                    </h3>
                    <div class="space-y-6">
                        ${this.renderVehiclePhotosGallery()}
                    </div>
                </div>

            </div>
        `;
        
        setTimeout(() => this.renderComponentsHealth(), 100);
    }

    switchVehicleTab(num) {
        for(let i=1; i<=4; i++) { 
            const btn = document.getElementById(`veh-tab-${i}`);
            const content = document.getElementById(`veh-tab-content-${i}`);
            if(btn) btn.className = "py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap";
            if(content) content.classList.replace('block', 'hidden');
        }
        document.getElementById(`veh-tab-${num}`).className = "py-4 px-6 text-sm font-bold border-b-2 border-primary text-primary transition-colors flex items-center gap-2 bg-primary/10 whitespace-nowrap";
        document.getElementById(`veh-tab-content-${num}`).classList.replace('hidden', 'block');
    }

    renderComponentsHealth() {
        let comps = this.selectedVehicle.components;
        if (!comps || !Array.isArray(comps) || comps.length === 0) {
            comps = [
                { name: 'Motor', weight: 40, health: 100 },
                { name: 'Transmisión', weight: 25, health: 100 },
                { name: 'Frenos', weight: 15, health: 100 },
                { name: 'Suspensión', weight: 10, health: 100 },
                { name: 'Llantas', weight: 10, health: 100 }
            ];
        }

        const container = document.getElementById('components-container');
        if(!container) return;
        
        container.innerHTML = comps.map((c, i) => `
            <div class="component-row bg-[#1c2127] p-3 rounded-lg border border-[#233648] hover:border-primary/50 transition-colors">
                <div class="flex items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-[#92adc9] text-sm">settings</span>
                    <input type="text" class="comp-name flex-1 bg-transparent border-b border-transparent hover:border-[#324d67] focus:border-primary text-white text-xs px-1 outline-none font-bold" value="${c.name}" placeholder="Nombre pieza">
                    <button onclick="this.closest('.component-row').remove(); window.invModule.calculateTotalHealth()" class="text-red-400 hover:bg-red-500/20 p-1 rounded transition-colors"><span class="material-symbols-outlined text-[14px]">delete</span></button>
                </div>
                <div class="flex items-center gap-4">
                    <div class="flex-1">
                        <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Peso en Unidad (%)</label>
                        <div class="relative">
                            <input type="number" class="comp-weight w-full bg-[#111a22] border border-[#324d67] text-white text-xs px-2 py-1.5 rounded outline-none focus:border-primary text-center" value="${c.weight}" oninput="window.invModule.calculateTotalHealth()">
                            <span class="absolute right-2 top-1.5 text-[9px] text-[#92adc9]">%</span>
                        </div>
                    </div>
                    <div class="flex-1">
                        <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Salud Actual (%)</label>
                        <div class="relative">
                            <input type="number" class="comp-health w-full bg-[#111a22] border border-[#324d67] text-white text-xs px-2 py-1.5 rounded outline-none focus:border-primary text-center" value="${c.health}" oninput="window.invModule.calculateTotalHealth()">
                            <span class="absolute right-2 top-1.5 text-[9px] text-[#92adc9]">%</span>
                        </div>
                    </div>
                    <div class="w-16 text-right border-l border-[#324d67] pl-3">
                        <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Aporta</label>
                        <span class="comp-contrib font-mono text-sm font-black text-primary">${((c.weight * c.health) / 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `).join('');
        this.calculateTotalHealth();
    }

    addComponentRow() {
        const container = document.getElementById('components-container');
        if(!container) return;
        
        const newRow = document.createElement('div');
        newRow.className = "component-row bg-[#1c2127] p-3 rounded-lg border border-[#233648] hover:border-primary/50 transition-colors animate-fade-in";
        newRow.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-[#92adc9] text-sm">settings</span>
                <input type="text" class="comp-name flex-1 bg-transparent border-b border-transparent hover:border-[#324d67] focus:border-primary text-white text-xs px-1 outline-none font-bold" value="" placeholder="Ej: Batería">
                <button onclick="this.closest('.component-row').remove(); window.invModule.calculateTotalHealth()" class="text-red-400 hover:bg-red-500/20 p-1 rounded transition-colors"><span class="material-symbols-outlined text-[14px]">delete</span></button>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex-1">
                    <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Peso en Unidad (%)</label>
                    <div class="relative">
                        <input type="number" class="comp-weight w-full bg-[#111a22] border border-[#324d67] text-white text-xs px-2 py-1.5 rounded outline-none focus:border-primary text-center" value="10" oninput="window.invModule.calculateTotalHealth()">
                        <span class="absolute right-2 top-1.5 text-[9px] text-[#92adc9]">%</span>
                    </div>
                </div>
                <div class="flex-1">
                    <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Salud Actual (%)</label>
                    <div class="relative">
                        <input type="number" class="comp-health w-full bg-[#111a22] border border-[#324d67] text-white text-xs px-2 py-1.5 rounded outline-none focus:border-primary text-center" value="100" oninput="window.invModule.calculateTotalHealth()">
                        <span class="absolute right-2 top-1.5 text-[9px] text-[#92adc9]">%</span>
                    </div>
                </div>
                <div class="w-16 text-right border-l border-[#324d67] pl-3">
                    <label class="text-[8px] text-[#92adc9] uppercase font-bold block mb-1">Aporta</label>
                    <span class="comp-contrib font-mono text-sm font-black text-primary">10.0%</span>
                </div>
            </div>
        `;
        container.appendChild(newRow);
        container.scrollTop = container.scrollHeight;
        this.calculateTotalHealth();
    }

    calculateTotalHealth() {
        const rows = document.querySelectorAll('.component-row');
        let totalWeight = 0;
        let totalHealth = 0;
        
        rows.forEach(row => {
            const w = parseFloat(row.querySelector('.comp-weight').value) || 0;
            const h = parseFloat(row.querySelector('.comp-health').value) || 0;
            const contrib = (w * h) / 100;
            
            row.querySelector('.comp-contrib').innerText = contrib.toFixed(1) + '%';
            
            totalWeight += w;
            totalHealth += contrib;
        });
        
        const badge = document.getElementById('overall-health-badge');
        if (badge) {
            let html = `${totalHealth.toFixed(1)}%`;
            if (totalWeight !== 100) {
                html += `<div class="text-[9px] text-red-500 uppercase tracking-widest mt-1">Suma Pesos: ${totalWeight}% (Ajustar a 100%)</div>`;
                badge.className = "text-xl font-black font-mono text-right";
            } else {
                badge.className = `text-3xl font-black font-mono text-right ${totalHealth > 80 ? 'text-green-400' : (totalHealth > 50 ? 'text-yellow-400' : 'text-red-500')}`;
            }
            badge.innerHTML = html;
        }
    }

    async saveComponentsHealth() {
        const rows = document.querySelectorAll('.component-row');
        const components = [];
        let tw = 0;
        rows.forEach(row => {
            const n = row.querySelector('.comp-name').value;
            const w = parseFloat(row.querySelector('.comp-weight').value) || 0;
            const h = parseFloat(row.querySelector('.comp-health').value) || 0;
            if(n) {
                components.push({name: n, weight: w, health: h});
                tw += w;
            }
        });

        if (tw !== 100) {
            if(!confirm(`⚠️ La suma de los pesos es ${tw}%, lo ideal para el algoritmo es 100%. ¿Guardar de todos modos?`)) return;
        }

        try {
            const { error } = await supabase.from('vehicles').update({ components: components }).eq('id', this.selectedVehicle.id);
            if (error) {
                if (error.message.includes('column "components" of relation "vehicles" does not exist')) {
                    alert('❌ IMPORTANTE: Falta crear la columna en Supabase.\nVe al SQL Editor y ejecuta:\nALTER TABLE public.vehicles ADD COLUMN components jsonb DEFAULT \'[]\'::jsonb;');
                    return;
                }
                throw error;
            }
            this.selectedVehicle.components = components;
            this.showToast('✅ Salud de componentes actualizada correctamente.', 'Éxito', 'success');
        } catch(e) {
            alert('Error al guardar: ' + e.message);
        }
    }

    renderVehiclePhotosGallery() {
        if (!this.vehicleInspectionsPhotos || this.vehicleInspectionsPhotos.length === 0) {
            return `<div class="text-center py-10 text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">no_photography</span><p>No hay fotos de viajes registradas para esta unidad.</p></div>`;
        }

        let html = '';
        let foundPhotos = false;

        this.vehicleInspectionsPhotos.forEach(trip => {
            const hasReception = trip.workshop_reception_photos && trip.workshop_reception_photos.length > 0;
            const hasReturn = trip.workshop_return_photos && trip.workshop_return_photos.length > 0;
            
            if (hasReception || hasReturn) {
                foundPhotos = true;
                const dateStr = new Date(trip.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase();
                const driverName = trip.profiles?.full_name || 'Desconocido';

                html += `
                <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-5 shadow-lg">
                    <div class="flex justify-between items-center mb-4 border-b border-[#233648] pb-2">
                        <span class="text-white font-bold text-sm flex items-center gap-2"><span class="material-symbols-outlined text-primary text-sm">calendar_month</span> ${dateStr}</span>
                        <span class="text-xs text-[#92adc9] bg-[#1c2127] px-3 py-1 rounded-full border border-[#324d67]">Conductor: <span class="text-white font-bold">${driverName}</span></span>
                    </div>
                    
                    ${hasReception ? `
                    <div class="mb-4">
                        <p class="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">logout</span> Evidencia de Salida (Guardia/Taller)</p>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            ${trip.workshop_reception_photos.map(p => `
                                <div class="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-[#324d67]" onclick="window.invModule.viewPhoto('${p.url}')">
                                    <img src="${p.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span class="material-symbols-outlined text-white text-sm">zoom_in</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    ${hasReturn ? `
                    <div>
                        <p class="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1 mt-4 border-t border-[#233648] pt-4"><span class="material-symbols-outlined text-[14px]">login</span> Evidencia de Entrada (Retorno)</p>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            ${trip.workshop_return_photos.map(p => `
                                <div class="relative group cursor-pointer aspect-square rounded-lg overflow-hidden border border-[#324d67]" onclick="window.invModule.viewPhoto('${p.url}')">
                                    <img src="${p.url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
                                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span class="material-symbols-outlined text-white text-sm">zoom_in</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                `;
            }
        });

        return foundPhotos ? html : `<div class="text-center py-10 text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-50">no_photography</span><p>No hay fotos de viajes registradas para esta unidad.</p></div>`;
    }

    // VISOR DE IMÁGENES GLOBAL
    viewPhoto(url) {
        const modalId = 'photo-viewer-modal-' + Date.now();
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-fade-in';
        modal.innerHTML = `
            <div class="relative max-w-4xl w-full flex flex-col items-center">
                <button onclick="document.getElementById('${modalId}').remove()" class="absolute -top-12 right-0 bg-white/10 hover:bg-red-500 text-white p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <img src="${url}" class="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-[#324d67]" />
            </div>
        `;
        document.body.appendChild(modal);
    }

    // --- NUEVO: SUBIDA DE DOCUMENTOS ---
    openDocumentUpload(vehicleId) {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        content.className = "bg-[#1c2127] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display";
        
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4">
                <h3 class="font-black text-xl text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">upload_file</span> Subir Documento
                </h3>
                <button onclick="document.getElementById('global-modal').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Tipo de Documento</label>
                    <select id="doc-upload-type" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary">
                        <option value="license">Tarjeta de Circulación</option>
                        <option value="insurance">Póliza de Seguro</option>
                        <option value="verification">Verificación Ambiental</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Archivo (PDF, JPG, PNG)</label>
                    <input type="file" id="doc-upload-file" accept=".pdf, image/jpeg, image/png" class="w-full bg-[#111a22] border border-[#324d67] text-slate-300 rounded-lg px-3 py-2 outline-none focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer">
                </div>
                <button id="btn-upload-doc" onclick="window.invModule.uploadDocument('${vehicleId}')" class="w-full py-3 mt-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">cloud_upload</span> Subir Archivo
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    async uploadDocument(vehicleId) {
        const fileInput = document.getElementById('doc-upload-file');
        const typeInput = document.getElementById('doc-upload-type');
        const btn = document.getElementById('btn-upload-doc');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            return this.showToast('Atención', 'Selecciona un archivo primero.', 'warning');
        }
        
        const file = fileInput.files[0];
        const docType = typeInput.value;
        
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Subiendo...';
        
        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${vehicleId}/${docType}_${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('vehicle_documents') 
                .upload(fileName, file);
                
            if (uploadError) throw uploadError;
            
            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('vehicle_documents')
                .getPublicUrl(fileName);
                
            // 3. Save to DB
            const { error: dbError } = await supabase
                .from('vehicle_documents')
                .insert([{
                    vehicle_id: vehicleId,
                    document_type: docType,
                    file_url: publicUrl,
                    file_name: file.name
                }]);
                
            if (dbError) throw dbError;
            
            this.showToast('Documento guardado correctamente', 'Éxito', 'success');
            document.getElementById('global-modal').classList.add('hidden');
            
            // Refresh modal view
            await this.loadAllData();
            this.openVehicleDetail(vehicleId);
            
        } catch (error) {
            console.error("Error upload:", error);
            this.showToast('No se pudo subir el archivo: ' + error.message, 'Error', 'error');
            if (error.message.includes('Bucket not found')) {
                alert('🚨 ATENCIÓN: Necesitas crear un Storage Bucket llamado "vehicle_documents" en Supabase y hacerlo Público.');
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">cloud_upload</span> Subir Archivo';
        }
    }

    viewDocuments(docType, vehicleId) {
        const docs = this.vehicleDocuments.filter(d => d.vehicle_id === vehicleId && d.document_type === docType);
        
        if(docs.length === 0) {
            return this.showToast('No hay documentos de este tipo.', 'Aviso', 'warning');
        }
        
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        
        const typeNames = {
            'license': 'Tarjeta de Circulación',
            'insurance': 'Póliza de Seguro',
            'verification': 'Verificación Ambiental'
        };
        
        content.className = "bg-[#1c2127] w-full max-w-2xl rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display";
        
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4">
                <h3 class="font-black text-xl text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">folder</span> Archivos: ${typeNames[docType]}
                </h3>
                <button onclick="window.invModule.openVehicleDetail('${vehicleId}')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
            </div>
            <div class="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                ${docs.map(d => {
                    const isPdf = d.file_url.toLowerCase().endsWith('.pdf');
                    const icon = isPdf ? 'picture_as_pdf' : 'image';
                    const color = isPdf ? 'text-red-400' : 'text-blue-400';
                    return `
                    <div class="flex items-center justify-between bg-[#111a22] p-3 rounded-xl border border-[#324d67] hover:border-primary transition-colors">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <span class="material-symbols-outlined ${color} text-3xl">${icon}</span>
                            <div class="flex flex-col overflow-hidden">
                                <span class="text-white text-sm font-bold truncate">${d.file_name || 'Documento'}</span>
                                <span class="text-[10px] text-[#92adc9]">${new Date(d.uploaded_at || d.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            <a href="${d.file_url}" target="_blank" class="bg-[#233648] hover:bg-primary text-white p-2 rounded-lg transition-colors flex items-center cursor-pointer" title="Abrir en nueva pestaña">
                                <span class="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                            ${!isPdf ? `
                            <button onclick="window.invModule.viewPhoto('${d.file_url}')" class="bg-[#233648] hover:bg-primary text-white p-2 rounded-lg transition-colors flex items-center" title="Vista Previa">
                                <span class="material-symbols-outlined text-sm">visibility</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
        modal.classList.remove('hidden');
    }

    openVehicleEdit(vehicleId) {
        alert("El editor completo de la ficha técnica se abrirá aquí próximamente.");
    }

    async saveDriver() {
        const name = document.getElementById('new-driver-name').value;
        const email = document.getElementById('new-driver-email').value;
        if (!name || !email) return alert("El nombre y el correo electrónico son obligatorios.");
        alert("Por seguridad, los conductores deben darse de alta en el Panel de Autenticación de Supabase primero para crearles su contraseña.");
        document.getElementById('modal-add-driver').classList.add('hidden');
    }

    openTripRegister(vehicleId) {
        this.pendingStockDeduction = [];
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        
        content.className = "bg-[#1c2127] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display flex flex-col max-h-[90vh]";
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4 shrink-0">
                <h3 class="font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                    <span class="material-symbols-outlined text-primary text-3xl">add_location</span> Registrar Trayecto
                </h3>
                <button onclick="document.getElementById('global-modal').classList.add('hidden'); window.invModule.openVehicleDetail('${vehicleId}')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full border border-[#324d67]">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="space-y-4">
                <div class="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30 text-xs text-blue-400 mb-4">
                    Este formulario sumará kilómetros al odómetro general de la unidad, útil para viajes no rastreados por GPS.
                </div>
                <div>
                    <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Distancia Recorrida (KM)</label>
                    <input type="number" id="trip-dist" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-mono text-lg" placeholder="Ej: 120">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Propósito / Destino</label>
                    <input type="text" id="trip-dest" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="Ej: Ruta foránea sin red">
                </div>
                <div class="flex gap-3 pt-4">
                    <button onclick="document.getElementById('global-modal').classList.add('hidden'); window.invModule.openVehicleDetail('${vehicleId}')" class="flex-1 py-3 text-slate-400 hover:text-white bg-[#233648] hover:bg-[#2d445a] rounded-lg text-sm font-bold transition-colors">Cancelar</button>
                    <button onclick="window.invModule.saveTrip('${vehicleId}')" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg text-sm font-bold shadow-lg transition-colors">Sumar KM</button>
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    async saveTrip(vehicleId) {
        const dist = parseFloat(document.getElementById('trip-dist').value);
        const dest = document.getElementById('trip-dest').value;
        if(!dist || !dest || dist <= 0) return alert("Ingresa una distancia válida y un destino/motivo.");

        try {
            await supabase.from('vehicle_trips').insert([{
                vehicle_id: vehicleId,
                distance_km: dist,
                destination: dest,
                start_date: new Date().toISOString()
            }]).catch(e => console.warn('Error guardando trip', e));

            const currentKm = Number(this.selectedVehicle.current_km) + dist;
            await supabase.from('vehicles').update({ current_km: currentKm }).eq('id', vehicleId);

            this.showToast(`Se sumaron ${dist} km al odómetro de la unidad.`, '✅ Trayecto registrado', 'success');
            await this.loadAllData();
            this.openVehicleDetail(vehicleId);
        } catch (e) {
            this.showToast('Error al guardar trayecto: ' + e.message, 'Error', 'error');
        }
    }

    destroy() {
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }
    }
}
