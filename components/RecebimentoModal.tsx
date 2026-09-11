import React, { useState } from 'react';
import { X, Save, Camera, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient, logAuditAction } from '../lib/apiClient';

interface Props {
  device: any | null;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

// Comprime a imagem (celular tira fotos grandes) antes do upload — reduz pra
// no maximo ~1600px e JPEG 0.8, mantendo bem abaixo do limite de 5MB da rota.
const compressImage = (file: File, maxDim = 1600, quality = 0.8): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas indisponivel'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem'))), 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Nao foi possivel ler a imagem'));
    };
    img.src = url;
  });

const uploadPhoto = async (file: File): Promise<string> => {
  const blob = await compressImage(file);
  const formData = new FormData();
  formData.append('file', new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha no upload');
  }
  const data = await res.json();
  return data.url as string;
};

const guessMarca = (model?: string): string => {
  const m = (model || '').toLowerCase();
  if (m.includes('macbook') || m.includes('apple') || m.includes('imac')) return 'Apple';
  if (m.includes('dell')) return 'Dell';
  if (m.includes('lenovo')) return 'Lenovo';
  if (m.includes('hp')) return 'HP';
  return '';
};

const OK_PROB = ['Ok', 'Problemas'];
const CARREGADOR = ['Ok', 'Avariado funcionando', 'Não funciona'];
const CABO = ['Ok', 'Avariado funcionando', 'Não funciona', 'Não entregue'];
const CAPA = ['Em bom estado', 'Avariada', 'Não entregue'];
const RESULTADOS = ['Aprovado', 'Aprovado com avarias estéticas', 'Reprovado - Manutenção Necessária'];

const PHOTOS: { key: string; label: string; required: boolean }[] = [
  { key: 'foto_tampa', label: 'Tampa', required: true },
  { key: 'foto_base', label: 'Base', required: true },
  { key: 'foto_teclado', label: 'Teclado', required: true },
  { key: 'foto_serie', label: 'Nº Série', required: true },
  { key: 'foto_tela', label: 'Tela', required: true },
  { key: 'foto_lateral_dir', label: 'Lateral Direita', required: true },
  { key: 'foto_lateral_esq', label: 'Lateral Esquerda', required: true },
  { key: 'foto_extra1', label: 'Extra 01', required: false },
  { key: 'foto_extra2', label: 'Extra 02', required: false },
];

const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  'w-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-colors';

// Sub-componentes em nivel de modulo (NAO dentro do componente principal),
// senao o React remonta os inputs a cada tecla e o foco se perde.
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400">{title}</h3>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{label}</label>
    {children}
  </div>
);

const Radio: React.FC<{ value: string; options: string[]; danger?: string[]; onChange: (v: string) => void }> = ({
  value,
  options,
  danger = [],
  onChange,
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = value === opt;
      const isDanger = danger.includes(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
            active
              ? isDanger
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-300 dark:border-white/10 hover:border-slate-400'
          }`}
        >
          {opt}
        </button>
      );
    })}
  </div>
);

export function RecebimentoModal({ device, onClose, onSuccess, userEmail }: Props) {
  if (!device) return null;
  const assign = device.currentAssignment;

  const [form, setForm] = useState({
    user_name: assign?.userName || '',
    user_email: assign?.userEmail || '',
    responsavel_email: '',
    serie_turma: assign?.grade || assign?.userDepartment || '',
    data_recebimento: today(),
    data_verificacao: today(),
    marca: guessMarca(device.model),
    modelo: device.model || '',
    serial_number: device.serialNumber || '',
    funcionando: 'Sim',
    teste_carregador: 'Ok',
    teste_cabo: 'Ok',
    teste_rede: 'Ok',
    teste_bluetooth: 'Ok',
    teste_teclado: 'Ok',
    teste_portas: 'Ok',
    estado_capa: 'Em bom estado',
    resultado: 'Aprovado',
    observacoes: '',
  });
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = async (key: string, file: File | undefined) => {
    if (!file) return;
    setError('');
    setUploading(key);
    try {
      const url = await uploadPhoto(file);
      setFotos((prev) => ({ ...prev, [key]: url }));
    } catch (e: any) {
      setError(`Falha ao enviar foto "${PHOTOS.find((p) => p.key === key)?.label}": ${e.message}`);
    } finally {
      setUploading(null);
    }
  };

  const missingPhotos = PHOTOS.filter((p) => p.required && !fotos[p.key]);

  const handleSubmit = async () => {
    setError('');
    if (!form.user_name.trim()) return setError('Preencha o nome do usuário.');
    if (missingPhotos.length > 0) {
      return setError(`Faltam fotos obrigatórias: ${missingPhotos.map((p) => p.label).join(', ')}.`);
    }
    setSaving(true);
    try {
      const record = {
        id: Math.random().toString(36).substring(2, 11),
        device_id: device.id,
        device_tag: device.tag || '',
        ...form,
        ...fotos,
        analista_email: userEmail,
        created_at: new Date().toISOString(),
      };
      const { error: insErr } = await apiClient.from('recebimentos').insert([record]);
      if (insErr) throw insErr;

      logAuditAction(
        userEmail,
        'RECEBIMENTO',
        `Recebimento registrado: ${device.tag} — ${form.resultado}`,
        'DEVICE',
        device.id
      ).catch((e) => console.error('Auditoria (silencioso):', e));

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Erro ao salvar recebimento:', e);
      setError('Erro ao salvar: ' + (e.message || 'verifique a conexão.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl my-auto flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-white/10">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500">Recebimento de Equipamento</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[70vw]">
              {device.model || 'Equipamento'}
            </h2>
            <p className="text-[11px] font-bold text-slate-400 dark:text-white/40">{device.tag}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-7 overflow-y-auto flex-1">
          <Section title="Dados do Usuário">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome do Usuário *">
                <input className={inputCls} value={form.user_name} onChange={(e) => set('user_name', e.target.value)} placeholder="Nome do aluno" />
              </Field>
              <Field label="Série / Turma">
                <input className={inputCls} value={form.serie_turma} onChange={(e) => set('serie_turma', e.target.value)} placeholder="Ex: 8th Grade" />
              </Field>
              <Field label="E-mail">
                <input className={inputCls} value={form.user_email} onChange={(e) => set('user_email', e.target.value)} placeholder="email@escolaamericana.com.br" />
              </Field>
              <Field label="E-mail Responsável">
                <input className={inputCls} value={form.responsavel_email} onChange={(e) => set('responsavel_email', e.target.value)} placeholder="responsavel@..." />
              </Field>
            </div>
          </Section>

          <Section title="Dados do Equipamento">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Marca">
                <input className={inputCls} value={form.marca} onChange={(e) => set('marca', e.target.value)} />
              </Field>
              <Field label="Modelo">
                <input className={inputCls} value={form.modelo} onChange={(e) => set('modelo', e.target.value)} />
              </Field>
              <Field label="Nº de Série">
                <input className={inputCls} value={form.serial_number} onChange={(e) => set('serial_number', e.target.value)} />
              </Field>
              <Field label="Funcionando">
                <Radio value={form.funcionando} options={['Sim', 'Não']} danger={['Não']} onChange={(v) => set('funcionando', v)} />
              </Field>
              <Field label="Data de Recebimento">
                <input type="date" className={inputCls} value={form.data_recebimento} onChange={(e) => set('data_recebimento', e.target.value)} />
              </Field>
              <Field label="Data de Verificação">
                <input type="date" className={inputCls} value={form.data_verificacao} onChange={(e) => set('data_verificacao', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Testes Realizados">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Funcionamento do Carregador"><Radio value={form.teste_carregador} options={CARREGADOR} danger={['Não funciona']} onChange={(v) => set('teste_carregador', v)} /></Field>
              <Field label="Cabo do Carregador"><Radio value={form.teste_cabo} options={CABO} danger={['Não funciona', 'Não entregue']} onChange={(v) => set('teste_cabo', v)} /></Field>
              <Field label="Rede"><Radio value={form.teste_rede} options={OK_PROB} danger={['Problemas']} onChange={(v) => set('teste_rede', v)} /></Field>
              <Field label="Bluetooth"><Radio value={form.teste_bluetooth} options={OK_PROB} danger={['Problemas']} onChange={(v) => set('teste_bluetooth', v)} /></Field>
              <Field label="Teclado"><Radio value={form.teste_teclado} options={OK_PROB} danger={['Problemas']} onChange={(v) => set('teste_teclado', v)} /></Field>
              <Field label="Portas"><Radio value={form.teste_portas} options={OK_PROB} danger={['Problemas']} onChange={(v) => set('teste_portas', v)} /></Field>
              <Field label="Estado Capa Acrílica"><Radio value={form.estado_capa} options={CAPA} danger={['Avariada', 'Não entregue']} onChange={(v) => set('estado_capa', v)} /></Field>
            </div>
          </Section>

          <Section title="Fotos">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PHOTOS.map((p) => (
                <div key={p.key}>
                  <input
                    id={`rec-${p.key}`}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handlePhoto(p.key, e.target.files?.[0])}
                  />
                  <label
                    htmlFor={`rec-${p.key}`}
                    className={`relative block h-24 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1 transition-all ${
                      fotos[p.key]
                        ? 'border-emerald-500/40'
                        : p.required
                          ? 'border-slate-300 dark:border-white/15 hover:border-indigo-500/50'
                          : 'border-slate-200 dark:border-white/10 hover:border-indigo-500/40'
                    }`}
                  >
                    {fotos[p.key] ? (
                      <>
                        <img src={fotos[p.key]} alt={p.label} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <CheckCircle2 size={20} className="text-emerald-400" />
                        </div>
                      </>
                    ) : uploading === p.key ? (
                      <Loader2 size={18} className="text-indigo-500 animate-spin" />
                    ) : (
                      <Camera size={18} className="text-slate-400 dark:text-white/30" />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 relative z-10 text-center px-1">
                      {p.label}
                      {p.required && !fotos[p.key] ? ' *' : ''}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Resultado">
            <Radio value={form.resultado} options={RESULTADOS} danger={['Reprovado - Manutenção Necessária']} onChange={(v) => set('resultado', v)} />
            <Field label="Observações / Parecer Técnico">
              <textarea
                className={`${inputCls} h-20 resize-none`}
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Observações do técnico (opcional)..."
              />
            </Field>
          </Section>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px] font-semibold">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-t border-slate-200 dark:border-white/10">
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase px-4 py-2 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !!uploading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-[13px] shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando...' : 'Registrar Recebimento'}
          </button>
        </div>
      </div>
    </div>
  );
}
