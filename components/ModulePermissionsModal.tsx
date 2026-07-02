import React, { useState, useEffect } from 'react';
import { X, Save, Box, ExternalLink, Beaker, CheckSquare, Activity, Key, BookOpen, MonitorPlay } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface ModulePermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onSaved: () => void;
}

const AVAILABLE_MODULES = [
    { id: 'assets', name: 'Gestão de Ativos', icon: <Box size={18} /> },
    { id: 'links', name: 'Centro de Atalhos', icon: <ExternalLink size={18} /> },
    { id: 'audit', name: 'Logs de Auditoria', icon: <Activity size={18} /> },
    { id: 'tasks', name: 'Task Manager', icon: <CheckSquare size={18} /> },
    { id: 'vault', name: 'Password Vault', icon: <Key size={18} /> },
    { id: 'tutorials', name: 'Tutoriais', icon: <BookOpen size={18} /> },
    { id: 'lab', name: 'TI Beta Lab', icon: <Beaker size={18} /> },
    { id: 'signage', name: 'Mural Digital', icon: <MonitorPlay size={18} /> }
];

export const ModulePermissionsModal = ({ isOpen, onClose, user, onSaved }: ModulePermissionsModalProps) => {
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            try {
                const parsed = typeof user.modules === 'string' ? JSON.parse(user.modules) : (user.modules || []);
                setSelectedModules(parsed);
            } catch {
                setSelectedModules(['assets', 'links', 'audit', 'tasks', 'vault', 'tutorials', 'lab']);
            }
        }
    }, [user, isOpen]);

    if (!isOpen || !user) return null;

    const toggleModule = (id: string) => {
        setSelectedModules(prev => 
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const modulesStr = JSON.stringify(selectedModules);
            const { error } = await apiClient.from('authorized_users').update({ modules: modulesStr }).eq('id', user.id);
            if (error) throw error;
            onSaved();
            onClose();
        } catch (err: any) {
            alert('Erro ao salvar permissões: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Acessos de Módulos</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-3">
                        {AVAILABLE_MODULES.map(mod => {
                            const isSelected = selectedModules.includes(mod.id);
                            return (
                                <div 
                                    key={mod.id} 
                                    onClick={() => toggleModule(mod.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                                            {mod.icon}
                                        </div>
                                        <span className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{mod.name}</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Salvar Acessos'}
                    </button>
                </div>
            </div>
        </div>
    );
};
