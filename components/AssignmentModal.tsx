import React, { useState, useEffect, useRef } from 'react';
import { X, User, Building, Save, Laptop, Monitor, Headphones, MousePointer, Keyboard, Settings } from 'lucide-react';
import { apiClient, logAuditAction } from '../lib/apiClient';
import { DeviceType } from '../types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: any;
  userEmail: string;
}

interface UserSuggestion {
  userName: string;
  departmentId: string;
  campus?: string;
  grade?: string;
  activeDevices: {
    model: string;
    type: string;
    tag: string;
  }[];
}

export function AssignmentModal({ isOpen, onClose, onSuccess, device, userEmail }: AssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userRole, setUserRole] = useState('Aluno');
  const [grade, setGrade] = useState(''); // Estado para a turma
  const [campus, setCampus] = useState('Álvares'); // Estado para o campus (Álvares / Aeroporto)
  const [departments, setDepartments] = useState<any[]>([]);

  // Reset form when role changes
  useEffect(() => {
    setUserName('');
    setAssigneeEmail('');
    setDepartmentId('');
    setGrade('');
    setCampus('Álvares');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [userRole]);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const grades = [
    "Pre-K 3", "Pre-K 4", "Kindergarten",
    "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
    "6th Grade", "7th Grade", "8th Grade",
    "9th Grade", "10th Grade", "11th Grade", "12th Grade"
  ];

  // Busca a lista de departamentos ao abrir
  useEffect(() => {
    if (isOpen) {
      // RESET FORM
      setUserName('');
      setAssigneeEmail('');
      setDepartmentId('');
      setUserRole('Aluno');
      setGrade('');
      setCampus('Álvares');
      setSuggestions([]);

      const fetchDepartments = async () => {
        const { data } = await apiClient.from('department').select('*').order('name');
        if (data) setDepartments(data);
      };
      fetchDepartments();
    }
  }, [isOpen]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserSearch = async (query: string) => {
    setUserName(query);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // 1. Busca usuários unicos do histórico de atribuições PELO CARGO
      const { data: assignments } = await apiClient
        .from('assignments')
        .select(`
          user_name,
          department_id,
          grade,
          campus,
          returned_at,
          device:devices (
            model,
            type,
            tag
          )
        `)
        .eq('user_role', userRole) // Filtra pelo cargo selecionado atual
        .ilike('user_name', `%${query}%`)
        .order('assigned_at', { ascending: false });

      if (!assignments) return;

      // 2. Processa os dados para agrupar por usuário e encontrar dispositivos ativos
      const userMap = new Map<string, UserSuggestion>();

      if (assignments) {
        assignments.forEach((assignment: any) => {
          const name = assignment.user_name;

          if (!userMap.has(name)) {
            userMap.set(name, {
              userName: name,
              departmentId: assignment.department_id,
              campus: assignment.campus,
              grade: assignment.grade,
              activeDevices: [],
              email: assignment.user_email || ''
            });
          }

          const userData = userMap.get(name)!;

          // Se ainda não foi devolvido, é um dispositivo ativo
          if (!assignment.returned_at && assignment.device) {
            // Evita duplicatas de dispositivos
            const hasDevice = userData.activeDevices.some((d: any) => d.tag === assignment.device.tag);
            if (!hasDevice) {
              userData.activeDevices.push(assignment.device);
            }
          }
        });
      }

      // 3. Busca também nos devices (Atribuição Rápida)
      const { data: rawDevices } = await apiClient
        .from('devices')
        .select('custom_user, custom_department, model, type, tag')
        .ilike('custom_user', `%${query}%`);

      if (rawDevices) {
        rawDevices.forEach((d: any) => {
          if (!d.custom_user) return;
          const name = d.custom_user;
          if (!userMap.has(name)) {
            userMap.set(name, {
              userName: name,
              departmentId: d.custom_department || '',
              campus: 'Álvares', // Default
              grade: '',
              activeDevices: [],
              email: ''
            });
          }
          const userData = userMap.get(name)!;
          const hasDevice = userData.activeDevices.some((ad: any) => ad.tag === d.tag);
          if (!hasDevice) {
            userData.activeDevices.push(d);
          }
        });
      }

      setSuggestions(Array.from(userMap.values()).slice(0, 5));
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    }
  };

  const selectUser = (user: any) => {
    setUserName(user.userName);
    if (user.email) setAssigneeEmail(user.email);
    setDepartmentId(user.departmentId); // Pre-fill department
    if (user.campus) {
      setCampus(user.campus); // Pre-fill campus
    }
    if (userRole === 'Aluno' && user.grade) {
      setGrade(user.grade); // Pre-fill grade
    }
    setShowSuggestions(false);
  };

  // Auto-fill Department based on Role
  useEffect(() => {
    if (departments.length > 0) {
      if (userRole === 'Aluno') {
        const studentDept = departments.find(d => d.name === 'Discentes');
        if (studentDept) setDepartmentId(studentDept.id);
      } else if (userRole === 'Professor') {
        const teacherDept = departments.find(d => d.name === 'Docentes');
        if (teacherDept) setDepartmentId(teacherDept.id);
      } else if (userRole === 'Colaborador') {
        // Se mudou para colaborador, limpa para forçar escolha (opcional, mas bom pra UX)
        // setDepartmentId(''); 
      }
    }
  }, [userRole, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: assignError } = await apiClient
        .from('assignments')
        .insert([
          {
            device_id: device.id,
            user_name: userName,
            user_email: assigneeEmail,
            department_id: departmentId,
            user_role: userRole,
            grade: userRole === 'Aluno' ? grade : null, // Salva turma apenas se for aluno
            campus: campus, // Salva o campus
            assigned_at: new Date().toISOString()
          }
        ]);

      if (assignError) throw assignError;

      const { error: deviceError } = await apiClient
        .from('devices')
        .update({ status: 'Em Uso' }) // Fixed: Case sensitive match with DeviceStatus.IN_USE
        .eq('id', device.id);

      if (deviceError) throw deviceError;

      // Primeiro, notificamos sucesso e fechamos o modal
      onSuccess();
      onClose();

      // Registro de Auditoria: Empréstimo/Atribuição (Non-blocking)
      logAuditAction(
        userEmail,
        'EMPRÉSTIMO',
        `Equipamento ${device.tag} atribuído a ${userName} (${userRole})`,
        'DEVICE',
        device.id
      ).catch(err => console.error("Erro silencioso na auditoria:", err));

    } catch (error: any) {
      console.error('Erro ao entregar:', error);
      alert('Erro ao salvar: ' + (error.message || 'Verifique a conexão.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">

        <div className="bg-gradient-to-r from-blue-900/50 to-slate-900 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-blue-400 tracking-wider uppercase mb-1">Entregar Equipamento</h2>
            <h3 className="text-lg font-bold text-white truncate w-64">{device?.model || 'Equipamento'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
            <span className="text-sm text-slate-400">Patrimônio</span>
            <span className="font-mono text-white font-bold">{device?.tag}</span>
          </div>

          {/* Seletor de Cargo (MOVIDO PARA O TOPO) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo / Tipo de Usuário</label>
            <div className="grid grid-cols-3 gap-2">
              {['Aluno', 'Professor', 'Colaborador'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRole(role)}
                  className={`py-3 px-1 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border transition-all ${userRole === role
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50 scale-[1.02]'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {userRole === 'Aluno' && 'Nome do Aluno'}
              {userRole === 'Professor' && 'Nome do Professor'}
              {userRole === 'Colaborador' && 'Nome do Responsável'}
            </label>
            <div className="relative group">
              <input
                type="text"
                value={userName}
                onChange={(e) => handleUserSearch(e.target.value)}
                onFocus={() => userName.length >= 2 && setShowSuggestions(true)}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                placeholder={`Digite o nome do ${userRole.toLowerCase()}...`}
                required
                autoComplete="off"
              />
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />

              {/* Dropdown de Sugestões */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
                  {suggestions.map((user, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectUser(user)}
                      className="w-full p-3 text-left hover:bg-slate-700/50 flex flex-col gap-1 border-b border-slate-700/50 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-white text-sm">{user.userName}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded-md">
                          {departments.find(d => d.id === user.departmentId)?.name || 'N/A'}
                        </span>
                      </div>

                      {user.activeDevices.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.activeDevices.map((dev, i) => (
                            <span key={i} className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/10">
                              {dev.type === DeviceType.NOTEBOOK || dev.type === DeviceType.MACBOOK || dev.type === DeviceType.CHROMEBOOK ? <Laptop size={10} /> :
                                dev.type === DeviceType.HEADSET ? <Headphones size={10} /> :
                                  dev.type === DeviceType.MOUSE ? <MousePointer size={10} /> :
                                    dev.type === DeviceType.KEYBOARD ? <Keyboard size={10} /> :
                                      <Monitor size={10} />}
                              {dev.model}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">Nenhum equipamento em posse</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 animate-in fade-in duration-300">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail Corporativo</label>
            <div className="relative group">
              <input
                type="email"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                placeholder={`Email do ${userRole.toLowerCase()}...`}
                required
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
          </div>

          {/* Departamento apenas para Colaborador */}
          {userRole === 'Colaborador' && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento / Setor</label>
              <div className="relative group">
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  required={userRole === 'Colaborador'}
                >
                  <option value="">Selecione...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <Building size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
          )}

          {/* Seleção de Campus (Para todos os cargos) */}
          <div className="space-y-2 animate-in fade-in duration-300">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus</label>
            <div className="relative group">
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                required
              >
                <option value="Álvares" className="bg-slate-800 text-white">Álvares</option>
                <option value="Aeroporto" className="bg-slate-800 text-white">Aeroporto</option>
                <option value="Álvares / Aeroporto" className="bg-slate-800 text-white">Álvares / Aeroporto</option>
              </select>
              <Building size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
          </div>

          {/* Seleção de Turma (Apenas para Alunos) */}
          {userRole === 'Aluno' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Turma / Série</label>
              <div className="relative group">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  required={userRole === 'Aluno'}
                >
                  <option value="">Selecione a Turma...</option>
                  {grades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <Building size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button type="button" onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-white uppercase px-4 py-2 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Confirmar Entrega'}
              {!loading && <Save size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}