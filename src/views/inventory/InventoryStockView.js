import { supabase } from '../../config/supabaseClient.js';

export class InventoryStockView {
    constructor() {
        this.items = [];
        this.services = [];
        this.tempRecipeItems = [];
        window.stockModule = this;
    }

    async onMount() {
        await this.loadData();
    }

    async loadData() {
        const [itemsRes, servicesRes] = await Promise.all([
            supabase.from('inventory_items').select('*').order('name'),
            supabase.from('service_templates').select(`
                id, name, description, labor_time, labor_unit, labor_cost, 
                service_template_items ( quantity, inventory_items ( id, name, cost, unit ) )
            `)
        ]);

        this.items = itemsRes.data || [];
        this.services = servicesRes.data || [];
        
        this.renderStockGrid();
        this.renderServicesGrid();
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-20">
            
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-end">
                    <div>
                        <h1 class="text-white text-3xl font-black">Stock y Recetas</h1>
                        <p class="text-[#92adc9] text-sm">Gestión de insumos, costos unitarios y armado de paquetes de servicio.</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.stockModule.openProductModal()" class="bg-[#233648] hover:bg-[#2d445a] border border-[#324d67] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                            <span class="material-symbols-outlined text-sm">inventory</span> Nuevo Insumo
                        </button>
                        <button onclick="window.stockModule.openRecipeModal()" class="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(19,127,236,0.3)] transition-all">
                            <span class="material-symbols-outlined text-sm">integration_instructions</span> Crear Receta
                        </button>
                    </div>
                </div>
                <div class="flex border-b border-[#324d67]">
                    <button onclick="window.stockModule.switchTab('stock')" id="tab-btn-stock" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">shelves</span> Inventario
                    </button>
                    <button onclick="window.stockModule.switchTab('recipes')" id="tab-btn-recipes" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">handyman</span> Catálogo de Servicios
                    </button>
                </div>
            </div>

            <div id="view-stock" class="animate-fade-in block">
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl overflow-hidden shadow-lg">
                    <table class="w-full text-left text-sm text-[#92adc9]">
                        <thead class="bg-[#111a22] text-xs font-bold uppercase sticky top-0 border-b border-[#324d67]">
                            <tr>
                                <th class="px-6 py-4">Producto / SKU</th>
                                <th class="px-6 py-4">Categoría</th>
                                <th class="px-6 py-4 text-center">Stock Disponible</th>
                                <th class="px-6 py-4 text-right">Costo Unit.</th>
                                <th class="px-6 py-4 text-right">Valorizado</th>
                                <th class="px-6 py-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="table-stock" class="divide-y divide-[#324d67]">
                            <tr><td colspan="6" class="text-center py-10">Cargando inventario...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="view-recipes" class="animate-fade-in hidden">
                <div id="grid-recipes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>

            <div id="stock-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div id="stock-modal-content" class="bg-[#1c2127] w-full border border-[#324d67] rounded-2xl shadow-2xl flex flex-col animate-fade-in-up"></div>
            </div>

        </div>
        `;
    }

    switchTab(tab) {
        document.getElementById('view-stock').classList.replace('block', 'hidden');
        document.getElementById('view-recipes').classList.replace('block', 'hidden');
        
        document.getElementById('tab-btn-stock').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2";
        document.getElementById('tab-btn-recipes').className = "px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors flex items-center gap-2";

        document.getElementById(`view-${tab}`).classList.replace('hidden', 'block');
        document.getElementById(`tab-btn-${tab}`).className = "px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors flex items-center gap-2 bg-primary/5";
    }

    renderStockGrid() {
        const tbody = document.getElementById('table-stock');
        if (this.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500">No hay productos en el inventario.</td></tr>';
            return;
        }

        tbody.innerHTML = this.items.map(i => {
            const isLowStock = i.stock < 5;
            return `
            <tr class="hover:bg-[#232b34] transition-colors border-b border-[#324d67] last:border-0">
                <td class="px-6 py-4">
                    <div class="font-bold text-white">${i.name}</div>
                    <div class="text-[10px] text-[#92adc9] font-mono tracking-widest mt-1 uppercase">${i.sku || 'S/N'}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="bg-[#111a22] border border-[#324d67] px-2 py-1 rounded text-xs">${i.category || 'General'}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${isLowStock ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-green-900/20 text-green-400 border-green-500/30'}">
                        ${i.stock} ${i.unit}
                    </span>
                </td>
                <td class="px-6 py-4 text-right font-mono text-white">
                    $${Number(i.cost).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td class="px-6 py-4 text-right font-mono font-bold text-primary">
                    $${(i.cost * i.stock).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="window.stockModule.openProductModal('${i.id}')" class="text-slate-400 hover:text-white bg-[#233648] hover:bg-primary p-1.5 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    renderServicesGrid() {
        const grid = document.getElementById('grid-recipes');
        if (this.services.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center py-10 text-slate-500">No hay recetas de servicio creadas.</p>';
            return;
        }

        grid.innerHTML = this.services.map(s => {
            const partsCost = s.service_template_items.reduce((acc, si) => acc + (si.quantity * si.inventory_items.cost), 0);
            const laborCost = Number(s.labor_cost) || 0;
            const totalCost = partsCost + laborCost;

            return `
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-5 shadow-lg flex flex-col hover:border-[#456b8f] transition-colors">
                    <div class="flex justify-between items-start mb-4 border-b border-[#324d67] pb-4">
                        <div>
                            <h4 class="font-black text-white text-lg leading-tight">${s.name}</h4>
                            <p class="text-[10px] text-[#92adc9] mt-1">${s.description || 'Sin descripción'}</p>
                        </div>
                        <span class="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm font-bold border border-primary/30 font-mono shadow-inner">
                            $${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                    </div>
                    
                    <div class="bg-[#111a22] p-3 rounded-lg border border-[#324d67] mb-4 space-y-2">
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-[#92adc9]">Mano de Obra (${s.labor_time || 0} ${s.labor_unit || 'Hrs'}):</span>
                            <span class="text-white font-mono">$${laborCost.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-[#92adc9]">Insumos:</span>
                            <span class="text-white font-mono">$${partsCost.toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="flex-1">
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Refacciones Incluidas</p>
                        <ul class="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar pr-1">
                            ${s.service_template_items.length === 0 ? '<li class="text-xs text-slate-600 italic">Solo mano de obra.</li>' : 
                            s.service_template_items.map(si => `
                                <li class="text-[11px] text-[#92adc9] flex justify-between items-center bg-[#1c2127] p-1.5 rounded border border-[#233648]">
                                    <span class="truncate flex-1 pr-2 flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[12px] text-green-500">check_circle</span> 
                                        ${si.inventory_items.name}
                                    </span>
                                    <span class="font-mono font-bold text-white bg-[#233648] px-1.5 rounded">x${si.quantity}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- MODALES (NUEVO INSUMO Y NUEVA RECETA) ---
    openProductModal(itemId = null) {
        const item = itemId ? this.items.find(i => i.id === itemId) : null;
        const modal = document.getElementById('stock-modal');
        const content = document.getElementById('stock-modal-content');
        
        content.className = "bg-[#1c2127] w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#324d67] animate-fade-in-up font-display";
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4">
                <h3 class="font-black text-xl text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">${item ? 'edit' : 'inventory_2'}</span> ${item ? 'Editar' : 'Registrar Nuevo'} Insumo
                </h3>
            </div>
            
            <div class="space-y-4">
                <input type="hidden" id="inv-id" value="${item ? item.id : ''}">
                <div>
                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre del Producto</label>
                    <input id="inv-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary" value="${item ? item.name : ''}" placeholder="Ej: Aceite Sintético 5W-30">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Código / SKU</label>
                        <input id="inv-sku" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-mono uppercase" value="${item ? item.sku : ''}" placeholder="AC-5W30-01">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Categoría</label>
                        <select id="inv-cat" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary">
                            <option value="Líquidos" ${item?.category === 'Líquidos' ? 'selected' : ''}>Líquidos y Lubricantes</option>
                            <option value="Filtros" ${item?.category === 'Filtros' ? 'selected' : ''}>Filtros</option>
                            <option value="Frenos" ${item?.category === 'Frenos' ? 'selected' : ''}>Sistema de Frenos</option>
                            <option value="Eléctrico" ${item?.category === 'Eléctrico' ? 'selected' : ''}>Eléctrico</option>
                            <option value="General" ${!item || item?.category === 'General' ? 'selected' : ''}>Refacción General</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Stock Actual</label>
                        <input type="number" id="inv-stock" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-mono" value="${item ? item.stock : 0}">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Medida</label>
                        <select id="inv-unit" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary">
                            <option value="PZ" ${item?.unit === 'PZ' ? 'selected' : ''}>Piezas (PZ)</option>
                            <option value="LT" ${item?.unit === 'LT' ? 'selected' : ''}>Litros (LT)</option>
                            <option value="KG" ${item?.unit === 'KG' ? 'selected' : ''}>Kilos (KG)</option>
                            <option value="JGO" ${item?.unit === 'JGO' ? 'selected' : ''}>Juegos (JGO)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Costo Unit. ($)</label>
                        <input type="number" step="0.01" id="inv-cost" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary font-mono text-green-400" value="${item ? item.cost : 0}">
                    </div>
                </div>
            </div>
            
            <div class="mt-6 flex gap-3 pt-4 border-t border-[#324d67]">
                <button onclick="document.getElementById('stock-modal').classList.add('hidden')" class="flex-1 bg-[#233648] hover:bg-[#2d445a] text-white py-3 rounded-xl font-bold transition-all border border-[#324d67]">Cancelar</button>
                <button onclick="window.stockModule.saveProduct()" class="flex-1 bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">save</span> Guardar
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    async saveProduct() {
        const id = document.getElementById('inv-id').value;
        const data = {
            name: document.getElementById('inv-name').value,
            sku: document.getElementById('inv-sku').value.toUpperCase(),
            category: document.getElementById('inv-cat').value,
            stock: parseInt(document.getElementById('inv-stock').value) || 0,
            unit: document.getElementById('inv-unit').value,
            cost: parseFloat(document.getElementById('inv-cost').value) || 0
        };
        
        if(!data.name) return alert("El nombre es obligatorio");

        let error;
        if (id) {
            ({ error } = await supabase.from('inventory_items').update(data).eq('id', id));
        } else {
            ({ error } = await supabase.from('inventory_items').insert([data]));
        }

        if (error) alert("Error: " + error.message);
        else {
            document.getElementById('stock-modal').classList.add('hidden');
            await this.loadData();
        }
    }

    openRecipeModal() {
        this.tempRecipeItems = [];
        const modal = document.getElementById('stock-modal');
        const content = document.getElementById('stock-modal-content');
        
        // Select Options con estilo
        const invOptions = this.items.map(i => `<option value="${i.id}" data-cost="${i.cost}" data-name="${i.name}" data-unit="${i.unit}">${i.name} (Disp: ${i.stock} | $${i.cost})</option>`).join('');

        content.className = "bg-[#1c2127] w-full max-w-4xl rounded-2xl shadow-2xl p-6 border border-[#324d67] overflow-hidden flex flex-col h-[90vh] animate-fade-in-up font-display";
        content.innerHTML = `
            <div class="flex justify-between items-center mb-6 border-b border-[#324d67] pb-4 shrink-0">
                <h3 class="font-black text-xl text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">integration_instructions</span> Crear Receta de Mantenimiento
                </h3>
                <button onclick="document.getElementById('stock-modal').classList.add('hidden')" class="text-slate-400 hover:text-white transition-colors bg-[#233648] p-2 rounded-full hover:bg-red-500/20 hover:text-red-500">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre del Paquete / Servicio</label>
                        <input id="rec-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="Ej: Afinación Completa V8">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Descripción Breve</label>
                        <input id="rec-desc" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg px-3 py-2 outline-none focus:border-primary" placeholder="Para modelos 2020 en adelante">
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    
                    <div class="space-y-6">
                        <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl shadow-lg">
                            <h4 class="text-xs font-bold text-orange-500 uppercase tracking-widest border-b border-[#324d67] pb-2 mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px]">schedule</span> Costo Mano de Obra
                            </h4>
                            <div class="grid grid-cols-3 gap-3">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Tiempo</label>
                                    <input type="number" id="rec-labor-time" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 py-2 outline-none focus:border-primary text-center" value="1">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Unidad</label>
                                    <select id="rec-labor-unit" class="w-full bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 py-2 outline-none focus:border-primary text-center">
                                        <option value="Horas">Horas</option>
                                        <option value="Días">Días</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase mb-1">Costo Total ($)</label>
                                    <input type="number" id="rec-labor-cost" class="w-full bg-[#1c2127] border border-[#324d67] text-primary font-mono font-bold rounded-lg px-2 py-2 outline-none focus:border-primary text-right" value="0" oninput="window.stockModule.renderRecipePreview()">
                                </div>
                            </div>
                        </div>

                        <div class="bg-[#111a22] border border-[#324d67] p-5 rounded-xl shadow-lg">
                            <h4 class="text-xs font-bold text-green-500 uppercase tracking-widest border-b border-[#324d67] pb-2 mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px]">shopping_basket</span> Insumos a descontar
                            </h4>
                            <div class="flex gap-2">
                                <select id="rec-item-select" class="flex-1 bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 text-sm outline-none focus:border-primary">
                                    <option value="">Buscar en almacén...</option>
                                    ${invOptions}
                                </select>
                                <input type="number" id="rec-item-qty" class="w-16 bg-[#1c2127] border border-[#324d67] text-white rounded-lg px-2 text-center text-sm outline-none focus:border-primary" value="1">
                                <button onclick="window.stockModule.addTempRecipeItem()" class="bg-[#233648] hover:bg-green-600 text-white px-3 rounded-lg flex items-center justify-center transition-colors">
                                    <span class="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-[#111a22] border border-[#324d67] rounded-xl flex flex-col shadow-lg overflow-hidden h-full min-h-[300px]">
                        <h4 class="text-xs font-bold text-white uppercase tracking-widest bg-[#233648] p-3 text-center">Contenido del Paquete</h4>
                        
                        <div class="flex-1 overflow-y-auto bg-[#1c2127]">
                            <table class="w-full text-left text-xs text-white">
                                <thead class="bg-[#111a22] text-[#92adc9] sticky top-0 border-b border-[#324d67]">
                                    <tr><th class="p-2">Producto</th><th class="p-2 text-center">Uso</th><th class="p-2 text-right">Subtotal</th><th class="p-2"></th></tr>
                                </thead>
                                <tbody id="recipe-table-body" class="divide-y divide-[#324d67]">
                                    <tr><td colspan="4" class="text-center p-6 text-slate-500 font-mono text-[10px]">Agrega productos a la receta.</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="bg-[#111a22] p-4 border-t border-[#324d67]">
                            <div class="flex justify-between items-center mb-1 text-xs text-[#92adc9]">
                                <span>Total Refacciones:</span><span id="lbl-parts-cost" class="font-mono text-white">$0.00</span>
                            </div>
                            <div class="flex justify-between items-center mb-3 text-xs text-[#92adc9]">
                                <span>Mano de Obra:</span><span id="lbl-labor-cost" class="font-mono text-white">$0.00</span>
                            </div>
                            <div class="flex justify-between items-center pt-2 border-t border-[#324d67]">
                                <span class="font-bold text-white uppercase tracking-widest text-sm">Costo del Servicio:</span>
                                <span id="lbl-grand-total" class="font-black text-xl text-green-400 font-mono">$0.00</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div class="pt-4 mt-2 shrink-0 border-t border-[#324d67]">
                <button onclick="window.stockModule.saveRecipe()" class="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">save</span> Guardar Configuración de Servicio
                </button>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    addTempRecipeItem() {
        const select = document.getElementById('rec-item-select');
        const qty = parseFloat(document.getElementById('rec-item-qty').value);
        const opt = select.options[select.selectedIndex];
        
        if(!opt || !select.value || qty <= 0) return alert("Selecciona un insumo válido.");

        // Si ya existe, suma cantidad
        const exists = this.tempRecipeItems.find(i => i.id === select.value);
        if(exists) exists.qty += qty;
        else {
            this.tempRecipeItems.push({ 
                id: select.value, 
                name: opt.dataset.name, 
                unit: opt.dataset.unit,
                cost: parseFloat(opt.dataset.cost), 
                qty: qty 
            });
        }
        
        this.renderRecipePreview();
        document.getElementById('rec-item-select').value = "";
        document.getElementById('rec-item-qty').value = 1;
    }

    removeTempRecipeItem(index) {
        this.tempRecipeItems.splice(index, 1);
        this.renderRecipePreview();
    }

    renderRecipePreview() {
        const tbody = document.getElementById('recipe-table-body');
        const laborCost = parseFloat(document.getElementById('rec-labor-cost').value) || 0;
        let partsTotal = 0;

        if(this.tempRecipeItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-500 font-mono text-[10px]">Sin insumos.</td></tr>';
        } else {
            tbody.innerHTML = this.tempRecipeItems.map((item, idx) => {
                const sub = item.cost * item.qty;
                partsTotal += sub;
                return `<tr class="hover:bg-[#233648]/30">
                    <td class="p-2 font-bold truncate max-w-[150px]" title="${item.name}">${item.name}</td>
                    <td class="p-2 text-center text-primary font-mono">${item.qty} <span class="text-[9px]">${item.unit}</span></td>
                    <td class="p-2 text-right font-mono">$${sub.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="p-2 text-center">
                        <button onclick="window.stockModule.removeTempRecipeItem(${idx})" class="text-red-400 hover:text-red-500 p-1">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                        </button>
                    </td>
                </tr>`;
            }).join('');
        }

        document.getElementById('lbl-parts-cost').innerText = `$${partsTotal.toLocaleString(undefined, {minimumFractionDigits:2})}`;
        document.getElementById('lbl-labor-cost').innerText = `$${laborCost.toLocaleString(undefined, {minimumFractionDigits:2})}`;
        document.getElementById('lbl-grand-total').innerText = `$${(partsTotal + laborCost).toLocaleString(undefined, {minimumFractionDigits:2})}`;
    }

    async saveRecipe() {
        const name = document.getElementById('rec-name').value;
        const desc = document.getElementById('rec-desc').value;
        const l_time = document.getElementById('rec-labor-time').value;
        const l_unit = document.getElementById('rec-labor-unit').value;
        const l_cost = document.getElementById('rec-labor-cost').value;
        
        if(!name) return alert("El nombre del servicio es obligatorio.");
        // Permitimos guardar recetas solo de mano de obra (sin insumos)

        const { data, error } = await supabase.from('service_templates').insert([{ 
            name: name, 
            description: desc,
            labor_time: l_time,
            labor_unit: l_unit,
            labor_cost: l_cost
        }]).select();
        
        if(error) return alert("Error al guardar servicio: " + error.message);

        if(this.tempRecipeItems.length > 0) {
            const items = this.tempRecipeItems.map(i => ({ 
                template_id: data[0].id, 
                item_id: i.id, 
                quantity: i.qty 
            }));
            await supabase.from('service_template_items').insert(items);
        }
        
        alert("✅ Receta de servicio guardada en el catálogo.");
        document.getElementById('stock-modal').classList.add('hidden');
        await this.loadData();
    }
}
