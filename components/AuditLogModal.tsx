import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    X,
    Search,
    Calendar,
    User as UserIcon,
    Activity,
    Filter,
    ArrowDownCircle,
    Clock,
    ExternalLink
} from 'lucide-react';

interface AuditLog {
    id: string;
    user_email: string;
    action: string;
    details: string;
    resource_type: string;
    resource_id: string;
    created_at: string;
}

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('Todos');

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        setLoading(true);
        let timeoutId: number | undefined;
        try {
            console.log("🔍 [AuditLogModal] Buscando logs de auditoria...");

            // Timeout de 15 segundos
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = window.setTimeout(() => {
                    reject(new Error("⏱️ Timeout ao buscar logs (15s). Verifique a conexão com o Supabase."));
                }, 15000);
            });

            const fetchPromise = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            const { data, error } = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<any>);

            if (error) {
                console.error("❌ [AuditLogModal] Erro ao buscar logs:", error);
                throw error;
            }

            console.log(`✅ [AuditLogModal] ${data?.length || 0} logs carregados com sucesso!`);
            setLogs(data || []);
        } catch (err: any) {
            console.error("❌ [AuditLogModal] Falha ao buscar logs:", err);
            // Define logs vazios em caso de erro para não ficar em loading infinito
            setLogs([]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterAction === 'Todos' || log.action === filterAction;
        return matchesSearch && matchesFilter;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-black/60">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#1a1c35]/50">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/40">
                            <Activity size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-[900] text-white uppercase tracking-tight">Logs de Auditoria</h2>
                            <p className="text-white/40 text-xs font-medium tracking-widest uppercase mt-1">Histórico de Alterações TI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-white/5 rounded-2xl hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-[#1a1c35]/20 border-b border-white/5 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Pesquisar por email ou descrição..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                        {['Todos', 'ADICIONAR', 'EDITAR', 'EXCLUIR', 'EMPRÉSTIMO', 'DEVOLUÇÃO', 'MANUTENÇÃO'].map((action) => (
                            <button
                                key={action}
                                onClick={() => setFilterAction(action)}
                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${filterAction === action
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                                    }`}
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full gap-4 text-white/20">
                            <Clock className="animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Carregando logs...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4">
                            <Activity size={64} />
                            <p className="text-sm font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className="bg-white/5 border border-white/5 hover:border-white/10 p-6 rounded-3xl transition-all group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-5">
                                        <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${log.action === 'ADICIONAR' ? 'bg-emerald-500/10 text-emerald-400' :
                                            log.action === 'EXCLUIR' ? 'bg-rose-500/10 text-rose-400' :
                                                log.action === 'EDITAR' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${log.action === 'ADICIONAR' ? 'bg-emerald-500 text-black' :
                                                    log.action === 'EXCLUIR' ? 'bg-rose-500 text-white' :
                                                        log.action === 'EDITAR' ? 'bg-blue-500 text-white' :
                                                            'bg-indigo-600 text-white'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-white font-[900] text-sm uppercase tracking-tight">{log.details}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-white/40 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon size={14} className="opacity-50" />
                                                    <span>{log.user_email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="opacity-50" />
                                                    <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                                </div>
                                                {log.resource_id && (
                                                    <div className="flex items-center gap-2">
                                                        <ExternalLink size={14} className="opacity-50" />
                                                        <span>ID: {log.resource_id.substring(0, 8)}...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {log.resource_type || 'OUTRO'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#1a1c35]/20 flex justify-between items-center">
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                        {filteredLogs.length} registros exibidos
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchLogs}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
