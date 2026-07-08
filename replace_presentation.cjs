const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ROIModule.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The replacement logic
const newSlideContent = `
    const renderSlideContent = () => {
        switch(currentSlide) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in p-8 relative">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-[#5b8a36] rounded-br-full opacity-20 -z-10 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#a63429] rounded-tl-full opacity-20 -z-10 blur-3xl"></div>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-[#214478] max-w-5xl leading-[1.1]">
                            Evolução e Independência Tecnológica: <br/><span className="text-[#a63429]">O Impacto do Portal de Gestão de Ativos de TI</span>
                        </h1>
                        <div className="w-24 h-2 bg-[#e3b23c] rounded-full my-8"></div>
                        <div className="flex flex-col items-center">
                            <p className="text-3xl font-black text-[#592c2b]">Erisson Ribeiro de Souza Junior</p>
                            <p className="text-xl font-bold text-slate-600 mt-2">Analista de Suporte II</p>
                            <p className="text-sm text-[#70508a] mt-2 uppercase tracking-[0.2em] font-black bg-[#70508a]/10 px-4 py-2 rounded-lg border border-[#70508a]/20">
                                Ayko / Outsourcing - Escola Americana de Vitória
                            </p>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8 relative z-10">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-[#a63429] mb-4">1. O Desafio de Mercado</h2>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium">O alto custo das ferramentas tradicionais de prateleira (SaaS).</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-[#a63429]/20 shadow-xl relative overflow-hidden flex flex-col">
                                <HardDrive size={40} className="text-[#a63429] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3">Gestão de Ativos (RMM)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1">Soluções profissionais (ManageEngine / NinjaOne) cobram licenças individuais por dispositivo.</p>
                                <div className="p-5 bg-[#a63429]/10 rounded-2xl border border-[#a63429]/20">
                                    <p className="text-[10px] text-[#a63429] uppercase font-black tracking-widest mb-1">ManageEngine Cloud Prof.</p>
                                    <p className="text-3xl font-black text-[#a63429] mb-3">US$ 6.545,00<span className="text-lg text-[#a63429]/70 font-bold"> / ano</span></p>
                                    <span className="text-[10px] xl:text-xs text-[#a63429] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Para ~300 computadores</span>
                                </div>
                            </div>
                            
                            <div className="bg-white p-8 rounded-[2rem] border border-[#e3b23c]/40 shadow-xl relative overflow-hidden flex flex-col">
                                <Network size={40} className="text-[#e3b23c] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3">Acesso Remoto (TeamViewer)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1">Acesso desacompanhado com cobrança por conexões simultâneas.</p>
                                <div className="p-5 bg-[#e3b23c]/10 rounded-2xl border border-[#e3b23c]/20">
                                    <p className="text-[10px] text-[#e3b23c] uppercase font-black tracking-widest mb-1">Plano Corporate</p>
                                    <p className="text-3xl font-black text-[#e3b23c] mb-3">R$ 6.802,80<span className="text-lg text-[#e3b23c]/70 font-bold"> / ano</span></p>
                                    <span className="text-[10px] xl:text-xs text-[#e3b23c] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Até 3 conexões simultâneas</span>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2rem] border border-[#70508a]/20 shadow-xl relative overflow-hidden flex flex-col">
                                <Network size={40} className="text-[#70508a] mb-6" />
                                <h3 className="text-2xl font-black text-[#214478] mb-3">Acesso Remoto (AnyDesk)</h3>
                                <p className="text-base text-slate-600 mb-6 font-medium leading-relaxed flex-1">Alternativa comercial com limite de dispositivos gerenciados.</p>
                                <div className="p-5 bg-[#70508a]/10 rounded-2xl border border-[#70508a]/20">
                                    <p className="text-[10px] text-[#70508a] uppercase font-black tracking-widest mb-1">Plano Advanced</p>
                                    <p className="text-3xl font-black text-[#70508a] mb-3">R$ 4.405,00<span className="text-lg text-[#70508a]/70 font-bold"> / ano</span></p>
                                    <span className="text-[10px] xl:text-xs text-[#70508a] font-medium bg-white/50 px-3 py-1.5 rounded-lg w-fit">Licença para 2 conexões</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col justify-center h-full max-w-6xl mx-auto space-y-12 animate-fade-in w-full px-8 relative z-10">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-[#5b8a36] mb-4">2. A Solução: Portal de Gestão de Ativos de TI</h2>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium">Centralização e independência total através de desenvolvimento próprio.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <HardDrive size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4">Inventário Ilimitado</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Gestão de centenas de endpoints sem adicionar custos fixos por máquina na fatura da escola.</p>
                            </div>
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <Activity size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4">Telemetria Real-time</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Monitoramento online/offline integrado através do nosso próprio serviço cliente (RMM Service).</p>
                            </div>
                            <div className="bg-white p-10 rounded-[2rem] border border-[#5b8a36]/30 text-center shadow-xl hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-20 h-20 bg-[#5b8a36]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-[#5b8a36]">
                                    <Network size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-[#214478] mb-4">Acesso Remoto Nativo</h3>
                                <p className="text-slate-600 font-medium leading-relaxed">Integração de motor open-source para acesso direto. Dispensa assinaturas do TeamViewer ou AnyDesk.</p>
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
                            <h2 className="text-4xl md:text-5xl font-black text-[#214478] mb-4">3. Simulador de Economia e ROI</h2>
                            <p className="text-xl text-slate-600 font-medium">Arraste o controle para simular o crescimento do parque tecnológico.</p>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-xl flex flex-col md:flex-row gap-16 items-center mb-10 shrink-0">
                            <div className="flex-1 w-full">
                                <h2 className="text-3xl font-black text-[#214478] mb-8">Volume (Endpoints)</h2>
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
                                <span className="text-7xl font-black text-[#214478] leading-none">{endpoints}</span>
                                <span className="text-sm font-black uppercase tracking-widest text-[#214478]/50 mt-3">Equipamentos</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 shrink-0">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
                                <h3 className="text-2xl font-black text-[#214478] mb-8">Comparativo (5 Anos)</h3>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14, fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => \`R$ \${val/1000}k\`} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} />
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
                                    <h3 className="text-base font-black text-white/80 uppercase tracking-widest mb-4 relative z-10">Economia Total Projetada (5 Anos)</h3>
                                    <p className="text-6xl md:text-7xl font-black text-white tracking-tighter relative z-10 mb-4">{formatCurrency(savings5Years)}</p>
                                    <div className="w-16 h-1 bg-white/50 rounded-full mb-6 relative z-10"></div>
                                    <p className="text-lg text-white/90 relative z-10 max-w-md font-medium leading-relaxed mb-6">
                                        Dinheiro que permanece no caixa da instituição e pode ser reinvestido em melhorias físicas, laboratórios e novos computadores.
                                    </p>
                                    <div className="relative z-10 p-4 bg-white/10 rounded-xl border border-white/20">
                                        <p className="text-xs text-white/80 font-medium">
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
                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-[#214478] leading-[1.2]">
                            A tecnologia como <br/><span className="text-[#e3b23c]">acelerador de resultados</span>.
                        </h2>
                        <div className="w-32 h-2 bg-[#a63429] rounded-full my-8"></div>
                        <p className="text-2xl text-slate-700 leading-relaxed font-medium">
                            Construímos um portal com <strong className="text-[#214478] font-black">Escalabilidade Infinita</strong>. A instituição pode dobrar ou triplicar o número de equipamentos e a nossa fundação tecnológica irá acompanhar esse crescimento nativamente, sem reajustes, limites ou licenciamentos adicionais.
                        </p>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in max-w-5xl mx-auto px-8 relative z-10">
                        <h2 className="text-7xl font-black text-[#214478] tracking-tight mb-12">Muito Obrigado.</h2>
                        
                        <div className="bg-white p-8 rounded-3xl border border-[#214478]/10 mt-12 w-full max-w-xl text-left flex items-center gap-6 shadow-2xl relative">
                            <div className="w-20 h-20 bg-[#214478]/10 rounded-2xl flex items-center justify-center text-[#214478] font-black text-3xl border border-[#214478]/20 shrink-0">
                                ER
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#214478] mb-1">Erisson Ribeiro de Souza Junior</h3>
                                <p className="text-[#a63429] font-medium uppercase tracking-widest text-xs mb-4">Analista de Suporte II</p>
                                <span className="text-xs bg-[#5b8a36]/10 text-[#5b8a36] px-3 py-1.5 rounded-lg border border-[#5b8a36]/20 font-bold">Ayko / Outsourcing - Escola Americana de Vitória</span>
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
                <style>{\`
                    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                    .custom-scrollbar::-webkit-scrollbar { width: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                \`}</style>
                
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
                        <span className="font-black text-xl text-[#214478] tracking-wide">Apresentação Executiva</span>
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
                                className={\`h-2.5 rounded-full transition-all duration-500 \${currentSlide === idx ? 'w-16 bg-[#214478] shadow-md' : 'w-3 bg-slate-300'}\`}
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
                        <span className="font-black text-slate-500 text-lg w-20 text-center tracking-widest">
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
    }`;

// Replace the entire renderSlideContent and isPresentation block
const startPattern = /const renderSlideContent = \(\) => \{[\s\S]*?if \(isPresentation\) \{[\s\S]*?return \([\s\S]*?<\/div>\r?\n\s*\);\r?\n\s*\}/;

if (!startPattern.test(content)) {
    console.log("Could not find the target block to replace.");
    process.exit(1);
}

content = content.replace(startPattern, newSlideContent.trim());
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully replaced presentation code.");
