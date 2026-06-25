import React from 'react';
import { Box, ExternalLink, Beaker, Activity, LogOut, LayoutGrid, Settings, Plus } from 'lucide-react';

interface ModuleSelectorProps {
    onSelectModule: (module: 'assets' | 'links' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab') => void;
    onLogout: () => void;
    userEmail?: string;
}

export const ModuleSelector = ({ onSelectModule, onLogout, userEmail }: ModuleSelectorProps) => {
    const ADMIN_EMAILS = ['erisson.junior@escolaamericana.com.br'];
    const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false;

    return (
        <div className="min-h-screen bg-[#f4f7fc] dark:bg-[#0c0d21] flex font-sans transition-colors duration-300">
            
            {/* SIDEBAR */}
            <aside className="w-[280px] bg-white dark:bg-white/5 border-r border-slate-200 dark:border-white/5 flex flex-col flex-shrink-0 sticky top-0 h-screen transition-colors duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col gap-4">
                    <div className="w-32">
                        <img src="/logo.png" alt="EAV Logo" className="w-full h-auto block dark:hidden" />
                        <img src="/logo-branco.png" alt="EAV Logo" className="w-full h-auto hidden dark:block" />
                    </div>
                    <div>
                        <h1 className="text-[1.35rem] font-bold text-slate-900 dark:text-white tracking-tight leading-none">TI Central</h1>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">Portal corporativo</p>
                    </div>
                </div>

                {/* Nav Menu */}
                <div className="flex-1 py-6 overflow-y-auto">
                    {/* Navegação */}
                    <div className="mb-8">
                        <p className="px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Navegação</p>
                        
                        <div className="px-3">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-indigo-500/20 transition-colors">
                                <LayoutGrid size={18} />
                                Módulos
                            </button>
                        </div>

                        {/* Sub-itens de Módulos */}
                        <div className="flex flex-col gap-2 pl-12 pr-6 mt-3">
                            <button onClick={() => onSelectModule('assets')} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                <Box size={16} /> Gestão de Ativos
                            </button>
                            <button onClick={() => onSelectModule('links')} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                <ExternalLink size={16} /> Centro de Atalhos
                            </button>
                            <button onClick={() => onSelectModule('lab')} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                <Beaker size={16} /> TI Beta Lab
                            </button>
                            {isAdmin && (
                                <button onClick={() => onSelectModule('audit')} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                    <Activity size={16} /> Logs de Auditoria
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sistema */}
                    <div>
                        <p className="px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Sistema</p>
                        <div className="px-3">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5 font-semibold transition-colors">
                                <Settings size={18} />
                                Ajustes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer User */}
                <div className="p-6 border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner">
                            {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'TI'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userEmail ? userEmail.split('@')[0] : 'Administrador'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Equipe de TI</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-[1200px] animate-in fade-in duration-500">
                    
                    {/* Header */}
                    <div className="mb-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Visão geral</h2>
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-[#1c3327] dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                                </span>
                            </div>
                            <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300">Acesse e gerencie os recursos e ferramentas da infraestrutura.</p>
                        </div>
                        {/* Opções extras no topo direito (placeholder do mockup) */}
                        <button className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-colors">
                            <span className="font-bold tracking-widest text-lg leading-none -mt-2">...</span>
                        </button>
                    </div>

                    {/* Módulos Principais */}
                    <div className="mb-10">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Módulos principais</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Gestão de Ativos (Featured) */}
                            <button 
                                onClick={() => onSelectModule('assets')}
                                className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-blue-600 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 min-h-[280px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <Box size={24} className="text-blue-700" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Gestão de Ativos</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                                        Inventário inteligente, empréstimos e controle de hardware.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[13px] font-semibold text-blue-700 dark:text-blue-500 group-hover:gap-2 transition-all">
                                    <span className="mr-2">→</span> Acessar
                                </div>
                            </button>

                            {/* Centro de Atalhos */}
                            <button 
                                onClick={() => onSelectModule('links')}
                                className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-green-600/50 hover:shadow-lg hover:shadow-green-900/10 min-h-[280px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <ExternalLink size={24} className="text-green-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Centro de Atalhos</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                                        Plataformas de gestão externa e ferramentas de suporte.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[13px] font-semibold text-green-700 dark:text-green-500 group-hover:gap-2 transition-all">
                                    <span className="mr-2">→</span> Acessar
                                </div>
                            </button>

                            {/* TI Beta Lab */}
                            <button 
                                onClick={() => onSelectModule('lab')}
                                className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-900/10 min-h-[280px]"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                        <Beaker size={24} className="text-purple-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">TI Beta Lab</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                                        Projetos em produção e integrações reais de campus.
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-[13px] font-semibold text-purple-700 dark:text-purple-500 group-hover:gap-2 transition-all">
                                    <span className="mr-2">→</span> Acessar
                                </div>
                            </button>

                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5 mb-10" />

                    {/* Monitoramento */}
                    {isAdmin && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">Monitoramento</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Logs de Auditoria */}
                                <button 
                                    onClick={() => onSelectModule('audit')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-orange-600/50 hover:shadow-lg hover:shadow-orange-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <Activity size={24} className="text-orange-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Logs de Auditoria</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                                            Registro de eventos e rastreamento de atividades do sistema.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-orange-700 dark:text-orange-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
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
