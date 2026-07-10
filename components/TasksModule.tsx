import React, { useState } from 'react';
import { Plus, Search, Filter, MessageSquare, ArrowLeft, CheckCircle2, AlertCircle, LogOut, Trash2, Loader2 } from 'lucide-react';
import { ITTask } from '../types';
import { apiClient } from '../lib/apiClient';

// Importando componentes refatorados (Feature-Sliced Design)
import { useTasks, useSystemUsers } from './tasks/useTasks';
import { TasksList } from './tasks/TasksList';
import { TaskDetailPanel } from './tasks/TaskDetailPanel';
import { NewTaskModal } from './tasks/NewTaskModal';

interface TasksModuleProps {
    onClose?: () => void;
    onLogout?: () => void;
    userEmail: string;
}

const TasksModuleComponent = ({ onClose, onLogout, userEmail }: TasksModuleProps) => {
    // 1. Estados Globais via SWR
    const { tasks, isLoading, mutate: mutateTasks } = useTasks();
    const { systemUsers } = useSystemUsers();
    
    // 2. Estados Locais da Interface
    const [selectedTask, setSelectedTask] = useState<ITTask | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    
    // 3. Estados de Filtro
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleDeleteSelected = async () => {
        if (!selectedTaskIds.length) return;
        if (!window.confirm(`Tem certeza que deseja apagar ${selectedTaskIds.length} chamado(s)?`)) return;
        
        try {
            const { error } = await apiClient.from('it_tasks').delete().in('id', selectedTaskIds);
            if (error) throw error;
            setSelectedTaskIds([]);
            mutateTasks();
        } catch (err) {
            console.error('Error deleting tasks:', err);
            alert('Erro ao apagar chamados. Verifique se você tem permissão.');
        }
    };

    const filteredTasks = React.useMemo(() => {
        return tasks.filter(t => {
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            
            if (filterAssignee === 'mine') {
                if (t.assigned_to !== userEmail && t.created_by !== userEmail) return false;
            } else if (filterAssignee === 'unassigned') {
                if (t.assigned_to) return false;
            } else if (filterAssignee !== 'all') {
                if (t.assigned_to !== filterAssignee) return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = t.title.toLowerCase().includes(query);
                const matchesDesc = t.description?.toLowerCase().includes(query);
                const matchesId = t.id.toLowerCase().includes(query);
                if (!matchesTitle && !matchesDesc && !matchesId) return false;
            }

            return true;
        });
    }, [tasks, filterStatus, filterAssignee, searchQuery, userEmail]);

    return (
        <div className="flex flex-col h-screen bg-[#f3f4f6] dark:bg-[#0c0d21] overflow-hidden text-slate-800 dark:text-white transition-colors duration-300 font-sans">
            {/* Header (Top Nav) */}
            <header className="h-16 border-b border-slate-300 dark:border-white/5 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shadow-sm z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/5">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Gestão de Chamados</h1>
                    {isLoading && <Loader2 size={16} className="animate-spin text-indigo-500 ml-2" />}
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar chamados..." 
                            className="w-64 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all dark:text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsNewTaskModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md shadow-indigo-500/20">
                        <Plus size={16} /> Criar Chamado
                    </button>
                    {!onClose && onLogout && (
                        <button onClick={onLogout} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm ml-2">
                            <LogOut size={16} /> Sair
                        </button>
                    )}
                </div>
            </header>

            {/* Main Area Container */}
            <div className="flex-1 overflow-hidden p-4 md:p-6 flex gap-6">
                
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                    {/* MINI-DASHBOARD */}
                    {!onClose && (
                        <div className="grid grid-cols-3 gap-4 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/5 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Meus Chamados Abertos</p>
                                    <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{tasks.filter(t => t.created_by === userEmail && t.status !== 'completed').length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <AlertCircle size={20} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/5 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Chamados Resolvidos</p>
                                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{tasks.filter(t => t.created_by === userEmail && t.status === 'completed').length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/5 p-4 rounded-xl shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Mensagens Totais</p>
                                    <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{tasks.filter(t => t.created_by === userEmail).length}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <MessageSquare size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Table Container */}
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl flex flex-col shadow-sm overflow-hidden relative">
                        <div className="p-4 border-b border-slate-300 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Lista de Chamados</h2>
                                {selectedTaskIds.length > 0 && (
                                    <button 
                                        onClick={handleDeleteSelected}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 rounded-md transition-colors"
                                    >
                                        <Trash2 size={14} /> Apagar Selecionados ({selectedTaskIds.length})
                                    </button>
                                )}
                            </div>
                            <span className="text-xs font-semibold bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300 shadow-sm">
                                {filteredTasks.length} Registros
                            </span>
                        </div>
                        
                        {/* REFACTORED LIST COMPONENT */}
                        <TasksList 
                            filteredTasks={filteredTasks}
                            selectedTaskIds={selectedTaskIds}
                            setSelectedTaskIds={setSelectedTaskIds}
                            setSelectedTask={setSelectedTask}
                        />
                    </div>
                </div>

                {/* Right Sidebar Filters */}
                <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl p-5 flex flex-col shadow-sm hidden lg:flex h-full overflow-y-auto">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-white/5">
                        <Filter size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">Filtros Avançados</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Atribuído a / Agentes</label>
                            <select 
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors dark:text-white font-medium"
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value)}
                            >
                                <option value="all">Todos os Agentes</option>
                                <option value="mine">Meus Chamados</option>
                                <option value="unassigned">Não Atribuídos</option>
                                {systemUsers.map(u => (
                                    <option key={u.email} value={u.email}>{u.email.split('@')[0]}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Status do Chamado</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'all', label: 'Todos os Status' },
                                    { id: 'pending', label: 'Abertos (Novos)' },
                                    { id: 'in_progress', label: 'Em Progresso' },
                                    { id: 'blocked', label: 'Bloqueados' },
                                    { id: 'completed', label: 'Resolvidos' }
                                ].map(status => (
                                    <label key={status.id} className="flex items-center gap-3 text-sm cursor-pointer group">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filterStatus === status.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'}`}>
                                            {filterStatus === status.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <span className={`font-medium ${filterStatus === status.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Extensibility placeholder */}
                        <div className="space-y-3 opacity-50 pointer-events-none pt-4 border-t border-slate-200 dark:border-white/5">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Criado</label>
                            <select className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg p-2.5 text-sm focus:outline-none dark:text-white font-medium">
                                <option>Últimos seis meses</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* REFACTORED Slide-over Drawer for Details */}
            {selectedTask && (
                <TaskDetailPanel 
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    userEmail={userEmail}
                    systemUsers={systemUsers}
                />
            )}

            {/* REFACTORED New Task Modal */}
            {isNewTaskModalOpen && (
                <NewTaskModal 
                    setIsNewTaskModalOpen={setIsNewTaskModalOpen}
                    userEmail={userEmail}
                    systemUsers={systemUsers}
                />
            )}
        </div>
    );
};

export const TasksModule = React.memo(TasksModuleComponent);
