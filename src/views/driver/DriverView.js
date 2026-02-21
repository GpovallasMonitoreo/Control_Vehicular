import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.currentDriver = null;
        this.currentTrip = null;
        this.availableVehicles = [];
        this.selectedVehicle = null;
        this.map = null;
        this.marker = null;
        this.watchId = null;
        this.currentPosition = null;
        this.signaturePad = null;
        window.driverView = this;
    }

    render() {
        return `
        <div class="flex flex-col h-full gap-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            
            <!-- Header del Conductor -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <h1 class="text-white text-3xl font-black leading-tight flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-4xl">directions_car</span>
                        Panel del Conductor
                    </h1>
                    <p class="text-[#92adc9] text-sm font-normal" id="driver-name">Cargando...</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.driverView.refreshData()" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                        <span class="material-symbols-outlined text-[18px]">refresh</span>
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            <!-- Estado actual del viaje -->
            <div id="trip-status-banner" class="hidden rounded-xl p-4 border flex items-center gap-3">
                <!-- Se llenará dinámicamente -->
            </div>

            <!-- CONTENIDO PRINCIPAL -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Columna Izquierda: Lista de Unidades o Formulario -->
                <div class="lg:col-span-1 space-y-4">
                    
                    <!-- Selector de Unidades -->
                    <div id="vehicles-panel" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-primary">fleet</span> Unidades Disponibles
                        </h3>
                        
                        <div id="vehicles-list" class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            <p class="text-slate-500 text-center text-xs">Cargando unidades...</p>
                        </div>
                    </div>

                    <!-- Formulario de Solicitud (oculto inicialmente) -->
                    <div id="request-form-panel" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-white font-bold flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">assignment</span> Formulario de Solicitud
                            </h3>
                            <button onclick="window.driverView.cancelRequest()" class="text-slate-400 hover:text-white">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div class="bg-[#111a22] p-4 rounded-lg border border-[#324d67] mb-4">
                            <p class="text-[10px] text-[#92adc9] uppercase">Unidad seleccionada</p>
                            <p id="selected-vehicle-info" class="text-white font-bold">--</p>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="text-xs text-[#92adc9] block mb-1">📍 Ubicación / Destino *</label>
                                <input type="text" id="destination-input" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm" placeholder="Ej: Almacén Central, Oficinas...">
                            </div>
                            
                            <div>
                                <label class="text-xs text-[#92adc9] block mb-1">📝 Motivo *</label>
                                <input type="text" id="motivo-input" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm" placeholder="Ej: Entrega de materiales, Reunión...">
                            </div>
                            
                            <div>
                                <label class="text-xs text-[#92adc9] block mb-1">👤 Jefe Directo *</label>
                                <input type="text" id="supervisor-input" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm" placeholder="Nombre del encargado">
                            </div>

                            <button onclick="window.driverView.submitRequest()" class="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                                ENVIAR SOLICITUD
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Mapa y Estado -->
                <div class="lg:col-span-2 space-y-4">
                    
                    <!-- Mapa en tiempo real -->
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-4 shadow-lg">
                        <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-primary">gps_fixed</span> Ubicación en Tiempo Real
                        </h3>
                        <div id="map" class="w-full h-[400px] rounded-lg bg-[#111a22]"></div>
                        <p id="gps-status" class="text-xs text-[#92adc9] mt-2 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            Obteniendo ubicación...
                        </p>
                    </div>

                    <!-- Timeline del viaje actual -->
                    <div id="trip-timeline" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                        <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-primary">timeline</span> Estado del Viaje
                        </h3>
                        
                        <div id="timeline-content" class="space-y-4">
                            <!-- Se llenará dinámicamente -->
                        </div>
                    </div>

                    <!-- Panel de firma (para cuando el taller complete la recepción inicial) -->
                    <div id="signature-panel" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                        <h3 class="text-white font-bold mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2">
                            <span class="material-symbols-outlined text-primary">draw</span> Firma de Recepción
                        </h3>
                        
                        <p class="text-sm text-[#92adc9] mb-4">El taller ha completado la revisión. Firma para recibir la unidad.</p>
                        
                        <div class="bg-[#111a22] p-4 rounded-lg border border-[#324d67] mb-4">
                            <canvas id="signature-canvas" width="500" height="200" class="w-full h-40 bg-white rounded-lg touch-none"></canvas>
                        </div>
                        
                        <div class="flex gap-3">
                            <button onclick="window.driverView.clearSignature()" class="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
                                LIMPIAR
                            </button>
                            <button onclick="window.driverView.submitSignature()" class="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                                FIRMAR Y RECIBIR
                            </button>
                        </div>
                    </div>

                    <!-- Mensaje de taller pendiente (para retorno) -->
                    <div id="workshop-return-message" class="bg-green-500/10 border border-green-500/30 rounded-xl p-6 shadow-lg hidden">
                        <div class="flex items-center gap-4">
                            <span class="material-symbols-outlined text-4xl text-green-500">handyman</span>
                            <div>
                                <h3 class="text-white font-bold text-lg">Acude al taller</h3>
                                <p class="text-[#92adc9] text-sm">La unidad debe ser revisada antes de liberarse</p>
                                <button onclick="window.location.hash='#taller-workshop'" class="mt-3 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500 hover:text-white transition-colors">
                                    IR AL TALLER
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadDriverData();
        this.initGPS();
        await this.loadAvailableVehicles();
        await this.loadCurrentTrip();
        
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.loadAvailableVehicles();
            this.loadCurrentTrip();
        }, 30000);
    }

    async loadDriverData() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const { data: driver, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            
            this.currentDriver = driver;
            document.getElementById('driver-name').innerText = `Bienvenido, ${driver.full_name || 'Conductor'}`;
            
        } catch (error) {
            console.error('Error cargando datos del conductor:', error);
        }
    }

    initGPS() {
        if (!navigator.geolocation) {
            document.getElementById('gps-status').innerHTML = `
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                GPS no soportado
            `;
            return;
        }

        // Inicializar mapa
        this.initMap();

        // Observar posición
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updatePosition(position);
            },
            (error) => {
                console.error('Error GPS:', error);
                document.getElementById('gps-status').innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    Error: ${this.getGPSErrorMessage(error)}
                `;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    getGPSErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                return "Permiso denegado";
            case error.POSITION_UNAVAILABLE:
                return "Posición no disponible";
            case error.TIMEOUT:
                return "Tiempo de espera agotado";
            default:
                return "Error desconocido";
        }
    }

    initMap() {
        // Cargar script de Leaflet si no está cargado
        if (!window.L) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => this.createMap();
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        } else {
            this.createMap();
        }
    }

    createMap() {
        // Coordenadas por defecto (CDMX)
        const defaultPos = [19.4326, -99.1332];
        
        this.map = L.map('map').setView(defaultPos, 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.marker = L.marker(defaultPos, {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '<div class="w-4 h-4 bg-primary rounded-full border-2 border-white animate-pulse"></div>',
                iconSize: [20, 20]
            })
        }).addTo(this.map);
    }

    updatePosition(position) {
        this.currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
        };

        if (this.map && this.marker) {
            this.marker.setLatLng([this.currentPosition.lat, this.currentPosition.lng]);
            this.map.setView([this.currentPosition.lat, this.currentPosition.lng], 15);
        }

        document.getElementById('gps-status').innerHTML = `
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            GPS Activo · Precisión: ±${Math.round(this.currentPosition.accuracy)}m
        `;

        // Si hay un viaje en progreso, actualizar posición en la base de datos
        if (this.currentTrip && this.currentTrip.status === 'in_progress') {
            this.updateTripLocation();
        }
    }

    async updateTripLocation() {
        if (!this.currentTrip || !this.currentPosition) return;

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    current_lat: this.currentPosition.lat,
                    current_lng: this.currentPosition.lng,
                    last_location_update: new Date().toISOString()
                })
                .eq('id', this.currentTrip.id);

            if (error) console.error('Error actualizando ubicación:', error);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async loadAvailableVehicles() {
        try {
            const { data: vehicles, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('status', 'available')
                .order('economic_number');

            if (error) throw error;

            this.availableVehicles = vehicles || [];
            this.renderVehiclesList();
        } catch (error) {
            console.error('Error cargando vehículos:', error);
        }
    }

    renderVehiclesList() {
        const list = document.getElementById('vehicles-list');
        if (!list) return;

        if (this.availableVehicles.length === 0) {
            list.innerHTML = '<p class="text-slate-500 text-center text-xs">No hay unidades disponibles</p>';
            return;
        }

        list.innerHTML = this.availableVehicles.map(v => `
            <div class="bg-[#111a22] p-4 rounded-lg border border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onclick="window.driverView.selectVehicle('${v.id}')">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-white font-bold">ECO-${v.economic_number}</p>
                        <p class="text-xs text-[#92adc9]">${v.brand} ${v.model} · ${v.plate}</p>
                    </div>
                    <span class="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">Disponible</span>
                </div>
                <div class="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <span class="text-[#92adc9]">KM: <span class="text-white">${v.current_km || 0}</span></span>
                    <span class="text-[#92adc9]">Combustible: <span class="text-white">${v.fuel_level || 0}%</span></span>
                </div>
            </div>
        `).join('');
    }

    selectVehicle(vehicleId) {
        this.selectedVehicle = this.availableVehicles.find(v => v.id === vehicleId);
        
        if (!this.selectedVehicle) return;

        // Ocultar panel de vehículos, mostrar formulario
        document.getElementById('vehicles-panel').classList.add('hidden');
        document.getElementById('request-form-panel').classList.remove('hidden');
        
        document.getElementById('selected-vehicle-info').innerHTML = `
            ECO-${this.selectedVehicle.economic_number} · ${this.selectedVehicle.brand} ${this.selectedVehicle.model}
        `;
    }

    cancelRequest() {
        this.selectedVehicle = null;
        document.getElementById('vehicles-panel').classList.remove('hidden');
        document.getElementById('request-form-panel').classList.add('hidden');
        
        // Limpiar formulario
        document.getElementById('destination-input').value = '';
        document.getElementById('motivo-input').value = '';
        document.getElementById('supervisor-input').value = '';
    }

    async submitRequest() {
        const destination = document.getElementById('destination-input').value.trim();
        const motivo = document.getElementById('motivo-input').value.trim();
        const supervisor = document.getElementById('supervisor-input').value.trim();

        if (!destination || !motivo || !supervisor) {
            alert('Todos los campos son obligatorios');
            return;
        }

        if (!this.selectedVehicle || !this.currentDriver) {
            alert('Error: Selecciona una unidad primero');
            return;
        }

        const submitBtn = document.querySelector('#request-form-panel button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'ENVIANDO...';
        submitBtn.disabled = true;

        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .insert({
                    vehicle_id: this.selectedVehicle.id,
                    driver_id: this.currentDriver.id,
                    status: 'requested',
                    destination: destination,
                    motivo: motivo,
                    supervisor: supervisor,
                    created_at: new Date().toISOString(),
                    request_details: {
                        destination,
                        motivo,
                        supervisor,
                        requested_at: new Date().toISOString()
                    }
                })
                .select()
                .single();

            if (error) throw error;

            this.currentTrip = trip;
            alert('✅ Solicitud enviada. Espera la aprobación del centro de control.');
            
            this.cancelRequest();
            await this.loadCurrentTrip();

        } catch (error) {
            console.error('Error enviando solicitud:', error);
            alert('Error al enviar la solicitud');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadCurrentTrip() {
        if (!this.currentDriver) return;

        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .select(`
                    *,
                    vehicle:vehicle_id(*),
                    driver:driver_id(*)
                `)
                .eq('driver_id', this.currentDriver.id)
                .in('status', ['requested', 'approved_for_taller', 'awaiting_driver_signature', 'in_progress', 'awaiting_return_checklist'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            this.currentTrip = trip;
            this.updateUIForTrip();

        } catch (error) {
            console.error('Error cargando viaje actual:', error);
        }
    }

    updateUIForTrip() {
        const banner = document.getElementById('trip-status-banner');
        const timeline = document.getElementById('trip-timeline');
        const signaturePanel = document.getElementById('signature-panel');
        const workshopMessage = document.getElementById('workshop-return-message');

        if (!this.currentTrip) {
            banner.classList.add('hidden');
            timeline.classList.add('hidden');
            signaturePanel.classList.add('hidden');
            workshopMessage.classList.add('hidden');
            return;
        }

        // Mostrar banner según el estado
        banner.classList.remove('hidden');
        const statusMap = {
            'requested': { color: 'yellow', text: 'Solicitud enviada - Esperando aprobación', icon: 'pending' },
            'approved_for_taller': { color: 'orange', text: 'Solicitud aprobada - Acude al taller', icon: 'engineering' },
            'awaiting_driver_signature': { color: 'blue', text: 'Taller listo - Firma para recibir', icon: 'draw' },
            'in_progress': { color: 'green', text: 'Viaje en progreso', icon: 'directions_car' },
            'awaiting_return_checklist': { color: 'purple', text: 'Viaje completado - Acude a taller', icon: 'handyman' }
        };

        const status = statusMap[this.currentTrip.status] || { color: 'gray', text: this.currentTrip.status, icon: 'info' };
        
        banner.innerHTML = `
            <span class="material-symbols-outlined text-${status.color}-500">${status.icon}</span>
            <span class="text-white font-bold flex-1">${status.text}</span>
            <span class="text-xs text-[#92adc9]">${new Date(this.currentTrip.created_at).toLocaleString()}</span>
        `;
        banner.className = `rounded-xl p-4 border border-${status.color}-500/30 bg-${status.color}-500/10 flex items-center gap-3`;

        // Mostrar/ocultar paneles según el estado
        timeline.classList.remove('hidden');
        
        if (this.currentTrip.status === 'awaiting_driver_signature') {
            signaturePanel.classList.remove('hidden');
            this.initSignaturePad();
        } else {
            signaturePanel.classList.add('hidden');
        }

        if (this.currentTrip.status === 'awaiting_return_checklist') {
            workshopMessage.classList.remove('hidden');
        } else {
            workshopMessage.classList.add('hidden');
        }

        // Actualizar timeline
        this.updateTimeline();
    }

    updateTimeline() {
        const timeline = document.getElementById('timeline-content');
        if (!timeline || !this.currentTrip) return;

        const steps = [
            { status: 'requested', label: 'Solicitud enviada', icon: 'send', completed: true },
            { status: 'approved_for_taller', label: 'Aprobada por control', icon: 'check_circle', completed: this.isStepCompleted('approved_for_taller') },
            { status: 'awaiting_driver_signature', label: 'Revisión en taller', icon: 'engineering', completed: this.isStepCompleted('awaiting_driver_signature') },
            { status: 'in_progress', label: 'Viaje iniciado', icon: 'directions_car', completed: this.isStepCompleted('in_progress') },
            { status: 'awaiting_return_checklist', label: 'Retorno a taller', icon: 'handyman', completed: this.isStepCompleted('awaiting_return_checklist') },
            { status: 'completed', label: 'Viaje completado', icon: 'check_circle', completed: this.isStepCompleted('completed') }
        ];

        timeline.innerHTML = steps.map((step, index) => {
            const isCurrent = this.currentTrip.status === step.status;
            const isCompleted = step.completed;
            
            let statusClass = 'text-slate-600';
            let iconClass = 'text-slate-600';
            
            if (isCompleted) {
                statusClass = 'text-green-500';
                iconClass = 'text-green-500';
            } else if (isCurrent) {
                statusClass = 'text-primary';
                iconClass = 'text-primary';
            }

            return `
                <div class="flex items-start gap-3">
                    <div class="flex flex-col items-center">
                        <span class="material-symbols-outlined ${iconClass}">${step.icon}</span>
                        ${index < steps.length - 1 ? '<div class="w-0.5 h-8 bg-slate-700 mt-1"></div>' : ''}
                    </div>
                    <div>
                        <p class="text-white font-bold text-sm">${step.label}</p>
                        <p class="text-xs ${statusClass}">
                            ${isCompleted ? 'Completado' : isCurrent ? 'En progreso' : 'Pendiente'}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    isStepCompleted(status) {
        const statusOrder = ['requested', 'approved_for_taller', 'awaiting_driver_signature', 'in_progress', 'awaiting_return_checklist', 'completed'];
        const currentIndex = statusOrder.indexOf(this.currentTrip?.status);
        const stepIndex = statusOrder.indexOf(status);
        
        return stepIndex < currentIndex;
    }

    initSignaturePad() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) return;

        // Limpiar canvas
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        let drawing = false;

        const startDrawing = (e) => {
            drawing = true;
            ctx.beginPath();
            const pos = this.getCanvasCoordinates(e, canvas);
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!drawing) return;
            e.preventDefault();
            const pos = this.getCanvasCoordinates(e, canvas);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stopDrawing = () => {
            drawing = false;
            ctx.closePath();
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        // Soporte táctil
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);
    }

    getCanvasCoordinates(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;
        
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    clearSignature() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    async submitSignature() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas || !this.currentTrip) return;

        // Verificar que no esté vacío
        const ctx = canvas.getContext('2d');
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const isBlank = pixelData.every((pixel, i) => i % 4 === 3 || pixel === 255);
        
        if (isBlank) {
            alert('Por favor, firma antes de continuar');
            return;
        }

        const signatureData = canvas.toDataURL('image/png');

        const btn = document.querySelector('#signature-panel button:last-child');
        const originalText = btn.innerText;
        btn.innerText = 'PROCESANDO...';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    driver_signature: signatureData,
                    status: 'in_progress',
                    start_time: new Date().toISOString()
                })
                .eq('id', this.currentTrip.id);

            if (error) throw error;

            alert('✅ Firma guardada. Viaje iniciado. Puedes salir con el guardia.');
            
            await this.loadCurrentTrip();

        } catch (error) {
            console.error('Error guardando firma:', error);
            alert('Error al guardar la firma');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    refreshData() {
        this.loadAvailableVehicles();
        this.loadCurrentTrip();
    }

    // Limpiar al salir
    destroy() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
    }
}
