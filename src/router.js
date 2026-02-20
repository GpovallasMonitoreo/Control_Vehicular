import { Layout } from './components/Layout.js';

// Vistas Auth
import { LoginView } from './views/auth/LoginView.js';

// Vistas Admin
import { DashboardView } from './views/admin/DashboardView.js';
import { AdminDashboardView } from './views/admin/AdminDashboardView.js';
import { AssignmentsView } from './views/admin/AssignmentsView.js';
import { FuelView } from './views/admin/FuelView.js';
import { MaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView } from './views/admin/InventoryView.js';
import { IncidentsDashboard } from './views/admin/IncidentsDashboard.js';
import { ReportsView } from './views/admin/ReportsView.js';
import { FleetView } from './views/admin/FleetView.js';
import { InventoryStockView } from './views/admin/InventoryStockView.js';
import { TrackingView } from './views/admin/TrackingView.js';

// Vistas Taller
import { MaintenanceView as TallerMaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView as TallerInventoryView } from './views/admin/InventoryView.js';
import { InventoryStockView as TallerStockView } from './views/admin/InventoryStockView.js';
import { ReportsView as TallerReportsView } from './views/admin/ReportsView.js';

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
        this.isHandlingRoute = false; // Bandera para evitar bucles

        // Mapeo de rutas
        this.routes = {
            '': LoginView,
            '#login': LoginView,
            
            // Admin
            '#dashboard': DashboardView,
            '#users': AdminDashboardView,
            '#assignments': AssignmentsView,
            '#inventory': InventoryView,
            '#fleet': FleetView,
            '#fuel': FuelView,
            '#maintenance': MaintenanceView,
            '#incidents-admin': IncidentsDashboard,
            '#reports': ReportsView,
            '#stock': InventoryStockView,
            '#tracking': TrackingView,
            
            // Taller
            '#taller-dashboard': TallerMaintenanceView,
            '#taller-inventory': TallerInventoryView,
            '#taller-stock': TallerStockView,
            '#taller-reports': TallerReportsView,
            
            // Vigilancia
            '#scanner': ScannerView,
            
            // Conductor
            '#driver': DriverView,
            
            // Compartidas
            '#incident': IncidentsView
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        // Evitar procesamiento múltiple
        if (this.isHandlingRoute) return;
        this.isHandlingRoute = true;

        try {
            let hash = window.location.hash || '#login';
            
            // Obtener rol y verificar sesión
            const role = localStorage.getItem('userRole');
            const userId = localStorage.getItem('userId');
            
            console.log(`📍 Navegando a: ${hash} | Rol: ${role || 'sin sesión'}`);

            // VERIFICACIÓN DE SESIÓN - CORREGIDA
            const hasValidSession = role && userId;
            
            // Si NO hay sesión válida y NO estamos en login, redirigir a login
            if (!hasValidSession && hash !== '#login') {
                console.log('⛔ Sin sesión válida, redirigiendo a login');
                window.location.hash = '#login';
                this.isHandlingRoute = false;
                return;
            }

            // Si HAY sesión válida y estamos en login, redirigir según rol
            if (hasValidSession && hash === '#login') {
                const redirectMap = {
                    'admin': '#dashboard',
                    'taller': '#taller-dashboard',
                    'guard': '#scanner',
                    'driver': '#driver'
                };
                const redirectTo = redirectMap[role] || '#dashboard';
                console.log(`🔄 Sesión activa como ${role}, redirigiendo a ${redirectTo}`);
                window.location.hash = redirectTo;
                this.isHandlingRoute = false;
                return;
            }

            // Verificar permisos si hay sesión
            if (hasValidSession && !this.hasPermission(role, hash)) {
                console.log(`⛔ Acceso denegado: ${role} no tiene permiso para ${hash}`);
                this.redirectToDefault(role);
                this.isHandlingRoute = false;
                return;
            }

            console.log("✅ Navegando a:", hash);
            
            // Obtener la clase de la vista
            const ViewClass = this.routes[hash];
            
            if (!ViewClass) {
                console.log('⚠️ Ruta no encontrada, redirigiendo a login');
                window.location.hash = '#login';
                this.isHandlingRoute = false;
                return;
            }
            
            // Renderizar la vista
            const view = new ViewClass();
            this.appElement.innerHTML = this.layout.render(view.render());
            
            // Ejecutar lógica post-render
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
            // Liberar la bandera después de un tiempo
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
                '#tracking', '#incident'
            ],
            'taller': [
                '#taller-dashboard', '#taller-inventory', '#taller-stock', 
                '#taller-reports', '#incident'
            ],
            'guard': [
                '#scanner', '#incident'
            ],
            'driver': [
                '#driver', '#incident'
            ]
        };

        const publicRoutes = ['#login', ''];
        if (publicRoutes.includes(hash)) return true;

        return permissions[role]?.includes(hash) || false;
    }

    redirectToDefault(role) {
        const defaultRoutes = {
            'admin': '#dashboard',
            'taller': '#taller-dashboard',
            'guard': '#scanner',
            'driver': '#driver'
        };
        window.location.hash = defaultRoutes[role] || '#login';
    }
}
