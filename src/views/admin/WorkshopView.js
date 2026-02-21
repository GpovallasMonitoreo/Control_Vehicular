import { supabase } from '../../config/supabaseClient.js';

export class WorkshopView {
    constructor() {
        this.currentTrip = null;
        this.currentVehicle = null;
        this.currentDriver = null;
        this.receptionPhotos = []; // Para la recepción inicial (fotos de la unidad y conductor)
        this.deliveryPhotos = [];   // Para la entrega final (fotos de la unidad)
        this.driverPhoto = null;     // Foto del conductor en la recepción inicial
        this.checklistItems = {
            liquid: false,
            oil: false,
            coolant: false,
            lights: false,
            tires: false
        };
        // Para el modo de recepción (inicial o final)
        this.receptionMode = null; // 'initial' o 'final'
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
                
                <!-- MODO ESCÁNER (por defecto) -->
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

                <!-- MODO PROCESO DE TALLER (se muestra cuando se inicia un proceso) -->
                <div id="mode-process" class="hidden animate-fade-in overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <!-- Cabecera dinámica según el modo -->
                        <div id="process-header" class="flex justify-between items-center mb-6">
                            <!-- Se llenará por JS -->
                        </div>

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

                        <!-- CONTENIDO DINÁMICO SEGÚN EL MODO (INICIAL O FINAL) -->
                        <div id="process-content" class="space-y-6">
                            <!-- Este contenido se inyecta por JS -->
                        </div>

                        <!-- Botón de acción final -->
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

                <!-- MODO PENDIENTES (para ver lista de vehículos en taller) -->
                <div id="mode-pending" class="hidden animate-fade-in overflow-y-auto custom-scrollbar pb-6 pr-2 h-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Recepciones Iniciales (approved_for_taller) -->
                        <div class="bg-[#1c2127] border border-orange-500/30 rounded-xl p-4">
                            <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                                <span class="material-symbols-outlined text-orange-500">engineering</span> Recepciones Iniciales
                            </h3>
                            <div id="pending-initial-list" class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                <p class="text-slate-500 text-center text-xs">Cargando...</p>
                            </div>
                        </div>

                        <!-- Recepciones Finales (awaiting_return_checklist) -->
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
        // Actualizar listas cada 10 segundos
        setInterval(() => {
            this.loadPendingLists();
            this.loadCompletedTrips();
        }, 10000);
    }

    switchMode(mode) {
        // Ocultar todos los modos
        document.getElementById('mode-scanner')?.classList.add('hidden');
        document.getElementById('mode-process')?.classList.add('hidden');
        document.getElementById('mode-pending')?.classList.add('hidden');
        document.getElementById('mode-completed')?.classList.add('hidden');

        // Quitar clases activas de tabs
        document.getElementById('tab-scanner')?.classList.remove('text-primary', 'border-primary');
        document.getElementById('tab-pending')?.classList.remove('text-primary', 'border-primary');
        document.getElementById('tab-completed')?.classList.remove('text-primary', 'border-primary');
        
        // Agregar clases inactivas
        document.getElementById('tab-scanner')?.classList.add('text-[#92adc9]', 'border-transparent');
        document.getElementById('tab-pending')?.classList.add('text-[#92adc9]', 'border-transparent');
        document.getElementById('tab-completed')?.classList.add('text-[#92adc9]', 'border-transparent');

        // Mostrar el modo seleccionado y activar su tab
        const modeElement = document.getElementById(`mode-${mode}`);
        if (modeElement) {
            modeElement.classList.remove('hidden');
            
            const tabElement = document.getElementById(`tab-${mode}`);
            if (tabElement) {
                tabElement.classList.remove('text-[#92adc9]', 'border-transparent');
                tabElement.classList.add('text-primary', 'border-primary');
            }
        }

        // Si es modo scanner, inicializar el QR
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
            // Buscar por economic_number o plate
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
        // Limpiar instancia anterior
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(() => {
                this.html5QrCode.clear();
            });
        }

        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        try {
            // Verificar si Html5Qrcode está disponible
            if (typeof Html5Qrcode === 'undefined') {
                console.log('Esperando a que cargue Html5Qrcode...');
                // Cargar la librería si no está disponible
                await this.loadHtml5Qrcode();
            }

            this.html5QrCode = new Html5Qrcode("reader");
            
            const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
                console.log('QR escaneado:', decodedText);
                
                // Detener el scanner después de un escaneo exitoso
                await this.html5QrCode.stop();
                
                // Buscar el vehículo por ID (asumiendo que el QR contiene el ID del vehículo)
                try {
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
                (errorMessage) => {
                    // Errores de escaneo (ignorar)
                }
            );
        } catch (error) {
            console.error('Error iniciando escáner:', error);
            readerElement.innerHTML = '<p class="text-red-500 p-4">Error al iniciar la cámara. Asegúrate de tener permisos.</p>';
        }
    }

    async loadHtml5Qrcode() {
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
        console.log('Vehículo escaneado:', vehicle);
        this.currentVehicle = vehicle;

        // Mostrar panel de información
        document.getElementById('vehicle-info-panel').classList.remove('hidden');
        document.getElementById('vehicle-plate').innerText = vehicle.plate || '--';
        document.getElementById('vehicle-model').innerText = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || '--';
        document.getElementById('vehicle-eco').innerText = `ECO-${vehicle.economic_number || '?'}`;
        document.getElementById('vehicle-km').innerText = `${vehicle.current_km || 0} km`;

        // Buscar si hay un viaje activo para este vehículo
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

            // Determinar el tipo de recepción
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

            // Mostrar botón de iniciar proceso si hay un modo válido
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

        // Cambiar al modo proceso
        this.switchMode('process');
        
        // Configurar el header según el modo
        const header = document.getElementById('process-header');
        const vehicleInfo = document.getElementById('process-vehicle-info');
        const conductorInfo = document.getElementById('process-conductor');

        vehicleInfo.innerText = `ECO-${this.currentVehicle.economic_number} · ${this.currentVehicle.plate}`;
        conductorInfo.innerText = `Conductor: ${this.currentDriver?.full_name || '--'}`;

        if (this.receptionMode === 'initial') {
            header.innerHTML = `
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="material-symbols-outlined text-orange-500">engineering</span> Recepción Inicial de Unidad
                </h3>
                <span class="text-xs bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full">Paso 1: Fotos y Checklist</span>
            `;
            this.renderInitialProcess();
        } else {
            header.innerHTML = `
                <h3 class="text-white font-bold text-lg flex items-center gap-2">
                    <span class="material-symbols-outlined text-green-500">assignment_return</span> Recepción Final de Unidad
                </h3>
                <span class="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full">Paso 2: Checklist y Fotos de Entrega</span>
            `;
            this.renderFinalProcess();
        }
    }

    renderInitialProcess() {
        const content = document.getElementById('process-content');
        
        content.innerHTML = `
            <!-- Fotos de la unidad y conductor -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Fotos requeridas</h4>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button onclick="window.workshopView.takePhoto('front')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Frente
                    </button>
                    <button onclick="window.workshopView.takePhoto('back')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Atrás
                    </button>
                    <button onclick="window.workshopView.takePhoto('left')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Lado Izquierdo
                    </button>
                    <button onclick="window.workshopView.takePhoto('right')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Lado Derecho
                    </button>
                    <button onclick="window.workshopView.takePhoto('front-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Frontal Angular
                    </button>
                    <button onclick="window.workshopView.takePhoto('rear-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Trasero Angular
                    </button>
                </div>

                <!-- Fotos tomadas -->
                <div id="photos-preview" class="grid grid-cols-3 gap-2 mt-4">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>

            <!-- Foto del conductor -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Foto del Conductor</h4>
                <button onclick="window.workshopView.takeDriverPhoto()" class="w-full p-4 bg-[#233648] rounded-lg text-white hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">photo_camera</span>
                    Tomar Foto del Conductor
                </button>
                <div id="driver-photo-preview" class="mt-4 hidden">
                    <img id="driver-photo-img" class="w-32 h-32 object-cover rounded-lg border-2 border-primary" />
                </div>
            </div>

            <!-- Último checklist del vehículo -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Último Checklist de la Unidad</h4>
                <div id="last-checklist-display" class="text-sm text-white">
                    Cargando...
                </div>
            </div>

            <!-- Mensaje para el conductor -->
            <div class="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                <p class="text-blue-400 text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined">info</span>
                    Una vez completado este proceso, el conductor podrá firmar la recepción y continuar.
                </p>
            </div>
        `;

        // Cargar último checklist
        this.loadLastChecklist(this.currentVehicle.id);

        // Validar que el botón de completar se habilite cuando todo esté listo
        this.validateInitialProcess();
    }

    renderFinalProcess() {
        const content = document.getElementById('process-content');
        
        content.innerHTML = `
            <!-- Checklist de revisión -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Checklist de Retorno</h4>
                
                <div class="space-y-3">
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648] transition-colors">
                        <input type="checkbox" id="check-liquid" onchange="window.workshopView.updateChecklist('liquid', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Líquido de frenos</span>
                    </label>
                    
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648] transition-colors">
                        <input type="checkbox" id="check-oil" onchange="window.workshopView.updateChecklist('oil', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Aceite</span>
                    </label>
                    
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648] transition-colors">
                        <input type="checkbox" id="check-coolant" onchange="window.workshopView.updateChecklist('coolant', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Anticongelante</span>
                    </label>
                    
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648] transition-colors">
                        <input type="checkbox" id="check-lights" onchange="window.workshopView.updateChecklist('lights', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Luces (altas, bajas, direccionales)</span>
                    </label>
                    
                    <label class="flex items-center gap-3 p-3 bg-[#1a232e] rounded-lg cursor-pointer hover:bg-[#233648] transition-colors">
                        <input type="checkbox" id="check-tires" onchange="window.workshopView.updateChecklist('tires', this.checked)" class="w-5 h-5 accent-primary">
                        <span class="text-white text-sm">Llantas (presión y desgaste)</span>
                    </label>
                </div>
            </div>

            <!-- Fotos de entrega (4 costados + adelante + atrás) -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">Fotos de Entrega</h4>
                
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <button onclick="window.workshopView.takeDeliveryPhoto('front')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Frente
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('back')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Atrás
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('left')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Lado Izquierdo
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('right')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Lado Derecho
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('front-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Frontal Angular
                    </button>
                    <button onclick="window.workshopView.takeDeliveryPhoto('rear-angle')" class="p-4 bg-[#233648] rounded-lg text-white text-xs hover:bg-primary/20 transition-colors flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">photo_camera</span>
                        Trasero Angular
                    </button>
                </div>

                <!-- Fotos tomadas -->
                <div id="delivery-photos-preview" class="grid grid-cols-3 gap-2 mt-4">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>

            <!-- Input para incidencia (si algo falla) -->
            <div class="bg-[#111a22] p-4 rounded-xl border border-[#324d67]">
                <h4 class="text-xs font-bold text-[#92adc9] uppercase mb-4">¿Se detectó alguna falla?</h4>
                <textarea id="incident-notes" rows="3" class="w-full bg-[#1a232e] border border-[#324d67] rounded-lg p-3 text-white text-sm" placeholder="Describe la falla encontrada..."></textarea>
                <div class="mt-3 flex gap-3">
                    <button onclick="window.workshopView.reportIncident()" class="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors">
                        REPORTAR INCIDENCIA
                    </button>
                </div>
            </div>
        `;

        // Resetear checklist
        this.checklistItems = {
            liquid: false,
            oil: false,
            coolant: false,
            lights: false,
            tires: false
        };
        this.deliveryPhotos = [];

        // Validar que el botón de completar se habilite cuando todo esté listo
        this.validateFinalProcess();
    }

    async loadLastChecklist(vehicleId) {
        const container = document.getElementById('last-checklist-display');
        if (!container) return;

        try {
            const { data: lastTrip, error } = await supabase
                .from('trips')
                .select('workshop_checklist, completed_at')
                .eq('vehicle_id', vehicleId)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            
            if (!lastTrip?.workshop_checklist) {
                container.innerHTML = '<p class="text-slate-400 text-sm">No hay checklist previo para esta unidad</p>';
                return;
            }

            const check = lastTrip.workshop_checklist;
            container.innerHTML = `
                <div class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.liquid ? 'check_circle' : 'cancel'}</span> Líquido
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.oil ? 'check_circle' : 'cancel'}</span> Aceite
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.coolant ? 'check_circle' : 'cancel'}</span> Anticongelante
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.lights ? 'check_circle' : 'cancel'}</span> Luces
                        </span>
                        <span class="text-green-400 text-xs flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">${check.tires ? 'check_circle' : 'cancel'}</span> Llantas
                        </span>
                    </div>
                    <p class="text-[10px] text-[#92adc9] mt-2">Fecha: ${lastTrip.completed_at ? new Date(lastTrip.completed_at).toLocaleDateString() : 'N/A'}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error cargando checklist:', error);
            container.innerHTML = '<p class="text-red-400 text-sm">Error al cargar checklist</p>';
        }
    }

    // Métodos para fotos (simulados - necesitarás implementar con cámara real)
    takePhoto(position) {
        // Aquí iría la lógica para tomar foto con la cámara
        // Por ahora, simulamos con una imagen de placeholder
        const photoUrl = `https://via.placeholder.com/150?text=${position}`;
        this.receptionPhotos.push({ position, url: photoUrl });
        this.updatePhotosPreview();
        this.validateInitialProcess();
    }

    takeDriverPhoto() {
        // Simular foto del conductor
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
        // Simular foto de entrega
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
        // Validar que se hayan tomado todas las fotos requeridas (6 fotos)
        const requiredPhotos = 6; // front, back, left, right, front-angle, rear-angle
        const isValid = this.receptionPhotos.length >= requiredPhotos && this.driverPhoto !== null;
        
        const btn = document.getElementById('btn-complete-process');
        if (btn) {
            btn.disabled = !isValid;
            btn.innerHTML = isValid ? 'COMPLETAR RECEPCIÓN INICIAL' : 'FALTAN FOTOS POR TOMAR';
        }
    }

    validateFinalProcess() {
        // Validar que el checklist esté completo y las fotos (6 fotos)
        const allChecklistChecked = Object.values(this.checklistItems).every(v => v === true);
        const requiredPhotos = 6;
        const isValid = allChecklistChecked && this.deliveryPhotos.length >= requiredPhotos;
        
        const btn = document.getElementById('btn-complete-process');
        if (btn) {
            btn.disabled = !isValid;
            btn.innerHTML = isValid ? 'COMPLETAR RECEPCIÓN FINAL' : 'COMPLETA EL CHECKLIST Y FOTOS';
        }
    }

    async completeProcess() {
        if (!this.currentTrip || !this.receptionMode) return;

        const btn = document.getElementById('btn-complete-process');
        btn.disabled = true;
        btn.innerHTML = 'PROCESANDO...';

        try {
            if (this.receptionMode === 'initial') {
                // Completar recepción inicial
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

                alert('✅ Recepción inicial completada. El conductor puede firmar y salir.');

            } else {
                // Completar recepción final
                const incidentNotes = document.getElementById('incident-notes')?.value;
                const hasIncident = incidentNotes && incidentNotes.trim() !== '';
                
                const newStatus = hasIncident ? 'incident_report' : 'completed';
                
                // Actualizar el kilometraje del vehículo (ejemplo: sumar 100 km, deberías obtenerlo de algún lado)
                const newKm = (this.currentVehicle.current_km || 0) + 100; // TODO: Obtener KM real de entrada

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

                // Actualizar kilometraje del vehículo
                const { error: vehicleError } = await supabase
                    .from('vehicles')
                    .update({
                        current_km: newKm
                    })
                    .eq('id', this.currentVehicle.id);

                if (vehicleError) throw vehicleError;

                if (hasIncident) {
                    alert('⚠️ Incidencia reportada. La unidad quedará fuera de servicio hasta revisión.');
                } else {
                    alert('✅ Recepción final completada. Viaje cerrado correctamente.');
                }
            }

            // Limpiar y volver al scanner
            this.cancelProcess();
            await this.loadPendingLists();
            await this.loadCompletedTrips();
            this.switchMode('scanner');

        } catch (error) {
            console.error('Error completando proceso:', error);
            alert('Error al completar el proceso: ' + error.message);
            btn.disabled = false;
            btn.innerHTML = this.receptionMode === 'initial' ? 'COMPLETAR RECEPCIÓN INICIAL' : 'COMPLETAR RECEPCIÓN FINAL';
        }
    }

    async reportIncident() {
        const notes = document.getElementById('incident-notes')?.value;
        if (!notes || notes.trim() === '') {
            alert('Describe la incidencia antes de reportar');
            return;
        }

        if (!confirm('¿Reportar esta incidencia? La unidad quedará fuera de servicio.')) return;

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    status: 'incident_report',
                    workshop_return_checklist: this.checklistItems,
                    workshop_return_photos: this.deliveryPhotos,
                    workshop_completed_at: new Date().toISOString(),
                    incident_notes: notes,
                    incident_reported_by: 'taller' // TODO: Obtener ID del mecánico actual
                })
                .eq('id', this.currentTrip.id);

            if (error) throw error;

            alert('⚠️ Incidencia reportada correctamente');
            
            this.cancelProcess();
            await this.loadPendingLists();
            await this.loadCompletedTrips();
            this.switchMode('scanner');

        } catch (error) {
            console.error('Error reportando incidencia:', error);
            alert('Error al reportar incidencia');
        }
    }

    cancelProcess() {
        // Limpiar datos del proceso actual
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

        // Volver al scanner
        this.switchMode('scanner');
        
        // Reiniciar scanner si es necesario
        setTimeout(() => this.initScanner(), 100);
    }

    async loadPendingLists() {
        try {
            // Cargar recepciones iniciales (approved_for_taller)
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

            // Cargar recepciones finales (awaiting_return_checklist)
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
            console.error('Error cargando listas pendientes:', error);
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
                                <span class="text-[10px] text-green-400">${new Date(t.completed_at).toLocaleDateString()}</span>
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
