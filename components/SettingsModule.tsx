import React, { useState, useEffect } from 'react';
import { Users, Building2, Plus, Trash2, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsModuleProps {
    userEmail?: string;
}

export const SettingsModule = ({ userEmail }: SettingsModuleProps) => {
    const [activeTab, setActiveTab] = useState<'users' | 'departments'>('users');
    
    // Users state
    const [users, setUsers] = useState<any[]>([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    
    // Departments state
    const [departments, setDepartments] = useState<any[]>([]);
    const [newDepartmentName, setNewDepartmentName] = useState('');

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'departments') fetchDepartments();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase.from('authorized_users').select('*').order('created_at', { ascending: false });
            if (data) setUsers(data);
            if (error) console.error(error);
        } catch (error) {
            console.error('Erro ao buscar usuários', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase.from('department').select('*');
            if (data) setDepartments(data);
            if (error) console.error(error);
        } catch (error) {
            console.error('Erro ao buscar departamentos', error);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = Math.random().toString(36).substring(2, 9);
            const pwd = newUserPassword || 'eav@123';
            
            const { error } = await supabase.from('authorized_users').insert([{
                id,
                email: newUserEmail,
                password: pwd,
                created_at: new Date().toISOString()
            }]);

            if (!error) {
                setNewUserEmail('');
                setNewUserPassword('');
                fetchUsers();
            } else {
                alert('Erro ao adicionar usuário: ' + error.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (email.toLowerCase() === userEmail?.toLowerCase()) {
            alert('Você não pode remover a si mesmo!');
            return;
        }
        if (!window.confirm(`Tem certeza que deseja remover o acesso de ${email}?`)) return;

        try {
            await supabase.from('authorized_users').delete().eq('id', id);
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = Math.random().toString(36).substring(2, 9);
            const { error } = await supabase.from('department').insert([{
                id,
                name: newDepartmentName
            }]);

            if (!error) {
                setNewDepartmentName('');
                fetchDepartments();
            } else {
                console.error(error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteDepartment = async (id: string, name: string) => {
        if (!window.confirm(`Tem certeza que deseja remover o setor ${name}? Isso pode afetar históricos existentes.`)) return;
        
        try {
            await supabase.from('department').delete().eq('id', id);
            fetchDepartments();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f4f7fc] dark:bg-[#0c0d21] p-6 md:p-12 relative transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-600 dark:text-indigo-500" size={32} />
                        Painel de Controle
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gerencie acessos e os cadastros base do sistema.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-200 dark:border-white/5">
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-bold transition-all ${activeTab === 'users' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            <Users size={18} /> Equipe de TI
                        </button>
                        <button 
                            onClick={() => setActiveTab('departments')}
                            className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-bold transition-all ${activeTab === 'departments' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                            <Building2 size={18} /> Setores e Departamentos
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'users' && (
                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-[#15162c] p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Adicionar Administrador</h3>
                                    <form onSubmit={handleAddUser} className="flex gap-4">
                                        <input 
                                            type="email" 
                                            placeholder="E-mail corporativo" 
                                            className="flex-1 bg-white dark:bg-[#0c0d21] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newUserEmail}
                                            onChange={(e) => setNewUserEmail(e.target.value)}
                                            required
                                        />
                                        <input 
                                            type="password" 
                                            placeholder="Senha (Opcional, Padrão: eav@123)" 
                                            className="w-64 bg-white dark:bg-[#0c0d21] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                        />
                                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                                            <Plus size={18} /> Conceder Acesso
                                        </button>
                                    </form>
                                </div>

                                <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-[#15162c] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Usuário</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                            {users.map((u) => (
                                                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                                            {u.email.substring(0,2).toUpperCase()}
                                                        </div>
                                                        {u.email}
                                                        {u.email.toLowerCase() === userEmail?.toLowerCase() && (
                                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">Você</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Admin
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Remover acesso"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'departments' && (
                            <div className="space-y-8">
                                <div className="bg-slate-50 dark:bg-[#15162c] p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Adicionar Setor</h3>
                                    <form onSubmit={handleAddDepartment} className="flex gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="Nome do Setor/Departamento" 
                                            className="flex-1 bg-white dark:bg-[#0c0d21] border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={newDepartmentName}
                                            onChange={(e) => setNewDepartmentName(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                                            <Plus size={18} /> Criar Setor
                                        </button>
                                    </form>
                                </div>

                                <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden grid grid-cols-2 gap-4 p-4">
                                    {departments.sort((a,b) => a.name.localeCompare(b.name)).map((dept) => (
                                        <div key={dept.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-white/5 rounded-xl hover:border-indigo-500/30 transition-colors bg-slate-50/50 dark:bg-white/5">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                <Building2 size={16} className="text-slate-400" />
                                                {dept.name}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {departments.length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-slate-500">Nenhum setor cadastrado.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
