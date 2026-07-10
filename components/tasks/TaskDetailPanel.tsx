import React, { useState } from 'react';
import { X, AlertCircle, ImageIcon, MessageSquare, Paperclip, Send } from 'lucide-react';
import { ITTask } from '../../types';
import { useTaskComments, uploadFile, useTasks } from './useTasks';
import { apiClient } from '../../lib/apiClient';

interface TaskDetailPanelProps {
    selectedTask: ITTask;
    setSelectedTask: (task: ITTask | null) => void;
    userEmail: string;
    systemUsers: { email: string }[];
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    selectedTask,
    setSelectedTask,
    userEmail,
    systemUsers
}) => {
    const { comments, mutate: mutateComments } = useTaskComments(selectedTask.id);
    const { mutate: mutateTasks } = useTasks();
    const [newComment, setNewComment] = useState('');
    const [newCommentFile, setNewCommentFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        try {
            const { error } = await apiClient.from('it_tasks').update({ status: newStatus }).eq('id', taskId);
            if (error) throw error;
            
            // Update local state and global tasks cache
            setSelectedTask({ ...selectedTask, status: newStatus as any });
            mutateTasks();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleAssignTask = async (taskId: string, assignedTo: string) => {
        try {
            const { error } = await apiClient.from('it_tasks').update({ assigned_to: assignedTo || null }).eq('id', taskId);
            if (error) throw error;
            
            // Update local state and global tasks cache
            setSelectedTask({ ...selectedTask, assigned_to: assignedTo || undefined });
            mutateTasks();
        } catch (err) {
            console.error('Error assigning task:', err);
        }
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && !newCommentFile) return;

        try {
            setIsUploading(true);
            let attachment_url = null;
            if (newCommentFile) {
                attachment_url = await uploadFile(newCommentFile);
            }

            const { error } = await apiClient.from('it_task_comments')
                .insert([{
                    task_id: selectedTask.id,
                    user_email: userEmail,
                    content: newComment.trim(),
                    attachment_url
                }]);

            if (error) throw error;
            
            setNewComment('');
            setNewCommentFile(null);
            mutateComments(); // Refresh comments list using SWR
        } catch (err) {
            console.error('Error posting comment:', err);
            alert('Erro ao enviar mensagem');
        } finally {
            setIsUploading(false);
        }
    };

    return (
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
                                {selectedTask.attachment_url && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><ImageIcon size={14} /> Anexo do Chamado</p>
                                        <a href={selectedTask.attachment_url} target="_blank" rel="noreferrer">
                                            <img src={selectedTask.attachment_url} alt="Anexo" className="max-w-full h-auto max-h-64 rounded-lg border border-slate-200 dark:border-white/10 hover:opacity-90 transition-opacity object-contain bg-slate-100 dark:bg-slate-800" />
                                        </a>
                                    </div>
                                )}
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
                                            {comment.attachment_url && (
                                                <div className="mt-3">
                                                    <a href={comment.attachment_url} target="_blank" rel="noreferrer">
                                                        <img src={comment.attachment_url} alt="Anexo" className="max-w-full h-auto max-h-48 rounded border border-slate-200 dark:border-white/10 hover:opacity-90 transition-opacity object-contain bg-slate-100 dark:bg-slate-800" />
                                                    </a>
                                                </div>
                                            )}
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
                    <form onSubmit={handlePostComment} className="relative flex flex-col gap-2">
                        <div className="relative">
                            <div className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                {userEmail.substring(0,2).toUpperCase()}
                            </div>
                            <textarea
                                placeholder="Adicionar uma nota ou resposta..."
                                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-2xl py-4 pl-14 pr-24 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all dark:text-white"
                                rows={2}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            
                            <label className="absolute right-12 bottom-3 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-xl cursor-pointer transition-colors" title="Anexar Imagem">
                                <Paperclip size={18} />
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) setNewCommentFile(e.target.files[0]);
                                    }}
                                />
                            </label>
                            
                            <button
                                type="submit"
                                disabled={(!newComment.trim() && !newCommentFile) || isUploading}
                                className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        {newCommentFile && (
                            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg self-start">
                                <Paperclip size={12} />
                                <span className="truncate max-w-[200px]">{newCommentFile.name}</span>
                                <button type="button" onClick={() => setNewCommentFile(null)} className="text-red-500 ml-2 hover:text-red-700"><X size={12} /></button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
