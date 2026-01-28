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
                    <button onclick="window.switchInvTab('inspections')" id="tab-inspections" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors">Inspecciones</button>
                </div>
            </div>

            <!-- Vista de Vehículos -->
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
                    <p class="text-slate-500 col-span-full text-center py-10">Cargando flota...</p>
                </div>
            </div>

            <!-- Vista de Conductores -->
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

            <!-- Vista de Inspecciones -->
            <div id="view-inspections" class="hidden animate-fade-in space-y-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-white text-xl font-bold">Historial de Inspecciones</h2>
                        <p class="text-[#92adc9] text-sm">Registro de verificaciones de estado de vehículos</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="date" id="filter-date" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm">
                        <select id="filter-vehicle" class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white text-sm">
                            <option value="">Todos los vehículos</option>
                        </select>
                    </div>
                </div>
                
                <div id="inspections-list" class="space-y-4">
                    <!-- Las inspecciones se cargarán aquí -->
                    <p class="text-slate-500 text-center py-10">Cargando inspecciones...</p>
                </div>
            </div>

            <!-- Modal Detalle del Vehículo -->
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
                        <div class="flex gap-3">
                            <button onclick="window.openInspection(document.currentVehicleId)" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
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
                                <p id="detail-last-inspection" class="text-2xl font-black text-primary mt-1">--</p>
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
                            <div class="flex justify-between items-center">
                                <h3 class="text-white font-bold text-sm uppercase tracking-wider">Historial Reciente</h3>
                                <div class="flex gap-2">
                                    <button onclick="window.showOnly('incidents')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Incidentes</button>
                                    <button onclick="window.showOnly('maintenance')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Mantenimiento</button>
                                    <button onclick="window.showOnly('inspections')" class="text-xs px-3 py-1 rounded-full border border-[#324d67] text-[#92adc9] hover:text-white">Inspecciones</button>
                                </div>
                            </div>
                            <div id="detail-logs" class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <!-- Historial cargado dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de Inspección -->
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
                            <!-- Información Básica -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Información de la Inspección</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Inspector</label>
                                        <input id="inspector-name" type="text" placeholder="Nombre del inspector" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Kilometraje Actual</label>
                                        <input id="current-km" type="number" placeholder="Ej: 45000" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Combustible</label>
                                        <select id="fuel-level" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                            <option value="">Seleccionar nivel</option>
                                            <option value="full">Lleno</option>
                                            <option value="3/4">3/4</option>
                                            <option value="1/2">1/2</option>
                                            <option value="1/4">1/4</option>
                                            <option value="empty">Vacío</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Condición General</label>
                                        <select id="general-condition" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                            <option value="">Seleccionar condición</option>
                                            <option value="excellent">Excelente</option>
                                            <option value="good">Buena</option>
                                            <option value="regular">Regular</option>
                                            <option value="bad">Mala</option>
                                            <option value="critical">Crítica</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Sistema Eléctrico -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Sistema Eléctrico</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.renderInspectionQuestion("Batería", "battery", "Funciona correctamente?")}
                                    ${this.renderInspectionQuestion("Luces Altas/Bajas", "lights_high_low", "Ambas funcionan?")}
                                    ${this.renderInspectionQuestion("Luces Direccionales", "lights_turn", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Luces Frenos", "lights_brake", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Luces Reversa", "lights_reverse", "Funciona correctamente?")}
                                    ${this.renderInspectionQuestion("Tablero Instrumentos", "dashboard_lights", "Todas las luces funcionan?")}
                                    ${this.renderInspectionQuestion("Claxon", "horn", "Funciona correctamente?")}
                                </div>
                            </div>

                            <!-- Sistema Mecánico -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Sistema Mecánico</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.renderInspectionQuestion("Motor", "engine", "Sin ruidos anormales?")}
                                    ${this.renderInspectionQuestion("Transmisión", "transmission", "Cambios suaves?")}
                                    ${this.renderInspectionQuestion("Frenos", "brakes", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Dirección", "steering", "Sin juego excesivo?")}
                                    ${this.renderInspectionQuestion("Suspensión", "suspension", "Sin ruidos?")}
                                    ${this.renderInspectionQuestion("Escape", "exhaust", "Sin fugas?")}
                                    ${this.renderInspectionQuestion("Aire Acondicionado", "ac", "Funciona correctamente?")}
                                    ${this.renderInspectionQuestion("Calefacción", "heating", "Funciona correctamente?")}
                                </div>
                            </div>

                            <!-- Exterior -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Exterior del Vehículo</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.renderInspectionQuestion("Carrocería", "body", "Sin daños importantes?")}
                                    ${this.renderInspectionQuestion("Parabrisas", "windshield", "Sin grietas?")}
                                    ${this.renderInspectionQuestion("Espejos", "mirrors", "Completos y ajustables?")}
                                    ${this.renderInspectionQuestion("Llantas", "tires", "Presión y desgaste adecuado?")}
                                    ${this.renderInspectionQuestion("Rines", "rims", "Sin daños?")}
                                    ${this.renderInspectionQuestion("Placas", "plates", "Legibles y firmes?")}
                                </div>
                            </div>

                            <!-- Interior -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Interior del Vehículo</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${this.renderInspectionQuestion("Asientos", "seats", "Buen estado?")}
                                    ${this.renderInspectionQuestion("Cinturones", "seatbelts", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Limpiadores", "wipers", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Radio/Sistema Audio", "audio", "Funciona?")}
                                    ${this.renderInspectionQuestion("Cerraduras", "locks", "Funcionan correctamente?")}
                                    ${this.renderInspectionQuestion("Ventanas", "windows", "Suben y bajan?")}
                                </div>
                            </div>

                            <!-- Observaciones -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Observaciones y Comentarios</h4>
                                <div>
                                    <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Problemas Detectados</label>
                                    <textarea id="problems-detected" rows="3" placeholder="Describa cualquier problema detectado..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none"></textarea>
                                </div>
                                <div class="mt-3">
                                    <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Acciones Tomadas</label>
                                    <textarea id="actions-taken" rows="2" placeholder="Describa las acciones tomadas..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none"></textarea>
                                </div>
                                <div class="mt-3">
                                    <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Recomendaciones</label>
                                    <textarea id="recommendations" rows="2" placeholder="Recomendaciones para el conductor..." class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none"></textarea>
                                </div>
                            </div>

                            <!-- Resumen -->
                            <div class="bg-[#232a33] p-4 rounded-xl border border-[#324d67]">
                                <h4 class="text-white font-bold mb-3">Resumen y Aprobación</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">¿Vehículo Apto para Circular?</label>
                                        <select id="vehicle-approval" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                            <option value="">Seleccionar</option>
                                            <option value="approved">Sí, apto para circular</option>
                                            <option value="conditional">Sí, con observaciones</option>
                                            <option value="not_approved">No, requiere reparación</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-[#92adc9] uppercase block mb-1">Firma del Inspector</label>
                                        <input id="inspector-signature" type="text" placeholder="Nombre completo y firma" required class="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white focus:border-primary outline-none">
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-3 pt-6 border-t border-[#324d67]">
                                <button type="button" onclick="document.getElementById('modal-inspection').classList.add('hidden')" class="flex-1 py-3 text-slate-400 font-bold hover:text-white transition-colors bg-[#232a33] rounded-lg">Cancelar</button>
                                <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                                    <span class="material-symbols-outlined">check</span>
                                    Guardar Inspección
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal Agregar Vehículo (existente) -->
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

            <!-- Modal Agregar Conductor (existente) -->
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

    renderInspectionQuestion(label, id, description) {
        return `
        <div>
            <p class="text-white text-sm font-medium mb-1">${label}</p>
            <p class="text-[#92adc9] text-xs mb-2">${description}</p>
            <div class="flex gap-2">
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="good" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-green-500 peer-checked:bg-green-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">check</span>
                    </span>
                    <span class="text-xs text-white">Bueno</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="regular" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-yellow-500 peer-checked:bg-yellow-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">check</span>
                    </span>
                    <span class="text-xs text-white">Regular</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="bad" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-red-500 peer-checked:bg-red-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">check</span>
                    </span>
                    <span class="text-xs text-white">Malo</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="${id}" value="not_applicable" required class="sr-only peer">
                    <span class="size-6 rounded-full border-2 border-gray-500 peer-checked:bg-gray-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xs text-white hidden peer-checked:block">close</span>
                    </span>
                    <span class="text-xs text-white">N/A</span>
                </label>
            </div>
        </div>
        `;
    }

    onMount() {
        this.loadVehicles();
        this.loadDrivers();
        this.loadInspections();

        // Funciones Globales
        window.switchInvTab = (tab) => {
            document.getElementById('view-vehicles').classList.add('hidden');
            document.getElementById('view-drivers').classList.add('hidden');
            document.getElementById('view-inspections').classList.add('hidden');
            
            document.getElementById('tab-vehicles').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
            document.getElementById('tab-drivers').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";
            document.getElementById('tab-inspections').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors";

            document.getElementById(`view-${tab}`).classList.remove('hidden');
            document.getElementById(`tab-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors";
        };

        window.openInspection = async (vehicleId) => {
            document.getElementById('modal-inspection').classList.remove('hidden');
            document.getElementById('modal-detail').classList.add('hidden');
            
            const { data: vehicle } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', vehicleId)
                .single();
            
            if (vehicle) {
                document.getElementById('inspection-vehicle-info').innerText = 
                    `${vehicle.economic_number} • ${vehicle.plate} • ${vehicle.model}`;
                
                // Establecer el ID del vehículo en el formulario
                document.getElementById('inspection-form').dataset.vehicleId = vehicleId;
                
                // Cargar el último kilometraje
                document.getElementById('current-km').value = vehicle.current_km || 0;
            }
        };

        // Manejar envío del formulario de inspección
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('inspection-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await window.saveInspection();
                });
            }
        });

        window.saveInspection = async () => {
            const form = document.getElementById('inspection-form');
            const vehicleId = form.dataset.vehicleId;
            
            if (!vehicleId) {
                alert("Error: No se identificó el vehículo");
                return;
            }

            // Recolectar datos del formulario
            const formData = new FormData(form);
            const inspectionData = {
                vehicle_id: vehicleId,
                inspector_name: document.getElementById('inspector-name').value,
                current_km: parseInt(document.getElementById('current-km').value),
                fuel_level: document.getElementById('fuel-level').value,
                general_condition: document.getElementById('general-condition').value,
                problems_detected: document.getElementById('problems-detected').value,
                actions_taken: document.getElementById('actions-taken').value,
                recommendations: document.getElementById('recommendations').value,
                vehicle_approval: document.getElementById('vehicle-approval').value,
                inspector_signature: document.getElementById('inspector-signature').value,
                created_at: new Date().toISOString()
            };

            // Recolectar todas las respuestas del cuestionario
            const questions = [
                'battery', 'lights_high_low', 'lights_turn', 'lights_brake', 'lights_reverse',
                'dashboard_lights', 'horn', 'engine', 'transmission', 'brakes', 'steering',
                'suspension', 'exhaust', 'ac', 'heating', 'body', 'windshield', 'mirrors',
                'tires', 'rims', 'plates', 'seats', 'seatbelts', 'wipers', 'audio', 'locks', 'windows'
            ];

            questions.forEach(q => {
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                inspectionData[q] = selected ? selected.value : null;
            });

            // Guardar en Supabase
            const { error } = await supabase.from('vehicle_inspections').insert([inspectionData]);
            
            if (error) {
                alert("Error al guardar la inspección: " + error.message);
                return;
            }

            // Actualizar kilometraje del vehículo
            await supabase
                .from('vehicles')
                .update({ current_km: inspectionData.current_km })
                .eq('id', vehicleId);

            alert("✅ Inspección guardada exitosamente");
            document.getElementById('modal-inspection').classList.add('hidden');
            
            // Recargar datos
            this.loadInspections();
            
            // Si estamos viendo el detalle del vehículo, actualizarlo
            if (window.currentVehicleId === vehicleId) {
                window.openDetail(vehicleId);
            }
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
            window.currentVehicleId = id;
            document.getElementById('modal-detail').classList.remove('hidden');
            
            const [vehicleRes, incidentsRes, maintRes, inspectionsRes] = await Promise.all([
                supabase.from('vehicles').select('*').eq('id', id).single(),
                supabase.from('incidents').select('*').eq('vehicle_id', id),
                supabase.from('maintenance_logs').select('*').eq('vehicle_id', id),
                supabase.from('vehicle_inspections').select('*').eq('vehicle_id', id).order('created_at', { ascending: false }).limit(5)
            ]);

            const vehicle = vehicleRes.data;
            const incidents = incidentsRes.data || [];
            const maintenance = maintRes.data || [];
            const inspections = inspectionsRes.data || [];

            document.getElementById('detail-title').innerText = `${vehicle.economic_number}`;
            document.getElementById('detail-plate').innerText = `${vehicle.model} • ${vehicle.plate}`;
            document.getElementById('detail-img').src = vehicle.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=60';
            document.getElementById('detail-incidents').innerText = incidents.length;
            document.getElementById('detail-km').innerText = `${vehicle.current_km || 0} km`;
            
            const totalCost = maintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
            document.getElementById('detail-cost').innerText = `$${totalCost.toLocaleString()}`;

            // Mostrar última inspección
            if (inspections.length > 0) {
                const lastInspection = inspections[0];
                const date = new Date(lastInspection.created_at).toLocaleDateString();
                const status = lastInspection.vehicle_approval === 'approved' ? '✅' : 
                              lastInspection.vehicle_approval === 'conditional' ? '⚠️' : '❌';
                document.getElementById('detail-last-inspection').innerText = `${status} ${date}`;
            } else {
                document.getElementById('detail-last-inspection').innerText = 'Sin inspecciones';
            }

            const statusEl = document.getElementById('detail-status');
            statusEl.innerText = vehicle.status;
            statusEl.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                vehicle.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`;
            
            // Mostrar historial combinado
            this.renderCombinedHistory(incidents, maintenance, inspections);
        };

        window.showOnly = (type) => {
            const vehicleId = window.currentVehicleId;
            if (!vehicleId) return;
            
            // Recargar solo el tipo seleccionado
            switch(type) {
                case 'incidents':
                    supabase.from('incidents').select('*').eq('vehicle_id', vehicleId).then(({ data }) => {
                        this.renderCombinedHistory(data || [], [], []);
                    });
                    break;
                case 'maintenance':
                    supabase.from('maintenance_logs').select('*').eq('vehicle_id', vehicleId).then(({ data }) => {
                        this.renderCombinedHistory([], data || [], []);
                    });
                    break;
                case 'inspections':
                    supabase.from('vehicle_inspections').select('*').eq('vehicle_id', vehicleId).then(({ data }) => {
                        this.renderCombinedHistory([], [], data || []);
                    });
                    break;
            }
        };
    }

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
                type: 'SERVICIO', 
                date: m.scheduled_date, 
                desc: m.service_type, 
                cost: m.cost, 
                color: 'blue',
                icon: 'build'
            })),
            ...inspections.map(i => ({ 
                type: 'INSPECCIÓN', 
                date: i.created_at, 
                desc: `Inspección por ${i.inspector_name} - ${i.general_condition}`,
                cost: 0,
                color: i.vehicle_approval === 'approved' ? 'green' : 
                       i.vehicle_approval === 'conditional' ? 'yellow' : 'red',
                icon: 'checklist',
                approval: i.vehicle_approval
            }))
        ].sort((a,b) => new Date(b.date) - new Date(a.date));

        if(allEvents.length === 0) {
            logsContainer.innerHTML = '<p class="text-slate-500 text-center py-4 text-xs">Sin historial registrado.</p>';
        } else {
            logsContainer.innerHTML = allEvents.map(e => `
                <div class="flex items-center p-3 bg-[#111a22] rounded-lg border-l-4 ${e.color === 'red' ? 'border-red-500' : e.color === 'green' ? 'border-green-500' : e.color === 'yellow' ? 'border-yellow-500' : 'border-blue-500'} hover:bg-[#16202a] transition-colors">
                    <div class="mr-3 ${e.color === 'red' ? 'text-red-500' : e.color === 'green' ? 'text-green-500' : e.color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}">
                        <span class="material-symbols-outlined text-sm">${e.icon}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-bold uppercase ${e.color === 'red' ? 'text-red-500' : e.color === 'green' ? 'text-green-500' : e.color === 'yellow' ? 'text-yellow-500' : 'text-blue-500'}">${e.type}</span>
                            <span class="text-xs text-[#92adc9]">${new Date(e.date).toLocaleDateString()}</span>
                            ${e.approval ? `<span class="text-xs px-2 py-0.5 rounded-full ${e.approval === 'approved' ? 'bg-green-500/20 text-green-400' : e.approval === 'conditional' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}">${e.approval === 'approved' ? 'Aprobado' : e.approval === 'conditional' ? 'Condicional' : 'Rechazado'}</span>` : ''}
                        </div>
                        <p class="text-white text-sm mt-0.5">${e.desc}</p>
                    </div>
                    ${e.cost > 0 ? `<span class="text-white font-mono text-sm">$${e.cost}</span>` : ''}
                </div>
            `).join('');
        }
    }

    async loadVehicles() {
        const { data } = await supabase.from('vehicles').select('*');
        const grid = document.getElementById('grid-vehicles');
        
        if(!data || !data.length) {
            grid.innerHTML = '<p class="text-slate-500 col-span-full text-center">No hay vehículos.</p>';
            return;
        }

        grid.innerHTML = data.map(v => `
            <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden group hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <div onclick="window.openDetail('${v.id}')" class="h-40 bg-black relative">
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
                    <div class="mt-4 pt-3 border-t border-[#324d67] flex justify-between items-center">
                        <div class="text-xs text-[#92adc9]">
                            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">speed</span> ${v.current_km || 0} km</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.openInspection('${v.id}')" class="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors">
                                <span class="material-symbols-outlined text-sm">checklist</span>
                                Inspeccionar
                            </button>
                            <button onclick="window.openDetail('${v.id}')" class="text-xs bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg transition-colors">
                                Detalles
                            </button>
                        </div>
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

    async loadInspections() {
        const { data: inspections } = await supabase
            .from('vehicle_inspections')
            .select(`
                *,
                vehicles (economic_number, plate, model)
            `)
            .order('created_at', { ascending: false });

        const container = document.getElementById('inspections-list');
        const vehicleFilter = document.getElementById('filter-vehicle');
        
        if(!inspections || inspections.length === 0) {
            container.innerHTML = '<p class="text-slate-500 text-center py-10">No hay inspecciones registradas.</p>';
            return;
        }

        // Actualizar filtro de vehículos
        const vehicles = [...new Set(inspections.map(i => i.vehicle_id))];
        const vehicleData = await supabase.from('vehicles').select('id, economic_number').in('id', vehicles);
        
        if (vehicleData.data) {
            vehicleFilter.innerHTML = '<option value="">Todos los vehículos</option>' + 
                vehicleData.data.map(v => 
                    `<option value="${v.id}">${v.economic_number}</option>`
                ).join('');
        }

        container.innerHTML = inspections.map(i => {
            const date = new Date(i.created_at);
            const approvalColor = i.vehicle_approval === 'approved' ? 'green' : 
                                i.vehicle_approval === 'conditional' ? 'yellow' : 'red';
            const approvalText = i.vehicle_approval === 'approved' ? 'Aprobado' : 
                               i.vehicle_approval === 'conditional' ? 'Condicional' : 'Rechazado';
            
            return `
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden hover:border-${approvalColor}-500 transition-colors">
                    <div class="p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-white font-bold">${i.vehicles?.economic_number || 'Vehículo'} • ${i.vehicles?.plate || ''}</h3>
                                <p class="text-[#92adc9] text-sm">${i.vehicles?.model || ''}</p>
                            </div>
                            <div class="flex flex-col items-end gap-2">
                                <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-${approvalColor}-500/10 text-${approvalColor}-500 uppercase">
                                    ${approvalText}
                                </span>
                                <p class="text-xs text-[#92adc9]">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div class="bg-[#111a22] p-2 rounded-lg">
                                <p class="text-xs text-[#92adc9]">Inspector</p>
                                <p class="text-white text-sm font-medium">${i.inspector_name}</p>
                            </div>
                            <div class="bg-[#111a22] p-2 rounded-lg">
                                <p class="text-xs text-[#92adc9]">Kilometraje</p>
                                <p class="text-white text-sm font-medium">${i.current_km.toLocaleString()} km</p>
                            </div>
                            <div class="bg-[#111a22] p-2 rounded-lg">
                                <p class="text-xs text-[#92adc9]">Condición</p>
                                <p class="text-white text-sm font-medium">${i.general_condition}</p>
                            </div>
                            <div class="bg-[#111a22] p-2 rounded-lg">
                                <p class="text-xs text-[#92adc9]">Combustible</p>
                                <p class="text-white text-sm font-medium">${i.fuel_level}</p>
                            </div>
                        </div>
                        ${i.problems_detected ? `
                            <div class="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p class="text-xs text-red-400 font-bold mb-1">Problemas Detectados</p>
                                <p class="text-white text-sm">${i.problems_detected}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}
