import React, { useState, useEffect } from 'react';
import { X, Wrench, Save, CheckCircle2, DollarSign } from 'lucide-react';
import { apiClient, logAuditAction } from '../lib/apiClient';
import { DeviceStatus } from '../types';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: any;
  userEmail: string;
}

export function MaintenanceModal({ isOpen, onClose, onSuccess, device, userEmail }: MaintenanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [cost, setCost] = useState('');
  
  // Se o status for "Manutenção", significa que estamos finalizando.
  const isFinishing = device?.status === DeviceStatus.MAINTENANCE;

  useEffect(() => {
    if (isOpen) {
      setIssueDescription('');
      setResolution('');
      setCost('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isFinishing) {
        // Encontra o log de manutenção aberto (sem end_date)
        const { data: openLog, error: logError } = await apiClient
          .from('maintenance_logs')
          .select('id')
          .eq('device_id', device.id)
          .is('end_date', null)
          .order('start_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (logError) throw logError;

        if (openLog) {
          // Atualiza o log com a resolução, custo e data de término
          const { error: updateError } = await apiClient
            .from('maintenance_logs')
            .update({
              resolution: resolution,
              cost: cost ? parseFloat(cost.replace(',', '.')) : 0,
              end_date: new Date().toISOString()
            })
            .eq('id', openLog.id);

          if (updateError) throw updateError;
        }

        // Volta o dispositivo para Disponível
        const { error: deviceError } = await apiClient
          .from('devices')
          .update({ status: DeviceStatus.AVAILABLE })
          .eq('id', device.id);

        if (deviceError) throw deviceError;

        logAuditAction(userEmail, 'MANUTENÇÃO', `Finalizou manutenção: ${device.tag}`, 'DEVICE', device.id);

      } else {
        // Entrando em Manutenção
        // Se tinha alguém usando, devolve a máquina primeiro
        if (device.currentAssignment) {
          await apiClient
            .from('assignments')
            .update({ returned_at: new Date().toISOString() })
            .eq('id', device.currentAssignment.id);
        }

        // Cria o registro na tabela maintenance_logs
        const { error: insertError } = await apiClient
          .from('maintenance_logs')
          .insert([{
            id: Math.random().toString(36).substring(2, 9),
            device_id: device.id,
            user_email: userEmail,
            issue_description: issueDescription,
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;

        // Atualiza status
        const { error: deviceError } = await apiClient
          .from('devices')
          .update({ status: DeviceStatus.MAINTENANCE })
          .eq('id', device.id);

        if (deviceError) throw deviceError;

        logAuditAction(userEmail, 'MANUTENÇÃO', `Enviou para manutenção: ${device.tag} - Motivo: ${issueDescription}`, 'DEVICE', device.id);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro na manutenção:", error);
      alert("Ocorreu um erro ao processar a manutenção.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isFinishing ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {isFinishing ? <CheckCircle2 size={24} /> : <Wrench size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isFinishing ? 'Finalizar Manutenção' : 'Enviar para Manutenção'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Ativo: <span className="font-bold text-slate-700">{device.tag}</span> • {device.model}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isFinishing ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Defeito Relatado / Motivo
              </label>
              <textarea
                required
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                placeholder="Ex: Tela piscando, bateria viciada, formatação..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[120px] resize-none"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Resolução (O que foi feito)
                </label>
                <textarea
                  required
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="Ex: Trocado o cabo flat, substituído SSD..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[120px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Custo Total (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-white font-bold rounded-xl flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isFinishing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
