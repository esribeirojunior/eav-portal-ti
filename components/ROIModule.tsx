import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart2, HardDrive, Network, X, Lightbulb, ChevronDown, ChevronUp, Play, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StaticLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mt-8 w-full">
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <img src="https://logo.clearbit.com/manageengine.com" alt="ManageEngine" className="w-5 h-5 rounded-md object-contain bg-transparent" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-bold text-sm" style={{ color: '#f43f5e' }}>ManageEngine</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <img src="https://logo.clearbit.com/teamviewer.com" alt="TeamViewer" className="w-5 h-5 rounded-md object-contain bg-transparent" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-bold text-sm" style={{ color: '#f97316' }}>TeamViewer</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <img src="https://logo.clearbit.com/anydesk.com" alt="AnyDesk" className="w-5 h-5 rounded-md object-contain bg-transparent" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-bold text-sm" style={{ color: '#3b82f6' }}>AnyDesk</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center text-[8px] font-black text-white shadow-inner">EAV</div>
            <span className="font-bold text-sm" style={{ color: '#10b981' }}>Portal de Gestão de TI</span>
        </div>
    </div>
);

interface ROIModuleProps {
    onBack: () => void;
}

export function ROIModule({ onBack }: ROIModuleProps) {
    // Slider values
    const [endpoints, setEndpoints] = useState<number>(150);
    const [showNotes, setShowNotes] = useState<boolean>(false);

    // Presentation Mode States
    const [isPresentation, setIsPresentation] = useState<boolean>(false);
    const [currentSlide, setCurrentSlide] = useState<number>(0);
    const totalSlides = 6;

    React.useEffect(() => {
        if (isPresentation) {
            if (document.body.classList.contains('light')) {
                document.body.classList.remove('light');
                document.body.setAttribute('data-was-light', 'true');
            }
        } else {
            if (document.body.getAttribute('data-was-light') === 'true') {
                document.body.classList.add('light');
                document.body.removeAttribute('data-was-light');
            }
        }
        return () => {
            if (document.body.getAttribute('data-was-light') === 'true') {
                document.body.classList.add('light');
                document.body.removeAttribute('data-was-light');
            }
        };
    }, [isPresentation]);

    // Market Costs Reference
    const getManageEngineCost = (numEndpoints: number) => {
        const dollarRate = 5.50; // Cotação aproximada do Dólar + Impostos (IOF)
        let usdCost = 0;
        
        if (numEndpoints <= 50) usdCost = 1045;
        else if (numEndpoints <= 100) usdCost = 1895;
        else if (numEndpoints <= 250) usdCost = 3745;
        else if (numEndpoints <= 500) usdCost = 6545;
        else if (numEndpoints <= 1000) usdCost = 11245;
        else if (numEndpoints <= 2500) usdCost = 23395;
        else if (numEndpoints <= 5000) usdCost = 37445;
        else usdCost = 56145; // 10000

        return usdCost * dollarRate;
    };

    const teamViewerCost = 6802.80; // R$ 6802,80 / ano (TeamViewer Corporate)
    const anyDeskCost = 4405.00; // R$ 4405 / ano (AnyDesk Advanced)
    
    // Calculated Costs
    const marketRMM = getManageEngineCost(endpoints);
    const marketTotal = marketRMM + teamViewerCost;
    const eavCost = 0; // The platform costs zero in extra licensing

    const savings1Year = marketTotal;
    const savings3Years = marketTotal * 3;
    const savings5Years = marketTotal * 5;

    // Data for the Graph
    const data = [
        {
            name: 'Ano 1',
            Mercado: marketTotal,
            ManageEngine: marketRMM,
            TeamViewer: teamViewerCost,
            AnyDesk: anyDeskCost,
            EAV: eavCost,
        },
        {
            name: 'Ano 3',
            Mercado: marketTotal * 3,
            ManageEngine: marketRMM * 3,
            TeamViewer: teamViewerCost * 3,
            AnyDesk: anyDeskCost * 3,
            EAV: eavCost,
        },
        {
            name: 'Ano 5',
            Mercado: marketTotal * 5,
            ManageEngine: marketRMM * 5,
            TeamViewer: teamViewerCost * 5,
            AnyDesk: anyDeskCost * 5,
            EAV: eavCost,
        },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const renderSlideContent = () => {
        switch(currentSlide) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in p-8">
                        <div className="p-6 bg-indigo-500/20 rounded-full border border-indigo-500/30 mb-4 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                            <TrendingUp size={64} className="text-indigo-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl leading-[1.1]">
                            Evolução e Independência Tecnológica: <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">O Impacto do Portal de Gestão de TI</span>
                        </h1>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full my-8"></div>
                        <div className="flex flex-col items-center">
                            <p className="text-3xl font-black text-slate-200">Erisson Ribeiro de Souza Junior</p>
                            <p className="text-xl font-bold text-slate-400 mt-2">Analista de Suporte II</p>
                            <p className="text-sm text-indigo-400 mt-2 uppercase tracking-[0.2em] font-black bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">
                                Ayko / Outsourcing - Escola Americana de Vitória
                            </p>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-rose-400 mb-4">1. O Desafio de Mercado</h2>
                            <p className="text-xl md:text-2xl text-slate-300 font-medium">O alto custo das ferramentas tradicionais de prateleira (SaaS).</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800/60 p-10 rounded-[2rem] border border-rose-500/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 opacity-5">
                                    <HardDrive size={200} />
                                </div>
                                <HardDrive size={40} className="text-rose-400 mb-6" />
                                <h3 className="text-3xl font-black text-white mb-3">Gestão de Ativos (RMM)</h3>
                                <p className="text-lg text-slate-400 mb-8 font-medium leading-relaxed">Soluções profissionais (ManageEngine / NinjaOne) cobram licenças individuais por dispositivo.</p>
                                <div className="p-6 bg-slate-900/80 rounded-2xl border border-white/5">
                                    <p className="text-xs text-rose-300/80 uppercase font-black tracking-widest mb-2">Custo Base (ManageEngine Cloud Prof.)</p>
                                    <p className="text-4xl font-black text-rose-400 mb-2">US$ 6.545,00<span className="text-xl text-slate-500 font-bold"> / ano</span></p>
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm text-slate-500 font-medium bg-slate-800 px-3 py-1 rounded-full w-max">Base para 500 computadores</span>
                                        <a href="https://www.manageengine.com/products/desktop-central/pricing.html" target="_blank" rel="noreferrer" className="text-xs text-rose-300/50 hover:text-rose-300 underline transition-colors">Fonte: ManageEngine Pricing</a>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/60 p-10 rounded-[2rem] border border-rose-500/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 opacity-5">
                                    <Network size={200} />
                                </div>
                                <Network size={40} className="text-rose-400 mb-6" />
                                <h3 className="text-3xl font-black text-white mb-3">Acesso Remoto T.I</h3>
                                <p className="text-lg text-slate-400 mb-8 font-medium leading-relaxed">Ferramentas de acesso desacompanhado e suporte remoto cobram pacotes caros por número de conexões.</p>
                                <div className="p-6 bg-slate-900/80 rounded-2xl border border-white/5">
                                    <p className="text-xs text-rose-300/80 uppercase font-black tracking-widest mb-2">Custo Base (TeamViewer Corporate)</p>
                                    <p className="text-4xl font-black text-rose-400 mb-2">R$ 6.802,80<span className="text-xl text-slate-500 font-bold"> / ano</span></p>
                                    <div className="flex flex-col gap-3">
                                        <span className="text-sm text-slate-500 font-medium bg-slate-800 px-3 py-1 rounded-full w-max">Referência: AnyDesk Advanced (R$ 4.405/ano)</span>
                                        <a href="https://anydesk.com/pt/encomendar" target="_blank" rel="noreferrer" className="text-xs text-rose-300/50 hover:text-rose-300 underline transition-colors">Fonte: AnyDesk Pricing</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-emerald-400 mb-4">2. A Solução: Portal de Gestão de TI</h2>
                            <p className="text-xl md:text-2xl text-slate-300 font-medium">Centralização e independência total através de desenvolvimento próprio.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-emerald-900/20 p-10 rounded-[2rem] border border-emerald-500/20 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-emerald-400">
                                    <HardDrive size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">Inventário Ilimitado</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">Gestão de centenas de endpoints sem adicionar custos fixos por máquina na fatura da escola.</p>
                            </div>
                            <div className="bg-emerald-900/20 p-10 rounded-[2rem] border border-emerald-500/20 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-emerald-400">
                                    <Activity size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">Telemetria Real-time</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">Monitoramento online/offline integrado através do nosso próprio serviço cliente (RMM Service).</p>
                            </div>
                            <div className="bg-emerald-900/20 p-10 rounded-[2rem] border border-emerald-500/20 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 text-emerald-400">
                                    <Network size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">Acesso Remoto Nativo</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">Túneis VNC embutidos diretamente no portal web. Dispensa assinaturas do TeamViewer ou AnyDesk.</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/80 p-8 rounded-[2rem] border border-slate-700 text-center mt-4">
                            <p className="text-2xl text-slate-200 font-bold">Resultado: <strong className="text-emerald-400 font-black">Autonomia Absoluta</strong> e um ecossistema 100% customizado para a EAV.</p>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-8 animate-fade-in pt-12 overflow-y-auto custom-scrollbar pb-24">
                        <div className="mb-10 shrink-0 text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-indigo-400 mb-4">3. Simulador de Economia e ROI</h2>
                            <p className="text-xl text-slate-300 font-medium">Arraste o controle para simular o crescimento do parque tecnológico.</p>
                        </div>
                        
                        <div className="bg-slate-800/60 rounded-[2.5rem] border border-slate-700 p-10 shadow-2xl flex flex-col md:flex-row gap-16 items-center mb-10 shrink-0">
                            <div className="flex-1 w-full">
                                <h2 className="text-3xl font-black text-white mb-8">Volume (Endpoints)</h2>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="1000" 
                                    step="50"
                                    value={endpoints} 
                                    onChange={(e) => setEndpoints(Number(e.target.value))}
                                    className="w-full h-4 cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between mt-6 text-sm font-bold text-slate-400">
                                    <span>50 PCs</span>
                                    <span>1000 PCs</span>
                                </div>
                            </div>
                            
                            <div className="w-56 h-56 rounded-full border-[10px] border-indigo-500 flex flex-col items-center justify-center bg-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.2)] flex-shrink-0">
                                <span className="text-7xl font-black text-indigo-400 leading-none">{endpoints}</span>
                                <span className="text-sm font-black uppercase tracking-widest text-indigo-400/50 mt-3">Equipamentos</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 shrink-0">
                            <div className="bg-slate-800/60 p-10 rounded-[2.5rem] border border-slate-700 shadow-xl">
                                <h3 className="text-2xl font-black text-white mb-8">Comparativo (5 Anos)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', color: '#fff', fontSize: '16px' }} formatter={(value: number) => formatCurrency(value)} />
                                            <Bar dataKey="ManageEngine" name="ManageEngine" fill="#f43f5e" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="TeamViewer" name="TeamViewer" fill="#f97316" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="AnyDesk" name="AnyDesk" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="EAV" name="Portal de Gestão de TI" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <StaticLegend />
                            </div>
                            
                            <div className="flex flex-col gap-6">
                                <div className="bg-emerald-900/30 p-10 rounded-[2.5rem] border border-emerald-500/30 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
                                    <div className="absolute -top-10 -right-10 p-4 opacity-10">
                                        <DollarSign size={200} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-base font-black text-emerald-400/80 uppercase tracking-widest mb-4 relative z-10">Economia Total Projetada (5 Anos)</h3>
                                    <p className="text-6xl md:text-7xl font-black text-emerald-400 tracking-tighter relative z-10 mb-4">{formatCurrency(savings5Years)}</p>
                                    <div className="w-16 h-1 bg-emerald-500/50 rounded-full mb-6 relative z-10"></div>
                                    <p className="text-lg text-emerald-100/70 relative z-10 max-w-md font-medium leading-relaxed mb-6">
                                        Dinheiro que permanece no caixa da instituição e pode ser reinvestido em melhorias físicas, laboratórios e novos computadores.
                                    </p>
                                    <div className="relative z-10 p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/20">
                                        <p className="text-xs text-emerald-400/80 font-medium">
                                            * Cálculo projetado utilizando como base os custos comerciais do <strong className="text-emerald-300">ManageEngine Professional Cloud</strong> e do <strong className="text-emerald-300">TeamViewer Corporate</strong>, aplicados ao volume de equipamentos selecionado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-fade-in max-w-5xl mx-auto px-8 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10 blur-3xl"></div>
                        <div className="p-8 bg-amber-500/20 rounded-full border border-amber-500/30 mb-4 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                            <Lightbulb size={80} className="text-amber-400" />
                        </div>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.2]">
                            A tecnologia como <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">acelerador de resultados</span>.
                        </h2>
                        <div className="w-32 h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full my-8"></div>
                        <p className="text-2xl text-slate-300 leading-relaxed font-medium">
                            Construímos um portal com <strong className="text-white font-black">Escalabilidade Infinita</strong>. A instituição pode dobrar ou triplicar o número de equipamentos e a nossa fundação tecnológica irá acompanhar esse crescimento nativamente, sem reajustes, limites ou licenciamentos adicionais.
                        </p>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in max-w-5xl mx-auto px-8 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent -z-10 blur-3xl"></div>
                        
                        <h2 className="text-7xl font-black text-white tracking-tight mb-12">Muito Obrigado.</h2>
                        
                        <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm mt-12 w-full max-w-xl text-left flex items-center gap-6 shadow-2xl relative">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-3xl border border-indigo-500/30 shrink-0">
                                ER
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-1">Erisson Ribeiro de Souza Junior</h3>
                                <p className="text-indigo-400 font-medium uppercase tracking-widest text-xs mb-4">Analista de Suporte II</p>
                                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-bold shadow-inner">Ayko / Outsourcing - Escola Americana de Vitória</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isPresentation) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col overflow-hidden">
                <style>{`
                    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                `}</style>
                
                {/* Header da Apresentação */}
                <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 shrink-0 bg-slate-900/80 backdrop-blur-xl z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <span className="font-black text-xl text-white tracking-wide">Apresentação Executiva</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsPresentation(false)}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm font-bold border border-white/10 hover:border-white/20"
                    >
                        Encerrar Apresentação <X size={18} />
                    </button>
                </div>

                {/* Conteudo do Slide */}
                <div className="flex-1 overflow-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
                    {renderSlideContent()}
                </div>

                {/* Footer Controls */}
                <div className="h-24 border-t border-white/5 flex items-center justify-between px-10 shrink-0 bg-slate-900/80 backdrop-blur-xl z-50">
                    <div className="flex items-center gap-3">
                        {Array.from({ length: totalSlides }).map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-16 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-3 bg-white/10'}`}
                            />
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                            disabled={currentSlide === 0}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <span className="font-black text-slate-400 text-lg w-20 text-center tracking-widest">
                            {currentSlide + 1} / {totalSlides}
                        </span>
                        <button 
                            onClick={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))}
                            disabled={currentSlide === totalSlides - 1}
                            className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:bg-white/5 disabled:cursor-not-allowed transition-all text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // NORMAL DASHBOARD
    return (
        <div className="h-full bg-slate-50 dark:bg-[#0c0d21] overflow-y-auto custom-scrollbar">
            {/* Cabecalho Principal */}
            <div className="p-8 pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/60">
                            <X size={20} />
                        </button>
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Economia e ROI</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Impacto financeiro do Portal de Gestão de TI comparado ao mercado (ManageEngine, TeamViewer, etc)</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            setCurrentSlide(0);
                            setIsPresentation(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
                    >
                        <Play size={18} fill="currentColor" />
                        Iniciar Apresentação Executiva
                    </button>
                </div>
            </div>

            <div className="px-8 pb-8 space-y-6 mt-4">
                
                {/* Texto Explicativo */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                    <h2 className="text-lg font-black text-indigo-900 dark:text-indigo-400 mb-2">Entendendo este Painel de Economia</h2>
                    <p className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                        Este módulo demonstra o Retorno Sobre o Investimento (ROI) gerado pelo uso do Portal de Gestão de TI. 
                        No mercado atual de TI corporativa, ferramentas profissionais de Gestão de Ativos e RMM (como ManageEngine, NinjaOne ou Lansweeper) 
                        cobram licenças em dólar baseadas no número de computadores monitorados. Além disso, o suporte remoto por múltiplos técnicos requer licenças 
                        à parte (como TeamViewer Premium). 
                        <br/><br/>
                        O sistema interno desenvolvido para a Escola EAV engloba inventário ilimitado, telemetria automatizada e conexão remota VNC nativa 
                        em um único ecossistema centralizado. 
                        <br/><br/>
                        <strong className="text-indigo-900 dark:text-indigo-300">Construído para o Crescimento Futuro:</strong> A arquitetura própria isenta a instituição de qualquer custo com licenciamento externo por dispositivo, permitindo que a escola aumente 
                        o seu parque tecnológico indefinidamente sem gerar novos boletos de software para o departamento de TI. A escalabilidade financeira do Portal de Gestão de TI é infinita.
                    </p>
                </div>

                {/* Simulador Interativo */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 w-full">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Simulador de Volume (Endpoints)</h2>
                            <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Deslize para ver quanto a escola economiza conforme o parque cresce.</p>
                            
                            <input 
                                type="range" 
                                min="50" 
                                max="1000" 
                                step="50"
                                value={endpoints} 
                                onChange={(e) => setEndpoints(Number(e.target.value))}
                                className="w-full h-3 cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between mt-3 text-xs font-bold text-slate-400">
                                <span>50 PCs</span>
                                <span>1000 PCs</span>
                            </div>
                        </div>
                        
                        <div className="w-48 h-48 rounded-full border-8 border-emerald-500 flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/20 flex-shrink-0">
                            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{endpoints}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/50 dark:text-emerald-400/50 mt-1">Equipamentos</span>
                        </div>
                    </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <DollarSign size={80} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10">Economia em 1 Ano</h3>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter relative z-10">{formatCurrency(savings1Year)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <BarChart2 size={80} className="text-indigo-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10">Economia em 3 Anos</h3>
                        <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter relative z-10">{formatCurrency(savings3Years)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <ArrowUpRight size={80} className="text-violet-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10">Economia em 5 Anos</h3>
                        <p className="text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tighter relative z-10">{formatCurrency(savings5Years)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Grafico */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">Projeção de Custos a Longo Prazo</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Comparativo entre softwares comerciais (licenciamento) e o Portal de Gestão de TI</p>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                        tickFormatter={(val) => `R$ ${val/1000}k`}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '1rem', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontWeight: 800 }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="ManageEngine" name="ManageEngine" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                                    <Bar dataKey="TeamViewer" name="TeamViewer" fill="#f97316" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                                    <Bar dataKey="AnyDesk" name="AnyDesk" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                                    <Bar dataKey="EAV" name="Portal de Gestão de TI" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <StaticLegend />
                    </div>

                    {/* Breakdown */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">Detalhamento</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Composição dos custos anuais</p>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-white/80">Gestão de Ativos</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(marketRMM)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium mt-1">
                                    Referência: ManageEngine Endpoint Central (Professional Cloud)<br/>
                                    Valor Base Real: <strong className="text-slate-700 dark:text-white/80">{formatCurrency(rmmCostPerDevice)} por dispositivo/ano</strong> <span className="opacity-70">(Baseado no plano de US$ 6.545,00 para 500 endpoints)</span>
                                </p>
                            </div>

                            <div className="h-px w-full bg-slate-200 dark:bg-white/5"></div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Network size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-white/80">Acesso Remoto T.I</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(teamViewerCost)}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-white/40 font-medium mt-2 space-y-1">
                                    <p>
                                        • TeamViewer Corporate (500 unid): <strong className="text-slate-700 dark:text-white/80">{formatCurrency(teamViewerCost)} fixo/ano</strong>
                                    </p>
                                    <p>
                                        • AnyDesk Advanced (2 canais/1000 unid): <strong className="text-slate-700 dark:text-white/80">{formatCurrency(4405.44)} fixo/ano</strong>
                                    </p>
                                    <p className="pt-1 opacity-70 italic">* O cálculo de projeção utiliza o TeamViewer como referência comercial.</p>
                                </div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 mt-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Custo Total / Ano</span>
                                    <span className="text-xl font-black text-rose-500">{formatCurrency(marketTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roteiro de Apresentação (Apenas TI) */}
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-200 dark:border-amber-500/20 overflow-hidden">
                    <button 
                        onClick={() => setShowNotes(!showNotes)}
                        className="w-full flex items-center justify-between p-6 hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl">
                                <Lightbulb size={20} className="text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest">Roteiro de Apresentação (TI)</h3>
                                <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-500/60 mt-0.5">Tópicos e gatilhos mentais para usar durante a reunião com a diretoria</p>
                            </div>
                        </div>
                        {showNotes ? <ChevronUp size={20} className="text-amber-600" /> : <ChevronDown size={20} className="text-amber-600" />}
                    </button>
                    
                    {showNotes && (
                        <div className="px-6 pb-6 pt-2 border-t border-amber-200/50 dark:border-amber-500/10">
                            <ul className="space-y-4 mt-4">
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-black">1.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium">
                                        <strong className="text-amber-900 dark:text-amber-400">Contexto da Dor:</strong> "Hoje, o mercado cobra em dólar e por dispositivo para gerenciar TI. Se fôssemos contratar soluções profissionais como ManageEngine e TeamViewer Corporate, nosso custo cresceria proporcionalmente a cada novo notebook comprado."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-black">2.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium">
                                        <strong className="text-amber-900 dark:text-amber-400">A Solução Interna (Portal de Gestão de TI):</strong> "Em vez de alugar software, nós construímos a nossa própria plataforma centralizada (Portal de Gestão de TI). Ela faz o mesmo que as gigantes de mercado, mas com licenciamento ilimitado."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-black">3.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium">
                                        <strong className="text-amber-900 dark:text-amber-400">Ação Interativa (Demonstração):</strong> <i className="opacity-70">(Mova o slider neste momento)</i> "Vejam o que acontece se dobrarmos de tamanho. O custo de mercado explode. O nosso custo se mantém em R$ 0 de licenciamento. A economia projetada em 5 anos paga dezenas de equipamentos novos."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-black">4.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium">
                                        <strong className="text-amber-900 dark:text-amber-400">O Fechamento:</strong> "A TI da EAV deixou de ser um centro de custo para ser um centro de inteligência e lucro indireto, gerando economia real e blindando a escola para o crescimento futuro."
                                    </p>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
