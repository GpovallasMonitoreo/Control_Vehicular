import { supabase } from '../../config/supabaseClient.js';

export class WorkshopView {
    constructor() {
        this.currentTrip = null;
        this.currentVehicle = null;
        this.currentDriver = null;
        this.receptionPhotos = [];
        this.deliveryPhotos = [];
        this.driverPhoto = null;
        this.html5QrCode = null;
        this.checklistItems = {
            liquid: false,
            oil: false,
            coolant: false,
            lights: false,
            tires: false
        };
        this.receptionMode = null;
        window.workshopView = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <!-- Header del Taller -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-4xl">handyman</span>
                        Taller Central
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal">Recepción de unidades, checklist y liberación</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.workshopView.switchMode('scanner')" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                        <span>Escanear Unidad</span>
                    </button>
                </div>
            </div>

            <!-- Pestañas de navegación -->
            <div class="flex border-b border-[#324d67] overflow-x-auto custom-scrollbar shrink-0">
                <button onclick="window.workshopView.switchMode('scanner')" id="tab-scanner" class="px-6 py-3 text-primary border-b-2 border-primary font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">qr_code_scanner</span> Escáner
                </button>
                <button onclick="window.workshopView.switchMode('pending')" id="tab-pending" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">pending_actions</span> Pendientes
                </button>
                <button onclick="window.workshopView.switchMode('completed')" id="tab-completed" class="px-6 py-3 text-[#92adc9] hover:text-white border-b-2 border-transparent font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">history</span> Completados
                </button>
            </div>

            <!-- CONTENIDO PRINCIPAL -->
            <div class="flex-1 relative overflow-hidden flex flex-col">
                
                <!-- MODO ESCÁNER -->
                <div id="mode-scanner" class="space-y-6 animate-fade-in block overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Columna Izquierda - Escáner -->
                        <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                <span class="material-symbols-outlined text-primary">qr_code_scanner</span> Escanear QR de Unidad
                            </h3>
                            
                            <div id="reader" class="w-full bg-black rounded-lg overflow-hidden border border-[#324d67] aspect-square mb-4"></div>
                            
                            <div class="text-center text-xs text-[#92adc9] font-bold uppercase my-2">- O MANUAL -</div>
                            
                            <div class="flex gap-2">
                                <input type="text" id="manual-vehicle-input" class="flex-1 bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm" placeholder="ECO o Placa...">
                                <button onclick="window.workshopView.loadVehicleByEcoOrPlate()" class="bg-primary text-white px-4 rounded-lg text-sm font-bold">Buscar</button>
                            </div>
                            
                            <div id="scanner-result" class="mt-4 hidden">
                                <div class="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
                                    <p class="text-white text-sm" id="scanner-message">Esperando vehículo...</p>
                                </div>
                            </div>
                        </div>

                        <!-- Columna Derecha - Información de la unidad -->
                        <div id="vehicle-info-panel" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                                <span class="material-symbols-outlined text-primary">directions_car</span> Información de la Unidad
                            </h3>
                            
                            <div class="space-y-4">
                                <div class="bg-[#111a22] p-4 rounded-lg border border-[#324d67]">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="text-[10px] text-[#92adc9] uppercase">Unidad</p>
                                            <h4 id="vehicle-plate" class="text-2xl font-black text-white">--</h4>
                                            <p id="vehicle-model" class="text-sm text-[#92adc9] mt-1">--</p>
                                        </div>
                                        <span id="vehicle-eco" class="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">ECO-?</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p class="text-[10px] text-[#92adc9]">Kilometraje</p>
                                            <p id="vehicle-km" class="text-white font-mono font-bold">0 km</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] text-[#92adc9]">Conductor</p>
                                            <p id="vehicle-driver" class="text-white font-bold">--</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tipo de recepción (inicial o final) -->
                                <div id="reception-type-container" class="bg-[#111a22] p-4 rounded-lg border border-[#324d67] hidden">
                                    <p class="text-xs text-[#92adc9] mb-2">Tipo de recepción:</p>
                                    <div id="reception-type-badge" class="text-sm font-bold"></div>
                                </div>

                                <!-- Botón de acción según el tipo -->
                                <button id="btn-start-process" onclick="window.workshopView.startProcess()" 
                                        class="w-full py-4 bg-primary text-white font-bold rounded-xl hidden">
                                    INICIAR PROCESO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODO PROCESO DE TALLER -->
                <div id="mode-process" class="hidden animate-fade-in overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <!-- Cabecera dinámica -->
                        <div id="process-header" class="flex justify-between items-center mb-6"></div>

                        <!-- Información del viaje -->
                        <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67] mb-6">
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <span class="material-symbols-outlined text-3xl">directions_car</span>
                                </div>
                                <div>
                                    <p class="text-[10px] text-[#92adc9] uppercase">Unidad en proceso</p>
                                    <h4 id="process-vehicle-info" class="text-white font-bold text-xl">--</h4>
                                    <p id="process-conductor" class="text-sm text-[#92adc9]">Conductor: --</p>
                                </div>
                            </div>
                        </div>

                        <!-- CONTENIDO DINÁMICO -->
                        <div id="process-content" class="space-y-6"></div>

                        <!-- Botones de acción -->
                        <div class="mt-8 flex gap-3">
                            <button onclick="window.workshopView.cancelProcess()" class="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors">
                                CANCELAR
                            </button>
                            <button id="btn-complete-process" onclick="window.workshopView.completeProcess()" 
                                    class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                COMPLETAR PROCESO
                            </button>
                        </div>
                    </div>
                </div>

                <!-- MODO PENDIENTES -->
                <div id="mode-pending" class="hidden animate-fade-in overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Recepciones Iniciales -->
                        <div class="bg-[#1c2127] border border-orange-500/30 rounded-xl p-4">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                                <span class="material-symbols-outlined text-orange-500">engineering</span> Recepciones Iniciales
                            </h3>
                            <div id="pending-initial-list" class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                <p class="text-slate-500 text-center text-xs">Cargando...</p>
                            </div>
                        </div>

                        <!-- Recepciones Finales -->
                        <div class="bg-[#1c2127] border border-green-500/30 rounded-xl p-4">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                                <span class="material-symbols-outlined text-green-500">assignment_return</span> Retornos Pendientes
                            </h3>
                            <div id="pending-final-list" class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                <p class="text-slate-500 text-center text-xs">Cargando...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODO COMPLETADOS -->
                <div id="mode-completed" class="hidden animate-fade-in overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6">
                        <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-green-500">check_circle</span> Últimos Viajes Completados
                        </h3>
                        <div id="completed-list" class="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                            <p class="text-slate-500 text-center text-xs">Cargando...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadPendingLists();
        await this.loadCompletedTrips();
        this.switchMode('scanner');
        
        setInterval(() => {
            this.loadPendingLists();
            this.loadCompletedTrips();
        }, 10000);
    }

    switchMode(mode) {
        const modes = ['scanner', 'process', 'pending', 'completed'];
        modes.forEach(m => {
            const el = document.getElementById(`mode-${m}`);
            if (el) el.classList.add('hidden');
        });

        ['scanner', 'pending', 'completed'].forEach(tab => {
            const tabEl = document.getElementById(`tab-${tab}`);
            if (tabEl) {
                tabEl.classList.remove('text-primary', 'border-primary');
                tabEl.classList.add('text-[#92adc9]', 'border-transparent');
            }
        });

        const modeEl = document.getElementById(`mode-${mode}`);
        if (modeEl) modeEl.classList.remove('hidden');

        const tabEl = document.getElementById(`tab-${mode}`);
        if (tabEl) {
            tabEl.classList.remove('text-[#92adc9]', 'border-transparent');
            tabEl.classList.add('text-primary', 'border-primary');
        }

        if (mode === 'scanner') {
            setTimeout(() => this.initScanner(), 100);
        }
    }

    async loadVehicleByEcoOrPlate() {
        const input = document.getElementById('manual-vehicle-input');
        if (!input.value.trim()) {
            alert('Ingresa un número económico o placa');
            return;
        }

        const searchTerm = input.value.trim().toUpperCase();
        
        try {
            const { data: vehicles, error } = await supabase
                .from('vehicles')
                .select('*')
                .or(`economic_number.ilike.%${searchTerm}%,plate.ilike.%${searchTerm}%`)
                .limit(1);

            if (error) throw error;
            if (!vehicles || vehicles.length === 0) {
                alert('Vehículo no encontrado');
                return;
            }

            await this.handleScannedVehicle(vehicles[0]);
        } catch (error) {
            console.error('Error buscando vehículo:', error);
            alert('Error al buscar vehículo');
        }
    }

    async initScanner() {
        if (this.html5QrCode) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
            } catch (e) {
                console.log('Error deteniendo scanner:', e);
            }
        }

        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        try {
            if (typeof Html5Qrcode === 'undefined') {
                await this.loadHtml5Qrcode();
            }

            this.html5QrCode = new Html5Qrcode("reader");
            
            const qrCodeSuccessCallback = async (decodedText) => {
                try {
                    await this.html5QrCode.stop();
                    
                    const { data: vehicle, error } = await supabase
                        .from('vehicles')
                        .select('*')
                        .eq('id', decodedText)
                        .single();

                    if (error || !vehicle) {
                        this.showScannerMessage('Vehículo no encontrado', 'error');
                        return;
                    }

                    await this.handleScannedVehicle(vehicle);
                } catch (error) {
                    console.error('Error al procesar QR:', error);
                    this.showScannerMessage('Error al procesar QR', 'error');
                }
            };

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await this.html5QrCode.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback,
                () => {}
            );
        } catch (error) {
            console.error('Error iniciando escáner:', error);
            readerElement.innerHTML = '<p class="text-red-500 p-4">Error al iniciar la cámara</p>';
        }
    }

    loadHtml5Qrcode() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    showScannerMessage(message, type = 'info') {
        const resultDiv = document.getElementById('scanner-result');
        const messageEl = document.getElementById('scanner-message');
        
        if (resultDiv && messageEl) {
            resultDiv.classList.remove('hidden');
            messageEl.innerText = message;
            
            const bgColor = type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30';
            resultDiv.className = `mt-4 ${bgColor} p-4 rounded-lg`;
        }
    }

    async handleScannedVehicle(vehicle) {
        this.currentVehicle = vehicle;

        document.getElementById('vehicle-info-panel').classList.remove('hidden');
        document.getElementById('vehicle-plate').innerText = vehicle.plate || '--';
        document.getElementById('vehicle-model').innerText = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '--';
        document.getElementById('vehicle-eco').innerText = `ECO-${vehicle.economic_number || '?'}`;
        document.getElementById('vehicle-km').innerText = `${vehicle.current_km || 0} km`;

        const { data: activeTrip, error } = await supabase
            .from('trips')
            .select(`
                *,
                driver:driver_id(full_name, photo_url)
            `)
            .eq('vehicle_id', vehicle.id)
            .in('status', ['approved_for_taller', 'in_progress', 'awaiting_return_checklist'])
            .maybeSingle();

        if (error) {
            console.error('Error buscando viaje activo:', error);
        }

        if (activeTrip) {
            this.currentTrip = activeTrip;
            this.currentDriver = activeTrip.driver;
            
            document.getElementById('vehicle-driver').innerText = activeTrip.driver?.full_name || '--';

            let receptionType = '';
            let receptionMode = null;
            
            if (activeTrip.status === 'approved_for_taller') {
                receptionType = 'Recepción Inicial (Salida)';
                receptionMode = 'initial';
                document.getElementById('reception-type-badge').className = 'text-orange-500 font-bold';
            } else if (activeTrip.status === 'awaiting_return_checklist') {
                receptionType = 'Recepción Final (Retorno)';
                receptionMode = 'final';
                document.getElementById('reception-type-badge').className = 'text-green-500 font-bold';
            } else {
                receptionType = 'Vehículo en uso';
                receptionMode = null;
                document.getElementById('reception-type-badge').className = 'text-blue-500 font-bold';
            }

            document.getElementById('reception-type-container').classList.remove('hidden');
            document.getElementById('reception-type-badge').innerText = receptionType;
            this.receptionMode = receptionMode;

            if (receptionMode) {
                document.getElementById('btn-start-process').classList.remove('hidden');
            } else {
                document.getElementById('btn-start-process').classList.add('hidden');
            }
        } else {
            document.getElementById('vehicle-driver').innerText = 'Sin viaje activo';
            document.getElementById('reception-type-container').classList.add('hidden');
            document.getElementById('btn-start-process').classList.add('hidden');
        }
    }

    async startProcess() {
        if (!this.receptionMode || !this.currentTrip) {
            alert('No hay un proceso válido para iniciar');
            return;
        }

        this.switchMode('process');
        
        const header = document.getElementById('process-header');
        const vehicleInfo = document.getElementById('process-vehicle-info');
        const conductorInfo = document.getElementById('process-conductor');

        vehicleInfo.innerText = `ECO-${this.currentVehicle.economic_number} · ${this.currentVehicle.plate}`;
        conductorInfo.innerText = `Conductor: ${this.currentDriver?.full_name || '--'}`;

        if (this.receptionMode === 'initial') {
            header.innerHTML = `
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="material-symbols-outlined text-orange-500">engineering</span> Recepción Inicial
                </h3>
                <span class="text-xs bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full">Paso 1: Fotos</span>
            `;
            this.renderInitialProcess();
        } else {
            header.innerHTML = `
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="material-symbols-outlined text-green-500">assignment_return</span> Recepción Final
                </h3>
                <span class="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full">Paso 2: Checklist</span>
            `;
            this.renderFinalProcess();
        }
    }

    renderInitialProcess() {
        const content = document.getElementById('process-content');
        
        content.innerHTML = `
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Fotos requeridas</h4>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button onclick="window.workshopView.takePhoto('front')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Frente
                    </button>
                    <button onclick="window.workshopView.takePhoto('back')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Atrás
                    </button>
                    <button onclick="window.workshopView.takePhoto('left')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Izquierdo
                    </button>
                    <button onclick="window.workshopView.takePhoto('right')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Derecho
                    </button>
                    <button onclick="window.workshopView.takePhoto('front-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Frontal Angular
                    </button>
                    <button onclick="window.workshopView.takePhoto('rear-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Trasero Angular
                    </button>
                </div>

                <div id="photos-preview" class="grid grid-cols-3 gap-2 mt-4"></div>
            </div>

            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Foto del Conductor</h4>
                <button onclick="window.workshopView.takeDriverPhoto()" class="w-full p-4 bg-[#233648] rounded-lg text-white hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">photo_camera</span> Tomar Foto
                </button>
                <div id="driver-photo-preview" class="mt-4 hidden">
                    <img id="driver-photo-img" class="w-32 h-32 object-cover rounded-lg border-2 border-primary" />
                </div>
            </div>

            <div class="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                <p class="text-blue-400 text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined">info</span>
                    El conductor podrá firmar después de este proceso
                </p>
            </div>
        `;

        this.validateInitialProcess();
    }

    renderFinalProcess() {
        const content = document.getElementById('process-content');
        
        content.innerHTML = `
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Checklist de Retorno</h4>
                
                <div class="space-y-3">
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648]">
                        <input type="checkbox" id="check-liquid" onchange="window.workshopView.updateChecklist('liquid', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Líquido de frenos</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648]">
                        <input type="checkbox" id="check-oil" onchange="window.workshopView.updateChecklist('oil', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Aceite</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648]">
                        <input type="checkbox" id="check-coolant" onchange="window.workshopView.updateChecklist('coolant', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Anticongelante</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648]">
                        <input type="checkbox" id="check-lights" onchange="window.workshopView.updateChecklist('lights', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Luces</span>
                    </label>
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648]">
                        <input type="checkbox" id="check-tires" onchange="window.workshopView.updateChecklist('tires', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Llantas</span>
                    </label>
                </div>
            </div>

            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Fotos de Entrega</h4>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button onclick="window.workshopView.takeDeliveryPhoto('front')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Frente
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('back')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Atrás
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('left')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Izquierdo
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('right')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Derecho
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('front-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Frontal Angular
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('rear-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span> Trasero Angular
                    </button>
                </div>

                <div id="delivery-photos-preview" class="grid grid-cols-3 gap-2 mt-4"></div>
            </div>

            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">¿Detectaste alguna falla?</h4>
                <textarea id="incident-notes" rows="3" class="w-full bg-[#1a232e] border border-[#324d67] rounded-lg p-3 text-white text-sm" placeholder="Describe la falla..."></textarea>
                <div class="mt-3 flex gap-3">
                    <button onclick="window.workshopView.reportIncident()" class="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors">
                        REPORTAR INCIDENCIA
                    </button>
                </div>
            </div>
        `;

        this.checklistItems = {
            liquid: false,
            oil: false,
            coolant: false,
            lights: false,
            tires: false
        };
        this.deliveryPhotos = [];
        this.validateFinalProcess();
    }

    takePhoto(position) {
        const photoUrl = `https://via.placeholder.com/150?text=${position}`;
        this.receptionPhotos.push({ position, url: photoUrl });
        this.updatePhotosPreview();
        this.validateInitialProcess();
    }

    takeDriverPhoto() {
        this.driverPhoto = `https://via.placeholder.com/150?text=driver`;
        const preview = document.getElementById('driver-photo-preview');
        const img = document.getElementById('driver-photo-img');
        if (preview && img) {
            img.src = this.driverPhoto;
            preview.classList.remove('hidden');
        }
        this.validateInitialProcess();
    }

    takeDeliveryPhoto(position) {
        const photoUrl = `https://via.placeholder.com/150?text=delivery-${position}`;
        this.deliveryPhotos.push({ position, url: photoUrl });
        this.updateDeliveryPhotosPreview();
        this.validateFinalProcess();
    }

    updatePhotosPreview() {
        const preview = document.getElementById('photos-preview');
        if (!preview) return;

        if (this.receptionPhotos.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.receptionPhotos.map(photo => `
            <div class="relative group">
                <img src="${photo.url}" class="w-full h-20 object-cover rounded-lg border border-primary/50" />
                <span class="absolute bottom-1 left-1 text-[8px] bg-black/70 text-white px-1 rounded">${photo.position}</span>
            </div>
        `).join('');
    }

    updateDeliveryPhotosPreview() {
        const preview = document.getElementById('delivery-photos-preview');
        if (!preview) return;

        if (this.deliveryPhotos.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.deliveryPhotos.map(photo => `
            <div class="relative group">
                <img src="${photo.url}" class="w-full h-20 object-cover rounded-lg border border-primary/50" />
                <span class="absolute bottom-1 left-1 text-[8px] bg-black/70 text-white px-1 rounded">${photo.position}</span>
            </div>
        `).join('');
    }

    updateChecklist(item, value) {
        this.checklistItems[item] = value;
        this.validateFinalProcess();
    }

    validateInitialProcess() {
        const isValid = this.receptionPhotos.length >= 6 && this.driverPhoto !== null;
        const btn = document.getElementById('btn-complete-process');
        if (btn) {
            btn.disabled = !isValid;
            btn.innerHTML = isValid ? 'COMPLETAR RECEPCIÓN INICIAL' : `FOTOS: ${this.receptionPhotos.length}/6 · CONDUCTOR: ${this.driverPhoto ? '✓' : '✗'}`;
        }
    }

    validateFinalProcess() {
        const allChecklistChecked = Object.values(this.checklistItems).every(v => v === true);
        const isValid = allChecklistChecked && this.deliveryPhotos.length >= 6;
        const btn = document.getElementById('btn-complete-process');
        if (btn) {
            btn.disabled = !isValid;
            btn.innerHTML = isValid ? 'COMPLETAR RECEPCIÓN FINAL' : `CHECKLIST: ${Object.values(this.checklistItems).filter(v => v).length}/5 · FOTOS: ${this.deliveryPhotos.length}/6`;
        }
    }

    async completeProcess() {
        if (!this.currentTrip || !this.receptionMode) return;

        const btn = document.getElementById('btn-complete-process');
        btn.disabled = true;
        btn.innerHTML = 'PROCESANDO...';

        try {
            if (this.receptionMode === 'initial') {
                const { error } = await supabase
                    .from('trips')
                    .update({
                        status: 'awaiting_driver_signature',
                        workshop_reception_photos: this.receptionPhotos,
                        workshop_driver_photo: this.driverPhoto,
                        workshop_reception_at: new Date().toISOString()
                    })
                    .eq('id', this.currentTrip.id);

                if (error) throw error;
                alert('✅ Recepción inicial completada');

            } else {
                const incidentNotes = document.getElementById('incident-notes')?.value;
                const hasIncident = incidentNotes && incidentNotes.trim() !== '';
                
                const newStatus = hasIncident ? 'incident_report' : 'completed';
                const newKm = (this.currentVehicle.current_km || 0) + 100;

                const { error: tripError } = await supabase
                    .from('trips')
                    .update({
                        status: newStatus,
                        workshop_return_checklist: this.checklistItems,
                        workshop_return_photos: this.deliveryPhotos,
                        workshop_completed_at: new Date().toISOString(),
                        entry_km: newKm,
                        incident_notes: incidentNotes || null
                    })
                    .eq('id', this.currentTrip.id);

                if (tripError) throw tripError;

                const { error: vehicleError } = await supabase
                    .from('vehicles')
                    .update({ current_km: newKm })
                    .eq('id', this.currentVehicle.id);

                if (vehicleError) throw vehicleError;

                alert(hasIncident ? '⚠️ Incidencia reportada' : '✅ Recepción final completada');
            }

            this.cancelProcess();
            await this.loadPendingLists();
            await this.loadCompletedTrips();
            this.switchMode('scanner');

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = this.receptionMode === 'initial' ? 'COMPLETAR RECEPCIÓN INICIAL' : 'COMPLETAR RECEPCIÓN FINAL';
        }
    }

    async reportIncident() {
        const notes = document.getElementById('incident-notes')?.value;
        if (!notes || notes.trim() === '') {
            alert('Describe la incidencia');
            return;
        }

        if (!confirm('¿Reportar esta incidencia?')) return;

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    status: 'incident_report',
                    workshop_return_checklist: this.checklistItems,
                    workshop_return_photos: this.deliveryPhotos,
                    workshop_completed_at: new Date().toISOString(),
                    incident_notes: notes
                })
                .eq('id', this.currentTrip.id);

            if (error) throw error;

            alert('⚠️ Incidencia reportada');
            this.cancelProcess();
            await this.loadPendingLists();
            await this.loadCompletedTrips();
            this.switchMode('scanner');

        } catch (error) {
            console.error('Error:', error);
            alert('Error al reportar incidencia');
        }
    }

    cancelProcess() {
        this.currentTrip = null;
        this.currentVehicle = null;
        this.currentDriver = null;
        this.receptionPhotos = [];
        this.deliveryPhotos = [];
        this.driverPhoto = null;
        this.checklistItems = {
            liquid: false,
            oil: false,
            coolant: false,
            lights: false,
            tires: false
        };
        this.receptionMode = null;

        this.switchMode('scanner');
        setTimeout(() => this.initScanner(), 100);
    }

    async loadPendingLists() {
        try {
            const { data: initialTrips, error: initialError } = await supabase
                .from('trips')
                .select(`
                    id,
                    created_at,
                    vehicles:vehicle_id(economic_number, plate),
                    driver:driver_id(full_name, photo_url)
                `)
                .eq('status', 'approved_for_taller')
                .order('created_at', { ascending: false });

            if (initialError) throw initialError;

            const initialList = document.getElementById('pending-initial-list');
            if (initialList) {
                if (!initialTrips || initialTrips.length === 0) {
                    initialList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin recepciones pendientes</p>';
                } else {
                    initialList.innerHTML = initialTrips.map(t => `
                        <div class="bg-[#151b23] p-3 rounded-lg border border-orange-500/30">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-slate-700 bg-cover bg-center" 
                                     style="background-image: url('${t.driver?.photo_url || ''}')"></div>
                                <div class="flex-1">
                                    <p class="text-white font-bold text-xs">ECO-${t.vehicles?.economic_number || '?'}</p>
                                    <p class="text-[10px] text-[#92adc9] truncate">${t.driver?.full_name || '--'}</p>
                                </div>
                                <button onclick="window.workshopView.resumeProcess('${t.id}')" class="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded">
                                    Retomar
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
            }

            const { data: finalTrips, error: finalError } = await supabase
                .from('trips')
                .select(`
                    id,
                    created_at,
                    vehicles:vehicle_id(economic_number, plate),
                    driver:driver_id(full_name, photo_url)
                `)
                .eq('status', 'awaiting_return_checklist')
                .order('created_at', { ascending: false });

            if (finalError) throw finalError;

            const finalList = document.getElementById('pending-final-list');
            if (finalList) {
                if (!finalTrips || finalTrips.length === 0) {
                    finalList.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin retornos pendientes</p>';
                } else {
                    finalList.innerHTML = finalTrips.map(t => `
                        <div class="bg-[#151b23] p-3 rounded-lg border border-green-500/30">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-slate-700 bg-cover bg-center" 
                                     style="background-image: url('${t.driver?.photo_url || ''}')"></div>
                                <div class="flex-1">
                                    <p class="text-white font-bold text-xs">ECO-${t.vehicles?.economic_number || '?'}</p>
                                    <p class="text-[10px] text-[#92adc9] truncate">${t.driver?.full_name || '--'}</p>
                                </div>
                                <button onclick="window.workshopView.resumeProcess('${t.id}')" class="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                                    Retomar
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
            }

        } catch (error) {
            console.error('Error cargando listas:', error);
        }
    }

    async loadCompletedTrips() {
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select(`
                    id,
                    created_at,
                    completed_at,
                    vehicles:vehicle_id(economic_number, plate),
                    driver:driver_id(full_name)
                `)
                .in('status', ['completed', 'incident_report'])
                .order('completed_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const list = document.getElementById('completed-list');
            if (list) {
                if (!trips || trips.length === 0) {
                    list.innerHTML = '<p class="text-slate-500 text-center text-xs">Sin viajes completados</p>';
                } else {
                    list.innerHTML = trips.map(t => `
                        <div class="bg-[#151b23] p-3 rounded-lg border border-slate-700">
                            <div class="flex justify-between items-start">
                                <div>
                                    <p class="text-white font-bold text-sm">ECO-${t.vehicles?.economic_number || '?'}</p>
                                    <p class="text-[10px] text-[#92adc9]">${t.driver?.full_name || '--'}</p>
                                </div>
                                <span class="text-[10px] text-green-400">${t.completed_at ? new Date(t.completed_at).toLocaleDateString() : ''}</span>
                            </div>
                        </div>
                    `).join('');
                }
            }

        } catch (error) {
            console.error('Error cargando completados:', error);
        }
    }

    async resumeProcess(tripId) {
        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .select(`
                    *,
                    vehicle:vehicle_id(*),
                    driver:driver_id(*)
                `)
                .eq('id', tripId)
                .single();

            if (error) throw error;

            this.currentTrip = trip;
            this.currentVehicle = trip.vehicle;
            this.currentDriver = trip.driver;
            
            if (trip.status === 'approved_for_taller') {
                this.receptionMode = 'initial';
            } else if (trip.status === 'awaiting_return_checklist') {
                this.receptionMode = 'final';
            }

            await this.handleScannedVehicle(trip.vehicle);
            this.startProcess();

        } catch (error) {
            console.error('Error retomando proceso:', error);
            alert('Error al retomar el proceso');
        }
    }
}
