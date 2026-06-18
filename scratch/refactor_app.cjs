const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add missing lucide icons correctly
if (!txt.includes('MapPin,')) {
    txt = txt.replace("} from 'lucide-react';", "  MapPin,\n  Wrench,\n  ShieldCheck\n} from 'lucide-react';");
}

// 2. Change subView type
txt = txt.replace(/const \[subView, setSubView\] = useState<'menu' \| 'inventory' \| 'dashboard'>\('menu'\);/g, `const [subView, setSubView] = useState<'menu' | 'inventory' | 'dashboard' | 'maintenance' | 'audit' | 'allocation'>('dashboard');`);

// 3. Define the new assets block
const newAssetsBlock = `      {
        currentModule === 'assets' && (
          <div className="flex flex-col md:flex-row h-screen bg-[#f8fafc] dark:bg-[#0c0d21] overflow-hidden">
            {/* --- SIDEBAR --- */}
            <aside className="w-full md:w-[280px] bg-white dark:bg-[#14152e] border-r border-slate-200 dark:border-white/5 flex flex-col z-50 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none">
              <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-white/5">
                <div className="transform scale-90 origin-center mb-4">
                  <LogoEAV size="small" theme={theme} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Portal do Inventário Escolar
                </div>
              </div>

              <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setSubView('dashboard')}
                  className={\`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all \${subView === 'dashboard' ? 'sidebar-item active' : 'sidebar-item'}\`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => setSubView('inventory')}
                  className={\`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all \${subView === 'inventory' ? 'sidebar-item active' : 'sidebar-item'}\`}
                >
                  <ClipboardList size={18} />
                  <span>Inventário Geral</span>
                </button>
                <button 
                  onClick={() => setIsAccessoryModalOpen(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all sidebar-item"
                >
                  <MapPin size={18} />
                  <span>Alocação e Salas</span>
                </button>
                <button 
                  onClick={() => setSubView('maintenance')}
                  className={\`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all \${subView === 'maintenance' ? 'sidebar-item active' : 'sidebar-item'}\`}
                >
                  <Wrench size={18} />
                  <span>Manutenção</span>
                </button>
                <button 
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all sidebar-item"
                >
                  <ShieldCheck size={18} />
                  <span>Giro de Auditoria</span>
                </button>
              </nav>

              <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 dark:bg-white/10 flex items-center justify-center text-white font-black text-xs">
                    {userEmail.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Supervisor de Plantão</div>
                    <div className="text-[11px] text-slate-600 dark:text-white/40 truncate">{userEmail}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <button 
                  onClick={() => setCurrentModule('selector')}
                  className="w-full mt-3 py-2 text-[9px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-white uppercase tracking-widest">
                  Voltar ao Menu Principal
                </button>
              </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
              {/* TOP HEADER */}
              <header className="h-20 px-8 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#0c0d21] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Administração Central
                        {loading && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Theme Toggle */}
                  <button 
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                  
                  {/* Clocks */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Servidor Ativo</div>
                      <div className="text-sm font-black text-slate-700 dark:text-white">{new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                    </div>
                    <div className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Data Corrente</div>
                      <div className="text-sm font-black text-slate-700 dark:text-white">{new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}</div>
                    </div>
                  </div>
                </div>
              </header>

              {/* CONTENT VIEW */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="max-w-6xl mx-auto space-y-8 animate-premium">
                  
                  {/* HEADER TITLE */}
                  <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-[900] tracking-tight text-slate-900 dark:text-white leading-tight">
                      EAV <span className="text-emerald-500">Gestão Patrimonial</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-white/40 mt-3 max-w-2xl font-medium">
                      Visão computacional e gestão avançada de patrimônio acadêmico, insumos laboratoriais e maquinário em tempo real.
                    </p>
                  </div>

                  {subView === 'dashboard' ? (
                    <Dashboard
                      stats={stats}
                      devices={devices}
                      onBack={() => {}}
                      userEmail={userEmail}
                      onLogout={handleLogout}
                    />
                  ) : subView === 'inventory' || subView === 'maintenance' ? (
                    <div className="bg-white dark:bg-[#14152e] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-6">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h2 className="text-2xl font-[900] uppercase tracking-tighter text-slate-800 dark:text-white">
                            {subView === 'maintenance' ? 'Itens em Manutenção' : 'Inventário Geral'}
                          </h2>
                          <button
                            onClick={() => setIsDeviceModalOpen(true)}
                            className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90 flex items-center gap-3 group w-full sm:w-auto justify-center">
                            <Plus size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Novo Item</span>
                          </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="relative flex-1 max-w-md">
                            <input
                              type="text"
                              placeholder="Pesquisar tag, serial ou modelo..."
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-10 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          </div>
                        </div>

                        <DeviceList
                          devices={subView === 'maintenance' ? filteredDevices.filter(d => d.status === 'MAINTENANCE') : filteredDevices}
                          onAssign={setAssigningDevice}
                          onReturn={setReturningDevice}
                          onHistory={setViewingHistory}
                          onMaintenance={handleMaintenance}
                          onDelete={handleDeleteDevice}
                          onRefresh={fetchDevices}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        )
      }`;

const startIndex = txt.indexOf("{/* --- MÓDULO DE ATIVOS (ANTIGO APP) --- */}");
const endIndex = txt.indexOf("{currentModule === 'selector' && (");

if (startIndex !== -1 && endIndex !== -1) {
  txt = txt.substring(0, startIndex) + newAssetsBlock + '\n\n      ' + txt.substring(endIndex);
  fs.writeFileSync('App.tsx', txt);
  console.log('App.tsx modified successfully');
} else {
  console.log('Error: Could not find markers in App.tsx');
}
