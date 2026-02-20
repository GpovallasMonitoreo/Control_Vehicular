import { supabase } from '../../config/supabaseClient.js';

export class AdminDashboardView {
    constructor() {
        this.users = [];
        this.currentPage = 1;
        this.pageSize = 10;
    }

    render() {
        return `
        <div class="min-h-screen bg-[#0d141c] font-display">
            <!-- Header -->
            <header class="bg-[#111a22] border-b border-[#233648] px-6 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                        <h1 class="text-white text-2xl font-bold">Panel de Administración</h1>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-[#92adc9] text-sm">Admin: <span id="admin-name" class="text-white font-bold">Cargando...</span></span>
                        <button onclick="window.adminView.logout()" class="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm hover:bg-red-500 hover:text-white transition-colors">
                            <span class="material-symbols-outlined text-sm mr-1">logout</span> Salir
                        </button>
                    </div>
                </div>
            </header>

            <div class="p-6">
                <!-- Tabs de navegación -->
                <div class="flex gap-2 mb-6 border-b border-[#233648] pb-2">
                    <button onclick="window.adminView.switchTab('users')" id="tab-users" class="tab-btn active px-4 py-2 text-white bg-primary rounded-lg text-sm font-bold">Usuarios</button>
                    <button onclick="window.adminView.switchTab('create')" id="tab-create" class="tab-btn px-4 py-2 text-[#92adc9] hover:text-white text-sm font-bold">Crear Usuario</button>
                    <button onclick="window.adminView.switchTab('reports')" id="tab-reports" class="tab-btn px-4 py-2 text-[#92adc9] hover:text-white text-sm font-bold">Reportes</button>
                </div>

                <!-- Panel de Usuarios -->
                <div id="users-panel" class="tab-panel block">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-white text-xl font-bold">Gestión de Usuarios</h2>
                        <button onclick="window.adminView.switchTab('create')" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">add</span> Nuevo Usuario
                        </button>
                    </div>

                    <!-- Filtros -->
                    <div class="bg-[#1c2127] rounded-xl p-4 mb-6 border border-[#233648]">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input type="text" id="filter-name" placeholder="Nombre..." class="bg-[#111a22] border border-[#233648] rounded-lg px-4 py-2 text-white text-sm">
                            <input type="text" id="filter-email" placeholder="Email..." class="bg-[#111a22] border border-[#233648] rounded-lg px-4 py-2 text-white text-sm">
                            <select id="filter-role" class="bg-[#111a22] border border-[#233648] rounded-lg px-4 py-2 text-white text-sm">
                                <option value="">Todos los roles</option>
                                <option value="admin">Administrador</option>
                                <option value="driver">Conductor</option>
                                <option value="guard">Vigilancia</option>
                                <option value="taller">Taller</option>
                            </select>
                            <button onclick="window.adminView.loadUsers()" class="bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold">
                                Buscar
                            </button>
                        </div>
                    </div>

                    <!-- Tabla de usuarios -->
                    <div class="bg-[#1c2127] rounded-xl border border-[#233648] overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-[#111a22] border-b border-[#233648]">
                                <tr>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">Nombre</th>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">Email</th>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">Rol</th>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">ID Empleado</th>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">Puntos</th>
                                    <th class="px-4 py-3 text-left text-[#92adc9] text-xs font-bold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body" class="divide-y divide-[#233648]">
                                <tr>
                                    <td colspan="6" class="px-4 py-8 text-center text-[#92adc9]">Cargando usuarios...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Paginación -->
                    <div id="pagination" class="flex justify-center gap-2 mt-4">
                    </div>
                </div>

                <!-- Panel de Crear Usuario -->
                <div id="create-panel" class="tab-panel hidden">
                    <div class="max-w-2xl mx-auto bg-[#1c2127] rounded-2xl p-8 border border-[#233648]">
                        <h2 class="text-white text-2xl font-bold mb-6">Crear Nuevo Usuario</h2>
                        
                        <form id="create-user-form" class="space-y-5">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Nombre Completo</label>
                                    <input type="text" id="new-fullname" required 
                                           class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Email</label>
                                    <input type="email" id="new-email" required 
                                           class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Contraseña</label>
                                    <input type="password" id="new-password" required 
                                           class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Confirmar Contraseña</label>
                                    <input type="password" id="new-password-confirm" required 
                                           class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">Rol</label>
                                    <select id="new-role" class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white">
                                        <option value="driver">Conductor</option>
                                        <option value="guard">Vigilancia</option>
                                        <option value="taller">Taller</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-[#92adc9] uppercase mb-2">ID Empleado</label>
                                    <input type="text" id="new-employee-id" 
                                           class="w-full bg-[#111a22] border border-[#233648] rounded-xl p-3 text-white"
                                           placeholder="Ej: DRV001">
                                </div>
                            </div>

                            <div class="bg-[#111a22] p-4 rounded-xl border border-[#233648]">
                                <h3 class="text-white font-bold mb-3">Opciones adicionales</h3>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs text-[#92adc9] mb-1">Puntos iniciales</label>
                                        <input type="number" id="new-points" value="0" 
                                               class="w-full bg-[#0d141c] border border-[#233648] rounded-lg p-2 text-white">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-[#92adc9] mb-1">Trust Score</label>
                                        <input type="number" id="new-trust" value="100" 
                                               class="w-full bg-[#0d141c] border border-[#233648] rounded-lg p-2 text-white">
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-3 pt-4">
                                <button type="button" onclick="window.adminView.createUser()" 
                                        class="flex-1 py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors">
                                    Crear Usuario
                                </button>
                                <button type="button" onclick="window.adminView.switchTab('users')" 
                                        class="flex-1 py-4 bg-[#233648] text-white font-bold rounded-xl hover:bg-[#324d67] transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </form>

                        <div id="create-result" class="mt-4 hidden p-4 rounded-xl text-sm"></div>
                    </div>
                </div>

                <!-- Panel de Reportes -->
                <div id="reports-panel" class="tab-panel hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="bg-[#1c2127] rounded-xl p-6 border border-[#233648]">
                            <span class="material-symbols-outlined text-primary text-3xl mb-3">people</span>
                            <p class="text-[#92adc9] text-xs uppercase">Total Usuarios</p>
                            <p id="total-users" class="text-white text-3xl font-bold">0</p>
                        </div>
                        <div class="bg-[#1c2127] rounded-xl p-6 border border-[#233648]">
                            <span class="material-symbols-outlined text-orange-500 text-3xl mb-3">directions_car</span>
                            <p class="text-[#92adc9] text-xs uppercase">Conductores</p>
                            <p id="total-drivers" class="text-white text-3xl font-bold">0</p>
                        </div>
                        <div class="bg-[#1c2127] rounded-xl p-6 border border-[#233648]">
                            <span class="material-symbols-outlined text-emerald-500 text-3xl mb-3">security</span>
                            <p class="text-[#92adc9] text-xs uppercase">Vigilancia</p>
                            <p id="total-guards" class="text-white text-3xl font-bold">0</p>
                        </div>
                    </div>

                    <div class="bg-[#1c2127] rounded-xl p-6 border border-[#233648]">
                        <h3 class="text-white font-bold mb-4">Distribución por Roles</h3>
                        <div id="role-chart" class="h-64 flex items-center justify-center text-[#92adc9]">
                            Cargando estadísticas...
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    async onMount() {
        window.adminView = this;
        await this.loadAdminInfo();
        await this.loadUsers();
        await this.loadReports();
    }

    async loadAdminInfo() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                document.getElementById('admin-name').innerText = profile.full_name;
            }
        }
    }

    async loadUsers() {
        try {
            const filterName = document.getElementById('filter-name')?.value || '';
            const filterEmail = document.getElementById('filter-email')?.value || '';
            const filterRole = document.getElementById('filter-role')?.value || '';

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (filterName) {
                query = query.ilike('full_name', `%${filterName}%`);
            }
            if (filterEmail) {
                query = query.ilike('email', `%${filterEmail}%`);
            }
            if (filterRole) {
                query = query.eq('role', filterRole);
            }

            const from = (this.currentPage - 1) * this.pageSize;
            const to = from + this.pageSize - 1;

            const { data: users, error, count } = await query.range(from, to);

            if (error) throw error;

            this.renderUsersTable(users || []);
            this.renderPagination(count || 0);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            document.getElementById('users-table-body').innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-red-500">
                        Error cargando usuarios: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-[#92adc9]">
                        No hay usuarios para mostrar
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const roleColors = {
                admin: 'text-primary bg-primary/10 border-primary/30',
                driver: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
                guard: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
                taller: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
            };
            
            const roleClass = roleColors[user.role] || 'text-gray-500 bg-gray-500/10 border-gray-500/30';
            const roleNames = {
                admin: 'Admin',
                driver: 'Conductor',
                guard: 'Vigilancia',
                taller: 'Taller'
            };

            return `
                <tr class="hover:bg-[#233648]/50 transition-colors">
                    <td class="px-4 py-3 text-white">${user.full_name || '-'}</td>
                    <td class="px-4 py-3 text-[#92adc9]">${user.email}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded-full text-xs font-bold border ${roleClass}">
                            ${roleNames[user.role] || user.role}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-white">${user.employee_id || '-'}</td>
                    <td class="px-4 py-3 text-white">${user.points_balance || 0}</td>
                    <td class="px-4 py-3">
                        <button onclick="window.adminView.editUser('${user.id}')" 
                                class="text-primary hover:text-blue-400 mr-2">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onclick="window.adminView.deleteUser('${user.id}')" 
                                class="text-red-500 hover:text-red-400">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPagination(total) {
        const totalPages = Math.ceil(total / this.pageSize);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button onclick="window.adminView.goToPage(${i})" 
                        class="px-3 py-1 rounded-lg ${i === this.currentPage ? 'bg-primary text-white' : 'bg-[#1c2127] text-[#92adc9] hover:text-white'}">
                    ${i}
                </button>
            `;
        }
        
        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    }

    async createUser() {
        const fullname = document.getElementById('new-fullname').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const passwordConfirm = document.getElementById('new-password-confirm').value;
        const role = document.getElementById('new-role').value;
        const employeeId = document.getElementById('new-employee-id').value;
        const points = document.getElementById('new-points').value;
        const trust = document.getElementById('new-trust').value;
        
        const resultDiv = document.getElementById('create-result');

        // Validaciones
        if (!fullname || !email || !password) {
            this.showCreateResult('Todos los campos obligatorios deben estar llenos', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            this.showCreateResult('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 6) {
            this.showCreateResult('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            resultDiv.className = 'mt-4 p-4 rounded-xl text-sm bg-yellow-500/10 text-yellow-500 border border-yellow-500/30';
            resultDiv.innerHTML = '⏳ Creando usuario...';
            resultDiv.classList.remove('hidden');

            // 1. Crear usuario en Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { full_name: fullname }
            });

            if (authError) throw authError;

            // 2. Crear/Actualizar perfil
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: email,
                    full_name: fullname,
                    role: role,
                    employee_id: employeeId || null,
                    points_balance: parseInt(points) || 0,
                    trust_score: parseInt(trust) || 100,
                    created_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            this.showCreateResult(`✅ Usuario ${fullname} creado exitosamente`, 'success');
            
            // Limpiar formulario
            document.getElementById('create-user-form').reset();
            
            // Recargar lista de usuarios
            setTimeout(() => {
                this.switchTab('users');
                this.loadUsers();
            }, 1500);

        } catch (error) {
            console.error('Error creando usuario:', error);
            this.showCreateResult(`❌ Error: ${error.message}`, 'error');
        }
    }

    showCreateResult(message, type) {
        const resultDiv = document.getElementById('create-result');
        resultDiv.innerHTML = message;
        resultDiv.classList.remove('hidden');
        
        if (type === 'success') {
            resultDiv.className = 'mt-4 p-4 rounded-xl text-sm bg-green-500/10 text-green-500 border border-green-500/30';
        } else {
            resultDiv.className = 'mt-4 p-4 rounded-xl text-sm bg-red-500/10 text-red-500 border border-red-500/30';
        }

        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 5000);
    }

    async loadReports() {
        try {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('role');

            if (profiles) {
                const total = profiles.length;
                const drivers = profiles.filter(p => p.role === 'driver').length;
                const guards = profiles.filter(p => p.role === 'guard').length;
                const talleres = profiles.filter(p => p.role === 'taller').length;
                const admins = profiles.filter(p => p.role === 'admin').length;

                document.getElementById('total-users').innerText = total;
                document.getElementById('total-drivers').innerText = drivers;
                document.getElementById('total-guards').innerText = guards;

                document.getElementById('role-chart').innerHTML = `
                    <div class="w-full space-y-3">
                        <div class="flex items-center gap-2">
                            <span class="w-20 text-[#92adc9] text-xs">Admin:</span>
                            <div class="flex-1 h-4 bg-[#111a22] rounded-full overflow-hidden">
                                <div class="h-full bg-primary" style="width: ${(admins/total)*100}%"></div>
                            </div>
                            <span class="text-white text-xs font-bold">${admins}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-20 text-[#92adc9] text-xs">Conductor:</span>
                            <div class="flex-1 h-4 bg-[#111a22] rounded-full overflow-hidden">
                                <div class="h-full bg-orange-500" style="width: ${(drivers/total)*100}%"></div>
                            </div>
                            <span class="text-white text-xs font-bold">${drivers}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-20 text-[#92adc9] text-xs">Vigilancia:</span>
                            <div class="flex-1 h-4 bg-[#111a22] rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500" style="width: ${(guards/total)*100}%"></div>
                            </div>
                            <span class="text-white text-xs font-bold">${guards}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-20 text-[#92adc9] text-xs">Taller:</span>
                            <div class="flex-1 h-4 bg-[#111a22] rounded-full overflow-hidden">
                                <div class="h-full bg-purple-500" style="width: ${(talleres/total)*100}%"></div>
                            </div>
                            <span class="text-white text-xs font-bold">${talleres}</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error cargando reportes:', error);
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(el => {
            el.classList.remove('active', 'bg-primary', 'text-white');
            el.classList.add('text-[#92adc9]');
        });

        document.getElementById(`${tab}-panel`).classList.remove('hidden');
        document.getElementById(`tab-${tab}`).classList.add('active', 'bg-primary', 'text-white');
    }

    async logout() {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.hash = '#login';
        window.location.reload();
    }

    editUser(userId) {
        alert(`Editar usuario ${userId} - Funcionalidad en desarrollo`);
    }

    async deleteUser(userId) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) throw error;
            
            alert('Usuario eliminado');
            this.loadUsers();
        } catch (error) {
            alert('Error eliminando usuario: ' + error.message);
        }
    }
}
