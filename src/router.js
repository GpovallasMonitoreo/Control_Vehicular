import { Layout } from './components/Layout.js';

// Vistas Auth
import { LoginView } from './views/auth/LoginView.js';

// Vistas Admin
import { DashboardView } from './views/admin/DashboardView.js';
import { AdminDashboardView } from './views/admin/AdminDashboardView.js';
import { AssignmentsView } from './views/admin/AssignmentsView.js';
import { FuelView } from './views/admin/FuelView.js';
import { InventoryView } from './views/admin/InventoryView.js';
import { IncidentsDashboard } from './views/admin/IncidentsDashboard.js';
import { ReportsView } from './views/admin/ReportsView.js';
import { FleetView } from './views/admin/FleetView.js';
import { InventoryStockView } from './views/admin/InventoryStockView.js';
import { TrackingView } from './views/admin/TrackingView.js';

// Vistas Taller (Tu nueva vista separada)
import { TallerView } from './views/taller/TallerView.js';

// Vistas Vigilancia
import { ScannerView } from './views/guard/ScannerView.js';

// Vistas Compartidas
import { IncidentsView } from './views/shared/IncidentsView.js';

// Vistas Conductor
import { DriverView } from './views/driver/DriverView.js';

export class Router {
    constructor() {
        console.log("✅ Router inicializado");
        this.appElement = document.getElementById('app');
        this.layout = new Layout();
        this.isHandlingRoute = false;

        // MAPEO DE RUTAS
        this.routes = {
            '': LoginView,
            '#login': LoginView,
            
            // ADMIN
            '#dashboard': DashboardView,
            '#users': AdminDashboardView,
            '#assignments': AssignmentsView,
            '#inventory': InventoryView,
            '#fleet': FleetView,
            '#fuel': FuelView,
            '#incidents-admin': IncidentsDashboard,
            '#reports': ReportsView,
            '#stock': InventoryStockView,
            '#tracking': TrackingView,
            '#maintenance': TallerView, // Redirige a la nueva vista de taller
            
            // TALLER
            '#taller': TallerView, // Nueva ruta oficial de Taller
            '#taller-dashboard': TallerView, 
            '#taller-inventory': InventoryView,
            '#taller-stock': InventoryStockView,
            '#taller-reports': ReportsView,
            
            // VIGILANCIA
            '#scanner': ScannerView,
            
            // CONDUCTOR
            '#driver': DriverView,
            
            // COMPARTIDAS
            '#incident': IncidentsView
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        if (this.isHandlingRoute) return;
        this.isHandlingRoute = true;

        try {
            let hash = window.location.hash || '#login';
            
            const role = localStorage.getItem('userRole');
            const userId = localStorage.getItem('userId');
            
            console.log(`📍 Navegando a: ${hash} | Rol: ${role || 'sin sesión'}`);

            const hasValidSession = role && userId;
            
            if (!hasValidSession && hash !== '#login') {
                window.location.hash = '#login';
                this.isHandlingRoute = false;
                return;
            }

            if (hasValidSession && hash === '#login') {
                const redirectMap = {
                    'admin': '#dashboard',
                    'taller': '#taller',
                    'guard': '#scanner',
                    'driver': '#driver'
                };
                window.location.hash = redirectMap[role] || '#dashboard';
                this.isHandlingRoute = false;
                return;
            }

            if (hasValidSession && !this.hasPermission(role, hash)) {
                console.log(`⛔ Acceso denegado: ${role} no tiene permiso para ${hash}`);
                this.redirectToDefault(role);
                this.isHandlingRoute = false;
                return;
            }

            const ViewClass = this.routes[hash];
            
            if (!ViewClass) {
                window.location.hash = '#login';
                this.isHandlingRoute = false;
                return;
            }
            
            // Destruir vista anterior si es necesario (limpieza de listeners/sockets)
            if (window.currentViewInstance && window.currentViewInstance.destroy) {
                window.currentViewInstance.destroy();
            }

            // Renderizar nueva vista
            const view = new ViewClass();
            window.currentViewInstance = view; // Guardamos la referencia activa
            this.appElement.innerHTML = this.layout.render(view.render());
            
            if (view.onMount) {
                setTimeout(() => view.onMount(), 0);
            }

        } catch (error) {
            console.error('❌ Error renderizando vista:', error);
            this.appElement.innerHTML = `
                <div class="flex items-center justify-center h-screen text-white">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                        <h2 class="text-2xl font-bold mb-2">Error al cargar la página</h2>
                        <p class="text-[#92adc9]">${error.message}</p>
                        <button onclick="window.location.hash='#login'" class="mt-4 px-6 py-2 bg-primary rounded-lg">
                            Volver al inicio
                        </button>
                    </div>
                </div>
            `;
        } finally {
            setTimeout(() => {
                this.isHandlingRoute = false;
            }, 100);
        }
    }

    hasPermission(role, hash) {
        const permissions = {
            'admin': [
                '#dashboard', '#users', '#assignments', '#inventory', '#fleet',
                '#fuel', '#maintenance', '#incidents-admin', '#reports', '#stock',
                '#tracking', '#incident', '#taller'
            ],
            'taller': [
                '#taller', '#taller-dashboard', '#taller-inventory', '#taller-stock', 
                '#taller-reports', '#incident'
            ],
            'guard': ['#scanner', '#incident'],
            'driver': ['#driver', '#incident']
        };

        const publicRoutes = ['#login', ''];
        if (publicRoutes.includes(hash)) return true;

        return permissions[role]?.includes(hash) || false;
    }

    redirectToDefault(role) {
        const defaultRoutes = {
            'admin': '#dashboard',
            'taller': '#taller',
            'guard': '#scanner',
            'driver': '#driver'
        };
        window.location.hash = defaultRoutes[role] || '#login';
    }
}
