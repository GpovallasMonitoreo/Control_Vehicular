import { Layout } from './components/Layout.js';

// Vistas Auth
import { LoginView } from './views/auth/LoginView.js';

// Vistas Admin
import { DashboardView } from './views/admin/DashboardView.js';
import { AssignmentsView } from './views/admin/AssignmentsView.js';
import { FuelView } from './views/admin/FuelView.js';
import { MaintenanceView } from './views/admin/MaintenanceView.js';
import { InventoryView } from './views/admin/InventoryView.js';
import { IncidentsDashboard } from './views/admin/IncidentsDashboard.js';
import { ReportsView } from './views/admin/ReportsView.js';
import { FleetView } from './views/admin/FleetView.js'; // ✅ Nueva Vista agregada

// Vistas Operativas
import { ScannerView } from './views/guard/ScannerView.js';
import { DriverView } from './views/driver/DriverView.js';
import { IncidentsView } from './views/shared/IncidentsView.js';

export class Router {
    constructor() {
        console.log("✅ Router inicializado");
        this.appElement = document.getElementById('app');
        this.layout = new Layout();

        // Mapeo de rutas
        this.routes = {
            '': LoginView,            // Ruta raíz
            '#login': LoginView,
            
            // Admin
            '#dashboard': DashboardView,
            '#assignments': AssignmentsView,
            '#inventory': InventoryView,
            '#fleet': FleetView,       // ✅ Nueva Ruta para control de unidades y multas
            '#fuel': FuelView,
            '#maintenance': MaintenanceView,
            '#incidents-admin': IncidentsDashboard,
            '#reports': ReportsView,   // KPIs de conductores / SLAs
            
            // Operativos
            '#scanner': ScannerView,
            '#driver': DriverView,
            '#incident': IncidentsView
        };

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        let hash = window.location.hash || '#login';
        
        // Verificación simple de sesión
        const role = localStorage.getItem('userRole');
        
        // Si no hay rol y no estamos en login, forzar login
        if (!role && hash !== '#login') {
            window.location.hash = '#login';
            return;
        }

        // Redirecciones automáticas si ya hay sesión
        if (role && hash === '#login') {
            if (role === 'admin') window.location.hash = '#dashboard';
            else if (role === 'guard') window.location.hash = '#scanner';
            else if (role === 'driver') window.location.hash = '#driver';
            return;
        }

        console.log("Navegando a:", hash);
        
        const ViewClass = this.routes[hash] || LoginView;
        
        // Renderizado
        const view = new ViewClass();
        
        // El layout decide si muestra sidebar o no basado en el rol
        this.appElement.innerHTML = this.layout.render(view.render());
        
        // Ejecutar lógica post-render (listeners, cargas de datos)
        if (view.onMount) {
            view.onMount();
        }
    }
}