import { supabase } from '../../config/supabaseClient.js';

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
                
                <div id="login-error" class="hidden w-full max-w-md mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm font-bold">
                    ⚠️ <span id="error-message">Error de autenticación</span>
                </div>

                <div id="role-selector" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl animate-fade-in-up">
                    
                    <button onclick="window.loginView.selectRole('admin')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-6 rounded-2xl text-left hover:border-primary hover:shadow-[0_0_40px_rgba(19,127,236,0.2)] transition-all duration-300 hover:-translate-y-2">
                        <div class="size-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-4 border border-primary/30">
                            <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Administrador</h3>
                        <p class="text-xs text-slate-400 group-hover:text-slate-300 mb-3">Control total de la flota, gestión de usuarios, reportes y auditoría</p>
                    </button>

                    <button onclick="window.loginView.selectRole('driver')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-6 rounded-2xl text-left hover:border-orange-500 hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] transition-all duration-300 hover:-translate-y-2">
                        <div class="size-14 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors mb-4 border border-orange-500/30">
                            <span class="material-symbols-outlined text-3xl">directions_car</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Conductor</h3>
                        <p class="text-xs text-slate-400 group-hover:text-slate-300 mb-3">App móvil para checklist, reportes de incidentes y seguimiento de ruta</p>
                    </button>

                    <button onclick="window.loginView.selectRole('guard')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-6 rounded-2xl text-left hover:border-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all duration-300 hover:-translate-y-2">
                        <div class="size-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-4 border border-emerald-500/30">
                            <span class="material-symbols-outlined text-3xl">security</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Vigilancia</h3>
                        <p class="text-xs text-slate-400 group-hover:text-slate-300 mb-3">Control de accesos, escáner QR y validación de salidas</p>
                    </button>

                    <button onclick="window.loginView.selectRole('taller')" class="group relative bg-[#1c2127]/80 backdrop-blur-xl border border-[#324d67] p-6 rounded-2xl text-left hover:border-purple-500 hover:shadow-[0_0_40px_rgba(147,51,234,0.2)] transition-all duration-300 hover:-translate-y-2">
                        <div class="size-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors mb-4 border border-purple-500/30">
                            <span class="material-symbols-outlined text-3xl">engineering</span>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Taller</h3>
                        <p class="text-xs text-slate-400 group-hover:text-slate-300 mb-3">Gestión de checklist mecánico, liberación de unidades y mantenimiento</p>
                    </button>

                </div>

                <div id="login-form" class="hidden w-full max-w-md bg-[#1c2127] border border-[#324d67] p-8 rounded-3xl shadow-2xl mt-8 relative animate-fade-in-up">
                    <button onclick="window.loginView.resetSelection()" class="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Volver a selección de rol">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    
                    <h3 id="form-title" class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span id="form-icon" class="material-symbols-outlined text-3xl text-primary">lock</span>
                        <span id="form-role-title">Iniciar Sesión</span>
                    </h3>

                    <div class="space-y-5">
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Correo Electrónico</label>
                            <input type="email" id="login-email" 
                                   class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                   placeholder="correo@cov.mx" autocomplete="email">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Contraseña</label>
                            <input type="password" id="login-password" 
                                   class="w-full bg-[#111a22] border border-[#324d67] rounded-xl p-4 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                   placeholder="••••••••" autocomplete="current-password">
                        </div>
                        
                        <button onclick="window.loginView.submitLogin()" id="login-submit-btn" 
                                class="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 transform active:scale-95">
                            Acceder al Sistema
                        </button>
                    </div>
                </div>

                <p class="absolute bottom-6 text-center text-[#324d67] text-xs font-mono w-full">
                    v2.0.0 • COV Naucalpan • 4 Roles: Admin | Conductor | Vigilancia | Taller
                </p>
            </div>
        </div>
        `;
    }

    onMount() {
        window.loginView = this;
        
        // Verificar si ya hay sesión activa
        this.checkSession();
        
        // Agregar evento de Enter para iniciar sesión más fácil
        const passInput = document.getElementById('login-password');
        if(passInput) {
            passInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.submitLogin();
            });
        }
    }

    async checkSession() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Obtener el rol del usuario
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
            
            if (profile) {
                this.redirectToRole(profile.role);
            }
        }
    }

    selectRole(role) {
        this.selectedRole = role;
        
        const roleConfig = {
            admin: { title: 'Acceso Administrativo', icon: 'admin_panel_settings', color: 'primary' },
            driver: { title: 'Acceso Conductor', icon: 'directions_car', color: 'orange-500' },
            guard: { title: 'Acceso Vigilancia', icon: 'security', color: 'emerald-500' },
            taller: { title: 'Acceso Taller', icon: 'engineering', color: 'purple-500' }
        };

        const config = roleConfig[role];

        document.getElementById('role-selector').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        
        document.getElementById('form-role-title').innerText = config.title;
        document.getElementById('form-icon').innerText = config.icon;
        
        // Nos aseguramos de que los campos estén limpios al entrar
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-email').focus();
    }

    resetSelection() {
        document.getElementById('role-selector').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        this.selectedRole = null;
    }

    async submitLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-submit-btn');
        const errorDiv = document.getElementById('login-error');

        if (!email || !password) {
            this.showError('Ingresa tu correo y contraseña');
            return;
        }

        btn.innerText = "Verificando credenciales...";
        btn.disabled = true;
        errorDiv.classList.add('hidden');

        try {
            // 1. Autenticar con Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) {
                console.error('Error auth:', authError);
                
                if (authError.message.includes('Invalid login credentials')) {
                    this.showError('Correo o contraseña incorrectos');
                } else {
                    this.showError('Error: ' + authError.message);
                }
                
                btn.innerText = "Acceder al Sistema";
                btn.disabled = false;
                return;
            }

            // 2. Obtener perfil para verificar el rol
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.error('Error obteniendo perfil:', profileError);
                
                // Si el usuario existe en Auth pero no en profiles, le creamos su perfil
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        email: email,
                        full_name: email.split('@')[0],
                        role: this.selectedRole || 'driver',
                        trust_score: 100,
                        points_balance: 0
                    });

                if (insertError) {
                    this.showError('Error creando perfil en la base de datos');
                    btn.innerText = "Acceder al Sistema";
                    btn.disabled = false;
                    return;
                }
            }

            // 3. Validar de Seguridad: El usuario debe entrar al portal correcto
            const userRole = profile?.role || this.selectedRole;
            if (this.selectedRole && userRole !== this.selectedRole) {
                this.showError(`Acceso denegado. Tu cuenta no tiene permisos de ${this.selectedRole}`);
                await supabase.auth.signOut();
                btn.innerText = "Acceder al Sistema";
                btn.disabled = false;
                return;
            }

            // 4. Guardar datos en localStorage y redirigir
            localStorage.setItem('userId', authData.user.id);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', profile?.full_name || email.split('@')[0]);

            btn.innerText = "✓ Acceso concedido";
            btn.classList.replace('bg-primary', 'bg-green-600');
            
            setTimeout(() => {
                this.redirectToRole(userRole);
            }, 500);

        } catch (error) {
            console.error('Error general de Login:', error);
            this.showError('Error de conexión con el servidor.');
            btn.innerText = "Acceder al Sistema";
            btn.disabled = false;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('login-error');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.innerText = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    redirectToRole(role) {
        switch(role) {
            case 'admin':
                window.location.hash = '#admin-dashboard';
                break;
            case 'guard':
                window.location.hash = '#guard-scanner';
                break;
            case 'taller':
                window.location.hash = '#taller-workshop';
                break;
            case 'driver':
            default:
                window.location.hash = '#driver';
                break;
        }
        window.location.reload();
    }
}
