
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ITTask, ITTaskComment } from '../types';
import {
    CheckCircle2,
    Circle,
    Clock,
    AlertTriangle,
    Plus,
    X,
    MessageSquare,
    Send,
    Calendar,
    Filter,
    ArrowLeft,
    Loader2,
    Trash2,
    AlertOctagon
} from 'lucide-react';

interface TasksModuleProps {
    userEmail: string;
    onBack: () => void;
}

const TasksModuleComponent: React.FC<TasksModuleProps> = ({ userEmail, onBack }) => {
    const [tasks, setTasks] = useState<ITTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ITTask | null>(null);
    const [comments, setComments] = useState<ITTaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Form States
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    useEffect(() => {
        if (selectedTask) {
            fetchComments(selectedTask.id);
        }
    }, [selectedTask]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('it_tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (taskId: string) => {
        try {
            const { data, error } = await supabase
                .from('it_task_comments')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('it_tasks')
                .insert([{
                    title: newTaskTitle,
                    description: newTaskDesc,
                    priority: newTaskPriority,
                    due_date: newTaskDueDate || null,
                    created_by: userEmail,
                    status: 'pending'
                }]);

            if (error) throw error;

            setIsNewTaskModalOpen(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskPriority('medium');
            setNewTaskDueDate('');
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Erro ao criar tarefa');
        }
    };

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('it_tasks')
                .update({ status: newStatus })
                .eq('id', taskId);

            if (error) throw error;

            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(prev => prev ? { ...prev, status: newStatus as any } : null);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
        try {
            const { error } = await supabase
                .from('it_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            setTasks(prev => prev.filter(t => t.id !== taskId));
            if (selectedTask && selectedTask.id === taskId) {
                setSelectedTask(null);
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !newComment.trim()) return;

        try {
            const { error } = await supabase
                .from('it_task_comments')
                .insert([{
                    task_id: selectedTask.id,
                    user_email: userEmail,
                    content: newComment
                }]);

            if (error) throw error;

            setNewComment('');
            fetchComments(selectedTask.id);
        } catch (err) {
            console.error('Error sending comment:', err);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-slate-700 dark:text-white/50 bg-white dark:bg-white/5 border-slate-400 dark:border-white/10';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'in_progress': return <Clock className="text-blue-500" size={20} />;
            case 'blocked': return <AlertOctagon className="text-rose-500" size={20} />;
            default: return <Circle className="text-slate-700 dark:text-white/30" size={20} />;
        }
    };

    const filteredTasks = React.useMemo(() => {
        return tasks.filter(t => {
            if (filterStatus === 'all') return true;
            return t.status === filterStatus;
        });
    }, [tasks, filterStatus]);

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden">
            {/* Sidebar / List */}
            <div className={`w-full md:w-[450px] flex flex-col border-r border-slate-400 dark:border-white/5 bg-slate-100 dark:bg-slate-950 transform transition-transform duration-300 ${selectedTask ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-6 border-b border-slate-400 dark:border-white/5 space-y-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white dark:bg-white/5 rounded-lg text-slate-700 dark:text-white/50 hover:text-slate-900 dark:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-[900] uppercase tracking-tighter">Tarefas TI</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsNewTaskModalOpen(true)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white py-3 rounded-xl font-bold uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Plus size={16} />
                            Nova Tarefa
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { id: 'all', label: 'Todas' },
                            { id: 'pending', label: 'Pendentes' },
                            { id: 'in_progress', label: 'Em Progresso' },
                            { id: 'blocked', label: 'Bloqueado' },
                            { id: 'completed', label: 'Concluído' },
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterStatus(filter.id)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${filterStatus === filter.id
                                    ? 'bg-white text-black border-white'
                                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-white/40 border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-indigo-500" />
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-20 text-slate-600 dark:text-white/20">
                            <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:translate-x-1 ${selectedTask?.id === task.id
                                    ? 'bg-white dark:bg-white/5 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
                                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-400 dark:border-white/5 hover:bg-slate-200 dark:bg-white/[0.04]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <h3 className={`font-bold text-sm leading-snug ${task.status === 'completed' ? 'text-slate-700 dark:text-white/40 line-through' : 'text-slate-900 dark:text-white'}`}>
                                        {task.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                                        {task.priority === 'medium' ? 'Médio' : task.priority === 'high' ? 'Alto' : task.priority === 'low' ? 'Baixo' : 'Crítico'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-slate-700 dark:text-white/30 text-xs">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(task.status)}
                                        <span className="capitalize text-[10px] font-medium">
                                            {task.status === 'in_progress' ? 'Em Progresso' : task.status === 'pending' ? 'Pendente' : task.status === 'completed' ? 'Concluído' : 'Bloqueado'}
                                        </span>
                                    </div>
                                    {task.due_date && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/5 rounded-md text-[10px]">
                                            <Calendar size={12} />
                                            <span>{new Date(task.due_date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {/* Footer in Sidebar */}
                <div className="p-4 border-t border-slate-400 dark:border-white/5 text-center no-print bg-slate-100 dark:bg-slate-950">
                    <p className="text-slate-600 dark:text-white/10 text-[8px] uppercase tracking-[0.25em] font-black">
                        Escola Americana &copy; 2026 - v2.0 by Erisson Ribeiro
                    </p>
                </div>
            </div>

            {/* Details / Comments */}
            <div className={`flex-1 bg-slate-100 dark:bg-slate-950 flex-col ${selectedTask ? 'flex' : 'hidden md:flex'}`}>
                {selectedTask ? (
                    <>
                        {/* Detail Header */}
                        <div className="h-20 border-b border-slate-400 dark:border-white/5 flex items-center justify-between px-8 bg-slate-200 dark:bg-black/20">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-700 dark:text-white/50"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/40 font-bold mb-1">Detalhes da Tarefa</span>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider border ${getPriorityColor(selectedTask.priority)}`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedTask.status}
                                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                                    className="bg-white dark:bg-black/40 border border-slate-400 dark:border-white/10 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 uppercase font-bold tracking-wider"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="in_progress">Em Progresso</option>
                                    <option value="blocked">Bloqueado</option>
                                    <option value="completed">Concluído</option>
                                </select>
                                <button
                                    onClick={() => handleDeleteTask(selectedTask.id)}
                                    className="p-2 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Detail Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-[900] tracking-tight text-slate-900 dark:text-white leading-tight">
                                    {selectedTask.title}
                                </h2>
                                {selectedTask.description && (
                                    <p className="text-slate-800 dark:text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedTask.description}
                                    </p>
                                )}

                                <div className="flex gap-6 pt-4 border-t border-slate-400 dark:border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado por</p>
                                        <p className="text-xs text-slate-700 dark:text-white/70">{selectedTask.created_by}</p>
                                    </div>
                                    {selectedTask.due_date && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Data Limite</p>
                                            <p className="text-xs text-slate-700 dark:text-white/70">{new Date(selectedTask.due_date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-700 dark:text-white/30 font-bold">Criado em</p>
                                        <p className="text-xs text-slate-700 dark:text-white/70">{new Date(selectedTask.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Board Diary (Comments) */}
                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-400 dark:border-white/5 rounded-3xl p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <MessageSquare size={18} className="text-indigo-500" />
                                    <h3 className="text-sm font-[900] uppercase tracking-widest text-slate-900 dark:text-white">Diário de Bordo</h3>
                                </div>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {comments.length === 0 ? (
                                        <p className="text-slate-600 dark:text-white/20 text-xs italic text-center py-4">Nenhum registro no diário ainda.</p>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="flex gap-4 group">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 border border-indigo-500/10 flex-shrink-0">
                                                    {comment.user_email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-[11px] font-bold text-slate-800 dark:text-white/80">{comment.user_email}</span>
                                                        <span className="text-[9px] text-slate-600 dark:text-white/20">{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-800 dark:text-white/60 leading-relaxed bg-white dark:bg-white/5 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handleSendComment} className="relative mt-4">
                                    <input
                                        type="text"
                                        placeholder="Adicionar registro ao diário..."
                                        className="w-full bg-white dark:bg-black/40 border border-slate-400 dark:border-white/10 rounded-xl py-4 pl-5 pr-12 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 dark:text-white/20"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-slate-900 dark:text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600 dark:text-white/20 space-y-6">
                        <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle2 size={48} />
                        </div>
                        <p className="text-sm uppercase tracking-widest font-bold">Selecione uma tarefa para ver o diário</p>
                    </div>
                )}
            </div>

            {/* New Task Modal */}
            {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#1a1b3b] border border-slate-400 dark:border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative">
                        <button
                            onClick={() => setIsNewTaskModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-700 dark:text-white/30 hover:text-slate-900 dark:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-[900] uppercase tracking-tighter text-slate-900 dark:text-white mb-8">Nova Tarefa</h2>

                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Título</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Verificar oscilação no link 2"
                                    className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Descrição / Contexto</label>
                                <textarea
                                    placeholder="Detalhes adicionais sobre a tarefa..."
                                    rows={4}
                                    className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all resize-none"
                                    value={newTaskDesc}
                                    onChange={e => setNewTaskDesc(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prioridade</label>
                                    <select
                                        className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all appearance-none"
                                        value={newTaskPriority}
                                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                                    >
                                        <option value="low" className="bg-white dark:bg-[#1a1b3b]">Baixa</option>
                                        <option value="medium" className="bg-white dark:bg-[#1a1b3b]">Média</option>
                                        <option value="high" className="bg-white dark:bg-[#1a1b3b]">Alta</option>
                                        <option value="critical" className="bg-white dark:bg-[#1a1b3b]">Crítica</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-700 dark:text-white/50">Prazo (Opcional)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl py-4 px-5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                                        value={newTaskDueDate}
                                        onChange={e => setNewTaskDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-slate-900 dark:text-white font-bold py-4 rounded-xl uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 mt-4"
                            >
                                Criar Tarefa
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export const TasksModule = React.memo(TasksModuleComponent);
