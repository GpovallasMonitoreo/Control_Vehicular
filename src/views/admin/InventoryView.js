import { supabase } from '../../config/supabaseClient.js';

export class InventoryView {
    constructor() {
        this.vehicles = [];
        this.drivers = [];
        this.inspections = [];
        this.selectedVehicle = null;
        
        // Exponer al entorno global para los eventos onclick
        window.inventoryView = this;
    }

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
                    <button onclick="window.inventoryView.switchInvTab('vehicles')" id="tab-vehicles" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors">Vehículos</button>
                    <button onclick="window.inventoryView.switchInvTab('drivers')" id="tab-drivers" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Conductores & Licencias</button>
                    <button onclick="window.inventoryView.switchInvTab('inspections')" id="tab-inspections" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Inspecciones</button>
                </div>
            </div>

            <div id="view-vehicles" class="animate-fade-in space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-[#92adc9] text-sm">Haz clic en cualquier unidad para ver detalles o realizar inspección.</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="document.getElementById('modal-add-vehicle').classList.remove('hidden')" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                            <span class="material-symbols-outlined">add_circle</span> Nueva Unidad
                        </button>
                    </div>
                </div>
                
                <div id="grid-vehicles" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <p class="text-slate-500 col-span-full text-center py-10"><i class="fas fa-circle-notch fa-spin mr-2"></i> Cargando flota...</p>
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
                        <tbody id="table-drivers" class="divide-y divide-[#324d67]">
                            <tr><td colspan="4" class="p-8 text-center text-slate-500"><i class="fas fa-circle-notch fa-spin mr-2"></i> Cargando conductores...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="view-inspections" class="hidden animate-fade-in space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-white text-xl font-bold">Historial de Inspecciones</h2>
                        <p class="text-[#92adc9] text-sm">Registro de verificaciones de estado de vehículos</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="date" id="filter-date" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm" onchange="window.inventoryView.filterInspections()">
                        <select id="filter-vehicle" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm" onchange="window.inventoryView.filterInspections()">
                            <option value="">Todos los vehículos</option>
                        </select>
                    </div>
                </div>
                
                <div id="inspections-list" class="space-y-4">
                    <p class="text-slate-500 text-center py-10"><i class="fas fa-circle-notch fa-spin mr-2"></i> Cargando inspecciones...</p>
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
                                <h2 class="text-2xl font-black text-white leading-none" id="detail-title">Cargando...</h2>
                                <p class="text-xs text-[#92adc9] mt-1 font-mono" id="detail-plate">---</p>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="window.inventoryView.openInspectionModal(window.inventoryView.selectedVehicle?.id)" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                                <span class="material-symbols-outlined text-sm">checklist</span>
                                Realizar Inspección
                            </button>
                            <button onclick="document.getElementById('modal-detail').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#232a33] p-2 rounded-full hover:bg-red-500/20 hover:text-red-500">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
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
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold tracking-wider">Última Inspección</p>
                                <p id="detail-last-inspection" class="text-xl font-black text-primary mt-1">--</p>
                            </div>
                        </div>

                        <div class="lg:col-span-1 space-y-4">
                            <div class="aspect-[4/3] bg-black rounded-xl border border-[#324d67] overflow-hidden relative group">
                                <img id="detail-img" src="" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                                <div class="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                    <p class="text-white text-xs font-bold uppercase tracking-wider">Foto Actual</p>
                                </div>
                            </div>
                            
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67] space-y-3">
                                <h4 class="text-white font-bold text-sm border-b border-[#324d67] pb-2">Datos Técnicos</h4>
                                <div class="flex justify-between text-xs">
                                    <span class="text-[#92adc9]">Kilometraje:</span>
                                    <span id="detail-km" class="text-white font-bold font-mono">0 km</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-[#92adc9]">Nivel Gasolina:</span>
                                    <span id="detail-fuel" class="text-white font-bold">100%</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-[#92adc9]">Vigencia Seguro:</span>
                                    <span id="detail-insurance" class="text-white font-bold">--</span>
                                </div>
                                <div class="pt-2">
                                    <h4 class="text-white font-bold text-sm mb-2">Estado Actual</h4>
                                    <span id="detail-status" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-700 text-slate-300">--</span>
                                </div>
                            </div>
                        </div>

                        <div class="lg:col-span-2 space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-white font-bold text-sm uppercase tracking-wider">Historial Reciente</h3>
                                <div class="flex gap-2">
                                    <button onclick="window.inventoryView.showOnlyLogType('incidents')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Incidentes</button>
                                    <button onclick="window.inventoryView.showOnlyLogType('maintenance')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Mantenimiento</button>
                                    <button onclick="window.inventoryView.showOnlyLogType('inspections')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Inspecciones</button>
                                </div>
                            </div>
                            <div id="detail-logs" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <p class="text-slate-500 text-center py-8">Cargando historial...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-inspection" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-4xl rounded-2xl border border-[#324d67] shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                    <div class="p-6 border-b border-[#324d67] flex justify-between items-center bg-[#111a22]">
                        <div class="flex items-center gap-4">
                            <div class="bg-green-500/20 p-2 rounded-lg text-green-500">
                                <span class="material-symbols-outlined text-2xl">checklist</span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-black text-white leading-none">Inspección de Vehículo</h2>
                                <p id="inspection-vehicle-info" class="text-xs text-[#92adc9] mt-1 font-mono"></p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('modal-inspection').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#232a33] p-2 rounded-full hover:bg-red-500/20 hover:text-red-500">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="mb-6">
                            <h3 class="text-white font-bold text-lg mb-3">Cuestionario de Inspección</h3>
                            <p class="text-[#92adc9] text-sm">Complete el siguiente cuestionario para reportar el estado actual del vehículo</p>
                        </div>
                        
                        <form id="inspection-form" class="space-y-6">
                            <input type="hidden" id="insp-vehicle-id">
                            
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Información de la Inspección</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Inspector</label>
                                        <input id="insp-name" type="text" placeholder="Nombre del inspector" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Kilometraje Actual</label>
                                        <input id="insp-km" type="number" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Nivel de Combustible</label>
                                        <select id="insp-fuel" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                            <option value="">Seleccionar nivel</option>
                                            <option value="100">100% (Lleno)</option>
                                            <option value="75">75% (3/4)</option>
                                            <option value="50">50% (Medio)</option>
                                            <option value="25">25% (1/4)</option>
                                            <option value="0">Reserva / Vacío</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Condición General</label>
                                        <select id="insp-condition" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                            <option value="">Seleccionar condición</option>
                                            <option value="Excelente">Excelente</option>
                                            <option value="Buena">Buena</option>
                                            <option value="Regular">Regular</option>
                                            <option value="Mala">Mala</option>
                                            <option value="Crítica">Crítica</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Revisión Rápida (Sistemas)</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.renderInspectionQuestion("Motor y Niveles", "q_engine", "Aceite, anticongelante, ruidos")}
                                    ${this.renderInspectionQuestion("Frenos", "q_brakes", "Respuesta, ruidos")}
                                    ${this.renderInspectionQuestion("Llantas", "q_tires", "Presión, desgaste")}
                                    ${this.renderInspectionQuestion("Sistema Eléctrico", "q_electric", "Batería, luces altas/bajas, direccionales")}
                                    ${this.renderInspectionQuestion("Carrocería", "q_body", "Golpes, rayones, cristales")}
                                    ${this.renderInspectionQuestion("Interiores", "q_interior", "Asientos, tablero, limpieza")}
                                </div>
                            </div>

                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Observaciones y Aprobación</h4>
                                <div class="space-y-4">
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Problemas Detectados (Detalle)</label>
                                        <textarea id="insp-problems" rows="3" placeholder="Si hubo fallas, descríbalas aquí..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none"></textarea>
                                    </div>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">¿Vehículo Apto para Circular?</label>
                                            <select id="insp-approval" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                                <option value="">Seleccionar</option>
                                                <option value="approved">Sí, apto para circular</option>
                                                <option value="conditional">Sí, con observaciones mecánicas</option>
                                                <option value="not_approved">No, requiere taller urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Firma (Nombre)</label>
                                            <input id="insp-signature" type="text" placeholder="Nombre de quien autoriza" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-3 pt-6 border-t border-[#324d67]">
                                <button type="button" onclick="document.getElementById('modal-inspection').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors bg-[#232a33] rounded-lg">Cancelar</button>
                                <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined">save</span>
                                    Guardar Inspección
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div id="modal-add-vehicle" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-2xl rounded-2xl border border-[#324d67] p-6 shadow-2xl animate-fade-in-up">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">add_circle</span>
                        Alta de Unidad
                    </h3>
                    <form id="form-new-vehicle" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Económico *</label>
                                <input id="new-eco" required type="text" placeholder="Ej: ECO-205" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Placas *</label>
                                <input id="new-plate" required type="text" placeholder="Ej: NCL-558" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none uppercase">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Marca</label>
                                <input id="new-brand" type="text" placeholder="Ej: Nissan" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Modelo</label>
                                <input id="new-model" type="text" placeholder="Ej: NP300 2024" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">VIN (Num Serie)</label>
                                <input id="new-vin" type="text" placeholder="17 caracteres" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white font-mono focus:border-primary outline-none">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Kilometraje Inicial</label>
                                <input id="new-km" type="number" placeholder="0" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">URL Imagen Vehículo</label>
                            <input id="new-img" type="url" placeholder="https://..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        
                        <div class="flex gap-3 pt-4 border-t border-[#324d67]">
                            <button type="button" onclick="document.getElementById('modal-add-vehicle').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors bg-[#232a33] rounded-lg">Cancelar</button>
                            <button type="submit" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg transition-all">Guardar Unidad</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="modal-add-driver" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div class="bg-[#1c2127] w-full max-w-md rounded-2xl border border-[#324d67] p-6 shadow-2xl animate-fade-in-up">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">person_add</span>
                        Alta de Conductor
                    </h3>
                    <form id="form-new-driver" class="space-y-4">
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Nombre Completo *</label>
                            <input id="new-driver-name" required type="text" placeholder="Nombre y Apellido" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">No. Empleado (Opcional)</label>
                            <input id="new-driver-emp" type="text" placeholder="EMP-001" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Email (Acceso App) *</label>
                            <input id="new-driver-email" required type="email" placeholder="correo@cov.mx" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                        </div>
                        <div>
                            <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">No. Licencia *</label>
                            <input id="new-driver-lic" required type="text" placeholder="A0000000" class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none uppercase">
                        </div>
                        
                        <div class="flex gap-3 pt-4 border-t border-[#324d67]">
                            <button type="button" onclick="document.getElementById('modal-add-driver').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold bg-[#232a33] rounded-lg hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg transition-all">Registrar</button>
                        </div>
                    </form>
                </div>
            </div>

        </div>
        `;
    }

    renderInspectionQuestion(label, id, description) {
        return `
        <div>
            <p class="text-white text-sm font-medium mb-1">${label}</p>
            <p class="text-[#92adc9] text-[10px] mb-2">${description}</p>
            <div class="flex gap-2">
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="good" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-green-500 peer-checked:bg-green-500 flex items-center justify-center transition-all">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">check</span>
                    </span>
                    <span class="text-xs text-white">Ok</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="regular" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-yellow-500 peer-checked:bg-yellow-500 flex items-center justify-center transition-all">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">warning</span>
                    </span>
                    <span class="text-xs text-white">Reg</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="bad" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-red-500 peer-checked:bg-red-500 flex items-center justify-center transition-all">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">close</span>
                    </span>
                    <span class="text-xs text-white">Mal</span>
                </label>
            </div>
        </div>
        `;
    }

    async onMount() {
        // Precargar Datos
        await this.loadVehicles();
        await this.loadDrivers();
        await this.loadInspections();

        // ------------------ TABS DEL INVENTARIO ------------------
        window.inventoryView.switchInvTab = (tab) => {
            document.getElementById('view-vehicles').classList.add('hidden');
            document.getElementById('view-drivers').classList.add('hidden');
            document.getElementById('view-inspections').classList.add('hidden');
            
            document.getElementById('tab-vehicles').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
            document.getElementById('tab-drivers').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
            document.getElementById('tab-inspections').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";

            document.getElementById(`view-${tab}`).classList.remove('hidden');
            document.getElementById(`tab-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors";
        };

        // ------------------ VEHÍCULOS ------------------
        // Escuchar Submit de Alta Vehículo
        document.getElementById('form-new-vehicle').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.submitter;
            btn.innerText = "Guardando..."; btn.disabled = true;

            const data = {
                economic_number: document.getElementById('new-eco').value,
                plate: document.getElementById('new-plate').value.toUpperCase(),
                brand: document.getElementById('new-brand').value || null,
                model: document.getElementById('new-model').value || null,
                vin: document.getElementById('new-vin').value || null,
                current_km: parseInt(document.getElementById('new-km').value) || 0,
                image_url: document.getElementById('new-img').value || null,
                status: 'active'
            };

            const { error } = await supabase.from('vehicles').insert([data]);
            
            btn.innerText = "Guardar Unidad"; btn.disabled = false;
            if (error) {
                alert("Error al guardar: " + error.message);
            } else {
                alert("✅ Unidad registrada exitosamente");
                document.getElementById('modal-add-vehicle').classList.add('hidden');
                document.getElementById('form-new-vehicle').reset();
                this.loadVehicles();
            }
        });

        // Abrir Detalle del Vehículo
        window.inventoryView.openVehicleDetail = async (id) => {
            this.selectedVehicle = this.vehicles.find(v => v.id === id);
            if(!this.selectedVehicle) return;

            document.getElementById('modal-detail').classList.remove('hidden');
            
            // Llenar Datos Base
            document.getElementById('detail-title').innerText = this.selectedVehicle.economic_number;
            document.getElementById('detail-plate').innerText = `${this.selectedVehicle.brand || ''} ${this.selectedVehicle.model || ''} • ${this.selectedVehicle.plate}`;
            document.getElementById('detail-img').src = this.selectedVehicle.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=60';
            document.getElementById('detail-km').innerText = `${Number(this.selectedVehicle.current_km || 0).toLocaleString()} km`;
            document.getElementById('detail-fuel').innerText = `${this.selectedVehicle.fuel_level || 100}%`;
            
            const expDate = this.selectedVehicle.insurance_expiry ? new Date(this.selectedVehicle.insurance_expiry).toLocaleDateString() : 'Sin registro';
            document.getElementById('detail-insurance').innerText = expDate;

            const stEl = document.getElementById('detail-status');
            stEl.innerText = this.selectedVehicle.status === 'active' ? 'Activo' : 'Inactivo/Taller';
            stEl.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${this.selectedVehicle.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`;

            // Cargar Historial Paralelo
            document.getElementById('detail-logs').innerHTML = '<p class="text-slate-500 text-center py-8"><i class="fas fa-circle-notch fa-spin mr-2"></i> Cargando historial...</p>';
            
            const [incidentsRes, maintRes, inspRes] = await Promise.all([
                supabase.from('incidents').select('*').eq('vehicle_id', id),
                supabase.from('maintenance_logs').select('*').eq('vehicle_id', id),
                supabase.from('vehicle_inspections').select('*').eq('vehicle_id', id).order('created_at', { ascending: false })
            ]);

            // Guardar para filtros
            this.currentVehicleHistory = {
                incidents: incidentsRes.data || [],
                maintenance: maintRes.data || [],
                inspections: inspRes.data || []
            };

            // Actualizar Tarjetas Resumen
            document.getElementById('detail-incidents').innerText = this.currentVehicleHistory.incidents.length;
            const totalCost = this.currentVehicleHistory.maintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
            document.getElementById('detail-cost').innerText = `$${totalCost.toLocaleString()}`;

            if (this.currentVehicleHistory.inspections.length > 0) {
                const lastInsp = this.currentVehicleHistory.inspections[0];
                const date = new Date(lastInsp.created_at).toLocaleDateString();
                const icon = lastInsp.vehicle_approval === 'approved' ? '✅' : lastInsp.vehicle_approval === 'conditional' ? '⚠️' : '❌';
                document.getElementById('detail-last-inspection').innerHTML = `${icon} <span class="text-sm text-slate-300 ml-1">${date}</span>`;
            } else {
                document.getElementById('detail-last-inspection').innerText = 'Ninguna';
            }

            this.renderCombinedHistory(this.currentVehicleHistory.incidents, this.currentVehicleHistory.maintenance, this.currentVehicleHistory.inspections);
        };

        // Filtros de Historial en el Modal de Detalle
        window.inventoryView.showOnlyLogType = (type) => {
            if(!this.currentVehicleHistory) return;
            if(type === 'incidents') this.renderCombinedHistory(this.currentVehicleHistory.incidents, [], []);
            if(type === 'maintenance') this.renderCombinedHistory([], this.currentVehicleHistory.maintenance, []);
            if(type === 'inspections') this.renderCombinedHistory([], [], this.currentVehicleHistory.inspections);
        };

        // ------------------ CONDUCTORES ------------------
        document.getElementById('form-new-driver').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.submitter;
            btn.innerText = "Guardando..."; btn.disabled = true;

            const data = {
                id: crypto.randomUUID(), // Generamos UUID falso para la maqueta, Supabase Auth debería darlo
                full_name: document.getElementById('new-driver-name').value,
                email: document.getElementById('new-driver-email').value,
                employee_id: document.getElementById('new-driver-emp').value || null,
                license_number: document.getElementById('new-driver-lic').value.toUpperCase(),
                role: 'driver',
                photo_url: `https://ui-avatars.com/api/?name=${document.getElementById('new-driver-name').value}&background=137fec&color=fff`
            };

            const { error } = await supabase.from('profiles').insert([data]);
            
            btn.innerText = "Registrar"; btn.disabled = false;
            if (error) {
                alert("Error al registrar conductor: " + error.message);
            } else {
                alert("✅ Conductor registrado exitosamente");
                document.getElementById('modal-add-driver').classList.add('hidden');
                document.getElementById('form-new-driver').reset();
                this.loadDrivers();
            }
        });

        // ------------------ INSPECCIONES ------------------
        window.inventoryView.openInspectionModal = (vehicleId) => {
            if(!vehicleId) return alert("Debe seleccionar un vehículo primero.");
            
            document.getElementById('modal-detail').classList.add('hidden');
            document.getElementById('modal-inspection').classList.remove('hidden');
            
            const v = this.vehicles.find(veh => veh.id === vehicleId);
            document.getElementById('inspection-vehicle-info').innerText = `${v.economic_number} • ${v.plate}`;
            document.getElementById('insp-vehicle-id').value = vehicleId;
            document.getElementById('insp-km').value = v.current_km || 0;
            document.getElementById('insp-fuel').value = v.fuel_level || 100;
        };

        document.getElementById('inspection-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.submitter;
            btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Guardando...`; btn.disabled = true;

            const form = document.getElementById('inspection-form');
            const vId = document.getElementById('insp-vehicle-id').value;
            const newKm = parseInt(document.getElementById('insp-km').value);
            const newFuel = parseInt(document.getElementById('insp-fuel').value);

            const inspectionData = {
                vehicle_id: vId,
                inspector_name: document.getElementById('insp-name').value,
                current_km: newKm,
                fuel_level: newFuel,
                general_condition: document.getElementById('insp-condition').value,
                problems_detected: document.getElementById('insp-problems').value || null,
                vehicle_approval: document.getElementById('insp-approval').value,
                inspector_signature: document.getElementById('insp-signature').value,
            };

            // Recolectar Respuestas Radio Buttons
            const questions = ['q_engine', 'q_brakes', 'q_tires', 'q_electric', 'q_body', 'q_interior'];
            questions.forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                inspectionData[q] = selected ? selected.value : null;
            });

            // 1. Guardar Inspección
            const { error: inspError } = await supabase.from('vehicle_inspections').insert([inspectionData]);
            
            if (inspError) {
                alert("Error al guardar inspección: " + inspError.message);
                btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar Inspección`; btn.disabled = false;
                return;
            }

            // 2. Actualizar Vehículo (KM y Gasolina)
            await supabase.from('vehicles').update({ current_km: newKm, fuel_level: newFuel }).eq('id', vId);

            btn.innerHTML = `<span class="material-symbols-outlined">save</span> Guardar Inspección`; btn.disabled = false;
            alert("✅ Inspección guardada y vehículo actualizado.");
            
            document.getElementById('modal-inspection').classList.add('hidden');
            form.reset();
            
            // Recargar Todo
            this.loadVehicles();
            this.loadInspections();
        });

        // Filtrado de Inspecciones en el tab
        window.inventoryView.filterInspections = () => {
            const dateVal = document.getElementById('filter-date').value;
            const vehVal = document.getElementById('filter-vehicle').value;
            
            let filtered = this.inspections;
            
            if(dateVal) {
                filtered = filtered.filter(i => i.created_at.startsWith(dateVal));
            }
            if(vehVal) {
                filtered = filtered.filter(i => i.vehicle_id === vehVal);
            }
            
            this.renderInspectionsList(filtered);
        };
    }

    // --- CARGADORES DE DATOS ---

    async loadVehicles() {
        const { data, error } = await supabase.from('vehicles').select('*').order('economic_number');
        const grid = document.getElementById('grid-vehicles');
        
        if(error || !data || data.length === 0) {
            grid.innerHTML = '<p class="text-slate-500 col-span-full text-center">No hay vehículos registrados.</p>';
            return;
        }

        this.vehicles = data;

        // Poblar Selects de Filtros
        const filterSelect = document.getElementById('filter-vehicle');
        if(filterSelect) {
            filterSelect.innerHTML = '<option value="">Todos los vehículos</option>' + 
                data.map(v => `<option value="${v.id}">${v.economic_number} - ${v.plate}</option>`).join('');
        }

        grid.innerHTML = data.map(v => `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <div onclick="window.inventoryView.openVehicleDetail('${v.id}')" class="h-40 bg-black relative">
                    <img src="${v.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=500&q=60'}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase">
                        ${v.status === 'active' ? '<span class="text-green-400">●</span> Activo' : '<span class="text-red-400">●</span> ' + v.status}
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-white font-bold text-lg leading-none">${v.economic_number}</h3>
                            <p class="text-[#92adc9] text-[10px] uppercase font-bold tracking-wider mt-1">${v.brand || '---'} ${v.model || ''}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-white font-mono font-bold text-sm bg-[#111a22] px-2 py-1 rounded border border-[#324d67]">${v.plate}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-[#324d67] flex justify-between items-center">
                        <div class="text-xs text-[#92adc9] flex gap-3">
                            <span class="flex items-center gap-1" title="Kilometraje"><span class="material-symbols-outlined text-[14px]">speed</span> ${Number(v.current_km || 0).toLocaleString()}</span>
                            <span class="flex items-center gap-1" title="Nivel Gasolina"><span class="material-symbols-outlined text-[14px]">local_gas_station</span> ${v.fuel_level || 100}%</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.inventoryView.openInspectionModal('${v.id}')" class="text-xs bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                <span class="material-symbols-outlined text-[14px]">checklist</span> Inspect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadDrivers() {
        const { data, error } = await supabase.from('profiles').select('*').eq('role', 'driver');
        const tbody = document.getElementById('table-drivers');
        
        if(error || !data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-500">No hay conductores registrados.</td></tr>';
            return;
        }

        this.drivers = data;

        tbody.innerHTML = data.map(d => `
            <tr class="hover:bg-[#232b34] transition-colors border-b border-[#324d67] last:border-0">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-slate-700 bg-cover bg-center border-2 border-[#324d67]" style="background-image: url('${d.photo_url || `https://ui-avatars.com/api/?name=${d.full_name}&background=137fec&color=fff`}')"></div>
                        <div>
                            <p class="text-white font-bold text-sm">${d.full_name}</p>
                            <p class="text-[10px] text-[#92adc9] tracking-widest uppercase">ID: ${d.employee_id || d.id.split('-')[0]}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 bg-[#111a22] w-fit px-3 py-1.5 rounded-lg border border-[#324d67]">
                        <span class="material-symbols-outlined text-slate-500 text-sm">badge</span>
                        <span class="text-white font-mono text-xs font-bold">${d.license_number || 'S/N'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="inline-flex items-center justify-center gap-2 bg-[#111a22] px-3 py-1 rounded-full border border-[#324d67]">
                        <span class="material-symbols-outlined text-green-500 text-[14px]">verified_user</span>
                        <span class="text-xs text-[#92adc9]">Biometría OK</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-right">
                    <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase">Activo</span>
                </td>
            </tr>
        `).join('');
    }

    async loadInspections() {
        const { data, error } = await supabase
            .from('vehicle_inspections')
            .select(`*, vehicles (economic_number, plate, model)`)
            .order('created_at', { ascending: false });

        if(error) return;
        this.inspections = data || [];
        this.renderInspectionsList(this.inspections);
    }

    renderInspectionsList(inspectionsArray) {
        const container = document.getElementById('inspections-list');
        if(inspectionsArray.length === 0) {
            container.innerHTML = '<div class="text-center py-10 bg-[#111a22] rounded-xl border border-[#324d67]"><span class="material-symbols-outlined text-4xl text-slate-600 mb-2">search_off</span><p class="text-slate-400">No se encontraron inspecciones.</p></div>';
            return;
        }

        container.innerHTML = inspectionsArray.map(i => {
            const date = new Date(i.created_at);
            const approvalColor = i.vehicle_approval === 'approved' ? 'green' : i.vehicle_approval === 'conditional' ? 'yellow' : 'red';
            const approvalText = i.vehicle_approval === 'approved' ? 'Aprobado para Ruta' : i.vehicle_approval === 'conditional' ? 'Aprobado con Observaciones' : 'Rechazado - Requiere Taller';
            const approvalIcon = i.vehicle_approval === 'approved' ? 'check_circle' : i.vehicle_approval === 'conditional' ? 'warning' : 'cancel';
            
            return `
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden hover:border-${approvalColor}-500/50 transition-colors">
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex gap-4">
                                <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67] text-center min-w-[80px]">
                                    <p class="text-xs text-[#92adc9] uppercase font-bold mb-1">ECO</p>
                                    <p class="text-white font-black">${i.vehicles?.economic_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 class="text-white font-bold">${i.vehicles?.model || 'Vehículo'}</h3>
                                    <p class="text-[#92adc9] text-xs font-mono">${i.vehicles?.plate || ''}</p>
                                    <p class="text-[10px] text-slate-500 mt-1"><i class="fas fa-user text-[8px] mr-1"></i> Inspector: ${i.inspector_name}</p>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-2">
                                <span class="inline-flex items-center gap-1 px-3 py-1 rounded text-[10px] font-bold bg-${approvalColor}-500/10 text-${approvalColor}-400 border border-${approvalColor}-500/20 uppercase">
                                    <span class="material-symbols-outlined text-[14px]">${approvalIcon}</span> ${approvalText}
                                </span>
                                <p class="text-[10px] text-[#92adc9] font-bold uppercase tracking-widest">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#111a22] p-4 rounded-lg border border-[#324d67]">
                            <div>
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold mb-1">Kilometraje</p>
                                <p class="text-white text-sm font-mono">${(i.current_km || 0).toLocaleString()} km</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold mb-1">Combustible</p>
                                <div class="flex items-center gap-2">
                                    <div class="w-full bg-slate-800 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width: ${i.fuel_level}%"></div></div>
                                    <span class="text-white text-xs font-bold">${i.fuel_level}%</span>
                                </div>
                            </div>
                            <div>
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold mb-1">Estado General</p>
                                <p class="text-white text-sm capitalize">${i.general_condition}</p>
                            </div>
                            <div>
                                <p class="text-[10px] text-[#92adc9] uppercase font-bold mb-1">Firma/Aprobación</p>
                                <p class="text-white text-sm truncate" title="${i.inspector_signature}">${i.inspector_signature || 'N/A'}</p>
                            </div>
                        </div>

                        ${i.problems_detected ? `
                            <div class="mt-3 bg-red-900/10 border border-red-900/30 rounded-lg p-3">
                                <p class="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">build</span> Problemas Reportados</p>
                                <p class="text-slate-300 text-sm">${i.problems_detected}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- RENDERIZADORES AUXILIARES ---
    renderCombinedHistory(incidents, maintenance, inspections) {
        const logsContainer = document.getElementById('detail-logs');
        const allEvents = [
            ...incidents.map(i => ({ 
                type: 'INCIDENTE', 
                date: i.reported_at, 
                desc: i.description, 
                cost: 0, 
                color: 'red',
                icon: 'warning'
            })),
            ...maintenance.map(m => ({ 
                type: 'TALLER', 
                date: m.scheduled_date, 
                desc: m.service_type, 
                cost: m.cost, 
                color: 'blue',
                icon: 'build'
            })),
            ...inspections.map(i => ({ 
                type: 'INSPECCIÓN', 
                date: i.created_at, 
                desc: `Rev: ${i.inspector_name} - Nivel Gas: ${i.fuel_level}%`,
                cost: 0,
                color: i.vehicle_approval === 'approved' ? 'green' : i.vehicle_approval === 'conditional' ? 'yellow' : 'red',
                icon: 'fact_check',
                approval: i.vehicle_approval
            }))
        ].sort((a,b) => new Date(b.date) - new Date(a.date));

        if(allEvents.length === 0) {
            logsContainer.innerHTML = '<div class="text-center py-8 border border-dashed border-[#324d67] rounded-xl"><span class="material-symbols-outlined text-3xl text-slate-600 mb-2">history_toggle_off</span><p class="text-slate-500 text-xs uppercase font-bold tracking-widest">Sin historial registrado</p></div>';
        } else {
            logsContainer.innerHTML = allEvents.map(e => `
                <div class="flex items-start p-3 bg-[#111a22] rounded-xl border border-[#324d67] hover:border-[#476a8a] transition-colors relative overflow-hidden group">
                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-${e.color}-500"></div>
                    <div class="mr-3 ml-2 text-${e.color}-500 mt-1">
                        <span class="material-symbols-outlined text-xl">${e.icon}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start mb-1">
                            <span class="text-[10px] font-bold uppercase tracking-widest text-${e.color}-400">${e.type}</span>
                            <span class="text-[10px] text-[#92adc9] font-mono">${new Date(e.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-white text-sm leading-snug">${e.desc}</p>
                        ${e.approval ? `<div class="mt-2"><span class="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-${e.color}-500/10 text-${e.color}-400 border border-${e.color}-500/20">${e.approval === 'approved' ? 'Aprobado' : e.approval === 'conditional' ? 'Condicional' : 'Rechazado'}</span></div>` : ''}
                    </div>
                    ${e.cost > 0 ? `<div class="ml-3 text-right"><span class="text-xs text-[#92adc9] block uppercase">Costo</span><span class="text-white font-mono font-bold">$${e.cost.toLocaleString()}</span></div>` : ''}
                </div>
            `).join('');
        }
    }
}
