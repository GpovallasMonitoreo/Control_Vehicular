import { supabase } from '../../config/supabaseClient.js';

export class MaintenanceView {
    constructor() {
        this.logs = [];
        this.vehicles = [];
        this.services = [];
        this.inventory = [];
        this.tempRecipeItems = [];
        this.capturedImages = []; // NUEVO: Array para múltiples fotos
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

            <div class="flex border-b border-[#324d67] overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="window.taller.switchTab('dashboard')" id="tab-btn-dashboard" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">dashboard</span> Tablero Principal</button>
                <button onclick="window.taller.switchTab('new-service')" id="tab-btn-new-service" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">car_repair</span> Recepción y Servicio</button>
                <button onclick="window.taller.switchTab('calendar')" id="tab-btn-calendar" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">calendar_month</span> Agenda y Taller</button>
                <button onclick="window.taller.switchTab('database')" id="tab-btn-database" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">table_view</span> Base de Datos (Excel)</button>
            </div>

            <div class="flex-1 relative overflow-hidden flex flex-col">
                
                <div id="tab-content-dashboard" class="space-y-6 animate-fade-in block overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
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
                            <h4 class="text-lg font-bold text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">history</span> Últimos Servicios Realizados</h4>
                            <button onclick="window.taller.switchTab('database')" class="text-xs font-bold text-primary hover:text-white transition-colors">Ver todos →</button>
                        </div>
                        <div class="flex-1 overflow-x-auto p-0">
                            <table class="w-full text-left text-sm border-collapse whitespace-nowrap">
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase text-[10px] font-black sticky top-0 border-b border-[#324d67]">
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

                <div id="tab-content-new-service" class="hidden animate-fade-in h-full overflow-y-auto custom-scrollbar pb-6 pr-2">
                    
                    <button onclick="window.taller.switchTab('dashboard')" class="mb-6 flex items-center gap-2 text-[#92adc9] hover:text-white transition-colors bg-[#1c2127] border border-[#324d67] w-fit px-4 py-2 rounded-lg font-bold text-sm">
                        <span class="material-symbols-outlined text-[18px]">arrow_back</span> Regresar al Tablero
                    </button>

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
                                        <span class="material-symbols-outlined text-orange-500">fact_check</span> 1. Recepción y Checklist
                                    </h3>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="space-y-3">
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer hover:border-primary transition-colors"><span class="text-white text-sm">Carrocería sin daños nuevos</span><input type="checkbox" id="chk-body" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer hover:border-primary transition-colors"><span class="text-white text-sm">Luces completas</span><input type="checkbox" id="chk-lights" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        <label class="flex items-center justify-between p-3 bg-[#111a22] rounded-lg border border-[#324d67] cursor-pointer hover:border-primary transition-colors"><span class="text-white text-sm">Niveles de líquidos OK</span><input type="checkbox" id="chk-fluids" class="w-5 h-5 rounded bg-slate-800 text-primary accent-primary"></label>
                                        
                                        <div class="mt-4 pt-3 border-t border-[#324d67]">
                                            <h4 class="text-white text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-blue-400 text-[18px]">tire_repair</span> Cambio de Llantas</h4>
                                            <div class="grid grid-cols-2 gap-2">
                                                <label class="flex items-center gap-2 p-2 bg-[#111a22] rounded border border-[#324d67] text-xs text-white cursor-pointer"><input type="checkbox" id="tire-fl" class="accent-primary w-4 h-4"> Del. Izq</label>
                                                <label class="flex items-center gap-2 p-2 bg-[#111a22] rounded border border-[#324d67] text-xs text-white cursor-pointer"><input type="checkbox" id="tire-fr" class="accent-primary w-4 h-4"> Del. Der</label>
                                                <label class="flex items-center gap-2 p-2 bg-[#111a22] rounded border border-[#324d67] text-xs text-white cursor-pointer"><input type="checkbox" id="tire-rl" class="accent-primary w-4 h-4"> Tras. Izq</label>
                                                <label class="flex items-center gap-2 p-2 bg-[#111a22] rounded border border-[#324d67] text-xs text-white cursor-pointer"><input type="checkbox" id="tire-rr" class="accent-primary w-4 h-4"> Tras. Der</label>
                                            </div>
                                        </div>

                                        <div class="pt-2">
                                            <label class="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Confirmar Kilometraje Entrada</label>
                                            <input type="number" id="shop-current-km" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-center text-lg">
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2 bg-[#111a22] border border-[#324d67] rounded-lg p-4">
                                        <div class="flex justify-between items-center mb-2">
                                            <p class="text-xs text-[#92adc9] font-bold uppercase tracking-wider">Evidencia Fotográfica</p>
                                            <div class="relative">
                                                <input type="file" accept="image/*" capture="environment" id="shop-camera" class="hidden" onchange="window.taller.captureImage(this)">
                                                <label for="shop-camera" class="bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors">
                                                    <span class="material-symbols-outlined text-[16px]">add_a_photo</span> Capturar
                                                </label>
                                            </div>
                                        </div>
                                        <div id="images-container" class="grid grid-cols-2 gap-2 overflow-y-auto max-h-[200px] custom-scrollbar p-1">
                                            <div class="col-span-2 text-center text-[#92adc9] text-[10px] py-8 border-2 border-dashed border-[#324d67] rounded-lg">
                                                Sin fotos capturadas.
                                            </div>
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
                                            <button onclick="window.taller.clearRecipe()" class="bg-[#233648] hover:bg-red-900/40 text-slate-400 hover:text-red-400 px-4 rounded-lg transition-colors border border-[#324d67]" title="Limpiar todo">
                                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre del Trabajo</label>
                                            <input id="shop-service-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm" placeholder="Ej: Cambio de aceite y llantas">
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
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Observaciones / Diagnóstico Final</label>
                                        <textarea id="shop-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-20 text-sm custom-scrollbar" placeholder="Detalles técnicos del trabajo..."></textarea>
                                    </div>

                                    <div class="flex justify-between items-center bg-[#151b23] p-4 rounded-xl border border-[#324d67]">
                                        <span class="text-sm font-bold text-[#92adc9] uppercase tracking-widest">Inversión Total:</span>
                                        <span id="shop-total-cost" class="text-2xl font-black text-green-400 font-mono">$0.00</span>
                                    </div>

                                    <button id="btn-save-shop" onclick="window.taller.saveShopService()" class="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-xl font-bold shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                                        <span class="material-symbols-outlined">save</span> Registrar Trabajo y Finalizar
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div id="tab-content-calendar" class="hidden animate-fade-in h-full flex flex-col p-6 overflow-hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        
                        <div class="bg-[#1c2127] border border-[#324d67] rounded-xl flex flex-col shadow-lg overflow-hidden h-full">
                            <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex items-center gap-2">
                                <span class="material-symbols-outlined text-blue-500">engineering</span>
                                <h3 class="font-bold text-white uppercase tracking-wider text-sm">Vehículos en Taller</h3>
                            </div>
                            <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" id="calendar-in-shop">
                                <p class="text-center text-slate-500 py-10 text-sm">Cargando...</p>
                            </div>
                        </div>

                        <div class="bg-[#1c2127] border border-[#324d67] rounded-xl flex flex-col shadow-lg overflow-hidden h-full">
                            <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex items-center gap-2">
                                <span class="material-symbols-outlined text-orange-500">calendar_month</span>
                                <h3 class="font-bold text-white uppercase tracking-wider text-sm">Próximos a Mantenimiento</h3>
                            </div>
                            <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" id="calendar-upcoming">
                                <p class="text-center text-slate-500 py-10 text-sm">Cargando...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="tab-content-database" class="hidden animate-fade-in h-full flex flex-col p-6 overflow-hidden">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl flex flex-col shadow-lg overflow-hidden h-full">
                        <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center shrink-0">
                            <h3 class="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2"><span class="material-symbols-outlined text-green-500">table_view</span> Base de Datos de Bitácora</h3>
                            <button onclick="window.taller.exportToCSV()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg">
                                <span class="material-symbols-outlined text-[16px]">download</span> Exportar a Excel (CSV)
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto custom-scrollbar bg-[#0d141c]">
                            <table class="w-full text-left text-xs whitespace-nowrap">
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase font-black sticky top-0 border-b border-[#324d67] shadow-sm">
                                    <tr>
                                        <th class="p-3">ID Log</th>
                                        <th class="p-3">Fecha</th>
                                        <th class="p-3">ECO</th>
                                        <th class="p-3">Placas</th>
                                        <th class="p-3">Servicio Realizado</th>
                                        <th class="p-3">Km</th>
                                        <th class="p-3">Mecánico</th>
                                        <th class="p-3">Refacciones</th>
                                        <th class="p-3">Costo Ref.</th>
                                        <th class="p-3">Mano Obra</th>
                                        <th class="p-3">Inversión Total</th>
                                        <th class="p-3">Notas Generales</th>
                                    </tr>
                                </thead>
                                <tbody id="database-table" class="divide-y divide-[#324d67] text-slate-300">
                                    <tr><td colspan="12" class="text-center py-10">Cargando datos...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <div id="modal-emergency-qr" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-sm rounded-2xl shadow-2xl animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23] rounded-t-2xl">
                        <h3 class="text-lg font-black text-white flex items-center gap-2"><span class="material-symbols-outlined text-orange-500">key</span> Generar Pase Único</h3>
                        <button onclick="document.getElementById('modal-emergency-qr').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="p-6 space-y-4 text-center">
                        <p class="text-xs text-[#92adc9] mb-4">Selecciona el vehículo. Se generará un código QR temporal para que el conductor muestre al vigilante.</p>
                        
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
    }

    async loadInitialData() {
        const [vehRes, invRes, recRes, logRes] = await Promise.all([
            supabase.from('vehicles').select('*').eq('status', 'active'),
            supabase.from('inventory_items').select('*'),
            supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock))'),
            supabase.from('vehicle_logs').select('*, vehicles(economic_number, plate)').order('date', {ascending: false})
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
        this.renderCalendar();
        this.renderDatabaseTable();
    }

    // --- TABS Y NAVEGACIÓN ---
    switchTab(tab) {
        // Ocultar todos
        ['dashboard', 'new-service', 'calendar', 'database'].forEach(t => {
            document.getElementById(`tab-content-${t}`).classList.replace('block', 'hidden');
            document.getElementById(`tab-btn-${t}`).className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2";
        });

        // Mostrar seleccionado
        document.getElementById(`tab-content-${tab}`).classList.replace('hidden', 'block');
        document.getElementById(`tab-btn-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2 bg-[#1c2127]";

        if(tab === 'new-service' && !this.html5QrcodeScanner) {
            this.setupScanner();
        }
    }

    // --- RENDER VISTAS ---
    renderDashboard() {
        document.getElementById('stat-in-shop').innerText = this.vehicles.filter(v => v.status === 'maintenance').length;
        document.getElementById('stat-completed').innerText = this.logs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length;
        
        // Simulación Alertas de Km (Si está a menos de 500km de su next_service_km)
        const alertsKm = this.vehicles.filter(v => v.next_service_km && (v.next_service_km - v.current_km) < 1000).length;
        document.getElementById('stat-km-alerts').innerText = alertsKm;

        const tbody = document.getElementById('maintenance-list');
        const recentLogs = this.logs.slice(0, 10); // Solo los últimos 10
        if(!recentLogs.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-slate-500">Sin registros recientes.</td></tr>';
            return;
        }

        tbody.innerHTML = recentLogs.map(log => `
            <tr class="hover:bg-[#1a212b] transition-all border-b border-[#324d67]/50 last:border-0">
                <td class="px-6 py-4 font-mono text-xs text-[#92adc9]">${new Date(log.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 font-bold text-white uppercase"><span class="bg-[#111a22] border border-[#324d67] px-2 py-1 rounded text-[10px] text-primary mr-1">ECO-${log.vehicles?.economic_number}</span> ${log.vehicles?.plate}</td>
                <td class="px-6 py-4 text-xs font-bold text-slate-300 truncate max-w-[200px]">${log.service_name}</td>
                <td class="px-6 py-4 font-mono text-xs text-slate-400">${Number(log.odometer).toLocaleString()} km</td>
                <td class="px-6 py-4 text-right font-mono font-bold text-green-400">$${Number(log.total_cost).toLocaleString()}</td>
            </tr>
        `).join('');
    }

    renderCalendar() {
        const inShopContainer = document.getElementById('calendar-in-shop');
        const upcomingContainer = document.getElementById('calendar-upcoming');

        // Vehículos actualmente en mantenimiento
        const inShop = this.vehicles.filter(v => v.status === 'maintenance');
        if(inShop.length === 0) {
            inShopContainer.innerHTML = `<div class="text-center py-8 text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-30">check_circle</span><p class="text-xs">No hay vehículos en taller actualmente.</p></div>`;
        } else {
            inShopContainer.innerHTML = inShop.map(v => `
                <div class="bg-[#111a22] border border-blue-500/30 p-3 rounded-lg flex justify-between items-center border-l-4 border-l-blue-500">
                    <div>
                        <p class="text-white font-bold text-sm">ECO-${v.economic_number} • ${v.plate}</p>
                        <p class="text-xs text-[#92adc9] mt-0.5">${v.brand} ${v.model}</p>
                    </div>
                    <span class="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase">Reparando</span>
                </div>
            `).join('');
        }

        // Vehículos próximos a servicio por KM
        const upcoming = this.vehicles.filter(v => v.next_service_km && (v.next_service_km - v.current_km) < 1500).sort((a,b) => (a.next_service_km - a.current_km) - (b.next_service_km - b.current_km));
        
        if(upcoming.length === 0) {
            upcomingContainer.innerHTML = `<div class="text-center py-8 text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-30">thumb_up</span><p class="text-xs">Flota al día. No hay servicios próximos urgentes.</p></div>`;
        } else {
            upcomingContainer.innerHTML = upcoming.map(v => {
                const diff = v.next_service_km - v.current_km;
                const isUrgent = diff < 300;
                return `
                <div class="bg-[#111a22] border ${isUrgent ? 'border-red-500/30 border-l-4 border-l-red-500' : 'border-orange-500/30 border-l-4 border-l-orange-500'} p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <p class="text-white font-bold text-sm">ECO-${v.economic_number} • ${v.plate}</p>
                        <p class="text-xs text-[#92adc9] mt-0.5">Km actual: ${v.current_km}</p>
                    </div>
                    <div class="text-right">
                        <span class="${isUrgent ? 'text-red-400' : 'text-orange-400'} text-xs font-bold block">Faltan ${diff} km</span>
                        <span class="text-[9px] text-slate-500 uppercase">Límite: ${v.next_service_km}</span>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    renderDatabaseTable() {
        const tbody = document.getElementById('database-table');
        if(!this.logs.length) {
            tbody.innerHTML = '<tr><td colspan="12" class="text-center py-10 text-slate-500">Base de datos vacía.</td></tr>';
            return;
        }

        tbody.innerHTML = this.logs.map(l => `
            <tr class="hover:bg-[#1a212b]">
                <td class="p-3 font-mono text-[10px] text-slate-500">${l.id.split('-')[0]}</td>
                <td class="p-3 text-[#92adc9]">${l.date}</td>
                <td class="p-3 font-bold text-white">ECO-${l.vehicles?.economic_number}</td>
                <td class="p-3">${l.vehicles?.plate}</td>
                <td class="p-3 font-medium">${l.service_name}</td>
                <td class="p-3 font-mono">${l.odometer}</td>
                <td class="p-3">${l.mechanic}</td>
                <td class="p-3 text-[10px] whitespace-pre-wrap max-w-[200px] truncate" title="${l.parts_used}">${l.parts_used}</td>
                <td class="p-3 font-mono text-orange-300">$${(l.parts_cost||0).toFixed(2)}</td>
                <td class="p-3 font-mono text-blue-300">$${(l.labor_cost||0).toFixed(2)}</td>
                <td class="p-3 font-mono font-bold text-green-400">$${(l.total_cost||0).toFixed(2)}</td>
                <td class="p-3 text-[10px] truncate max-w-[200px]" title="${l.notes}">${l.notes || ''}</td>
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
        try {
            const data = JSON.parse(decodedText);
            if(data.v_id) {
                document.getElementById('shop-vehicle-select').value = data.v_id;
                this.loadVehicleForService(data.v_id);
                this.html5QrcodeScanner.pause();
                setTimeout(() => this.html5QrcodeScanner.resume(), 5000);
            }
        } catch(e) { console.warn("QR no reconocido"); }
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
        document.getElementById('sv-model').innerText = `${v.brand} ${v.model}`;
        document.getElementById('sv-km').innerText = v.current_km;
        document.getElementById('shop-current-km').value = v.current_km;
        
        card.classList.remove('hidden');
        area.classList.remove('opacity-50', 'pointer-events-none');
        
        // Limpiar formulario y fotos
        this.clearRecipe();
        document.getElementById('chk-body').checked = false;
        document.getElementById('chk-lights').checked = false;
        document.getElementById('chk-fluids').checked = false;
        document.getElementById('shop-notes').value = '';
        
        // Limpiar checks de llantas
        ['fl', 'fr', 'rl', 'rr'].forEach(pos => document.getElementById(`tire-${pos}`).checked = false);

        this.capturedImages = [];
        this.renderCapturedImages();
    }

    // --- MULTIPLES FOTOS ---
    captureImage(input) {
        if(input.files && input.files[0]) {
            this.capturedImages.push(input.files[0]);
            this.renderCapturedImages();
            input.value = ''; // Limpiar input para permitir capturar la misma si se borró
        }
    }

    renderCapturedImages() {
        const container = document.getElementById('images-container');
        if(this.capturedImages.length === 0) {
            container.innerHTML = '<div class="col-span-2 text-center text-[#92adc9] text-[10px] py-8 border-2 border-dashed border-[#324d67] rounded-lg">Sin fotos capturadas. Usa el botón de arriba.</div>';
            return;
        }

        container.innerHTML = this.capturedImages.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return `
                <div class="relative w-full h-24 rounded-lg overflow-hidden border border-[#324d67] group">
                    <img src="${url}" class="w-full h-full object-cover">
                    <button onclick="window.taller.removeCapturedImage(${idx})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        <span class="material-symbols-outlined text-[12px]">close</span>
                    </button>
                </div>
            `;
        }).join('');
    }

    removeCapturedImage(idx) {
        this.capturedImages.splice(idx, 1);
        this.renderCapturedImages();
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

    updateTotalCost() { this.renderRecipeList(); }

    // --- GUARDAR SERVICIO FINAL ---
    async saveShopService() {
        const vId = document.getElementById('shop-vehicle-select').value;
        const km = parseInt(document.getElementById('shop-current-km').value);
        const name = document.getElementById('shop-service-name').value;
        const labor = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        
        if(!vId || !km || !name) return alert("Selecciona vehículo, ingresa kilometraje de entrada y nombre del servicio.");

        const btn = document.getElementById('btn-save-shop');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">refresh</span> Procesando, por favor espera...';

        try {
            // 1. Subir Imágenes si hay
            const uploadedUrls = [];
            if(this.capturedImages.length > 0) {
                for (let file of this.capturedImages) {
                    const fileName = `${vId}_${Date.now()}_${file.name}`;
                    const { data: uploadData, error: uploadErr } = await supabase.storage.from('maintenance-evidence').upload(fileName, file);
                    if(!uploadErr && uploadData) uploadedUrls.push(uploadData.path);
                }
            }

            // 2. Construir Notas y Llantas
            const chk = [
                document.getElementById('chk-body').checked ? 'Carrocería OK' : 'Carrocería Revisada',
                document.getElementById('chk-lights').checked ? 'Luces OK' : 'Falla luces',
                document.getElementById('chk-fluids').checked ? 'Fluidos OK' : 'Fluidos bajos'
            ].join(', ');

            const tires = [];
            if(document.getElementById('tire-fl').checked) tires.push('Del-Izq');
            if(document.getElementById('tire-fr').checked) tires.push('Del-Der');
            if(document.getElementById('tire-rl').checked) tires.push('Tras-Izq');
            if(document.getElementById('tire-rr').checked) tires.push('Tras-Der');
            const tireString = tires.length ? `[CAMBIO LLANTAS: ${tires.join(', ')}]` : '';
            
            const userNotes = document.getElementById('shop-notes').value;
            const photosString = uploadedUrls.length ? `[${uploadedUrls.length} fotos adjuntas]` : '';
            
            const finalNotes = `${tireString} Checklist: ${chk} | Notas: ${userNotes} ${photosString}`;

            // 3. Costos
            const partsCost = this.tempRecipeItems.reduce((acc, i) => acc + (i.qty * i.cost), 0);
            const totalCost = partsCost + labor;

            // 4. Guardar Bitácora
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

            // 5. Descontar Inventario
            for (let item of this.tempRecipeItems) {
                const current = this.inventory.find(inv => inv.id === item.id);
                if(current) {
                    await supabase.from('inventory_items').update({ stock: current.stock - item.qty }).eq('id', item.id);
                }
            }

            // 6. Actualizar Kilometraje (y devolver estado a activo)
            await supabase.from('vehicles').update({ current_km: km, status: 'active' }).eq('id', vId);

            alert("✅ Servicio registrado. Historial e Inventario actualizados.");
            this.capturedImages = []; // Reset fotos
            await this.loadInitialData(); // Recargar todo
            this.switchTab('dashboard'); 

        } catch (e) {
            alert("Ocurrió un error guardando el servicio: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Registrar Trabajo y Finalizar';
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
        
        const qrData = {
            v_id: vId,
            eco: veh.economic_number,
            plate: veh.plate,
            type: "emergency_pass",
            expires: Date.now() + (60 * 60 * 1000)
        };

        const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify(qrData))}&color=ea580c`;
        document.getElementById('emer-qr-img').src = url;
        document.getElementById('emer-qr-container').classList.remove('hidden');
    }

    // --- EXPORTAR DB EXCEL ---
    exportToCSV() {
        if (!this.logs || this.logs.length === 0) return alert("No hay datos para exportar");

        const headers = ["ID", "Fecha", "ECO", "Placas", "Servicio", "Kilometraje", "Mecanico", "Refacciones", "Costo Refacciones", "Costo Mano Obra", "Total", "Notas"];
        const rows = this.logs.map(l => [
            l.id, l.date, l.vehicles?.economic_number, l.vehicles?.plate, l.service_name, l.odometer, l.mechanic,
            (l.parts_used || '').replace(/,/g, ' -').replace(/\n/g, ' '), // Clean commas for CSV
            l.parts_cost || 0, l.labor_cost || 0, l.total_cost || 0,
            (l.notes || '').replace(/,/g, ' -').replace(/\n/g, ' ')
        ]);

        let csvContent = headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BaseDatos_Mantenimiento_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
