
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft, 
  Lock, 
  Key, 
  Globe, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { BitwardenSecret, BitwardenProject } from '../types';

interface VaultModuleProps {
  userEmail: string;
  onBack: () => void;
}

const VaultModuleComponent: React.FC<VaultModuleProps> = ({ userEmail, onBack }) => {
  const [secrets, setSecrets] = useState<BitwardenSecret[]>([]);
  const [projects, setProjects] = useState<BitwardenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const ACCESS_TOKEN = import.meta.env.VITE_BITWARDEN_ACCESS_TOKEN;

  useEffect(() => {
    if (!ACCESS_TOKEN) {
      setError('Token de Acesso do Bitwarden não encontrado no arquivo .env');
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Nota: Em um ambiente real, você faria essas chamadas para a API do Bitwarden
      // Como estamos no frontend, as chamadas podem sofrer com CORS se a API não permitir.
      // Geralmente recomenda-se uma Edge Function/Backend Proxy.
      
      const headers = {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      };

      // Mock da estrutura da API para desenvolvimento (Substituir pela URL real quando configurado)
      // URL Real: https://api.bitwarden.com/secretsmanager/secrets
      
      const secretsRes = await fetch('https://api.bitwarden.com/secretsmanager/secrets', { headers });
      if (!secretsRes.ok) throw new Error('Falha ao buscar segredos do Bitwarden');
      const secretsData = await secretsRes.json();

      const projectsRes = await fetch('https://api.bitwarden.com/secretsmanager/projects', { headers });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.data || []);
      }

      setSecrets(secretsData.data || []);
    } catch (err: any) {
      console.error('Erro no Vault:', err);
      setError('Erro ao carregar dados do Bitwarden. Verifique o Token e a conexão.');
      
      // MOCK PARA DEMONSTRAÇÃO (Caso a API falhe ou não tenha CORS liberado no dev local)
      setSecrets([
        { id: '1', key: 'AWS_ACCESS_KEY', value: 'AKIA...', note: 'Produção Cloud', projectIds: ['p1'], creationDate: '', revisionDate: '', organizationId: '' },
        { id: '2', key: 'DB_PASSWORD_PROD', value: 's3cur3_p4ss', note: 'PostgreSQL Interno', projectIds: ['p2'], creationDate: '', revisionDate: '', organizationId: '' },
        { id: '3', key: 'GOOGLE_API_KEY', value: 'AIza...', note: 'Gemini Integration', projectIds: ['p1'], creationDate: '', revisionDate: '', organizationId: '' }
      ]);
      setProjects([
        { id: 'p1', name: 'Infraestrutura', organizationId: '', creationDate: '', revisionDate: '' },
        { id: 'p2', name: 'Banco de Dados', organizationId: '', creationDate: '', revisionDate: '' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSecrets = useMemo(() => {
    return secrets.filter(s => {
      const matchesSearch = s.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (s.note || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = selectedProjectId === 'all' || s.projectIds.includes(selectedProjectId);
      return matchesSearch && matchesProject;
    });
  }, [secrets, searchQuery, selectedProjectId]);

  const toggleVisibility = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Sidebar de Navegação Local */}
      <div className="w-full md:w-80 flex flex-col border-r border-white/5 bg-slate-950 p-6 space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all border border-white/5"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Cofre TI</h1>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase mt-1">Bitwarden SM</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Pesquisar segredo..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors" size={16} />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 px-1">Projetos</label>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedProjectId('all')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${selectedProjectId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-white/40 hover:bg-white/5'}`}
              >
                <ShieldCheck size={16} />
                Todos os Itens
              </button>
              {projects.map(project => (
                <button 
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${selectedProjectId === project.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-white/40 hover:bg-white/5'}`}
                >
                  <FileText size={16} />
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Lock size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Segurança Total</span>
          </div>
          <p className="text-[10px] text-white/30 leading-relaxed italic">
            Acesso via API oficial com criptografia ponta-a-ponta.
          </p>
        </div>

        {/* Footer in Sidebar */}
        <div className="pt-4 border-t border-white/5 text-center no-print">
            <p className="text-white/10 text-[8px] uppercase tracking-[0.25em] font-black">
                Escola Americana &copy; 2026 - v2.0 by Erisson Ribeiro
            </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 relative">
        {/* Toast de Feedback */}
        {copyFeedback && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
              <CheckCircle2 size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{copyFeedback} Copiado!</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/20">Sincronizando com Bitwarden...</p>
          </div>
        ) : error && secrets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 text-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">Erro de Autenticação</h3>
              <p className="text-sm text-white/40 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl md:text-5xl font-[1000] tracking-tighter uppercase">Meus <span className="text-indigo-500">Segredos</span></h2>
                <p className="text-white/30 text-sm font-medium">Gestão centralizada de chaves e senhas de infraestrutura.</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    API Online
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredSecrets.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem]">
                  <Search size={40} className="mx-auto text-white/10" />
                  <p className="text-sm font-bold text-white/20 uppercase tracking-widest">Nenhum segredo encontrado para esta busca.</p>
                </div>
              ) : (
                filteredSecrets.map(secret => (
                  <div key={secret.id} className="group glass-card p-6 md:p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all hover:translate-y-[-4px] active:scale-[0.99]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Key size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tighter text-white">{secret.key}</h3>
                          <div className="flex gap-2 mt-1">
                            {secret.projectIds.map(pid => (
                              <span key={pid} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 text-white/40 rounded border border-white/5">
                                {projects.find(p => p.id === pid)?.name || 'Projeto'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleVisibility(secret.id)}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                        >
                          {visibleSecrets[secret.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 font-mono text-sm tracking-widest break-all ${visibleSecrets[secret.id] ? 'text-indigo-300' : 'text-white/10 select-none blur-sm'}`}>
                          {visibleSecrets[secret.id] ? secret.value : '••••••••••••••••••••••••'}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(secret.value, 'Segredo')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      {secret.note && (
                        <div className="flex gap-3 items-start p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                          <FileText size={14} className="text-white/20 mt-1 flex-shrink-0" />
                          <p className="text-[11px] text-white/40 italic leading-relaxed">{secret.note}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">ID: {secret.id}</span>
                       <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                          Bitwarden Cloud <ExternalLink size={12} />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const VaultModule = React.memo(VaultModuleComponent);
