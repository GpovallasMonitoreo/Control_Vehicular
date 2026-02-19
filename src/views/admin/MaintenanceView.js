import { supabase } from '../../config/supabaseClient.js';

export class MaintenanceView {
    constructor() {
        this.logs = [];
        this.vehicles = [];
        this.services = [];
        this.inventory = [];
        this.tempRecipeItems = [];
        this.html5QrcodeScanner = null;
        window.taller = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-4xl">handyman</span>
                        Taller Central
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal">Recepción, diagnóstico, reparación y control de bitácoras.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.taller.openEmergencyAccess()" class="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-all shadow-lg active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">key</span>
                        <span>Acceso Único Guardia</span>
                    </button>
                    <button onclick="window.taller.switchTab('new-service')" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Ingresar Vehículo</span>
                    </button>
                </div>
            </div>

            <div class="flex border-b border-[#324d67] overflow-x-auto custom-scrollbar">
                <button onclick="window.taller.switchTab('dashboard')" id="tab-btn-dashboard" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap">Tablero Principal</button>
                <button onclick="window.taller.switchTab('new-service')" id="tab-btn-new-service" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap">Recepción y Servicio</button>
            </div>

            <div class="flex-1 relative">
                
                <div id="tab-content-dashboard" class="space-y-6 animate-fade-in block">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-[#324d67] shadow-sm relative overflow-hidden">
                            <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">speed</span></div>
                            <div class="flex justify-between items-start z-10">
                                <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Alertas Km</p>
                                <span class="material-symbols-outlined text-red-500">warning</span>
                            </div>
                            <p id="stat-km-alerts" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-red-400 text-[10px] font-bold uppercase z-10">Requieren servicio</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-[#324d67] shadow-sm relative overflow-hidden">
                            <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">car_crash</span></div>
                            <div class="flex justify-between items-start z-10">
                                <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Reportes Campo</p>
                                <span class="material-symbols-outlined text-orange-500">report</span>
                            </div>
                            <p id="stat-incidents" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-orange-400 text-[10px] font-bold uppercase z-10">Incidentes sin resolver</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-blue-500/30 shadow-sm relative overflow-hidden">
                            <div class="flex justify-between items-start text-blue-400 z-10">
                                <p class="text-xs font-bold uppercase tracking-wider">En Taller</p>
                                <span class="material-symbols-outlined">engineering</span>
                            </div>
                            <p id="stat-in-shop" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-blue-400 text-[10px] font-bold uppercase z-10">Unidades en reparación</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-green-500/30 shadow-sm relative overflow-hidden">
                            <div class="flex justify-between items-start text-green-500 z-10">
                                <p class="text-xs font-bold uppercase tracking-wider">Servicios Mes</p>
                                <span class="material-symbols-outlined">task_alt</span>
                            </div>
                            <p id="stat-completed" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-green-500 text-[10px] font-bold uppercase z-10">Completados con éxito</span>
                        </div>
                    </div>

                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden flex flex-col shadow-xl min-h-[400px]">
                        <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]">
                            <h4 class="text-lg font-bold text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">history</span> Bitácora General de Taller</h4>
                            <button id="btn-export-maintenance" class="text-[#92adc9] hover:text-white transition-colors"><span class="material-symbols-outlined">download</span></button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-0 custom-scrollbar">
                            <table class="w-full text-left text-sm border-collapse">
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase text-[10px] font-black sticky top-0 z-10 border-b border-[#324d67]">
                                    <tr>
                                        <th class="px-6 py-4">Fecha</th>
                                        <th class="px-6 py-4">Unidad</th>
                                        <th class="px-6 py-4">Servicio / Receta</th>
                                        <th class="px-6 py-4">Kilometraje</th>
                                        <th class="px-6 py-4 text-right">Inversión</th>
                                    </tr>
                                </thead>
                                <tbody id="maintenance-list" class="divide-y divide-[#324d67]/50 text-gray-300">
                                    <tr><td colspan="5" class="px-6 py-20 text-center text-[#92adc9]">Cargando bitácora...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div id="tab-content-new-service" class="hidden animate-fade-in space-y-6">
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg h-fit">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                <span class="material-symbols-outlined text-primary">qr_code_scanner</span> Identificar Unidad
                            </h3>
                            
                            <div id="reader" class="w-full bg-black rounded-lg overflow-hidden border border-[#324d67] aspect-square mb-4"></div>
                            
                            <div class="text-center text-xs text-[#92adc9] font-bold uppercase my-2">- O SELECCIÓN MANUAL -</div>
                            
                            <select id="shop-vehicle-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" onchange="window.taller.loadVehicleForService(this.value)">
                                <option value="">Selecciona unidad...</option>
                            </select>

                            <div id="selected-vehicle-card" class="mt-4 bg-[#111a22] border border-primary/30 p-4 rounded-lg hidden">
                                <p class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Unidad en Bahía</p>
                                <h4 id="sv-plate" class="text-2xl font-black text-white leading-none">--</h4>
                                <p id="sv-model" class="text-sm text-[#92adc9] mt-1">--</p>
                                <div class="mt-3 pt-3 border-t border-[#324d67] flex justify-between items-center">
                                    <span class="text-xs text-slate-400">Km Actual:</span>
                                    <span id="sv-km" class="text-white font-mono font-bold">--</span>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-6 opacity-50 pointer-events-none transition-opacity" id="shop-process-area">
                            
                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <div class="flex justify-between items-center mb-4 border-b border-[#324d67] pb-2">
                                    <h3 class="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <span class="material-symbols-outlined text-orange-500">fact_check</span> 1. Recepción Física
                                    </h3>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="space-y-3">
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Carrocería sin daños nuevos</span><input type="checkbox" id="chk-body" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Luces completas</span><input type="checkbox" id="chk-lights" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67]"><span class="text-white text-sm">Niveles de líquidos OK</span><input type="checkbox" id="chk-fluids" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        <div>
                                            <input type="number" id="shop-current-km" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-center" placeholder="Confirmar Kilometraje Entrada">
                                        </div>
                                    </div>
                                    <div class="flex flex-col justify-center items-center gap-2 bg-[#111a22] border border-[#324d67] rounded-lg p-4">
                                        <p class="text-xs text-[#92adc9] text-center mb-2">Tomar foto de evidencia (Opcional, solo en vivo)</p>
                                        <div class="relative w-full h-32">
                                            <input type="file" accept="image/*" capture="environment" id="shop-camera" class="hidden" onchange="window.taller.previewShopImage(this)">
                                            <label for="shop-camera" id="lbl-shop-img" class="flex flex-col items-center justify-center w-full h-full bg-[#1c2127] border-2 border-dashed border-[#324d67] rounded-lg text-slate-500 cursor-pointer hover:border-primary hover:text-primary transition-colors bg-cover bg-center">
                                                <span class="material-symbols-outlined text-3xl">photo_camera</span>
                                                <span class="text-[10px] uppercase font-bold mt-1">Abrir Cámara</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                    <span class="material-symbols-outlined text-green-500">build</span> 2. Aplicar Servicio (Recetas)
                                </h3>
                                
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Cargar Receta de Inventario</label>
                                        <div class="flex gap-2">
                                            <select id="shop-recipe-select" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm" onchange="window.taller.applyRecipe()">
                                                <option value="">Seleccionar receta...</option>
                                            </select>
                                            <button onclick="window.taller.clearRecipe()" class="bg-[#233648] hover:bg-red-900/40 text-slate-400 hover:text-red-400 px-4 rounded-lg transition-colors border border-[#324d67]">
                                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre del Trabajo</label>
                                            <input id="shop-service-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="Ej: Cambio de aceite">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Costo Mano Obra ($)</label>
                                            <input type="number" id="shop-labor-cost" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-right" value="0" oninput="window.taller.updateTotalCost()">
                                        </div>
                                    </div>

                                    <div class="border border-[#324d67] rounded-lg overflow-hidden bg-[#111a22]">
                                        <table class="w-full text-left text-xs text-white">
                                            <thead class="bg-[#233648] text-[#92adc9]"><tr><th class="p-2">Refacción a descontar</th><th class="p-2 text-center">Cant</th><th class="p-2 text-right">Subtotal</th></tr></thead>
                                            <tbody id="shop-parts-list" class="divide-y divide-[#324d67]">
                                                <tr><td colspan="3" class="text-center p-4 text-slate-500 font-mono text-[10px]">Sin insumos cargados.</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Observaciones / Diagnóstico</label>
                                        <textarea id="shop-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-20 text-sm" placeholder="Detalles técnicos del trabajo..."></textarea>
                                    </div>

                                    <div class="flex justify-between items-center bg-[#151b23] p-4 rounded-xl border border-[#324d67]">
                                        <span class="text-sm font-bold text-[#92adc9] uppercase tracking-widest">Inversión Total:</span>
                                        <span id="shop-total-cost" class="text-2xl font-black text-green-400 font-mono">$0.00</span>
                                    </div>

                                    <button id="btn-save-shop" onclick="window.taller.saveShopService()" class="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                                        <span class="material-symbols-outlined">save</span> Registrar Trabajo y Descontar Inventario
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            <div id="modal-emergency-qr" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-sm rounded-2xl shadow-2xl animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23] rounded-t-2xl">
                        <h3 class="text-lg font-black text-white flex items-center gap-2"><span class="material-symbols-outlined text-orange-500">key</span> Generar Pase Único</h3>
                        <button onclick="document.getElementById('modal-emergency-qr').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="p-6 space-y-4 text-center">
                        <p class="text-xs text-[#92adc9] mb-4">Selecciona el vehículo que entrará/saldrá. Se generará un código QR temporal para que el conductor se lo muestre al vigilante.</p>
                        
                        <div class="text-left">
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Unidad Autorizada</label>
                            <select id="emer-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-orange-500"></select>
                        </div>
                        
                        <div class="bg-white p-4 rounded-xl inline-block mx-auto hidden mt-4 border border-slate-200" id="emer-qr-container">
                            <img id="emer-qr-img" src="" alt="QR" class="w-40 h-40">
                            <p class="text-[10px] font-bold text-slate-800 mt-2 uppercase tracking-widest">VÁLIDO POR 1 HORA</p>
                        </div>

                        <button onclick="window.taller.generateEmergencyQR()" class="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider mt-4">
                            Generar Código QR
                        </button>
                    </div>
                </div>
            </div>

        </div>
        `;
    }

    async onMount() {
        await this.loadInitialData();
        this.setupScanner();
        
        document.getElementById('btn-export-maintenance').addEventListener('click', () => this.exportToCSV());
    }

    async loadInitialData() {
        // Cargar vehículos activos, inventario, recetas y logs de una vez
        const [vehRes, invRes, recRes, logRes] = await Promise.all([
            supabase.from('vehicles').select('id, economic_number, plate, model, current_km, status').eq('status', 'active'),
            supabase.from('inventory_items').select('*'),
            supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock))'),
            supabase.from('vehicle_logs').select('*, vehicles(economic_number, plate)').order('date', {ascending: false}).limit(50)
        ]);

        this.vehicles = vehRes.data || [];
        this.inventory = invRes.data || [];
        this.services = recRes.data || [];
        this.logs = logRes.data || [];

        // Llenar selects
        const vehOptions = '<option value="">Selecciona unidad...</option>' + this.vehicles.map(v => `<option value="${v.id}">${v.plate} (ECO-${v.economic_number})</option>`).join('');
        document.getElementById('shop-vehicle-select').innerHTML = vehOptions;
        document.getElementById('emer-vehicle').innerHTML = vehOptions;

        const recOptions = '<option value="">Seleccionar receta...</option>' + this.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        document.getElementById('shop-recipe-select').innerHTML = recOptions;

        this.renderDashboard();
    }

    // --- TABS Y NAVEGACIÓN ---
    switchTab(tab) {
        document.getElementById('tab-content-dashboard').classList.replace('block', 'hidden');
        document.getElementById('tab-content-new-service').classList.replace('block', 'hidden');
        
        document.getElementById('tab-btn-dashboard').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap";
        document.getElementById('tab-btn-new-service').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap";

        document.getElementById(`tab-content-${tab}`).classList.replace('hidden', 'block');
        document.getElementById(`tab-btn-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap";

        if(tab === 'new-service' && !this.html5QrcodeScanner) {
            // Inicializar escáner si no se ha hecho
            this.setupScanner();
        }
    }

    // --- TABLERO (DASHBOARD TALLER) ---
    renderDashboard() {
        // Indicadores (Mock simplificado, en prod se calcula de tabla incidentes y km)
        document.getElementById('stat-in-shop').innerText = this.vehicles.filter(v => v.status === 'maintenance').length;
        document.getElementById('stat-completed').innerText = this.logs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length;
        
        // Render Tabla de Logs
        const tbody = document.getElementById('maintenance-list');
        if(!this.logs.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500">Sin registros recientes.</td></tr>';
            return;
        }

        tbody.innerHTML = this.logs.map(log => `
            <tr class="hover:bg-[#1a212b] transition-all border-b border-[#324d67]/50 last:border-0">
                <td class="px-6 py-4 font-mono text-xs text-[#92adc9]">${new Date(log.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 font-bold text-white uppercase"><span class="bg-[#111a22] border border-[#324d67] px-2 py-1 rounded text-[10px] text-primary mr-1">ECO-${log.vehicles?.economic_number}</span> ${log.vehicles?.plate}</td>
                <td class="px-6 py-4 text-xs font-bold text-slate-300">${log.service_name}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${Number(log.odometer).toLocaleString()} km</td>
                <td class="px-6 py-4 text-right font-mono font-bold text-green-400">$${Number(log.total_cost).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    // --- ESCÁNER Y RECEPCIÓN ---
    setupScanner() {
        if(document.getElementById('reader')) {
            this.html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1 });
            this.html5QrcodeScanner.render((text) => this.onScanSuccess(text), (error) => {});
        }
    }

    onScanSuccess(decodedText) {
        // Formato esperado de Gafete: {"v_id":"UUID", "plate":"ABC"}
        try {
            const data = JSON.parse(decodedText);
            if(data.v_id) {
                document.getElementById('shop-vehicle-select').value = data.v_id;
                this.loadVehicleForService(data.v_id);
                // Pausar escáner para que no se vuelva loco
                this.html5QrcodeScanner.pause();
                setTimeout(() => this.html5QrcodeScanner.resume(), 5000);
            }
        } catch(e) {
            console.warn("QR no reconocido");
        }
    }

    loadVehicleForService(id) {
        const v = this.vehicles.find(x => x.id === id);
        const area = document.getElementById('shop-process-area');
        const card = document.getElementById('selected-vehicle-card');
        
        if(!v) {
            area.classList.add('opacity-50', 'pointer-events-none');
            card.classList.add('hidden');
            return;
        }

        document.getElementById('sv-plate').innerText = v.plate;
        document.getElementById('sv-model').innerText = v.model;
        document.getElementById('sv-km').innerText = v.current_km;
        document.getElementById('shop-current-km').value = v.current_km;
        
        card.classList.remove('hidden');
        area.classList.remove('opacity-50', 'pointer-events-none');
        
        // Limpiar formulario anterior
        this.clearRecipe();
        document.getElementById('chk-body').checked = false;
        document.getElementById('chk-lights').checked = false;
        document.getElementById('chk-fluids').checked = false;
        document.getElementById('shop-notes').value = '';
        
        // Quitar foto
        const lbl = document.getElementById('lbl-shop-img');
        lbl.style.backgroundImage = 'none';
        lbl.innerHTML = '<span class="material-symbols-outlined text-3xl">photo_camera</span><span class="text-[10px] uppercase font-bold mt-1">Abrir Cámara</span>';
    }

    previewShopImage(input) {
        if(input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const lbl = document.getElementById('lbl-shop-img');
                lbl.style.backgroundImage = `url('${e.target.result}')`;
                lbl.innerHTML = '';
                lbl.classList.add('border-primary');
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    // --- MANEJO DE RECETAS EN TALLER ---
    applyRecipe() {
        const recipeId = document.getElementById('shop-recipe-select').value;
        if(!recipeId) return this.clearRecipe();

        const template = this.services.find(s => s.id === recipeId);
        if(!template) return;

        document.getElementById('shop-service-name').value = template.name;
        document.getElementById('shop-labor-cost').value = template.labor_cost || 0;

        this.tempRecipeItems = [];
        if(template.service_template_items) {
            template.service_template_items.forEach(si => {
                this.tempRecipeItems.push({
                    id: si.inventory_items.id,
                    name: si.inventory_items.name,
                    qty: si.quantity,
                    cost: si.inventory_items.cost
                });
            });
        }
        this.renderRecipeList();
    }

    clearRecipe() {
        document.getElementById('shop-recipe-select').value = '';
        document.getElementById('shop-service-name').value = '';
        document.getElementById('shop-labor-cost').value = 0;
        this.tempRecipeItems = [];
        this.renderRecipeList();
    }

    renderRecipeList() {
        const tbody = document.getElementById('shop-parts-list');
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        let partsTotal = 0;

        if(!this.tempRecipeItems.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4 text-slate-500 font-mono text-[10px]">Sin insumos cargados.</td></tr>';
        } else {
            tbody.innerHTML = this.tempRecipeItems.map(i => {
                const sub = i.qty * i.cost;
                partsTotal += sub;
                return `
                    <tr class="hover:bg-[#192633]">
                        <td class="p-2 font-bold text-xs truncate max-w-[120px]">${i.name}</td>
                        <td class="p-2 text-center font-mono text-primary">${i.qty}</td>
                        <td class="p-2 text-right font-mono text-green-400">$${sub.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        }

        document.getElementById('shop-total-cost').innerText = `$${(partsTotal + laborCost).toLocaleString(undefined, {minimumFractionDigits:2})}`;
    }

    updateTotalCost() {
        this.renderRecipeList(); // Re-calcula al cambiar la mano de obra
    }

    // --- GUARDAR SERVICIO Y DESCONTAR INVENTARIO ---
    async saveShopService() {
        const vId = document.getElementById('shop-vehicle-select').value;
        const km = parseInt(document.getElementById('shop-current-km').value);
        const name = document.getElementById('shop-service-name').value;
        const labor = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        
        if(!vId || !km || !name) return alert("Selecciona vehículo, ingresa kilometraje y nombre del servicio.");

        // Calcular costo
        const partsCost = this.tempRecipeItems.reduce((acc, i) => acc + (i.qty * i.cost), 0);
        const totalCost = partsCost + labor;

        // Construir notas
        const chk = [
            document.getElementById('chk-body').checked ? 'Carrocería OK' : 'Daños en carrocería',
            document.getElementById('chk-lights').checked ? 'Luces OK' : 'Faltan luces',
            document.getElementById('chk-fluids').checked ? 'Fluidos OK' : 'Niveles bajos'
        ].join(', ');
        
        const userNotes = document.getElementById('shop-notes').value;
        const finalNotes = `Checklist: ${chk} | Notas: ${userNotes}`;

        const btn = document.getElementById('btn-save-shop');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Procesando...';

        try {
            // 1. Guardar Bitácora
            const logData = {
                vehicle_id: vId,
                date: new Date().toISOString().split('T')[0],
                odometer: km,
                service_name: name,
                parts_used: this.tempRecipeItems.length ? this.tempRecipeItems.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Ninguna',
                total_cost: totalCost,
                labor_cost: labor,
                parts_cost: partsCost,
                mechanic: 'Taller Central',
                notes: finalNotes
            };

            const { error: logErr } = await supabase.from('vehicle_logs').insert([logData]);
            if(logErr) throw logErr;

            // 2. Descontar Inventario
            for (let item of this.tempRecipeItems) {
                const current = this.inventory.find(inv => inv.id === item.id);
                if(current) {
                    await supabase.from('inventory_items').update({ stock: current.stock - item.qty }).eq('id', item.id);
                }
            }

            // 3. Actualizar Kilometraje del Vehículo
            await supabase.from('vehicles').update({ current_km: km }).eq('id', vId);

            alert("✅ Servicio registrado exitosamente. Inventario descontado.");
            await this.loadInitialData(); // Recargar todo
            this.switchTab('dashboard'); // Volver al inicio

        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Registrar Trabajo y Descontar Inventario';
        }
    }

    // --- ACCESO DE EMERGENCIA ---
    openEmergencyAccess() {
        document.getElementById('modal-emergency-qr').classList.remove('hidden');
        document.getElementById('emer-qr-container').classList.add('hidden');
    }

    generateEmergencyQR() {
        const vId = document.getElementById('emer-vehicle').value;
        if(!vId) return alert("Seleccione un vehículo primero.");
        
        const veh = this.vehicles.find(v => v.id === vId);
        
        // QR Data especial para el guardia
        const qrData = {
            v_id: vId,
            eco: veh.economic_number,
            plate: veh.plate,
            type: "emergency_pass",
            expires: Date.now() + (60 * 60 * 1000) // Válido por 1 hora
        };

        const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrData))}&color=ea580c`;
        
        document.getElementById('emer-qr-img').src = url;
        document.getElementById('emer-qr-container').classList.remove('hidden');
    }

    // --- EXPORTAR ---
    exportToCSV() {
        if (!this.logs || this.logs.length === 0) return alert("No hay datos para exportar");

        const headers = ["Fecha", "ECO", "Placas", "Servicio", "Kilometraje", "Costo Refacciones", "Costo Mano Obra", "Total"];
        const rows = this.logs.map(log => [
            log.date,
            log.vehicles?.economic_number || 'N/A',
            log.vehicles?.plate || 'N/A',
            log.service_name,
            log.odometer,
            log.parts_cost || 0,
            log.labor_cost || 0,
            log.total_cost || 0
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bitacora_Taller_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
