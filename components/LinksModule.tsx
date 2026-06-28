import React, { useEffect, useState } from 'react';
import { ExternalLink, ChevronLeft, Monitor, Globe, Cloud, Cpu, Loader2, Plus, X, Save, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Shortcut } from '../types';

interface LinksModuleProps {
    onBack: () => void;
    userEmail?: string;
}

function LinksModuleComponent({ onBack, userEmail }: LinksModuleProps) {
    const isAdmin = userEmail?.toLowerCase().trim() === 'erisson.junior@escolaamericana.com.br';
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedCampus, setSelectedCampus] = useState<'Todos' | 'Álvares' | 'Aeroporto'>('Todos');

    // Form State
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [iconName, setIconName] = useState('Monitor');
    const [color, setColor] = useState('bg-indigo-600');
    const [campus, setCampus] = useState('Todos');

    const fetchShortcuts = async (retries = 3) => {
        try {
            setLoading(true);
            setError(null);
            console.log(`📡 [LinksModule] Buscando atalhos... (Tentativas restantes: ${retries})`);

            const { data, error: sbError } = await supabase
                .from('shortcuts')
                .select('*')
                .order('title', { ascending: true });

            if (sbError) throw sbError;

            console.log(`✅ [LinksModule] ${data?.length || 0} atalhos recebidos!`);
            setShortcuts(data || []);
            setLoading(false); // Success! Stop loading
        } catch (err: any) {
            console.error('❌ [LinksModule] Erro:', err);
            if (retries > 0) {
                console.log(`🔄 [LinksModule] Tentando reconectar em 2 segundos...`);
                setTimeout(() => fetchShortcuts(retries - 1), 2000);
            } else {
                setError(err.message || "Erro de conexão com o portal de atalhos.");
                setLoading(false); // Failed all retries! Stop loading
            }
        }
    };

    useEffect(() => {
        console.log("LinksModule: debug", { userEmail });
        fetchShortcuts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail]); // Removed isAdmin to prevent re-fetching on derived state changes

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('shortcuts')
                .insert([{
                    title,
                    url,
                    description,
                    icon_name: iconName,
                    color,
                    campus // Salva o campus
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setTitle(''); setUrl(''); setDescription(''); setCampus('Todos');
            fetchShortcuts();
        } catch (err) {
            console.error('Erro ao salvar atalho:', err);
            alert('Erro ao salvar atalho');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja excluir este atalho?')) return;
        try {
            const { error } = await supabase
                .from('shortcuts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchShortcuts();
        } catch (err) {
            console.error('Erro ao deletar:', err);
        }
    };

    const getIcon = (name: string) => {
        switch (name) {
            case 'Monitor': return <Monitor size={24} />;
            case 'Globe': return <Globe size={24} />;
            case 'Cloud': return <Cloud size={24} />;
            default: return <ExternalLink size={24} />;
        }
    };

    const filteredShortcuts = shortcuts.filter(s => {
        if (selectedCampus === 'Todos') return true;
        const campusLower = (s.campus || 'Todos').toLowerCase();
        return campusLower === selectedCampus.toLowerCase() || campusLower === 'todos';
    });

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d21] p-6 sm:p-12 animate-in fade-in duration-500 pb-24 text-left font-sans transition-colors">
            <div className="max-w-6xl mx-auto space-y-12 text-left">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-left">
                        <button
                            onClick={onBack}
                            className="p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-white/40 border border-slate-300 dark:border-white/5 shadow-sm active:scale-90"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-left">
                            <h2 className="text-4xl font-[900] uppercase tracking-tighter text-slate-800 dark:text-white text-left">Centro de Atalhos</h2>
                            <p className="text-slate-600 dark:text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mt-1 text-left">Plataformas Externas de Gestão TI</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
                        >
                            <Plus size={18} />
                            Novo Atalho
                        </button>
                    )}
                </div>

                {/* Filtro de Campus */}
                <div className="flex items-center gap-3 animate-in fade-in duration-300">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-white/30 tracking-widest">Campus:</span>
                    <div className="flex gap-2">
                        {(['Todos', 'Álvares', 'Aeroporto'] as const).map((cp) => (
                            <button
                                key={cp}
                                onClick={() => setSelectedCampus(cp)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedCampus === cp
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/30'
                                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/40 border-slate-300 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:text-slate-800 dark:hover:text-white shadow-sm'
                                    }`}
                            >
                                {cp}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-8 rounded-3xl flex flex-col items-center text-center gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-slate-800 dark:text-white font-black uppercase text-sm tracking-widest">Ops! Algo deu errado</h3>
                            <p className="text-rose-600 dark:text-rose-500/60 text-xs mt-1 font-medium italic">{error}</p>
                        </div>
                        <p className="text-slate-600 dark:text-white/40 text-[10px] leading-relaxed max-w-sm">
                            Verifique se você criou a tabela <code className="text-slate-700 dark:text-white/60">shortcuts</code> no Supabase usando o script SQL que te enviei.
                        </p>
                        <button
                            onClick={() => fetchShortcuts()}
                            className="flex items-center gap-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-300 dark:border-transparent px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-2 shadow-sm"
                        >
                            <RefreshCw size={14} /> Tentar Novamente
                        </button>
                    </div>
                )}

                {/* Links Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-white/20 gap-4">
                        <Loader2 className="animate-spin" size={48} />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Carregando Portais...</p>
                    </div>
                ) : !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredShortcuts.length === 0 ? (
                            <div className="col-span-full py-24 border-2 border-dashed border-slate-300 dark:border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4 opacity-70 dark:opacity-40 text-slate-500">
                                <Monitor size={48} />
                                <p className="font-black uppercase tracking-widest text-xs">Nenhum atalho cadastrado para este campus.</p>
                            </div>
                        ) : filteredShortcuts.map((link) => (
                            <div key={link.id} className="relative group text-left">
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-white dark:bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-300 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all hover:translate-y-[-4px] active:scale-[0.98] relative overflow-hidden h-full shadow-sm"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-white/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors" />

                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className={`w-14 h-14 ${link.color} rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                                            {getIcon(link.icon_name)}
                                        </div>
                                        {link.campus && link.campus !== 'Todos' && (
                                            <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                                                {link.campus}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left relative z-10">
                                        <h3 className="text-2xl font-[900] text-slate-800 dark:text-white uppercase tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-left line-clamp-1">
                                            {link.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-white/40 text-sm font-medium leading-relaxed text-left line-clamp-2 italic">
                                            {link.description}
                                        </p>
                                    </div>

                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/20 group-hover:text-indigo-600 dark:group-hover:text-white/60 transition-colors relative z-10">
                                        <span>Acessar Portal</span>
                                        <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </div>
                                </a>

                                {isAdmin && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleDelete(link.id); }}
                                        className="absolute top-6 right-6 p-2 bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 rounded-lg hover:bg-rose-500 hover:text-white transition-all z-20"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Cadastro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg bg-slate-950 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-900/20 to-slate-900">
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight text-left">Novo Atalho</h3>
                                <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mt-1 text-left">Adicionar portal ao centro</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 text-left">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Nome do Sistema</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold" placeholder="Ex: Meraki Dashboard" />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">URL de Acesso</label>
                                <input required type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-mono" placeholder="https://..." />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Descrição Curta</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-medium h-24 resize-none" placeholder="Para que serve este portal?" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-left">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Ícone</label>
                                    <select value={iconName} onChange={e => setIconName(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold appearance-none">
                                        <option value="Monitor" className="bg-slate-800 text-white">Monitor</option>
                                        <option value="Globe" className="bg-slate-800 text-white">Globo/Web</option>
                                        <option value="Cloud" className="bg-slate-800 text-white">Nuvem</option>
                                        <option value="Cpu" className="bg-slate-800 text-white">Hardware</option>
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Cor</label>
                                    <select value={color} onChange={e => setColor(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold appearance-none">
                                        <option value="bg-indigo-600" className="bg-slate-800 text-white">Indigo</option>
                                        <option value="bg-emerald-600" className="bg-slate-800 text-white">Esmeralda</option>
                                        <option value="bg-orange-500" className="bg-slate-800 text-white">Laranja</option>
                                        <option value="bg-blue-600" className="bg-slate-800 text-white">Azul</option>
                                        <option value="bg-rose-600" className="bg-slate-800 text-white">Rosa</option>
                                    </select>
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest text-left">Campus</label>
                                    <select value={campus} onChange={e => setCampus(e.target.value)} className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold appearance-none">
                                        <option value="Todos" className="bg-slate-800 text-white">Todos</option>
                                        <option value="Álvares" className="bg-slate-800 text-white">Álvares</option>
                                        <option value="Aeroporto" className="bg-slate-800 text-white">Aeroporto</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4">
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Salvando...' : 'Cadastrar Atalho'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center pt-10 border-t border-white/5 no-print mt-10">
                <p className="text-white/10 text-[9px] uppercase tracking-[0.4em] font-black">
                    Escola Americana de Vitória &copy; 2026 - Versão 2.0 by Erisson Ribeiro
                </p>
            </div>
        </div>
    );
}

export const LinksModule = React.memo(LinksModuleComponent);
