import { supabase } from '../../config/supabaseClient.js';

export class DriverView {
    constructor() {
        this.userId = localStorage.getItem('userId');
        this.currentPosition = null;
        this.watchId = null;
        this.map = null;
        this.marker = null;
        this.destinationMarker = null;
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
                    <p class="text-[#92adc9] text-sm font-normal">Solicita unidades y visualiza tus viajes</p>
                </div>
                <button onclick="window.driverView.checkActiveTrip()" class="flex items-center justify-center gap-2 h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg shadow-lg transition-transform active:scale-95">
                    <span class="material-symbols-outlined text-[18px]">sync</span>
                    <span>Verificar Viaje Activo</span>
                </button>
            </div>

            <!-- Contenido principal -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Columna izquierda: Formulario de solicitud -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Formulario de solicitud -->
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                            <span class="material-symbols-outlined text-primary">assignment</span> Solicitar Unidad
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="text-[#92adc9] text-xs block mb-2">Unidad</label>
                                <select id="vehicle-select" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm">
                                    <option value="">Selecciona una unidad...</option>
                                </select>
                            </div>

                            <div id="formulario-fields" class="hidden space-y-4">
                                <div>
                                    <label class="text-[#92adc9] text-xs block mb-2">Ubicación / Destino</label>
                                    <input type="text" id="destination" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm" placeholder="¿A dónde te diriges?">
                                </div>

                                <div>
                                    <label class="text-[#92adc9] text-xs block mb-2">Motivo</label>
                                    <select id="motivo" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm">
                                        <option value="">Selecciona motivo...</option>
                                        <option value="Comisión">Comisión</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Traslado">Traslado</option>
                                        <option value="Entrega">Entrega</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="text-[#92adc9] text-xs block mb-2">Jefe Directo</label>
                                    <select id="supervisor" class="w-full bg-[#111a22] border border-[#324d67] text-white rounded-lg p-3 text-sm">
                                        <option value="">Selecciona supervisor...</option>
                                    </select>
                                </div>

                                <button onclick="window.driverView.submitRequest()" 
                                        class="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                                    ENVIAR SOLICITUD
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Estado actual -->
                    <div id="active-trip-info" class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg hidden">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                            <span class="material-symbols-outlined text-green-500">emergency</span> Viaje Activo
                        </h3>
                        <div id="active-trip-content" class="space-y-3">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>

                <!-- Columna derecha: Mapa y últimas solicitudes -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Mapa -->
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                            <span class="material-symbols-outlined text-primary">map</span> Ubicación en Tiempo Real
                        </h3>
                        <div id="map-container" class="w-full h-[400px] rounded-lg overflow-hidden bg-[#0d141c] relative">
                            <div id="map-loading" class="absolute inset-0 flex items-center justify-center bg-[#0d141c]/80 z-10">
                                <span class="text-[#92adc9]">Cargando mapa...</span>
                            </div>
                            <div id="map" class="w-full h-full"></div>
                        </div>
                        <div class="mt-3 flex items-center gap-2 text-xs text-[#92adc9]">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span id="gps-status">Obteniendo ubicación...</span>
                        </div>
                    </div>

                    <!-- Últimas solicitudes -->
                    <div class="bg-[#1c2127] border border-[#324d67] rounded-xl p-6 shadow-lg">
                        <h3 class="font-bold text-white mb-4 flex items-center gap-2 border-b border-[#324d67] pb-2 uppercase tracking-widest text-xs">
                            <span class="material-symbols-outlined text-primary">history</span> Mis Últimas Solicitudes
                        </h3>
                        <div id="requests-list" class="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            <p class="text-slate-500 text-center text-xs">Cargando solicitudes...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        await this.loadVehicles();
        await this.loadSupervisors();
        await this.loadMyRequests();
        await this.checkActiveTrip();
        this.initGPS();
    }

    // ========== GPS EN TIEMPO REAL ==========
    initGPS() {
        if (!navigator.geolocation) {
            document.getElementById('gps-status').innerText = 'GPS no soportado';
            return;
        }

        // Cargar mapa
        this.loadMap();

        // Obtener posición inicial y comenzar a seguir
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.updateMapPosition();
                document.getElementById('gps-status').innerHTML = '📍 Ubicación actualizada';
            },
            (error) => {
                console.error('Error GPS:', error);
                document.getElementById('gps-status').innerHTML = '⚠️ Error obteniendo ubicación';
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        // Seguir posición en tiempo real
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.updateMapPosition();
            },
            (error) => {
                console.error('Error siguiendo posición:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    loadMap() {
        // Cargar script de Leaflet si no está cargado
        if (typeof L === 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => this.initMap();
            document.head.appendChild(script);
        } else {
            this.initMap();
        }
    }

    initMap() {
        const mapContainer = document.getElementById('map');
        const loadingEl = document.getElementById('map-loading');
        
        if (!mapContainer) return;

        // Coordenadas por defecto (CDMX)
        const defaultLat = 19.4326;
        const defaultLng = -99.1332;

        this.map = L.map(mapContainer).setView([defaultLat, defaultLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Marcador del conductor
        this.marker = L.marker([defaultLat, defaultLng], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="marker-pulse"></div><span class="material-symbols-outlined text-primary" style="font-size: 32px;">directions_car</span>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).addTo(this.map);

        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    updateMapPosition() {
        if (!this.map || !this.marker || !this.currentPosition) return;

        const { lat, lng } = this.currentPosition;
        
        this.marker.setLatLng([lat, lng]);
        this.map.setView([lat, lng], this.map.getZoom());

        // Si hay un destino activo, mostrar ruta
        this.updateRoute();
    }

    async updateRoute() {
        const activeTrip = await this.getActiveTrip();
        if (!activeTrip || !activeTrip.destination || !this.currentPosition) return;

        // Geocodificar destino (simplificado - podrías usar una API de geocodificación)
        // Por ahora, si el destino tiene coordenadas, las usamos
        if (this.destinationMarker) {
            this.destinationMarker.remove();
        }

        // Ejemplo: si el destino es "Reforma 123, CDMX", necesitarías geocodificar
        // Aquí simulamos un marcador de destino
        this.destinationMarker = L.marker([this.currentPosition.lat + 0.01, this.currentPosition.lng + 0.01], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<span class="material-symbols-outlined text-red-500" style="font-size: 32px;">location_on</span>',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(this.map);
        this.destinationMarker.bindPopup(`Destino: ${activeTrip.destination}`);

        // Dibujar línea de ruta (simulada)
        if (window.routeLine) {
            window.routeLine.remove();
        }

        window.routeLine = L.polyline([
            [this.currentPosition.lat, this.currentPosition.lng],
            [this.currentPosition.lat + 0.01, this.currentPosition.lng + 0.01]
        ], { color: 'blue' }).addTo(this.map);
    }

    // ========== VEHÍCULOS DISPONIBLES ==========
    async loadVehicles() {
        try {
            const { data: vehicles, error } = await supabase
                .from('vehicles')
                .select('id, economic_number, plate, brand, model')
                .eq('status', 'available')
                .order('economic_number');

            if (error) throw error;

            const select = document.getElementById('vehicle-select');
            if (!select) return;

            if (!vehicles || vehicles.length === 0) {
                select.innerHTML = '<option value="">No hay unidades disponibles</option>';
                return;
            }

            select.innerHTML = '<option value="">Selecciona una unidad...</option>' +
                vehicles.map(v => 
                    `<option value="${v.id}">ECO-${v.economic_number} · ${v.brand} ${v.model} · ${v.plate}</option>`
                ).join('');

            // Mostrar formulario al seleccionar vehículo
            select.onchange = () => {
                const formulario = document.getElementById('formulario-fields');
                if (select.value) {
                    formulario.classList.remove('hidden');
                } else {
                    formulario.classList.add('hidden');
                }
            };

        } catch (error) {
            console.error('Error cargando vehículos:', error);
        }
    }

    // ========== SUPERVISORES ==========
    async loadSupervisors() {
        try {
            const { data: supervisors, error } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('role', 'admin') // O el rol que corresponda
                .order('full_name');

            if (error) throw error;

            const select = document.getElementById('supervisor');
            if (!select) return;

            select.innerHTML = '<option value="">Selecciona supervisor...</option>' +
                (supervisors || []).map(s => 
                    `<option value="${s.full_name}">${s.full_name}</option>`
                ).join('');

        } catch (error) {
            console.error('Error cargando supervisores:', error);
        }
    }

    // ========== ENVIAR SOLICITUD ==========
    async submitRequest() {
        const vehicleId = document.getElementById('vehicle-select').value;
        const destination = document.getElementById('destination').value;
        const motivo = document.getElementById('motivo').value;
        const supervisor = document.getElementById('supervisor').value;

        if (!vehicleId || !destination || !motivo || !supervisor) {
            alert('Completa todos los campos');
            return;
        }

        const btn = document.querySelector('button[onclick="window.driverView.submitRequest()"]');
        const originalText = btn.innerText;
        btn.innerText = 'ENVIANDO...';
        btn.disabled = true;

        try {
            const { error } = await supabase
                .from('trips')
                .insert({
                    driver_id: this.userId,
                    vehicle_id: vehicleId,
                    status: 'requested',
                    destination: destination,
                    motivo: motivo,
                    supervisor: supervisor,
                    created_at: new Date().toISOString(),
                    request_details: {
                        location: this.currentPosition ? 
                            `${this.currentPosition.lat},${this.currentPosition.lng}` : 
                            null
                    }
                });

            if (error) throw error;

            alert('✅ Solicitud enviada correctamente');
            
            // Limpiar formulario
            document.getElementById('vehicle-select').value = '';
            document.getElementById('destination').value = '';
            document.getElementById('motivo').value = '';
            document.getElementById('supervisor').value = '';
            document.getElementById('formulario-fields').classList.add('hidden');
            
            await this.loadMyRequests();

        } catch (error) {
            console.error('Error enviando solicitud:', error);
            alert('Error: ' + error.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    // ========== VERIFICAR VIAJE ACTIVO ==========
    async checkActiveTrip() {
        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .select(`
                    *,
                    vehicles:vehicle_id(economic_number, plate, brand, model),
                    guard:guard_id(full_name)
                `)
                .eq('driver_id', this.userId)
                .in('status', ['approved_for_taller', 'awaiting_driver_signature', 'in_progress', 'awaiting_return_checklist'])
                .maybeSingle();

            if (error) throw error;

            const container = document.getElementById('active-trip-info');
            const content = document.getElementById('active-trip-content');

            if (!trip) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');

            const statusMap = {
                'approved_for_taller': { text: '✅ Aprobado - Acude a taller', color: 'text-orange-500' },
                'awaiting_driver_signature': { text: '✍️ Esperando tu firma', color: 'text-yellow-500' },
                'in_progress': { text: '🚗 En viaje', color: 'text-green-500' },
                'awaiting_return_checklist': { text: '🔄 Retornando - Acude a taller', color: 'text-blue-500' }
            };

            const status = statusMap[trip.status] || { text: trip.status, color: 'text-white' };

            content.innerHTML = `
                <div class="bg-[#111a22] p-4 rounded-lg">
                    <p class="text-xs text-[#92adc9]">Unidad</p>
                    <p class="text-white font-bold">ECO-${trip.vehicles?.economic_number} · ${trip.vehicles?.plate}</p>
                    
                    <p class="text-xs text-[#92adc9] mt-3">Destino</p>
                    <p class="text-white">${trip.destination || 'No especificado'}</p>
                    
                    <p class="text-xs text-[#92adc9] mt-3">Estado</p>
                    <p class="${status.color} font-bold">${status.text}</p>
                    
                    ${trip.status === 'awaiting_driver_signature' ? `
                        <button onclick="window.driverView.signReception('${trip.id}')" 
                                class="w-full mt-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">
                            FIRMAR RECEPCIÓN
                        </button>
                    ` : ''}
                </div>
            `;

        } catch (error) {
            console.error('Error verificando viaje activo:', error);
        }
    }

    async getActiveTrip() {
        try {
            const { data: trip, error } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', this.userId)
                .in('status', ['approved_for_taller', 'awaiting_driver_signature', 'in_progress', 'awaiting_return_checklist'])
                .maybeSingle();

            if (error) throw error;
            return trip;
        } catch (error) {
            console.error('Error obteniendo viaje activo:', error);
            return null;
        }
    }

    // ========== FIRMAR RECEPCIÓN ==========
    async signReception(tripId) {
        // Aquí implementarías la firma digital
        // Por ahora, usamos un prompt simple
        const firmar = confirm('¿Confirmas que has recibido la unidad en buen estado?');
        
        if (!firmar) return;

        try {
            const { error } = await supabase
                .from('trips')
                .update({
                    status: 'in_progress',
                    driver_signature: 'Firma digital', // Aquí iría la firma real
                    start_time: new Date().toISOString()
                })
                .eq('id', tripId);

            if (error) throw error;

            alert('✅ Recepción confirmada. Puedes acudir a la salida con el guardia.');
            await this.checkActiveTrip();

        } catch (error) {
            console.error('Error firmando recepción:', error);
            alert('Error al firmar');
        }
    }

    // ========== MIS SOLICITUDES ==========
    async loadMyRequests() {
        try {
            const { data: requests, error } = await supabase
                .from('trips')
                .select(`
                    id,
                    created_at,
                    destination,
                    motivo,
                    status,
                    vehicles:vehicle_id(economic_number, plate)
                `)
                .eq('driver_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            const list = document.getElementById('requests-list');
            if (!list) return;

            if (!requests || requests.length === 0) {
                list.innerHTML = '<p class="text-slate-500 text-center text-xs">No tienes solicitudes</p>';
                return;
            }

            list.innerHTML = requests.map(r => {
                const statusColors = {
                    'requested': 'text-yellow-500',
                    'approved_for_taller': 'text-orange-500',
                    'rejected': 'text-red-500',
                    'in_progress': 'text-green-500',
                    'completed': 'text-blue-500',
                    'incident_report': 'text-red-400'
                };

                const statusTexts = {
                    'requested': 'Pendiente',
                    'approved_for_taller': 'Aprobado - Taller',
                    'rejected': 'Rechazado',
                    'in_progress': 'En viaje',
                    'completed': 'Completado',
                    'incident_report': 'Incidencia'
                };

                return `
                    <div class="bg-[#111a22] p-3 rounded-lg border border-slate-700">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-white text-sm font-bold">ECO-${r.vehicles?.economic_number || '?'}</p>
                                <p class="text-xs text-[#92adc9]">${r.destination || 'Sin destino'}</p>
                            </div>
                            <span class="text-xs ${statusColors[r.status] || 'text-white'}">${statusTexts[r.status] || r.status}</span>
                        </div>
                        <p class="text-[10px] text-[#92adc9] mt-2">${new Date(r.created_at).toLocaleString()}</p>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        }
    }

    // Limpiar al salir
    destroy() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
    }
}
