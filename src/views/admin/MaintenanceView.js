import { supabase } from '../../config/supabaseClient.js';

export class MaintenanceView {
    constructor() {
        this.logs = [];
        this.vehicles = [];
        this.services = [];
        this.inventory = [];
        this.tempRecipeItems = [];
        this.capturedImages = []; 
        this.schedules = []; 
        this.html5QrcodeScanner = null;
        
        // Control del calendario
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();

        window.taller = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10 p-4 md:p-6">
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-4xl">handyman</span>
                        Taller Central
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal">Gestión integral: Logística, Mecánica y Salud de Flota.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.taller.openEmergencyAccess()" class="h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-all shadow-lg flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">key</span>
                        <span>Acceso Único</span>
                    </button>
                    <button onclick="window.taller.switchTab('new-service')" class="h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Nueva Orden</span>
                    </button>
                </div>
            </div>

            <div class="flex border-b border-[#324d67] overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="window.taller.switchTab('dashboard')" id="tab-btn-dashboard" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">dashboard</span> Tablero</button>
                <button onclick="window.taller.switchTab('new-service')" id="tab-btn-new-service" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">car_repair</span> Servicio y Mecánica</button>
                <button onclick="window.taller.switchTab('calendar')" id="tab-btn-calendar" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">calendar_month</span> Agenda</button>
                <button onclick="window.taller.switchTab('database')" id="tab-btn-database" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">table_view</span> Base de Datos</button>
                <button onclick="window.taller.switchTab('completed')" id="tab-btn-completed" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">task_alt</span> Completados</button>
            </div>

            <div class="flex-1 relative overflow-hidden">
                
                <div id="tab-content-dashboard" class="space-y-6 animate-fade-in block h-full overflow-y-auto custom-scrollbar pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl shadow-sm">
                            <p class="text-[#92adc9] text-[10px] font-bold uppercase">En Taller</p>
                            <p id="stat-in-shop" class="text-white text-3xl font-black">0</p>
                        </div>
                        <div class="bg-[#1c2127] border border-[#324d67] p-5 rounded-xl shadow-sm">
                            <p class="text-[#92adc9] text-[10px] font-bold uppercase">Servicios Mes</p>
                            <p id="stat-completed" class="text-white text-3xl font-black">0</p>
                        </div>
                    </div>
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden shadow-xl">
                        <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center">
                            <h4 class="text-white font-bold flex items-center gap-2"><span class="material-symbols-outlined text-primary">history</span> Actividad Reciente</h4>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm whitespace-nowrap">
                                <thead class="bg-[#111a22] text-[#92adc9] text-[10px] font-black uppercase">
                                    <tr><th class="px-6 py-3">Fecha</th><th class="px-6 py-3">Unidad</th><th class="px-6 py-3">Servicio</th><th class="px-6 py-3 text-right">Inversión</th></tr>
                                </thead>
                                <tbody id="maintenance-list" class="divide-y divide-[#324d67]/50 text-slate-300"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="tab-content-new-service" class="hidden animate-fade-in h-full overflow-y-auto custom-scrollbar pr-2 pb-10">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div class="space-y-6">
                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase text-xs">
                                    <span class="material-symbols-outlined text-primary">qr_code_scanner</span> Identificar Unidad
                                </h3>
                                <div id="reader" class="w-full bg-black rounded-lg overflow-hidden border border-[#324d67] aspect-square mb-4"></div>
                                <select id="shop-vehicle-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" onchange="window.taller.loadVehicleForService(this.value)">
                                    <option value="">Selección Manual...</option>
                                </select>
                                <div id="selected-vehicle-card" class="mt-4 bg-primary/10 border border-primary/30 p-4 rounded-lg hidden">
                                    <h4 id="sv-plate" class="text-2xl font-black text-white leading-none">--</h4>
                                    <p id="sv-model" class="text-xs text-[#92adc9] mt-1">--</p>
                                </div>
                            </div>

                            <div id="mec-health-area" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                                <div class="flex justify-between items-center border-b border-[#324d67] pb-2 mb-4">
                                    <h3 class="font-bold text-white uppercase text-xs">Salud de Unidad</h3>
                                    <span id="overall-health-pct" class="text-xl font-black text-green-400 font-mono">100%</span>
                                </div>
                                <div id="components-list" class="space-y-4">
                                    </div>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-6 opacity-40 pointer-events-none transition-all" id="shop-process-area">
                            
                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase text-xs text-orange-400">
                                    <span class="material-symbols-outlined">fact_check</span> 1. Revisión de Logística (Entrada/Salida)
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="flex items-center justify-between p-2 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer text-xs text-white">Carrocería OK <input type="checkbox" id="chk-body" class="accent-primary w-4 h-4"></label>
                                        <label class="flex items-center justify-between p-2 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer text-xs text-white">Luces OK <input type="checkbox" id="chk-lights" class="accent-primary w-4 h-4"></label>
                                        <label class="flex items-center justify-between p-2 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer text-xs text-white">Interiores Limpios <input type="checkbox" id="chk-clean" class="accent-primary w-4 h-4"></label>
                                    </div>
                                    <div class="space-y-2">
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase">Km de Entrada</label>
                                        <input type="number" id="shop-current-km" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-2 outline-none focus:border-primary font-mono">
                                        <label class="block text-[10px] font-bold text-orange-400 uppercase mt-2">Tiempo Estimado de Espera</label>
                                        <input type="text" id="shop-wait-time" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-2 outline-none focus:border-orange-500 text-sm" placeholder="Ej: 2 horas">
                                    </div>
                                </div>
                            </div>

                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase text-xs text-green-400">
                                    <span class="material-symbols-outlined">build</span> 2. Reparación Mecánica y Refacciones
                                </h3>
                                <div class="space-y-4">
                                    <div class="flex gap-2">
                                        <select id="shop-recipe-select" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm outline-none" onchange="window.taller.applyRecipe()">
                                            <option value="">Cargar Receta/Paquete...</option>
                                        </select>
                                        <button onclick="window.taller.clearRecipe()" class="bg-[#233648] px-4 rounded-lg text-slate-400 hover:text-white transition-colors border border-[#324d67]"><span class="material-symbols-outlined">delete_sweep</span></button>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input id="shop-service-name" class="bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="Nombre del Trabajo">
                                        <input type="number" id="shop-labor-cost" class="bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-right" placeholder="Mano de Obra ($)" oninput="window.taller.updateTotalCost()">
                                    </div>

                                    <div class="border border-[#324d67] rounded-lg overflow-hidden bg-[#111a22]">
                                        <table class="w-full text-left text-[11px] text-white">
                                            <thead class="bg-[#233648] text-[#92adc9]"><tr><th class="p-2">Pieza</th><th class="p-2 text-center">Cant</th><th class="p-2 text-right">Subtotal</th></tr></thead>
                                            <tbody id="shop-parts-list" class="divide-y divide-[#324d67]">
                                                <tr><td colspan="3" class="text-center p-4 text-slate-600">Sin piezas cargadas.</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div class="bg-[#111a22] border border-[#324d67] p-4 rounded-lg">
                                        <div class="flex justify-between items-center mb-2">
                                            <p class="text-xs text-[#92adc9] font-bold uppercase tracking-wider">Evidencia Visual</p>
                                            <input type="file" accept="image/*" capture="environment" id="shop-camera" class="hidden" onchange="window.taller.captureImage(this)">
                                            <label for="shop-camera" class="bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors">
                                                <span class="material-symbols-outlined text-[16px]">add_a_photo</span> Capturar
                                            </label>
                                        </div>
                                        <div id="images-container" class="grid grid-cols-4 gap-2"></div>
                                    </div>

                                    <div class="flex justify-between items-center bg-[#0d141c] p-4 rounded-xl border border-[#324d67]">
                                        <span class="text-sm font-bold text-[#92adc9] uppercase">Inversión Total:</span>
                                        <span id="shop-total-cost" class="text-2xl font-black text-green-400 font-mono">$0.00</span>
                                    </div>

                                    <button id="btn-save-shop" onclick="window.taller.saveShopService()" class="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                        <span class="material-symbols-outlined">verified</span> Finalizar Reparación y Liberar Unidad
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="tab-content-calendar" class="hidden h-full">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl flex flex-col h-full overflow-hidden">
                        <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center">
                            <h3 id="calendar-month-title" class="font-black text-white uppercase">Mes Año</h3>
                            <div class="flex gap-2">
                                <button onclick="window.taller.changeMonth(-1)" class="bg-[#233648] text-white w-8 h-8 rounded-lg">←</button>
                                <button onclick="window.taller.changeMonth(1)" class="bg-[#233648] text-white w-8 h-8 rounded-lg">→</button>
                            </div>
                        </div>
                        <div id="calendar-grid" class="grid grid-cols-7 gap-1 p-4 flex-1 bg-[#0d141c]"></div>
                    </div>
                </div>

                <div id="tab-content-database" class="hidden h-full overflow-auto custom-scrollbar">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl">
                        <table class="w-full text-left text-xs whitespace-nowrap">
                            <thead class="bg-[#111a22] text-[#92adc9] uppercase font-black sticky top-0">
                                <tr><th class="p-3">ID</th><th class="p-3">Fecha</th><th class="p-3">ECO</th><th class="p-3">Servicio</th><th class="p-3">Total</th></tr>
                            </thead>
                            <tbody id="database-table" class="divide-y divide-[#324d67] text-slate-300"></tbody>
                        </table>
                    </div>
                </div>

                <div id="tab-content-completed" class="hidden animate-fade-in h-full overflow-y-auto custom-scrollbar pb-10">
                    <div id="completed-list" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        </div>
                </div>

            </div>

            <div id="modal-schedule-calendar" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-md rounded-2xl p-6 animate-fade-in-up">
                    <h3 class="text-lg font-black text-white mb-4">Agendar Servicio</h3>
                    <input type="hidden" id="sched-date-hidden">
                    <div class="space-y-4">
                        <select id="sched-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white p-3 rounded-lg outline-none"></select>
                        <input id="sched-service" class="w-full bg-[#111a22] border border-[#324d67] text-white p-3 rounded-lg outline-none" placeholder="Tipo de servicio">
                        <button onclick="window.taller.saveScheduledService()" class="w-full py-3 bg-primary text-white font-bold rounded-xl">Agendar</button>
                    </div>
                </div>
            </div>

            <div id="photo-viewer" class="hidden fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-4" onclick="this.classList.add('hidden')">
                <img id="viewer-img" class="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10">
            </div>

        </div>
        `;
    }

    async onMount() {
        await this.loadInitialData();
        this.setupScanner();
    }

    async loadInitialData() {
        const [vehRes, invRes, recRes, logRes, schedRes] = await Promise.all([
            supabase.from('vehicles').select('*'),
            supabase.from('inventory_items').select('*'),
            supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock))'),
            supabase.from('vehicle_logs').select('*, vehicles(economic_number, plate)').order('date', {ascending: false}),
            supabase.from('maintenance_logs').select('*, vehicles(economic_number, plate)').eq('status', 'scheduled')
        ]);

        this.vehicles = vehRes.data || [];
        this.inventory = invRes.data || [];
        this.services = recRes.data || [];
        this.logs = logRes.data || [];
        this.schedules = schedRes.data || [];

        const vehOptions = '<option value="">Selecciona unidad...</option>' + this.vehicles.map(v => `<option value="${v.id}">${v.plate} (ECO-${v.economic_number})</option>`).join('');
        document.getElementById('shop-vehicle-select').innerHTML = vehOptions;
        document.getElementById('sched-vehicle').innerHTML = vehOptions;
        document.getElementById('shop-recipe-select').innerHTML = '<option value="">Cargar Receta...</option>' + this.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        this.renderDashboard();
        this.renderDatabaseTable();
        this.renderCompletedTab();
    }

    switchTab(tab) {
        ['dashboard', 'new-service', 'calendar', 'database', 'completed'].forEach(t => {
            const content = document.getElementById(`tab-content-${t}`);
            const btn = document.getElementById(`tab-btn-${t}`);
            if (content) content.classList.replace('block', 'hidden');
            if (btn) btn.className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2";
        });

        const activeContent = document.getElementById(`tab-content-${tab}`);
        const activeBtn = document.getElementById(`tab-btn-${tab}`);
        if (activeContent) activeContent.classList.replace('hidden', 'block');
        if (activeBtn) activeBtn.className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2 bg-[#1c2127]";

        if(tab === 'calendar') this.renderCalendar();
        if(tab === 'completed') this.renderCompletedTab();
    }

    // --- SALUD DE COMPONENTES ---
    renderComponentsHealth(vehicle) {
        const container = document.getElementById('components-list');
        const area = document.getElementById('mec-health-area');
        if(!container) return;

        area.classList.remove('hidden');
        let comps = vehicle.components || [
            { name: 'Motor', weight: 40, health: 100 },
            { name: 'Frenos', weight: 20, health: 100 },
            { name: 'Llantas', weight: 20, health: 100 },
            { name: 'Suspensión', weight: 20, health: 100 }
        ];

        container.innerHTML = comps.map((c, i) => `
            <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67]">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-white font-bold">${c.name} (${c.weight}%)</span>
                    <span class="text-[10px] text-primary font-mono">${c.health}% Salud</span>
                </div>
                <input type="range" min="0" max="100" value="${c.health}" class="w-full accent-primary h-1 bg-slate-700 rounded-lg cursor-pointer" 
                       oninput="window.taller.updateComponentHealth(${i}, this.value)">
            </div>
        `).join('');
        this.calculateOverallHealth(comps);
    }

    updateComponentHealth(index, value) {
        this.selectedVehicle.components[index].health = parseInt(value);
        this.renderComponentsHealth(this.selectedVehicle);
    }

    calculateOverallHealth(comps) {
        let totalHealth = 0;
        comps.forEach(c => {
            totalHealth += (c.weight * c.health) / 100;
        });
        const badge = document.getElementById('overall-health-pct');
        if(badge) {
            badge.innerText = `${totalHealth.toFixed(1)}%`;
            badge.className = `text-xl font-black font-mono ${totalHealth > 80 ? 'text-green-400' : (totalHealth > 50 ? 'text-yellow-400' : 'text-red-500')}`;
        }
    }

    loadVehicleForService(id) {
        const v = this.vehicles.find(x => x.id === id);
        if(!v) return;
        this.selectedVehicle = v;
        document.getElementById('sv-plate').innerText = v.plate;
        document.getElementById('sv-model').innerText = `${v.brand} ${v.model}`;
        document.getElementById('shop-current-km').value = v.current_km;
        document.getElementById('selected-vehicle-card').classList.remove('hidden');
        document.getElementById('shop-process-area').classList.remove('opacity-40', 'pointer-events-none');
        this.renderComponentsHealth(v);
    }

    captureImage(input) {
        if(input.files && input.files[0]) {
            this.capturedImages.push(input.files[0]);
            this.renderCapturedImages();
            input.value = ''; 
        }
    }

    renderCapturedImages() {
        const container = document.getElementById('images-container');
        if(!container) return;
        if(this.capturedImages.length === 0) { container.innerHTML = ''; return; }
        container.innerHTML = this.capturedImages.map((file, idx) => `
            <div class="relative aspect-square rounded-lg overflow-hidden border border-[#324d67] shadow-lg">
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                <button onclick="window.taller.removeImage(${idx})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"><span class="material-symbols-outlined text-[12px]">close</span></button>
            </div>
        `).join('');
    }

    removeImage(idx) { this.capturedImages.splice(idx, 1); this.renderCapturedImages(); }

    viewPhoto(url) {
        const viewer = document.getElementById('photo-viewer');
        const img = document.getElementById('viewer-img');
        img.src = url;
        viewer.classList.remove('hidden');
    }

    applyRecipe() {
        const recipeId = document.getElementById('shop-recipe-select').value;
        const template = this.services.find(s => s.id === recipeId);
        if(!template) return;
        document.getElementById('shop-service-name').value = template.name;
        document.getElementById('shop-labor-cost').value = template.labor_cost || 0;
        this.tempRecipeItems = template.service_template_items?.map(si => ({ id: si.inventory_items.id, name: si.inventory_items.name, qty: si.quantity, cost: si.inventory_items.cost, stock: si.inventory_items.stock })) || [];
        this.renderRecipeList();
    }

    renderRecipeList() {
        const tbody = document.getElementById('shop-parts-list');
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        let partsTotal = 0;
        if(!this.tempRecipeItems.length) { tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">Sin insumos.</td></tr>'; } 
        else {
            tbody.innerHTML = this.tempRecipeItems.map(i => { 
                partsTotal += i.qty * i.cost; 
                return `<tr class="hover:bg-[#192633]"><td class="p-2 font-bold text-primary">${i.name}</td><td class="p-2 text-center">${i.qty}</td><td class="p-2 text-right text-green-400 font-mono">$${(i.qty*i.cost).toFixed(2)}</td></tr>`; 
            }).join('');
        }
        document.getElementById('shop-total-cost').innerText = `$${(partsTotal + laborCost).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    async saveShopService() {
        if (!this.selectedVehicle) return alert('Escanea o selecciona una unidad.');
        const btn = document.getElementById('btn-save-shop');
        const serviceName = document.getElementById('shop-service-name').value;
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        const currentKm = parseInt(document.getElementById('shop-current-km').value) || 0;
        const waitTime = document.getElementById('shop-wait-time').value;

        if (!serviceName) return alert('Define el nombre del trabajo.');

        btn.disabled = true;
        btn.innerHTML = 'Procesando...';

        try {
            // 1. Subir fotos
            let uploadedPhotos = [];
            for (let file of this.capturedImages) {
                const fileName = `${this.selectedVehicle.id}/maint_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const { error: uploadError } = await supabase.storage.from('vehicle_documents').upload(fileName, file);
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('vehicle_documents').getPublicUrl(fileName);
                    uploadedPhotos.push({ url: publicUrl });
                }
            }

            // 2. Registrar en Logística y Mecánica
            const partsCost = this.tempRecipeItems.reduce((sum, i) => sum + (i.qty * i.cost), 0);
            const { error: logErr } = await supabase.from('vehicle_logs').insert([{
                vehicle_id: this.selectedVehicle.id,
                date: new Date().toISOString().split('T')[0],
                odometer: currentKm,
                service_name: serviceName,
                parts_used: this.tempRecipeItems.map(i => `${i.qty} - ${i.name}`).join(', '),
                total_cost: partsCost + laborCost,
                parts_cost: partsCost,
                labor_cost: laborCost,
                mechanic: 'Taller Interno',
                notes: document.getElementById('shop-notes').value,
                wait_time: waitTime,
                photos: uploadedPhotos
            }]);

            if (logErr) throw logErr;

            // 3. Descontar Inventario
            for (let item of this.tempRecipeItems) {
                await supabase.from('inventory_items').update({ stock: item.stock - item.qty }).eq('id', item.id);
            }

            // 4. Actualizar Vehículo (Status, KM y Salud)
            await supabase.from('vehicles').update({ 
                status: 'active', 
                current_km: currentKm,
                components: this.selectedVehicle.components 
            }).eq('id', this.selectedVehicle.id);

            alert('✅ Trabajo registrado y unidad liberada.');
            window.location.reload();

        } catch (e) {
            alert('Error: ' + e.message);
            btn.disabled = false;
        }
    }

    // --- RENDERIZADO TABLAS ---
    renderDashboard() {
        const tbody = document.getElementById('maintenance-list');
        if(!this.logs.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10">Sin datos.</td></tr>'; return; }
        tbody.innerHTML = this.logs.slice(0,10).map(log => `
            <tr><td class="px-6 py-4">${log.date}</td><td class="px-6 py-4">ECO-${log.vehicles?.economic_number}</td><td class="px-6 py-4">${log.service_name}</td><td class="px-6 py-4 text-right font-bold text-green-400">$${log.total_cost.toLocaleString()}</td></tr>
        `).join('');
    }

    renderDatabaseTable() {
        const tbody = document.getElementById('database-table');
        tbody.innerHTML = this.logs.map(l => `
            <tr class="hover:bg-[#1a212b] border-b border-[#324d67]/30">
                <td class="p-3 text-[10px] text-slate-500">${l.id.split('-')[0]}</td>
                <td class="p-3">${l.date}</td>
                <td class="p-3 font-bold text-white">ECO-${l.vehicles?.economic_number}</td>
                <td class="p-3">${l.service_name}</td>
                <td class="p-3 font-bold text-green-400">$${l.total_cost.toLocaleString()}</td>
            </tr>
        `).join('');
    }

    renderCompletedTab() {
        const container = document.getElementById('completed-list');
        if(!this.logs.length) { container.innerHTML = '<p class="col-span-full text-center py-20 text-slate-500">Nada aún.</p>'; return; }
        container.innerHTML = this.logs.map(log => `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div class="absolute top-0 right-0 bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase">Liberado</div>
                <div class="mb-4">
                    <h4 class="text-white font-black text-xl">ECO-${log.vehicles?.economic_number} <span class="text-slate-500 text-sm ml-2">${log.vehicles?.plate || ''}</span></h4>
                    <p class="text-primary text-sm font-bold">${log.service_name}</p>
                </div>
                <div class="grid grid-cols-2 gap-2 text-[11px] text-[#92adc9] mb-4">
                    <div class="bg-[#111a22] p-2 rounded">📅 ${log.date}</div>
                    <div class="bg-[#111a22] p-2 rounded">⏱️ Espera: ${log.wait_time || 'N/A'}</div>
                    <div class="bg-[#111a22] p-2 rounded col-span-2">📍 Km: ${log.odometer}</div>
                </div>
                ${log.photos && log.photos.length > 0 ? `
                    <div class="grid grid-cols-4 gap-2 mt-2">
                        ${log.photos.map(p => `<img src="${p.url}" class="w-full h-16 object-cover rounded border border-[#324d67] cursor-pointer" onclick="window.taller.viewPhoto('${p.url}')">`).join('')}
                    </div>
                ` : ''}
                <div class="mt-4 text-right">
                    <span class="text-xl font-black text-green-400 font-mono">$${log.total_cost.toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    // --- CALENDARIO ---
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const days = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const start = new Date(this.currentYear, this.currentMonth, 1).getDay();
        grid.innerHTML = '';
        for(let i=0; i<start; i++) grid.innerHTML += '<div></div>';
        for(let day=1; day<=days; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const items = this.schedules.filter(s => s.scheduled_date === dateStr);
            grid.innerHTML += `
                <div onclick="window.taller.openScheduleModal('${dateStr}')" class="bg-[#111a22] border border-[#324d67] p-2 rounded min-h-[60px] cursor-pointer hover:border-primary">
                    <span class="text-white text-[10px] font-bold">${day}</span>
                    <div class="space-y-1 mt-1">${items.map(it => `<div class="bg-primary/20 text-primary text-[8px] px-1 rounded truncate">ECO-${it.vehicles?.economic_number}</div>`).join('')}</div>
                </div>
            `;
        }
    }

    setupScanner() {
        if(document.getElementById('reader')) {
            this.html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 200 });
            this.html5QrcodeScanner.render((text) => {
                const v = this.vehicles.find(x => x.id === text.trim() || x.plate === text.trim());
                if(v) this.loadVehicleForService(v.id);
            });
        }
    }

    destroy() { if(this.html5QrcodeScanner) this.html5QrcodeScanner.clear(); }
}
