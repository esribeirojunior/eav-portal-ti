import React from 'react';
import { User, Clock, AlertCircle } from 'lucide-react';
import { ITTask } from '../../types';

interface TasksListProps {
    filteredTasks: ITTask[];
    selectedTaskIds: string[];
    setSelectedTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedTask: (task: ITTask) => void;
}

export const TasksList: React.FC<TasksListProps> = ({ 
    filteredTasks, 
    selectedTaskIds, 
    setSelectedTaskIds, 
    setSelectedTask 
}) => {
    
    const getSLAStatus = (task: ITTask) => {
        if (task.status === 'completed') return null;
        
        const created = new Date(task.created_at).getTime();
        const now = Date.now();
        const diffHours = (now - created) / (1000 * 60 * 60);
        
        let limitHours = 48; // low
        if (task.priority === 'medium') limitHours = 24;
        if (task.priority === 'high') limitHours = 4;
        if (task.priority === 'critical') limitHours = 2;
        
        const remaining = limitHours - diffHours;
        
        if (remaining < 0) {
            return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded animate-pulse"><AlertCircle size={10} /> Vencido a {Math.abs(Math.round(remaining))}h</span>;
        } else if (remaining < limitHours * 0.25) {
            return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded"><Clock size={10} /> Restam {Math.round(remaining)}h</span>;
        }
        return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded"><Clock size={10} /> no prazo</span>;
    };

    return (
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
                                <div className="mt-1 flex">
                                    {getSLAStatus(task)}
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
    );
};
