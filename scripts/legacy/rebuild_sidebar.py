import sys

with open('App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

target_str = """          <>
            <header className="px-4 md:px-12 h-20 md:h-28 flex items-center justify-between sticky top-0 glass-header z-40">
              <div className="flex items-center gap-4 md:gap-8">
                <button
                  onClick={() => setCurrentModule('selector')}
                  className="hidden md:flex items-center gap-2 text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all">
                    <LogOut size={14} className="rotate-180" />
                  </div>
                  <span>Voltar</span>
                </button>

                <div onClick={() => setSubView('menu')} className="transition-transform active:scale-95 flex-shrink-0 cursor-pointer scale-90 md:scale-100 origin-left">
                  <LogoEAV size="small" />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <div className="relative hidden xl:block">
                  <input
                    type="text"
                    placeholder="Pesquisar ativo..."
                    className="bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-[13px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all w-64 xl:w-80 placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                </div>


                <div className="hidden md:block">
                  <UserProfile
                    userEmail={userEmail}
                    onLogout={handleLogout}
                  />
                </div>

                <button
                  onClick={handleLogout}
                  className="p-3 sm:p-4 bg-white/5 text-white/30 border border-white/5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90 flex items-center gap-3 group no-print"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Sair</span>
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 md:px-12 py-10 md:py-20">
              <div className="animate-premium">
                {subView === 'menu' ? (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="text-center space-y-4 mb-10 md:mb-20">
                      <h2 className="text-4xl md:text-7xl font-[1000] tracking-[-0.05em] uppercase text-white leading-[0.85]">
                        SISTEMA DE <br /><span className="text-indigo-500">GESTÃO TI</span>
                      </h2>
                      <div className="flex items-center justify-center gap-4 opacity-30">
                        <div className="w-10 md:w-16 h-[1.5px] bg-indigo-500" />
                        <span className="text-[9px] md:text-[11px] font-black tracking-[0.6em] uppercase text-white">Administração de Ativos</span>
                        <div className="w-10 md:w-16 h-[1.5px] bg-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                      <ActionCard
                        icon={<Plus />}
                        title="Novo Ativo"
                        desc="Cadastro via serial"
                        onClick={() => setIsDeviceModalOpen(true)}
                        iconBg="bg-blue-600"
                      />
                      <ActionCard
                        icon={<ClipboardList />}
                        title="Inventário"
                        desc="Gestão de estoque"
                        onClick={() => setSubView('inventory')}
                        iconBg="bg-emerald-500"
                      />
                      <ActionCard
                        icon={<Cable />}
                        title="Entrega Rápida"
                        desc="Cabos, Mouses e Periféricos"
                        onClick={() => setIsAccessoryModalOpen(true)}
                        iconBg="bg-teal-600"
                      />
                      <ActionCard
                        icon={<LayoutDashboard />}
                        title="Dashboard"
                        desc="Estatísticas TI"
                        onClick={() => setSubView('dashboard')}
                        iconBg="bg-purple-600"
                      />
                    </div>
                  </div>
                ) : subView === 'inventory' ? (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="flex flex-col gap-6 sm:gap-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <button onClick={() => setSubView('menu')} className="p-3.5 sm:p-5 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all text-white/40 active:scale-90 border border-white/5 text-left flex items-center justify-center">
                            <X size={20} className="sm:w-7 sm:h-7" />
                          </button>
                          <h2 className="text-2xl sm:text-3xl font-[900] uppercase tracking-tighter text-white">Inventário</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsDeviceModalOpen(true)}
                            className="p-3.5 sm:p-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90 flex items-center gap-3 sm:gap-4 group"
                          >
                            <Plus size={20} className="sm:w-6 sm:h-6" />
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Novo</span>
                          </button>
                        </div>
                      </div>

                      {/* BARRA DE FILTROS COMPACTA */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Filtro de Tipo Customizado */}
                        <div className="relative group w-full sm:w-auto">
                          <div 
                            onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCampusOpen(false); }}
                            className="flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 transition-all rounded-xl px-4 py-3.5 cursor-pointer"
                          >
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest whitespace-nowrap">Categoria:</span>
                            <span className="w-full sm:w-32 text-[11px] font-black uppercase tracking-widest text-white/80">{selectedCategory}</span>
                            <ChevronRight size={16} className={`text-white/40 transition-transform ${isCategoryOpen ? '-rotate-90' : 'rotate-90'} flex-shrink-0`} />
                          </div>
                          
                          {/* Dropdown Menu */}
                          {isCategoryOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white/5 border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {(['Todos', 'Manutenção', ...Object.values(DeviceType)] as const).map((cat) => (
                                  <div
                                    key={cat}
                                    onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/80'}`}
                                  >
                                    {cat}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Filtro de Campus Customizado */}
                        <div className="relative group w-full sm:w-auto animate-in fade-in duration-300">
                          <div 
                            onClick={() => { setIsCampusOpen(!isCampusOpen); setIsCategoryOpen(false); }}
                            className="flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 transition-all rounded-xl px-4 py-3.5 cursor-pointer"
                          >
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest whitespace-nowrap">Campus:</span>
                            <span className="w-full sm:w-32 text-[11px] font-black uppercase tracking-widest text-white/80 truncate">{selectedCampus}</span>
                            <ChevronRight size={16} className={`text-white/40 transition-transform ${isCampusOpen ? '-rotate-90' : 'rotate-90'} flex-shrink-0`} />
                          </div>

                          {/* Dropdown Menu */}
                          {isCampusOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white/5 border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {(['Todos', 'Álvares', 'Aeroporto', 'Álvares / Aeroporto'] as const).map((cp) => (
                                  <div
                                    key={cp}
                                    onClick={() => { setSelectedCampus(cp); setIsCampusOpen(false); }}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${selectedCampus === cp ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/80'}`}
                                  >
                                    {cp}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Backdrop invisível para fechar os menus ao clicar fora */}
                      {(isCategoryOpen || isCampusOpen) && (
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => { setIsCategoryOpen(false); setIsCampusOpen(false); }}
                        />
                      )}
                    </div>

                    <DeviceList
                      devices={filteredDevices}
                      onAssign={setAssigningDevice}
                      onReturn={setReturningDevice}
                      onHistory={setViewingHistory}
                      onMaintenance={handleMaintenance}
                      onDelete={handleDeleteDevice}
                      onRefresh={fetchDevices}
                    />
                  </div>
                ) : subView === 'dashboard' ? (
                  <Dashboard
                    stats={stats}
                    devices={devices}
                    onBack={() => setSubView('menu')}
                    userEmail={userEmail}
                    onLogout={handleLogout}
                    onImportClick={() => setIsImportModalOpen(true)}
                    onExportClick={handleExportCSV}
                  />
                ) : null}
              </div>
            </main>
          </>"""

replace_str = """          <div className="flex w-full h-screen overflow-hidden bg-white dark:bg-[#0c0d21] transition-colors">
            {/* --- SIDEBAR --- */}
            <aside className="w-[280px] flex-shrink-0 bg-slate-50 dark:bg-white/5 border-r border-slate-200 dark:border-white/5 flex flex-col sticky top-0 h-screen overflow-y-auto hidden md:flex">
              {/* Logo container */}
              <div className="p-8 flex items-center justify-center cursor-pointer" onClick={() => setCurrentModule('selector')}>
                <LogoEAV size="normal" single={true} theme={theme} />
              </div>

              {/* Menu Principal */}
              <div className="px-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4 px-2">Menu Principal</p>
                <div className="space-y-2">
                  <button onClick={() => setSubView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${subView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button onClick={() => setSubView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${(subView === 'inventory' || subView === 'menu') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <ClipboardList size={18} />
                    Inventário
                  </button>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="px-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4 px-2">Ações Rápidas</p>
                <div className="space-y-2">
                  <button onClick={() => setIsDeviceModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                    <Plus size={18} />
                    Novo Ativo
                  </button>
                  <button onClick={() => setIsAccessoryModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                    <Cable size={18} />
                    Entrega Rápida
                  </button>
                </div>
              </div>

              {/* Perfil e Voltar (Rodapé da Sidebar) */}
              <div className="mt-auto p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-transparent">
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 p-3 rounded-2xl flex items-center gap-3 mb-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 font-black text-white text-sm shadow-inner">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-800 dark:text-white truncate">{userEmail.split('@')[0]}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-white/40 truncate">@{userEmail.split('@')[1]}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentModule('selector')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest group shadow-sm">
                  <LogOut size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Módulos
                </button>
              </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0c0d21] p-6 md:p-12 relative transition-colors">
              <div className="max-w-[1400px] mx-auto animate-premium">
                {/* --- HEADER SUPERIOR INVENTÁRIO/DASHBOARD --- */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-[1000] uppercase tracking-tighter text-slate-800 dark:text-white flex items-center gap-4">
                      {subView === 'dashboard' ? 'Dashboard' : 'Inventário'}
                      {(subView === 'inventory' || subView === 'menu') && (
                        <button
                          onClick={() => setIsDeviceModalOpen(true)}
                          className="md:hidden p-2 bg-indigo-600 text-white rounded-lg active:scale-95"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </h2>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-white/40 mt-1">
                      {subView === 'dashboard' ? 'Métricas e relatórios do sistema' : 'Gestão completa de equipamentos e licenças.'}
                    </p>
                  </div>

                  {/* PESQUISA E FILTROS (Só no inventário) */}
                  {(subView === 'inventory' || subView === 'menu') && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-72">
                        <input
                          type="text"
                          placeholder="Pesquisar..."
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={16} />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as any)}
                          className="flex-1 sm:flex-none appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 outline-none focus:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
                        >
                          {['Todos', 'Manutenção', ...Object.values(DeviceType)].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        
                        <select
                          value={selectedCampus}
                          onChange={(e) => setSelectedCampus(e.target.value as any)}
                          className="flex-1 sm:flex-none appearance-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 outline-none focus:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
                        >
                          {['Todos', 'Álvares', 'Aeroporto', 'Álvares / Aeroporto'].map((cp) => (
                            <option key={cp} value={cp}>{cp}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CONTEÚDO PRINCIPAL --- */}
                {subView === 'dashboard' ? (
                  <Dashboard
                    stats={stats}
                    devices={devices}
                    onBack={() => setSubView('inventory')}
                    userEmail={userEmail}
                    onLogout={handleLogout}
                    onImportClick={() => setIsImportModalOpen(true)}
                    onExportClick={handleExportCSV}
                  />
                ) : (
                  <DeviceList
                    devices={filteredDevices}
                    onAssign={setAssigningDevice}
                    onReturn={setReturningDevice}
                    onHistory={setViewingHistory}
                    onMaintenance={handleMaintenance}
                    onDelete={handleDeleteDevice}
                    onRefresh={fetchDevices}
                  />
                )}
              </div>
            </main>
          </div>"""

if target_str not in code:
    print("Target not found!")
else:
    code = code.replace(target_str, replace_str)
    with open('App.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Successfully replaced!")
