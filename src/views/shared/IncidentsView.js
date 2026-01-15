import { supabase } from '../../config/supabaseClient.js';

export class IncidentsView {
    
    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-4xl mx-auto pb-20">
            <div class="flex items-center justify-between border-b border-[#324d67] pb-4">
                <div>
                    <h2 class="text-2xl font-black text-white tracking-tight text-red-500 flex items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">warning</span>
                        Nuevo Reporte de Incidente
                    </h2>
                    <p class="text-[#92adc9] text-sm mt-1">Documentación obligatoria con evidencia fotográfica.</p>
                </div>
            </div>

            <section class="space-y-4">
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="bg-[#324d67] text-white size-6 rounded-full flex items-center justify-center text-xs">1</span>
                    Tipo de Incidente
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label class="cursor-pointer group">
                        <input type="radio" name="inc_type" value="colision" class="peer sr-only">
                        <div class="p-4 rounded-xl bg-[#1c2127] border border-[#324d67] peer-checked:border-red-500 peer-checked:bg-red-500/10 hover:bg-[#232b34] transition-all flex flex-col items-center gap-2 h-full justify-center">
                            <span class="material-symbols-outlined text-3xl text-slate-400 peer-checked:text-red-500 group-hover:scale-110 transition-transform">car_crash</span>
                            <span class="text-xs font-bold text-white uppercase text-center">Colisión</span>
                        </div>
                    </label>
                    <label class="cursor-pointer group">
                        <input type="radio" name="inc_type" value="mecanico" class="peer sr-only">
                        <div class="p-4 rounded-xl bg-[#1c2127] border border-[#324d67] peer-checked:border-orange-500 peer-checked:bg-orange-500/10 hover:bg-[#232b34] transition-all flex flex-col items-center gap-2 h-full justify-center">
                            <span class="material-symbols-outlined text-3xl text-slate-400 peer-checked:text-orange-500 group-hover:scale-110 transition-transform">build</span>
                            <span class="text-xs font-bold text-white uppercase text-center">Falla Mecánica</span>
                        </div>
                    </label>
                    <label class="cursor-pointer group">
                        <input type="radio" name="inc_type" value="robo" class="peer sr-only">
                        <div class="p-4 rounded-xl bg-[#1c2127] border border-[#324d67] peer-checked:border-purple-500 peer-checked:bg-purple-500/10 hover:bg-[#232b34] transition-all flex flex-col items-center gap-2 h-full justify-center">
                            <span class="material-symbols-outlined text-3xl text-slate-400 peer-checked:text-purple-500 group-hover:scale-110 transition-transform">local_police</span>
                            <span class="text-xs font-bold text-white uppercase text-center">Robo / Asalto</span>
                        </div>
                    </label>
                    <label class="cursor-pointer group">
                        <input type="radio" name="inc_type" value="otro" class="peer sr-only">
                        <div class="p-4 rounded-xl bg-[#1c2127] border border-[#324d67] peer-checked:border-blue-500 peer-checked:bg-blue-500/10 hover:bg-[#232b34] transition-all flex flex-col items-center gap-2 h-full justify-center">
                            <span class="material-symbols-outlined text-3xl text-slate-400 peer-checked:text-blue-500 group-hover:scale-110 transition-transform">edit_note</span>
                            <span class="text-xs font-bold text-white uppercase text-center">Otro</span>
                        </div>
                    </label>
                </div>
            </section>

            <section class="space-y-4">
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="bg-[#324d67] text-white size-6 rounded-full flex items-center justify-center text-xs">2</span>
                    Vehículo Involucrado
                </h3>
                <div class="relative">
                    <select id="inc-vehicle" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500">
                        <option value="">Cargando lista de flota...</option>
                        </select>
                    <span class="absolute right-4 top-3.5 material-symbols-outlined text-slate-500 pointer-events-none">expand_more</span>
                </div>
            </section>

            <section class="space-y-4">
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="bg-[#324d67] text-white size-6 rounded-full flex items-center justify-center text-xs">3</span>
                    Evidencia Fotográfica
                </h3>
                <p class="text-xs text-[#92adc9]">Toque cada recuadro para tomar o subir una foto.</p>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label class="relative aspect-square rounded-xl border-2 border-dashed border-[#324d67] bg-[#1c2127] hover:border-white/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden" id="preview-container-1">
                        <input type="file" accept="image/*" capture="environment" class="hidden file-input" data-index="1">
                        <span class="material-symbols-outlined text-slate-500 group-hover:text-white z-10">add_a_photo</span>
                        <span class="text-[10px] text-slate-500 uppercase font-bold z-10">Frente</span>
                        <img id="img-preview-1" class="absolute inset-0 w-full h-full object-cover hidden">
                    </label>

                    <label class="relative aspect-square rounded-xl border-2 border-dashed border-[#324d67] bg-[#1c2127] hover:border-white/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden" id="preview-container-2">
                        <input type="file" accept="image/*" capture="environment" class="hidden file-input" data-index="2">
                        <span class="material-symbols-outlined text-slate-500 group-hover:text-white z-10">add_a_photo</span>
                        <span class="text-[10px] text-slate-500 uppercase font-bold z-10">Trasera</span>
                        <img id="img-preview-2" class="absolute inset-0 w-full h-full object-cover hidden">
                    </label>

                    <label class="relative aspect-square rounded-xl border-2 border-dashed border-[#324d67] bg-[#1c2127] hover:border-white/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden" id="preview-container-3">
                        <input type="file" accept="image/*" capture="environment" class="hidden file-input" data-index="3">
                        <span class="material-symbols-outlined text-slate-500 group-hover:text-white z-10">add_a_photo</span>
                        <span class="text-[10px] text-slate-500 uppercase font-bold z-10">Lateral D.</span>
                        <img id="img-preview-3" class="absolute inset-0 w-full h-full object-cover hidden">
                    </label>

                    <label class="relative aspect-square rounded-xl border-2 border-dashed border-[#324d67] bg-[#1c2127] hover:border-white/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden" id="preview-container-4">
                        <input type="file" accept="image/*" capture="environment" class="hidden file-input" data-index="4">
                        <span class="material-symbols-outlined text-slate-500 group-hover:text-white z-10">add_a_photo</span>
                        <span class="text-[10px] text-slate-500 uppercase font-bold z-10">Lateral I.</span>
                        <img id="img-preview-4" class="absolute inset-0 w-full h-full object-cover hidden">
                    </label>
                </div>
            </section>

            <section class="space-y-4">
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="bg-[#324d67] text-white size-6 rounded-full flex items-center justify-center text-xs">4</span>
                    Detalles del Incidente
                </h3>
                <textarea id="inc-desc" class="w-full h-32 bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:ring-red-500 focus:border-red-500 resize-none" placeholder="Describa qué pasó, la ubicación exacta y detalles importantes..."></textarea>
            </section>

            <div class="flex gap-4 pt-6 border-t border-[#324d67]">
                <button onclick="window.history.back()" class="flex-1 py-3 rounded-xl border border-[#324d67] text-slate-400 font-bold hover:bg-[#1c2127] hover:text-white transition-colors">
                    Cancelar
                </button>
                <button id="btn-submit-incident" class="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">send</span>
                    Enviar Reporte
                </button>
            </div>
        </div>
        `;
    }

    async onMount() {
        console.log("Vista Incidentes cargada.");
        await this.loadVehicles();
        this.setupImagePreviews();

        document.getElementById('btn-submit-incident').addEventListener('click', () => this.submitIncident());
    }

    async loadVehicles() {
        try {
            const { data: vehicles } = await supabase.from('vehicles').select('id, economic_number, model');
            const select = document.getElementById('inc-vehicle');
            
            if (vehicles && vehicles.length > 0) {
                select.innerHTML = '<option value="">Seleccionar unidad...</option>' + 
                    vehicles.map(v => `<option value="${v.id}">${v.economic_number} - ${v.model}</option>`).join('');
            } else {
                select.innerHTML = '<option value="">No hay vehículos disponibles</option>';
            }
        } catch (err) {
            console.error("Error cargando vehículos:", err);
        }
    }

    setupImagePreviews() {
        // Manejar la previsualización de imágenes cuando el usuario selecciona un archivo
        document.querySelectorAll('.file-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const index = e.target.dataset.index;
                    const img = document.getElementById(`img-preview-${index}`);
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        img.src = e.target.result;
                        img.classList.remove('hidden');
                        // Opcional: Ocultar el icono y texto para mostrar solo la foto
                        input.parentElement.classList.add('border-primary'); // Marcar como seleccionado
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    async submitIncident() {
        const btn = document.getElementById('btn-submit-incident');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        // Recopilar datos
        const type = document.querySelector('input[name="inc_type"]:checked')?.value || 'otro';
        const vehicleId = document.getElementById('inc-vehicle').value;
        const desc = document.getElementById('inc-desc').value;
        
        // Simular recopilación de URLs de imágenes (En producción aquí se subirían al Storage)
        // Para este Alpha, solo contamos cuántas imágenes se seleccionaron
        const imagesSelected = document.querySelectorAll('.file-input').length; // Esto cuenta los inputs, deberíamos contar los que tienen archivos
        let evidenceCount = 0;
        document.querySelectorAll('.file-input').forEach(i => { if(i.files.length > 0) evidenceCount++; });

        if (!vehicleId || !desc) {
            alert("Por favor complete: \n- Selección de vehículo\n- Descripción del incidente");
            btn.innerText = "Enviar Reporte";
            btn.disabled = false;
            return;
        }

        try {
            // Simulamos el ID del usuario actual (Juan Perez)
            const driverId = 'd0c1e2f3-0000-0000-0000-000000000001'; 

            // Insertar en Base de Datos
            const { error } = await supabase.from('incidents').insert({
                vehicle_id: vehicleId,
                driver_id: driverId,
                severity: 'medium', // Default para alpha
                description: `[${type.toUpperCase()}] ${desc} (${evidenceCount} fotos adjuntas)`,
                status: 'pending',
                // En un sistema real, aquí iría el array de URLs reales de las fotos subidas
                evidence_urls: evidenceCount > 0 ? ['https://placeholder.com/evidence1.jpg'] : [] 
            });

            if (error) throw error;

            alert("🚨 Incidente registrado correctamente. \n\nAdministración ha sido notificada y las fotos han sido adjuntadas al expediente.");
            window.location.hash = '#dashboard';

        } catch (err) {
            console.error(err);
            alert("Error al enviar reporte: " + err.message);
            btn.innerText = "Reintentar";
            btn.disabled = false;
        }
    }
}