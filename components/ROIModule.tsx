import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart2, HardDrive, Network, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ROIModuleProps {
    onBack: () => void;
}

export function ROIModule({ onBack }: ROIModuleProps) {
    // Slider values
    const [endpoints, setEndpoints] = useState<number>(150);

    // Market Costs Reference
    const rmmCostPerDevice = 198; // R$ 198 / year per device (approx US$ 36 * 5.50)
    const teamViewerCost = 4800; // R$ 4800 / year (fixed)
    
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
                                className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium">Equivalente a ManageEngine/NinjaOne (US$ 36/dispositivo)</p>
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
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium">Equivalente a licença TeamViewer Premium</p>
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

            </div>
        </div>
    );
}
