import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart2, HardDrive, Network, X, Lightbulb, ChevronDown, ChevronUp, Play, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StaticLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mt-8 w-full">
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
            <span className="font-bold text-sm" style={{ color: '#f43f5e' }}>ManageEngine</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
            <span className="font-bold text-sm" style={{ color: '#f97316' }}>TeamViewer</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="font-bold text-sm" style={{ color: '#3b82f6' }}>AnyDesk</span>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="font-bold text-sm" style={{ color: '#10b981' }}>Portal de Gestão de Ativos de TI</span>
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
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in p-8 relative">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-[#5b8a36] rounded-br-full opacity-20 -z-10 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#a63429] rounded-tl-full opacity-20 -z-10 blur-3xl"></div>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-poppins font-black tracking-tight text-[#214478] max-w-5xl leading-[1.1]">
                            Evolução e Independência Tecnológica: <br/><span className="text-[#a63429]">O Impacto do Portal de Gestão de Ativos de TI</span>
                        </h1>
                        <div className="w-24 h-2 bg-[#e3b23c] rounded-full my-8"></div>
                        <div className="flex flex-col items-center">
                            <p className="font-poppins text-3xl font-black text-[#592c2b]">Erisson Ribeiro de Souza Junior</p>
                            <p className="font-montserrat text-xl font-bold text-slate-600 mt-2">Analista de Suporte II</p>
                            <p className="font-montserrat text-sm text-[#70508a] mt-2 uppercase tracking-[0.2em] font-black bg-[#70508a]/10 px-4 py-2 rounded-lg border border-[#70508a]/20">
                                Ayko / Outsourcing - Escola Americana de Vitória
                            </p>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8 relative z-10">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-poppins font-black text-[#a63429] mb-4">1. O Desafio de Mercado</h2>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium font-montserrat">O alto custo das ferramentas tradicionais de prateleira (SaaS).</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-[#a63429]/20 shadow-xl relative overflow-hidden flex flex-col">
                                <HardDrive size={40} className="text-[#a63429] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3 font-montserrat">Gestão de Ativos (RMM)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1 font-montserrat">Soluções profissionais (ManageEngine / NinjaOne) cobram licenças individuais por dispositivo.</p>
                                <div className="p-5 bg-[#a63429]/10 rounded-2xl border border-[#a63429]/20">
                                    <p className="font-montserrat text-[10px] text-[#a63429] uppercase font-black tracking-widest mb-1">ManageEngine Cloud Prof.</p>
                                    <p className="font-poppins text-3xl font-black text-[#a63429] mb-3">US$ 6.545,00<span className="text-lg text-[#a63429]/70 font-bold"> / ano</span></p>
                                    <span className="font-montserrat text-[10px] xl:text-xs text-[#a63429] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Para ~300 computadores</span>
                                </div>
                            </div>
                            
                            <div className="bg-white p-8 rounded-[2rem] border border-[#e3b23c]/40 shadow-xl relative overflow-hidden flex flex-col">
                                <Network size={40} className="text-[#e3b23c] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3 font-montserrat">Acesso Remoto (TeamViewer)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1 font-montserrat">Acesso desacompanhado com cobrança por conexões simultâneas.</p>
                                <div className="p-5 bg-[#e3b23c]/10 rounded-2xl border border-[#e3b23c]/20">
                                    <p className="font-montserrat text-[10px] text-[#e3b23c] uppercase font-black tracking-widest mb-1">Plano Corporate</p>
                                    <p className="font-poppins text-3xl font-black text-[#e3b23c] mb-3">R$ 6.802,80<span className="text-lg text-[#e3b23c]/70 font-bold"> / ano</span></p>
                                    <span className="font-montserrat text-[10px] xl:text-xs text-[#e3b23c] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Até 3 conexões simultâneas</span>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-[#70508a]/20 shadow-xl relative overflow-hidden flex flex-col">
                                <Network size={40} className="text-[#70508a] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3 font-montserrat">Acesso Remoto (AnyDesk)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1 font-montserrat">Alternativa comercial com limite de dispositivos gerenciados.</p>
                                <div className="p-5 bg-[#70508a]/10 rounded-2xl border border-[#70508a]/20">
                                    <p className="font-montserrat text-[10px] text-[#70508a] uppercase font-black tracking-widest mb-1">Plano Advanced</p>
                                    <p className="font-poppins text-3xl font-black text-[#70508a] mb-3">R$ 4.405,00<span className="text-lg text-[#70508a]/70 font-bold"> / ano</span></p>
                                    <span className="font-montserrat text-[10px] xl:text-xs text-[#70508a] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Licença para 2 conexões</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8 relative z-10">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-poppins font-black text-[#5b8a36] mb-4">2. A Solução: Portal de Gestão de Ativos de TI</h2>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium font-montserrat">Centralização e independência total através de desenvolvimento próprio.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <HardDrive size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4 font-montserrat">Inventário Ilimitado</h3>
                                <p className="text-slate-600 font-medium leading-relaxed font-montserrat">Gestão de centenas de endpoints sem adicionar custos fixos por máquina na fatura da escola.</p>
                            </div>
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <Activity size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4 font-montserrat">Telemetria Real-time</h3>
                                <p className="text-slate-600 font-medium leading-relaxed font-montserrat">Monitoramento online/offline integrado através do nosso próprio serviço cliente (RMM Service).</p>
                            </div>
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <Network size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4 font-montserrat">Acesso Remoto Nativo</h3>
                                <p className="text-slate-600 font-medium leading-relaxed font-montserrat">Integração de motor open-source para acesso direto. Dispensa assinaturas do TeamViewer ou AnyDesk.</p>
                            </div>
                        </div>
                        <div className="bg-[#5b8a36]/10 p-8 rounded-[2rem] border border-[#5b8a36]/30 shadow-xl text-center mt-4">
                            <p className="text-2xl text-[#214478] font-bold">Resultado: <strong className="text-[#5b8a36] font-black">Autonomia Absoluta</strong> e um ecossistema 100% customizado para a EAV.</p>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-8 animate-fade-in pt-12 overflow-y-auto custom-scrollbar pb-24 relative z-10">
                        <div className="mb-10 shrink-0 text-center">
                            <h2 className="text-4xl md:text-5xl font-poppins font-black text-[#214478] mb-4">3. Simulador de Economia e ROI</h2>
                            <p className="text-xl text-slate-600 font-medium font-montserrat">Arraste o controle para simular o crescimento do parque tecnológico.</p>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl flex flex-col md:flex-row gap-16 items-center mb-10 shrink-0">
                            <div className="flex-1 w-full">
                                <h2 className="text-3xl font-poppins font-black text-[#214478] mb-8">Volume (Endpoints)</h2>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="1000" 
                                    step="50"
                                    value={endpoints} 
                                    onChange={(e) => setEndpoints(Number(e.target.value))}
                                    className="w-full h-4 cursor-pointer accent-[#214478]"
                                />
                                <div className="flex justify-between mt-6 text-sm font-bold text-slate-400">
                                    <span>50 PCs</span>
                                    <span>1000 PCs</span>
                                </div>
                            </div>
                            
                            <div className="w-56 h-56 rounded-full border-[10px] border-[#214478] flex flex-col items-center justify-center bg-[#214478]/5 shadow-xl flex-shrink-0">
                                <span className="text-7xl font-poppins font-black text-[#214478] leading-none">{endpoints}</span>
                                <span className="text-sm font-poppins font-black uppercase tracking-widest text-[#214478]/50 mt-3">Equipamentos</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 shrink-0">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
                                <h3 className="text-2xl font-black text-[#214478] mb-8 font-montserrat">Comparativo (5 Anos)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14, fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '1rem', color: '#1e293b', fontSize: '16px' }} formatter={(value: number) => formatCurrency(value)} />
                                            <Bar dataKey="ManageEngine" name="ManageEngine" fill="#a63429" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="TeamViewer" name="TeamViewer" fill="#e3b23c" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="AnyDesk" name="AnyDesk" fill="#70508a" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                            <Bar dataKey="EAV" name="Portal de Gestão de Ativos de TI" fill="#5b8a36" radius={[8, 8, 0, 0]} barSize={20} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-8 w-full">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#a63429]"></div><span className="font-bold text-sm text-slate-600">ManageEngine</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#e3b23c]"></div><span className="font-bold text-sm text-slate-600">TeamViewer</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#70508a]"></div><span className="font-bold text-sm text-slate-600">AnyDesk</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#5b8a36]"></div><span className="font-bold text-sm text-slate-600">Portal EAV</span></div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-6">
                                <div className="bg-[#a63429] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
                                    <div className="absolute -top-10 -right-10 p-4 opacity-10">
                                        <DollarSign size={200} className="text-white" />
                                    </div>
                                    <h3 className="text-base font-black text-white/80 uppercase tracking-widest mb-4 relative z-10 font-montserrat">Economia Total Projetada (5 Anos)</h3>
                                    <p className="font-poppins text-6xl md:text-7xl font-black text-white tracking-tighter relative z-10 mb-4">{formatCurrency(savings5Years)}</p>
                                    <div className="w-16 h-1 bg-white/50 rounded-full mb-6 relative z-10"></div>
                                    <p className="text-lg text-white/90 relative z-10 max-w-md font-medium leading-relaxed mb-6 font-montserrat">
                                        Dinheiro que permanece no caixa da instituição e pode ser reinvestido em melhorias físicas, laboratórios e novos computadores.
                                    </p>
                                    <div className="relative z-10 p-4 bg-white/10 rounded-xl border border-white/20">
                                        <p className="text-xs text-white/80 font-medium font-montserrat">
                                            * Cálculo projetado utilizando como base os custos comerciais do <strong className="text-white">ManageEngine Professional Cloud</strong> e do <strong className="text-white">TeamViewer Corporate</strong>, aplicados ao volume de equipamentos selecionado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-10 animate-fade-in max-w-5xl mx-auto px-8 relative z-10">
                        <div className="p-8 bg-[#e3b23c]/20 rounded-full border border-[#e3b23c]/30 mb-4 shadow-xl">
                            <Lightbulb size={80} className="text-[#e3b23c]" />
                        </div>
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-poppins font-black tracking-tight text-[#214478] leading-[1.2]">
                            A tecnologia como <br/><span className="text-[#e3b23c]">acelerador de resultados</span>.
                        </h2>
                        <div className="w-32 h-2 bg-[#a63429] rounded-full my-8"></div>
                        <p className="text-2xl text-slate-700 leading-relaxed font-medium font-montserrat">
                            Construímos um portal com <strong className="text-[#214478] font-black">Escalabilidade Infinita</strong>. A instituição pode dobrar ou triplicar o número de equipamentos e a nossa fundação tecnológica irá acompanhar esse crescimento nativamente, sem reajustes, limites ou licenciamentos adicionais.
                        </p>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in max-w-5xl mx-auto px-8 relative z-10">
                        <h2 className="text-7xl font-poppins font-black text-[#214478] tracking-tight mb-12">Muito Obrigado.</h2>
                        
                        <div className="bg-white p-8 rounded-3xl border border-[#214478]/10 mt-12 w-full max-w-xl text-left flex items-center gap-6 shadow-2xl relative">
                            <div className="w-20 h-20 bg-[#214478]/10 rounded-2xl flex items-center justify-center text-[#214478] font-black text-3xl border border-[#214478]/20 shrink-0">
                                ER
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#214478] mb-1 font-montserrat">Erisson Ribeiro de Souza Junior</h3>
                                <p className="text-[#a63429] font-medium uppercase tracking-widest text-xs mb-4 font-montserrat">Analista de Suporte II</p>
                                <span className="font-montserrat text-xs bg-[#5b8a36]/10 text-[#5b8a36] px-3 py-1.5 rounded-lg border border-[#5b8a36]/20 font-bold">Ayko / Outsourcing - Escola Americana de Vitória</span>
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
            <div className="fixed inset-0 z-[100] bg-[#f4f4f0] text-slate-800 flex flex-col overflow-hidden">
                <style>{`
                    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}</style>
                
                {/* Decorative background shapes mimicking EAVents background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-[#5b8a36] rounded-r-full opacity-[0.05] transform -rotate-12 blur-3xl"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[120%] bg-[#a63429] rounded-l-full opacity-[0.05] transform rotate-12 blur-3xl"></div>
                    <div className="absolute top-[10%] right-[10%] w-[30%] h-[60%] bg-[#e3b23c] rounded-full opacity-[0.05] blur-3xl"></div>
                </div>
                
                {/* Header da Apresentação */}
                <div className="h-20 border-b border-[#214478]/10 flex items-center justify-between px-8 shrink-0 bg-[#f4f4f0]/90 backdrop-blur-xl z-50 relative">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#214478]/10 flex items-center justify-center border border-[#214478]/20">
                            <TrendingUp size={20} className="text-[#214478]" />
                        </div>
                        <span className="font-poppins font-black text-xl text-[#214478] tracking-wide">Apresentação Executiva</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsPresentation(false)}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-[#a63429] transition-all text-sm font-bold border border-slate-200 shadow-sm"
                    >
                        Encerrar Apresentação <X size={18} />
                    </button>
                </div>

                {/* Conteudo do Slide */}
                <div className="flex-1 overflow-hidden relative z-10">
                    <div className="relative z-20 h-full">
                        {renderSlideContent()}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="h-24 border-t border-[#214478]/10 flex items-center justify-between px-10 shrink-0 bg-[#f4f4f0]/90 backdrop-blur-xl z-50">
                    <div className="flex items-center gap-3">
                        {Array.from({ length: totalSlides }).map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-16 bg-[#214478] shadow-md' : 'w-3 bg-slate-300'}`}
                            />
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                            disabled={currentSlide === 0}
                            className="p-4 rounded-2xl bg-white border border-slate-200 text-[#214478] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <span className="font-poppins font-black text-slate-500 text-lg w-20 text-center tracking-widest">
                            {currentSlide + 1} / {totalSlides}
                        </span>
                        <button 
                            onClick={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))}
                            disabled={currentSlide === totalSlides - 1}
                            className="p-4 rounded-2xl bg-[#214478] hover:bg-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white shadow-lg hover:scale-105 active:scale-95"
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
                            <h1 className="text-3xl font-poppins font-black text-slate-800 dark:text-white tracking-tight">Economia e ROI</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1 font-montserrat">Impacto financeiro do Portal de Gestão de Ativos de TI comparado ao mercado (ManageEngine, TeamViewer, etc)</p>
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
                    <h2 className="text-lg font-poppins font-black text-indigo-900 dark:text-indigo-400 mb-2">Entendendo este Painel de Economia</h2>
                    <p className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed font-montserrat">
                        Este módulo demonstra o Retorno Sobre o Investimento (ROI) gerado pelo uso do Portal de Gestão de Ativos de TI. 
                        No mercado atual de TI corporativa, ferramentas profissionais de Gestão de Ativos e RMM (como ManageEngine, NinjaOne ou Lansweeper) 
                        cobram licenças em dólar baseadas no número de computadores monitorados. Além disso, o suporte remoto por múltiplos técnicos requer licenças 
                        à parte (como TeamViewer Premium). 
                        <br/><br/>
                        O sistema interno desenvolvido para a Escola EAV engloba inventário ilimitado, telemetria automatizada e conexão remota open-source integrada 
                        em um único ecossistema centralizado. 
                        <br/><br/>
                        <strong className="text-indigo-900 dark:text-indigo-300">Construído para o Crescimento Futuro:</strong> A arquitetura própria isenta a instituição de qualquer custo com licenciamento externo por dispositivo, permitindo que a escola aumente 
                        o seu parque tecnológico indefinidamente sem gerar novos boletos de software para o departamento de TI. A escalabilidade financeira do Portal de Gestão de Ativos de TI é infinita.
                        <br/><br/>
                        <strong className="text-indigo-900 dark:text-indigo-300">Projeção Extremamente Conservadora:</strong> Os valores de mercado projetados neste simulador representam o cenário mais básico possível. A cotação base reflete o plano de entrada, cobrindo apenas 1 único técnico, sem gerenciamento de servidores, sem licenças avançadas de segurança (EDR) e sem os altos custos de consultoria para implantação de um sistema de terceiros. Se o ambiente real da Escola fosse cotado integralmente com todos os seus recursos atuais, o custo das soluções comerciais (a barra vermelha do gráfico) seria facilmente o dobro do projetado aqui.
                    </p>
                </div>

                {/* Simulador Interativo */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 w-full">
                            <h2 className="text-xl font-poppins font-black text-slate-800 dark:text-white mb-2">Simulador de Volume (Endpoints)</h2>
                            <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium font-montserrat">Deslize para ver quanto a escola economiza conforme o parque cresce.</p>
                            
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
                            <span className="text-4xl font-poppins font-black text-emerald-600 dark:text-emerald-400 leading-none">{endpoints}</span>
                            <span className="font-montserrat text-[10px] font-poppins font-black uppercase tracking-widest text-emerald-600/50 dark:text-emerald-400/50 mt-1">Equipamentos</span>
                        </div>
                    </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <DollarSign size={80} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10 font-montserrat">Economia em 1 Ano</h3>
                        <p className="font-poppins text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter relative z-10">{formatCurrency(savings1Year)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <BarChart2 size={80} className="text-indigo-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10 font-montserrat">Economia em 3 Anos</h3>
                        <p className="font-poppins text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter relative z-10">{formatCurrency(savings3Years)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <ArrowUpRight size={80} className="text-violet-500" />
                        </div>
                        <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1 relative z-10 font-montserrat">Economia em 5 Anos</h3>
                        <p className="font-poppins text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tighter relative z-10">{formatCurrency(savings5Years)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Grafico */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 font-montserrat">Projeção de Custos a Longo Prazo</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium font-montserrat">Comparativo entre softwares comerciais (licenciamento) e o Portal de Gestão de Ativos de TI</p>
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
                                    <Bar dataKey="EAV" name="Portal de Gestão de Ativos de TI" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <StaticLegend />
                    </div>

                    {/* Breakdown */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 font-montserrat">Detalhamento</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium font-montserrat">Composição dos custos anuais</p>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-white/80">Gestão de Ativos</span>
                                    </div>
                                    <span className="text-sm font-poppins font-black text-slate-800 dark:text-white">{formatCurrency(marketRMM)}</span>
                                </div>
                                <p className="font-montserrat text-[10px] text-slate-500 dark:text-white/40 font-medium mt-1 font-montserrat">
                                    Referência: ManageEngine Endpoint Central (Professional Cloud)<br/>
                                    Custo Base Calculado: <strong className="text-slate-700 dark:text-white/80">{formatCurrency(marketRMM)} / ano</strong> <span className="opacity-70">(Média de {formatCurrency(marketRMM / endpoints)} por máquina na tier atual)</span>
                                </p>
                            </div>

                            <div className="h-px w-full bg-slate-200 dark:bg-white/5"></div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Network size={16} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700 dark:text-white/80">Acesso Remoto T.I</span>
                                    </div>
                                    <span className="text-sm font-poppins font-black text-slate-800 dark:text-white">{formatCurrency(teamViewerCost)}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-white/40 font-medium mt-2 space-y-1">
                                    <p>
                                        • TeamViewer Corporate (500 unid): <strong className="text-slate-700 dark:text-white/80">{formatCurrency(teamViewerCost)} fixo/ano</strong>
                                    </p>
                                    <p>
                                        • AnyDesk Advanced (2 canais/1000 unid): <strong className="text-slate-700 dark:text-white/80">{formatCurrency(4405.44)} fixo/ano</strong>
                                    </p>
                                    <p className="pt-1 opacity-70 italic">* O cálculo de projeção utiliza o TeamViewer como referência comercial.</p>
                                    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                        <p className="text-indigo-600 dark:text-indigo-400 font-bold mb-1">Nota de Escala:</p>
                                        <p className="text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed">
                                            As barras de Acesso Remoto mantêm-se constantes (estáticas) independentemente do volume no simulador, pois seu modelo de licenciamento é cobrado por <strong className="text-indigo-600 dark:text-indigo-400">Técnico de TI</strong> (conexões simultâneas), e não por volume de computadores (endpoints).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/5 mt-8">
                                <div className="flex justify-between items-center">
                                    <span className="font-montserrat text-xs font-poppins font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Custo Total / Ano</span>
                                    <span className="text-xl font-poppins font-black text-rose-500">{formatCurrency(marketTotal)}</span>
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
                                <h3 className="text-sm font-black text-amber-900 dark:text-amber-500 uppercase tracking-widest font-montserrat">Roteiro de Apresentação (TI)</h3>
                                <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-500/60 mt-0.5 font-montserrat">Tópicos e gatilhos mentais para usar durante a reunião com a diretoria</p>
                            </div>
                        </div>
                        {showNotes ? <ChevronUp size={20} className="text-amber-600" /> : <ChevronDown size={20} className="text-amber-600" />}
                    </button>
                    
                    {showNotes && (
                        <div className="px-6 pb-6 pt-2 border-t border-amber-200/50 dark:border-amber-500/10">
                            <ul className="space-y-4 mt-4">
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-poppins font-black">1.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium font-montserrat">
                                        <strong className="text-amber-900 dark:text-amber-400">Contexto da Dor:</strong> "Hoje, o mercado cobra em dólar e por dispositivo para gerenciar TI. Se fôssemos contratar soluções profissionais como ManageEngine e TeamViewer Corporate, nosso custo cresceria proporcionalmente a cada novo notebook comprado."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-poppins font-black">2.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium font-montserrat">
                                        <strong className="text-amber-900 dark:text-amber-400">A Solução Interna (Portal de Gestão de Ativos de TI):</strong> "Em vez de alugar software, nós construímos a nossa própria plataforma centralizada (Portal de Gestão de Ativos de TI). Ela faz o mesmo que as gigantes de mercado, mas com licenciamento ilimitado."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-poppins font-black">3.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium font-montserrat">
                                        <strong className="text-amber-900 dark:text-amber-400">Ação Interativa (Demonstração):</strong> <i className="opacity-70">(Mova o slider neste momento)</i> "Vejam o que acontece se dobrarmos de tamanho. O custo de mercado explode. O nosso custo se mantém em R$ 0 de licenciamento. A economia projetada em 5 anos paga dezenas de equipamentos novos."
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-amber-500 font-poppins font-black">4.</span>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/70 font-medium font-montserrat">
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
