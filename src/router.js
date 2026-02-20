import { Layout } from './components/Layout.js';

// Vistas Auth
import { LoginView } from './views/auth/LoginView.js';

// Vistas Admin (TODAS LAS QUE TIENES EN TU CARPETA)
import { DashboardView } from './views/admin/DashboardView.js';
import { AdminDashboardView } from './views/admin/AdminDashboardView.js'; // Gestión de usuarios
import { AssignmentsView } from './views/admin/AssignmentsView.js';
import { FuelView } from './views/admin/FuelView.js';
import { MaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView } from './views/admin/InventoryView.js';
import { IncidentsDashboard } from './views/admin/IncidentsDashboard.js';
import { ReportsView } from './views/admin/ReportsView.js';
import { FleetView } from './views/admin/FleetView.js';
import { InventoryStockView } from './views/admin/InventoryStockView.js';
import { TrackingView } from './views/admin/TrackingView.js'; // ✅ TU VISTA DE MAPA

// Vistas Taller (las que YA TIENES en admin, que usará el rol 'taller')
// NOTA: El rol 'taller' usará las mismas vistas de admin pero con permisos restringidos
import { MaintenanceView as TallerMaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView as TallerInventoryView } from './views/admin/InventoryView.js';
import { InventoryStockView as TallerStockView } from './views/admin/InventoryStockView.js';
import { ReportsView as TallerReportsView } from './views/admin/ReportsView.js';

// Vistas Vigilancia (Guardia)
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

        // MAPEO DE RUTAS - SOLO CON TUS VISTAS EXISTENTES
        this.routes = {
            // Auth
            '': LoginView,
            '#login': LoginView,
            
            // ============================================
            // ADMINISTRADOR (acceso completo)
            // ============================================
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
            '#tracking': TrackingView, // ✅ TU MAPA EN TIEMPO REAL
            
            // ============================================
            // TALLER (MECÁNICO) - USA LAS MISMAS VISTAS DE ADMIN
            // PERO CON RUTAS ESPECÍFICAS PARA SU ROL
            // ============================================
            '#taller-dashboard': TallerMaintenanceView,     // Panel principal del taller
            '#taller-inventory': TallerInventoryView,       // Inventario de refacciones
            '#taller-stock': TallerStockView,               // Stock y recetas
            '#taller-reports': TallerReportsView,           // Reportes del taller
            
            // ============================================
            // VIGILANCIA (GUARDIA)
            // ============================================
            '#scanner': ScannerView,
            
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
                'taller': '#taller-dashboard', // Redirige al panel de taller
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
        // Definir permisos por rol - SOLO CON RUTAS EXISTENTES
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

        // Si la ruta no requiere permiso especial, permitir
        const publicRoutes = ['#login', ''];
        if (publicRoutes.includes(hash)) return true;

        // Verificar si el rol tiene permiso
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
