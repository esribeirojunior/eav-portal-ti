import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Edit2, 
  Mail, 
  Building2, 
  AlertCircle,
  Save,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface EmployeeProfile {
  user_name: string;
  user_email: string;
  department_id: string;
  campus: string;
  hasMissingData: boolean;
  assignment_count: number;
}

export const EmployeesModule: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { data: deptData } = await supabase.from('department').select('*').order('name');
      if (deptData) setDepartments(deptData);
      
      await fetchEmployees();
    };
    loadData();
  }, []);

  const getDepartmentName = (id: string) => {
    const dept = departments.find(d => String(d.id) === String(id));
    return dept ? dept.name : id;
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Fetch all assignments to aggregate users
      const { data, error } = await supabase
        .from('assignments')
        .select('user_name, user_email, department_id, campus');

      if (error) throw error;

      // Group by user_name
      const userMap = new Map<string, EmployeeProfile>();
      
      data?.forEach((assignment) => {
        if (!assignment.user_name) return; // skip empty names
        
        const name = assignment.user_name.trim();
        const email = assignment.user_email || '';
        const dept = assignment.department_id || '';
        
        if (userMap.has(name)) {
          const existing = userMap.get(name)!;
          existing.assignment_count++;
          // If we found a missing email in a previous record, try to fill it from a newer one
          if (!existing.user_email && email) existing.user_email = email;
          if (!existing.department_id && dept) existing.department_id = dept;
          existing.hasMissingData = !existing.user_email || !existing.department_id;
        } else {
          userMap.set(name, {
            user_name: name,
            user_email: email,
            department_id: dept,
            campus: assignment.campus || '',
            hasMissingData: !email || !dept,
            assignment_count: 1
          });
        }
      });

      // Convert map to array and sort by name
      const employeeList = Array.from(userMap.values()).sort((a, b) => 
        a.user_name.localeCompare(b.user_name)
      );

      setEmployees(employeeList);
    } catch (err) {
      console.error("Erro ao carregar colaboradores:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      // Update ALL assignments that match this user_name
      const { error } = await supabase
        .from('assignments')
        .update({
          user_email: editEmail,
          department_id: editDepartment
        })
        .eq('user_name', editingEmployee.user_name);

      if (error) throw error;

      setSuccessMsg('Perfil atualizado com sucesso em todo o histórico!');
      
      // Update local state
      setEmployees(prev => prev.map(emp => {
        if (emp.user_name === editingEmployee.user_name) {
          return {
            ...emp,
            user_email: editEmail,
            department_id: editDepartment,
            hasMissingData: !editEmail || !editDepartment
          };
        }
        return emp;
      }));

      setTimeout(() => {
        setSuccessMsg('');
        setEditingEmployee(null);
      }, 2000);

    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.user_name.toLowerCase().includes(search.toLowerCase()) || 
    emp.user_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-6 animate-fade-in ${isEmbedded ? '' : 'pb-12'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 shadow-sm p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Colaboradores</h2>
            <p className="text-slate-600 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {employees.length} Perfis Encontrados
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="BUSCAR COLABORADOR..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum colaborador encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Nome do Usuário</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">E-mail</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Setor</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 text-center">Status</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, idx) => (
                  <tr key={idx} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                        {emp.user_name}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {emp.user_email ? (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{emp.user_email}</span>
                      ) : (
                        <span className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">Sem E-mail</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {emp.department_id ? (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{getDepartmentName(emp.department_id)}</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">Sem Setor</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {emp.hasMissingData ? (
                        <div className="inline-flex items-center gap-1 text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <AlertCircle size={12} />
                          Pendente
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 size={12} />
                          Completo
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setEditEmail(emp.user_email);
                          setEditDepartment(emp.department_id);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors"
                        title="Editar Perfil"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingEmployee(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-300 dark:border-white/10">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
                  Editar Perfil
                </h3>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {successMsg ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{successMsg}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Nome do Usuário (Fixo)</label>
                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <Users size={16} className="text-slate-500" />
                      {editingEmployee.user_name}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">E-mail Profissional</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Ex: joao.silva@escolaamericana.com.br"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-500">Setor / Departamento</label>
                    <div className="relative">
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none"
                      >
                        <option value="" className="dark:bg-slate-800">Selecione o Setor...</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id} className="dark:bg-slate-800">{dept.name}</option>
                        ))}
                      </select>
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    <button
                      onClick={() => setEditingEmployee(null)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors uppercase text-xs tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors uppercase text-xs tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          <Save size={16} />
                          Salvar Perfil
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesModule;
