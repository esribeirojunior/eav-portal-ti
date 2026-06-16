import React from 'react';
import { Box, ShieldCheck, LogOut, ListTodo, BookOpen, Beaker, ExternalLink, Activity } from 'lucide-react';

interface ModuleSelectorProps {
    onSelectModule: (module: 'assets' | 'links' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab') => void;
    onLogout: () => void;
    userEmail?: string;
}

export const ModuleSelector = ({ onSelectModule, onLogout, userEmail }: ModuleSelectorProps) => {
    // Lista de administradores - idealmente isso viria de uma coluna 'role' no banco de dados
    const ADMIN_EMAILS = ['erisson.junior@escolaamericana.com.br'];
    const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail.toLowerCase()) : false;

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="z-10 w-full max-w-5xl space-y-12 animate-premium">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left space-y-4">
                        <h1 className="text-4xl md:text-6xl font-[1000] text-white tracking-tighter uppercase leading-[0.85]">
                            Portal de Sistemas <br /><span className="text-indigo-500">TI Central</span>
                        </h1>
                        <p className="text-white/30 text-[10px] font-black tracking-[0.4em] uppercase">
                            Infraestrutura & Gestão • {userEmail || 'Administrador'}
                        </p>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5 active:scale-95"
                    >
                        <LogOut size={16} />
                        <span>Sair da Conta</span>
                    </button>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

                    {/* Módulo ATIVO: Gestão de Ativos */}
                    <button
                        onClick={() => onSelectModule('assets')}
                        className="group relative overflow-hidden glass-card p-8 md:p-10 rounded-[3rem] transition-all text-left hover:translate-y-[-8px] hover:shadow-indigo-500/10 active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[60px] rounded-full group-hover:bg-indigo-600/20 transition-all" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-900/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <Box size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-indigo-400 transition-colors">
                                    Gestão de <br />Ativos
                                </h3>
                                <p className="text-white/40 text-[11px] font-medium leading-relaxed italic">
                                    Inventário inteligente, empréstimos e controle de hardware.
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-3 text-indigo-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                <span>Acessar</span>
                                <div className="h-[1px] flex-1 bg-indigo-500/20" />
                            </div>
                        </div>
                    </button>

                    {/* Módulo ATIVO: Centro de Atalhos */}
                    <button
                        onClick={() => onSelectModule('links')}
                        className="group relative overflow-hidden glass-card p-8 md:p-10 rounded-[3rem] transition-all text-left hover:translate-y-[-8px] hover:shadow-emerald-500/10 active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[60px] rounded-full group-hover:bg-emerald-600/20 transition-all" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                                <ExternalLink size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">
                                    Centro de <br />Atalhos
                                </h3>
                                <p className="text-white/40 text-[11px] font-medium leading-relaxed italic">
                                    Plataformas de gestão externa e ferramentas de suporte.
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                <span>Acessar</span>
                                <div className="h-[1px] flex-1 bg-emerald-500/20" />
                            </div>
                        </div>
                    </button>



                    {/* Módulo ATIVO: Dev Lab */}
                    <button
                        onClick={() => onSelectModule('lab')}
                        className="group relative overflow-hidden glass-card p-8 md:p-10 rounded-[3rem] transition-all text-left hover:translate-y-[-8px] hover:shadow-cyan-500/10 active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 blur-[60px] rounded-full group-hover:bg-cyan-600/20 transition-all" />

                        <div className="relative z-10 space-y-8">
                            <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-900/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                                <Beaker size={32} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-cyan-400 transition-colors">
                                    TI Beta <br />Lab
                                </h3>
                                <p className="text-white/40 text-[11px] font-medium leading-relaxed italic">
                                    Projetos em produção e integrações reais de campus.
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-3 text-cyan-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                <span>Acessar</span>
                                <div className="h-[1px] flex-1 bg-cyan-500/20" />
                            </div>
                        </div>
                    </button>

                    {/* Módulo AUDITORIA: Somente para Erisson */}
                    {isAdmin ? (
                        <button
                            onClick={() => onSelectModule('audit')}
                            className="group relative overflow-hidden glass-card p-8 md:p-10 rounded-[3rem] transition-all text-left hover:translate-y-[-8px] hover:shadow-purple-500/10 active:scale-[0.98]"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[60px] rounded-full group-hover:bg-purple-600/20 transition-all" />

                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-900/30 group-hover:scale-110 transition-all duration-500">
                                    <Activity size={32} />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-purple-400 transition-colors">
                                        Logs de <br />Auditoria
                                    </h3>
                                    <p className="text-white/40 text-[11px] font-medium leading-relaxed italic">
                                        Histórico completo de ações e segurança administrativa.
                                    </p>
                                </div>

                                <div className="pt-4 flex items-center gap-3 text-purple-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Verificar</span>
                                    <div className="h-[1px] flex-1 bg-purple-500/20" />
                                </div>
                            </div>
                        </button>
                    ) : (
                        /* Módulo FUTURO: Placeholder 1 */
                        <div className="group relative overflow-hidden bg-white/[0.02] p-8 md:p-10 rounded-[3rem] border border-white/5 border-dashed transition-all text-left opacity-40">
                            <div className="relative z-10 space-y-6 grayscale">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 shadow-lg">
                                    <ShieldCheck size={32} />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-white/30 uppercase tracking-tighter mb-2">
                                        Licenças e <br />Softwares
                                    </h3>
                                    <p className="text-white/20 text-[10px] font-medium leading-relaxed uppercase tracking-widest">
                                        Em Breve
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="text-center pt-10 border-t border-white/5">
                    <p className="text-white/10 text-[9px] uppercase tracking-[0.4em] font-black">
                        Escola Americana de Vitória &copy; 2026 - Versão 2.0 by Erisson Ribeiro
                    </p>
                </div>
            </div>
        </div>
    );
};
