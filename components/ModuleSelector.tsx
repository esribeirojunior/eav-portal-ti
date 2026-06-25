import React from 'react';
import { Box, ExternalLink, Beaker, Activity, LogOut, ChevronRight, LayoutGrid, Settings, UserCircle, Circle } from 'lucide-react';

interface ModuleSelectorProps {
    onSelectModule: (module: 'assets' | 'links' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab') => void;
    onLogout: () => void;
    userEmail?: string;
}

export const ModuleSelector = ({ onSelectModule, onLogout, userEmail }: ModuleSelectorProps) => {
    const ADMIN_EMAILS = ['erisson.junior@escolaamericana.com.br'];
    const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d21] flex text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
            
            {/* SIDEBAR */}
            <aside className="w-[220px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/5 flex flex-col flex-shrink-0 sticky top-0 h-screen shadow-sm transition-colors duration-300">
                {/* Logo Area */}
                <div className="p-6 pb-2">
                    <h1 className="text-xl font-[900] text-slate-800 dark:text-white tracking-tight uppercase">TI Central</h1>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Portal Corporativo</p>
                </div>

                {/* Nav Menu */}
                <div className="px-4 py-6 flex-1 space-y-1">
                    <p className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Navegação</p>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-sm font-semibold transition-colors">
                        <LayoutGrid size={18} />
                        Módulos
                    </button>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors">
                        <Settings size={18} />
                        Ajustes
                    </button>
                </div>

                {/* Footer User */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'TI'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{userEmail ? userEmail.split('@')[0] : 'Administrador'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Equipe de TI</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors uppercase tracking-widest"
                    >
                        <LogOut size={14} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Visão Geral</h2>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                    <Circle size={8} className="fill-current" /> Online
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Acesse e gerencie os recursos e ferramentas da infraestrutura.</p>
                        </div>
                    </div>

                    {/* Módulos Principais */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Módulos Principais</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Gestão de Ativos (Featured) */}
                            <button 
                                onClick={() => onSelectModule('assets')}
                                className="group bg-white dark:bg-slate-900 border-[1.5px] border-blue-500 rounded-[1.5rem] p-6 text-left transition-all hover:shadow-lg hover:-translate-y-1 hover:shadow-blue-500/10 flex flex-col justify-between min-h-[220px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <Box size={24} />
                                    </div>
                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">Gestão de Ativos</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Inventário inteligente, empréstimos e controle de hardware.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Acessar <ChevronRight size={14} className="ml-1" />
                                </div>
                            </button>

                            {/* Centro de Atalhos */}
                            <button 
                                onClick={() => onSelectModule('links')}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] p-6 text-left transition-all hover:shadow-md hover:-translate-y-1 hover:border-teal-500/50 flex flex-col justify-between min-h-[220px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <ExternalLink size={24} />
                                    </div>
                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">Centro de Atalhos</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Plataformas de gestão externa e ferramentas de suporte.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Acessar <ChevronRight size={14} className="ml-1" />
                                </div>
                            </button>

                            {/* TI Beta Lab */}
                            <button 
                                onClick={() => onSelectModule('lab')}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] p-6 text-left transition-all hover:shadow-md hover:-translate-y-1 hover:border-purple-500/50 flex flex-col justify-between min-h-[220px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                        <Beaker size={24} />
                                    </div>
                                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">TI Beta Lab</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Projetos em produção e integrações reais de campus.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                    Acessar <ChevronRight size={14} className="ml-1" />
                                </div>
                            </button>

                        </div>
                    </div>

                    {/* Divisória */}
                    <hr className="border-slate-200 dark:border-white/5" />

                    {/* Monitoramento */}
                    {isAdmin && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Monitoramento</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Logs de Auditoria */}
                                <button 
                                    onClick={() => onSelectModule('audit')}
                                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] p-6 text-left transition-all hover:shadow-md hover:-translate-y-1 hover:border-amber-500/50 flex flex-col justify-between min-h-[220px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                            <Activity size={24} />
                                        </div>
                                        <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">Logs de Auditoria</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Registro de eventos e rastreamento de atividades do sistema.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                                        Monitorar <ChevronRight size={14} className="ml-1" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
