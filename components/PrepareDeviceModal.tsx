import React, { useState, useEffect } from 'react';
import { X, PackageOpen, Loader2, Link2, Apple } from 'lucide-react';

interface PrepareDeviceModalProps {
  device: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface UnlinkedMac {
  mosyle_id: string;
  serial_number: string;
  device_name: string;
  model: string;
  os: string;
  existing_device_id: string | null;
  existing_tag: string | null;
  user: { name?: string | null; email?: string | null } | null;
}

// Modal para transicionar um dispositivo de "Estoque - Lacrado" para "Disponível"
// (Notebook, monitor, periferico) ou "Em Uso" (MacBook via Mosyle).
//
// Duas abas quando type == MacBook:
//   - Preparar Manualmente: fluxo padrao (serial digitado a mao)
//   - Vincular ao Mosyle: dropdown com macs do Mosyle sem tag EAV-; consolida
//     o EAV atual com o mac escolhido em uma unica operacao.
export function PrepareDeviceModal({ device, onClose, onSuccess }: PrepareDeviceModalProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [ramGb, setRamGb] = useState('');
  const [cpuModel, setCpuModel] = useState('');
  const [osVersion, setOsVersion] = useState('');
  const [hostname, setHostname] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Estado do fluxo Mosyle
  const [mode, setMode] = useState<'manual' | 'mosyle'>('manual');
  const [unlinkedMacs, setUnlinkedMacs] = useState<UnlinkedMac[] | null>(null);
  const [selectedMosyleId, setSelectedMosyleId] = useState('');
  const [macsError, setMacsError] = useState<string | null>(null);
  const [loadingMacs, setLoadingMacs] = useState(false);

  const isMacBook = device?.type === 'MacBook' || device?.type === 'Macbook';

  useEffect(() => {
    if (device) {
      setSerialNumber('');
      setModel(device.model || '');
      setRamGb('');
      setCpuModel('');
      setOsVersion('');
      setHostname('');
      setConditionNotes('');
      setSelectedMosyleId('');
      setMacsError(null);
      setMode(isMacBook ? 'mosyle' : 'manual');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  // Carrega os macs do Mosyle sem vínculo quando entra no modo mosyle.
  useEffect(() => {
    if (!device || mode !== 'mosyle' || unlinkedMacs !== null) return;
    let cancelled = false;
    setLoadingMacs(true);
    setMacsError(null);
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/mosyle/unlinked-macs', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Falha ao listar macs do Mosyle.');
        if (!cancelled) setUnlinkedMacs(json.items || []);
      } catch (err: any) {
        if (!cancelled) setMacsError(err.message);
      } finally {
        if (!cancelled) setLoadingMacs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [device, mode, unlinkedMacs]);

  if (!device) return null;

  const handleSubmitManual = async (e: React.FormEvent) => {
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

  const handleSubmitMosyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!selectedMosyleId) {
      alert('Selecione um mac do Mosyle antes de vincular.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/devices/${device.id}/link-mosyle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          mosyle_id: selectedMosyleId,
          notes: conditionNotes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao vincular.');
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
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
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

        {/* Tabs — só aparece pra MacBook */}
        {isMacBook && (
          <div className="flex border-b border-white/5 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setMode('mosyle')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                mode === 'mosyle'
                  ? 'text-white bg-white/5 border-b-2 border-emerald-500'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Apple size={14} />
              Vincular ao Mosyle
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? 'text-white bg-white/5 border-b-2 border-emerald-500'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <PackageOpen size={14} />
              Preparar manualmente
            </button>
          </div>
        )}

        {/* Conteúdo */}
        {mode === 'mosyle' && isMacBook ? (
          <form onSubmit={handleSubmitMosyle} className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-300/80 uppercase tracking-wider">
              Escolha o mac fisicamente aberto. O portal vai copiar o serial, modelo e usuário atual do Mosyle. Se já houver um device duplicado com o mesmo serial (sem tag EAV), ele será consolidado automaticamente.
            </div>

            {loadingMacs ? (
              <div className="py-12 flex flex-col items-center gap-3 text-white/40">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-[10px] uppercase tracking-widest">Carregando macs do Mosyle...</p>
              </div>
            ) : macsError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
                {macsError}
              </div>
            ) : (unlinkedMacs && unlinkedMacs.length === 0) ? (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-white/60 text-sm">
                Nenhum mac do Mosyle sem vínculo no momento. Talvez você precise rodar o sync do Mosyle primeiro (Configurações → Mosyle → Sincronizar) ou este mac ainda não foi matriculado no MDM.
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                  Mac do Mosyle
                </label>
                <select
                  value={selectedMosyleId}
                  onChange={(e) => setSelectedMosyleId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="" className="bg-slate-900">— Selecione —</option>
                  {unlinkedMacs?.map((m) => {
                    const user = m.user?.name || m.user?.email || 'sem usuário';
                    return (
                      <option key={m.mosyle_id} value={m.mosyle_id} className="bg-slate-900">
                        {m.device_name || m.serial_number} • SN: {m.serial_number} • {user}
                      </option>
                    );
                  })}
                </select>
                {selectedMosyleId && (() => {
                  const chosen = unlinkedMacs?.find(m => m.mosyle_id === selectedMosyleId);
                  if (!chosen) return null;
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 space-y-1">
                      <div><span className="text-white/40 uppercase tracking-widest text-[9px] mr-2">Modelo:</span>{chosen.model}</div>
                      <div><span className="text-white/40 uppercase tracking-widest text-[9px] mr-2">Serial:</span><span className="font-mono">{chosen.serial_number}</span></div>
                      {chosen.user && (
                        <div><span className="text-white/40 uppercase tracking-widest text-[9px] mr-2">Usuário atual no Mosyle:</span>{chosen.user.name || chosen.user.email}</div>
                      )}
                      {chosen.existing_tag && (
                        <div className="text-amber-300"><span className="text-amber-300/60 uppercase tracking-widest text-[9px] mr-2">Aviso:</span>Já existe device com tag <b>{chosen.existing_tag}</b> — ele será consolidado com {device.tag}.</div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                Observações da vinculação (opcional)
              </label>
              <textarea
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 resize-none"
                placeholder="Ex: entregue ao usuário X em 20/07..."
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
                disabled={loading || !selectedMosyleId}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    Vincular e Ativar
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitManual} className="p-6 space-y-4 overflow-y-auto">
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
        )}
      </div>
    </div>
  );
}
