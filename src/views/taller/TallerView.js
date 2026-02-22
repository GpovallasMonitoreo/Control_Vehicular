import { supabase } from '../../config/supabaseClient.js';

export class TallerView {
    constructor() {
        this.vehicles = [];
        this.inventory = [];
        this.services = [];
        this.selectedVehicle = null;
        this.tempItems = [];
        this.capturedImages = [];
        this.html5QrcodeScanner = null;

        window.mecanico = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1200px] mx-auto pb-20 p-4 md:p-6">
            
            <div class="flex flex-col gap-1 border-b border-[#324d67] pb-4">
                <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                    <span class="material-symbols-outlined text-purple-500 text-4xl">home_repair_service</span>
                    Área de Trabajo Mecánico
                </h1>
                <p class="text-[#92adc9] text-sm font-normal">Escanea la unidad, registra la reparación, descuenta piezas y libera.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-xl h-fit">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-[#324d67] pb-2">
                        <span class="material-symbols-outlined text-primary">qr_code_scanner</span> 1. Identificar Unidad
                    </h3>
                    
                    <div id="reader" class="w-full bg-black rounded-lg overflow-hidden border border-[#324d67] aspect-square mb-4"></div>
                    
                    <div class="text-center text-[10px] text-[#92adc9] font-bold uppercase my-3">- O SELECCIÓN MANUAL -</div>
                    
                    <select id="mec-vehicle-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" onchange="window.mecanico.loadVehicle(this.value)">
                        <option value="">Cargando unidades...</option>
                    </select>

                    <div id="mec-vehicle-card" class="mt-4 bg-[#111a22] border border-purple-500/50 p-4 rounded-lg hidden animate-fade-in">
                        <p class="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Unidad en Bahía</p>
                        <h4 id="mec-plate" class="text-2xl font-black text-white leading-none">--</h4>
                        <p id="mec-model" class="text-sm text-[#92adc9] mt-1">--</p>
                    </div>
                </div>

                <div id="mec-repair-area" class="lg:col-span-2 space-y-6 opacity-50 pointer-events-none transition-opacity">
                    
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-xl">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-orange-500">build</span> 2. Detalle de la Reparación
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Nombre de la Reparación</label>
                                <input type="text" id="mec-service-name" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary" placeholder="Ej: Afinación y Cambio de Balatas">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">KM Actual</label>
                                    <input type="number" id="mec-km" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary font-mono text-center">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Tiempo de Espera</label>
                                    <input type="text" id="mec-wait" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-orange-500 text-center" placeholder="Ej: 3 horas">
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Observaciones Mecánicas</label>
                            <textarea id="mec-notes" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 outline-none focus:border-primary h-16 text-sm" placeholder="Detalla los arreglos hechos o pendientes..."></textarea>
                        </div>

                        <div class="bg-[#111a22] border border-[#324d67] rounded-lg p-4 mb-4">
                            <div class="flex justify-between items-center mb-3">
                                <p class="text-[10px] font-bold text-[#92adc9] uppercase tracking-wider">Evidencia Fotográfica de la Reparación</p>
                                <input type="file" accept="image/*" capture="environment" id="mec-camera" class="hidden" onchange="window.mecanico.captureImage(this)">
                                <label for="mec-camera" class="bg-[#233648] hover:bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors">
                                    <span class="material-symbols-outlined text-[16px]">add_a_photo</span> Tomar Foto
                                </label>
                            </div>
                            <div id="mec-images-container" class="grid grid-cols-3 md:grid-cols-5 gap-2">
                                <div class="col-span-full text-center text-[#92adc9] text-[10px] py-4 border border-dashed border-[#324d67] rounded-lg">Sin fotos adjuntas</div>
                            </div>
                        </div>

                        <div class="border-t border-[#324d67] pt-4">
                            <label class="block text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">3. Refacciones a Descontar (Opcional)</label>
                            
                            <div class="flex gap-2 mb-3">
                                <select id="mec-recipe-select" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg px-2 py-2 text-sm outline-none focus:border-primary" onchange="window.mecanico.applyRecipe()">
                                    <option value="">Cargar paquete (Afinación, Frenos...)</option>
                                </select>
                            </div>

                            <div class="flex gap-2 mb-3">
                                <select id="mec-item-select" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg px-2 text-sm outline-none focus:border-primary">
                                    <option value="">Añadir insumo suelto...</option>
                                </select>
                                <input type="number" id="mec-item-qty" class="w-16 bg-[#111a22] border border-[#324d67] text-white rounded-lg px-2 text-center text-sm outline-none focus:border-primary" value="1" min="1">
                                <button onclick="window.mecanico.addManualItem()" class="bg-[#233648] hover:bg-green-600 text-white px-3 rounded-lg flex items-center transition-colors">
                                    <span class="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>

                            <div class="border border-[#324d67] rounded-lg overflow-hidden bg-[#111a22]">
                                <table class="w-full text-left text-xs text-white">
                                    <thead class="bg-[#233648] text-[#92adc9]"><tr><th class="p-2">Pieza</th><th class="p-2 text-center">Cant</th><th class="p-2 text-right">Costo</th><th class="p-2"></th></tr></thead>
                                    <tbody id="mec-parts-list" class="divide-y divide-[#324d67]">
                                        <tr><td colspan="4" class="text-center p-4 text-slate-500 text-[10px]">Sin piezas agregadas.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-bold text-[#92adc9] uppercase tracking-wider mb-1">Mano de Obra ($)</label>
                                <input type="number" id="mec-labor" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-2 outline-none focus:border-primary font-mono text-right" value="0" oninput="window.mecanico.renderPartsList()">
                            </div>
                            <div class="bg-[#111a22] border border-[#324d67] rounded-lg p-2 flex flex-col items-end justify-center">
                                <span class="text-[10px] font-bold text-[#92adc9] uppercase tracking-wider">Inversión Total</span>
                                <span id="mec-total" class="text-xl font-black text-green-400 font-mono">$0.00</span>
                            </div>
                        </div>

                        <button id="btn-save-repair" onclick="window.mecanico.saveRepair()" class="w-full mt-6 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-black shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                            <span class="material-symbols-outlined">verified</span> Guardar y Liberar Vehículo
                        </button>

                    </div>
                </div>
            </div>
            
            <div id="mec-toast" class="hidden fixed bottom-6 right-6 z-[100] bg-[#1c2127] border border-primary text-white p-4 rounded-xl shadow-2xl animate-fade-in-up flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">info</span>
                <p id="mec-toast-msg" class="text-sm font-bold"></p>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadData();
        this.setupScanner();
    }

    async loadData() {
        if (!supabase) return;
        try {
            const [vehRes, invRes, recRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('economic_number').then(r=>r.error?{data:[]}:r),
                supabase.from('inventory_items').select('*').order('name').then(r=>r.error?{data:[]}:r),
                supabase.from('service_templates').select('*, service_template_items(quantity, inventory_items(id, name, cost, stock))').then(r=>r.error?{data:[]}:r)
            ]);

            this.vehicles = vehRes.data || [];
            this.inventory = invRes.data || [];
            this.services = recRes.data || [];

            const vehSelect = document.getElementById('mec-vehicle-select');
            if (vehSelect) {
                vehSelect.innerHTML = '<option value="">Selecciona unidad manualmente...</option>' + 
                    this.vehicles.map(v => `<option value="${v.id}">ECO-${v.economic_number} - ${v.plate}</option>`).join('');
            }

            const invSelect = document.getElementById('mec-item-select');
            if (invSelect) {
                invSelect.innerHTML = '<option value="">Buscar insumo...</option>' + 
                    this.inventory.map(i => `<option value="${i.id}" data-cost="${i.cost}" data-stock="${i.stock}" data-name="${i.name}">${i.name} (Stk: ${i.stock})</option>`).join('');
            }

            const recSelect = document.getElementById('mec-recipe-select');
            if (recSelect) {
                recSelect.innerHTML = '<option value="">Cargar paquete (opcional)...</option>' + 
                    this.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }

        } catch (e) {
            console.error("Error cargando datos:", e);
        }
    }

    setupScanner() {
        if(document.getElementById('reader') && !this.html5QrcodeScanner) {
            this.html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} });
            this.html5QrcodeScanner.render((text) => this.onScanSuccess(text), () => {});
        }
    }

    onScanSuccess(decodedText) {
        try {
            // El QR devuelve el ID del vehículo directamente
            const vId = decodedText.trim();
            if(vId) { 
                const select = document.getElementById('mec-vehicle-select');
                if (select) select.value = vId;
                this.loadVehicle(vId); 
            }
        } catch(e) { console.error("QR no válido"); }
    }

    loadVehicle(id) {
        this.selectedVehicle = this.vehicles.find(v => v.id === id);
        if(!this.selectedVehicle) return;

        document.getElementById('mec-plate').innerText = this.selectedVehicle.plate;
        document.getElementById('mec-model').innerText = `${this.selectedVehicle.brand} ${this.selectedVehicle.model}`;
        document.getElementById('mec-km').value = this.selectedVehicle.current_km;
        
        document.getElementById('mec-vehicle-card').classList.remove('hidden');
        document.getElementById('mec-repair-area').classList.remove('opacity-50', 'pointer-events-none');
    }

    captureImage(input) {
        if(input.files && input.files[0]) {
            this.capturedImages.push(input.files[0]);
            this.renderCapturedImages();
            input.value = ''; 
        }
    }

    renderCapturedImages() {
        const container = document.getElementById('mec-images-container');
        if(!container) return;

        if(this.capturedImages.length === 0) { 
            container.innerHTML = '<div class="col-span-full text-center text-[#92adc9] text-[10px] py-4 border border-dashed border-[#324d67] rounded-lg">Sin fotos adjuntas</div>'; 
            return; 
        }

        container.innerHTML = this.capturedImages.map((file, idx) => `
            <div class="relative w-full aspect-square rounded-lg overflow-hidden border border-[#324d67] shadow-lg">
                <img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover">
                <button onclick="window.mecanico.removeImage(${idx})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"><span class="material-symbols-outlined text-[12px]">close</span></button>
            </div>
        `).join('');
    }

    removeImage(idx) { 
        this.capturedImages.splice(idx, 1); 
        this.renderCapturedImages(); 
    }

    applyRecipe() {
        const recipeId = document.getElementById('mec-recipe-select').value;
        const template = this.services.find(s => s.id === recipeId);
        if(!template) return;
        
        if(!document.getElementById('mec-service-name').value) {
            document.getElementById('mec-service-name').value = template.name;
        }
        document.getElementById('mec-labor').value = template.labor_cost || 0;
        
        this.tempItems = template.service_template_items?.map(si => ({ 
            id: si.inventory_items.id, 
            name: si.inventory_items.name, 
            qty: si.quantity, 
            cost: si.inventory_items.cost,
            stock: si.inventory_items.stock
        })) || [];
        
        this.renderPartsList();
    }

    addManualItem() {
        const select = document.getElementById('mec-item-select');
        const qty = parseFloat(document.getElementById('mec-item-qty').value);
        const opt = select.options[select.selectedIndex];
        
        if (!opt || qty <= 0 || !select.value) return;
        
        const itemId = select.value;
        const stock = parseFloat(opt.dataset.stock);
        const cost = parseFloat(opt.dataset.cost);
        const name = opt.dataset.name;

        if (qty > stock) alert(`⚠️ Ojo: Quieres sacar ${qty} pero solo hay ${stock} en sistema.`);

        const existing = this.tempItems.find(i => i.id === itemId);
        if (existing) existing.qty += qty;
        else this.tempItems.push({ id: itemId, name, cost, qty, stock });
        
        this.renderPartsList();
        select.value = '';
        document.getElementById('mec-item-qty').value = 1;
    }

    removePart(idx) {
        this.tempItems.splice(idx, 1);
        this.renderPartsList();
    }

    renderPartsList() {
        const tbody = document.getElementById('mec-parts-list');
        const laborCost = parseFloat(document.getElementById('mec-labor').value) || 0;
        let partsTotal = 0;

        if(this.tempItems.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-slate-500 text-[10px]">Sin piezas agregadas.</td></tr>'; 
        } else {
            tbody.innerHTML = this.tempItems.map((i, idx) => { 
                const sub = i.qty * i.cost;
                partsTotal += sub; 
                return `
                <tr class="hover:bg-[#233648] transition-colors">
                    <td class="p-2 font-bold text-primary truncate max-w-[120px]" title="${i.name}">${i.name}</td>
                    <td class="p-2 text-center text-white font-mono">${i.qty}</td>
                    <td class="p-2 text-right text-green-400 font-mono">$${sub.toFixed(2)}</td>
                    <td class="p-2 text-center">
                        <button onclick="window.mecanico.removePart(${idx})" class="text-slate-500 hover:text-red-500 p-1 rounded transition-colors"><span class="material-symbols-outlined text-[14px]">delete</span></button>
                    </td>
                </tr>`; 
            }).join('');
        }
        document.getElementById('mec-total').innerText = `$${(partsTotal + laborCost).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    showToast(msg) {
        const toast = document.getElementById('mec-toast');
        const text = document.getElementById('mec-toast-msg');
        text.innerText = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }

    async saveRepair() {
        if (!this.selectedVehicle) return alert('Selecciona una unidad.');

        const serviceName = document.getElementById('mec-service-name').value;
        const laborCost = parseFloat(document.getElementById('mec-labor').value) || 0;
        const notes = document.getElementById('mec-notes').value;
        const waitTime = document.getElementById('mec-wait').value;
        const currentKm = parseInt(document.getElementById('mec-km').value) || this.selectedVehicle.current_km;

        if (!serviceName) return alert('El nombre de la reparación es obligatorio.');

        const btn = document.getElementById('btn-save-repair');
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Guardando...';

        try {
            // 1. Subir Fotografías si hay
            let uploadedPhotos = [];
            if (this.capturedImages.length > 0) {
                for (let file of this.capturedImages) {
                    const fileExt = file.name.split('.').pop() || 'jpg';
                    const fileName = `${this.selectedVehicle.id}/rep_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage.from('vehicle_documents').upload(fileName, file);
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('vehicle_documents').getPublicUrl(fileName);
                        uploadedPhotos.push({ url: publicUrl, name: file.name });
                    }
                }
            }

            // 2. Costos
            let partsTotal = 0;
            let partsStr = this.tempItems.length ? this.tempItems.map(i => `${i.qty}pz - ${i.name}`).join(', ') : 'Ninguna';
            this.tempItems.forEach(i => partsTotal += (i.qty * i.cost));

            // 3. Guardar en vehicle_logs
            const logData = {
                vehicle_id: this.selectedVehicle.id,
                date: new Date().toISOString().split('T')[0],
                odometer: currentKm,
                service_name: serviceName,
                parts_used: partsStr,
                total_cost: partsTotal + laborCost,
                labor_cost: laborCost,
                parts_cost: partsTotal,
                mechanic: localStorage.getItem('userName') || 'Mecánico',
                notes: notes,
                wait_time: waitTime,
                photos: uploadedPhotos
            };

            const { error: logErr } = await supabase.from('vehicle_logs').insert([logData]);
            if (logErr) throw logErr;

            // 4. Descontar Inventario
            for (let item of this.tempItems) {
                const stockActual = this.inventory.find(i => i.id === item.id)?.stock || 0;
                await supabase.from('inventory_items').update({ stock: stockActual - item.qty }).eq('id', item.id);
            }

            // 5. Liberar unidad (status = active) y actualizar KM
            await supabase.from('vehicles').update({ status: 'active', current_km: currentKm }).eq('id', this.selectedVehicle.id);

            // 6. Si había un viaje "en mantenimiento" (incidencia), podemos cerrarlo
            const { data: trip } = await supabase.from('trips').select('id').eq('vehicle_id', this.selectedVehicle.id).eq('status', 'incident_report').maybeSingle();
            if (trip) {
                await supabase.from('trips').update({ status: 'completed', incident_status: 'resolved', incident_resolved_at: new Date().toISOString() }).eq('id', trip.id);
            }

            this.showToast('✅ Unidad Reparada y Liberada Exitosamente.');
            
            // Reset y recarga
            setTimeout(() => {
                window.location.reload(); // Recargamos para limpiar toda la memoria y volver a inicio
            }, 1500);
            
        } catch (err) {
            console.error(err);
            alert('Error al guardar: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">verified</span> Guardar y Liberar Vehículo';
        }
    }

    destroy() {
        if (this.html5QrcodeScanner) {
            try { this.html5QrcodeScanner.clear(); } catch(e){}
        }
    }
}
