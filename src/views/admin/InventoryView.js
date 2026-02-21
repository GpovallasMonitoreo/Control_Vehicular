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
        
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }

        this.realtimeChannel = supabase
            .channel('inventory_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
                this.handleVehicleRealtimeUpdate(payload);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_inspections' }, () => {
                this.refreshInspections();
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

    showToast(msg) {
        const toast = document.getElementById('inv-notification-toast');
        const text = document.getElementById('inv-notification-text');
        if (toast && text) {
            text.innerText = msg;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 4000);
        }
    }

    async loadAllData() {
        if (!supabase) return;

        try {
            // El catch individual en las tablas que pueden no existir evita que todo el Promise.all colapse
            const [vehRes, drvRes, insRes, invRes, srvRes, docRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('economic_number'),
                supabase.from('profiles').select('*').eq('role', 'driver'),
                supabase.from('vehicle_inspections').select('*, vehicles(economic_number, plate, model)').order('created_at', { ascending: false }).catch(() => ({data: []})),
                supabase.from('inventory_items').select('*').order('name').catch(() => ({data: []})),
                supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock, sku))').catch(() => ({data: []})),
                supabase.from('vehicle_documents').select('*').catch(() => ({data: []}))
            ]);

            this.vehicles = vehRes.data || [];
            this.drivers = drvRes.data || [];
            this.inspections = insRes.data || [];
            this.inventory = invRes.data || [];
            this.services = srvRes.data || [];
            this.vehicleDocuments = docRes.data || [];

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
            // ✅ CORRECCIÓN 404: Ignorar imágenes que vengan guardadas como "0"
            const imgUrl = (v.image_url && v.image_url !== "0" && v.image_url !== "null") ? v.image_url : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=60';
            
            return `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(19,127,236,0.15)] hover:-translate-y-1 relative" onclick="window.invModule.openVehicleDetail('${v.id}')">
                <div class="h-40 bg-[#111a22] relative border-b border-[#324d67]">
                    <img src="${imgUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                    <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded border ${v.status === 'active' ? 'border-green-500 text-green-400' : (v.status === 'maintenance' ? 'border-orange-500 text-orange-400' : 'border-red-500 text-red-400')} uppercase tracking-widest">
                        ${v.status === 'active' ? 'Disponible' : (v.status === 'maintenance' ? 'En Taller' : 'Inactivo')}
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
            
            // Intenta guardar el log, pero no detiene la creación si falla por no existir la tabla
            await supabase.from('vehicle_logs').insert([{
                vehicle_id: newVeh[0].id,
                date: new Date().toISOString().split('T')[0],
                odometer: initialKm,
                service_name: 'ALTA DE UNIDAD EN SISTEMA',
                parts_used: 'Registro inicial del expediente digital',
                total_cost: 0,
                quantity: 1,
                notes: `Vehículo registrado: ${data.brand} ${data.model} ${data.year}, Placas: ${data.plate}, ECO: ${data.economic_number}`
            }]).catch(e => console.warn('No se pudo guardar el log inicial', e));
            
            document.getElementById('global-modal').classList.add('hidden');
            alert("✅ Unidad registrada exitosamente y lista para operar.");
            
        } catch (err) {
            alert("Error al guardar en base de datos: " + err.message);
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Guardar Unidad';
        }
    }

    // --- DETALLE DEL VEHÍCULO (ACTUALIZABLE EN VIVO) ---
    async openVehicleDetail(id) {
        this.selectedVehicle = this.vehicles.find(v => v.id === id);
        if(!this.selectedVehicle) return;

        // ✅ CORRECCIÓN 404: Se ignoran los errores si las tablas aún no existen
        const [logsRes, tripsRes, docsRes] = await Promise.all([
            supabase.from('vehicle_logs').select('*').eq('vehicle_id', id).order('date', {ascending: false}).catch(() => ({data: []})),
            supabase.from('vehicle_trips').select('*').eq('vehicle_id', id).order('start_date', {ascending: false}).catch(() => ({data: []})),
            supabase.from('vehicle_documents').select('*').eq('vehicle_id', id).order('uploaded_at', {ascending: false}).catch(() => ({data: []}))
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
        
        // ✅ CORRECCIÓN 404: Validar imagen
        const imgUrl = (this.selectedVehicle.image_url && this.selectedVehicle.image_url !== "0" && this.selectedVehicle.image_url !== "null") ? this.selectedVehicle.image_url : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=60';

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
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${this.selectedVehicle.status === 'active' ? 'border-green-500 text-green-400 bg-green-500/10' : (this.selectedVehicle.status === 'maintenance' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-red-500 text-red-400 bg-red-500/10')}">${this.selectedVehicle.status === 'active' ? 'Disponible' : (this.selectedVehicle.status === 'maintenance' ? 'En Taller' : 'Inactivo')}</span>
                        </div>
                        <h2 class="text-3xl font-black text-white uppercase tracking-tight">${this.selectedVehicle.brand} ${this.selectedVehicle.model} <span class="text-primary">${this.selectedVehicle.year || ''}</span></h2>
                        <div class="flex gap-4 mt-2 text-sm text-[#92adc9] font-mono">
                            <span class="bg-[#1c2127] border border-[#324d67] px-2 py-1 rounded text-white font-bold">${this.selectedVehicle.plate}</span>
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">speed</span> ${Number(this.selectedVehicle.current_km).toLocaleString()} km</span>
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

            <div class="flex border-b border-[#324d67] bg-[#111a22] px-6 shrink-0">
                <button onclick="window.invModule.switchVehicleTab(1)" id="veh-tab-1" class="py-4 px-6 text-sm font-bold border-b-2 border-primary text-primary transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">info</span> Expediente Principal
                </button>
                <button onclick="window.invModule.switchVehicleTab(2)" id="veh-tab-2" class="py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">engineering</span> Datos Técnicos
                </button>
                <button onclick="window.invModule.switchVehicleTab(3)" id="veh-tab-3" class="py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">history</span> Bitácora y Servicios
                </button>
                <div class="ml-auto flex items-center py-2">
                    <button onclick="window.invModule.openLogRegister('${this.selectedVehicle.id}')" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-900/20 transition-transform hover:scale-105">
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
                            <div class="aspect-video bg-[#0d141c] rounded-xl border border-[#324d67] overflow-hidden flex items-center justify-center relative group">
                                <img src="${imgUrl}" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button class="bg-[#233648] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border border-[#324d67] hover:bg-primary transition-colors">
                                        <span class="material-symbols-outlined text-[16px]">visibility</span> Ver Completa
                                    </button>
                                </div>
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

            </div>
        `;
    }

    switchVehicleTab(num) {
        for(let i=1; i<=3; i++) {
            const btn = document.getElementById(`veh-tab-${i}`);
            const content = document.getElementById(`veh-tab-content-${i}`);
            if(btn) btn.className = "py-4 px-6 text-sm font-bold border-b-2 border-transparent text-[#92adc9] hover:text-white transition-colors flex items-center gap-2";
            if(content) content.classList.replace('block', 'hidden');
        }
        document.getElementById(`veh-tab-${num}`).className = "py-4 px-6 text-sm font-bold border-b-2 border-primary text-primary transition-colors flex items-center gap-2 bg-primary/10";
        document.getElementById(`veh-tab-content-${num}`).classList.replace('hidden', 'block');
    }

    // --- ALERTS & HELPERS ---
    getVehicleAlertsHTML() {
        const alerts = [];
        const today = new Date();
        
        if (this.selectedVehicle.license_expiry) {
            const days = Math.ceil((new Date(this.selectedVehicle.license_expiry) - today) / 86400000);
            if (days < 30 && days > 0) alerts.push(`<div class="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-2 rounded flex items-center gap-2 text-xs"><span class="material-symbols-outlined text-sm">warning</span> Tarjeta Circ. vence en ${days} días.</div>`);
            else if (days <= 0) alerts.push(`<div class="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded flex items-center gap-2 text-xs font-bold"><span class="material-symbols-outlined text-sm">error</span> Tarjeta de Circulación VENCIDA.</div>`);
        }
        if (this.selectedVehicle.insurance_expiry) {
            const days = Math.ceil((new Date(this.selectedVehicle.insurance_expiry) - today) / 86400000);
            if (days < 30 && days > 0) alerts.push(`<div class="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-2 rounded flex items-center gap-2 text-xs"><span class="material-symbols-outlined text-sm">warning</span> Póliza de seguro vence en ${days} días.</div>`);
            else if (days <= 0) alerts.push(`<div class="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded flex items-center gap-2 text-xs font-bold"><span class="material-symbols-outlined text-sm">error</span> Póliza de Seguro VENCIDA.</div>`);
        }

        return alerts.length > 0 ? alerts.join('') : `<div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"><span class="material-symbols-outlined text-4xl mb-2">verified_user</span><span class="text-xs font-bold uppercase tracking-widest">Documentación al día</span></div>`;
    }

    getDocumentationHTML() {
        const docs = [
            { type: 'license', title: 'Tarjeta Circulación', exp: this.selectedVehicle.license_expiry, status: this.selectedVehicle.license_status, icon: 'badge' },
            { type: 'insurance', title: 'Póliza de Seguro', exp: this.selectedVehicle.insurance_expiry, status: this.selectedVehicle.insurance_status, icon: 'shield' },
            { type: 'verification', title: 'Verificación Ambiental', exp: this.selectedVehicle.verification_expiry, status: this.selectedVehicle.verification_status, icon: 'eco' }
        ];

        return docs.map(d => {
            const vehicleDocs = this.vehicleDocuments.filter(doc => doc.document_type === d.type);
            const hasFiles = vehicleDocs.length > 0;
            const color = d.status === 'vigente' ? 'green' : d.status === 'vencido' ? 'red' : 'orange';

            return `
                <div class="bg-[#1c2127] border border-[#324d67] p-3 rounded-lg flex justify-between items-center hover:border-[#456b8f] transition-colors shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="bg-[#233648] p-2 rounded-lg text-[#92adc9]"><span class="material-symbols-outlined text-[20px]">${d.icon}</span></div>
                        <div>
                            <p class="text-white text-xs font-bold uppercase">${d.title}</p>
                            <p class="text-[10px] text-[#92adc9] mt-0.5">Vence: <span class="font-mono text-slate-300">${d.exp ? this.formatDate(d.exp) : 'No definida'}</span></p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${hasFiles ? `<button onclick="window.invModule.viewDocuments('${d.type}', '${this.selectedVehicle.id}')" class="text-primary hover:text-blue-400 bg-primary/10 hover:bg-primary/20 p-1.5 rounded transition-colors" title="Ver Archivos"><span class="material-symbols-outlined text-[16px]">visibility</span></button>` : ''}
                        <span class="text-[9px] font-black uppercase px-2 py-1 rounded border border-${color}-500/30 text-${color}-400 bg-${color}-500/10 tracking-widest">${d.status || 'SIN ESTADO'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDate(dateString) {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    }

    getColorHex(colorName) {
        const c = (colorName||'').toLowerCase();
        if(c.includes('blanco')) return '#ffffff';
        if(c.includes('negro')) return '#000000';
        if(c.includes('rojo')) return '#ef4444';
        if(c.includes('azul')) return '#3b82f6';
        if(c.includes('gris') || c.includes('plata')) return '#94a3b8';
        return 'transparent';
    }

    // --- MÉTODOS FALTANTES AÑADIDOS PARA EVITAR ERRORES (Uncaught TypeError) ---
    openDocumentUpload(vehicleId) {
        alert("El módulo para subir documentos en PDF/JPG al expediente de la unidad se activará pronto.");
    }

    openVehicleEdit(vehicleId) {
        alert("El editor de perfil del vehículo se abrirá aquí.");
    }

    async saveDriver() {
        const name = document.getElementById('new-driver-name').value;
        const email = document.getElementById('new-driver-email').value;
        const lic = document.getElementById('new-driver-lic').value;

        if (!name || !email) return alert("El nombre y el correo electrónico son obligatorios.");

        alert("Los conductores deben ser creados en el Panel de Autenticación de Supabase primero por seguridad. Se habilitará el enlace directo aquí.");
        document.getElementById('modal-add-driver').classList.add('hidden');
    }

    viewDocuments(docType, vehicleId) {
        alert("Abriendo visor de documentos para: " + docType);
    }

    // --- REGISTRO DE SERVICIOS EN BITÁCORA ---
    openLogRegister(vehicleId) {
        this.pendingStockDeduction = [];
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        
        content.className = "bg-[#1c2127] w-full max-w-5xl rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display flex flex-col max-h-[90vh]";
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4 shrink-0">
                <h3 class="font-black text-xl text-white flex items-center gap-2 uppercase tracking-tight">
                    <span class="material-symbols-outlined text-green-500 text-3xl">build</span> Reporte de Servicio: ECO-${this.selectedVehicle.economic_number}
                </h3>
                <button onclick="document.getElementById('global-modal').classList.add('hidden'); window.invModule.openVehicleDetail('${vehicleId}')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full border border-[#324d67]">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pb-2">
                <div class="space-y-4">
                    <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl space-y-4 shadow-lg">
                        <h4 class="text-xs font-bold text-primary uppercase tracking-widest border-b border-[#324d67] pb-2">1. Detalles de la Intervención</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Fecha del Servicio</label>
                                <input type="date" id="log-date" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Kilometraje de Ingreso</label>
                                <input type="number" id="log-odometer" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary" value="${this.selectedVehicle.current_km}">
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Diagnóstico / Trabajo Realizado</label>
                            <input id="log-service-name" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Ej: Cambio aceite, revisión frenos...">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Responsable / Taller</label>
                                <input id="log-mechanic" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Nombre interno o proveedor">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold text-[#92adc9] uppercase block mb-1">Costo Mano Obra ($)</label>
                                <input type="number" id="log-labor-cost" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary" value="0" oninput="window.invModule.updateServiceSummary()">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-4 flex flex-col">
                    <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl flex-1 flex flex-col shadow-lg">
                        <h4 class="text-xs font-bold text-orange-500 uppercase tracking-widest border-b border-[#324d67] pb-2 mb-4">2. Consumo de Refacciones (Almacén)</h4>
                        
                        <div class="flex gap-2 mb-4">
                            <select id="log-inv-select" class="flex-1 bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 py-2 text-sm outline-none focus:border-primary">
                                <option value="">Buscar en catálogo...</option>
                                ${this.inventory.map(i => `<option value="${i.id}" data-stock="${i.stock}" data-cost="${i.cost}" data-name="${i.name}">${i.name} (Stk: ${i.stock} | $${i.cost})</option>`).join('')}
                            </select>
                            <input type="number" id="log-inv-qty" class="w-16 bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 py-2 text-center text-sm font-mono outline-none focus:border-primary" value="1" min="1">
                            <button onclick="window.invModule.addManualItem()" class="bg-[#233648] hover:bg-primary text-white px-4 rounded-lg flex items-center justify-center transition-colors shadow" title="Añadir a la lista">
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>

                        <div class="flex-1 border border-[#324d67] rounded-lg overflow-hidden bg-[#1c2127] min-h-[150px]">
                            <table class="w-full text-left text-xs text-white">
                                <thead class="bg-[#233648] text-[#92adc9]"><tr><th class="p-2">Refacción / Insumo</th><th class="p-2 text-center">Cant</th><th class="p-2 text-right">Subtotal</th><th class="p-2"></th></tr></thead>
                                <tbody id="inventory-preview-body" class="divide-y divide-[#324d67]">
                                    <tr><td colspan="4" class="text-center p-6 text-slate-500 font-mono text-[10px] bg-[#111a22]">Sin insumos. Selecciona y presiona +</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="mt-4 bg-[#0d141c] p-4 rounded-lg border border-[#324d67] flex justify-between items-center">
                            <span class="text-xs text-[#92adc9] uppercase font-bold tracking-widest">Inversión Total de la Orden:</span>
                            <span id="summary-total-cost" class="text-2xl font-black text-green-400 font-mono">$0.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-[#324d67] shrink-0">
                <button onclick="window.invModule.saveLog()" class="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all flex items-center justify-center gap-2 text-lg tracking-wide uppercase">
                    <span class="material-symbols-outlined">save</span> Firmar y Registrar en Expediente
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    addManualItem() {
        const select = document.getElementById('log-inv-select');
        const qty = parseFloat(document.getElementById('log-inv-qty').value);
        const opt = select.options[select.selectedIndex];
        
        if (!opt || qty <= 0 || !select.value) return alert('Selecciona un producto del catálogo y una cantidad válida mayor a 0.');
        
        const itemId = select.value;
        const stock = parseFloat(opt.dataset.stock);
        const cost = parseFloat(opt.dataset.cost);
        const name = opt.dataset.name;

        if (qty > stock) alert(`⚠️ Advertencia de Almacén: Estás sacando (${qty}) pero el sistema solo registra (${stock}) en existencia. Se generará un negativo.`);

        const existingItem = this.pendingStockDeduction.find(i => i.id === itemId);
        if (existingItem) existingItem.qty += qty;
        else this.pendingStockDeduction.push({ id: itemId, name, cost, qty });
        
        this.previewService();
        document.getElementById('log-inv-select').value = '';
        document.getElementById('log-inv-qty').value = 1;
    }

    removePendingItem(idx) {
        this.pendingStockDeduction.splice(idx, 1);
        this.previewService();
    }

    previewService() {
        const tbody = document.getElementById('inventory-preview-body');
        if (this.pendingStockDeduction.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-500 font-mono text-[10px] bg-[#111a22]">Sin insumos. Selecciona y presiona +</td></tr>';
        } else {
            tbody.innerHTML = this.pendingStockDeduction.map((item, idx) => `
                <tr class="hover:bg-[#233648] transition-colors">
                    <td class="p-2 font-bold truncate max-w-[150px] text-primary" title="${item.name}">${item.name}</td>
                    <td class="p-2 text-center text-white font-mono bg-white/5 rounded mx-1">${item.qty}</td>
                    <td class="p-2 text-right font-mono text-green-400">$${(item.qty * item.cost).toFixed(2)}</td>
                    <td class="p-2 text-center">
                        <button onclick="window.invModule.removePendingItem(${idx})" class="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"><span class="material-symbols-outlined text-[16px]">close</span></button>
                    </td>
                </tr>
            `).join('');
        }
        this.updateServiceSummary();
    }

    updateServiceSummary() {
        const partsCost = this.pendingStockDeduction.reduce((sum, item) => sum + (item.qty * item.cost), 0);
        const laborCost = parseFloat(document.getElementById('log-labor-cost').value) || 0;
        document.getElementById('summary-total-cost').textContent = `$${(partsCost + laborCost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    async saveLog() {
        const serviceName = document.getElementById('log-service-name').value;
        const date = document.getElementById('log-date').value;
        const odometer = parseInt(document.getElementById('log-odometer').value);
        const laborCost = parseFloat(document.getElementById('log-labor-cost').value) || 0;
        
        if (!serviceName || !date || isNaN(odometer)) return alert("Completa los datos obligatorios: Diagnóstico, Fecha y Kilometraje actual.");

        const partsCost = this.pendingStockDeduction.reduce((sum, item) => sum + (item.qty * item.cost), 0);
        const totalCost = partsCost + laborCost;
        
        const logData = {
            vehicle_id: this.selectedVehicle.id,
            date: date,
            odometer: odometer,
            service_name: serviceName,
            parts_used: this.pendingStockDeduction.length ? this.pendingStockDeduction.map(i => `${i.qty} PZ - ${i.name} ($${i.cost.toFixed(2)} c/u)`).join('\n') : 'Ninguna (Solo Mano de Obra)',
            total_cost: totalCost,
            labor_cost: laborCost,
            parts_cost: partsCost,
            mechanic: document.getElementById('log-mechanic').value || 'Taller Interno',
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase.from('vehicle_logs').insert([logData]);
            if (error) throw error;

            for(let item of this.pendingStockDeduction) {
                const currentItem = this.inventory.find(i => i.id === item.id);
                if(currentItem) await supabase.from('inventory_items').update({ stock: currentItem.stock - item.qty }).eq('id', item.id);
            }

            if(odometer > this.selectedVehicle.current_km) {
                await supabase.from('vehicles').update({ current_km: odometer }).eq('id', this.selectedVehicle.id);
            }

            alert("✅ Orden de Servicio guardada. El inventario ha sido actualizado automáticamente.");
            
            await this.loadAllData();
            this.openVehicleDetail(this.selectedVehicle.id); 
            
        } catch (e) {
            alert("Error del sistema al guardar la bitácora: " + e.message);
        }
    }

    generateMaintenanceReport() {
        const total = this.vehicleLogs.reduce((sum, log) => sum + Number(log.total_cost || 0), 0);
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <html><head><title>Expediente de Mantenimiento ECO-${this.selectedVehicle.economic_number}</title>
            <style>
                body{font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; padding:40px; color:#1e293b; background: #fff;}
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
                .header h2 { margin:0; color: #0f172a; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;}
                .header p { margin: 5px 0 0 0; color: #475569; font-size: 14px;}
                table{width:100%; border-collapse:collapse; margin-top:20px; font-size: 12px;}
                th,td{border:1px solid #cbd5e1; padding:12px; text-align:left;}
                th{background:#f1f5f9; color: #334155; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;}
                tr:nth-child(even){background-color: #f8fafc;}
                .tot{text-align:right; font-weight:900; font-size:20px; margin-top:30px; color:#0f172a; padding: 15px; background: #f1f5f9; border-radius: 8px;}
                .parts { font-size: 10px; color: #64748b; white-space: pre-wrap; }
            </style>
            </head><body>
                <div class="header">
                    <h2>EXPEDIENTE HISTÓRICO DE MANTENIMIENTO</h2>
                    <p><strong>UNIDAD:</strong> ${this.selectedVehicle.brand} ${this.selectedVehicle.model} (${this.selectedVehicle.year}) | <strong>PLACAS:</strong> ${this.selectedVehicle.plate} | <strong>ECO:</strong> ${this.selectedVehicle.economic_number}</p>
                    <p><strong>KM ACTUAL:</strong> ${Number(this.selectedVehicle.current_km).toLocaleString()} km | <strong>FECHA REPORTE:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <table>
                    <tr><th>Fecha</th><th>Servicio / Diagnóstico</th><th>Kilometraje</th><th>Taller/Mecánico</th><th>Desglose de Refacciones</th><th>Inversión</th></tr>
                    ${this.vehicleLogs.map(l => `
                        <tr>
                            <td style="white-space:nowrap">${this.formatDate(l.date)}</td>
                            <td><strong>${l.service_name}</strong></td>
                            <td style="font-family:monospace">${Number(l.odometer).toLocaleString()} km</td>
                            <td>${l.mechanic || 'Interno'}</td>
                            <td class="parts">${l.parts_used}</td>
                            <td style="font-family:monospace; font-weight:bold; text-align:right">$${Number(l.total_cost).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="tot">INVERSIÓN TOTAL ACUMULADA: $${total.toLocaleString(undefined, {minimumFractionDigits: 2})} MXN</div>
                <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 10px;">
                    Reporte generado automáticamente por COV - Central de Operaciones Vehiculares
                </div>
                <script>window.onload = () => { window.print(); setTimeout(window.close, 500); }</script>
            </body></html>
        `);
    }

    printQR(url, plate) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><style>
                body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center; margin:0;}
                .card { border: 4px solid #000; border-radius: 20px; padding: 40px; display:flex; flex-direction:column; align-items:center; width: 400px;}
                h1{font-size: 50px; margin: 10px 0; font-family: monospace; letter-spacing: 5px;}
                h2{font-size: 16px; margin: 0; color: #555; letter-spacing: 2px;}
                img{width:250px;height:250px;margin:20px 0;}
                p{font-size: 12px; color: #888; font-weight: bold;}
            </style></head>
            <body>
                <div class="card">
                    <h2>UNIDAD VINCULADA COV</h2>
                    <h1>${plate}</h1>
                    <img src="${url}">
                    <p>ESCANEAR PARA GESTIÓN DE SALIDAS Y TALLER</p>
                </div>
                <script>window.onload=()=>{window.print();setTimeout(window.close,500);}</script>
            </body></html>
        `);
    }

    openTripRegister(vehicleId) {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('global-modal-content');
        content.className = "bg-[#1c2127] w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display";
        content.innerHTML = `
            <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                <span class="material-symbols-outlined text-primary">add_location</span> Registrar Trayecto Manual
            </h3>
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
            // El catch previene errores si la tabla aún no existe en Supabase
            await supabase.from('vehicle_trips').insert([{
                vehicle_id: vehicleId,
                distance_km: dist,
                destination: dest,
                start_date: new Date().toISOString()
            }]).catch(e => console.warn('Error guardando trip', e));

            const currentKm = Number(this.selectedVehicle.current_km) + dist;
            await supabase.from('vehicles').update({ current_km: currentKm }).eq('id', vehicleId);

            alert(`✅ Trayecto registrado. Se sumaron ${dist} km al odómetro de la unidad.`);
            await this.loadAllData();
            this.openVehicleDetail(vehicleId);
        } catch (e) {
            alert("Error al guardar trayecto: " + e.message);
        }
    }

    // --- LIMPIEZA ---
    destroy() {
        if (this.realtimeChannel) {
            supabase.removeChannel(this.realtimeChannel);
        }
    }
}
