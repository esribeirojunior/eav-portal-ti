import React, { useState, useEffect } from 'react';
import { X, PackageOpen, Loader2 } from 'lucide-react';

interface PrepareDeviceModalProps {
  device: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Modal para transicionar um dispositivo de "Estoque - Lacrado" para "Disponível".
// Preenchimento sugerido no ato de abrir a caixa: serial, modelo, RAM etc.
// Todos os campos são opcionais -- se o usuário quiser só abrir a caixa e
// registrar o serial depois, é possível.
export function PrepareDeviceModal({ device, onClose, onSuccess }: PrepareDeviceModalProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [ramGb, setRamGb] = useState('');
  const [cpuModel, setCpuModel] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [hostname, setHostname] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setSerialNumber('');
      setModel(device.model || '');
      setRamGb('');
      setCpuModel('');
      setOsVersion('');
      setHostname('');
      setConditionNotes('');
    }
  }, [device]);

  if (!device) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/devices/${device.id}/prepare`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          serial_number: serialNumber.trim() || null,
          model: model.trim() || null,
          condition: conditionNotes.trim() || null,
          ram_gb: ramGb ? Number(ramGb) : null,
          cpu_model: cpuModel.trim() || null,
          os_version: osVersion.trim() || null,
          hostname: hostname.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao preparar.');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <PackageOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">
                Preparar {device.tag}
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                Caixa aberta • dispositivo pronto pra entregar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300/80 uppercase tracking-wider">
            Todos os campos abaixo são opcionais. Preencha o que já souber; o
            resto pode ser completado depois pelo agente RMM ou manualmente.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                Serial number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                placeholder="Ex: ABC123XYZ"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                Modelo detalhado
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder='Ex: MacBook Air M3 13"'
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500/50"
                placeholder="Ex: EAV-4KYGJG4"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                RAM (GB)
              </label>
              <input
                type="number"
                min={0}
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="Ex: 16"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                CPU
              </label>
              <input
                type="text"
                value={cpuModel}
                onChange={(e) => setCpuModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="Ex: Apple M3, Intel Ultra 5"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                Sistema
              </label>
              <input
                type="text"
                value={osVersion}
                onChange={(e) => setOsVersion(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                placeholder="Ex: macOS 14.5, Windows 11 Pro"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
              Observações da preparação
            </label>
            <textarea
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
              placeholder="Ex: RustDesk instalado, MDM ativo, capinha protetora aplicada..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-black uppercase tracking-widest transition-all border border-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <PackageOpen size={14} />
                  Marcar como Preparado
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
