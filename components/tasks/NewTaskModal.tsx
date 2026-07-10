import React, { useState } from 'react';
import { X, ImageIcon, Paperclip } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { uploadFile, useTasks } from './useTasks';

interface NewTaskModalProps {
    setIsNewTaskModalOpen: (isOpen: boolean) => void;
    userEmail: string;
    systemUsers: { email: string }[];
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
    setIsNewTaskModalOpen,
    userEmail,
    systemUsers
}) => {
    const { mutate: mutateTasks } = useTasks();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
    const [newTaskFile, setNewTaskFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsUploading(true);
            let attachment_url = null;
            if (newTaskFile) {
                attachment_url = await uploadFile(newTaskFile);
            }

            const { error } = await apiClient.from('it_tasks')
                .insert([{
                    title: newTaskTitle,
                    description: newTaskDesc,
                    priority: newTaskPriority,
                    due_date: newTaskDueDate || null,
                    created_by: userEmail,
                    assigned_to: newTaskAssignedTo || null,
                    status: 'pending',
                    attachment_url
                }]);
            
            if (error) throw error;
            
            setIsNewTaskModalOpen(false);
            mutateTasks(); // Refresh global tasks
        } catch (err) {
            console.error('Error creating task:', err);
            alert('Erro ao criar tarefa');
        } finally {
            setIsUploading(false);
        }
    };

    return (
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

                    <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest font-bold text-slate-600 dark:text-slate-400">Anexo (Opcional)</label>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl cursor-pointer bg-slate-50 dark:bg-black/10 transition-colors w-full">
                                <ImageIcon size={18} className="text-slate-400" />
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Selecionar imagem...</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) setNewTaskFile(e.target.files[0]);
                                    }}
                                />
                            </label>
                        </div>
                        {newTaskFile && (
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg inline-flex">
                                <Paperclip size={14} />
                                {newTaskFile.name}
                                <button type="button" onClick={() => setNewTaskFile(null)} className="text-red-500 hover:text-red-700 ml-2"><X size={14}/></button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl uppercase text-[11px] tracking-widest transition-all shadow-lg active:scale-95 mt-4"
                    >
                        {isUploading ? 'Enviando...' : 'Criar Chamado'}
                    </button>
                </form>
            </div>
        </div>
    );
};
