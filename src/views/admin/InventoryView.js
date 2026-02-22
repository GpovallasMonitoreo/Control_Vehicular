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
                <div id="inspections-list" class="space-y-4"></div>
            </div>

            <div id="global-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div id="global-modal-content" class="bg-[#1c2127] w-full border border-[#324d67] rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-fade-in-up"></div>
            </div>

            <div id="inv-notification-toast" class="hidden fixed bottom-6 right-6 z-[300] bg-[#1c2127] border border-primary text-white p-4 rounded-xl shadow-2xl animate-fade-in-up flex items-center gap-3">
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
        }
    }

    setupRealtimeSubscription() {
        if (!supabase) return;
        if (this.realtimeChannel) supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = supabase.channel('inventory_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => this.handleVehicleRealtimeUpdate(payload)).subscribe();
    }

    handleVehicleRealtimeUpdate(payload) {
        if (payload.eventType === 'INSERT') this.vehicles.push(payload.new);
        else if (payload.eventType === 'UPDATE') {
            const idx = this.vehicles.findIndex(v => v.id === payload.new.id);
            if (idx !== -1) this.vehicles[idx] = payload.new;
        }
        this.renderVehiclesGrid();
    }

    renderVehiclesGrid() {
        const grid = document.getElementById('grid-vehicles');
        if (!grid) return;
        grid.innerHTML = this.vehicles.map(v => {
            const activeTrip = this.allAppTrips.find(t => t.vehicle_id === v.id && ['requested', 'approved_for_taller', 'driver_accepted', 'in_progress'].includes(t.status));
            const statusName = activeTrip ? 'En Uso' : (v.status === 'active' ? 'Disponible' : 'Taller');
            const statusColor = activeTrip ? 'border-blue-500 text-blue-400' : (v.status === 'active' ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400');
            return `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg" onclick="window.invModule.openVehicleDetail('${v.id}')">
                <div class="h-40 bg-[#111a22] relative border-b border-[#324d67]">
                    <img src="${v.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover opacity-60">
                    <div class="absolute top-2 right-2 bg-black/80 text-[10px] font-black px-2 py-1 rounded border ${statusColor} uppercase">${statusName}</div>
                </div>
                <div class="p-5">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-white font-bold text-sm">${v.brand} ${v.model}</h3>
                        <span class="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded">ECO-${v.economic_number}</span>
                    </div>
                    <div class="text-xs text-[#92adc9] font-mono bg-[#111a22] p-1.5 rounded border border-[#324d67] text-center">${v.plate}</div>
                </div>
            </div>`;
        }).join('');
    }

    renderDriversTable() {
        const tbody = document.getElementById('table-drivers');
        if (!tbody) return;
        tbody.innerHTML = this.drivers.map(d => `
            <tr class="hover:bg-[#232b34] border-b border-[#324d67]">
                <td class="px-6 py-4 flex items-center gap-3">
                    <div class="size-8 rounded-full bg-slate-700 bg-cover" style="background-image: url('${d.photo_url || ''}')"></div>
                    <span class="text-white text-xs font-bold">${d.full_name}</span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-400 font-mono">${d.license_number || '--'}</td>
                <td class="px-6 py-4 text-center"><span class="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Activo</span></td>
                <td class="px-6 py-4 text-right"><span class="text-slate-500 text-xs">Vigilado</span></td>
            </tr>
        `).join('');
    }

    renderInspectionsList() {
        const container = document.getElementById('inspections-list');
        if (!container) return;
        container.innerHTML = this.inspections.map(i => `
            <div class="bg-[#1c2127] border border-[#324d67] p-4 rounded-xl flex justify-between items-center">
                <div>
                    <p class="text-white font-bold text-sm">ECO-${i.vehicles?.economic_number} • ${i.vehicles?.plate}</p>
                    <p class="text-[10px] text-slate-400">${new Date(i.created_at).toLocaleString()}</p>
                </div>
                <span class="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 uppercase">${i.vehicle_approval}</span>
            </div>
        `).join('');
    }

    async openVehicleDetail(id) {
        this.selectedVehicle = this.vehicles.find(v => v.id === id);
        if(!this.selectedVehicle) return;

        this.vehicleAppTrips = this.allAppTrips.filter(t => t.vehicle_id === id);
        this.vehicleInspectionsPhotos = this.vehicleAppTrips.filter(t => (t.workshop_reception_photos?.length || t.workshop_return_photos?.length));

        const [logsRes, docsRes] = await Promise.all([
            supabase.from('vehicle_logs').select('*').eq('vehicle_id', id).order('date', {ascending: false}).then(r => r.error ? {data:[]} : r),
            supabase.from('vehicle_documents').select('*').eq('vehicle_id', id).order('uploaded_at', {ascending: false}).then(r => r.error ? {data:[]} : r)
        ]);
        
        this.vehicleLogs = logsRes?.data || [];
        this.vehicleDocuments = docsRes?.data || [];
        
        this.updateActiveModalInfo();
        document.getElementById('global-modal').classList.remove('hidden');
    }

    updateActiveModalInfo() {
        const content = document.getElementById('global-modal-content');
        if(!this.selectedVehicle || !content) return;

        const imgUrl = this.selectedVehicle.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=60';

        content.innerHTML = `
            <div class="bg-[#111a22] border-b border-[#324d67] p-6 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="bg-primary text-white p-3 rounded-xl font-black text-xl shadow-lg">ECO-${this.selectedVehicle.economic_number}</div>
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase">${this.selectedVehicle.brand} ${this.selectedVehicle.model}</h2>
                        <div class="text-[#92adc9] text-xs font-mono mt-1">${this.selectedVehicle.plate}</div>
                    </div>
                </div>
                <button onclick="document.getElementById('global-modal').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
            </div>

            <div class="flex border-b border-[#324d67] bg-[#111a22] px-6 overflow-x-auto">
                <button onclick="window.invModule.switchVehicleTab(1)" id="veh-tab-1" class="py-4 px-4 text-sm font-bold border-b-2 border-primary text-primary whitespace-nowrap">Expediente</button>
                <button onclick="window.invModule.switchVehicleTab(2)" id="veh-tab-2" class="py-4 px-4 text-sm font-bold border-b-2 border-transparent text-[#92adc9] whitespace-nowrap">Salud y Datos</button>
                <button onclick="window.invModule.switchVehicleTab(3)" id="veh-tab-3" class="py-4 px-4 text-sm font-bold border-b-2 border-transparent text-[#92adc9] whitespace-nowrap">Bitácora</button>
                <button onclick="window.invModule.switchVehicleTab(4)" id="veh-tab-4" class="py-4 px-4 text-sm font-bold border-b-2 border-transparent text-[#92adc9] whitespace-nowrap">Fotos Inspección</button>
            </div>

            <div class="flex-1 overflow-y-auto p-6 bg-[#0d141c]">
                <div id="veh-tab-content-1" class="space-y-6 block">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-[#111a22] p-5 rounded-xl border border-[#324d67]">
                            <h3 class="text-white font-bold text-xs uppercase mb-4 border-b border-[#324d67] pb-2">Documentos Digitales</h3>
                            <div class="space-y-2">${this.getDocumentationHTML()}</div>
                            <button onclick="window.invModule.openDocumentUpload('${this.selectedVehicle.id}')" class="w-full mt-4 py-2 bg-primary text-white text-xs font-bold rounded-lg uppercase shadow-lg">Subir Archivo</button>
                        </div>
                        <div class="bg-[#111a22] p-5 rounded-xl border border-[#324d67] flex flex-col items-center">
                            <h3 class="text-white font-bold text-xs uppercase mb-4 w-full text-left">Fotografía Unidad</h3>
                            <img src="${imgUrl}" class="w-full h-40 object-cover rounded-lg border border-[#324d67]">
                        </div>
                    </div>
                </div>

                <div id="veh-tab-content-2" class="hidden space-y-6">
                    <div class="bg-[#111a22] p-6 rounded-xl border border-[#324d67]">
                        <h3 class="text-white font-bold text-xs uppercase mb-4">Salud de Componentes</h3>
                        <div id="components-container" class="space-y-4"></div>
                        <div class="mt-6 flex gap-3">
                            <button onclick="window.invModule.addComponentRow()" class="flex-1 py-2 bg-[#233648] text-white text-xs font-bold rounded-lg border border-[#324d67]">Añadir Pieza</button>
                            <button onclick="window.invModule.saveComponentsHealth()" class="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-lg">Guardar Salud</button>
                        </div>
                    </div>
                </div>

                <div id="veh-tab-content-3" class="hidden">
                    <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-white font-bold text-xs uppercase">Historial de Mantenimiento</h3>
                            <button onclick="window.invModule.openLogRegister('${this.selectedVehicle.id}')" class="px-3 py-1.5 bg-green-600 text-white text-[10px] font-black rounded-lg uppercase">Registrar Servicio</button>
                        </div>
                        <div class="space-y-2">${this.vehicleLogs.map(l => `<div class="p-3 bg-[#1c2127] rounded-lg border border-[#324d67] flex justify-between items-center"><div class="text-xs text-white"><b>${l.service_name}</b><br><span class="text-[10px] text-slate-400">${l.date} • ${l.odometer} km</span></div><span class="text-green-400 font-mono text-xs">$${l.total_cost}</span></div>`).join('')}</div>
                    </div>
                </div>

                <div id="veh-tab-content-4" class="hidden space-y-6">
                    <h3 class="text-white font-bold text-xs uppercase border-b border-[#324d67] pb-2">Evidencia Fotográfica de Viajes</h3>
                    <div class="space-y-4">${this.renderVehiclePhotosGallery()}</div>
                </div>
            </div>
        `;
        this.renderComponentsHealth();
    }

    switchVehicleTab(num) {
        for(let i=1; i<=4; i++) {
            const btn = document.getElementById(`veh-tab-${i}`);
            const content = document.getElementById(`veh-tab-content-${i}`);
            if(btn) btn.className = "py-4 px-4 text-sm font-bold border-b-2 border-transparent text-[#92adc9]";
            if(content) content.classList.replace('block', 'hidden');
        }
        document.getElementById(`veh-tab-${num}`).className = "py-4 px-4 text-sm font-bold border-b-2 border-primary text-primary";
        document.getElementById(`veh-tab-content-${num}`).classList.replace('hidden', 'block');
    }

    // --- FUNCIONES HELPER ---
    getColorHex(colorName) {
        const c = (colorName||'').toLowerCase();
        if(c.includes('blanco')) return '#ffffff';
        if(c.includes('negro')) return '#000000';
        if(c.includes('rojo')) return '#ef4444';
        if(c.includes('azul')) return '#3b82f6';
        if(c.includes('gris')) return '#94a3b8';
        return '#475569';
    }

    viewPhoto(url) {
        const viewer = document.getElementById('photo-viewer');
        const img = document.getElementById('viewer-img');
        if(viewer && img) { img.src = url; viewer.classList.remove('hidden'); }
    }

    formatDate(dateString) {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleDateString();
    }

    getDocumentationHTML() {
        const docTypes = ['license', 'insurance', 'verification'];
        const typeNames = {'license': 'Tarjeta Circulación', 'insurance': 'Seguro', 'verification': 'Verificación'};
        return docTypes.map(type => {
            const hasDoc = this.vehicleDocuments.find(d => d.document_type === type);
            return `
            <div class="p-3 bg-[#1c2127] rounded-lg border border-[#324d67] flex justify-between items-center">
                <span class="text-white text-xs">${typeNames[type]}</span>
                ${hasDoc ? `<button onclick="window.invModule.viewDocuments('${type}', '${this.selectedVehicle.id}')" class="text-primary text-[10px] font-bold uppercase hover:underline">Ver Archivos</button>` : `<span class="text-red-400 text-[10px] uppercase font-bold">Faltante</span>`}
            </div>`;
        }).join('');
    }

    renderVehiclePhotosGallery() {
        if(!this.vehicleInspectionsPhotos.length) return `<p class="text-xs text-slate-500 italic text-center">No hay fotos registradas.</p>`;
        return this.vehicleInspectionsPhotos.map(trip => `
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <p class="text-xs font-bold text-white mb-3">Viaje del ${new Date(trip.created_at).toLocaleDateString()} - Cond: ${trip.profiles?.full_name}</p>
                <div class="grid grid-cols-4 gap-2">
                    ${(trip.workshop_reception_photos || []).map(p => `<img src="${p.url}" class="w-full aspect-square object-cover rounded cursor-pointer" onclick="window.invModule.viewPhoto('${p.url}')">`).join('')}
                    ${(trip.workshop_return_photos || []).map(p => `<img src="${p.url}" class="w-full aspect-square object-cover rounded cursor-pointer border-2 border-primary/30" onclick="window.invModule.viewPhoto('${p.url}')">`).join('')}
                </div>
            </div>
        `).join('');
    }

    renderComponentsHealth() {
        const container = document.getElementById('components-container');
        if(!container) return;
        let comps = this.selectedVehicle.components || [{name:'Motor',weight:50,health:100},{name:'Frenos',weight:50,health:100}];
        container.innerHTML = comps.map((c, i) => `
            <div class="component-row bg-[#1c2127] p-3 rounded-lg border border-[#324d67]">
                <div class="flex justify-between items-center mb-2">
                    <input type="text" class="comp-name bg-transparent text-white text-xs font-bold outline-none" value="${c.name}">
                    <span class="text-primary font-mono text-[10px]">${c.health}% Salud</span>
                </div>
                <div class="flex gap-4 items-center">
                    <div class="flex-1"><label class="text-[8px] text-slate-500 uppercase block">Peso (%)</label><input type="number" class="comp-weight w-full bg-[#111a22] text-white text-xs p-1 rounded" value="${c.weight}" onchange="window.invModule.calculateTotalHealth()"></div>
                    <div class="flex-1"><label class="text-[8px] text-slate-500 uppercase block">Salud (%)</label><input type="number" class="comp-health w-full bg-[#111a22] text-white text-xs p-1 rounded" value="${c.health}" onchange="window.invModule.calculateTotalHealth()"></div>
                    <button onclick="this.closest('.component-row').remove(); window.invModule.calculateTotalHealth()" class="text-red-500"><span class="material-symbols-outlined text-sm">delete</span></button>
                </div>
            </div>`).join('');
        this.calculateTotalHealth();
    }

    addComponentRow() {
        const container = document.getElementById('components-container');
        const div = document.createElement('div'); div.className = "component-row bg-[#1c2127] p-3 rounded-lg border border-[#324d67] animate-fade-in";
        div.innerHTML = `<div class="flex justify-between items-center mb-2"><input type="text" class="comp-name bg-transparent text-white text-xs font-bold outline-none" value="Nueva Pieza"><span class="text-primary font-mono text-[10px]">100% Salud</span></div><div class="flex gap-4 items-center"><div class="flex-1"><label class="text-[8px] text-slate-500 uppercase block">Peso (%)</label><input type="number" class="comp-weight w-full bg-[#111a22] text-white text-xs p-1 rounded" value="10" onchange="window.invModule.calculateTotalHealth()"></div><div class="flex-1"><label class="text-[8px] text-slate-500 uppercase block">Salud (%)</label><input type="number" class="comp-health w-full bg-[#111a22] text-white text-xs p-1 rounded" value="100" onchange="window.invModule.calculateTotalHealth()"></div><button onclick="this.closest('.component-row').remove(); window.invModule.calculateTotalHealth()" class="text-red-500"><span class="material-symbols-outlined text-sm">delete</span></button></div>`;
        container.appendChild(div);
        this.calculateTotalHealth();
    }

    calculateTotalHealth() {
        const rows = document.querySelectorAll('.component-row');
        let total = 0, weight = 0;
        rows.forEach(r => {
            const w = parseFloat(r.querySelector('.comp-weight').value) || 0;
            const h = parseFloat(r.querySelector('.comp-health').value) || 0;
            total += (w * h) / 100; weight += w;
        });
        const badge = document.getElementById('overall-health-badge');
        if(badge) { badge.innerText = `${total.toFixed(1)}%`; badge.className = `text-2xl font-black font-mono ${total>80?'text-green-400':total>50?'text-yellow-400':'text-red-400'}`; }
    }

    async saveComponentsHealth() {
        const rows = document.querySelectorAll('.component-row');
        const comps = []; rows.forEach(r => comps.push({ name: r.querySelector('.comp-name').value, weight: parseFloat(r.querySelector('.comp-weight').value), health: parseFloat(r.querySelector('.comp-health').value) }));
        await supabase.from('vehicles').update({ components: comps }).eq('id', this.selectedVehicle.id);
        alert("✅ Salud de componentes guardada.");
    }

    openDocumentUpload(vId) { alert("Sube documentos en la carpeta 'vehicle_documents' de Supabase."); }
    openLogRegister(vId) { alert("Registra servicios en la pestaña de 'Área de Reparación' o 'Taller Central'."); }
    updateFilterSelects() {}
}
