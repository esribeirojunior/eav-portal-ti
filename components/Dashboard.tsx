import React from 'react';
import { Device, DeviceStatus, DeviceType } from '../types';
import { UserProfile } from './UserProfile';
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
  Clock,
  ChevronLeft,
  Download,
  Hammer,
  Laptop,
  Headphones,
  MousePointer,
  Keyboard,
  Settings,
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

export const Dashboard: React.FC<Props> = ({ stats, devices, onBack, userEmail, onLogout }) => {
  const maintenanceCount = devices.filter(d => d.status === DeviceStatus.MAINTENANCE).length;

  const pieData = [
    { name: 'Em Estoque', value: stats.available, color: '#10b981' },
    { name: 'Em Uso', value: stats.inUse, color: '#6366f1' },
    { name: 'Manutenção', value: maintenanceCount, color: '#f59e0b' },
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

  const handleDownloadCSV = () => {
    const headers = ['Patrimonio', 'Modelo', 'Serie', 'Categoria', 'Status', 'Responsavel'];
    const rows = devices.map(d => [
      d.tag,
      d.model,
      d.serialNumber || 'N/A',
      d.type,
      d.status,
      d.currentAssignment?.userName || 'ESTOQUE'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_eav_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-white/40 active:scale-90 border border-white/5"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-[900] uppercase tracking-tighter text-white">Estatísticas</h2>
            <p className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Visão Geral da Operação TI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserProfile
            userEmail={userEmail}
            onLogout={onLogout}
          />
          <button
            onClick={handleDownloadCSV}
            className="group flex items-center justify-center gap-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-8 py-5 rounded-2xl border border-indigo-600/20 transition-all font-black text-[11px] uppercase tracking-widest active:scale-95"
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            Exportar Inventário
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Geral" value={stats.total} icon={<Package />} color="from-blue-600/20 to-transparent border-blue-500/20" />
        <StatCard label="Em Estoque" value={stats.available} icon={<CheckCircle />} color="from-emerald-600/20 to-transparent border-emerald-500/20" textColor="text-emerald-400" />
        <StatCard label="Em Uso" value={stats.inUse} icon={<Clock />} color="from-indigo-600/20 to-transparent border-indigo-500/20" textColor="text-indigo-400" />
        <StatCard label="Manutenção" value={maintenanceCount} icon={<Hammer />} color="from-orange-600/20 to-transparent border-orange-500/20" textColor="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pie Chart Card */}
        <div className="bg-[#14152e]/60 p-8 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-12 text-center relative z-10">Status de Disponibilidade</h3>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1d3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-8 relative z-10">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.name}</span>
                <span className="text-[12px] font-black text-white ml-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-[#14152e]/60 p-8 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-12 text-center relative z-10">Ativos por Categoria</h3>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 900 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#1c1d3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', padding: '1rem' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8 relative z-10">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-white/20">{getCategoryIcon(cat.name)}</span>
                <span className="text-[9px] font-black uppercase text-white/40">{cat.name}</span>
                <span className="text-[10px] font-black text-indigo-400 ml-1">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, textColor = "text-white" }: { label: string, value: number, icon: React.ReactNode, color: string, textColor?: string }) => (
  <div className={`p-8 md:p-10 rounded-[2.5rem] border bg-gradient-to-br transition-all flex flex-col items-center text-center shadow-2xl group hover:scale-[1.02] active:scale-[0.98] duration-300 ${color}`}>
    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-white/20 group-hover:text-white/60 group-hover:bg-white/10 transition-all duration-500">
      {React.cloneElement(icon as any, { size: 24 })}
    </div>
    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">{label}</p>
    <p className={`text-4xl md:text-5xl font-[900] tracking-tighter leading-none ${textColor}`}>{value}</p>
  </div>
);
