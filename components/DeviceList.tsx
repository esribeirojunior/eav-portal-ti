import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Smartphone,
  Laptop,
  HardDrive,
  History,
  RefreshCw,
  CheckCircle2,
  User,
  Building,
  Headset,
  MousePointer,
  Keyboard,
  ChevronRight,
  LayoutDashboard,
  FileDown,
  FileUp,
  Trash2
} from 'lucide-react';
import { ImportModal } from './ImportModal';
import { SectorDetailModal } from './SectorDetailModal';
import { RmmStatusModal } from './RmmStatusModal';
import { Activity } from 'lucide-react';

const SECTOR_CONFIGS: Record<string, { color: string; icon: string; subtitle: string }> = {
  'COORDENAÇÃO': { color: '#667eea', icon: '💼', subtitle: 'Gestão Administrativa' },
  'DIRETORIA': { color: '#f093fb', icon: '👥', subtitle: 'Alta Gestão' },
  'DISCENTES': { color: '#4facfe', icon: '📚', subtitle: 'Área Estudantil' },
  'FINANCEIRO': { color: '#43e97b', icon: '💰', subtitle: 'Gestão Financeira' },
  'SECRETARIA': { color: '#fa709a', icon: '📋', subtitle: 'Suporte Administrativo' },
  'SUPRIMENTOS': { color: '#fbc2eb', icon: '📦', subtitle: 'Logística e Materiais' },
  'TI': { color: '#a8edea', icon: '💻', subtitle: 'Tecnologia da Informação' },
  'RH': { color: '#ec4899', icon: '👥', subtitle: 'Recursos Humanos' },
  'DP': { color: '#db2777', icon: '👥', subtitle: 'Departamento Pessoal' },
  'ADMISSIONS': { color: '#3b82f6', icon: '🎓', subtitle: 'Admissões' },
  'MARKETING': { color: '#f97316', icon: '📣', subtitle: 'Comunicação e Marketing' },
  'GUARITA': { color: '#64748b', icon: '🛡️', subtitle: 'Segurança e Portaria' },
  'AFTER SCHOOL': { color: '#fb7185', icon: '🎒', subtitle: 'Atividades Extracurriculares' },
  'ASSISTENTE DIREÇÃO/RECEPÇÃO': { color: '#0ea5e9', icon: '📞', subtitle: 'Assistência e Recepção' },
  'BIBLIOTECA': { color: '#8b5cf6', icon: '📚', subtitle: 'Centro de Mídia e Leitura' },
  'COOD. FINANCEIRO': { color: '#34d399', icon: '💵', subtitle: 'Coordenação Financeira' },
  'DIREÇÃO': { color: '#c084fc', icon: '👔', subtitle: 'Diretoria e Gestão' },
  'RECEPÇÃO': { color: '#06b6d4', icon: '🛎️', subtitle: 'Recepção e Atendimento' },
  'MONITORES': { color: '#eab308', icon: '🧑‍🏫', subtitle: 'Monitores e Inspetores' },
  'MARKETING/ADMISSIONS': { color: '#6366f1', icon: '🤝', subtitle: 'Comunicação e Admissões' },
  'OPERAÇÃO': { color: '#84cc16', icon: '🔧', subtitle: 'Operação e Infraestrutura' },
  'NUTRIÇÃO': { color: '#f87171', icon: '🍎', subtitle: 'Nutrição e Alimentação' },
  'ENFERMARIA': { color: '#f43f5e', icon: '🩹', subtitle: 'Serviços de Saúde e Ambulatório' },
  'JURIDICO': { color: '#475569', icon: '⚖️', subtitle: 'Assessoria Jurídica' },
  'TRIAGEM': { color: '#f97316', icon: '🚧', subtitle: 'Equipamentos Novos (Aguardando Alocação)' },
  'OUTROS': { color: '#a0aec0', icon: '🏢', subtitle: 'Outros Setores' }
};

interface DeviceListProps {
  devices: any[];
  onAssign: (device: any) => void;
  onReturn: (device: any) => void;
  onHistory: (device: any) => void;
  onMaintenance: (device: any) => void;
  onDelete?: (device: any) => void;
  onEdit?: (device: any) => void;
  onRefresh?: () => void;
  searchQuery?: string;
}

export function DeviceList({
  devices,
  onAssign,
  onReturn,
  onHistory,
  onMaintenance,
  onDelete,
  onEdit,
  onRefresh,
  searchQuery
}: DeviceListProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'in_use' | 'maintenance'>('available');
  const [viewMode, setViewMode] = useState<'card' | 'shelf'>('card');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Default to card view
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [sectorsViewMode, setSectorsViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [selectedRmmDevice, setSelectedRmmDevice] = useState<any>(null);

  const availableDevices = devices.filter(d => d.status === 'Disponível');
  const inUseDevices = devices.filter(d => d.status === 'Em Uso');
  const maintenanceDevices = devices.filter(d => d.status === 'Manutenção');

  // Função de segurança para depuração
  const handleAssignClick = (device: any) => {
    if (typeof onAssign === 'function') {
      onAssign(device);
    } else {
      console.error("ERRO: A função 'onAssign' não foi recebida do App.tsx. Verifique se o arquivo App.tsx está salvo.");
      alert("Erro interno: Função de entrega não encontrada. Verifique o console.");
    }
  };

  const getIcon = (type: string) => {
    const safeType = type ? type.toLowerCase() : '';
    switch (safeType) {
      case 'notebook': return <Laptop size={20} />;
      case 'macbook': return <Laptop size={20} />;
      case 'chromebook': return <Monitor size={20} />;
      case 'monitor': return <Monitor size={20} />;
      case 'smartphone': return <Smartphone size={20} />;
      case 'tablet': return <Smartphone size={20} />;
      case 'headset':
      case 'headphones': return <Headset size={20} />;
      case 'mouse': return <MousePointer size={20} />;
      case 'keyboard': return <Keyboard size={20} />;
      case 'kit teclado/mouse':
      case 'keyboard/mouse kit':
        return (
          <div className="flex gap-0.5">
            <Keyboard size={12} />
            <MousePointer size={12} />
          </div>
        );
      default: return <HardDrive size={20} />;
    }
  };

  // --- LÓGICA DE AGRUPAMENTO (POSSE) OTIMIZADA COM useMemo ---
  const sortedSectors = useMemo(() => {
    const groups = inUseDevices.reduce((acc: any, device) => {
      const department = device.currentAssignment?.userDepartment || 'Sem Setor';
      const userName = device.currentAssignment?.userName || 'Sem Nome';

      if (!acc[department]) {
        acc[department] = { department, users: {} };
      }

      if (!acc[department].users[userName]) {
        acc[department].users[userName] = { userName, items: [] };
      }

      acc[department].users[userName].items.push(device);
      return acc;
    }, {});

    return Object.values(groups)
      .sort((a: any, b: any) => a.department.localeCompare(b.department))
      .map((sector: any) => ({
        ...sector,
        usersList: Object.values(sector.users).sort((a: any, b: any) => a.userName.localeCompare(b.userName))
      }));
  }, [inUseDevices]);

  const toggleSector = (dept: string) => {
    setExpandedSectors(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  // Renderização de Card de Dispositivo Disponível
  const renderDeviceCard = (device: any) => (
    <div key={device.id} className="glass-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-500">
      <div className="flex items-center gap-5 mb-6">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
          {getIcon(device.type)}
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">{device.model}</h3>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
            <span className="text-indigo-400/40">#{device.tag}</span> • S/N: {device.serialNumber} {device.condition && device.condition.includes('Hostname: ') && `• HOST: ${device.condition.split('Hostname: ')[1].split(' |')[0]}`}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between text-white/40 text-[11px] font-bold uppercase tracking-widest">
          <span>Tipo</span>
          <span className="opacity-60">{device.type}</span>
        </div>
        <div className="flex items-center justify-between text-white/40 text-[11px] font-bold uppercase tracking-widest">
          <span>Status</span>
          {(() => {
            const norm = device.status ? device.status.toLowerCase() : '';
            if (norm.includes('uso')) return <span className="status-badge status-badge-em-uso">EM USO</span>;
            if (norm.includes('manuten')) return <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>;
            return <span className="status-badge status-badge-disponivel">DISPONÍVEL</span>;
          })()}
        </div>
        <div className="flex items-center justify-between text-white/40 text-[11px] font-bold uppercase tracking-widest">
          <span>Categoria</span>
          <span className="opacity-60">{device.category || device.type}</span>
        </div>
        {device.condition && device.condition.includes('Sistema:') && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Monitor size={10} /> Especificações Lidas
            </p>
            <p className="text-[9px] font-bold text-white/50 leading-relaxed truncate" title={device.condition}>
              {device.condition}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3">
        <button
          onClick={() => handleAssignClick(device)}
          className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-[1000] uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 duration-300"
        >
          ENTREGAR
        </button>
        {device.condition && device.condition.includes('Sistema:') && (
          <button
            onClick={() => setSelectedRmmDevice(device)}
            className="flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 px-4 rounded-2xl transition-all border border-indigo-500/20 active:scale-95 duration-300 group/rmm"
            title="Ver Status do PC"
          >
            <Activity size={18} className="group-hover/rmm:scale-110 transition-transform" />
          </button>
        )}
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-4 rounded-2xl transition-all border border-white/5 active:scale-95 duration-300 group/hist"
          title="Ver Histórico"
        >
          <History size={18} className="group-hover/hist:rotate-[-45deg] transition-transform" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(device)}
            className="flex items-center justify-center bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 px-4 rounded-2xl transition-all border border-white/5 hover:border-rose-500/30 active:scale-95 duration-300 group/trash"
            title="Excluir Ativo"
          >
            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );

  // Renderização de Card de Dispositivo em Manutenção
  const renderMaintenanceCard = (device: any) => (
    <div key={device.id} className="glass-card p-8 rounded-[2.5rem] border border-rose-500/20 flex flex-col justify-between hover:border-rose-500/40 transition-all duration-500">
      <div className="flex items-center gap-5 mb-6">
        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
          {getIcon(device.type)}
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">{device.model}</h3>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
            <span className="text-rose-400/40">#{device.tag}</span> • S/N: {device.serialNumber} {device.condition && device.condition.includes('Hostname: ') && `• HOST: ${device.condition.split('Hostname: ')[1].split(' |')[0]}`}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between text-white/40 text-[11px] font-bold uppercase tracking-widest">
          <span>Tipo</span>
          <span className="opacity-60">{device.type}</span>
        </div>
        <div className="flex items-center justify-between text-white/40 text-[11px] font-bold uppercase tracking-widest">
          <span>Status</span>
          <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onMaintenance(device)}
          className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-[1000] uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_-5px_rgba(16,185,129,0.4)] active:scale-95 duration-300"
        >
          FINALIZAR
        </button>
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-4 rounded-2xl transition-all border border-white/5 active:scale-95 duration-300 group/hist"
        >
          <History size={18} className="group-hover/hist:rotate-[-45deg] transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 📊 BARRA DE ESTATÍSTICAS (DASHBOARD COMPACTO NO TOPO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-premium">
        {[
          { label: 'Total Setores', value: sortedSectors.length, icon: '📊', color: 'indigo' },
          { label: 'Equipamentos', value: devices.filter(d => d.status !== 'Manutenção').length, icon: '💼', color: 'emerald' },
          { label: 'Taxa Ativa', value: `${((inUseDevices.length / (devices.length || 1)) * 100).toFixed(0)}%`, icon: '✅', color: 'blue' },
          { label: 'Taxa Operacional', value: `${((availableDevices.length / (devices.length || 1)) * 100).toFixed(0)}%`, icon: '📈', color: 'purple' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-card p-4 px-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl">
              {stat.icon}
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-2xl font-[1000] text-white leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-2">
        <div className="flex gap-8 overflow-x-auto w-full md:w-auto no-scrollbar">
          {[
            { id: 'available', label: 'Estoque', count: availableDevices.length },
            { id: 'in_use', label: 'Em Uso', count: inUseDevices.length },
            { id: 'maintenance', label: 'Manutenção', count: maintenanceDevices.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 md:pb-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id
                ? 'text-white'
                : 'text-white/20 hover:text-white/40'
                }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/20'}`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-[-1px] md:bottom-[-9px] left-0 w-full h-1 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end px-2">
          {/* Export/Import Buttons */}
          {activeTab === 'available' && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5"
              title="Importar do Excel"
            >
              <FileUp size={16} />
              <span className="hidden sm:inline">Importar</span>
            </button>
          )}

          {/* View Mode Toggle */}
          {activeTab === 'available' && (
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/20 hover:text-white'}`}
                title="Visualização em Cards"
              >
                <HardDrive size={16} />
              </button>
              <button
                onClick={() => setViewMode('shelf')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'shelf' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/20 hover:text-white'}`}
                title="Visualização em Prateleira"
              >
                <LayoutDashboard size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`${viewMode === 'shelf' && activeTab === 'available'
        ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'
        }`}>
        {activeTab === 'available' ? (
          availableDevices.length > 0 ? (
            viewMode === 'shelf' ? (
              // --- MODO PRATELEIRA (SHELF VIEW) ---
              availableDevices.map((device) => (
                <div
                  key={device.id}
                  className="group relative bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all cursor-pointer"
                  onClick={() => handleAssignClick(device)}
                  title={`${device.model} - ${device.tag}`}
                >
                  <div className="text-white/40 group-hover:text-white group-hover:scale-110 transition-all">
                    {getIcon(device.type)}
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                      {device.tag}
                    </p>
                    <p className="text-[8px] font-bold text-white/10 uppercase truncate w-20 group-hover:text-white/40 transition-colors mt-0.5">
                      {device.model}
                    </p>
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </div>
              ))
            ) : (
              // --- MODO CARDS (PADRÃO) ---
              availableDevices.map(renderDeviceCard)
            )
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-[#14152e]/40 rounded-[3rem] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-emerald-500/5 rounded-[2rem] flex items-center justify-center text-emerald-500/20 border border-emerald-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo entregue</p>
                <p className="text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo disponível no momento</p>
              </div>
            </div>
          )
        ) : activeTab === 'maintenance' ? (
          maintenanceDevices.length > 0 ? (
            maintenanceDevices.map(renderMaintenanceCard)
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-[#14152e]/40 rounded-[3rem] border border-dashed border-white/10">
              <div className="w-24 h-24 bg-rose-500/5 rounded-[2rem] flex items-center justify-center text-rose-400/20 border border-rose-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo OK</p>
                <p className="text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo em manutenção</p>
              </div>
            </div>
          )
        ) : null}
      </div>

      {/* ABA EM USO - VISUALIZAÇÃO POR SETOR (CUSTODY) */}
      {activeTab === 'in_use' && (
        <div className="space-y-6">

          {/* 📋 LISTA DE SETORES EM ACCORDION */}
          <div className="space-y-4">
            {sortedSectors.map((sector: any) => {
              const name = sector.department.toUpperCase();
              const config = SECTOR_CONFIGS[name] || SECTOR_CONFIGS['OUTROS'];
              const isExpanded = expandedSectors[sector.department] || (searchQuery && searchQuery.trim().length > 0);
              const usersInSector = sector.usersList.reduce((acc: any, user: any) => {
                acc[user.userName] = user.items;
                return acc;
              }, {});

              const totalItems = Object.values(usersInSector).flat().length;
              const activeItems = Object.values(usersInSector).flat().filter((d: any) => d.status === 'Em Uso').length;

              return (
                <div key={sector.department} className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
                  {/* ACCORDION HEADER */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors gap-4"
                    onClick={() => toggleSector(sector.department)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: config.color }}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white tracking-widest uppercase">{sector.department}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase mt-0.5">{config.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-base font-black text-white">{activeItems} / {totalItems}</p>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Ativos no setor</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-white/5 text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION CONTENT */}
                  {isExpanded && (
                    <div className="p-6 border-t border-white/5 bg-black/20">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {sector.usersList.map((user: any, idx: number) => (
                          <div key={idx} className="custody-user-card">
                            <div className="custody-user-header">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User size={14} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-wider">{user.userName}</h4>
                                <div className="custody-badge mt-0.5">{user.items.length} dispositivo(s)</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {user.items.map((device: any) => (
                                <div key={device.id} className="custody-device-item flex items-center justify-between transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="custody-device-icon">{getIcon(device.type)}</div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-bold text-white uppercase">{device.model}</p>
                                        <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 leading-none">
                                          {device.type}
                                        </span>
                                      </div>
                                      <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1">
                                        <span className="text-indigo-500 dark:text-indigo-400 font-bold">#{device.tag}</span>
                                        {device.serialNumber && ` • S/N: ${device.serialNumber}`}
                                      </p>
                                    </div>
                                  </div>
                                      <div className="flex gap-2">
                                        {device.condition && device.condition.includes('Sistema:') && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedRmmDevice(device); }}
                                            className="custody-history-btn !text-indigo-400 hover:!bg-indigo-500/20"
                                            title="Ver Status RMM"
                                          >
                                            <Activity size={14} />
                                          </button>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onHistory(device); }}
                                          className="custody-history-btn"
                                          title="Histórico"
                                        >
                                          <History size={14} />
                                        </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); onReturn(device); }}
                                      className="custody-return-btn"
                                    >
                                      Devolver
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedSector && (
        <SectorDetailModal
          isOpen={isSectorModalOpen}
          onClose={() => setIsSectorModalOpen(false)}
          sectorName={selectedSector.department}
          devices={selectedSector.usersList.flatMap((u: any) => u.items)}
          sectorConfig={SECTOR_CONFIGS[selectedSector.department.toUpperCase()] || SECTOR_CONFIGS['OUTROS']}
        />
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          if (onRefresh) onRefresh();
        }}
        userEmail="system"
      />

      <RmmStatusModal
        isOpen={!!selectedRmmDevice}
        onClose={() => setSelectedRmmDevice(null)}
        device={selectedRmmDevice}
      />
    </div>
  );
}