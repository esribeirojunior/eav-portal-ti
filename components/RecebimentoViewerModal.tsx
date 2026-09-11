import React, { useEffect, useState } from 'react';
import { X, Printer, Loader2, CheckCircle2, AlertTriangle, ChevronLeft, Send } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface Props {
  device: any | null;
  onClose: () => void;
}

const TEST_FIELDS: { key: string; label: string }[] = [
  { key: 'funcionando', label: 'Funcionando' },
  { key: 'teste_carregador', label: 'Carregador' },
  { key: 'teste_cabo', label: 'Cabo do Carregador' },
  { key: 'teste_rede', label: 'Rede' },
  { key: 'teste_bluetooth', label: 'Bluetooth' },
  { key: 'teste_teclado', label: 'Teclado' },
  { key: 'teste_portas', label: 'Portas' },
  { key: 'estado_capa', label: 'Capa Acrílica' },
];

const PHOTO_FIELDS: { key: string; label: string }[] = [
  { key: 'foto_tampa', label: 'Tampa' },
  { key: 'foto_base', label: 'Base' },
  { key: 'foto_teclado', label: 'Teclado' },
  { key: 'foto_serie', label: 'Nº Série' },
  { key: 'foto_tela', label: 'Tela' },
  { key: 'foto_lateral_dir', label: 'Lateral Direita' },
  { key: 'foto_lateral_esq', label: 'Lateral Esquerda' },
  { key: 'foto_extra1', label: 'Extra 01' },
  { key: 'foto_extra2', label: 'Extra 02' },
];

const isOkValue = (v: string) => /^(ok|sim|em bom estado)$/i.test((v || '').trim());
const fmtDate = (d?: string) => {
  if (!d) return '—';
  try {
    return new Date(d.length <= 10 ? d + 'T00:00:00' : d).toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
};

const resultBadge = (r: string) => {
  const reprovado = /reprovado/i.test(r || '');
  const avarias = /avarias/i.test(r || '');
  const color = reprovado ? 'rose' : avarias ? 'amber' : 'emerald';
  return { color, reprovado };
};

function buildLaudoHtml(rec: any): string {
  const esc = (s: any) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
  const testsRows = TEST_FIELDS.map(
    (t) => `<tr><td>${t.label}</td><td class="${isOkValue(rec[t.key]) ? 'ok' : 'bad'}">${esc(rec[t.key] || '—')}</td></tr>`
  ).join('');
  const photos = PHOTO_FIELDS.filter((p) => rec[p.key])
    .map((p) => `<figure><img src="${esc(rec[p.key])}"/><figcaption>${p.label}</figcaption></figure>`)
    .join('');
  const rb = resultBadge(rec.resultado);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Laudo de Recebimento — ${esc(rec.device_tag)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1e293b; margin: 40px; }
  header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #4f46e5; padding-bottom:16px; margin-bottom:24px; }
  header h1 { font-size:20px; margin:0; letter-spacing:-0.5px; }
  header .sub { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:2px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:2px; color:#4f46e5; margin:24px 0 10px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; font-size:13px; }
  .grid div span { color:#64748b; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  td { border-bottom:1px solid #e2e8f0; padding:7px 4px; }
  td:first-child { color:#475569; }
  td.ok { color:#059669; font-weight:700; }
  td.bad { color:#dc2626; font-weight:700; }
  .result { display:inline-block; padding:8px 16px; border-radius:8px; font-weight:800; text-transform:uppercase; font-size:13px;
            background:${rb.color === 'rose' ? '#fee2e2' : rb.color === 'amber' ? '#fef3c7' : '#d1fae5'};
            color:${rb.color === 'rose' ? '#dc2626' : rb.color === 'amber' ? '#b45309' : '#059669'}; }
  .photos { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:8px; }
  figure { margin:0; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; }
  figure img { width:100%; height:150px; object-fit:cover; display:block; }
  figcaption { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#64748b; padding:5px; text-align:center; }
  .sign { margin-top:48px; display:flex; justify-content:space-between; gap:48px; }
  .sign div { flex:1; text-align:center; border-top:1px solid #94a3b8; padding-top:6px; font-size:11px; color:#64748b; }
  @media print { body { margin:12mm; } }
</style></head><body>
<header>
  <div><h1>Recebimento de Equipamento</h1><div class="sub">Escola Americana de Vitória — TI</div></div>
  <div class="result">${esc(rec.resultado || '—')}</div>
</header>
<h2>Dados do Usuário</h2>
<div class="grid">
  <div><span>Nome:</span> ${esc(rec.user_name)}</div>
  <div><span>Série/Turma:</span> ${esc(rec.serie_turma || '—')}</div>
  <div><span>E-mail:</span> ${esc(rec.user_email || '—')}</div>
  <div><span>E-mail Responsável:</span> ${esc(rec.responsavel_email || '—')}</div>
</div>
<h2>Dados do Equipamento</h2>
<div class="grid">
  <div><span>Marca:</span> ${esc(rec.marca || '—')}</div>
  <div><span>Modelo:</span> ${esc(rec.modelo || '—')}</div>
  <div><span>Nº Série:</span> ${esc(rec.serial_number || '—')}</div>
  <div><span>Patrimônio:</span> ${esc(rec.device_tag || '—')}</div>
  <div><span>Data Recebimento:</span> ${fmtDate(rec.data_recebimento)}</div>
  <div><span>Data Verificação:</span> ${fmtDate(rec.data_verificacao)}</div>
</div>
<h2>Testes Realizados</h2>
<table>${testsRows}</table>
${rec.observacoes ? `<h2>Observações</h2><p style="font-size:13px;">${esc(rec.observacoes)}</p>` : ''}
${photos ? `<h2>Registro Fotográfico</h2><div class="photos">${photos}</div>` : ''}
<div class="sign"><div>Analista (${esc(rec.analista_email || '')})</div><div>Usuário / Responsável</div></div>
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); };</script>
</body></html>`;
}

export function RecebimentoViewerModal({ device, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [smtpOn, setSmtpOn] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch('/api/recebimento/status', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setSmtpOn(!!d.configured))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!device) return;
    let alive = true;
    setLoading(true);
    setSelected(null);
    (async () => {
      const { data } = await apiClient.from('recebimentos').select('*').eq('device_id', device.id);
      if (!alive) return;
      const rows = (data || []).sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''));
      setList(rows);
      if (rows.length === 1) setSelected(rows[0]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [device]);

  if (!device) return null;

  const printLaudo = (rec: any) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Permita pop-ups para gerar o laudo.');
      return;
    }
    w.document.write(buildLaudoHtml(rec));
    w.document.close();
  };

  // Envio MANUAL e pontual: mostra o destinatario e pede confirmacao. Nunca automatico.
  const sendEmail = async (rec: any) => {
    const dests = [rec.responsavel_email, rec.user_email].filter((e) => e && String(e).includes('@'));
    if (dests.length === 0) {
      setEmailMsg({ ok: false, text: 'Este recebimento não tem e-mail de responsável/aluno preenchido.' });
      return;
    }
    if (!window.confirm(`Enviar a confirmação deste recebimento para:\n\n${dests.join('\n')}\n\nConfirmar envio?`)) return;
    setSending(true);
    setEmailMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/recebimento/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: rec.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no envio.');
      setEmailMsg({ ok: true, text: `E-mail enviado para: ${(data.to || dests).join(', ')}` });
    } catch (e: any) {
      setEmailMsg({ ok: false, text: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl my-auto flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            {selected && list.length > 1 && (
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500">Recebimentos</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[60vw]">{device.model}</h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/40">{device.tag}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" size={28} /></div>
          ) : list.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-white/30 text-sm font-bold uppercase tracking-widest">
              Nenhum recebimento registrado para este equipamento.
            </div>
          ) : !selected ? (
            /* LISTA */
            <div className="space-y-3">
              {list.map((rec) => {
                const rb = resultBadge(rec.resultado);
                return (
                  <button
                    key={rec.id}
                    onClick={() => setSelected(rec)}
                    className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 bg-slate-50 dark:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {rb.reprovado ? <AlertTriangle className="text-rose-500 flex-shrink-0" size={18} /> : <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate">{rec.resultado}</p>
                        <p className="text-[11px] text-slate-400 dark:text-white/40">{fmtDate(rec.data_verificacao || rec.created_at)} · {rec.user_name}</p>
                      </div>
                    </div>
                    <ChevronLeft size={16} className="rotate-180 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            /* DETALHE */
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {(() => {
                  const rb = resultBadge(selected.resultado);
                  const cls = rb.color === 'rose' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : rb.color === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
                  return <span className={`px-3 py-1.5 rounded-lg text-[12px] font-black uppercase ${cls}`}>{selected.resultado}</span>;
                })()}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => sendEmail(selected)}
                    disabled={sending}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
                    title="Envia a confirmação SÓ para o responsável/aluno deste recebimento"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Enviar e-mail
                  </button>
                  <button onClick={() => printLaudo(selected)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95">
                    <Printer size={15} /> Imprimir laudo
                  </button>
                </div>
              </div>

              {emailMsg && (
                <div className={`p-3 rounded-xl text-[12px] font-semibold border ${emailMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                  {emailMsg.text}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12px]">
                {[
                  ['Usuário', selected.user_name],
                  ['Série/Turma', selected.serie_turma],
                  ['E-mail', selected.user_email],
                  ['Responsável', selected.responsavel_email],
                  ['Nº Série', selected.serial_number],
                  ['Recebimento', fmtDate(selected.data_recebimento)],
                  ['Verificação', fmtDate(selected.data_verificacao)],
                  ['Analista', selected.analista_email],
                ].map(([label, val]) => (
                  <div key={label as string} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{label}</p>
                    <p className="font-semibold text-slate-800 dark:text-white truncate">{(val as string) || '—'}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Testes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEST_FIELDS.map((t) => (
                    <div key={t.key} className={`rounded-lg p-2.5 border text-center ${isOkValue(selected[t.key]) ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{t.label}</p>
                      <p className={`text-[11px] font-bold ${isOkValue(selected[t.key]) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{selected[t.key] || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.observacoes && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Observações</h3>
                  <p className="text-[13px] text-slate-700 dark:text-white/70 bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-slate-200 dark:border-white/10">{selected.observacoes}</p>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Fotos</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {PHOTO_FIELDS.filter((p) => selected[p.key]).map((p) => (
                    <a key={p.key} href={selected[p.key]} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group">
                      <img src={selected[p.key]} alt={p.label} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 text-center py-1">{p.label}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
