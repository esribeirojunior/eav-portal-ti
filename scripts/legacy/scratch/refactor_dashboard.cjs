const fs = require('fs');
let txt = fs.readFileSync('components/Dashboard.tsx', 'utf-8');

const newContent = `import React from 'react';
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
  Monitor
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
}

export const Dashboard: React.FC<Props> = ({ stats, devices }) => {
  const maintenanceCount = devices.filter(d => d.status === DeviceStatus.MAINTENANCE).length;

  const pieData = [
    { name: 'Em Estoque', value: stats.available, color: '#10b981' },
    { name: 'Em Uso', value: stats.inUse, color: '#6366f1' },
    { name: 'Manutenção', value: maintenanceCount, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const categoryData = Object.values(DeviceType).map(type => ({
    name: type,
    value: devices.filter(d => d.type === type).length
  })).filter(d => d.value > 0);

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case DeviceType.NOTEBOOK:
      case DeviceType.MACBOOK:
      case DeviceType.CHROMEBOOK:
        return <Laptop size={14} />;
      case DeviceType.HEADSET:
        return <Headphones size={14} />;
      case DeviceType.MOUSE:
        return <MousePointer size={14} />;
      case DeviceType.KEYBOARD:
        return <Keyboard size={14} />;
      default:
        return <Monitor size={14} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Total no Catálogo" 
            value={stats.total} 
            subtitle="Itens de patrimônio distintos"
            icon={<Package />} 
            borderColor="card-border-dark" 
            iconBgColor="bg-slate-100 dark:bg-slate-800"
            iconTextColor="text-slate-600 dark:text-white"
            valueColor="text-slate-800 dark:text-white"
        />
        <StatCard 
            label="Unidades Livres" 
            value={stats.available} 
            subtitle="Disponíveis para check-out"
            icon={<CheckCircle />} 
            borderColor="card-border-green" 
            iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            iconTextColor="text-emerald-500"
            valueColor="text-emerald-500"
            secondaryValue={\` / \${stats.total}\`}
        />
        <StatCard 
            label="Em Manutenção" 
            value={maintenanceCount} 
            subtitle="Inoperantes ou calibrando"
            icon={<Hammer />} 
            borderColor="card-border-red" 
            iconBgColor="bg-red-50 dark:bg-red-900/20"
            iconTextColor="text-red-500"
            valueColor="text-red-500"
        />
        <StatCard 
            label="Abaixo do Limite" 
            value={stats.total > 0 ? (stats.available < stats.total * 0.25 ? 1 : 0) : 0} 
            subtitle="Abaixo de 25% do estoque"
            icon={<AlertTriangle />} 
            borderColor="card-border-yellow" 
            iconBgColor="bg-amber-50 dark:bg-amber-900/20"
            iconTextColor="text-amber-500"
            valueColor="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Card */}
        <div className="bg-white dark:bg-[#14152e] p-6 md:p-8 rounded-[1.5rem] border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Package size={16} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Volume por Categoria</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Distribuição de unidades agrupadas</p>

          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                    {categoryData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={
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

        {/* Pie Chart Card */}
        <div className="bg-white dark:bg-[#14152e] p-6 md:p-8 rounded-[1.5rem] border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-sm">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">Saúde e Estado Geral</h3>
          <p className="text-xs text-slate-500 dark:text-white/40 mb-8 font-medium">Classificação métrica das unidades</p>

          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-[900] text-slate-800 dark:text-white">{stats.total}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Estoque Total</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-6 relative z-10">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{item.name}</span>
                <span className="text-[11px] font-black text-slate-700 dark:text-white ml-1">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, secondaryValue = '', subtitle, icon, borderColor, iconBgColor, iconTextColor, valueColor }: any) => (
  <div className={\`p-6 rounded-2xl bg-white dark:bg-[#14152e] border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-white/5 dark:border-r-white/5 transition-all flex flex-col justify-between shadow-sm group hover:-translate-y-1 active:translate-y-0 duration-300 relative overflow-hidden \${borderColor}\`}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">{label}</p>
        <div className="flex items-baseline">
            <p className={\`text-3xl font-[900] tracking-tighter leading-none \${valueColor}\`}>{value}</p>
            {secondaryValue && <span className="text-sm font-bold text-slate-400 dark:text-white/30 ml-1">{secondaryValue}</span>}
        </div>
      </div>
      <div className={\`w-10 h-10 rounded-xl flex items-center justify-center \${iconBgColor} \${iconTextColor}\`}>
        {React.cloneElement(icon as any, { size: 20 })}
      </div>
    </div>
    <div className="text-[10px] font-semibold text-slate-400 dark:text-white/30">
        {subtitle}
    </div>
  </div>
);
`;

fs.writeFileSync('components/Dashboard.tsx', newContent);
console.log('Dashboard.tsx replaced completely.');
