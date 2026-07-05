import React from 'react';
import { Box, ExternalLink, Beaker, Activity, LogOut, LayoutGrid, Settings, Plus, Users, MonitorPlay, TrendingUp } from 'lucide-react';

interface ModuleSelectorProps {
    onSelectModule: (module: 'assets' | 'links' | 'employees' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab' | 'settings' | 'signage' | 'roi') => void;
    onLogout: () => void;
    userEmail?: string;
    userRole?: string;
    userModules?: string[];
}

export const ModuleSelector = ({ onSelectModule, onLogout, userEmail, userRole, userModules = [] }: ModuleSelectorProps) => {
    const isSuperAdmin = userRole === 'superadmin';
    const hasModule = (module: string) => isSuperAdmin || userModules.includes(module);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d21] flex font-sans transition-colors duration-300">
            
            {/* SIDEBAR */}
            <aside className="w-[280px] bg-white dark:bg-white/5 border-r border-slate-400 dark:border-white/5 flex flex-col flex-shrink-0 sticky top-0 h-screen transition-colors duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-400 dark:border-white/5 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="w-48">
                        <img src="/logo.png" alt="EAV Logo" className="w-full h-auto block dark:hidden" />
                        <img src="/logo-branco.png" alt="EAV Logo" className="w-full h-auto hidden dark:block" />
                    </div>
                </div>

                {/* Nav Menu */}
                <div className="flex-1 py-6 overflow-y-auto">
                    {/* Navegação */}
                    <div className="mb-8">
                        <p className="px-6 text-xs font-semibold text-slate-800 dark:text-slate-700 mb-3">Navegação</p>
                        
                        <div className="px-3">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-indigo-500/20 transition-colors">
                                <LayoutGrid size={18} />
                                Módulos
                            </button>
                        </div>

                        {/* Sub-itens de Módulos */}
                        <div className="flex flex-col gap-2 pl-12 pr-6 mt-3">
                            {hasModule('assets') && (
                                <button onClick={() => onSelectModule('assets')} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                    <Box size={16} /> Gestão de Ativos
                                </button>
                            )}
                            {hasModule('links') && (
                                <button onClick={() => onSelectModule('links')} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                    <ExternalLink size={16} /> Centro de Atalhos
                                </button>
                            )}
                            {hasModule('signage') && (
                                <button onClick={() => onSelectModule('signage')} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-pink-600 dark:hover:text-white transition-colors text-left">
                                    <MonitorPlay size={16} /> Mural Digital
                                </button>
                            )}
                            {hasModule('lab') && (
                                <button onClick={() => onSelectModule('lab')} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors text-left">
                                    <Beaker size={16} /> TI Beta Lab
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sistema */}
                    {isSuperAdmin && (
                        <div>
                            <p className="px-6 text-xs font-semibold text-slate-800 dark:text-slate-700 mb-3 mt-8">Sistema</p>
                            <div className="px-3">
                                <button 
                                    onClick={() => onSelectModule('settings')}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-800 dark:text-slate-700 font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Settings size={18} />
                                    Ajustes
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer User */}
                <div className="p-6 border-t border-slate-400 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner">
                            {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'TI'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userEmail ? userEmail.split('@')[0] : 'Administrador'}</p>
                            <p className="text-xs text-slate-800 dark:text-slate-700 truncate capitalize">{userRole === 'superadmin' ? 'Super Admin' : userRole === 'viewer' ? 'Visualizador' : 'Equipe de TI'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-rose-600 dark:text-slate-700 dark:hover:text-rose-400 transition-colors"
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
                            <p className="text-[15px] font-medium text-slate-800 dark:text-slate-300">Acesse e gerencie os recursos e ferramentas da infraestrutura.</p>
                        </div>
                        
                    </div>

                    {/* Módulos Principais */}
                    <div className="mb-10">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-700 mb-4">Módulos principais</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Gestão de Ativos (Featured) */}
                            {hasModule('assets') && (
                                <button 
                                    onClick={() => onSelectModule('assets')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-blue-600 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <Box size={24} className="text-blue-700" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Gestão de Ativos</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                                            Inventário inteligente, empréstimos e controle de hardware.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-blue-700 dark:text-blue-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
                                    </div>
                                </button>
                            )}

                            {/* Estatísticas e ROI */}
                            {hasModule('assets') && (
                                <button 
                                    onClick={() => onSelectModule('roi')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <TrendingUp size={24} className="text-emerald-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Estatísticas e ROI</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                                            Acompanhe o retorno sobre o investimento e a economia financeira da operação.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-emerald-600 dark:text-emerald-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
                                    </div>
                                </button>
                            )}


                            {/* Centro de Atalhos */}
                            {hasModule('links') && (
                                <button 
                                    onClick={() => onSelectModule('links')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-green-600/50 hover:shadow-lg hover:shadow-green-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <ExternalLink size={24} className="text-green-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Centro de Atalhos</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                                            Plataformas de gestão externa e ferramentas de suporte.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-green-700 dark:text-green-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
                                    </div>
                                </button>
                            )}

                            {/* Mural Digital */}
                            {hasModule('signage') && (
                                <button 
                                    onClick={() => onSelectModule('signage')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-pink-600/50 hover:shadow-lg hover:shadow-pink-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <MonitorPlay size={24} className="text-pink-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Mural Digital</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                                            Gerenciamento de TVs Corporativas e Mini PCs.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-pink-700 dark:text-pink-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
                                    </div>
                                </button>
                            )}

                            {/* TI Beta Lab */}
                            {hasModule('lab') && (
                                <button 
                                    onClick={() => onSelectModule('lab')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <Beaker size={24} className="text-purple-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">TI Beta Lab</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                                            Projetos em produção e integrações reais de campus.
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-[13px] font-semibold text-purple-700 dark:text-purple-500 group-hover:gap-2 transition-all">
                                        <span className="mr-2">→</span> Acessar
                                    </div>
                                </button>
                            )}

                        </div>
                    </div>

                    <div className="h-[1px] w-full bg-slate-200 dark:bg-white/5 mb-10" />

                    {/* Monitoramento */}
                    {isSuperAdmin && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-700 mb-4">Monitoramento</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Logs de Auditoria */}
                                <button 
                                    onClick={() => onSelectModule('audit')}
                                    className="group flex flex-col justify-between p-7 bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 rounded-[1.5rem] text-left transition-all hover:-translate-y-1 hover:border-orange-600/50 hover:shadow-lg hover:shadow-orange-900/10 min-h-[280px]"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                                            <Activity size={24} className="text-orange-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Logs de Auditoria</h4>
                                        <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
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
