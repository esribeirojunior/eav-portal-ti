import React from 'react';
import { Device } from '../types';
import { X, User, Clock, ArrowRight, Camera, ClipboardCheck, CheckCircle2, Printer, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onDelete?: (assignmentId: string) => void;
}

export const HistoryModal: React.FC<Props> = ({ isOpen, device, onClose, onDelete }) => {
  if (!isOpen || !device) return null;

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1c1d3a] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] w-full max-w-3xl overflow-hidden border border-white/10 animate-fade-in my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-[#0a0b2e] text-white flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1 text-left">Histórico</span>
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white text-left">{device.tag} — {device.model}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all text-white/40 hover:text-white">
            <X size={22} className="sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-6 sm:space-y-8 flex-1">
          {device.currentAssignment && (
            <div className="animate-fade-in space-y-3">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 px-1 text-left flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Custódia Direta
              </h4>
              
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center gap-4">
                <div className="bg-emerald-500/10 w-10 h-10 rounded-xl text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <User size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 text-left">Responsável</p>
                  <p className="text-sm sm:text-base font-black text-white uppercase text-left truncate">{device.currentAssignment.userName}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-xs font-semibold text-white/50 uppercase truncate">{device.currentAssignment.userDepartment}</p>
                    {device.currentAssignment.campus && (
                      <span className="text-[10px] sm:text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                        {device.currentAssignment.campus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400/80 px-1">
                <Clock size={14} />
                <span>Atribuído em: {formatDate(device.currentAssignment.startDate)}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 px-1 text-left">Timeline Retroativa</h4>
            
            <div className="space-y-4">
              {device.history.length > 0 ? device.history.map((entry) => (
                <div key={entry.id} className="bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 hover:border-white/10 transition-all group">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                      <div className="bg-indigo-500/10 w-9 h-9 rounded-lg text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <User size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 text-left">Antigo Responsável</p>
                        <p className="text-sm sm:text-base font-black text-white uppercase text-left truncate">{entry.userName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-xs font-semibold text-white/50 uppercase truncate">{entry.userDepartment}</p>
                          {entry.campus && (
                            <span className="text-[10px] sm:text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                              {entry.campus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                      <span className="text-xs font-bold text-indigo-400/80 uppercase tracking-widest flex items-center gap-1.5 border border-indigo-500/10 px-2.5 py-1 rounded-lg bg-indigo-500/5">
                        <Clock size={12} /> {formatDate(entry.startDate)}
                      </span>
                      {entry.endDate && (
                        <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/10 px-2.5 py-1 rounded-lg bg-emerald-500/5">
                          <ArrowRight size={12} /> {formatDate(entry.endDate)}
                        </span>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir este registro de histórico permanentemente?')) {
                              onDelete(entry.id);
                            }
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg transition-all"
                          title="Excluir Registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {entry.inspection && (
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardCheck size={16} /> Inspeção Técnica
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">{formatDate(entry.inspection.date)}</span>
                          <button
                            onClick={() => {
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>Laudo Técnico - ${device.tag}</title>
                                      <style>
                                        body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                                        h1 { color: #1c1d3a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                                        pre { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
                                        .meta { color: #666; margin-bottom: 20px; }
                                      </style>
                                    </head>
                                    <body>
                                      <h1>Relatório de Inspeção Técnica</h1>
                                      <div class="meta">
                                        <p><strong>Equipamento:</strong> ${device.model} (${device.tag})</p>
                                        <p><strong>Data:</strong> ${formatDate(entry.inspection!.date)}</p>
                                        <p><strong>Analista:</strong> ${entry.userName}</p>
                                      </div>
                                      <pre>${entry.inspection!.report}</pre>
                                      <script>window.print();</script>
                                    </body>
                                  </html>
                                `);
                                newWindow.document.close();
                              }
                            }}
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all"
                            title="Imprimir Laudo"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Object.entries(entry.inspection.checklist).map(([key, value]) => (
                          <div key={key} className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-widest ${value ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-400 bg-rose-500/5'}`}>
                            <CheckCircle2 size={12} />
                            {key === 'screen' ? 'Tela' : key === 'keyboard' ? 'Teclado' : key === 'battery' ? 'Bateria' : key === 'body' ? 'Carcaça' : 'Carregador'}
                          </div>
                        ))}
                      </div>

                      {entry.inspection.report && (
                        <div className="space-y-1 text-left">
                          <p className="text-xs font-bold text-white/30 uppercase tracking-wider">Laudo Técnico</p>
                          <p className="text-xs sm:text-sm font-medium text-white/80 leading-relaxed italic">"{entry.inspection.report}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {entry.returnPhoto && (
                    <div className="space-y-2 text-left">
                      <p className="text-xs font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera size={16} /> Estado na Devolução
                      </p>
                      <div className="rounded-2xl overflow-hidden border border-white/10 max-w-xs aspect-video bg-black/40 shadow-lg">
                        <img
                          src={entry.returnPhoto}
                          alt="Evidência"
                          className="w-full h-full object-cover opacity-80"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/20">Nenhuma movimentação prévia</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0a0b2e] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10 font-bold rounded-xl transition-all uppercase text-xs sm:text-sm tracking-wider active:scale-95"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};