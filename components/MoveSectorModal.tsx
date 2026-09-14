import React, { useEffect, useState } from 'react';
import { X, Building, Save, Loader2 } from 'lucide-react';
import { apiClient, logAuditAction } from '../lib/apiClient';

interface Props {
  device: any | null;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

// Define o setor manual (custom_department) de um device. Esse campo tem
// prioridade no agrupamento por setor e NAO e tocado pelo sync do Mosyle.
export function MoveSectorModal({ device, onClose, onSuccess, userEmail }: Props) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!device) return;
    setValue(device.custom_department || device.currentAssignment?.userDepartment || '');
    apiClient
      .from('department')
      .select('*')
      .order('name')
      .then(({ data }: any) => {
        if (data) setDepartments(data);
      });
  }, [device]);

  if (!device) return null;

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await apiClient.from('devices').update({ custom_department: value || null }).eq('id', device.id);
      if (error) throw error;
      logAuditAction(userEmail, 'SETOR', `Definiu setor de ${device.tag}: ${value || 'Sem setor'}`, 'DEVICE', device.id).catch(() => {});
      onSuccess();
      onClose();
    } catch (e: any) {
      alert('Erro ao mover de setor: ' + (e.message || 'verifique a conexão.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500">Mover para Setor</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[70vw]">{device.model}</h2>
            <p className="text-[11px] font-bold text-slate-400 dark:text-white/40">{device.tag}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Setor / Departamento</label>
          <div className="relative">
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl pl-3 pr-10 py-3 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">— Sem setor / limpar —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <Building size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-white/40">
            Define o setor manualmente. Prioriza no agrupamento e <strong>não é apagado</strong> pelo sync do Mosyle.
          </p>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-white/10">
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-[13px] transition-all disabled:opacity-50 active:scale-95"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
