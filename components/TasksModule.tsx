import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MessageSquare, ArrowLeft, MoreHorizontal, User, Send, CheckCircle2, AlertOctagon, X, Clock, AlertCircle, LogOut, Trash2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { ITTask, ITTaskComment } from '../types';

interface TasksModuleProps {
    onClose?: () => void;
    onLogout?: () => void;
    userEmail: string;
}

const TasksModuleComponent = ({ onClose, onLogout, userEmail }: TasksModuleProps) => {
    const [tasks, setTasks] = useState<ITTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<ITTask | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [comments, setComments] = useState<ITTaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterAssignee, setFilterAssignee] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Create Task
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchSystemUsers();
    }, []);

    useEffect(() => {
        if (selectedTask) {
            fetchComments(selectedTask.id);
        }
    }, [selectedTask]);

    const fetchSystemUsers = async () => {
        try {
            const { data, error } = await apiClient.from('authorized_users').select('email');
            if (data) setSystemUsers(data);
        } catch (err) {}
    };

    const fetchTasks = async () => {
        try {
            const { data, error } = await apiClient.from('it_tasks').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const fetchComments = async (taskId: string) => {
        try {
            const { data, error } = await apiClient.from('it_task_comments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            if (data) setComments(data);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await apiClient.from('it_tasks')
                .insert([{
                    title: newTaskTitle,
                    description: newTaskDesc,
                    priority: newTaskPriority,
                    due_date: newTaskDueDate || null,
                    created_by: userEmail,
                    assigned_to: newTaskAssignedTo || null,
                    status: 'pending'
                }]);
            
            if (error) throw error;
            
            setIsNewTaskModalOpen(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskPriority('medium');
            setNewTaskDueDate('');
            setNewTaskAssignedTo('');
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Erro ao criar tarefa');
        }
    };

    const handleAssignTask = async (taskId: string, assignedTo: string) => {
        try {
            const { error } = await apiClient.from('it_tasks').update({ assigned_to: assignedTo || null }).eq('id', taskId);
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: assignedTo || undefined } : t));
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, assigned_to: assignedTo || undefined } : null);
            }
        } catch (err) {
            console.error('Error assigning task:', err);
        }
    };

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await apiClient.from('it_tasks').update({ status: newStatus }).eq('id', taskId);
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, status: newStatus as any } : null);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !newComment.trim()) return;

        try {
            const { error } = await apiClient.from('it_task_comments')
                .insert([{
                    task_id: selectedTask.id,
                    user_email: userEmail,
                    content: newComment.trim()
                }]);

            if (error) throw error;
            setNewComment('');
            fetchComments(selectedTask.id);
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedTaskIds.length) return;
        if (!window.confirm(`Tem certeza que deseja apagar ${selectedTaskIds.length} chamado(s)?`)) return;
        
        try {
            const { error } = await apiClient.from('it_tasks').delete().in('id', selectedTaskIds);
            if (error) throw error;
            setSelectedTaskIds([]);
            fetchTasks();
        } catch (err) {
            console.error('Error deleting tasks:', err);
            alert('Erro ao apagar chamados. Verifique se você tem permissão.');
        }
    };

    const filteredTasks = React.useMemo(() => {
        return tasks.filter(t => {
            // Status filter
            if (filterStatus !== 'all' && t.status !== filterStatus) return false;
            
            // Assignee filter
            if (filterAssignee === 'mine') {
                if (t.assigned_to !== userEmail && t.created_by !== userEmail) return false;
            } else if (filterAssignee === 'unassigned') {
                if (t.assigned_to) return false;
            } else if (filterAssignee !== 'all') {
                if (t.assigned_to !== filterAssignee) return false;
            }

            // Search query filter
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
                
                {/* Data Table */}
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
                    
                    <div className="overflow-x-auto flex-1 h-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm z-10">
                                <tr className="border-b border-slate-200 dark:border-white/5 text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                                    <th className="p-4 w-10 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300" 
                                            checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTaskIds(filteredTasks.map(t => t.id));
                                                } else {
                                                    setSelectedTaskIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="p-4">Assunto</th>
                                    <th className="p-4">Solicitante</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Prioridade</th>
                                    <th className="p-4">Atribuído a</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhum chamado encontrado.</td>
                                    </tr>
                                ) : filteredTasks.map(task => (
                                    <tr 
                                        key={task.id} 
                                        onClick={() => setSelectedTask(task)}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300" 
                                                checked={selectedTaskIds.includes(task.id)}
                                                onClick={e => e.stopPropagation()} 
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTaskIds(prev => [...prev, task.id]);
                                                    } else {
                                                        setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="p-4 max-w-[300px]">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 transition-colors text-sm truncate">{task.title}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{task.description}</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase">#INC-{task.id.substring(0, 4)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {task.created_by.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{task.created_by.split('@')[0]}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-1.5 rounded text-[10px] uppercase font-black tracking-wider border ${
                                                task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                                task.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                                                'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                            }`}>
                                                {task.status === 'completed' ? 'Resolvido' : task.status === 'in_progress' ? 'Em Progresso' : task.status === 'blocked' ? 'Bloqueado' : 'Aberto'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    task.priority === 'critical' ? 'bg-red-500' :
                                                    task.priority === 'high' ? 'bg-orange-500' :
                                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`} />
                                                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-xs">
                                                    {task.priority === 'critical' ? 'Crítica' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {task.assigned_to ? (
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400" />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{task.assigned_to.split('@')[0]}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Nenhum</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

                        {/* Extensibility placeholder for more filters */}
                        <div className="space-y-3 opacity-50 pointer-events-none pt-4 border-t border-slate-200 dark:border-white/5">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Criado</label>
                            <select className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-lg p-2.5 text-sm focus:outline-none dark:text-white font-medium">
                                <option>Últimos seis meses</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slide-over Drawer for Details */}
            {selectedTask && (
                <div className="fixed inset-0 z-40 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedTask(null)} />
                    <div className="relative w-full max-w-md lg:max-w-2xl h-full bg-white dark:bg-[#12132b] shadow-[0_0_40px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-white/5">
                        
                        {/* Drawer Header */}
                        <div className="p-6 lg:p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/10 flex items-start justify-between flex-shrink-0">
                            <div className="flex flex-col pr-8">
                                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 self-start px-2 py-1 rounded mb-3">
                                    #INC-{selectedTask.id.substring(0,8).toUpperCase()}
                                </span>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{selectedTask.title}</h2>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-200 dark:bg-white/5 rounded-full transition-colors flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Drawer Content Area */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 lg:p-8 space-y-8">
                                
                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Status</p>
                                        <select
                                            value={selectedTask.status}
                                            onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                                            className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer border-b border-dashed border-slate-300 dark:border-slate-600 pb-1"
                                        >
                                            <option value="pending">Aberto</option>
                                            <option value="in_progress">Em Progresso</option>
                                            <option value="blocked">Bloqueado</option>
                                            <option value="completed">Resolvido</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Atribuído a</p>
                                        <select
                                            value={selectedTask.assigned_to || ''}
                                            onChange={(e) => handleAssignTask(selectedTask.id, e.target.value)}
                                            className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer border-b border-dashed border-slate-300 dark:border-slate-600 pb-1 w-full truncate"
                                        >
                                            <option value="">Não Atribuído</option>
                                            {systemUsers.map(u => (
                                                <option key={u.email} value={u.email}>{u.email.split('@')[0]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Solicitante</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 pb-1 truncate">{selectedTask.created_by.split('@')[0]}</p>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Prioridade</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize pb-1">{selectedTask.priority === 'critical' ? 'Crítica' : selectedTask.priority === 'high' ? 'Alta' : selectedTask.priority === 'medium' ? 'Média' : 'Baixa'}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-indigo-500" /> Descrição Original</h3>
                                    <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        {selectedTask.description || <span className="italic opacity-50">Nenhuma descrição fornecida pelo solicitante.</span>}
                                    </div>
                                </div>

                                {/* Comments Timeline */}
                                <div>
                                    <h3 className="text-xs uppercase font-bold text-slate-500 mb-4 flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500" /> Interações e Notas</h3>
                                    <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-white/10 before:to-transparent">
                                        {comments.map((comment, i) => (
                                            <div key={comment.id} className="relative flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shadow-sm z-10 flex-shrink-0">
                                                    {comment.user_email.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{comment.user_email.split('@')[0]}</span>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {comments.length === 0 && (
                                            <div className="relative flex items-center justify-center py-8">
                                                <div className="bg-slate-100 dark:bg-black/30 px-4 py-2 rounded-full border border-slate-200 dark:border-white/5 text-xs text-slate-500 font-medium z-10">
                                                    Nenhuma interação registrada.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-4"></div>
                            </div>
                        </div>

                        {/* Comment Input Sticky Footer */}
                        <div className="p-4 lg:p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] flex-shrink-0">
                            <form onSubmit={handlePostComment} className="relative">
                                <div className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {userEmail.substring(0,2).toUpperCase()}
                                </div>
                                <textarea
                                    placeholder="Adicionar uma nota ou resposta..."
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-2xl py-4 pl-14 pr-16 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all dark:text-white"
                                    rows={2}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="absolute right-3 bottom-3 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1b3b] border border-slate-200 dark:border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsNewTaskModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-[900] uppercase tracking-tighter text-slate-900 dark:text-white mb-8">Novo Chamado</h2>

                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400">Assunto do Chamado</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Verificar oscilação no link 2"
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400">Descrição Detalhada</label>
                                <textarea
                                    placeholder="Descreva o problema ou solicitação com o máximo de detalhes..."
                                    rows={4}
                                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    value={newTaskDesc}
                                    onChange={e => setNewTaskDesc(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400">Prioridade</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                        value={newTaskPriority}
                                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                        <option value="critical">Crítica</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400">Atribuir para (Opcional)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                        value={newTaskAssignedTo}
                                        onChange={e => setNewTaskAssignedTo(e.target.value)}
                                    >
                                        <option value="">Não atribuir agora</option>
                                        {systemUsers.map(u => (
                                            <option key={u.email} value={u.email}>{u.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl uppercase text-[11px] tracking-widest transition-all shadow-lg active:scale-95 mt-4"
                            >
                                Criar Chamado
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const TasksModule = React.memo(TasksModuleComponent);
