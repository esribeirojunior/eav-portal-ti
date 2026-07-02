import React, { useState, useEffect } from 'react';
import { ChevronLeft, Key, Smartphone, CloudLightning, Save, RefreshCw, Info, CheckCircle2, ShieldCheck, Play, Server, User, Power, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MosyleModuleProps {
    userEmail?: string;
    onBack: () => void;
}

export const MosyleModule: React.FC<MosyleModuleProps> = ({ userEmail, onBack }) => {
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        // Here we would fetch if it is configured
        // For now, mock it as false initially
    }, []);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        
        try {
            // Mock API save
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setIsConfigured(true);
            setStatus({ type: 'success', msg: 'Configurações salvas e criptografadas com sucesso!' });
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message || 'Erro ao salvar configurações' });
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setStatus(null);
        
        try {
            // Mock sync process
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            setStatus({ type: 'success', msg: 'Sincronização concluída! 0 novos dispositivos encontrados.' });
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message || 'Erro ao sincronizar dispositivos' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDeactivate = () => {
        setIsConfigured(false);
        setToken('');
        setEmail('');
        setPassword('');
        setStatus({ type: 'info', msg: 'Integração desativada.' });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500/30">
            {/* Topbar matching the screenshot slightly but adapting to our layout */}
            <div className="h-14 bg-black border-b border-white/10 flex items-center justify-between px-6">
                <div className="flex items-center gap-4 text-sm font-medium text-white/60">
                    <button onClick={onBack} className="hover:text-white transition-colors flex items-center gap-2">
                        <ChevronLeft size={16} /> Voltar ao Beta Lab
                    </button>
                    <span className="w-px h-4 bg-white/20"></span>
                    <span className="text-white/40">Sessão expira em breve</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-white/60">
                    <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Settings size={16} /> Configurações</div>
                    <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors"><Power size={16} /> Logout</div>
                </div>
            </div>

            <div className="flex min-h-[calc(100vh-3.5rem)]">
                {/* Sidebar Menu */}
                <div className="w-64 bg-slate-900/50 border-r border-white/5 flex flex-col">
                    <div className="p-4 space-y-2">
                        <div className="bg-indigo-600 rounded-lg p-3 flex items-center justify-between cursor-pointer shadow-lg shadow-indigo-600/20">
                            <span className="font-semibold text-sm">Configuração Básica</span>
                            <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                                <CheckCircle2 size={12} className="text-white" />
                            </div>
                        </div>
                        <div className="hover:bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors text-white/60 hover:text-white">
                            <span className="font-medium text-sm">Hierarquia</span>
                            <ChevronLeft size={14} className="rotate-180" />
                        </div>
                        <div className="hover:bg-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors text-white/60 hover:text-white">
                            <span className="font-medium text-sm flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <User size={12} />
                                </div>
                                Usuários
                            </span>
                            <ChevronLeft size={14} className="-rotate-90" />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-10">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center shadow-inner">
                                <Smartphone className="text-indigo-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                                    Integração Mosyle API
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black tracking-widest border border-indigo-500/30">Beta</span>
                                </h1>
                                <p className="text-white/40 text-sm mt-1">Configure o token de acesso para sincronizar iPads e Macs automaticamente.</p>
                            </div>
                        </div>

                        {status && (
                            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 text-sm font-medium border ${
                                status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                status.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                <Info size={18} />
                                {status.msg}
                            </div>
                        )}

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            {isConfigured ? (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                                        <ShieldCheck size={24} />
                                        <div>
                                            <h3 className="font-bold">Integração Ativa</h3>
                                            <p className="text-xs text-emerald-400/70 mt-0.5">As credenciais estão salvas no Cofre Criptografado.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleSync}
                                            disabled={syncing}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl p-4 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {syncing ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
                                            {syncing ? 'Sincronizando Mosyle...' : 'Rodar Sincronização Manual'}
                                        </button>
                                        <button 
                                            onClick={handleDeactivate}
                                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold rounded-xl px-8 transition-all"
                                        >
                                            Desativar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveConfig} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Email da Conta</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="admin@escola.com.br"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Senha</label>
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest">Access Token (API Key)</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                required
                                                value={token}
                                                onChange={e => setToken(e.target.value)}
                                                placeholder="Cole seu token do Mosyle aqui..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm text-white outline-none focus:border-indigo-500 transition-colors font-mono"
                                            />
                                            <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                        </div>
                                        <p className="text-xs text-indigo-400 mt-2 hover:underline cursor-pointer inline-flex">
                                            Para saber mais sobre a API, confira a documentação oficial.
                                        </p>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button 
                                            type="submit"
                                            disabled={loading}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-8 py-3.5 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                            Adicionar novo token
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={onBack}
                                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl px-8 py-3.5 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MosyleModule;
