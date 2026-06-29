const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'components', 'VaultModule.tsx');

const reactCode = `
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Search, Copy, Eye, EyeOff, Loader2, ArrowLeft, Lock, Key, FileText, AlertCircle, CheckCircle2, Plus, X, Trash2, Save
} from 'lucide-react';
import { BitwardenSecret as Secret, BitwardenProject as Project } from '../types';

interface VaultModuleProps {
  userEmail: string;
  onBack: () => void;
}

const VaultModuleComponent: React.FC<VaultModuleProps> = ({ userEmail, onBack }) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form States
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newSecretProjectId, setNewSecretProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  const isAdmin = userEmail?.toLowerCase().trim() === 'erisson.junior@escolaamericana.com.br' || userEmail?.toLowerCase().trim() === 'local@teste.com' || userEmail?.toLowerCase().trim() === 'admin@teste.local';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? \`Bearer \${token}\` : ''
      };

      const [secretsRes, projectsRes] = await Promise.all([
        fetch('/api/vault/secrets', { headers }),
        fetch('/api/vault/projects', { headers })
      ]);

      if (!secretsRes.ok) throw new Error('Falha ao buscar segredos');
      if (!projectsRes.ok) throw new Error('Falha ao buscar projetos');

      const secretsData = await secretsRes.json();
      const projectsData = await projectsRes.json();

      setSecrets(secretsData);
      setProjects(projectsData);
      if (projectsData.length > 0) {
        setNewSecretProjectId(projectsData[0].id);
      }
    } catch (err: any) {
      console.error('Erro no Cofre:', err);
      setError('Erro ao conectar com o servidor do Cofre.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/vault/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? \`Bearer \${token}\` : '' },
        body: JSON.stringify({ key: newKey, value: newValue, note: newNote, projectId: newSecretProjectId })
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setIsSecretModalOpen(false);
      setNewKey(''); setNewValue(''); setNewNote('');
      fetchData();
    } catch (err) {
      alert('Erro ao salvar segredo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/vault/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? \`Bearer \${token}\` : '' },
        body: JSON.stringify({ name: newProjectName })
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setIsProjectModalOpen(false);
      setNewProjectName('');
      fetchData();
    } catch (err) {
      alert('Erro ao salvar projeto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSecret = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este segredo?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(\`/api/vault/secrets/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? \`Bearer \${token}\` : '' }
      });
      fetchData();
    } catch (err) {
      alert('Erro ao excluir segredo.');
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
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden font-sans">
      {/* Sidebar de Navegação Local */}
      <div className="w-full md:w-80 flex flex-col border-r border-slate-300 dark:border-white/5 bg-white dark:bg-slate-950 p-6 space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-300 dark:border-white/5"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">Cofre TI</h1>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold tracking-widest uppercase mt-1">Local Seguro</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Pesquisar segredo..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-indigo-500 transition-colors" size={16} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 dark:text-white/30">Projetos</label>
                {isAdmin && (
                    <button onClick={() => setIsProjectModalOpen(true)} className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 transition-colors">
                        <Plus size={14} />
                    </button>
                )}
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedProjectId('all')}
                className={\`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 \${selectedProjectId === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/5'}\`}
              >
                <ShieldCheck size={16} />
                Todos os Itens
              </button>
              {projects.map(project => (
                <button 
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={\`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 \${selectedProjectId === project.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/5'}\`}
                >
                  <FileText size={16} />
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 bg-indigo-50 dark:bg-indigo-600/5 border border-indigo-200 dark:border-indigo-500/10 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Lock size={14} className="text-indigo-500 dark:text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Segurança Total</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-white/30 leading-relaxed italic">
            Armazenamento criptografado no banco de dados local com AES-256.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 relative">
        {/* Toast de Feedback */}
        {copyFeedback && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-500">
              <CheckCircle2 size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{copyFeedback} Copiado!</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/20">Descriptografando cofre...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6 text-center max-w-sm mx-auto">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Erro de Conexão</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="px-8 py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-300 dark:border-white/10 transition-all text-slate-900 dark:text-white"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl md:text-5xl font-[1000] tracking-tighter uppercase text-slate-900 dark:text-white">Meus <span className="text-indigo-500">Segredos</span></h2>
                <p className="text-slate-500 dark:text-white/30 text-sm font-medium">Gestão centralizada de chaves e senhas de infraestrutura.</p>
              </div>
              <div className="flex items-center gap-4">
                 {isAdmin && (
                    <button onClick={() => setIsSecretModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-900/20">
                        <Plus size={16} /> Novo Segredo
                    </button>
                 )}
                 <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cofre Local
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredSecrets.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-slate-300 dark:border-white/5 rounded-[3rem]">
                  <Search size={40} className="mx-auto text-slate-400 dark:text-white/10" />
                  <p className="text-sm font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Nenhum segredo encontrado.</p>
                </div>
              ) : (
                filteredSecrets.map(secret => (
                  <div key={secret.id} className="group bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-300 dark:border-white/5 hover:border-indigo-500/30 transition-all hover:translate-y-[-4px] active:scale-[0.99] shadow-sm hover:shadow-md dark:shadow-none">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                          <Key size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">{secret.key}</h3>
                          <div className="flex gap-2 mt-1">
                            {secret.projectIds.map(pid => (
                              <span key={pid} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 rounded border border-slate-300 dark:border-white/5">
                                {projects.find(p => p.id === pid)?.name || 'Projeto'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleVisibility(secret.id)}
                          className="p-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                          {visibleSecrets[secret.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {isAdmin && (
                            <button 
                              onClick={() => handleDeleteSecret(secret.id)}
                              className="p-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className={\`w-full bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-2xl py-4 px-6 font-mono text-sm tracking-widest break-all \${visibleSecrets[secret.id] ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-white/10 select-none blur-sm'}\`}>
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
                        <div className="flex gap-3 items-start p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5">
                          <FileText size={14} className="text-slate-400 dark:text-white/20 mt-1 flex-shrink-0" />
                          <p className="text-[11px] text-slate-500 dark:text-white/40 italic leading-relaxed">{secret.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal Criar Segredo */}
      {isSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-[#1a1b3b] rounded-[2rem] border border-slate-300 dark:border-white/10 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsSecretModalOpen(false)} className="absolute top-6 right-6 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6">Novo Segredo</h3>
                <form onSubmit={handleCreateSecret} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-white/50 tracking-widest">Nome da Chave</label>
                        <input required value={newKey} onChange={e=>setNewKey(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="Ex: AWS_ACCESS_KEY" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-white/50 tracking-widest">Valor do Segredo (Senha/Token)</label>
                        <input required type="password" value={newValue} onChange={e=>setNewValue(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 font-mono" placeholder="••••••••••••••" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-white/50 tracking-widest">Projeto</label>
                        <select required value={newSecretProjectId} onChange={e=>setNewSecretProjectId(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500">
                            {projects.map(p => <option key={p.id} value={p.id} className="dark:bg-[#1a1b3b]">{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-white/50 tracking-widest">Nota Opcional</label>
                        <input value={newNote} onChange={e=>setNewNote(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="Ex: Acesso Root Banco de Dados" />
                    </div>
                    <button type="submit" disabled={saving || projects.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl mt-4 uppercase text-[11px] tracking-widest disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Criar Segredo Seguro'}
                    </button>
                    {projects.length === 0 && <p className="text-[10px] text-rose-500 text-center mt-2 font-bold">Crie um projeto primeiro.</p>}
                </form>
            </div>
        </div>
      )}

      {/* Modal Criar Projeto */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#1a1b3b] rounded-[2rem] border border-slate-300 dark:border-white/10 shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsProjectModalOpen(false)} className="absolute top-6 right-6 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-6">Novo Projeto</h3>
                <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 dark:text-white/50 tracking-widest">Nome do Projeto</label>
                        <input required value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} className="w-full mt-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" placeholder="Ex: Produção Cloud" />
                    </div>
                    <button type="submit" disabled={saving} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl mt-2 uppercase text-[11px] tracking-widest disabled:opacity-50">
                        {saving ? 'Criando...' : 'Criar Projeto'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export const VaultModule = React.memo(VaultModuleComponent);
`;

fs.writeFileSync(targetFile, reactCode, 'utf8');
console.log('VaultModule.tsx atualizado com sucesso.');
