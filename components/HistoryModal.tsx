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
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400/80 px-1">
                  <Clock size={14} />
                  <span>Atribuído em: {formatDate(device.currentAssignment.startDate)}</span>
                </div>
                
                <button
                  onClick={() => {
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Termo de Responsabilidade - ${device.tag}</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 40px; color: #000; line-height: 1.5; max-width: 800px; margin: 0 auto; }
                              .header { text-align: center; margin-bottom: 20px; border-top: 10px solid #E5DFD3; position: relative; }
                              .header::before { content: ""; position: absolute; top: -10px; left: 0; width: 30%; height: 10px; background: #E1CA93; }
                              .header::after { content: ""; position: absolute; top: -10px; right: 0; width: 30%; height: 10px; background: #6F6C85; }
                              .header img { max-width: 250px; margin-top: 20px; }
                              h2 { text-align: center; text-decoration: underline; font-size: 16px; margin-top: 30px; margin-bottom: 30px; }
                              .content { font-size: 14px; text-align: justify; }
                              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                              table, th, td { border: 1px solid black; }
                              th, td { padding: 8px; text-align: left; font-weight: bold; }
                              th { text-align: center; }
                              @media print {
                                body { padding: 20px; }
                                button { display: none; }
                              }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <img src="${window.location.origin}/logo.png" alt="Escola Americana de Vitória" onerror="this.style.display='none'" />
                            </div>
                            <h2>TERMO DE ENTREGA E RESPONSABILIDADE</h2>
                            
                            <div class="content">
                              <p><b>EMPREGADO(A):</b> <span style="border-bottom: 1px solid black; display: inline-block; min-width: 400px; padding: 0 5px;">${device.currentAssignment?.userName || ''}</span>,<br>
                              portador(a) do CPF n° <span style="border-bottom: 1px solid black; display: inline-block; min-width: 250px;"></span>,<br>
                              cargo de <span style="border-bottom: 1px solid black; display: inline-block; min-width: 350px; padding: 0 5px;">${device.currentAssignment?.userRole === 'Colaborador' ? (device.currentAssignment?.userDepartment || '') : ''}</span>.</p>
                              
                              <p><b>EMPREGADORA:</b> <b>ESCOLA AMERICANA DE VITÓRIA S.A.</b>, inscrita no CNPJ sob o n° 27.710.038.0001/04, sediada à Avenida Marechal Mascarenhas de Moraes, n° 2.100, Anexo Ginásio, Bento Ferreira, Vitória – ES, CEP 29.050-625</p>

                              <p>A <b>EMPREGADORA</b> realiza a entrega do(s) seguinte(s) item(ns):</p>

                              <table>
                                <tr>
                                  <th>DESCRIÇÃO</th>
                                  <th>QUANTIDADE</th>
                                </tr>
                                <tr>
                                  <td>Equipamento: ${device.type || ''} ${device.model || ''}</td>
                                  <td rowspan="4" style="text-align: center; vertical-align: middle;">1</td>
                                </tr>
                                <tr>
                                  <td>Serial: ${device.serialNumber || 'N/A'}</td>
                                </tr>
                                <tr>
                                  <td>Patrimônio: ${device.tag || ''}</td>
                                </tr>
                                <tr>
                                  <td>Estado atual do equipamento: (  ) Novo ( X ) Usado</td>
                                </tr>
                              </table>

                              <p>Fica o(a) <b>EMPREGADO(A)</b> ciente de que:</p>

                              <p>1) O(s) equipamento(s) recebido(s), nesta data, é(são) de propriedade da <b>EMPREGADORA</b>, sendo que o(a) <b>EMPREGADO(A)</b> possui somente a detenção para uso exclusivo durante o exercício das atividades laborais;</p>

                              <p>2) O(A) <b>EMPREGADO(A)</b> será responsável pela guarda e adequada utilização e conservação do(s) equipamento(s), bem como pela orientação do(a)s aluno(a)s quanto à forma de utilização e conservação;</p>

                              <p>3) É terminantemente proibido o uso do(s) equipamento(s) para quaisquer fins não vinculados ao exercício das atividades educacionais;</p>

                              <p>4) O(A) <b>EMPREGADO(A)</b> deverá comunicar, imediatamente, à <b>EMPREGADORA</b> qualquer ocorrência de qualquer dano ao equipamento ou capa protetora causados por si ou terceiros;</p>

                              <p>5) Na hipótese de rescisão contratual, o(a) <b>EMPREGADO(A)</b> deverá devolver o(s) equipamento(s) na data da comunicação;</p>

                              <p>6) A <b>EMPREGADORA</b> emitirá relatório fotográfico do estado do(s) equipamento(s) no momento da entrega, bem como quando da sua devolução;</p>

                              <p>7) Ressalvado o desgaste natural do uso, em sendo constatadas quaisquer avarias no(s) equipamento(s), seja a título de dolo ou culpa, ficará o(a) <b>EMPREGADO(A)</b> obrigado(a) a indenizar a <b>EMPREGADORA</b> relativamente ao valor do conserto ou substituição, autorizando-se, desde já, o desconto respectivo em folha de pagamento ou rescisão de contrato de trabalho, nos termos do artigo 462, §1º da CLT.</p>

                              <p>8) O presente termo integra as normas regimentais da <b>EMPREGADORA</b> e obriga o integral cumprimento e obediência pelo(a) <b>EMPREGADO(A)</b>, sendo parte integrante do contrato de trabalho para todos os fins.</p>
                              
                              <p style="margin-top: 50px; text-align: right;">Vitória/ES, ${new Date(device.currentAssignment?.startDate || new Date()).toLocaleDateString('pt-BR')}</p>

                              <div style="text-align: center; margin-top: 80px;">
                                  <div style="border-top: 1px solid black; width: 350px; margin: 0 auto;"></div>
                                  <p style="margin-top: 5px;"><b>${device.currentAssignment?.userName || ''}</b><br>Empregado(a)</p>
                              </div>
                            </div>
                            <script>setTimeout(() => window.print(), 500);</script>
                          </body>
                        </html>
                    `;
                    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-emerald-500/20"
                >
                  <Printer size={16} />
                  Imprimir Termo
                </button>
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