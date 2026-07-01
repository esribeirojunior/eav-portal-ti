import React from 'react';
import { Device, DeviceStatus, DeviceType } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Package,
  CheckCircle,
  Hammer,
  AlertTriangle,
  Laptop,
  Headphones,
  MousePointer,
  Keyboard,
  Monitor,
  FileUp,
  FileDown,
  MapPin,
  Building2,
  Activity,
  BatteryCharging,
  Clock,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';

interface Props {
  stats: {
    total: number;
    available: number;
    inUse: number;
  };
  devices: Device[];
  onBack: () => void;
  userEmail: string;
  onLogout: () => void;
  onImportClick?: () => void;
  onExportClick?: () => void;
  userRole?: string;
}

export const Dashboard: React.FC<Props> = ({ stats, devices, onImportClick, onExportClick, userRole }) => {
  const maintenanceCount = devices.filter(d => d.status === DeviceStatus.MAINTENANCE).length;

  // 1. Dados do Gráfico de Saúde e Estado Geral
  const pieData = [
    { name: 'Em Estoque', value: stats.available, color: '#10b981' },
    { name: 'Em Uso', value: stats.inUse, color: '#6366f1' },
    { name: 'Manutenção', value: maintenanceCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // 2. Volume de Equipamentos por Categoria (Gráfico de Barras)
  const categoryData = Object.values(DeviceType).map(type => ({
    name: type,
    value: devices.filter(d => d.type === type).length
  })).filter(d => d.value > 0);

  // 3. Distribuição por Campus (Álvares vs Aeroporto)
  const alvaresCount = devices.filter(d => d.currentAssignment?.campus === 'Álvares').length;
  const aeroportoCount = devices.filter(d => d.currentAssignment?.campus === 'Aeroporto').length;
  const ambosCount = devices.filter(d => d.currentAssignment?.campus === 'Álvares / Aeroporto').length;
  const inStockNoCampus = stats.total - alvaresCount - aeroportoCount - ambosCount;

  // 4. Setores/Departamentos com Mais Equipamentos Ativos
  const deptMap: Record<string, number> = {};
  devices.forEach(d => {
    if (d.status === DeviceStatus.IN_USE && d.department) {
      const name = d.department.trim();
      if (name && name !== '-') {
        deptMap[name] = (deptMap[name] || 0) + 1;
      }
    }
  });
  const topDepartments = Object.entries(deptMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 5. Histórico de Atividades Recentes (Últimas 5 atribuições/devoluções)
  const recentActivities = devices
    .flatMap(d => (d.history || []).map(a => ({
      ...a,
      deviceTag: d.tag,
      deviceModel: d.model,
      deviceType: d.type
    })))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  // 6. Saúde Média da Bateria (Dados coletados via RMM)
  let batteryCount = 0;
  let batterySum = 0;
  let wearAlertCount = 0;

  devices.forEach(d => {
    if (d.condition && d.condition.includes('Desgaste:')) {
      const match = d.condition.match(/Desgaste:\s*(\d+(\.\d+)?)/);
      if (match) {
        const wear = parseFloat(match[1]);
        batterySum += (100 - wear);
        batteryCount++;
        if (wear > 40) wearAlertCount++;
      }
    }
  });
  const avgBatteryHealth = batteryCount > 0 ? Math.round(batterySum / batteryCount) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Menu Superior do Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-400 dark:border-white/5 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Estatísticas e Relatórios</h2>
          <p className="text-[10px] font-bold text-slate-800 dark:text-white/40 uppercase tracking-widest mt-1">Visão analítica completa do inventário</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {userRole !== 'viewer' && (
            <>
              <button 
                onClick={onImportClick}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-white rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95"
              >
                <FileUp size={16} />
                Importar
              </button>
              <button 
                onClick={onExportClick}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                <FileDown size={16} />
                Exportar CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Total no Catálogo" 
            value={stats.total} 
            subtitle="Itens de patrimônio registrados"
            icon={<Package />} 
            borderColor="card-border-dark" 
            iconBgColor="bg-slate-100 dark:bg-slate-800"
            iconTextColor="text-slate-800 dark:text-white"
            valueColor="text-slate-800 dark:text-white"
        />
        <StatCard 
            label="Unidades Livres" 
            value={stats.available} 
            subtitle="Disponíveis para empréstimo"
            icon={<CheckCircle />} 
            borderColor="card-border-green" 
            iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            iconTextColor="text-emerald-500"
            valueColor="text-emerald-500"
            secondaryValue={` / ${stats.total}`}
        />
        <StatCard 
            label="Em Manutenção" 
            value={maintenanceCount} 
            subtitle="Equipamentos sob reparo"
            icon={<Hammer />} 
            borderColor="card-border-red" 
            iconBgColor="bg-red-50 dark:bg-red-900/20"
            iconTextColor="text-red-500"
            valueColor="text-red-500"
        />
        <StatCard 
            label="Alertas de Hardware" 
            value={wearAlertCount} 
            subtitle="Dispositivos com bateria fraca"
            icon={<AlertTriangle />} 
            borderColor="card-border-yellow" 
            iconBgColor="bg-amber-50 dark:bg-amber-900/20"
            iconTextColor="text-amber-500"
            valueColor="text-amber-500"
        />
      </div>

      {/* Linha 2: Distribuição por Campus & Saúde de Bateria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card: Distribuição por Campus */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <MapPin size={16} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Alocação por Campus</h3>
            </div>
            <p className="text-xs text-slate-800 dark:text-white/40 mb-6 font-medium">Equipamentos ativos em cada unidade</p>
          </div>

          <div className="space-y-5">
            {/* Campus Álvares */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-indigo-500" /> Campus Álvares</span>
                <span>{alvaresCount} ativos ({stats.total > 0 ? Math.round((alvaresCount / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (alvaresCount / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Campus Aeroporto */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-emerald-500" /> Campus Aeroporto</span>
                <span>{aeroportoCount} ativos ({stats.total > 0 ? Math.round((aeroportoCount / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (aeroportoCount / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Ambos os Campi */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-purple-500" /> Álvares / Aeroporto</span>
                <span>{ambosCount} ativos ({stats.total > 0 ? Math.round((ambosCount / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (ambosCount / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Sem campus (Disponível/Reserva) */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                <span>Reserva / Em Estoque</span>
                <span>{inStockNoCampus} ativos ({stats.total > 0 ? Math.round((inStockNoCampus / stats.total) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (inStockNoCampus / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Saúde Média de Bateria (RMM) */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <BatteryCharging size={16} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Saúde das Baterias</h3>
            </div>
            <p className="text-xs text-slate-800 dark:text-white/40 mb-6 font-medium">Capacidade média dos notebooks (RMM)</p>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            {avgBatteryHealth !== null ? (
              <>
                <div className="relative flex items-center justify-center">
                  <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{avgBatteryHealth}%</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-500 text-center mt-3 font-semibold">
                  Saúde média calculada sobre {batteryCount} computadores ativos.
                </p>
                {wearAlertCount > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-rose-500 bg-rose-500/10 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider">
                    <AlertTriangle size={14} />
                    {wearAlertCount} máquinas requerem troca
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-700 dark:text-white/20">
                <BatteryCharging size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-wider">Nenhum dado RMM coletado</p>
                <p className="text-[10px] text-slate-800 dark:text-white/30 mt-1 max-w-[200px]">Rode o Agente Universal VNC nas máquinas dos usuários para coletar telemetria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Card: Setores mais Equipados */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Building2 size={16} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Uso por Setor</h3>
            </div>
            <p className="text-xs text-slate-800 dark:text-white/40 mb-6 font-medium">Departamentos com mais equipamentos em custódia</p>
          </div>

          <div className="space-y-3.5">
            {topDepartments.length > 0 ? (
              topDepartments.map((dept, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-800">{index + 1}</span>
                    {dept.name}
                  </span>
                  <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-950/20">{dept.value} un</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-700 dark:text-white/20">
                <p className="text-xs font-bold uppercase tracking-wider">Nenhum setor alocado</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Linha 3: Gráficos de Categorias & Saúde Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras: Volume por Categoria */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Package size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Volume por Categoria</h3>
          </div>
          <p className="text-xs text-slate-800 dark:text-white/40 mb-8 font-medium">Distribuição de unidades agrupadas no catálogo</p>

          <div className="h-64 w-full" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} width={90} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '12px', outline: 'none' }} 
                  formatter={(value: number) => [value, 'Quantidade']}
                />
                <Bar dataKey="value" name="Quantidade" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
                    {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                        index % 4 === 0 ? '#10b981' : 
                        index % 4 === 1 ? '#6366f1' : 
                        index % 4 === 2 ? '#f59e0b' : '#a855f7'
                    } />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza/Rosca: Saúde e Estado Geral */}
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                <Activity size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Estado Geral do Estoque</h3>
          </div>
          <p className="text-xs text-slate-800 dark:text-white/40 mb-8 font-medium">Classificação e divisão métrica das unidades</p>

          <div className="h-64 w-full relative" style={{ outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.75rem', color: '#fff', outline: 'none' }} 
                  formatter={(value: number) => [value, 'Quantidade']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto Central da Rosca */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-[900] text-slate-800 dark:text-white tracking-tighter leading-none">{stats.total}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-800 dark:text-white/40 mt-1">Total de Ativos</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white/40">{item.name}</span>
                <span className="text-[11px] font-black text-slate-700 dark:text-white ml-1">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Linha 4: Histórico de Atividades Recentes */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-400 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
            <Clock size={16} />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">Movimentação Recente</h3>
        </div>
        <p className="text-xs text-slate-800 dark:text-white/40 mb-6 font-medium">Últimos registros de atribuição e devolução no painel</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-400 dark:border-white/5 text-slate-700 dark:text-white/30 uppercase tracking-wider font-black text-[10px]">
                <th className="pb-3 text-left">Ativo (Tag)</th>
                <th className="pb-3 text-left">Equipamento</th>
                <th className="pb-3 text-left">Responsável</th>
                <th className="pb-3 text-left">Campus</th>
                <th className="pb-3 text-left">Data</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 dark:divide-white/5 text-slate-700 dark:text-white/80">
              {recentActivities.length > 0 ? (
                recentActivities.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="py-3.5 font-mono font-bold text-slate-800 dark:text-white">{act.deviceTag}</td>
                    <td className="py-3.5 font-semibold">{act.deviceModel} ({act.deviceType})</td>
                    <td className="py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{act.userName}</td>
                    <td className="py-3.5 text-slate-800 dark:text-slate-500">{act.campus || 'N/A'}</td>
                    <td className="py-3.5 text-slate-800 dark:text-slate-500">
                      {new Date(act.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`status-badge ${act.endDate ? 'status-badge-disponivel' : 'status-badge-em-uso'}`}>
                        {act.endDate ? 'Devolvido' : 'Custódia Ativa'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-700 dark:text-white/20 font-bold uppercase tracking-wider">
                    Nenhuma movimentação registrada no histórico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ label, value, secondaryValue = '', subtitle, icon, borderColor, iconBgColor, iconTextColor, valueColor }: any) => (
  <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-400 dark:border-white/5 transition-all flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 active:translate-y-0 duration-300 relative overflow-hidden ${borderColor}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white/40">{label}</p>
        <div className="flex items-baseline">
            <p className={`text-3xl font-[900] tracking-tighter leading-none ${valueColor}`}>{value}</p>
            {secondaryValue && <span className="text-sm font-bold text-slate-700 dark:text-white/30 ml-1">{secondaryValue}</span>}
        </div>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColor} ${iconTextColor}`}>
        {React.cloneElement(icon as any, { size: 20 })}
      </div>
    </div>
    <div className="text-[10px] font-semibold text-slate-700 dark:text-white/30">
        {subtitle}
    </div>
  </div>
);
