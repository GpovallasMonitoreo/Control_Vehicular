import { supabase } from '../../config/supabaseClient.js';

export class TallerView {
    constructor() {
        // Variables de estado iniciales para el módulo mecánico
        this.activeTab = 'recepcion';
        window.moduloTaller = this; // Exponemos la clase globalmente para los onclick de HTML
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10 p-6">
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#324d67] pb-6">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-purple-500 text-4xl">handyman</span>
                        Módulo de Taller Mecánico
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal">Recepción, diagnóstico, reparación y control de bitácoras.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button class="flex items-center justify-center gap-2 h-10 px-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">add</span>
                        <span>Ingresar Vehículo al Taller</span>
                    </button>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="window.moduloTaller.switchTab('recepcion')" id="taller-tab-recepcion" class="px-6 py-3 rounded-t-xl bg-[#1c2127] text-white border-t border-x border-purple-500 font-bold text-sm transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">car_repair</span> Recepción y Diagnóstico
                </button>
                <button onclick="window.moduloTaller.switchTab('reparacion')" id="taller-tab-reparacion" class="px-6 py-3 rounded-t-xl text-[#92adc9] hover:text-white border-b border-[#324d67] font-medium text-sm transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">build_circle</span> En Reparación
                </button>
                <button onclick="window.moduloTaller.switchTab('liberados')" id="taller-tab-liberados" class="px-6 py-3 rounded-t-xl text-[#92adc9] hover:text-white border-b border-[#324d67] font-medium text-sm transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">task_alt</span> Vehículos Liberados
                </button>
            </div>

            <div class="flex-1 bg-[#1c2127] border border-[#324d67] rounded-b-xl rounded-tr-xl p-6 shadow-xl relative overflow-hidden flex flex-col -mt-6">
                
                <div id="taller-view-recepcion" class="space-y-6 animate-fade-in block h-full">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-md flex flex-col">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-[#324d67] pb-3">
                                <span class="material-symbols-outlined text-purple-400">qr_code_scanner</span> Escanear Unidad
                            </h3>
                            <div class="flex-1 bg-black rounded-lg border border-[#324d67] flex items-center justify-center text-slate-500">
                                <p>[ Área del Escáner de QR ]</p>
                            </div>
                        </div>

                        <div class="bg-[#111a22] border border-[#324d67] rounded-xl p-6 shadow-md">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-[#324d67] pb-3">
                                <span class="material-symbols-outlined text-blue-400">assignment</span> Checklist de Ingreso
                            </h3>
                            <div class="space-y-4 text-slate-400 text-sm italic">
                                <p>Aquí puedes construir el formulario para detallar los problemas del vehículo, tomar fotos iniciales y generar la orden de trabajo.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="taller-view-reparacion" class="hidden animate-fade-in h-full">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                        <span class="material-symbols-outlined text-6xl mb-4 opacity-50">engineering</span>
                        <h2 class="text-xl font-bold text-white mb-2">Unidades en el Taller</h2>
                        <p>Lista de vehículos que actualmente están siendo intervenidos por los mecánicos.</p>
                    </div>
                </div>

                <div id="taller-view-liberados" class="hidden animate-fade-in h-full">
                    <div class="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                        <span class="material-symbols-outlined text-6xl mb-4 opacity-50 text-green-500">verified</span>
                        <h2 class="text-xl font-bold text-white mb-2">Historial de Trabajos</h2>
                        <p>Registro de las unidades que ya fueron reparadas y entregadas a los conductores.</p>
                    </div>
                </div>

            </div>
        </div>
        `;
    }

    async onMount() {
        console.log("🛠️ Vista del Taller Mecánico montada correctamente.");
        // Aquí puedes cargar la información desde Supabase
    }

    switchTab(tabId) {
        // Resetear todos los botones y contenedores
        ['recepcion', 'reparacion', 'liberados'].forEach(t => {
            const btn = document.getElementById(`taller-tab-${t}`);
            const view = document.getElementById(`taller-view-${t}`);
            
            if(btn) {
                btn.className = "px-6 py-3 rounded-t-xl text-[#92adc9] hover:text-white border-b border-[#324d67] font-medium text-sm transition-colors flex items-center gap-2";
            }
            if(view) {
                view.classList.replace('block', 'hidden');
            }
        });

        // Activar la pestaña seleccionada
        const activeBtn = document.getElementById(`taller-tab-${tabId}`);
        const activeView = document.getElementById(`taller-view-${tabId}`);
        
        if (activeBtn) {
            activeBtn.className = "px-6 py-3 rounded-t-xl bg-[#1c2127] text-white border-t border-x border-purple-500 font-bold text-sm transition-colors flex items-center gap-2";
        }
        if (activeView) {
            activeView.classList.replace('hidden', 'block');
        }
        
        this.activeTab = tabId;
    }

    // Función de limpieza al cambiar de vista (para apagar cámara del escáner, etc.)
    destroy() {
        console.log("🧹 Limpiando vista del Taller...");
        // this.html5QrcodeScanner.clear(); // Ejemplo si usas el escáner
    }
}
