export class Layout {
    constructor() {
        this.role = localStorage.getItem('userRole') || 'guest';
        this.userId = localStorage.getItem('userId');
        console.log('🎨 Layout inicializado con rol:', this.role);
    }

    hasValidSession() {
        return this.role && this.role !== 'guest' && this.userId;
    }

    getSidebar() {
        if (!this.hasValidSession() || this.role === 'driver' || this.role === 'guest') {
            return '';
        }

        let menuItems = '';

        // ============================================
        // MENÚ PARA ADMINISTRADOR
        // ============================================
        if (this.role === 'admin') {
            menuItems = `
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mb-2 px-2">Principal</div>
                
                <a href="#dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-primary/20 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">dashboard</span> 
                    <span class="font-medium text-sm">Panel de Control</span>
                </a>
                
                <a href="#users" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-primary/20 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">group</span> 
                    <span class="font-medium text-sm">Usuarios</span>
                </a>
                
                <a href="#tracking" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1 group relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span class="material-symbols-outlined text-[22px] group-hover:text-emerald-400 transition-colors">satellite_alt</span> 
                    <span class="font-medium text-sm group-hover:text-white relative z-10">Torre de Control GPS</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10"></span>
                </a>

                <a href="#assignments" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">assignment_ind</span> 
                    <span class="font-medium text-sm">Asignaciones</span>
                </a>

                <a href="#fuel" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">local_gas_station</span> 
                    <span class="font-medium text-sm">Combustible</span>
                </a>

                <a href="#incidents-admin" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">warning</span> 
                    <span class="font-medium text-sm">Incidentes</span>
                </a>
                
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mt-6 mb-2 px-2">Gestión de Activos</div>
                
                <a href="#inventory" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">directions_car</span> 
                    <span class="font-medium text-sm">Maestro de Unidades</span>
                </a>
                
                <a href="#stock" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">inventory_2</span> 
                    <span class="font-medium text-sm">Stock y Recetas</span>
                </a>
                
                <a href="#taller" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all">
                    <span class="material-symbols-outlined text-[22px]">build_circle</span> 
                    <span class="font-medium text-sm">Taller Central</span>
                </a>
                
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mt-6 mb-2 px-2">Analítica y SLA</div>
                
                <a href="#reports" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-[#324d67]/30 transition-all">
                    <span class="material-symbols-outlined text-[22px]">analytics</span> 
                    <span class="font-medium text-sm">Reportes BI</span>
                </a>
            `;
        } 
        
        // ============================================
        // MENÚ PARA TALLER
        // ============================================
        else if (this.role === 'taller') {
            menuItems = `
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mb-2 px-2">Taller</div>
                
                <a href="#taller" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-500/20 mb-1">
                    <span class="material-symbols-outlined">engineering</span> 
                    <span class="font-medium text-sm">Panel Taller</span>
                </a>
                
                <a href="#taller-inventory" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-purple-500/20 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">inventory</span> 
                    <span class="font-medium text-sm">Maestro de Unidades</span>
                </a>
                
                <a href="#taller-stock" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-purple-500/20 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">build</span> 
                    <span class="font-medium text-sm">Stock Refacciones</span>
                </a>
                
                <a href="#taller-reports" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#92adc9] hover:text-white hover:bg-purple-500/20 transition-all mb-1">
                    <span class="material-symbols-outlined text-[22px]">bar_chart</span> 
                    <span class="font-medium text-sm">Reportes Taller</span>
                </a>
                
                <div class="border-t border-[#324d67] my-4"></div>
                
                <a href="#incident" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all border border-red-500/20">
                    <span class="material-symbols-outlined text-[22px]">report_problem</span> 
                    <span class="font-medium text-sm">Reportar Incidente</span>
                </a>
            `;
        }
        
        // ============================================
        // MENÚ PARA VIGILANCIA
        // ============================================
        else if (this.role === 'guard') {
            menuItems = `
                <div class="text-xs font-bold text-[#92adc9] uppercase tracking-wider mb-2 px-2">Operación</div>
                
                <a href="#scanner" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 mb-1">
                    <span class="material-symbols-outlined">qr_code_scanner</span> 
                    <span class="font-medium text-sm">Escáner QR</span>
                </a>
                
                <div class="border-t border-[#324d67] my-4"></div>
                
                <a href="#incident" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all border border-red-500/20">
                    <span class="material-symbols-outlined text-[22px]">report_problem</span> 
                    <span class="font-medium text-sm">Reportar Incidente</span>
                </a>
            `;
        }

        return `
        <aside class="w-64 bg-[#111a22] border-r border-[#324d67] flex flex-col hidden md:flex h-screen shrink-0">
            <div class="h-20 flex items-center px-6 gap-3 border-b border-[#324d67]">
                <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <span class="material-symbols-outlined">shield_person</span>
                </div>
                <div>
                    <h1 class="text-white font-bold text-base leading-tight">COV Naucalpan</h1>
                    <p class="text-[#92adc9] text-[10px] uppercase font-black tracking-tighter">
                        ${this.role === 'admin' ? 'Administrador' : 
                          this.role === 'taller' ? 'Jefe de Taller' : 
                          this.role === 'guard' ? 'Vigilancia' : 'Seguridad'}
                    </p>
                </div>
            </div>
            
            <nav class="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                ${menuItems}
            </nav>
            
            <div class="p-4 border-t border-[#324d67]">
                <div class="flex items-center gap-2 px-3 py-2 mb-2 bg-[#1c2127] rounded-xl border border-[#324d67]">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-[10px] text-[#92adc9] uppercase font-bold">${localStorage.getItem('userName') || this.role}</span>
                </div>
                <button onclick="localStorage.clear(); window.location.hash='#login'; window.location.reload();" 
                        class="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-[#92adc9] transition-all text-left group">
                    <span class="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                    <span class="text-sm font-bold">Cerrar Sesión</span>
                </button>
            </div>
        </aside>`;
    }

    render(contentHTML) {
        const hasValidSession = this.hasValidSession();
        
        // Para invitados (login) o conductores, solo contenido sin sidebar
        if (!hasValidSession || this.role === 'driver') {
            return contentHTML;
        }

        // Para admin, taller, guardia - layout completo con sidebar
        return `
        <div class="flex h-screen w-full bg-[#0d141c] font-display overflow-hidden">
            ${this.getSidebar()}
            
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header class="h-16 flex items-center justify-between px-8 bg-[#111a22] border-b border-[#324d67] z-10 shrink-0 shadow-sm">
                    <div class="flex items-center gap-3 text-white overflow-hidden">
                        <span class="material-symbols-outlined text-[#92adc9]">calendar_today</span>
                        <span class="text-sm font-bold truncate">
                            ${new Date().toLocaleDateString('es-MX', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </span>
                    </div>
                    
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-3 pl-4 border-l border-[#324d67]">
                            <div class="flex flex-col text-right hidden sm:block">
                                <p class="text-white text-xs font-bold leading-none">
                                    ${this.getRoleDisplay()}
                                </p>
                                <p class="text-[#92adc9] text-[10px] flex items-center justify-end gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 
                                    En línea
                                </p>
                            </div>
                            <div class="size-9 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-black border border-white/10 shadow-lg shadow-primary/20 cursor-pointer">
                                ${this.getInitials()}
                            </div>
                        </div>
                    </div>
                </header>
                
                <main class="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar relative">
                    <div class="max-w-[1600px] mx-auto h-full">
                        ${contentHTML}
                    </div>
                </main>
            </div>
        </div>
        `;
    }

    getRoleDisplay() {
        const roleMap = {
            'admin': 'Administrador',
            'taller': 'Jefe de Taller',
            'guard': 'Vigilancia',
            'driver': 'Conductor',
            'guest': 'Invitado'
        };
        return roleMap[this.role] || this.role;
    }

    getInitials() {
        const name = localStorage.getItem('userName') || this.role;
        return name ? name.charAt(0).toUpperCase() : '?';
    }
}
