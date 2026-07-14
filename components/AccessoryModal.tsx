import React, { useState, useEffect, useRef } from 'react';
import { X, User, Building, Save, Laptop, Monitor, Headphones, MousePointer, Keyboard, Settings, Cable, History, Calendar, Search, Trash2 } from 'lucide-react';
import { apiClient, logAuditAction } from '../lib/apiClient';
import { DeviceType } from '../types';

interface AccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

interface UserSuggestion {
  userName: string;
  departmentId: string;
  activeDevices: {
    model: string;
    type: string;
    tag: string;
  }[];
}

export function AccessoryModal({ isOpen, onClose, onSuccess, userEmail }: AccessoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userRole, setUserRole] = useState('Aluno');
  const [grade, setGrade] = useState('');
  const [campus, setCampus] = useState('Álvares');
  const [accessoryName, setAccessoryName] = useState('Cabo Tipo C 3.0');
  const [customAccessory, setCustomAccessory] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  // Tabs and History states
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLightMode, setIsLightMode] = useState(() => document.body.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.body.classList.contains('light'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const tabStyle = (tab: 'form' | 'history') => {
    const isActive = activeTab === tab;
    if (isLightMode) {
      return {
        color: isActive ? '#0f2d70' : '#64748b',
        borderBottom: isActive ? '3px solid #0f2d70' : 'none',
        fontWeight: isActive ? 800 : 600,
        fontSize: '12px',
        opacity: isActive ? 1 : 0.7
      };
    } else {
      return {
        color: isActive ? '#10b981' : '#cbd5e1',
        borderBottom: isActive ? '3px solid #10b981' : 'none',
        fontWeight: isActive ? 900 : 700,
        fontSize: '12px',
        opacity: isActive ? 1 : 0.9
      };
    }
  };

  const wrapperStyle = {
    backgroundColor: isLightMode ? '#f8fafc' : 'rgba(2, 6, 23, 0.4)',
    borderBottom: isLightMode ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.05)'
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data: devices } = await apiClient.from('devices').select('*');
      const { data: assignments } = await apiClient.from('assignments').select('*');
      
      if (devices && assignments) {
        const accessoryDevIds = new Set(
          devices
            .filter(d => (d.serial_number || '').startsWith('ACESSÓRIO') || (d.serialNumber || '').startsWith('ACESSÓRIO'))
            .map(d => d.id)
        );
        
        const mapped = assignments
          .filter(a => accessoryDevIds.has(a.device_id))
          .map(a => {
            const dev = devices.find(d => d.id === a.device_id);
            return {
              ...a,
              model: dev ? dev.model : 'Acessório',
              tag: dev ? dev.tag : ''
            };
          })
          .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime());
          
        setHistory(mapped);
      }
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, activeTab]);

  const handleDeleteAccessory = async (item: any) => {
    if (!window.confirm(`Tem certeza que deseja APAGAR do histórico o registro de "${item.model}" entregue a ${item.user_name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      setLoading(true);
      // Apaga o assignment
      const { error: assignError } = await apiClient
        .from('assignments')
        .delete()
        .eq('id', item.id);
      if (assignError) throw assignError;

      // Apaga o device virtual (acessório)
      const { error: deviceError } = await apiClient
        .from('devices')
        .delete()
        .eq('id', item.device_id);
      if (deviceError) throw deviceError;

      fetchHistory();
      onSuccess();
    } catch (err) {
      console.error("Erro ao apagar registro:", err);
      alert('Erro ao apagar registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAccessory = async (item: any) => {
    if (!window.confirm(`Confirmar devolução do acessório "${item.model}" entregue a ${item.user_name}?`)) {
      return;
    }
    try {
      setLoading(true);
      
      // 1. Registrar devolução no histórico
      const { error: assignError } = await apiClient
        .from('assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', item.id);
        
      if (assignError) throw assignError;
      
      // 2. Atualizar status do dispositivo virtual
      const { error: deviceError } = await apiClient
        .from('devices')
        .update({ status: 'Disponível' })
        .eq('id', item.device_id);
        
      if (deviceError) throw deviceError;
      
      alert('Devolução registrada com sucesso!');
      fetchHistory();
      onSuccess();
    } catch (err) {
      console.error("Erro ao devolver acessório:", err);
      alert('Erro ao registrar devolução.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (modelName: string) => {
    const name = (modelName || '').toLowerCase();
    if (name.includes('cabo') || name.includes('adaptador') || name.includes('hdmi')) return <Cable size={14} />;
    if (name.includes('mouse')) return <MousePointer size={14} />;
    if (name.includes('teclado')) return <Keyboard size={14} />;
    if (name.includes('headset') || name.includes('fone')) return <Headphones size={14} />;
    return <Settings size={14} />;
  };

  const filteredHistory = history.filter(item => 
    (item.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.model || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const accessoryOptions = [
    "Cabo Tipo C 3.0",
    "Mouse Sem Fio",
    "Mouse USB com Fio",
    "Adaptador HDMI para USB-C",
    "Headset Padrão",
    "Teclado USB",
    "Carregador Notebook 65W",
    "Outro"
  ];

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

  // Busca a lista de departamentos ao abrir
  useEffect(() => {
    if (isOpen) {
      setUserName('');
      setAssigneeEmail('');
      setDepartmentId('');
      setUserRole('Aluno');
      setGrade('');
      setCampus('Álvares');
      setAccessoryName('Cabo Tipo C 3.0');
      setCustomAccessory('');
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
      const { data: assignments } = await apiClient
        .from('assignments')
        .select(`
          user_name,
          user_email,
          department_id,
          returned_at,
          device:devices (
            model,
            type,
            tag
          )
        `)
        .eq('user_role', userRole)
        .ilike('user_name', `%${query}%`)
        .order('assigned_at', { ascending: false });

      if (!assignments) return;

      const userMap = new Map<string, UserSuggestion>();

      assignments.forEach((assignment: any) => {
        const name = assignment.user_name;

        if (!userMap.has(name)) {
          userMap.set(name, {
            userName: name,
            departmentId: assignment.department_id,
            activeDevices: [],
            email: assignment.user_email || ''
          });
        }

        const userData = userMap.get(name)!;

        if (!assignment.returned_at && assignment.device) {
          const hasDevice = userData.activeDevices.some(d => d.tag === assignment.device.tag);
          if (!hasDevice) {
            userData.activeDevices.push(assignment.device);
          }
        }
      });

      setSuggestions(Array.from(userMap.values()).slice(0, 5));
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    }
  };

  const selectUser = (user: any) => {
    setUserName(user.userName);
    if (user.email) setAssigneeEmail(user.email);
    setDepartmentId(user.departmentId);
    setShowSuggestions(false);
  };

  // Auto-fill Department based on Role
  useEffect(() => {
    if (departments.length > 0) {
      if (userRole === 'Aluno') {
        const studentDept = departments.find(d => d.name.toLowerCase().includes('discente') || d.name.toLowerCase().includes('aluno'));
        if (studentDept) setDepartmentId(studentDept.id);
      } else if (userRole === 'Professor') {
        const teacherDept = departments.find(d => d.name.toLowerCase().includes('docente') || d.name.toLowerCase().includes('professor'));
        if (teacherDept) setDepartmentId(teacherDept.id);
      }
    }
  }, [userRole, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalModel = accessoryName === 'Outro' ? customAccessory : accessoryName;
      if (!finalModel) {
        alert('Por favor, informe a descrição do acessório.');
        setLoading(false);
        return;
      }

      // Map accessory to device type
      let mappedType = DeviceType.ADAPTER;
      const lowerName = finalModel.toLowerCase();
      if (lowerName.includes('mouse')) mappedType = DeviceType.MOUSE;
      else if (lowerName.includes('teclado')) mappedType = DeviceType.KEYBOARD;
      else if (lowerName.includes('headset') || lowerName.includes('fone')) mappedType = DeviceType.HEADSET;
      else if (lowerName.includes('notebook') || lowerName.includes('computador')) mappedType = DeviceType.NOTEBOOK;

      // 1. Create virtual device
      const deviceId = Math.random().toString(36).substring(2, 9);
      const accRandomNum = Math.floor(1000 + Math.random() * 9000);
      const tag = `EAV-ACC-${accRandomNum}`;

      const { error: deviceError } = await apiClient
        .from('devices')
        .insert([{
          id: deviceId,
          tag,
          serial_number: `ACESSÓRIO-${deviceId}`,
          model: finalModel,
          type: mappedType,
          status: 'Em Uso',
          condition: 'Bom'
        }]);

      if (deviceError) throw deviceError;

      // 2. Create assignment
      const { error: assignError } = await apiClient
        .from('assignments')
        .insert([
          {
            device_id: deviceId,
            user_name: userName,
            user_email: assigneeEmail,
            department_id: departmentId,
            user_role: userRole,
            grade: userRole === 'Aluno' ? grade : null,
            campus: campus,
            assigned_at: new Date().toISOString()
          }
        ]);

      if (assignError) throw assignError;

      onSuccess();
      onClose();

      logAuditAction(
        userEmail,
        'EMPRÉSTIMO',
        `Acessório/Periférico ${finalModel} (${tag}) entregue a ${userName} (${userRole})`,
        'DEVICE',
        deviceId
      ).catch(err => console.error("Erro silencioso na auditoria:", err));

    } catch (error: any) {
      console.error('Erro ao entregar acessório:', error);
      alert('Erro ao salvar: ' + (error.message || 'Verifique a conexão.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">

        <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-black text-emerald-300 tracking-[0.2em] uppercase mb-1">Entrega Rápida</h2>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Periféricos e Acessórios</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1" style={wrapperStyle}>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            style={tabStyle('form')}
            className="flex-1 py-3 uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <Cable size={16} />
            Nova Entrega
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchHistory();
            }}
            style={tabStyle('history')}
            className="flex-1 py-3 uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <History size={16} />
            Histórico
          </button>
        </div>

        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

            {/* Seleção do Acessório */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acessório / Periférico</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="relative group">
                  <select
                    value={accessoryName}
                    onChange={(e) => setAccessoryName(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  >
                    {accessoryOptions.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>
                    ))}
                  </select>
                  <Cable size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>

                {accessoryName === 'Outro' && (
                  <input
                    type="text"
                    required
                    value={customAccessory}
                    onChange={(e) => setCustomAccessory(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm font-bold"
                    placeholder="Descreva o acessório (Ex: Cabo HDMI 2m)..."
                  />
                )}
              </div>
            </div>

            {/* Seletor de Cargo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recebido por (Cargo)</label>
              <div className="grid grid-cols-3 gap-2">
                {['Aluno', 'Professor', 'Colaborador'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setUserRole(role)}
                    className={`py-3 px-1 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border transition-all ${userRole === role
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/50 scale-[1.02]'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome do Responsável (Autocomplete) */}
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

                {/* Suggestions dropdown */}
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

            {/* Departamento visível para todos os cargos */}
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento / Setor</label>
              <div className="relative group">
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id} className="bg-slate-800 text-white">{dept.name}</option>
                  ))}
                </select>
                <Building size={16} className="absolute left-3.5 top-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            {/* Seleção de Campus */}
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
                    <option value="" className="bg-slate-800 text-white">Selecione a Turma...</option>
                    {grades.map(g => (
                      <option key={g} value={g} className="bg-slate-800 text-white">{g}</option>
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
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entregando...' : 'Entregar Acessório'}
                {!loading && <Save size={18} />}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 flex flex-col flex-1 overflow-y-auto space-y-4 min-h-[350px]">
            {/* Search Bar */}
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por responsável ou acessório..."
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
              />
              <Search size={14} className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            </div>

            {historyLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">Carregando histórico...</span>
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl space-y-3 text-left relative group/card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-white">{item.user_name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {item.user_role} {item.grade && `• ${item.grade}`}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        item.returned_at 
                          ? 'bg-slate-700 text-slate-300 border border-slate-600' 
                          : 'bg-emerald-500 text-white border border-emerald-400'
                      }`}>
                        {item.returned_at ? 'Devolvido' : 'Em Uso'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                        {getIcon(item.model)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase">{item.model}</p>
                        <p className="text-[8px] text-slate-500 font-bold tracking-widest mt-0.5">{item.tag}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300 font-bold">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-400" />
                        <span>{new Date(item.assigned_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 uppercase tracking-wider">{item.campus}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccessory(item)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all border border-rose-500/20 hover:border-rose-500 active:scale-90"
                          title="Apagar do histórico"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {!item.returned_at && (
                      <button
                        type="button"
                        onClick={() => handleReturnAccessory(item)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-900/30 active:scale-95 text-center mt-2"
                      >
                        Registrar Devolução
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500">
                <p className="text-xs font-black uppercase tracking-widest">Nenhuma entrega encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
