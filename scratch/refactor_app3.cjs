const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

// 1. Add missing lucide icons correctly
if (!txt.includes('MapPin,')) {
    txt = txt.replace("} from 'lucide-react';", "  MapPin,\n  Wrench,\n  ShieldCheck\n} from 'lucide-react';");
}

// 2. Replace the entire assets block.
const startIndex = txt.indexOf("{/* --- MÓDULO DE ATIVOS (ANTIGO APP) --- */}");
const endIndex = txt.indexOf("{currentModule === 'selector' && (");

if (startIndex === -1 || endIndex === -1) {
    console.error("COULD NOT FIND START OR END INDICATORS");
    process.exit(1);
}

const newAssetsBlock = `      {/* --- MÓDULO DE ATIVOS COM NOVO SIDEBAR E MODO ESCURO --- */}
      {
        currentModule === 'assets' && (
          <div className="flex flex-col md:flex-row h-screen bg-[#f8fafc] dark:bg-[#0c0d21] overflow-hidden">
            {/* --- SIDEBAR --- */}
            <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#12132a] border-r border-slate-200 dark:border-white/5 z-20 transition-colors duration-300 relative">
              <div className="p-8 flex items-center justify-between">
                <LogoEAV size="small" theme="dark" />
                
                {/* Botão de Toggle Light/Dark Mode */}
                <button 
                  onClick={() => {
                    const html = document.documentElement;
                    if (html.classList.contains('dark')) {
                      html.classList.remove('dark');
                      html.classList.add('light');
                      document.body.classList.remove('dark');
                      document.body.classList.add('light');
                      localStorage.setItem('theme', 'light');
                    } else {
                      html.classList.add('dark');
                      html.classList.remove('light');
                      document.body.classList.add('dark');
                      document.body.classList.remove('light');
                      localStorage.setItem('theme', 'dark');
                    }
                  }}
                  className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5"
                  title="Alternar Tema"
                >
                  <Sun size={16} className="hidden dark:block" />
                  <Moon size={16} className="block dark:hidden" />
                </button>
              </div>

              <div className="px-6 mb-6">
                 <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-white/30 uppercase mb-4 pl-2">Menu Principal</div>
                 <div className="space-y-2">
                    <button 
                      onClick={() => setSubView('menu')}
                      className={\`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[12px] tracking-wide transition-all \${subView === 'menu' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400'}\`}
                    >
                      <LayoutDashboard size={18} />
                      Dashboard
                    </button>
                    <button 
                      onClick={() => setSubView('inventory')}
                      className={\`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[12px] tracking-wide transition-all \${subView === 'inventory' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400'}\`}
                    >
                      <ClipboardList size={18} />
                      Inventário
                    </button>
                 </div>
              </div>

              <div className="px-6 mb-auto">
                 <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-white/30 uppercase mb-4 pl-2">Ações Rápidas</div>
                 <div className="space-y-2">
                    <button 
                      onClick={() => setIsDeviceModalOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[12px] tracking-wide text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                    >
                      <Plus size={18} />
                      Novo Ativo
                    </button>
                    <button 
                      onClick={() => setIsAccessoryModalOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[12px] tracking-wide text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-teal-600 dark:hover:text-teal-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                    >
                      <Cable size={18} />
                      Entrega Rápida
                    </button>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 mt-auto space-y-4">
                <UserProfile userEmail={userEmail} onLogout={handleLogout} />
                <button
                  onClick={() => setCurrentModule('selector')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-white/40 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/5 active:scale-95"
                >
                  <LogOut size={16} className="rotate-180" />
                  <span>Módulos</span>
                </button>
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
              
              {/* HEADER MOBILE (apenas em telas pequenas) */}
              <header className="md:hidden px-6 h-20 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#12132a] z-40">
                <LogoEAV size="small" theme="dark" />
                <div className="flex gap-2">
                  <button onClick={() => setCurrentModule('selector')} className="p-2 text-slate-400 dark:text-white/40 hover:text-rose-500 transition-colors">
                    <LogOut size={20} className="rotate-180" />
                  </button>
                  <button onClick={() => setSubView('menu')} className="p-2 text-slate-400 dark:text-white/40 hover:text-indigo-500 transition-colors">
                    <LayoutDashboard size={20} />
                  </button>
                </div>
              </header>

              {/* CONTEÚDO PRINCIPAL (Scrollable) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 relative custom-scrollbar">
                
                {/* DECORAÇÃO DE FUNDO */}
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto space-y-8 relative z-10 animate-fade-in">
                  
                  {subView === 'menu' ? (
                    <Dashboard 
                      stats={stats} 
                      onAction={(action) => {
                        if (action === 'new_device') setIsDeviceModalOpen(true);
                        if (action === 'inventory') setSubView('inventory');
                        if (action === 'quick_delivery') setIsAccessoryModalOpen(true);
                        if (action === 'back') setCurrentModule('selector');
                      }} 
                    />
                  ) : subView === 'inventory' ? (
                    <div className="space-y-8 animate-slide-up">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                          <div>
                            <h2 className="text-3xl md:text-4xl font-[900] tracking-tight text-slate-800 dark:text-white uppercase mb-2">Inventário</h2>
                            <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Gestão completa de equipamentos e licenças.</p>
                          </div>
                          
                          {/* FILTROS E PESQUISA */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                              <input
                                type="text"
                                placeholder="Pesquisar..."
                                className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-10 text-[13px] font-bold text-slate-700 dark:text-white outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all w-full md:w-64 placeholder:text-slate-400 dark:placeholder:text-white/20 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            </div>

                            {/* Categoria Dropdown */}
                            <div className="relative">
                              <button 
                                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCampusOpen(false); }}
                                className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm"
                              >
                                {selectedCategory}
                              </button>
                              {isCategoryOpen && (
                                <div className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-[#1a1b36] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in origin-top-right">
                                  {(['Todos', 'Manutenção', ...Object.values(DeviceType)] as const).map((cat) => (
                                    <div 
                                      key={cat}
                                      onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                      className={\`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors \${selectedCategory === cat ? 'bg-indigo-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-white/80'}\`}
                                    >
                                      {cat}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Campus Dropdown */}
                            <div className="relative">
                              <button 
                                onClick={() => { setIsCampusOpen(!isCampusOpen); setIsCategoryOpen(false); }}
                                className="px-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm flex items-center gap-2"
                              >
                                <MapPin size={14} />
                                {selectedCampus}
                              </button>
                              {isCampusOpen && (
                                <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-[#1a1b36] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in origin-top-right">
                                  {(['Todos', 'Álvares', 'Aeroporto', 'Álvares / Aeroporto'] as const).map((cp) => (
                                    <div 
                                      key={cp}
                                      onClick={() => { setSelectedCampus(cp); setIsCampusOpen(false); }}
                                      className={\`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors \${selectedCampus === cp ? 'bg-indigo-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-white/80'}\`}
                                    >
                                      {cp}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {(isCategoryOpen || isCampusOpen) && (
                              <div 
                                className="fixed inset-0 z-40"
                                onClick={() => { setIsCategoryOpen(false); setIsCampusOpen(false); }}
                              />
                            )}
                          </div>
                        </div>

                        {/* LISTA DE ATIVOS */}
                        <DeviceList
                          devices={filteredDevices}
                          onDelete={async (id) => {
                            if (window.confirm('Tem certeza que deseja excluir?')) {
                              try {
                                const device = devices.find(d => d.id === id);
                                const { error } = await supabase.from('devices').delete().eq('id', id);
                                if (error) throw error;
                                if (device) logAuditAction(userEmail, 'EXCLUSÃO', \`Equipamento excluído: \${device.tag}\`, 'DEVICE', device.id);
                                await fetchDevices();
                                showNotification('Ativo excluído com sucesso!');
                              } catch (e) {
                                console.error("Erro ao excluir:", e);
                                showNotification("Erro ao excluir ativo.");
                              }
                            }
                          }}
                          onAssign={(device) => setAssigningDevice(device)}
                          onReturn={(device) => setReturningDevice(device)}
                          onMaintenance={handleMaintenance}
                          onViewHistory={(device) => setViewingHistory(device)}
                          onInspect={(device) => setInspectingDevice(device)}
                        />
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>

              {/* MODAIS (Renderizados apenas quando ativos para não pesar o DOM) */}
              {isDeviceModalOpen && (
                <DeviceModal 
                  onClose={() => setIsDeviceModalOpen(false)} 
                  onSuccess={async () => {
                    setIsDeviceModalOpen(false);
                    await fetchDevices();
                  }}
                />
              )}

              {assigningDevice && (
                <AssignmentModal
                  device={assigningDevice}
                  onClose={() => setAssigningDevice(null)}
                  onSuccess={async () => {
                    setAssigningDevice(null);
                    await fetchDevices();
                    showNotification('Equipamento entregue!');
                  }}
                />
              )}

              {returningDevice && (
                <ReturnModal
                  device={returningDevice}
                  onClose={() => setReturningDevice(null)}
                  onConfirm={async (device) => {
                    try {
                      if (!device.currentAssignment) return;
                      const { error: assignError } = await supabase
                        .from('assignments')
                        .update({ returned_at: new Date().toISOString() })
                        .eq('id', device.currentAssignment.id);
                      if (assignError) throw assignError;
                      const { error: deviceUpdateError } = await supabase
                        .from('devices')
                        .update({ status: DeviceStatus.AVAILABLE })
                        .eq('id', device.id);
                      if (deviceUpdateError) throw deviceUpdateError;
                      
                      logAuditAction(userEmail, 'DEVOLUÇÃO', \`Devolução recebida: \${device.tag}\`, 'DEVICE', device.id);
                      await fetchDevices();
                      setReturningDevice(null);
                      showNotification('Devolução registrada com sucesso!');
                    } catch (e) {
                      console.error("Erro na devolução:", e);
                      showNotification("Erro ao processar devolução.");
                    }
                  }}
                />
              )}

              {viewingHistory && (
                <HistoryModal
                  device={viewingHistory}
                  onClose={() => setViewingHistory(null)}
                />
              )}

              {inspectingDevice && (
                <InspectionModal
                  device={inspectingDevice}
                  onClose={() => setInspectingDevice(null)}
                  onConfirm={async (device: Device, inspection: any) => {
                    await fetchDevices();
                    setInspectingDevice(null);
                    showNotification('Inspeção registrada!');
                  }}
                />
              )}

              {isAccessoryModalOpen && (
                <AccessoryModal 
                  onClose={() => setIsAccessoryModalOpen(false)} 
                  onSuccess={async () => {
                    await fetchDevices();
                    showNotification('Acessório entregue com sucesso!');
                  }}
                />
              )}

            </main>
          </div>
        )
      }
      {/* FIM MÓDULO DE ATIVOS COM NOVO SIDEBAR */}

`;

txt = txt.substring(0, startIndex) + newAssetsBlock + '\n\n      ' + txt.substring(endIndex);

fs.writeFileSync('App.tsx', txt);
console.log('App.tsx refactored successfully');
