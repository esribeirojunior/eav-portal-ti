import React, { useState, useEffect } from 'react';
import { X, Monitor, Laptop, Tablet, Smartphone, Box, Save, ScanLine, Tag, Camera, Loader2, Sparkles, Headphones, MousePointer, Keyboard, Settings, ChevronRight, Cpu, Tv } from 'lucide-react';
import { supabase, logAuditAction } from '../lib/supabase';
import { analyzeDeviceLabel } from '../lib/gemini';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

export function DeviceModal({ isOpen, onClose, onSuccess, userEmail }: DeviceModalProps) {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [tag, setTag] = useState('');
  const [serial, setSerial] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Notebook');
  const [customType, setCustomType] = useState('');
  const [suggestedModels, setSuggestedModels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchModels = async () => {
        try {
          const { data } = await supabase.from('devices').select('model');
          if (data) {
            const uniqueModels = Array.from(new Set((data as any[]).map(d => d.model).filter(Boolean))) as string[];
            setSuggestedModels(uniqueModels);
          }
        } catch (error) {
          console.error('Erro ao buscar sugestões de modelos:', error);
        }
      };
      fetchModels();
    }
  }, [isOpen]);

  const sanitizeInput = (val: string) => val.replace(/[^a-zA-Z0-9\s\-_.,()/áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, '').slice(0, 30);

  const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const rawValue = typeof e === 'string' ? e : e.target.value;
    const cleanValue = sanitizeInput(rawValue);
    setSerial(cleanValue);
    if (cleanValue) {
      setTag(`EAV-${cleanValue.toUpperCase()}`.slice(0, 30));
    } else {
      setTag('');
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setOcrLoading(false);
  };

  const analyzeWithIA = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setOcrLoading(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.videoWidth === 0) return;

      const sw = video.videoWidth * 0.8;
      const sh = video.videoHeight * 0.4;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;

      canvas.width = sw;
      canvas.height = sh;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const result = await analyzeDeviceLabel(imageData);
      if (result.serial) {
        const cleanSerial = result.serial.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        setSerial(cleanSerial);
        handleSerialChange(cleanSerial);
      }
      if (result.modelo) setModel(result.modelo);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      stopCamera();
    } catch (err: any) {
      console.error("Erro na análise da IA:", err);
      alert(err.message || "Erro ao analisar imagem.");
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) stopCamera();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    console.log('🚀 Iniciando cadastro:', tag);
    setLoading(true);
    let operationFinished = false;

    // Timeout de segurança: 12 segundos
    const timeoutId = setTimeout(() => {
      if (!operationFinished) {
        console.error('❌ TIMEOUT: O Supabase não respondeu a tempo.');
        setLoading(false);
        alert('O servidor está demorando muito para responder. Isso pode ser um problema de conexão ou o relógio do seu computador está desregulado. Tente sincronizar o horário do Windows e atualizar a página.');
      }
    }, 12000);

    try {
      console.log('📡 Enviando para o banco...');
      const { data: insertData, error } = await supabase.from('devices').insert([{
        tag,
        serial_number: serial,
        model,
        type: type === 'Outro' ? customType : type,
        status: 'Disponível',
        condition: 'Bom'
      }]).select();

      operationFinished = true;
      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Erro Supabase:', error);
        throw error;
      }

      console.log('✅ Sucesso! Fechando modal.');
      setTag(''); setSerial(''); setModel(''); setType('Notebook'); setCustomType('');
      onSuccess();
      onClose();

      if (insertData && insertData[0]) {
        logAuditAction(
          userEmail,
          'ADICIONAR',
          `Novo ativo cadastrado: ${tag} (${model})`,
          'DEVICE',
          insertData[0].id
        ).catch(err => console.error("Erro log:", err));
      }

    } catch (error: any) {
      operationFinished = true;
      clearTimeout(timeoutId);
      console.error('❌ Falha geral:', error);
      alert('Erro ao salvar: ' + (error.message || 'Verifique a conexão.'));
    } finally {
      setLoading(false);
    }
  };

  const deviceTypes = [
    { label: 'Notebook', icon: <Laptop size={16} /> },
    { label: 'MacBook', icon: <Laptop size={16} /> },
    { label: 'Monitor', icon: <Monitor size={16} /> },
    { label: 'Mini PC', icon: <Cpu size={16} /> },
    { label: 'TV Corporativa', icon: <Tv size={16} /> },
    { label: 'Headset', icon: <Headphones size={16} /> },
    { label: 'Mouse', icon: <MousePointer size={16} /> },
    { label: 'Teclado', icon: <Keyboard size={16} /> },
    { label: 'Kit Teclado/mouse', icon: <div className="flex gap-0.5"><Keyboard size={12} /><MousePointer size={12} /></div> },
    { label: 'Adaptador', icon: <Settings size={16} /> },
    { label: 'Outro', icon: <Box size={16} /> }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-white">
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="relative z-10 w-72 h-32 border-2 border-indigo-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <ScanLine className="text-indigo-500/50 w-full h-full p-4 animate-pulse" />
            </div>
            <div className="absolute top-24 left-0 right-0 text-center pointer-events-none z-20 px-6">
              <h3 className="text-white font-bold text-xl drop-shadow-md uppercase tracking-wider">Identificação por IA</h3>
              <p className="text-indigo-300 text-sm mt-2 font-medium">Posicione a etiqueta no quadro</p>
            </div>
          </div>
          <div className="p-8 bg-slate-900 flex justify-center items-center gap-6 pb-12">
            <button onClick={stopCamera} className="bg-slate-700 hover:bg-slate-600 rounded-2xl py-4 px-8 font-bold uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all text-white">
              <X size={20} /> Fechar
            </button>
            <button onClick={analyzeWithIA} disabled={ocrLoading} className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl py-4 px-10 font-bold uppercase tracking-widest flex items-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95 transition-all disabled:opacity-50 text-white">
              {ocrLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              {ocrLoading ? 'Analisando...' : 'Analisar com IA'}
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-400 dark:border-white/10 shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 dark:bg-gradient-to-r dark:from-blue-900/40 dark:to-slate-900 p-8 border-b border-slate-400 dark:border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-bold text-indigo-600 dark:text-blue-400 tracking-widest uppercase mb-1">Inventário TI</h2>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Ativo</h3>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-200/50 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl transition-all text-slate-700 hover:text-slate-900 dark:text-white/40 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400/60 uppercase tracking-[0.3em] flex items-center gap-2">
                <ScanLine size={12} />
                Nº de Série (Identificador Principal)
              </label>
              <div className="relative group flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={serial}
                    onChange={handleSerialChange}
                    maxLength={30}
                    minLength={3}
                    pattern="^[a-zA-Z0-9\s\-_.(),/áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$"
                    title="Apenas letras, números e caracteres básicos são permitidos."
                    className="w-full h-16 bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-400 dark:border-white/10 rounded-2xl px-6 pl-14 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase text-base font-black tracking-wider placeholder:text-slate-600 dark:placeholder:text-white/20 shadow-sm dark:shadow-none"
                    placeholder="DIGITE OU ESCANEIE O SERIAL..."
                    required
                  />
                  <ScanLine size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-white/20 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="h-16 px-5 sm:px-6 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 rounded-2xl flex items-center justify-center gap-2.5 transition-all text-white shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 group/cam whitespace-nowrap"
                >
                  <Camera size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Escanear</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} />
                Nº de Patrimônio
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(sanitizeInput(e.target.value))}
                  maxLength={30}
                  minLength={3}
                  pattern="^[a-zA-Z0-9\s\-_.(),/áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$"
                  title="Apenas letras, números e caracteres básicos são permitidos."
                  className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-400 dark:border-white/10 rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-base font-bold placeholder:text-slate-600 dark:placeholder:text-white/20 shadow-sm dark:shadow-none"
                  placeholder="EAV-..."
                  required
                />
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 dark:text-white/10 group-focus-within:text-indigo-500 transition-colors" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest">Modelo / Especificação</label>
            <input type="text" list="model-suggestions" value={model} onChange={(e) => setModel(sanitizeInput(e.target.value))} maxLength={30} minLength={2} pattern="^[a-zA-Z0-9\s\-_.(),/áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$" title="Apenas letras, números e caracteres básicos são permitidos." className="w-full bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-400 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold placeholder:text-slate-600 dark:placeholder:text-white/20 shadow-sm dark:shadow-none" placeholder="Ex: Dell Latitude..." required />
            <datalist id="model-suggestions">{suggestedModels.map((s, i) => <option key={i} value={s} />)}</datalist>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {deviceTypes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setType(item.label)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all ${type === item.label
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-400 dark:border-white/5 text-slate-700 dark:text-white/40 hover:border-indigo-200 hover:text-indigo-600 dark:hover:border-white/20 dark:hover:text-white'
                    }`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  {item.label === 'Outro' && type === 'Outro' ? (
                    <input autoFocus type="text" placeholder="Digite a categoria..." value={customType} onChange={(e) => setCustomType(sanitizeInput(e.target.value))} maxLength={15} pattern="^[a-zA-Z0-9\s\-_.(),/áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$" title="Apenas letras, números e caracteres básicos são permitidos." className="w-full bg-white/20 text-white rounded px-2 py-1.5 text-[10px] font-black outline-none placeholder:text-white/60 focus:ring-2 focus:ring-white/50 transition-all" onClick={(e) => e.stopPropagation()} />
                  ) : <span className="flex-1 text-left leading-tight break-words">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-700 hover:text-slate-900 dark:text-white/20 dark:hover:text-white uppercase tracking-[0.2em] px-4 py-2 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all shadow-xl shadow-indigo-600/20 dark:shadow-indigo-900/40 active:scale-95 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Cadastrar'}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}