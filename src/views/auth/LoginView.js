import { supabase } from '../../config/supabaseClient.js';

export class LoginView {
    constructor() {
        this.selectedRole = null;
        
        // Usuarios de prueba predefinidos (para desarrollo)
        this.testUsers = [
            {
                id: '77dc65f5-31bf-4362-bc84-038dc9a52bb4',
                email: 'conductor@cov.mx',
                password: 'Conductor2024!',
                full_name: 'Conductor Operador',
                role: 'driver'
            },
            {
                id: '95a93c3d-694f-4831-94c7-dc43cb58e24d',
                email: 'guardia@cov.mx',
                password: 'Guardia2024!',
                full_name: 'Guardia Seguridad',
                role: 'guard'
            },
            {
                id: '1eba62f8-f801-46c4-ba38-1c18c5410b26',
                email: 'admin@cov.mx',
                password: 'Admin2024!',
                full_name: 'Administrador Principal',
                role: 'admin'
            }
        ];
    }

    render() {
        return `
        <div class="fixed inset-0 z-50 min-h-screen w-full bg-[#0d141c] flex items-center justify-center overflow-y-auto font-display">
            
            <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px]"></div>
                <div class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px]"></div>
            </div>

            <div class="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col items-center justify-center min-h-full">
                
                <!-- BOTONES DE ACCESO RÁPIDO PARA PRUEBAS -->
                <div class="w-full max-w-5xl mb-6 flex justify-center gap-3 flex-wrap">
                    <button onclick="window.loginView.quickLogin('conductor@cov.mx', 'Conductor2024!')" 
                            class="px-4 py-2 bg-orange-500/20 border border-orange-500/30 text-orange-500 rounded-full text-xs font-bold hover:bg-orange-500 hover:text-white transition-colors">
                        🚗 Conductor
                    </button>
                    <button onclick="window.loginView.quickLogin('guardia@cov.mx', 'Guardia2024!')" 
                            class="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-full text-xs font-bold hover:bg-emerald-500 hover:text-white transition-colors">
                        🔒 Guardia
                    </button>
                    <button onclick="window.loginView.quickLogin('admin@cov.mx', 'Admin2024!')" 
                            class="px-4 py-2 bg-primary/20 border border-primary/30 text-primary rounded-full text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                        ⚡ Admin
                    </button>
                </div>

                <div class="text-center mb-12 animate-fade-in-up" style="animation-delay: 0.1s;">
                    <div class="inline-flex items-center justify-center size-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-2xl shadow-primary/30 mb-6">
                        <span class="material-symbols-outlined text-5xl">local_shipping</span>
                    </div>
                    <h1 class="text-4xl md:text-6xl font-black text-white tracking-tight mb-3">COV Naucalpan</h1>
                    <p class="text-[#92adc9] text-lg md:text-xl font-medium">Sistema Integral de Gestión Vehicular</p>
                </div>

                <!-- MENSAJE DE ERROR -->
                <div id="login-error" class="hidden w-full max-w-md mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm font-bold">
                    ⚠️ <span id="error-message">Error de autenticación</span>
                </div>

                <div id="role-selector" class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-fade-in-up" style="animation-delay: 0.2s;">
                    
                    <button onclick="window.loginView.selectRole('admin')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-primary hover:shadow-[0_0_40px_rgba(19,127,236,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-primary">
                            <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Administración</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">Control total de la flota, gestión de usuarios, reportes financieros y auditoría.</p>
                    </button>

                    <button onclick="window.loginView.selectRole('guard')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-emerald-500">
                            <span class="material-symbols-outlined text-3xl">security</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Vigilancia</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">Control de accesos, escáner QR de seguridad y validación de salidas.</p>
                    </button>

                    <button onclick="window.loginView.selectRole('driver')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-8 rounded-3xl text-left hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-start h-full">
                        <div class="size-14 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-6 border border-slate-700 group-hover:border-orange-500">
                            <span class="material-symbols-outlined text-3xl">directions_car</span>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">Operador</h3>
                        <p class="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed">App móvil para checklist de salida, reporte de incidentes y perfil.</p>
                    </button>

                </div>

                <div id="login-form" class="hidden w-full max-w-md bg-[#1c2127] border border-[#324d67] p-8 rounded-3xl shadow-2xl mt-8 relative animate-fade-in-up">
                    <button onclick="window.loginView.resetSelection()" class="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    
                    <h3 id="form-title" class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-3xl">lock</span> Iniciar Sesión
                    </h3>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2 tracking-wider">Correo Electrónico</label>
                            <input type="email" id="login-email" class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="correo@ejemplo.com" value="conductor@cov.mx">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2 tracking-wider">Contraseña</label>
                            <input type="password" id="login-password" class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••••" value="Conductor2024!">
                        </div>
                        <button onclick="window.loginView.submitLogin()" id="login-submit-btn" class="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 transform active:scale-95">
                            Entrar al Sistema
                        </button>
                        
                        <!-- CREDENCIALES DE PRUEBA VISIBLES -->
                        <div class="mt-6 pt-4 border-t border-[#324d67] text-center">
                            <p class="text-[10px] text-[#92adc9] uppercase mb-2">Credenciales de prueba</p>
                            <div class="grid grid-cols-3 gap-2 text-[10px]">
                                <div class="bg-[#111a22] p-2 rounded border border-[#324d67]">
                                    <span class="text-orange-500 block font-bold">Conductor</span>
                                    <span class="text-white">conductor@cov.mx</span>
                                </div>
                                <div class="bg-[#111a22] p-2 rounded border border-[#324d67]">
                                    <span class="text-emerald-500 block font-bold">Guardia</span>
                                    <span class="text-white">guardia@cov.mx</span>
                                </div>
                                <div class="bg-[#111a22] p-2 rounded border border-[#324d67]">
                                    <span class="text-primary block font-bold">Admin</span>
                                    <span class="text-white">admin@cov.mx</span>
                                </div>
                            </div>
                            <p class="text-[10px] text-[#92adc9] mt-2">Contraseña: *2024! (Ej: Conductor2024!)</p>
                        </div>
                    </div>
                </div>

                <p class="absolute bottom-6 text-center text-[#324d67] text-xs font-mono w-full">v1.0.0 • Modo Desarrollo (Sin Auth)</p>
            </div>
        </div>
        `;
    }

    onMount() {
        // Guardar referencia en window para acceso desde HTML
        window.loginView = this;
        
        // Verificar si ya hay un usuario guardado en localStorage
        this.checkStoredUser();
    }

    checkStoredUser() {
        const userId = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        const userName = localStorage.getItem('userName');
        
        if (userId && userRole) {
            console.log('Usuario encontrado en localStorage:', { userId, userRole, userName });
            this.redirectToRole(userRole);
        }
    }

    selectRole(role) {
        this.selectedRole = role;
        document.getElementById('role-selector').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        
        // Pre-llenar según el rol seleccionado
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (role === 'driver') {
            emailInput.value = 'conductor@cov.mx';
            passwordInput.value = 'Conductor2024!';
        } else if (role === 'guard') {
            emailInput.value = 'guardia@cov.mx';
            passwordInput.value = 'Guardia2024!';
        } else if (role === 'admin') {
            emailInput.value = 'admin@cov.mx';
            passwordInput.value = 'Admin2024!';
        }
        
        const titles = {
            'admin': 'Acceso Administrativo',
            'guard': 'Acceso Seguridad',
            'driver': 'Acceso Operador'
        };
        
        const titleEl = document.getElementById('form-title');
        titleEl.innerHTML = `<span class="material-symbols-outlined text-primary text-3xl">lock</span> ${titles[role]}`;
    }

    quickLogin(email, password) {
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        
        // Determinar el rol basado en el email
        if (email.includes('admin')) {
            this.selectedRole = 'admin';
        } else if (email.includes('guardia')) {
            this.selectedRole = 'guard';
        } else {
            this.selectedRole = 'driver';
        }
        
        this.submitLogin();
    }

    resetSelection() {
        document.getElementById('role-selector').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
        this.selectedRole = null;
    }

    async submitLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-submit-btn');
        const errorDiv = document.getElementById('login-error');
        const errorMessage = document.getElementById('error-message');

        // Validaciones básicas
        if (!email || !password) {
            this.showError('Por favor ingresa correo y contraseña');
            return;
        }

        // Deshabilitar botón
        btn.innerText = "Verificando...";
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-wait');
        errorDiv.classList.add('hidden');

        try {
            // BUSCAR EL USUARIO DIRECTAMENTE EN LA BASE DE DATOS
            // SIN USAR AUTH - SOLO CONSULTA A LA TABLA profiles
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email);

            if (profileError) {
                console.error('Error buscando perfil:', profileError);
                this.showError('Error al consultar usuario');
                
                btn.innerText = "Entrar al Sistema";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-wait');
                return;
            }

            // Verificar si existe el usuario
            if (!profiles || profiles.length === 0) {
                this.showError('Usuario no encontrado');
                
                btn.innerText = "Entrar al Sistema";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-wait');
                return;
            }

            const profile = profiles[0];

            // VALIDACIÓN SIMPLE DE CONTRASEÑA (SOLO PARA PRUEBAS)
            // En un sistema real, esto debería usar autenticación segura
            const validPasswords = {
                'conductor@cov.mx': 'Conductor2024!',
                'guardia@cov.mx': 'Guardia2024!',
                'admin@cov.mx': 'Admin2024!'
            };

            if (validPasswords[email] !== password) {
                this.showError('Contraseña incorrecta');
                
                btn.innerText = "Entrar al Sistema";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-wait');
                return;
            }

            // Verificar que el rol coincida con el seleccionado
            if (this.selectedRole && profile.role !== this.selectedRole) {
                this.showError(`No tienes permisos de ${this.selectedRole}. Tu rol es: ${profile.role}`);
                
                btn.innerText = "Entrar al Sistema";
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-wait');
                return;
            }

            // Guardar datos en localStorage (SIN SESIÓN)
            localStorage.setItem('userRole', profile.role);
            localStorage.setItem('userName', profile.full_name);
            localStorage.setItem('userId', profile.id);
            localStorage.setItem('userEmail', profile.email);
            localStorage.setItem('loginMethod', 'local');

            console.log('✅ Login exitoso (sin auth):', profile);
            
            btn.innerText = "✓ Acceso concedido";
            
            setTimeout(() => {
                this.redirectToRole(profile.role);
            }, 500);

        } catch (error) {
            console.error('Error inesperado:', error);
            this.showError('Error inesperado. Intenta de nuevo.');
            
            btn.innerText = "Entrar al Sistema";
            btn.disabled = false;
            btn.classList.remove('opacity-75', 'cursor-wait');
        }
    }

    async resetPassword() {
        this.showError('Función de recuperación deshabilitada en modo desarrollo', 'info');
    }

    showError(message, type = 'error') {
        const errorDiv = document.getElementById('login-error');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.innerText = message;
        errorDiv.classList.remove('hidden');
        
        if (type === 'success') {
            errorDiv.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-500', 'bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-500');
            errorDiv.classList.add('bg-green-500/10', 'border-green-500/30', 'text-green-500');
        } else if (type === 'info') {
            errorDiv.classList.remove('bg-red-500/10', 'border-red-500/30', 'text-red-500', 'bg-green-500/10', 'border-green-500/30', 'text-green-500');
            errorDiv.classList.add('bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-500');
        } else {
            errorDiv.classList.remove('bg-green-500/10', 'border-green-500/30', 'text-green-500', 'bg-yellow-500/10', 'border-yellow-500/30', 'text-yellow-500');
            errorDiv.classList.add('bg-red-500/10', 'border-red-500/30', 'text-red-500');
        }
    }

    redirectToRole(role) {
        switch(role) {
            case 'admin':
                window.location.hash = '#dashboard';
                break;
            case 'guard':
                window.location.hash = '#scanner';
                break;
            case 'driver':
                window.location.hash = '#driver';
                break;
            default:
                window.location.hash = '#';
        }
        window.location.reload();
    }
}
