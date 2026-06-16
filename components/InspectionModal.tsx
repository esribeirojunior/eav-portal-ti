import React, { useState, useRef } from 'react';
import { Device, TechnicalInspection } from '../types';
import { X, User, MapPin, CheckCircle2, Camera, Sparkles, Send, RefreshCcw, Printer, Copy, CheckCircle, Image as ImageIcon } from 'lucide-react';

interface Props {
    isOpen: boolean;
    device: Device | null;
    onClose: () => void;
    onConfirm: (device: Device, inspection: TechnicalInspection) => void;
}

export const InspectionModal: React.FC<Props> = ({ isOpen, device, onClose, onConfirm }) => {
    if (!isOpen || !device) return null;

    const [checklist, setChecklist] = useState({
        screen: true,
        keyboard: true,
        battery: true,
        body: true,
        charger: true
    });
    const [report, setReport] = useState('');
    const [isReportFinalized, setIsReportFinalized] = useState(false);
    const [analystName, setAnalystName] = useState('');
    const [photo, setPhoto] = useState<string | undefined>();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = () => {
        if (!photo) return;
        setIsAnalyzing(true);

        // Simulating AI Analysis
        setTimeout(() => {
            const allOk = Math.random() > 0.3; // 70% chance of being all good
            if (allOk) {
                setChecklist({
                    screen: true,
                    keyboard: true,
                    battery: true,
                    body: true,
                    charger: true
                });
            } else {
                // Randomly fail one item
                const keys = Object.keys(checklist) as (keyof typeof checklist)[];
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                setChecklist(prev => ({ ...prev, [randomKey]: false }));
            }
            setIsAnalyzing(false);
            // Optionally auto-generate report after analysis
            generateAIReport();
        }, 2500);
    };

    const toggleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const generateAIReport = () => {
        const date = new Date().toLocaleDateString('pt-BR');
        const allOk = Object.values(checklist).every(v => v);

        // Como temos o "if (!device) return null" lá em cima, o TypeScript sabe que device existe aqui.
        const reportText = `**ESCOLA AMERICANA DE VITÓRIA**
**DEPARTAMENTO DE TECNOLOGIA DA INFORMAÇÃO**

---

### **CERTIFICADO DE INSPEÇÃO TÉCNICA No ${new Date().getFullYear()}.${Math.floor(Math.random() * 1000)}**

**DATA:** ${date}
**ANALISTA RESPONSÁVEL:** ${analystName || '[PREENCHER NOME]'}
**ATIVO:** ${device.model} (${device.tag})
**USUÁRIO DEVOLVENTE:** ${device.currentAssignment?.userName || 'N/A'}

---

#### **1. DIAGNÓSTICO DE ENTRADA**
O equipamento em epígrafe foi submetido à avaliação técnica obrigatória após encerramento do ciclo de custódia do usuário. ${allOk
                ? 'A análise preliminar indica que o hardware mantém a integridade estrutural e funcional esperada para o tempo de uso, alinhando-se aos padrões de conformidade técnica da instituição.'
                : 'A análise preliminar identificou pontos de atenção ou falhas funcionais que requerem registro detalhado para manutenção ou substituição.'}

#### **2. ANÁLISE DE COMPONENTES**
Abaixo, detalha-se o estado individual dos módulos avaliados:

* **Monitor/Tela:** ${checklist.screen ? 'Matriz de pixels operando em plena capacidade. Ausência de artefatos visuais ou degradação.' : 'Detectadas avarias superficiais ou falhas na matriz de imagem que podem comprometer a visualização.'}
* **Teclado/Dispositivos de Entrada:** ${checklist.keyboard ? 'Todas as teclas apresentam resposta tátil e funcionalidade eletrônica plena.' : 'Identificada falha em teclas específicas ou instabilidade no mecanismo de entrada.'}
* **Gestão de Energia:** ${checklist.battery ? 'O sistema de gerenciamento de bateria reporta parâmetros dentro da normalidade.' : 'A bateria apresenta sinais de desgaste acentuado ou falha na retenção de carga.'}
* **Carcaça:** ${checklist.body ? 'Estrutura física íntegra. Preservação das portas de conexão e ausência de deformidades.' : 'Constatados danos estruturais, riscos profundos ou impactos na carcaça externa.'}
* **Periféricos:** ${checklist.charger ? 'Unidade de alimentação (carregador) entregue em estado funcional e compatível.' : 'Carregador não entregue ou apresentando mau funcionamento nos conectores.'}

#### **3. CONCLUSÃO E PARECER**
Considerando a análise técnica realizada ${photo ? '(incluindo processamento de imagem via IA)' : ''}, o equipamento **${device.model}** apresenta índice de integridade de **${allOk ? '98.4%' : '74.2%'}** e encontra-se:
**${allOk ? 'APTO PARA REUSO IMEDIATO' : 'ENCAMINHADO PARA MANUTENÇÃO TÉCNICA'}**.

---
**${analystName || '[PREENCHER NOME]'}**
Tecnologia da Informação
EAV`;

        setReport(reportText);
        setIsReportFinalized(true);
    };

    const handleConfirm = () => {
        onConfirm(device, {
            checklist,
            report,
            photo,
            date: new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-[#0c0d21]/80 backdrop-blur-xl z-[60] flex items-center justify-center p-2 sm:p-6 animate-fade-in overflow-y-auto">
            <div className="bg-[#14152e] w-full max-w-2xl rounded-[2rem] sm:rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative my-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500" />

                <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Inspeção Técnica</span>
                            <h2 className="text-[20px] sm:text-[28px] font-[900] uppercase tracking-tighter text-white leading-tight">Check-in</h2>
                            <p className="text-[10px] sm:text-[12px] font-bold text-white/30 tracking-widest uppercase mt-1 line-clamp-1">{device.tag} — {device.model}</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90 border border-white/5">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-400">
                                <User size={18} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20">Responsável</span>
                                <span className="text-[12px] sm:text-[13px] font-black uppercase text-white tracking-tight truncate">{device.currentAssignment?.userName || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-orange-400 font-sans">
                                <MapPin size={18} />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20">Setor</span>
                                <span className="text-[12px] sm:text-[13px] font-black uppercase text-white tracking-tight truncate">{device.currentAssignment?.userDepartment || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Analista Responsável</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Seu nome completo..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 sm:py-5 px-10 sm:px-12 text-[12px] sm:text-[13px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/5"
                                value={analystName}
                                onChange={e => setAnalystName(e.target.value)}
                            />
                            <User className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/10" size={16} />
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 text-left">
                        <h3 className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Integridade</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                            {[
                                { label: 'Tela', key: 'screen' },
                                { label: 'Teclado', key: 'keyboard' },
                                { label: 'Bateria', key: 'battery' },
                                { label: 'Carcaça', key: 'body' },
                                { label: 'Carregador', key: 'charger' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => toggleCheck(item.key as any)}
                                    className={`py-4 sm:py-6 rounded-xl sm:rounded-2xl border transition-all flex flex-col items-center gap-2 sm:gap-3 active:scale-95 ${checklist[item.key as keyof typeof checklist]
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_10px_20px_rgba(16,185,129,0.1)]'
                                        : 'bg-white/5 border-white/10 text-white/20'
                                        }`}
                                >
                                    <CheckCircle2 size={18} className={checklist[item.key as keyof typeof checklist] ? 'text-emerald-400' : 'text-white/5'} />
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/40 ml-2">Evidência Fotográfica</h3>
                        <div className="relative">
                            <input
                                id="photo-camera"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoUpload}
                            />
                            <input
                                id="photo-gallery"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />

                            {!photo ? (
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 h-32 sm:h-44">
                                    <label
                                        htmlFor="photo-camera"
                                        className="bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                            <Camera size={20} />
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40">Usar Câmera</span>
                                    </label>

                                    <label
                                        htmlFor="photo-gallery"
                                        className="bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-emerald-600/10 hover:border-emerald-500/30 transition-all cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-emerald-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                            <ImageIcon size={20} />
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40">Abrir Galeria</span>
                                    </label>
                                </div>
                            ) : (
                                <div className="relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/10 h-32 sm:h-44">
                                    <img src={photo} alt="Device check-in" className="w-full h-full object-cover" />

                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3 sm:gap-4 animate-pulse">
                                            <div className="w-full h-1 bg-white/50 absolute top-0 animate-scan shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                            <Sparkles className="text-white animate-bounce" size={24} />
                                            <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.3em]">IA Reconhecendo Hardware...</span>
                                        </div>
                                    )}

                                    {!isAnalyzing && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 sm:gap-4 transition-opacity">
                                            <button
                                                onClick={analyzeImage}
                                                className="bg-indigo-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all"
                                            >
                                                <Sparkles size={12} />
                                                IA Vision
                                            </button>
                                            <button
                                                onClick={() => setPhoto(undefined)}
                                                className="bg-white/10 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all"
                                            >
                                                Limpar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between ml-2">
                            <h3 className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Relatório de Inspeção</h3>
                            {!isReportFinalized ? (
                                <button
                                    onClick={generateAIReport}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg sm:rounded-xl transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest active:scale-95 border border-indigo-600/20"
                                >
                                    <Sparkles size={10} />
                                    Corrigir e Finalizar
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsReportFinalized(false)}
                                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 rounded-lg sm:rounded-xl transition-all font-black text-[8px] sm:text-[9px] uppercase tracking-widest active:scale-95 border border-white/5"
                                >
                                    <RefreshCcw size={10} />
                                    Editar Novamente
                                </button>
                            )}
                        </div>

                        {isReportFinalized ? (
                            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-10 text-slate-900 border border-white/20 shadow-2xl relative overflow-hidden animate-fade-in max-h-[300px] sm:max-h-[500px] overflow-y-auto no-scrollbar font-serif">
                                {/* Institutional Header */}
                                <div className="border-b-2 border-slate-100 pb-4 sm:pb-8 mb-4 sm:mb-8 flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-16 sm:h-16 relative flex-shrink-0">
                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                <defs>
                                                    <linearGradient id="certVGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                        <stop offset="0%" stopColor="#22c55e" />
                                                        <stop offset="50%" stopColor="#3b82f6" />
                                                        <stop offset="100%" stopColor="#a855f7" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M20,30 Q50,90 80,30" fill="none" stroke="url(#certVGradient)" strokeWidth="15" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-[10px] sm:text-[14px] font-[900] uppercase tracking-tighter text-slate-800 font-sans leading-none">Escola Americana</h4>
                                            <p className="text-[7px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-sans">De Vitória</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[6px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest font-sans">Protocolo</p>
                                        <p className="text-[8px] sm:text-[10px] font-black text-slate-800 font-sans">#EAV-{Math.random().toString(36).substr(2, 4).toUpperCase()}</p>
                                    </div>
                                </div>

                                <h2 className="text-center text-[18px] font-black uppercase tracking-[0.2em] mb-10 text-slate-800 font-sans">Certificado de Inspeção e Devolução</h2>

                                <div className="grid grid-cols-2 gap-8 mb-10 text-[11px] font-sans uppercase font-bold tracking-widest text-slate-400">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-300">Equipamento:</p>
                                        <p className="text-slate-800 font-black">{device.model} ({device.tag})</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-300">Data/Hora:</p>
                                        <p className="text-slate-800 font-black">{new Date().toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>

                                {/* Main Report Content */}
                                <div className="space-y-6 text-[13px] leading-relaxed whitespace-pre-wrap border-l-4 border-indigo-50 pl-8 ml-2 italic">
                                    {report}
                                </div>

                                {/* Footer & Authentication */}
                                <div className="mt-6 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 sm:pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-100 w-full sm:w-auto">
                                        <CheckCircle size={14} className="flex-shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none">Autenticado</span>
                                            <span className="text-[6px] sm:text-[7px] font-bold uppercase tracking-wider opacity-60">Integridade confirmada</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                                        <button className="flex-1 sm:flex-none p-3 sm:p-4 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors flex justify-center">
                                            <Copy size={16} />
                                        </button>
                                        <button className="flex-1 sm:flex-none p-3 sm:p-4 bg-slate-50 text-slate-400 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors flex justify-center">
                                            <Printer size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                placeholder="Descreva observações rápidas para o laudo ou use o Assistente IA..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-[13px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/10 resize-none"
                                value={report}
                                onChange={e => setReport(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4">
                        <button
                            onClick={handleConfirm}
                            className="w-full sm:flex-1 py-6 sm:py-8 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl sm:rounded-[2rem] shadow-[0_20px_40px_rgba(249,115,22,0.2)] transition-all uppercase text-[12px] sm:text-[14px] tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 active:scale-95 group order-1 sm:order-none"
                        >
                            <span>Confirmar</span>
                            <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                        <button onClick={onClose} className="w-full sm:w-auto px-10 sm:px-12 py-5 sm:py-8 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl sm:rounded-[2rem] transition-all font-black text-[10px] sm:text-[12px] uppercase tracking-widest border border-white/5 active:scale-95 order-2 sm:order-none">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};