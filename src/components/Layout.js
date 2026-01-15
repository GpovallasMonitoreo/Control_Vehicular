export class Layout {
    constructor() {
        // Leemos el rol del usuario (admin, guard, driver, guest)
        this.role = localStorage.getItem('userRole') || 'guest';
    }

    // Genera el HTML del menú lateral según el rol
    getSidebar() {
        // Si es chofer o invitado (login), NO mostramos sidebar lateral (vista móvil pura)
        if (this.role === 'driver' || this.role === 'guest') return '';

        let menuItems = '';

        // Menú para ADMIN
        if (this.role === 'admin') {
            menuItems = `
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mb-2 px-2">Principal</div>
                <a href="#dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">dashboard</span> <span class="font-medium text-sm">Panel de Control</span>
                </a>
                <a href="#assignments" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">assignment_ind</span> <span class="font-medium text-sm">Asignaciones</span>
                </a>
                
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mt-6 mb-2 px-2">Gestión de Activos</div>
                <a href="#inventory" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">garage_home</span> <span class="font-medium text-sm">Inventario Base</span>
                </a>
                <a href="#fleet" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">local_shipping</span> <span class="font-medium text-sm">Control de Flota</span>
                </a>
                <a href="#fuel" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">local_gas_station</span> <span class="font-medium text-sm">Combustible</span>
                </a>
                <a href="#maintenance" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all">
                    <span class="material-symbols-outlined text-[22px]">build_circle</span> <span class="font-medium text-sm">Mantenimiento</span>
                </a>
                
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mt-6 mb-2 px-2">Analítica y SLA</div>
                <a href="#incidents-admin" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">report_gmailerrorred</span> <span class="font-medium text-sm">Incidentes</span>
                </a>
                <a href="#reports" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all">
                    <span class="material-symbols-outlined text-[22px]">analytics</span> <span class="font-medium text-sm">Reportes BI</span>
                </a>
            `;
        } 
        // Menú para GUARDIA
        else if (this.role === 'guard') {
            menuItems = `
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mb-2 px-2">Operación</div>
                <a href="#scanner" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mb-1">
                    <span class="material-symbols-outlined">qr_code_scanner</span> <span class="font-medium text-sm">Escáner QR</span>
                </a>
                <a href="#incident" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all mt-4 border border-red-500/20">
                    <span class="material-symbols-outlined text-[22px]">report_problem</span> <span class="font-medium text-sm">Reportar Daño</span>
                </a>
            `;
        }

        return `
        <aside class="w-64 bg-[#111a22] border-r border-[#324d67] flex flex-col hidden md:flex h-screen shrink-0">
            <div class="h-20 flex items-center px-6 gap-3 border-b border-[#324d67]">
                <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <span class="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                    <h1 class="text-white font-bold text-base leading-tight">COV Naucalpan</h1>
                    <p class="text-[#92adc9] text-[10px] uppercase font-black tracking-tighter">${this.role === 'admin' ? 'Fleet Director' : 'Seguridad Interna'}</p>
                </div>
            </div>
            <nav class="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                ${menuItems}
            </nav>
            <div class="p-4 border-t border-[#324d67]">
                <button onclick="localStorage.clear(); window.location.hash='#login'; window.location.reload();" class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-[#92adc9] transition-all text-left group">
                    <span class="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                    <span class="text-sm font-bold">Cerrar Sesión</span>
                </button>
            </div>
        </aside>`;
    }

    render(contentHTML) {
        // Si es driver o invitado, no inyectamos la estructura administrativa
        if (this.role === 'guest' || this.role === 'driver') {
            return contentHTML;
        }

        // Estructura Admin/Guardia con Sidebar y Header optimizado
        return `
        <div class="flex h-screen w-full bg-[#101922] font-display overflow-hidden">
            ${this.getSidebar()}
            
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header class="h-16 flex items-center justify-between px-8 bg-[#111a22]/90 backdrop-blur border-b border-[#324d67] z-10 shrink-0">
                    <div class="flex items-center gap-3 text-white overflow-hidden">
                        <span class="material-symbols-outlined text-[#92adc9]">calendar_today</span>
                        <span class="text-sm font-bold truncate">${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    
                    <div class="flex items-center gap-6">
                        <div class="relative hidden lg:block w-72">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-[#92adc9]">
                                <span class="material-symbols-outlined text-[18px]">search</span>
                            </span>
                            <input class="bg-[#1c2127] border border-[#324d67] text-white text-xs rounded-full focus:ring-1 focus:ring-primary focus:border-primary block w-full pl-10 p-2 placeholder-slate-500 outline-none transition-all" placeholder="Buscar en plataforma..." type="text">
                        </div>
                        
                        <div class="flex items-center gap-3 pl-4 border-l border-[#324d67]">
                            <div class="flex flex-col text-right hidden sm:block">
                                <p class="text-white text-xs font-bold leading-none">${this.role.toUpperCase()}</p>
                                <p class="text-[#92adc9] text-[10px]">En línea</p>
                            </div>
                            <div class="size-9 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-black border border-white/10 shadow-lg shadow-primary/20 cursor-pointer">
                                ${this.role.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>
                
                <main class="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
                    <div class="max-w-[1600px] mx-auto">
                        ${contentHTML}
                    </div>
                </main>
            </div>
        </div>
        `;
    }
}