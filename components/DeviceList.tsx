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

const SECTOR_CONFIGS: Record<string, { color: string; subtitle: string }> = {
  'COORDENAÇÃO': { color: '#667eea', subtitle: 'Gestão Administrativa' },
  'DIRETORIA': { color: '#f093fb', subtitle: 'Alta Gestão' },
  'DISCENTES': { color: '#4facfe', subtitle: 'Área Estudantil' },
  'FINANCEIRO': { color: '#43e97b', subtitle: 'Gestão Financeira' },
  'SECRETARIA': { color: '#fa709a', subtitle: 'Suporte Administrativo' },
  'SUPRIMENTOS': { color: '#fbc2eb', subtitle: 'Logística e Materiais' },
  'TI': { color: '#a8edea', subtitle: 'Tecnologia da Informação' },
  'RH': { color: '#ec4899', subtitle: 'Recursos Humanos' },
  'DP': { color: '#db2777', subtitle: 'Departamento Pessoal' },
  'ADMISSIONS': { color: '#3b82f6', subtitle: 'Admissões' },
  'MARKETING': { color: '#f97316', subtitle: 'Comunicação e Marketing' },
  'GUARITA': { color: '#64748b', subtitle: 'Segurança e Portaria' },
  'AFTER SCHOOL': { color: '#fb7185', subtitle: 'Atividades Extracurriculares' },
  'ASSISTENTE DIREÇÃO/RECEPÇÃO': { color: '#0ea5e9', subtitle: 'Assistência e Recepção' },
  'BIBLIOTECA': { color: '#8b5cf6', subtitle: 'Centro de Mídia e Leitura' },
  'COOD. FINANCEIRO': { color: '#34d399', subtitle: 'Coordenação Financeira' },
  'DIREÇÃO': { color: '#c084fc', subtitle: 'Diretoria e Gestão' },
  'RECEPÇÃO': { color: '#06b6d4', subtitle: 'Recepção e Atendimento' },
  'MONITORES': { color: '#eab308', subtitle: 'Monitores e Inspetores' },
  'MARKETING/ADMISSIONS': { color: '#6366f1', subtitle: 'Comunicação e Admissões' },
  'OPERAÇÃO': { color: '#84cc16', subtitle: 'Operação e Infraestrutura' },
  'NUTRIÇÃO': { color: '#f87171', subtitle: 'Nutrição e Alimentação' },
  'ENFERMARIA': { color: '#f43f5e', subtitle: 'Serviços de Saúde e Ambulatório' },
  'JURIDICO': { color: '#475569', subtitle: 'Assessoria Jurídica' },
  'TRIAGEM': { color: '#f97316', subtitle: 'Equipamentos Novos (Aguardando Alocação)' },
  'OUTROS': { color: '#a0aec0', subtitle: 'Outros Setores' }
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
  userRole?: string;
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
  searchQuery,
  userRole
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

  // Renderização de Item de Dispositivo Disponível (Lista Moderna)
  const renderDeviceCard = (device: any) => (
    <div key={device.id} className="group relative bg-white dark:bg-white/5 border border-slate-300 dark:border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-600 dark:text-white/40">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">{device.model}</h3>
          <p className="text-[11px] font-medium text-slate-600 dark:text-white/50 tracking-wide mt-0.5">
            <span className="text-indigo-500 dark:text-indigo-400 font-bold">#{device.tag}</span> <span className="opacity-70">• S/N: {device.serialNumber} {device.condition && device.condition.includes('Hostname: ') && `• HOST: ${device.condition.split('Hostname: ')[1].split(' |')[0]}`}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-between xl:justify-end w-full xl:w-auto mt-4 xl:mt-0 border-t xl:border-none border-slate-300 dark:border-white/5 pt-4 xl:pt-0">
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Tipo</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80">{device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest">Categoria</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80">{device.category || device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest mb-1">Status</span>
          {(() => {
            const norm = device.status ? device.status.toLowerCase() : '';
            if (norm.includes('uso')) return <span className="status-badge status-badge-em-uso">EM USO</span>;
            if (norm.includes('manuten')) return <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>;
            return <span className="status-badge status-badge-disponivel">DISPONÍVEL</span>;
          })()}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0 justify-end">
        {userRole !== 'viewer' && (
          <button
            onClick={() => handleAssignClick(device)}
            className="flex-1 xl:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-[1000] uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
          >
            ENTREGAR
          </button>
        )}
        {device.condition && device.condition.includes('Sistema:') && (
          <button
            onClick={() => setSelectedRmmDevice(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 px-3 py-2.5 rounded-xl transition-all border border-slate-300 dark:border-indigo-500/20 active:scale-95 group/rmm"
            title="Ver Status do PC"
          >
            <Activity size={16} className="group-hover/rmm:scale-110 transition-transform" />
          </button>
        )}
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-white/40 px-3 py-2.5 rounded-xl transition-all border border-slate-300 dark:border-white/5 active:scale-95 group/hist"
          title="Ver Histórico"
        >
          <History size={16} className="group-hover/hist:rotate-[-45deg] transition-transform" />
        </button>
        {userRole !== 'viewer' && onDelete && (
          <button
            onClick={() => onDelete(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-600 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-500 px-3 py-2.5 rounded-xl transition-all border border-slate-300 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 active:scale-95 group/trash"
            title="Excluir Ativo"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );

  // Renderização de Item de Dispositivo em Manutenção (Lista Moderna)
  const renderMaintenanceCard = (device: any) => (
    <div key={device.id} className="group relative bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200/50 dark:border-rose-500/20 hover:border-rose-500/50 p-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-semibold text-rose-900 dark:text-rose-100 tracking-tight">{device.model}</h3>
          <p className="text-[11px] font-medium text-rose-500/80 dark:text-rose-400/70 tracking-wide mt-0.5">
            <span className="text-rose-600 dark:text-rose-400 font-bold">#{device.tag}</span> <span className="opacity-70">• S/N: {device.serialNumber}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-between xl:justify-end w-full xl:w-auto mt-4 xl:mt-0 border-t xl:border-none border-rose-200/50 dark:border-rose-500/10 pt-4 xl:pt-0">
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-rose-400 dark:text-rose-400/50 uppercase tracking-widest mb-1">Status</span>
          <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0 justify-end">
        {userRole !== 'viewer' && (
          <button
            onClick={() => onMaintenance(device)}
            className="flex-1 xl:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-[1000] uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
          >
            FINALIZAR
          </button>
        )}
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-rose-100 hover:bg-rose-200 dark:bg-white/5 dark:hover:bg-white/10 text-rose-600 dark:text-white/40 px-3 py-2.5 rounded-xl transition-all border border-rose-200 dark:border-white/5 active:scale-95"
          title="Ver Histórico"
        >
          <History size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">


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
          {activeTab === 'available' && userRole !== 'viewer' && (
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
        : 'flex flex-col gap-4'
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
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-300 dark:border-white/10">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2rem] flex items-center justify-center text-emerald-500 dark:text-emerald-500/20 border border-emerald-100 dark:border-emerald-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo entregue</p>
                <p className="text-slate-500/50 dark:text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo disponível no momento</p>
              </div>
            </div>
          )
        ) : activeTab === 'maintenance' ? (
          maintenanceDevices.length > 0 ? (
            maintenanceDevices.map(renderMaintenanceCard)
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-300 dark:border-white/10">
              <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/5 rounded-[2rem] flex items-center justify-center text-rose-400 dark:text-rose-400/20 border border-rose-100 dark:border-rose-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo OK</p>
                <p className="text-slate-500/50 dark:text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo em manutenção</p>
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
                <div key={sector.department} className="bg-white dark:bg-white/5 rounded-2xl border border-slate-300 dark:border-white/5 overflow-hidden transition-all duration-300 shadow-sm">
                  {/* ACCORDION HEADER */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer transition-colors gap-4"
                    onClick={() => toggleSector(sector.department)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: config.color }}>
                        <Building size={22} className="text-white opacity-90" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-slate-800 dark:text-white tracking-tight">{sector.department}</h3>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-white/50 uppercase mt-0.5 tracking-wide">{config.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-base font-semibold text-slate-800 dark:text-white">{activeItems} / {totalItems}</p>
                        <p className="text-[9px] font-medium text-slate-600 dark:text-white/40 uppercase tracking-widest">Ativos no setor</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-white/5 text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION CONTENT */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-300 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {sector.usersList.map((user: any, idx: number) => (
                          <div key={idx} className="custody-user-card">
                            <div className="custody-user-header">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User size={14} />
                              </div>
                              <div>
                                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-white tracking-tight">{user.userName}</h4>
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
                                    {userRole !== 'viewer' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); onReturn(device); }}
                                        className="custody-return-btn"
                                      >
                                        Devolver
                                      </button>
                                    )}
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