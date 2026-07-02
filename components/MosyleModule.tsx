import React, { useState, useEffect } from 'react';
import { ChevronLeft, Key, Smartphone, CloudLightning, Save, RefreshCw, Info, CheckCircle2, ShieldCheck, Play, Server, User, Power, Settings, Laptop } from 'lucide-react';
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
    const [mosyleDevices, setMosyleDevices] = useState<any[]>([]);
    const [isLoadingMosyle, setIsLoadingMosyle] = useState(false);

    const fetchMosyleDevices = async () => {
        setIsLoadingMosyle(true);
        try {
            const res = await fetch('/api/db', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ table: 'mosyle_devices' })
            });
            const data = await res.json();
            if (data && data.data) {
                setMosyleDevices(data.data);
            }
        } catch (error) {
            console.error('Error fetching mosyle devices', error);
        } finally {
            setIsLoadingMosyle(false);
        }
    };

    useEffect(() => {
        if (isConfigured) {
            fetchMosyleDevices();
        }
    }, [isConfigured]);

    useEffect(() => {
        // Fetch config status
        const checkConfig = async () => {
            try {
                const token = localStorage.getItem('auth_token') || '';
                
                const response = await fetch('/api/mosyle/config', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                
                if (data.configured) {
                    setIsConfigured(true);
                    if (data.email) setEmail(data.email);
                }
            } catch (err) {
                console.error('Error checking Mosyle config', err);
            }
        };
        checkConfig();
    }, []);

    const getAuthToken = () => {
        return localStorage.getItem('auth_token') || '';
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        
        try {
            const response = await fetch('/api/mosyle/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify({ email, password, token })
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Erro ao salvar configurações');
            
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
            const response = await fetch('/api/mosyle/sync', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Erro ao sincronizar dispositivos');
            
            setStatus({ type: 'success', msg: data.message || 'Sincronização concluída!' });
            console.log('Dados do Mosyle:', data.rawData);
            fetchMosyleDevices();
        } catch (error: any) {
            setStatus({ type: 'error', msg: error.message || 'Erro ao sincronizar dispositivos' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDeactivate = async () => {
        try {
            await fetch('/api/mosyle/deactivate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            });
            setIsConfigured(false);
            setToken('');
            setEmail('');
            setPassword('');
            setStatus({ type: 'info', msg: 'Integração desativada e credenciais removidas.' });
        } catch (error) {
            setStatus({ type: 'error', msg: 'Erro ao desativar integração.' });
        }
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
                                    
                                    {/* Lista de Dispositivos Mosyle */}
                                    <div className="pt-8 border-t border-white/10 mt-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-lg">Inventário Sincronizado</h3>
                                            <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold">{mosyleDevices.length} equipamentos</span>
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                          {isLoadingMosyle ? (
                                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                              <RefreshCw size={24} className="animate-spin text-indigo-500" />
                                              <p className="text-white/40 text-sm font-bold">Carregando dispositivos...</p>
                                            </div>
                                          ) : mosyleDevices.length > 0 ? (
                                            mosyleDevices.map((device) => (
                                              <div key={device.id} className="group relative bg-black/20 border border-white/5 hover:border-indigo-500/30 p-4 rounded-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-black/40 shadow-sm">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/50 shrink-0">
                                                    {device.os?.toLowerCase() === 'ios' ? <Smartphone size={24} /> : <Laptop size={24} />}
                                                  </div>
                                                  <div className="flex flex-col min-w-0">
                                                    <h3 className="text-[14px] font-semibold text-white tracking-tight truncate">{device.device_name || 'Desconhecido'}</h3>
                                                    <p className="text-[11px] font-medium text-white/40 tracking-wide mt-0.5 truncate">
                                                      <span className="text-indigo-400 font-bold">{device.model || 'Mac/iPad'}</span> <span className="opacity-70">• S/N: {device.serial_number}</span>
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-6 flex-1 justify-between xl:justify-end w-full xl:w-auto mt-4 xl:mt-0 border-t xl:border-none border-white/5 pt-4 xl:pt-0">
                                                  <div className="flex flex-col items-start xl:items-end min-w-0">
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">OS</span>
                                                    <span className="text-[11px] font-bold text-white/80 truncate uppercase">{device.os}</span>
                                                  </div>
                                                  <div className="flex flex-col items-start xl:items-end min-w-0">
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Armazenamento</span>
                                                    <span className="text-[11px] font-bold text-white/80 truncate">{device.total_disk ? `${Math.round(Number(device.total_disk))} GB` : 'N/A'}</span>
                                                  </div>
                                                  <div className="flex flex-col items-start xl:items-end min-w-0">
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Status</span>
                                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                                      Sincronizado
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 border border-white/10">
                                                <Smartphone size={32} />
                                              </div>
                                              <div className="space-y-1">
                                                <p className="text-white/40 font-[1000] uppercase tracking-[0.2em] text-xs">Vazio</p>
                                                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Nenhum equipamento sincronizado ainda.</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
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
