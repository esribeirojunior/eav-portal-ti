import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart2, HardDrive, Network, X, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ROIModuleProps {
    onBack: () => void;
}

export function ROIModule({ onBack }: ROIModuleProps) {
    // Slider values
    const [endpoints, setEndpoints] = useState<number>(150);
    const [showNotes, setShowNotes] = useState<boolean>(false);

    // Market Costs Reference
    const rmmCostPerDevice = 72; // R$ 72 / year per device (approx US$ 13.09 * 5.50 based on the $6545/500 tier)
    const teamViewerCost = 6802.80; // R$ 6802,80 / year (TeamViewer Corporate)
    
    // Calculated Costs
    const marketRMM = endpoints * rmmCostPerDevice;
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
            EAV: eavCost,
        },
        {
            name: 'Ano 3',
            Mercado: marketTotal * 3,
            EAV: eavCost,
        },
        {
            name: 'Ano 5',
            Mercado: marketTotal * 5,
            EAV: eavCost,
        },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-[#0c0d21] overflow-y-auto custom-scrollbar">
            {/* Cabecalho Principal */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/60">
                        <X size={20} />
                    </button>
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Economia e ROI</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-white/40 mt-1">Impacto financeiro do EAV Portal comparado ao mercado (ManageEngine, TeamViewer, etc)</p>
                    </div>
                </div>
            </div>

            <div className="px-8 pb-8 space-y-6">
                
                {/* Texto Explicativo */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                    <h2 className="text-lg font-black text-indigo-900 dark:text-indigo-400 mb-2">Entendendo este Painel de Economia</h2>
                    <p className="text-sm font-medium text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                        Este módulo demonstra o Retorno Sobre o Investimento (ROI) gerado pelo uso do EAV Portal. 
                        No mercado atual de TI corporativa, ferramentas profissionais de Gestão de Ativos e RMM (como ManageEngine, NinjaOne ou Lansweeper) 
                        cobram licenças em dólar baseadas no número de computadores monitorados. Além disso, o suporte remoto por múltiplos técnicos requer licenças 
                        à parte (como TeamViewer Premium). 
                        <br/><br/>
                        O sistema interno desenvolvido para a Escola EAV engloba inventário ilimitado, telemetria automatizada e conexão remota VNC nativa 
                        em um único ecossistema centralizado. 
                        <br/><br/>
                        <strong className="text-indigo-900 dark:text-indigo-300">Construído para o Crescimento Futuro:</strong> A arquitetura própria isenta a instituição de qualquer custo com licenciamento externo por dispositivo, permitindo que a escola aumente 
                        o seu parque tecnológico indefinidamente sem gerar novos boletos de software para o departamento de TI. A escalabilidade financeira do EAV Portal é infinita.
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
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Comparativo entre softwares comerciais (licenciamento) e o EAV Portal</p>
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
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} />
                                    <Bar dataKey="Mercado" name="Mercado (UEM + VNC)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                                    <Bar dataKey="EAV" name="EAV Portal" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
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
                                        <strong className="text-amber-900 dark:text-amber-400">A Solução Interna (EAV Portal):</strong> "Em vez de alugar software, nós construímos a nossa própria plataforma centralizada (EAV Portal). Ela faz o mesmo que as gigantes de mercado, mas com licenciamento ilimitado."
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
