import React, { useState, useEffect } from 'react';
import { Beaker, ChevronLeft, Phone, RefreshCw, Loader2, Info, LayoutGrid, Clock, Users, ShieldCheck, Activity, PhoneCall, PhoneForwarded, PhoneOff, Search, BookOpen, ListTodo, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DevLabModuleProps {
    onBack: () => void;
    userEmail?: string;
    onSelectModule?: (module: 'assets' | 'links' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab' | 'mosyle') => void;
}

const DevLabModule = ({ onBack, userEmail, onSelectModule }: DevLabModuleProps) => {
    const [activeProject, setActiveProject] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ramais, setRamais] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'registrados' | 'nao_registrados'>('registrados');

    const fetchRamais = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/monitcall?target=ramais');
            
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data && data.error) {
                throw new Error(data.error);
            }

            const listaRamais = data?.data?.ramais || data?.data?.agentes;
            
            if (listaRamais && Array.isArray(listaRamais) && listaRamais.length > 0) {
                setRamais(listaRamais);
                console.log("✅ Dados reais carregados da Monitcall!");
            } else {
                throw new Error("A API respondeu, mas não retornou ramais no momento.");
            }
        } catch (err: any) {
            console.error("Erro na integração Monitcall:", err);
            const technicalMsg = err.message || "Erro de conexão";
            setError(`Status: ${technicalMsg}. Se o problema persistir, verifique a rede ou as credenciais.`);
            
            // Fallback apenas se não houver dados nenhum
            if (ramais.length === 0) {
                setRamais([
                    { ramal: '2001', nome: 'Recepção Principal', estado: 'Livre' },
                    { ramal: '2002', nome: 'Coordenação Fundamental', estado: 'Ocupado' },
                    { ramal: '2003', nome: 'Sala dos Professores', estado: 'Livre' },
                    { ramal: '2004', nome: 'TI Suporte (Erisson)', estado: 'Livre' },
                    { ramal: '2005', nome: 'Diretoria Executiva', estado: 'Ocupado' },
                    { ramal: '2006', nome: 'Secretaria Acadêmica', estado: 'Livre' },
                    { ramal: '2007', nome: 'Portaria Leste', estado: 'Livre' },
                    { ramal: '2008', nome: 'Biblioteca', estado: 'Livre' },
                    { ramal: '2009', nome: 'Laboratório Maker', estado: 'Ocupado' },
                    { ramal: '2010', nome: 'Enfermaria', estado: 'Livre' },
                ]);
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        if (activeProject === 'monitcall') {
            fetchRamais();
            const interval = setInterval(() => fetchRamais(true), 10000); // Atualiza a cada 10s em background
            return () => clearInterval(interval);
        }
    }, [activeProject]);

    const getStatusStyles = (estado: string) => {
        const lower = estado.toLowerCase();
        if (lower.includes('livre') || lower.includes('available')) {
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                text: 'text-emerald-700 dark:text-emerald-400',
                dot: 'bg-emerald-500',
                icon: <Phone size={18} className="text-emerald-600 dark:text-emerald-500" />
            };
        }
        if (lower.includes('ocupado') || lower.includes('busy') || lower.includes('falando')) {
            return {
                bg: 'bg-rose-50 dark:bg-rose-500/10',
                border: 'border-rose-200 dark:border-rose-500/20',
                text: 'text-rose-700 dark:text-rose-400',
                dot: 'bg-rose-500',
                icon: <PhoneCall size={18} className="text-rose-600 dark:text-rose-500" />
            };
        }
        return {
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            border: 'border-amber-200 dark:border-amber-500/20',
            text: 'text-amber-700 dark:text-amber-400',
            dot: 'bg-amber-500',
            icon: <PhoneOff size={18} className="text-amber-600 dark:text-amber-400" />
        };
    };

    const isExtensionRegistered = (estado: string) => {
        const lower = estado.toLowerCase().replace(/\s/g, '');
        return !lower.includes('nãoregistrado') && !lower.includes('naoregistrado');
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d21] p-6 sm:p-12 animate-in fade-in duration-500 pb-24 text-left font-sans transition-colors">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={activeProject ? () => setActiveProject(null) : onBack}
                            className="p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-800 dark:text-white/40 border border-slate-400 dark:border-white/5 active:scale-90 shadow-sm dark:shadow-none"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-4xl font-[1000] uppercase tracking-tighter text-slate-900 dark:text-white">TI Beta Lab</h2>
                            <p className="text-cyan-600 dark:text-cyan-400/60 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Monitoramento Estrutural EAV</p>
                        </div>
                    </div>

                    {activeProject && (
                        <div className="hidden md:flex items-center gap-8 px-8 py-4 bg-white dark:bg-white/5 rounded-[2rem] border border-slate-400 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-700 dark:text-white/20 uppercase tracking-widest">Total</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{ramais.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500/40 uppercase tracking-widest">Livres</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-500">{ramais.filter(r => r.estado.toLowerCase().includes('livre')).length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-rose-600 dark:text-rose-500/40 uppercase tracking-widest">Ocupados</p>
                                <p className="text-xl font-black text-rose-600 dark:text-rose-500">{ramais.filter(r => !r.estado.toLowerCase().includes('livre')).length}</p>
                            </div>
                        </div>
                    )}
                </div>

                {!activeProject ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Monitor de Campus */}
                        <button 
                            onClick={() => setActiveProject('monitcall')}
                            className="group bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-400 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-none hover:border-cyan-500/30 transition-all hover:translate-y-[-8px] text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-cyan-600/10 transition-all" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <PhoneForwarded size={32} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">Monitor de Campus</h3>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium leading-relaxed italic">
                                        Visualização em tempo real de todos os ramais e disponibilidade da escola.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-3 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Abrir Painel Geral</span>
                                    <Activity size={14} />
                                </div>
                            </div>
                        </button>

                        {/* Gestão de Tarefas TI */}
                        <button 
                            onClick={() => onSelectModule && onSelectModule('tasks')}
                            className="group bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-400 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-none hover:border-cyan-500/30 transition-all hover:translate-y-[-8px] text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-cyan-600/10 transition-all" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <ListTodo size={32} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">Gestão de Tarefas TI</h3>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium leading-relaxed italic">
                                        Organização interna, prazos e diário de bordo da equipe.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-3 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Acessar</span>
                                    <Activity size={14} />
                                </div>
                            </div>
                        </button>

                        {/* Cofre de Senhas */}
                        <button 
                            onClick={() => onSelectModule && onSelectModule('vault')}
                            className="group bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-400 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-none hover:border-blue-500/30 transition-all hover:translate-y-[-8px] text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-blue-600/10 transition-all" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <ShieldCheck size={32} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Cofre de Senhas</h3>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium leading-relaxed italic">
                                        Acesso seguro a chaves de API e credenciais Bitwarden.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-3 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Acessar</span>
                                    <Activity size={14} />
                                </div>
                            </div>
                        </button>

                        {/* Passo a Passo TI */}
                        <button 
                            onClick={() => onSelectModule && onSelectModule('tutorials')}
                            className="group bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-400 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-none hover:border-orange-500/30 transition-all hover:translate-y-[-8px] text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-orange-600/10 transition-all" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <BookOpen size={32} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">Passo a Passo TI</h3>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium leading-relaxed italic">
                                        Procedimentos de suporte ao usuário e manuais técnicos.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-3 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Acessar</span>
                                    <Activity size={14} />
                                </div>
                            </div>
                        </button>

                        {/* Mosyle MDM */}
                        <button 
                            onClick={() => onSelectModule && onSelectModule('mosyle')}
                            className="group bg-white dark:bg-slate-900/60 p-10 rounded-[3rem] border border-slate-400 dark:border-white/5 shadow-sm hover:shadow-md dark:shadow-none hover:border-purple-500/30 transition-all hover:translate-y-[-8px] text-left relative overflow-hidden lg:col-span-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-purple-600/10 transition-all" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500 relative">
                                    <Smartphone size={32} />
                                    <div className="absolute -top-2 -right-2 bg-rose-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-600">Beta</div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">Integração Mosyle</h3>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium leading-relaxed italic">
                                        Sincronização MDM de iPads e Macs via API.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center gap-3 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest group-hover:gap-5 transition-all">
                                    <span>Configurar</span>
                                    <Activity size={14} />
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="animate-in zoom-in-95 duration-500 space-y-8">
                        <div className="bg-white dark:bg-slate-900/60 border border-slate-400 dark:border-white/5 shadow-sm dark:shadow-none rounded-[3rem] p-8 md:p-12">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-500">
                                        <Phone size={24} />
                                        <h3 className="text-3xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tight">Status da Telefonia</h3>
                                    </div>
                                    <p className="text-slate-800 dark:text-white/40 text-sm font-medium italic">Campus Escola Americana de Vitória</p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative group flex-1">
                                        <input
                                            type="text"
                                            placeholder="BUSCAR RAMAL OU NOME..."
                                            className="w-full md:w-64 bg-slate-50 dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-2xl py-5 px-12 text-[10px] font-black text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700 dark:placeholder:text-white/10 tracking-widest"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 dark:text-white/20 group-focus-within:text-cyan-500 transition-colors" size={16} />
                                    </div>

                                    <button 
                                        onClick={() => fetchRamais()}
                                        disabled={loading}
                                        className="p-5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-2xl transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                                    >
                                        <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar</span>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 text-xs font-bold flex items-center gap-4 animate-pulse">
                                    <Info size={20} />
                                    {error}
                                </div>
                            )}

                            {/* Tabs de Filtro */}
                            <div className="flex gap-4 mb-8 border-b border-slate-400 dark:border-white/5 pb-4 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setActiveTab('registrados')}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                                        activeTab === 'registrados' 
                                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    Registrados ({ramais.filter(r => isExtensionRegistered(r.estado)).length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('nao_registrados')}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                                        activeTab === 'nao_registrados' 
                                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' 
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    Não Registrados ({ramais.filter(r => !isExtensionRegistered(r.estado)).length})
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {ramais
                                    .filter(r => {
                                        const matchesSearch = r.nome.toLowerCase().includes(searchQuery.toLowerCase()) || r.ramal.toString().includes(searchQuery);
                                        const registered = isExtensionRegistered(r.estado);
                                        
                                        if (activeTab === 'registrados') return matchesSearch && registered;
                                        return matchesSearch && !registered;
                                    })
                                    .map((r, i) => {
                                    const style = getStatusStyles(r.estado);
                                    const isLivre = r.estado.toLowerCase().includes('livre');
                                    
                                    return (
                                        <div key={i} className={`p-5 rounded-[1.5rem] border transition-all hover:scale-[1.03] flex flex-col gap-3 relative overflow-hidden group ${style.bg} ${style.border}`}>
                                            <div className="flex justify-between items-center relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${style.dot} ${isLivre ? 'animate-pulse' : ''}`} />
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${style.text}`}>
                                                        {r.estado}
                                                    </span>
                                                </div>
                                                <div className="opacity-20 group-hover:opacity-40 transition-opacity">
                                                    {React.cloneElement(style.icon as any, { size: 14 })}
                                                </div>
                                            </div>

                                            <div className="relative z-10 space-y-1">
                                                <div className="text-[9px] font-black text-slate-800 dark:text-white/30 uppercase tracking-[0.2em]">
                                                    Ramal {r.ramal}
                                                </div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight break-words group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                    {r.nome}
                                                </h4>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>


                            <div className="mt-12 p-8 bg-slate-50 dark:bg-black/40 border border-slate-400 dark:border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-start gap-6">
                                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl text-cyan-600 dark:text-cyan-500 shadow-sm dark:shadow-none border border-slate-400 dark:border-none">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-slate-800 dark:text-white/40 uppercase tracking-widest">Modo de Operação:</p>
                                        <p className="text-xs text-slate-700 dark:text-white/20 font-medium leading-relaxed italic max-w-xl">
                                            Sincronização automática via API Vipphone Monitcall. Este painel é restrito à equipe de TI para diagnóstico de rede e infraestrutura.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black text-cyan-600/70 dark:text-cyan-500/40 uppercase tracking-widest">
                                    <Activity size={16} className="animate-pulse" />
                                    Live Data Stream
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Footer */}
            <div className="text-center pt-10 border-t border-slate-400 dark:border-white/5 no-print mt-10">
                <p className="text-slate-700 dark:text-white/10 text-[9px] uppercase tracking-[0.4em] font-black">
                    Escola Americana de Vitória &copy; 2026 - Versão 2.0 by Erisson Ribeiro
                </p>
            </div>
        </div>
    );
};

export default DevLabModule;
