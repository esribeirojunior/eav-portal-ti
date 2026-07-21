import React, { useState } from 'react';
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

interface BulkDeleteBarProps {
  selectedIds: string[];
  selectedDevices: any[]; // usado só pra amostrar tags/status na confirmação
  onCancel: () => void;
  onDeleted: () => void; // sucesso: pai deve recarregar lista e limpar seleção
}

// Barra fixa no rodapé que aparece quando ha selecao. Botao vermelho abre
// modal de confirmacao com aviso irreversivel.
export function BulkDeleteBar({ selectedIds, selectedDevices, onCancel, onDeleted }: BulkDeleteBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (selectedIds.length === 0) return null;

  const inUseCount = selectedDevices.filter(d => d.status === 'Em Uso').length;
  const lacradoCount = selectedDevices.filter(d => d.status === 'Estoque - Lacrado').length;

  const handleConfirmDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/devices/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao excluir.');
      setConfirmOpen(false);
      onDeleted();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Barra fixa no rodape */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-white/10 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-black">
            {selectedIds.length}
          </div>
          <span className="text-white text-xs font-black uppercase tracking-widest">
            {selectedIds.length === 1 ? 'dispositivo selecionado' : 'dispositivos selecionados'}
          </span>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <button
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
        >
          <X size={13} />
          Cancelar
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5"
        >
          <Trash2 size={13} />
          Excluir
        </button>
      </div>

      {/* Modal de confirmacao */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">
                  Confirmar exclusão
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest mt-0.5">
                  Ação irreversível
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 dark:text-white/80">
                Você está prestes a excluir <b className="text-rose-600 dark:text-rose-400">{selectedIds.length} dispositivo{selectedIds.length !== 1 ? 's' : ''}</b> permanentemente.
              </p>

              {(inUseCount > 0 || lacradoCount > 0) && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                  <p className="font-black uppercase tracking-widest text-[10px] text-amber-700 dark:text-amber-300">Atenção</p>
                  {inUseCount > 0 && (
                    <p>• {inUseCount} está{inUseCount !== 1 ? 'ão' : ''} <b>Em Uso</b> — o vínculo com o usuário atual será removido junto.</p>
                  )}
                  {lacradoCount > 0 && (
                    <p>• {lacradoCount} está{lacradoCount !== 1 ? 'ão' : ''} em <b>Estoque - Lacrado</b> — a tag EAV-XXXX correspondente <b>não</b> será reaproveitada.</p>
                  )}
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p>Vai apagar também:</p>
                <ul className="pl-4 space-y-0.5 list-disc marker:text-rose-500">
                  <li>Todos os assignments (entregas) desses dispositivos</li>
                  <li>Todos os logs de manutenção</li>
                </ul>
                <p className="pt-1">Esta ação <b>não pode</b> ser desfeita.</p>
              </div>

              <div className="max-h-32 overflow-y-auto rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3">
                <p className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">
                  Tags que serão excluídas ({Math.min(selectedDevices.length, 30)}{selectedDevices.length > 30 ? ` de ${selectedDevices.length}` : ''}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDevices.slice(0, 30).map(d => (
                    <span key={d.id} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-white/10 text-slate-700 dark:text-white/70 border border-slate-200 dark:border-white/10">
                      {d.tag}
                    </span>
                  ))}
                  {selectedDevices.length > 30 && (
                    <span className="px-2 py-0.5 text-[10px] text-slate-500 dark:text-white/50">
                      + {selectedDevices.length - 30}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 text-xs font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Sim, excluir {selectedIds.length}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
