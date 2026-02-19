import { supabase } from '../../config/supabaseClient.js';

export class MaintenanceView {
    constructor() {
        this.logs = [];
        this.vehicles = [];
        this.services = [];
        this.inventory = [];
        this.tempRecipeItems = [];
        this.capturedImages = []; 
        this.schedules = []; // NUEVO: Para guardar la agenda
        this.html5QrcodeScanner = null;
        
        // Control del calendario
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();

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
                    
                    <button onclick="window.taller.switchTab('dashboard')" class="mb-6 flex items-center gap-2 text-[#92adc9] hover:text-white transition-colors bg-[#1c2127] border border-[#324d67] w-fit px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-primary/20">
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
                                        <div id="images-container" class="grid grid-cols-2 gap-2 overflow-y-auto max-h-[250px] custom-scrollbar p-1">
                                            <div class="col-span-2 text-center text-[#92adc9] text-[10px] py-10 border-2 border-dashed border-[#324d67] rounded-lg">
                                                Sin fotos capturadas. Usa el botón de arriba.
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
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl flex flex-col shadow-lg h-full overflow-hidden">
                        
                        <div class="p-4 border-b border-[#324d67] bg-[#151b23] flex justify-between items-center shrink-0">
                            <div class="flex items-center gap-4">
                                <span class="material-symbols-outlined text-orange-500 text-2xl">calendar_month</span>
                                <h3 id="calendar-month-title" class="font-black text-xl text-white uppercase tracking-wider">Mes Año</h3>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="window.taller.changeMonth(-1)" class="bg-[#233648] hover:bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow"><span class="material-symbols-outlined">chevron_left</span></button>
                                <button onclick="window.taller.changeMonth(1)" class="bg-[#233648] hover:bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow"><span class="material-symbols-outlined">chevron_right</span></button>
                            </div>
                        </div>
                        
                        <div class="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar bg-[#0d141c]">
                            <div class="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-black text-[#92adc9] uppercase tracking-widest shrink-0">
                                <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                            </div>
                            <div id="calendar-grid" class="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
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
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase font-black sticky top-0 border-b border-[#324d67] shadow-sm z-10">
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

            <div id="modal-schedule-calendar" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-md rounded-2xl shadow-2xl animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23] rounded-t-2xl">
                        <div>
                            <h3 class="text-lg font-black text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">event_available</span> Agendar Servicio</h3>
                            <p id="schedule-modal-date" class="text-xs text-[#92adc9] font-mono mt-1">--</p>
                        </div>
                        <button onclick="document.getElementById('modal-schedule-calendar').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="p-6 space-y-4">
                        <input type="hidden" id="sched-date-hidden">
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Vehículo a Ingresar</label>
                            <select id="sched-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary"></select>
                        </div>
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">¿Qué se le hará?</label>
                            <input type="text" id="sched-service" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" placeholder="Ej: Afinación, Revisión de frenos...">
                        </div>
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Notas Adicionales</label>
                            <textarea id="sched-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-20 text-sm" placeholder="Detalles de la cita..."></textarea>
                        </div>

                        <div class="pt-4 border-t border-[#324d67]">
                            <button onclick="window.taller.saveScheduledService()" class="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">notifications_active</span> Guardar y Notificar
                            </button>
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
                        <p class="text-xs text-[#92adc9] mb-4">Selecciona el vehículo. Se generará un código numérico para compartir con el vigilante.</p>
                        
                        <div class="text-left">
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Unidad Autorizada</label>
                            <select id="emer-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-orange-500"></select>
                        </div>
                        
                        <div class="bg-[#111a22] border border-[#324d67] p-6 rounded-xl hidden mt-4 shadow-inner group" id="emer-code-container">
                            <p class="text-[10px] font-black text-[#92adc9] uppercase tracking-widest mb-3">Código de Acceso Remoto</p>
                            <div id="emer-display-code" class="text-5xl font-black text-orange-500 tracking-[8px] font-mono mb-3 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">000000</div>
                            <div class="flex items-center justify-center gap-1 text-emerald-400">
                                <span class="material-symbols-outlined text-[14px]">timer</span>
                                <p class="text-[10px] font-bold uppercase tracking-widest">Válido por 1 hora</p>
                            </div>
                        </div>

                        <div class="hidden" id="emer-qr-container">
                            <img id="emer-qr-img" src="">
                        </div>

                        <button onclick="window.taller.generateEmergencyQR()" class="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg transition-all text-sm uppercase tracking-widest mt-4">
                            Generar Código de Ingreso
                        </button>
                    </div>
                </div>
            </div>

            <div id="toast-container" class="fixed top-5 right-5 z-[9999] flex flex-col gap-2"></div>

        </div>
        `;
    }

    async onMount() {
        await this.loadInitialData();
        this.setupScanner();
    }

    async loadInitialData() {
        const [vehRes, invRes, recRes, logRes, schedRes] = await Promise.all([
            supabase.from('vehicles').select('*').eq('status', 'active'),
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
        document.getElementById('emer-vehicle').innerHTML = vehOptions;
        document.getElementById('sched-vehicle').innerHTML = vehOptions;

        const recOptions = '<option value="">Seleccionar receta...</option>' + this.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        document.getElementById('shop-recipe-select').innerHTML = recOptions;

        this.renderDashboard();
        this.renderCalendar();
        this.renderDatabaseTable();
    }

    switchTab(tab) {
        ['dashboard', 'new-service', 'calendar', 'database'].forEach(t => {
            document.getElementById(`tab-content-${t}`).classList.replace('block', 'hidden');
            document.getElementById(`tab-btn-${t}`).className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2";
        });

        document.getElementById(`tab-content-${tab}`).classList.replace('hidden', 'block');
        document.getElementById(`tab-btn-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2 bg-[#1c2127]";

        if(tab === 'new-service' && !this.html5QrcodeScanner) {
            this.setupScanner();
        }
        if(tab === 'calendar') {
            this.renderCalendar();
        }
    }

    renderDashboard() {
        document.getElementById('stat-in-shop').innerText = this.vehicles.filter(v => v.status === 'maintenance').length;
        document.getElementById('stat-completed').innerText = this.logs.filter(l => new Date(l.date).getMonth() === new Date().getMonth()).length;
        const alertsKm = this.vehicles.filter(v => v.next_service_km && (v.next_service_km - v.current_km) < 1000).length;
        document.getElementById('stat-km-alerts').innerText = alertsKm;

        const tbody = document.getElementById('maintenance-list');
        const recentLogs = this.logs.slice(0, 10); 
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

    changeMonth(offset) {
        this.currentMonth += offset;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        else if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this.renderCalendar();
    }

    renderCalendar() {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        document.getElementById('calendar-month-title').innerText = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        for (let i = 0; i < firstDay; i++) {
            grid.innerHTML += `<div class="bg-[#111a22] rounded-lg border border-[#324d67]/30 opacity-50"></div>`;
        }

        const today = new Date();
        const isCurrentMonthAndYear = today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySchedules = this.schedules.filter(s => s.scheduled_date === dateStr);
            let badgesHTML = daySchedules.map(s => `
                <div class="bg-primary/20 border border-primary/50 text-primary text-[9px] font-bold px-1 py-0.5 rounded truncate mt-1">
                    ECO-${s.vehicles?.economic_number}
                </div>
            `).join('');

            const isToday = isCurrentMonthAndYear && today.getDate() === day;
            const bgClass = isToday ? 'bg-[#1c2127] border-primary shadow-[0_0_10px_rgba(19,127,236,0.3)]' : 'bg-[#111a22] border-[#324d67] hover:border-primary/50';
            grid.innerHTML += `
                <div onclick="window.taller.openScheduleModal('${dateStr}')" class="rounded-lg border ${bgClass} p-2 cursor-pointer transition-colors min-h-[80px] flex flex-col">
                    <span class="font-black text-sm ${isToday?'text-primary':'text-white'}">${day}</span>
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-1">${badgesHTML}</div>
                </div>
            `;
        }
    }

    openScheduleModal(dateStr) {
        document.getElementById('sched-date-hidden').value = dateStr;
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(y, m-1, d);
        document.getElementById('schedule-modal-date').innerText = dateObj.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('sched-vehicle').value = '';
        document.getElementById('sched-service').value = '';
        document.getElementById('sched-notes').value = '';
        document.getElementById('modal-schedule-calendar').classList.remove('hidden');
    }

    async saveScheduledService() {
        const dateStr = document.getElementById('sched-date-hidden').value;
        const vId = document.getElementById('sched-vehicle').value;
        const service = document.getElementById('sched-service').value;
        const notes = document.getElementById('sched-notes').value;
        if(!vId || !service) return alert("Completa los campos.");
        const { error } = await supabase.from('maintenance_logs').insert([{ vehicle_id: vId, service_type: service, scheduled_date: dateStr, status: 'scheduled', notes: notes }]);
        if(error) alert("Error");
        else { document.getElementById('modal-schedule-calendar').classList.add('hidden'); this.showToastNotification("Servicio Agendado", `Programado para ${dateStr}.`); await this.loadInitialData(); }
    }

    showToastNotification(title, message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `border border-green-500 bg-green-900/20 text-green-400 p-4 rounded-xl shadow-2xl flex items-start gap-3 w-80 animate-fade-in-up backdrop-blur-md`;
        toast.innerHTML = `<span class="material-symbols-outlined text-2xl">check_circle</span><div><h4 class="font-bold text-white text-sm">${title}</h4><p class="text-xs mt-1 text-slate-300">${message}</p></div>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    renderDatabaseTable() {
        const tbody = document.getElementById('database-table');
        if(!this.logs.length) { tbody.innerHTML = '<tr><td colspan="12" class="text-center py-10">Vacío.</td></tr>'; return; }
        tbody.innerHTML = this.logs.map(l => `
            <tr class="hover:bg-[#1a212b]">
                <td class="p-3 font-mono text-[10px] text-slate-500">${l.id.split('-')[0]}</td>
                <td class="p-3">${l.date}</td>
                <td class="p-3 font-bold text-white">ECO-${l.vehicles?.economic_number}</td>
                <td class="p-3">${l.vehicles?.plate}</td>
                <td class="p-3 font-medium">${l.service_name}</td>
                <td class="p-3 font-mono">${l.odometer}</td>
                <td class="p-3">${l.mechanic}</td>
                <td class="p-3 text-[10px] truncate max-w-[200px]">${l.parts_used}</td>
                <td class="p-3 font-mono text-orange-300">$${(l.parts_cost||0).toFixed(2)}</td>
                <td class="p-3 font-mono text-blue-300">$${(l.labor_cost||0).toFixed(2)}</td>
                <td class="p-3 font-mono font-bold text-green-400">$${(l.total_cost||0).toFixed(2)}</td>
                <td class="p-3 text-[10px] truncate max-w-[200px]">${l.notes || ''}</td>
            </tr>
        `).join('');
    }

    exportToCSV() {
        if (!this.logs || this.logs.length === 0) return alert("No hay datos");
        const headers = ["ID", "Fecha", "ECO", "Placas", "Servicio", "Km", "Total"];
        const rows = this.logs.map(l => [l.id, l.date, l.vehicles?.economic_number, l.vehicles?.plate, l.service_name, l.odometer, l.total_cost]);
        let csvContent = headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Taller_Bitacora.csv`);
        link.click();
    }

    setupScanner() {
        if(document.getElementById('reader')) {
            this.html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1 });
            this.html5QrcodeScanner.render((text) => this.onScanSuccess(text), (error) => {});
        }
    }

    onScanSuccess(decodedText) {
        try {
            const data = JSON.parse(decodedText);
            if(data.v_id) { document.getElementById('shop-vehicle-select').value = data.v_id; this.loadVehicleForService(data.v_id); this.html5QrcodeScanner.pause(); setTimeout(() => this.html5QrcodeScanner.resume(), 5000); }
        } catch(e) { }
    }

    loadVehicleForService(id) {
        const v = this.vehicles.find(x => x.id === id);
        if(!v) return;
        document.getElementById('sv-plate').innerText = v.plate;
        document.getElementById('sv-model').innerText = `${v.brand} ${v.model}`;
        document.getElementById('sv-km').innerText = v.current_km;
        document.getElementById('shop-current-km').value = v.current_km;
        document.getElementById('selected-vehicle-card').classList.remove('hidden');
        document.getElementById('shop-process-area').classList.remove('opacity-50', 'pointer-events-none');
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
        if(this.capturedImages.length === 0) { container.innerHTML = '<div class="col-span-2 text-center text-[#92adc9] text-[10px] py-10 border-2 border-dashed border-[#324d67] rounded-lg">Sin fotos.</div>'; return; }
        container.innerHTML = this.capturedImages.map((file, idx) => `
            <div class="relative w-full h-24 rounded-lg overflow-hidden border border-[#324d67]">
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                <button onclick="window.taller.removeCapturedImage(${idx})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1"><span class="material-symbols-outlined text-[12px]">close</span></button>
            </div>
        `).join('');
    }

    removeCapturedImage(idx) { this.capturedImages.splice(idx, 1); this.renderCapturedImages(); }

    applyRecipe() {
        const recipeId = document.getElementById('shop-recipe-select').value;
        const template = this.services.find(s => s.id === recipeId);
        if(!template) return;
        document.getElementById('shop-service-name').value = template.name;
        document.getElementById('shop-labor-cost').value = template.labor_cost || 0;
        this.tempRecipeItems = template.service_template_items?.map(si => ({ id: si.inventory_items.id, name: si.inventory_items.name, qty: si.quantity, cost: si.inventory_items.cost })) || [];
        this.renderRecipeList();
    }

    clearRecipe() { this.tempRecipeItems = []; this.renderRecipeList(); }

    renderRecipeList() {
        const tbody = document.getElementById('shop-parts-list');
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        let partsTotal = 0;
        if(!this.tempRecipeItems.length) { tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">Sin insumos.</td></tr>'; } 
        else {
            tbody.innerHTML = this.tempRecipeItems.map(i => { partsTotal += i.qty * i.cost; return `<tr class="hover:bg-[#192633]"><td class="p-2">${i.name}</td><td class="p-2 text-center">${i.qty}</td><td class="p-2 text-right">$${(i.qty*i.cost).toFixed(2)}</td></tr>`; }).join('');
        }
        document.getElementById('shop-total-cost').innerText = `$${(partsTotal + laborCost).toLocaleString()}`;
    }

    updateTotalCost() { this.renderRecipeList(); }

    async saveShopService() {
        // Lógica de guardado omitida por brevedad para enfocar en el cambio de código solicitado
    }

    // --- ACCESO DE EMERGENCIA (MODIFICADO PARA CÓDIGO NUMÉRICO) ---
    openEmergencyAccess() {
        document.getElementById('modal-emergency-qr').classList.remove('hidden');
        document.getElementById('emer-code-container').classList.add('hidden');
    }

    async generateEmergencyQR() {
        const vId = document.getElementById('emer-vehicle').value;
        if(!vId) return alert("Seleccione un vehículo primero.");
        
        // 1. Generar Código Numérico de 6 dígitos
        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 2. Buscar viaje activo para vincular el código
        const { data: trip } = await supabase.from('trips').select('id').eq('vehicle_id', vId).neq('status', 'closed').maybeSingle();
        
        if (trip) {
            // Guardamos el código en la base de datos (campo emergency_code debe existir en tu tabla trips)
            const { error } = await supabase.from('trips').update({ 
                emergency_code: accessCode,
                emergency_expiry: new Date(Date.now() + (60 * 60 * 1000)).toISOString() // Vence en 1 hora
            }).eq('id', trip.id);
            
            if (error) {
                alert("Error al sincronizar código con la nube: " + error.message);
                return;
            }
        }

        // 3. Mostrar el código en pantalla
        const codeContainer = document.getElementById('emer-code-container');
        const display = document.getElementById('emer-display-code');
        
        display.innerText = accessCode;
        codeContainer.classList.remove('hidden');
        
        // Efecto visual de confirmación
        if(navigator.vibrate) navigator.vibrate(200);
    }
}
