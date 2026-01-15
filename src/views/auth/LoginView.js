export class LoginView {
    constructor() {
        this.selectedRole = null;
    }

    render() {
        return `
        <div class="fixed inset-0 z-50 min-h-screen w-full bg-[#0d141c] flex items-center justify-center overflow-y-auto font-display">
            
            <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px]"></div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px]"></div>
            </div>

            <div class="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col items-center justify-center min-h-full">
                
                <div class="text-center mb-12 animate-fade-in-up" style="animation-delay: 0.1s;">
                    <div class="inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl shadow-primary/30 mb-6">
                        <span class="material-symbols-outlined text-5xl">local_shipping</span>
                    </div>
                    <h1 class="text-4xl md:text-6xl font-black text-white tracking-tight mb-3">COV Naucalpan</h1>
                    <p class="text-[#92adc9] text-lg md:text-xl font-medium">Sistema Integral de Gestión Vehicular</p>
                </div>

                <div id="role-selector" class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-fade-in-up" style="animation-delay: 0.2s;">
                    
                    <button onclick="window.selectRole('admin')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-primary hover:shadow-[0_0_40px_rgba(19,127,236,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-primary">
                            <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Administración</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">Control total de la flota, gestión de usuarios, reportes financieros y auditoría.</p>
                    </button>

                    <button onclick="window.selectRole('guard')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-emerald-500">
                            <span class="material-symbols-outlined text-3xl">security</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Vigilancia</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">Control de accesos, escáner QR de seguridad y validación de salidas.</p>
                    </button>

                    <button onclick="window.selectRole('driver')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-orange-500">
                            <span class="material-symbols-outlined text-3xl">directions_car</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Operador</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">App móvil para checklist de salida, reporte de incidentes y perfil.</p>
                    </button>

                </div>

                <div id="login-form" class="hidden w-full max-w-md bg-[#1c2127] border border-[#324d67] p-8 rounded-3xl shadow-2xl mt-8 relative animate-fade-in-up">
                    <button onclick="window.resetSelection()" class="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    
                    <h3 id="form-title" class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-3xl">lock</span> Iniciar Sesión
                    </h3>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2 tracking-wider">Usuario / ID</label>
                            <input type="text" class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Ingresa tu usuario">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2 tracking-wider">Contraseña</label>
                            <input type="password" class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••••">
                        </div>
                        <button onclick="window.submitLogin()" class="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 transform active:scale-95">
                            Entrar al Sistema
                        </button>
                    </div>
                </div>

                <p class="absolute bottom-6 text-center text-[#324d67] text-xs font-mono w-full">v1.0.0 Alpha • Server: NAUC-SEC-01</p>
            </div>
        </div>
        `;
    }

    onMount() {
        let currentRole = '';

        window.selectRole = (role) => {
            currentRole = role;
            document.getElementById('role-selector').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
            
            const titles = {
                'admin': 'Acceso Administrativo',
                'guard': 'Acceso Seguridad',
                'driver': 'Acceso Operador'
            };
            // Actualizar título del form
            const titleEl = document.getElementById('form-title');
            titleEl.innerHTML = `<span class="material-symbols-outlined text-primary text-3xl">lock</span> ${titles[role]}`;
        };

        window.resetSelection = () => {
            document.getElementById('role-selector').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
        };

        window.submitLogin = () => {
            const btn = document.querySelector('#login-form button');
            btn.innerText = "Verificando...";
            btn.disabled = true;
            btn.classList.add('opacity-75', 'cursor-wait');
            
            setTimeout(() => {
                console.log(`Login exitoso: ${currentRole}`);
                localStorage.setItem('userRole', currentRole);
                
                if (currentRole === 'admin') window.location.hash = '#dashboard';
                else if (currentRole === 'guard') window.location.hash = '#scanner';
                else if (currentRole === 'driver') window.location.hash = '#driver';
                
                window.location.reload(); 
            }, 800);
        };
    }
}