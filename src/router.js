import { Layout } from './components/Layout.js';

// Vistas Auth
import { LoginView } from './views/auth/LoginView.js';

// Vistas Admin
import { DashboardView } from './views/admin/DashboardView.js';
import { AdminDashboardView } from './views/admin/AdminDashboardView.js'; // Para gestión de usuarios
import { AssignmentsView } from './views/admin/AssignmentsView.js';
import { FuelView } from './views/admin/FuelView.js';
import { MaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView } from './views/admin/InventoryView.js';
import { IncidentsDashboard } from './views/admin/IncidentsDashboard.js';
import { ReportsView } from './views/admin/ReportsView.js';
import { FleetView } from './views/admin/FleetView.js';
import { InventoryStockView } from './views/admin/InventoryStockView.js';
import { TrackingView } from './views/admin/TrackingView.js';

// Vistas Taller (Mecánico)
import { WorkshopView } from './views/taller/WorkshopView.js';
import { PendingChecklistsView } from './views/taller/PendingChecklistsView.js';
import { MaintenanceQueueView } from './views/taller/MaintenanceQueueView.js';
import { WorkshopHistoryView } from './views/taller/WorkshopHistoryView.js';
import { PartsInventoryView } from './views/taller/PartsInventoryView.js';
import { WorkshopReportsView } from './views/taller/WorkshopReportsView.js';

// Vistas Vigilancia (Guardia)
import { ScannerView } from './views/guard/ScannerView.js';
import { AccessControlView } from './views/guard/AccessControlView.js';
import { ExitRecordsView } from './views/guard/ExitRecordsView.js';

// Vistas Compartidas
import { IncidentsView } from './views/shared/IncidentsView.js';

// Vistas Conductor
import { DriverView } from './views/driver/DriverView.js';

export class Router {
    constructor() {
        console.log("✅ Router inicializado");
        this.appElement = document.getElementById('app');
        this.layout = new Layout();

        // Mapeo de rutas
        this.routes = {
            // Auth
            '': LoginView,
            '#login': LoginView,
            
            // ============================================
            // ADMINISTRADOR
            // ============================================
            '#dashboard': DashboardView,
            '#users': AdminDashboardView,          // Gestión de usuarios
            '#assignments': AssignmentsView,
            '#inventory': InventoryView,
            '#fleet': FleetView,
            '#fuel': FuelView,
            '#maintenance': MaintenanceView,
            '#incidents-admin': IncidentsDashboard,
            '#reports': ReportsView,
            '#stock': InventoryStockView,
            '#tracking': TrackingView,
            
            // ============================================
            // TALLER (MECÁNICO)
            // ============================================
            '#workshop': WorkshopView,
            '#pending-checklists': PendingChecklistsView,
            '#maintenance-queue': MaintenanceQueueView,
            '#workshop-history': WorkshopHistoryView,
            '#parts-inventory': PartsInventoryView,
            '#workshop-reports': WorkshopReportsView,
            
            // ============================================
            // VIGILANCIA (GUARDIA)
            // ============================================
            '#scanner': ScannerView,
            '#access-control': AccessControlView,
            '#exit-records': ExitRecordsView,
            
            // ============================================
            // CONDUCTOR
            // ============================================
            '#driver': DriverView,
            
            // ============================================
            // COMPARTIDAS
            // ============================================
            '#incident': IncidentsView
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        let hash = window.location.hash || '#login';
        
        // Obtener rol y verificar sesión
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        
        console.log(`📍 Navegando a: ${hash} | Rol: ${role || 'sin sesión'}`);

        // Si no hay sesión y no vamos al login, redirigir
        if ((!role || !userId) && hash !== '#login') {
            console.log('⛔ Sin sesión, redirigiendo a login');
            window.location.hash = '#login';
            return;
        }

        // Si hay sesión y estamos en login, redirigir según rol
        if (role && hash === '#login') {
            const redirectMap = {
                'admin': '#dashboard',
                'taller': '#workshop',
                'guard': '#scanner',
                'driver': '#driver'
            };
            const redirectTo = redirectMap[role] || '#dashboard';
            console.log(`🔄 Sesión activa como ${role}, redirigiendo a ${redirectTo}`);
            window.location.hash = redirectTo;
            return;
        }

        // Verificar que el rol tenga permiso para la ruta
        if (role && !this.hasPermission(role, hash)) {
            console.log(`⛔ Acceso denegado: ${role} no tiene permiso para ${hash}`);
            this.redirectToDefault(role);
            return;
        }

        console.log("✅ Navegando a:", hash);
        
        // Obtener la clase de la vista
        const ViewClass = this.routes[hash];
        
        if (!ViewClass) {
            console.log('⚠️ Ruta no encontrada, redirigiendo a login');
            window.location.hash = '#login';
            return;
        }
        
        try {
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
        }
    }

    hasPermission(role, hash) {
        // Definir permisos por rol
        const permissions = {
            'admin': [
                '#dashboard', '#users', '#assignments', '#inventory', '#fleet',
                '#fuel', '#maintenance', '#incidents-admin', '#reports', '#stock',
                '#tracking', '#incident'
            ],
            'taller': [
                '#workshop', '#pending-checklists', '#maintenance-queue',
                '#workshop-history', '#parts-inventory', '#workshop-reports',
                '#incident'
            ],
            'guard': [
                '#scanner', '#access-control', '#exit-records', '#incident'
            ],
            'driver': [
                '#driver', '#incident'
            ]
        };

        // Si la ruta no requiere permiso especial, permitir
        const publicRoutes = ['#login', ''];
        if (publicRoutes.includes(hash)) return true;

        // Verificar si el rol tiene permiso
        return permissions[role]?.includes(hash) || false;
    }

    redirectToDefault(role) {
        const defaultRoutes = {
            'admin': '#dashboard',
            'taller': '#workshop',
            'guard': '#scanner',
            'driver': '#driver'
        };
        window.location.hash = defaultRoutes[role] || '#login';
    }
}
