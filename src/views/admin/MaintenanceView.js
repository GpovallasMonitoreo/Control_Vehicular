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
                        <span>Pase Guardia</span>
                    </button>
                    <button onclick="window.taller.switchTab('new-service')" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Ingresar Vehículo</span>
                    </button>
                </div>
            </div>

            <div class="flex border-b border-[#324d67] overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="window.taller.switchTab('dashboard')" id="tab-btn-dashboard" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">dashboard</span> Tablero Principal</button>
                <button onclick="window.taller.switchTab('new-service')" id="tab-btn-new-service" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">car_repair</span> Recepción y Reparación</button>
                <button onclick="window.taller.switchTab('calendar')" id="tab-btn-calendar" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">calendar_month</span> Agenda y Citas</button>
                <button onclick="window.taller.switchTab('database')" id="tab-btn-database" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">table_view</span> Base de Datos de Bitácoras</button>
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
                            <span class="text-red-400 text-[10px] font-bold uppercase z-10">Requieren servicio preventivo</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-[#324d67] shadow-sm relative overflow-hidden">
                            <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">car_crash</span></div>
                            <div class="flex justify-between items-start z-10">
                                <p class="text-[#92adc9] text-xs font-bold uppercase tracking-wider">Incidentes</p>
                                <span class="material-symbols-outlined text-orange-500">report</span>
                            </div>
                            <p id="stat-incidents" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-orange-400 text-[10px] font-bold uppercase z-10">Reportes de campo sin resolver</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-blue-500/30 shadow-sm relative overflow-hidden">
                            <div class="flex justify-between items-start text-blue-400 z-10">
                                <p class="text-xs font-bold uppercase tracking-wider">En Taller</p>
                                <span class="material-symbols-outlined">engineering</span>
                            </div>
                            <p id="stat-in-shop" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-blue-400 text-[10px] font-bold uppercase z-10">Unidades en reparación activa</span>
                        </div>

                        <div class="flex flex-col gap-2 rounded-xl p-5 bg-[#1c2127] border border-green-500/30 shadow-sm relative overflow-hidden">
                            <div class="flex justify-between items-start text-green-500 z-10">
                                <p class="text-xs font-bold uppercase tracking-wider">Completados</p>
                                <span class="material-symbols-outlined">task_alt</span>
                            </div>
                            <p id="stat-completed" class="text-white text-3xl font-black z-10">0</p>
                            <span class="text-green-500 text-[10px] font-bold uppercase z-10">Reparaciones de este mes</span>
                        </div>
                    </div>

                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden flex flex-col shadow-xl min-h-[400px]">
                        <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23]">
                            <h4 class="text-lg font-bold text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">history</span> Últimas Reparaciones y Servicios</h4>
                            <button onclick="window.taller.switchTab('database')" class="text-xs font-bold text-primary hover:text-white transition-colors">Ver bitácora completa →</button>
                        </div>
                        <div class="flex-1 overflow-x-auto p-0 custom-scrollbar">
                            <table class="w-full text-left text-sm border-collapse whitespace-nowrap">
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase text-[10px] font-black sticky top-0 border-b border-[#324d67]">
                                    <tr>
                                        <th class="px-6 py-4">Fecha</th>
                                        <th class="px-6 py-4">Unidad</th>
                                        <th class="px-6 py-4">Mecánico</th>
                                        <th class="px-6 py-4">Trabajo Realizado</th>
                                        <th class="px-6 py-4">Kilometraje</th>
                                        <th class="px-6 py-4 text-right">Inversión</th>
                                    </tr>
                                </thead>
                                <tbody id="maintenance-list" class="divide-y divide-[#324d67]/50 text-gray-300">
                                    <tr><td colspan="6" class="px-6 py-20 text-center text-[#92adc9]">Cargando bitácora...</td></tr>
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
                            
                            <div id="reader" class="w-full bg-black rounded-lg overflow-hidden border border-[#324d67] aspect-square mb-4 flex items-center justify-center text-slate-500">
                                Cámara Inicializando...
                            </div>
                            
                            <div class="text-center text-xs text-[#92adc9] font-bold uppercase my-3">- O SELECCIÓN MANUAL -</div>
                            
                            <select id="shop-vehicle-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" onchange="window.taller.loadVehicleForService(this.value)">
                                <option value="">Selecciona unidad...</option>
                            </select>

                            <div id="selected-vehicle-card" class="mt-4 bg-[#111a22] border border-primary/30 p-4 rounded-xl hidden relative overflow-hidden">
                                <div class="absolute -right-4 -top-4 opacity-5"><span class="material-symbols-outlined text-[100px]">directions_car</span></div>
                                <p class="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 relative z-10">Vehículo en Bahía</p>
                                <h4 id="sv-plate" class="text-2xl font-black text-white leading-none relative z-10">--</h4>
                                <p id="sv-model" class="text-xs text-[#92adc9] mt-1 relative z-10">--</p>
                                <div class="mt-4 pt-4 border-t border-[#324d67] flex justify-between items-center relative z-10">
                                    <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Kilometraje Histórico:</span>
                                    <span id="sv-km" class="text-white font-mono font-bold text-sm bg-[#1c2127] px-2 py-1 rounded">--</span>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-6 opacity-50 pointer-events-none transition-opacity" id="shop-process-area">
                            
                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <div class="flex justify-between items-center mb-4 border-b border-[#324d67] pb-2">
                                    <h3 class="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                                        <span class="material-symbols-outlined text-orange-500">fact_check</span> 1. Recepción y Diagnóstico Visual
                                    </h3>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Confirmar Odómetro (KM de Entrada)</label>
                                            <input type="number" id="shop-current-km" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-xl text-center">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre del Mecánico Asignado</label>
                                            <input type="text" id="shop-mechanic-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" placeholder="Ej. Roberto Sánchez">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Tiempo Estimado de Reparación</label>
                                            <select id="shop-est-time" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary">
                                                <option value="1-3 horas">Reparación Rápida (1 - 3 hrs)</option>
                                                <option value="Mismo día">Reparación Media (Mismo día)</option>
                                                <option value="1-2 días">Reparación Mayor (1 - 2 días)</option>
                                                <option value="Más de 3 días">Reparación Compleja (+3 días)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="flex flex-col h-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 shadow-inner">
                                        <div class="flex justify-between items-center mb-3">
                                            <p class="text-xs text-[#92adc9] font-bold uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">photo_camera</span> Evidencia de Daños/Servicio</p>
                                            <div class="relative">
                                                <input type="file" accept="image/*" capture="environment" id="shop-camera" class="hidden" onchange="window.taller.captureImage(this)">
                                                <label for="shop-camera" class="bg-primary hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors shadow">
                                                    <span class="material-symbols-outlined text-[16px]">add</span> Añadir
                                                </label>
                                            </div>
                                        </div>
                                        <div id="images-container" class="flex-1 grid grid-cols-2 gap-2 overflow-y-auto max-h-[180px] custom-scrollbar content-start">
                                            <div class="col-span-2 text-center text-slate-500 flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#324d67] rounded-lg">
                                                <span class="material-symbols-outlined text-3xl mb-1 opacity-50">imagesmode</span>
                                                <span class="text-[10px] font-bold uppercase tracking-widest">Sube fotos de la pieza o daño</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                                <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                    <span class="material-symbols-outlined text-green-500">build</span> 2. Cargar Insumos y Reparación (Receta)
                                </h3>
                                
                                <div class="space-y-4">
                                    <div class="bg-blue-900/10 border border-blue-500/30 p-3 rounded-lg text-xs text-blue-400 mb-4">
                                        Las recetas extraen automáticamente las piezas del inventario. Si no usas receta, el sistema solo registrará el concepto de la reparación y la mano de obra.
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Cargar Plantilla / Receta</label>
                                        <div class="flex gap-2">
                                            <select id="shop-recipe-select" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm font-bold" onchange="window.taller.applyRecipe()">
                                                <option value="">Servicio Libre (Sin receta)</option>
                                            </select>
                                            <button onclick="window.taller.clearRecipe()" class="bg-[#233648] hover:bg-red-900/40 text-slate-400 hover:text-red-400 px-4 rounded-lg transition-colors border border-[#324d67]" title="Limpiar lista de insumos">
                                                <span class="material-symbols-outlined text-sm">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Título del Servicio Realizado</label>
                                            <input id="shop-service-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary text-sm font-bold" placeholder="Ej: Afinación Mayor y Cambio de Balatas">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Costo de Mano de Obra ($ MXN)</label>
                                            <input type="number" id="shop-labor-cost" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-right text-lg" value="0" oninput="window.taller.updateTotalCost()">
                                        </div>
                                    </div>

                                    <div class="border border-[#324d67] rounded-lg overflow-hidden bg-[#111a22]">
                                        <table class="w-full text-left text-xs text-white">
                                            <thead class="bg-[#233648] text-[#92adc9] uppercase text-[9px] font-black tracking-widest">
                                                <tr>
                                                    <th class="p-3">Refacciones Automáticas a Descontar del Inventario</th>
                                                    <th class="p-3 text-center">Cant.</th>
                                                    <th class="p-3 text-right">Costo Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody id="shop-parts-list" class="divide-y divide-[#324d67]">
                                                <tr><td colspan="3" class="text-center p-6 text-slate-500 font-mono text-[10px]">Sin insumos cargados. Se requiere una receta.</td></tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Diagnóstico Final y Observaciones (Para el expediente)</label>
                                        <textarea id="shop-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-24 text-sm custom-scrollbar" placeholder="Ej. Queda pendiente revisión de amortiguadores en 10,000 km. Las balatas fueron purgadas..."></textarea>
                                    </div>

                                    <div class="flex justify-between items-center bg-gradient-to-r from-[#111a22] to-[#151b23] p-5 rounded-xl border border-green-500/30">
                                        <span class="text-sm font-bold text-[#92adc9] uppercase tracking-widest">Inversión Total de Reparación:</span>
                                        <span id="shop-total-cost" class="text-3xl font-black text-green-400 font-mono drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">$0.00</span>
                                    </div>

                                    <button id="btn-save-shop" onclick="window.taller.saveShopService()" class="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-xl font-black shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all flex items-center justify-center gap-2 text-base uppercase tracking-widest mt-4">
                                        <span class="material-symbols-outlined text-xl">done_all</span> Guardar, Descontar Insumos y Liberar Unidad
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
                            <h3 class="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2"><span class="material-symbols-outlined text-green-500">table_view</span> Base de Datos Maestro de Bitácoras</h3>
                            <button onclick="window.taller.exportToCSV()" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-lg">
                                <span class="material-symbols-outlined text-[16px]">download</span> Exportar Historial a Excel
                            </button>
                        </div>
                        <div class="flex-1 overflow-auto custom-scrollbar bg-[#0d141c]">
                            <table class="w-full text-left text-xs whitespace-nowrap">
                                <thead class="bg-[#111a22] text-[#92adc9] uppercase font-black sticky top-0 border-b border-[#324d67] shadow-sm z-10 text-[10px] tracking-widest">
                                    <tr>
                                        <th class="p-3">Folio ID</th>
                                        <th class="p-3">Fecha</th>
                                        <th class="p-3">ECO</th>
                                        <th class="p-3">Placas</th>
                                        <th class="p-3">Tipo de Trabajo</th>
                                        <th class="p-3">Kilometraje</th>
                                        <th class="p-3">Mecánico/Taller</th>
                                        <th class="p-3">Piezas Descontadas</th>
                                        <th class="p-3 text-right">Insumos ($)</th>
                                        <th class="p-3 text-right">M. Obra ($)</th>
                                        <th class="p-3 text-right text-green-400">Total Facturado</th>
                                        <th class="p-3">Diagnóstico</th>
                                    </tr>
                                </thead>
                                <tbody id="database-table" class="divide-y divide-[#324d67] text-slate-300">
                                    <tr><td colspan="12" class="text-center py-10">Cargando base de datos...</td></tr>
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
                            <h3 class="text-lg font-black text-white flex items-center gap-2"><span class="material-symbols-outlined text-primary">event_available</span> Agendar Cita en Taller</h3>
                            <p id="schedule-modal-date" class="text-xs text-[#92adc9] font-mono mt-1">--</p>
                        </div>
                        <button onclick="document.getElementById('modal-schedule-calendar').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="p-6 space-y-4">
                        <input type="hidden" id="sched-date-hidden">
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Vehículo Esperado</label>
                            <select id="sched-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary"></select>
                        </div>
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Motivo de la Cita</label>
                            <input type="text" id="sched-service" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" placeholder="Ej: Afinación programada, Revisión de frenos...">
                        </div>
                        
                        <div>
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Notas Adicionales</label>
                            <textarea id="sched-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-20 text-sm" placeholder="Traer el repuesto de balatas..."></textarea>
                        </div>

                        <div class="pt-4 border-t border-[#324d67]">
                            <button onclick="window.taller.saveScheduledService()" class="w-full py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined">notifications_active</span> Guardar en Agenda
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-emergency-qr" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] border border-[#324d67] w-full max-w-sm rounded-2xl shadow-2xl animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#151b23] rounded-t-2xl">
                        <h3 class="text-lg font-black text-white flex items-center gap-2"><span class="material-symbols-outlined text-orange-500">key</span> Pase Único de Guardia</h3>
                        <button onclick="document.getElementById('modal-emergency-qr').classList.add('hidden')" class="text-slate-400 hover:text-white"><span class="material-symbols-outlined">close</span></button>
                    </div>
                    <div class="p-6 space-y-4 text-center">
                        <p class="text-xs text-[#92adc9] mb-4">Selecciona el vehículo. Se generará un código numérico para compartir con el vigilante de turno.</p>
                        
                        <div class="text-left">
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Unidad Autorizada a Salir</label>
                            <select id="emer-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-orange-500"></select>
                        </div>
                        
                        <div class="bg-[#111a22] border border-[#324d67] p-6 rounded-xl hidden mt-4 shadow-inner group" id="emer-code-container">
                            <p class="text-[10px] font-black text-[#92adc9] uppercase tracking-widest mb-3">Código de Acceso de Caseta</p>
                            <div id="emer-display-code" class="text-5xl font-black text-orange-500 tracking-[8px] font-mono mb-3 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">000000</div>
                            <div class="flex items-center justify-center gap-1 text-emerald-400">
                                <span class="material-symbols-outlined text-[14px]">timer</span>
                                <p class="text-[10px] font-bold uppercase tracking-widest">Válido por 1 hora</p>
                            </div>
                        </div>

                        <button onclick="window.taller.generateEmergencyQR()" class="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl shadow-lg transition-all text-sm uppercase tracking-widest mt-4">
                            Generar Código Seguro
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
    }

    async loadInitialData() {
        const [vehRes, invRes, recRes, logRes, schedRes] = await Promise.all([
            // Cargamos todos para el historial
            supabase.from('vehicles').select('*').order('economic_number'),
            supabase.from('inventory_items').select('*'),
            supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, unit, stock))').then(r=>r.error?{data:[]}:r),
            supabase.from('vehicle_logs').select('*, vehicles(economic_number, plate)').order('date', {ascending: false}).then(r=>r.error?{data:[]}:r),
            supabase.from('maintenance_logs').select('*, vehicles(economic_number, plate)').eq('status', 'scheduled').then(r=>r.error?{data:[]}:r)
        ]);

        this.vehicles = vehRes.data || [];
        this.inventory = invRes.data || [];
        this.services = recRes.data || [];
        this.logs = logRes.data || [];
        this.schedules = schedRes.data || [];

        // Filtramos solo los que no están inactivos para los combos
        const activeVehicles = this.vehicles.filter(v => v.status !== 'inactive');
        const vehOptions = '<option value="">Selecciona unidad...</option>' + activeVehicles.map(v => `<option value="${v.id}">${v.plate} (ECO-${v.economic_number})</option>`).join('');
        
        document.getElementById('shop-vehicle-select').innerHTML = vehOptions;
        document.getElementById('emer-vehicle').innerHTML = vehOptions;
        document.getElementById('sched-vehicle').innerHTML = vehOptions;

        const recOptions = '<option value="">Servicio Libre (Sin receta)</option>' + this.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
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

        if(tab === 'new-service') {
            if(!this.html5QrcodeScanner) {
                // Pequeño timeout para asegurar que el div exista en el DOM visible
                setTimeout(() => this.setupScanner(), 300);
            }
        } else {
            if (this.html5QrcodeScanner) {
                this.html5QrcodeScanner.clear().catch(e=>console.warn(e));
                this.html5QrcodeScanner = null;
            }
        }
        
        if(tab === 'calendar') {
            this.renderCalendar();
        }
    }

    renderDashboard() {
        document.getElementById('stat-in-shop').innerText = this.vehicles.filter(v => v.status === 'maintenance').length;
        
        const currentMonth = new Date().getMonth();
        document.getElementById('stat-completed').innerText = this.logs.filter(l => new Date(l.date).getMonth() === currentMonth).length;
        
        const alertsKm = this.vehicles.filter(v => v.next_service_km && (v.next_service_km - v.current_km) < 1000).length;
        document.getElementById('stat-km-alerts').innerText = alertsKm;

        const tbody = document.getElementById('maintenance-list');
        const recentLogs = this.logs.slice(0, 15); 
        
        if(!recentLogs.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-20 text-slate-500"><span class="material-symbols-outlined text-4xl mb-2 opacity-30">history</span><br>Aún no hay reparaciones registradas en la bitácora del taller.</td></tr>';
            return;
        }

        tbody.innerHTML = recentLogs.map(log => `
            <tr class="hover:bg-[#1a212b] transition-all border-b border-[#324d67]/50 last:border-0">
                <td class="px-6 py-4 font-mono text-[11px] text-[#92adc9]">${new Date(log.date).toLocaleDateString('es-MX', {day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}</td>
                <td class="px-6 py-4 font-bold text-white uppercase"><span class="bg-[#111a22] border border-[#324d67] px-2 py-1 rounded text-[10px] text-primary mr-1">ECO-${log.vehicles?.economic_number}</span> ${log.vehicles?.plate}</td>
                <td class="px-6 py-4 text-xs text-slate-400 truncate max-w-[150px]">${log.mechanic || 'Taller Interno'}</td>
                <td class="px-6 py-4 text-xs font-bold text-slate-200 truncate max-w-[250px]">${log.service_name}</td>
                <td class="px-6 py-4 font-mono text-[11px] text-slate-400">${Number(log.odometer).toLocaleString()} km</td>
                <td class="px-6 py-4 text-right font-mono font-bold text-green-400 tracking-wider">$${Number(log.total_cost).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
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
                <div class="bg-primary/20 border border-primary/50 text-primary text-[9px] font-bold px-1.5 py-1 rounded truncate mt-1 shadow-sm">
                    ECO-${s.vehicles?.economic_number} - ${s.service_type}
                </div>
            `).join('');

            const isToday = isCurrentMonthAndYear && today.getDate() === day;
            const bgClass = isToday ? 'bg-[#1c2127] border-primary shadow-[0_0_15px_rgba(19,127,236,0.3)]' : 'bg-[#111a22] border-[#324d67] hover:border-primary/50';
            
            grid.innerHTML += `
                <div onclick="window.taller.openScheduleModal('${dateStr}')" class="rounded-lg border ${bgClass} p-2 cursor-pointer transition-colors min-h-[100px] flex flex-col group">
                    <span class="font-black text-sm ${isToday?'text-primary':'text-white'} group-hover:text-primary transition-colors">${day}</span>
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-1 space-y-1">${badgesHTML}</div>
                </div>
            `;
        }
    }

    openScheduleModal(dateStr) {
        document.getElementById('sched-date-hidden').value = dateStr;
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(y, m-1, d);
        document.getElementById('schedule-modal-date').innerText = dateObj.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
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
        
        if(!vId || !service) return alert("Completa los campos obligatorios para agendar.");
        
        try {
            const { error } = await supabase.from('maintenance_logs').insert([{ 
                vehicle_id: vId, 
                service_type: service, 
                scheduled_date: dateStr, 
                status: 'scheduled', 
                notes: notes 
            }]);
            
            if(error) throw error;
            
            document.getElementById('modal-schedule-calendar').classList.add('hidden'); 
            this.showToastNotification("Servicio Agendado en Calendario", `La cita quedó programada para el día ${dateStr}.`); 
            await this.loadInitialData(); 
            
        } catch(e) {
            console.warn("Falla de tabla maintenance_logs, ignorando error para no frenar funcionalidad", e);
            this.showToastNotification("Error", "La tabla de agendamiento aún no existe. Pero el módulo está listo.", "error");
        }
    }

    showToastNotification(title, message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
        const bgColor = type === 'success' ? 'bg-green-900/40' : 'bg-red-900/40';
        const textColor = type === 'success' ? 'text-green-400' : 'text-red-400';
        const icon = type === 'success' ? 'check_circle' : 'error';
        
        toast.className = `border ${borderColor} ${bgColor} ${textColor} p-4 rounded-xl shadow-2xl flex items-start gap-3 w-80 animate-fade-in-up backdrop-blur-md relative overflow-hidden`;
        toast.innerHTML = `
            <div class="absolute left-0 top-0 bottom-0 w-1 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}"></div>
            <span class="material-symbols-outlined text-2xl">${icon}</span>
            <div>
                <h4 class="font-bold text-white text-sm tracking-wide">${title}</h4>
                <p class="text-xs mt-1 text-slate-300 leading-snug">${message}</p>
            </div>
        `;
        
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
    }

    renderDatabaseTable() {
        const tbody = document.getElementById('database-table');
        if(!this.logs.length) { tbody.innerHTML = '<tr><td colspan="12" class="text-center py-20 text-slate-500 font-bold">Base de datos vacía. No hay bitácoras generadas.</td></tr>'; return; }
        
        tbody.innerHTML = this.logs.map(l => `
            <tr class="hover:bg-[#233648] transition-colors border-b border-[#324d67]/30">
                <td class="p-3 font-mono text-[10px] text-slate-500">${l.id.substring(0,8)}</td>
                <td class="p-3 text-[11px]">${l.date}</td>
                <td class="p-3 font-black text-primary">ECO-${l.vehicles?.economic_number}</td>
                <td class="p-3 font-mono text-[10px] bg-[#111a22] rounded border border-[#324d67]">${l.vehicles?.plate}</td>
                <td class="p-3 font-bold text-white truncate max-w-[200px]" title="${l.service_name}">${l.service_name}</td>
                <td class="p-3 font-mono text-[11px]">${Number(l.odometer).toLocaleString()} km</td>
                <td class="p-3 text-xs">${l.mechanic || 'Taller'}</td>
                <td class="p-3 text-[10px] text-slate-400 truncate max-w-[200px]" title="${l.parts_used}">${l.parts_used}</td>
                <td class="p-3 text-right font-mono text-orange-300">$${(l.parts_cost||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="p-3 text-right font-mono text-blue-300">$${(l.labor_cost||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="p-3 text-right font-mono font-black text-green-400 bg-green-900/10">$${(l.total_cost||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                <td class="p-3 text-[10px] text-slate-500 truncate max-w-[150px]" title="${l.notes || ''}">${l.notes || '--'}</td>
            </tr>
        `).join('');
    }

    exportToCSV() {
        if (!this.logs || this.logs.length === 0) return alert("No hay datos para exportar.");
        
        const headers = ["ID Transaccion", "Fecha Servicio", "Num. Economico", "Placas", "Tipo de Trabajo", "Kilometraje", "Responsable/Taller", "Piezas Descontadas", "Costo Insumos", "Costo Mano Obra", "Inversion Total", "Observaciones"];
        const rows = this.logs.map(l => [
            l.id, 
            l.date, 
            l.vehicles?.economic_number, 
            l.vehicles?.plate, 
            `"${l.service_name}"`, 
            l.odometer, 
            `"${l.mechanic || ''}"`,
            `"${(l.parts_used || '').replace(/\n/g, ' ')}"`, // Evita saltos de línea que rompan el CSV
            l.parts_cost || 0,
            l.labor_cost || 0,
            l.total_cost || 0,
            `"${(l.notes || '').replace(/\n/g, ' ')}"`
        ]);
        
        let csvContent = headers.join(",") + "\n";
        rows.forEach(r => csvContent += r.join(",") + "\n");
        
        // El BOM (\uFEFF) ayuda a que Excel lea correctamente los acentos y las ñ
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Bitacora_Taller_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    setupScanner() {
        if(document.getElementById('reader') && typeof window.Html5QrcodeScanner !== 'undefined') {
            this.html5QrcodeScanner = new window.Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250}, aspectRatio: 1 });
            this.html5QrcodeScanner.render((text) => this.onScanSuccess(text), (error) => {});
        } else {
            console.warn("Librería de scanner no cargada o contenedor no encontrado.");
        }
    }

    onScanSuccess(decodedText) {
        try {
            // El QR físico en la tarjeta del vehículo solo es el UUID directo
            if (decodedText && decodedText.length > 20) { 
                document.getElementById('shop-vehicle-select').value = decodedText; 
                this.loadVehicleForService(decodedText); 
                
                // Efecto de éxito
                if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
                
                this.html5QrcodeScanner.pause(); 
                this.showToastNotification("QR Leído", "Unidad escaneada correctamente.");
                
                setTimeout(() => this.html5QrcodeScanner.resume(), 5000); 
            }
        } catch(e) { 
            console.warn("Dato escaneado inválido", decodedText);
        }
    }

    loadVehicleForService(id) {
        const v = this.vehicles.find(x => x.id === id);
        if(!v) return;
        
        document.getElementById('sv-plate').innerText = v.plate;
        document.getElementById('sv-model').innerText = `${v.brand} ${v.model} (${v.year})`;
        document.getElementById('sv-km').innerText = Number(v.current_km || 0).toLocaleString() + ' km';
        
        document.getElementById('shop-current-km').value = v.current_km || 0;
        
        document.getElementById('selected-vehicle-card').classList.remove('hidden');
        document.getElementById('shop-process-area').classList.remove('opacity-50', 'pointer-events-none');
        
        // Animación suave de desbloqueo
        document.getElementById('shop-process-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        
        if(this.capturedImages.length === 0) { 
            container.innerHTML = `
                <div class="col-span-2 text-center text-slate-500 flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#324d67] rounded-lg">
                    <span class="material-symbols-outlined text-3xl mb-1 opacity-50">imagesmode</span>
                    <span class="text-[10px] font-bold uppercase tracking-widest">Sube fotos de la pieza o daño</span>
                </div>`; 
            return; 
        }
        
        container.innerHTML = this.capturedImages.map((file, idx) => `
            <div class="relative w-full h-24 rounded-lg overflow-hidden border border-[#324d67] group">
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onclick="window.taller.removeCapturedImage(${idx})" class="bg-red-600 hover:bg-red-500 text-white rounded-full p-2 shadow-lg transform hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeCapturedImage(idx) { 
        this.capturedImages.splice(idx, 1); 
        this.renderCapturedImages(); 
    }

    applyRecipe() {
        const recipeId = document.getElementById('shop-recipe-select').value;
        
        if(!recipeId) {
            this.clearRecipe();
            return;
        }

        const template = this.services.find(s => s.id === recipeId);
        if(!template) return;
        
        document.getElementById('shop-service-name').value = template.name;
        document.getElementById('shop-labor-cost').value = template.labor_cost || 0;
        document.getElementById('shop-notes').value = template.description || '';
        
        this.tempRecipeItems = template.service_template_items?.map(si => ({ 
            id: si.inventory_items.id, 
            name: si.inventory_items.name, 
            qty: si.quantity, 
            cost: si.inventory_items.cost,
            stock: si.inventory_items.stock
        })) || [];
        
        this.renderRecipeList();
    }

    clearRecipe() { 
        this.tempRecipeItems = []; 
        document.getElementById('shop-service-name').value = '';
        document.getElementById('shop-labor-cost').value = '0';
        document.getElementById('shop-notes').value = '';
        this.renderRecipeList(); 
    }

    renderRecipeList() {
        const tbody = document.getElementById('shop-parts-list');
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        let partsTotal = 0;
        
        if(!this.tempRecipeItems.length) { 
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-6 text-slate-500 font-mono text-[10px]">Servicio libre configurado. Solo aplicará mano de obra.</td></tr>'; 
        } else {
            tbody.innerHTML = this.tempRecipeItems.map(i => { 
                const sub = i.qty * i.cost;
                partsTotal += sub; 
                const stockWarning = i.qty > i.stock ? `<span class="text-red-400 font-bold ml-2 text-[9px] uppercase animate-pulse">! Insuficiente (Stock: ${i.stock})</span>` : '';
                
                return `
                <tr class="hover:bg-[#233648] transition-colors">
                    <td class="p-3 font-bold text-white">${i.name} ${stockWarning}</td>
                    <td class="p-3 text-center text-primary font-mono bg-[#111a22] m-1 rounded border border-[#324d67]">x${i.qty}</td>
                    <td class="p-3 text-right font-mono text-green-400">$${sub.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>`; 
            }).join('');
        }
        
        const total = partsTotal + laborCost;
        document.getElementById('shop-total-cost').innerText = `$${total.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    }

    updateTotalCost() { this.renderRecipeList(); }

    async saveShopService() {
        const vehicleId = document.getElementById('shop-vehicle-select').value;
        const currentKm = parseInt(document.getElementById('shop-current-km').value);
        const mechanic = document.getElementById('shop-mechanic-name').value;
        const serviceName = document.getElementById('shop-service-name').value;
        const laborCost = parseFloat(document.getElementById('shop-labor-cost').value) || 0;
        const notes = document.getElementById('shop-notes').value;
        const btn = document.getElementById('btn-save-shop');

        if (!vehicleId || isNaN(currentKm) || !serviceName) {
            return alert("Faltan datos obligatorios: Selecciona unidad, ingresa el kilometraje de entrada y nombra el servicio.");
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Procesando Reparación...';

        try {
            // 1. SUBIDA DE IMÁGENES A BUCKET (maintenance_photos)
            let photoUrls = [];
            if (this.capturedImages.length > 0) {
                for (let i=0; i<this.capturedImages.length; i++) {
                    const file = this.capturedImages[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${vehicleId}/${Date.now()}_${i}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage.from('maintenance_photos').upload(fileName, file);
                    if (uploadError) {
                        console.error("Error subiendo foto", uploadError);
                        continue; 
                    }
                    
                    const { data: { publicUrl } } = supabase.storage.from('maintenance_photos').getPublicUrl(fileName);
                    photoUrls.push(publicUrl);
                }
            }

            // 2. CONSOLIDAR COSTOS E INSUMOS
            let partsCost = 0;
            let partsTextList = "Ninguna";
            
            if (this.tempRecipeItems.length > 0) {
                partsTextList = this.tempRecipeItems.map(i => `${i.qty}pz - ${i.name} ($${i.cost.toFixed(2)} c/u)`).join('\n');
                partsCost = this.tempRecipeItems.reduce((acc, i) => acc + (i.qty * i.cost), 0);
            }
            
            const totalCost = partsCost + laborCost;
            
            // Añadir las URLs de fotos a las notas finales
            let finalNotes = notes;
            if (photoUrls.length > 0) {
                finalNotes += `\n\n(Evidencias fotográficas guardadas en sistema: ${photoUrls.length} archivos)`;
            }

            const logData = {
                vehicle_id: vehicleId,
                date: new Date().toISOString().split('T')[0],
                odometer: currentKm,
                service_name: serviceName,
                parts_used: partsTextList,
                total_cost: totalCost,
                labor_cost: laborCost,
                parts_cost: partsCost,
                mechanic: mechanic || 'Taller Interno',
                notes: finalNotes
            };

            // 3. GUARDAR EN BITÁCORA HISTÓRICA
            const { error: logError } = await supabase.from('vehicle_logs').insert([logData]);
            if (logError) throw logError;

            // 4. DESCONTAR INSUMOS DEL INVENTARIO
            for(let item of this.tempRecipeItems) {
                const currentItem = this.inventory.find(i => i.id === item.id);
                if(currentItem) {
                    await supabase.from('inventory_items').update({ stock: currentItem.stock - item.qty }).eq('id', item.id);
                }
            }

            // 5. LIBERAR VEHÍCULO Y ACTUALIZAR KM (Cambiar estado de maintenance o in_use a active)
            const vehicleUpdate = { 
                current_km: currentKm,
                status: 'active' 
            };
            
            // Opcional: Proyectar siguiente servicio a 10,000km más
            if (serviceName.toLowerCase().includes('afinación') || serviceName.toLowerCase().includes('aceite')) {
                vehicleUpdate.next_service_km = currentKm + 10000;
            }

            await supabase.from('vehicles').update(vehicleUpdate).eq('id', vehicleId);
            
            // Si el vehículo tenía un "viaje" o reporte de incidente abierto que lo trajo al taller, cerrarlo
            const { data: openTrips } = await supabase.from('trips').select('id').eq('vehicle_id', vehicleId).eq('status', 'incident_report');
            if (openTrips && openTrips.length > 0) {
                for(let t of openTrips) {
                    await supabase.from('trips').update({ status: 'closed', incident_status: 'resolved', incident_resolved_at: new Date().toISOString() }).eq('id', t.id);
                }
            }

            this.showToastNotification("Servicio Terminado", "Bitácora guardada, inventario descontado y unidad liberada a base.", "success");
            
            // 6. LIMPIAR PANTALLA Y RECARGAR DATOS
            this.clearShopForm();
            await this.loadInitialData();
            
            // Volver al tablero automáticamente
            setTimeout(() => this.switchTab('dashboard'), 2000);

        } catch (error) {
            alert("Error crítico al procesar la reparación: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Registrar Trabajo y Finalizar';
        }
    }

    clearShopForm() {
        document.getElementById('shop-vehicle-select').value = '';
        document.getElementById('shop-recipe-select').value = '';
        document.getElementById('shop-mechanic-name').value = '';
        document.getElementById('shop-current-km').value = '';
        document.getElementById('shop-service-name').value = '';
        document.getElementById('shop-labor-cost').value = '0';
        document.getElementById('shop-notes').value = '';
        document.getElementById('selected-vehicle-card').classList.add('hidden');
        document.getElementById('shop-process-area').classList.add('opacity-50', 'pointer-events-none');
        
        // Limpiar checkboxes
        document.getElementById('chk-body').checked = false;
        document.getElementById('chk-lights').checked = false;
        document.getElementById('chk-fluids').checked = false;
        document.getElementById('tire-fl').checked = false;
        document.getElementById('tire-fr').checked = false;
        document.getElementById('tire-rl').checked = false;
        document.getElementById('tire-rr').checked = false;

        this.capturedImages = [];
        this.renderCapturedImages();
        this.clearRecipe();
    }

    openEmergencyAccess() {
        document.getElementById('modal-emergency-qr').classList.remove('hidden');
        document.getElementById('emer-code-container').classList.add('hidden');
    }

    async generateEmergencyQR() {
        const vId = document.getElementById('emer-vehicle').value;
        if(!vId) return alert("Seleccione un vehículo primero.");
        
        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Validamos la creación del permiso de acceso rápido sin necesidad de app de conductor
        const { error } = await supabase.from('trips').insert([{ 
            vehicle_id: vId,
            driver_id: (await supabase.auth.getSession()).data.session.user.id, // Lo solicita el admin de taller temporalmente
            status: 'driver_accepted', 
            destination: 'Salida de Emergencia / Rescate',
            motivo: 'Pase autorizado desde Taller',
            access_code: accessCode
        }]);
        
        if (error) {
            alert("Error al sincronizar código con el sistema de guardia: " + error.message);
            return;
        }

        const codeContainer = document.getElementById('emer-code-container');
        const display = document.getElementById('emer-display-code');
        
        display.innerText = accessCode;
        codeContainer.classList.remove('hidden');
        
        if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
}
