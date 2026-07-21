import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2,
  Wrench
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
  'ALUNOS': { color: '#38bdf8', subtitle: 'Dispositivos de Estudantes' },
  'PROFESSORES': { color: '#facc15', subtitle: 'Corpo Docente' },
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
  onPrepare?: (device: any) => void;
  activeTab?: 'sealed' | 'available' | 'in_use' | 'maintenance' | 'triage';
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
  onPrepare,
  activeTab = 'available',
  searchQuery,
  userRole
}: DeviceListProps) {
  const [viewMode, setViewMode] = useState<'card' | 'shelf'>('card');
  const [selectedAvailableType, setSelectedAvailableType] = useState<string | null>(null);
  const [inUseCategory, setInUseCategory] = useState<'colaboradores' | 'professores' | 'alunos'>('colaboradores');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // Default to card view
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
  const [sectorsViewMode, setSectorsViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSector, setSelectedSector] = useState<any>(null);
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [selectedRmmDevice, setSelectedRmmDevice] = useState<any>(null);

  // Isolar dispositivos de triagem
  const triageDevices = devices.filter(d => d.condition && d.condition.includes('Sistema:') && !d.custom_department && !d.currentAssignment);

  const sealedDevices = devices.filter(d => d.status === 'Estoque - Lacrado');
  const availableDevices = devices.filter(d => d.status === 'Disponível' && !triageDevices.find(t => t.id === d.id));
  const inUseDevices = devices.filter(d => d.status === 'Em Uso' && !triageDevices.find(t => t.id === d.id));
  const maintenanceDevices = devices.filter(d => d.status === 'Manutenção' && !triageDevices.find(t => t.id === d.id));

  // Agrupa dispositivos lacrados por tipo pra facilitar a visualização em lote.
  const sealedGroups = useMemo(() => {
    return sealedDevices.reduce((acc: Record<string, any[]>, device) => {
      const type = device.type || 'OUTROS';
      if (!acc[type]) acc[type] = [];
      acc[type].push(device);
      return acc;
    }, {});
  }, [sealedDevices]);

  const renderSealedCard = (device: any) => (
    <div
      key={device.id}
      className="group relative bg-white dark:bg-white/5 border border-amber-300/40 dark:border-amber-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-slate-800 dark:text-white tracking-tight truncate flex items-center gap-2">
            {device.tag}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300/40 dark:border-amber-500/30 uppercase tracking-widest">
              Lacrado
            </span>
          </h3>
          <p className="text-[11px] font-medium text-slate-600 dark:text-white/50 tracking-wide mt-0.5 truncate">
            {device.type}
            {device.supplier ? ` • ${device.supplier}` : ''}
            {device.invoice_number ? ` • NF ${device.invoice_number}` : ''}
          </p>
          {device.condition && (
            <p className="text-[10px] text-slate-500 dark:text-white/30 mt-1 truncate">
              {device.condition}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {onPrepare && userRole !== 'viewer' && (
          <button
            onClick={() => onPrepare(device)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
          >
            Marcar como Preparado
          </button>
        )}
        {onDelete && userRole !== 'viewer' && (
          <button
            onClick={() => onDelete(device)}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/20"
            title="Excluir dispositivo"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const availableGroups = useMemo(() => {
    return availableDevices.reduce((acc: Record<string, any[]>, device) => {
      const type = device.type || 'OUTROS';
      if (!acc[type]) acc[type] = [];
      acc[type].push(device);
      return acc;
    }, {});
  }, [availableDevices]);

  useEffect(() => {
    if (activeTab !== 'available') {
      setSelectedAvailableType(null);
    }
  }, [activeTab]);

  // Função de segurança para depuração
  const handleAssignClick = (device: any) => {
    // Se for dispositivo do RMM (Triagem), direciona para o modal RMM (Atribuição Rápida)
    if (device.condition && device.condition.includes('Sistema:')) {
      setSelectedRmmDevice(device);
      return;
    }

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
      const department = device.custom_department || device.currentAssignment?.userDepartment || 'Sem Setor';
      const userName = device.custom_user || device.currentAssignment?.userName || 'Pendente';

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
    <div key={device.id} className="group relative bg-white dark:bg-white/5 border border-slate-400 dark:border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-800 dark:text-white/40">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-slate-800 dark:text-white tracking-tight truncate flex items-center gap-2" title={`${device.model} - ${device.tag}`}>
            {device.model}
            {device.supplier === 'Mosyle' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex-shrink-0" title="Gerenciado pelo MDM Mosyle">
                MOSYLE
              </span>
            )}
          </h3>
          <p className="text-[11px] font-medium text-slate-800 dark:text-white/50 tracking-wide mt-0.5 truncate">
            <span className="text-indigo-500 dark:text-indigo-400 font-bold">#{device.tag}</span> <span className="opacity-70">• S/N: {device.serialNumber} {device.condition && device.condition.includes('Hostname: ') && `• HOST: ${device.condition.split('Hostname: ')[1].split(' |')[0]}`}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-between xl:justify-end w-full xl:w-auto mt-4 xl:mt-0 border-t xl:border-none border-slate-400 dark:border-white/5 pt-4 xl:pt-0">
        <div className="flex flex-col items-start xl:items-end min-w-0">
          <span className="text-[9px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest">Tipo</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate max-w-[120px]">{device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end min-w-0">
          <span className="text-[9px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest">Categoria</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate max-w-[120px]">{device.category || device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-700 dark:text-white/30 uppercase tracking-widest mb-1">Status</span>
          {(() => {
            const norm = device.status ? device.status.toLowerCase() : '';
            if (norm.includes('uso')) return <span className="status-badge status-badge-em-uso">EM USO</span>;
            if (norm.includes('manuten')) return <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>;
            return <span className="status-badge status-badge-disponivel">DISPONÍVEL</span>;
          })()}
        </div>
        {device.condition && device.condition.includes('Sistema:') && !device.custom_department && !device.currentAssignment && (
          <div className="flex flex-col items-start xl:items-end min-w-0 animate-pulse">
            <span className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest mb-1">Atribuição</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-500 border border-amber-500/20">PENDENTE</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0 justify-end">
        {userRole !== 'viewer' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleAssignClick(device); }}
            className="flex-1 xl:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-[1000] uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
          >
            {device.condition?.includes('Sistema:') ? 'ATRIBUIR' : 'ENTREGAR'}
          </button>
        )}
        {userRole !== 'viewer' && (
          <button
            onClick={() => onMaintenance(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-amber-100 dark:bg-white/5 dark:hover:bg-amber-500/20 text-slate-800 hover:text-amber-600 dark:text-white/40 dark:hover:text-amber-500 px-3 py-2.5 rounded-xl transition-all border border-slate-400 dark:border-white/5 hover:border-amber-200 dark:hover:border-amber-500/30 active:scale-95 group/maint"
            title="Enviar para Manutenção"
          >
            <Wrench size={16} className="group-hover/maint:rotate-12 transition-transform" />
          </button>
        )}
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white/40 px-3 py-2.5 rounded-xl transition-all border border-slate-400 dark:border-white/5 active:scale-95 group/hist"
          title="Ver Histórico"
        >
          <History size={16} className="group-hover/hist:rotate-[-45deg] transition-transform" />
        </button>
        {userRole !== 'viewer' && onDelete && (
          <button
            onClick={() => onDelete(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-800 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-500 px-3 py-2.5 rounded-xl transition-all border border-slate-400 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 active:scale-95 group/trash"
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
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-rose-900 dark:text-rose-100 tracking-tight truncate flex items-center gap-2">
            {device.model}
            {device.supplier === 'Mosyle' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20" title="Gerenciado pelo MDM Mosyle">
                MOSYLE
              </span>
            )}
          </h3>
          <p className="text-[11px] font-medium text-rose-500/80 dark:text-rose-400/70 tracking-wide mt-0.5 truncate">
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


      {/* Header Actions */}
      <div className="flex items-center justify-end w-full mb-4 px-2">
        <div className="flex items-center gap-3">
          {/* Export/Import Buttons */}
          {activeTab === 'available' && userRole !== 'viewer' && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10"
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
      <div className="flex flex-col gap-4">
        {activeTab === 'sealed' ? (
          sealedDevices.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    Estoque Lacrado
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest">
                    {sealedDevices.length} unidade{sealedDevices.length !== 1 ? 's' : ''} em caixas fechadas • aguardando preparação
                  </p>
                </div>
              </div>
              {Object.entries(sealedGroups).map(([type, items]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                      {type}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-white/30">
                      {items.length}
                    </span>
                  </div>
                  {items.map(renderSealedCard)}
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-400 dark:border-white/10">
              <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/5 rounded-[2rem] flex items-center justify-center text-amber-500 dark:text-amber-500/30 border border-amber-100 dark:border-amber-500/10">
                <HardDrive size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-700 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Estoque vazio</p>
                <p className="text-slate-700/50 dark:text-white/20 text-[10px] font-black uppercase tracking-widest">Nenhum dispositivo em caixa lacrada</p>
                <p className="text-slate-700/50 dark:text-white/20 text-[10px] uppercase tracking-widest mt-2">Use "Cadastrar Estoque" no menu lateral pra registrar chegadas.</p>
              </div>
            </div>
          )
        ) : activeTab === 'available' ? (
          availableDevices.length > 0 ? (
            !selectedAvailableType ? (
              // Visão de categorias (Pastas)
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Object.entries(availableGroups).map(([type, items]) => (
                  <div
                    key={type}
                    onClick={() => setSelectedAvailableType(type)}
                    className="group relative bg-white dark:bg-white/5 border border-slate-400 dark:border-white/5 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/10 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      {getIcon(type)}
                    </div>
                    <div className="text-center w-full">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest truncate">{type}</h3>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mt-1">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Visão de itens da categoria com botão de voltar
              <div className="space-y-4 w-full">
                <button
                  onClick={() => setSelectedAvailableType(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-xl transition-colors text-xs font-bold uppercase tracking-wider w-fit"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  Voltar para Categorias ({selectedAvailableType})
                </button>
                <div className={`${viewMode === 'shelf' ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4' : 'flex flex-col gap-4'}`}>
                  {viewMode === 'shelf' ? (
                    // --- MODO PRATELEIRA (SHELF VIEW) ---
                    availableGroups[selectedAvailableType]?.map((device) => (
                      <div
                        key={device.id}
                        className="group relative bg-white/10 border border-white/10 hover:border-indigo-500/50 hover:bg-white/20 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all cursor-pointer"
                        onClick={() => handleAssignClick(device)}
                        title={`${device.model} - ${device.tag}`}
                      >
                        <div className="text-white/70 group-hover:text-white group-hover:scale-110 transition-all">
                          {getIcon(device.type)}
                        </div>
                        <div className="text-center w-full px-2">
                          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest group-hover:text-indigo-400 transition-colors truncate w-full max-w-[100px] mx-auto">
                            {device.tag}
                          </p>
                          <p className="text-[8px] font-bold text-white/50 uppercase truncate w-full max-w-[100px] mx-auto group-hover:text-white/80 transition-colors mt-0.5">
                            {device.model}
                          </p>
                        </div>
                        {/* Status Indicator */}
                        {device.condition && device.condition.includes('Sistema:') && !device.custom_department && !device.currentAssignment ? (
                           <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" title="Atribuição Pendente" />
                        ) : (
                           <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        )}
                      </div>
                    ))
                  ) : (
                    // --- MODO CARDS (PADRÃO) ---
                    availableGroups[selectedAvailableType]?.map(renderDeviceCard)
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-400 dark:border-white/10">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2rem] flex items-center justify-center text-emerald-500 dark:text-emerald-500/20 border border-emerald-100 dark:border-emerald-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-700 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo entregue</p>
                <p className="text-slate-700/50 dark:text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo disponível no momento</p>
              </div>
            </div>
          )
        ) : activeTab === 'maintenance' ? (
          maintenanceDevices.length > 0 ? (
            maintenanceDevices.map(renderMaintenanceCard)
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-400 dark:border-white/10">
              <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/5 rounded-[2rem] flex items-center justify-center text-rose-400 dark:text-rose-400/20 border border-rose-100 dark:border-rose-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-700 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo OK</p>
                <p className="text-slate-700/50 dark:text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo em manutenção</p>
              </div>
            </div>
          )
        ) : activeTab === 'triage' ? (
          triageDevices.length > 0 ? (
            triageDevices.map(renderDeviceCard)
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-400 dark:border-white/10">
              <div className="w-24 h-24 bg-amber-50 dark:bg-amber-500/5 rounded-[2rem] flex items-center justify-center text-amber-500 dark:text-amber-500/20 border border-amber-100 dark:border-amber-500/10">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-700 dark:text-white/30 font-[1000] uppercase tracking-[0.4em] text-xs">Tudo Organizado</p>
                <p className="text-slate-700/50 dark:text-white/10 text-[10px] font-black uppercase tracking-widest">Nenhum ativo pendente na triagem</p>
              </div>
            </div>
          )
        ) : null}
      </div>

      {/* ABA EM USO - VISUALIZAÇÃO POR SETOR (CUSTODY) */}
      {activeTab === 'in_use' && (
        <div className="space-y-6">

          {/* 📋 TABS SUPERIORES DE CATEGORIA (Colaboradores / Professores / Alunos) */}
          <div className="flex bg-white dark:bg-white/5 p-1.5 rounded-2xl w-fit mb-2 border border-slate-300 dark:border-white/10 shadow-sm mx-auto">
            <button
              onClick={() => setInUseCategory('colaboradores')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inUseCategory === 'colaboradores' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-white/40 hover:text-indigo-500'}`}
            >
              Colaboradores
            </button>
            <button
              onClick={() => setInUseCategory('professores')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inUseCategory === 'professores' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-white/40 hover:text-indigo-500'}`}
            >
              Professores
            </button>
            <button
              onClick={() => setInUseCategory('alunos')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inUseCategory === 'alunos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-white/40 hover:text-indigo-500'}`}
            >
              Alunos
            </button>
          </div>

          {/* 📋 LISTA DE SETORES EM ACCORDION */}
          <div className="flex flex-col gap-5">
            {sortedSectors
              .filter((sector: any) => {
                if (inUseCategory === 'alunos') return sector.department === 'Alunos';
                if (inUseCategory === 'professores') return sector.department === 'Professores';
                return sector.department !== 'Alunos' && sector.department !== 'Professores';
              })
              .map((sector: any) => {
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
                <div key={sector.department} className={`group bg-white dark:bg-slate-900/40 rounded-3xl overflow-hidden transition-all duration-300 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 ${isExpanded ? 'shadow-md border-slate-300 dark:border-white/10' : 'shadow-sm'}`}>
                  {/* ACCORDION HEADER */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-5 px-6 cursor-pointer gap-4 relative overflow-hidden"
                    onClick={() => toggleSector(sector.department)}
                  >
                    {/* Faixa lateral colorida sutil (opcional se quiser) */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: config.color }} />

                    <div className="flex items-center gap-5 z-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                         <Building size={26} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sector.department}</h3>
                        <p className="text-[11px] font-bold uppercase mt-1 tracking-widest opacity-80" style={{ color: config.color }}>{config.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 z-10">
                      <div className="text-right hidden sm:block">
                        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{activeItems} <span className="text-slate-400 text-sm font-bold">/ {totalItems}</span></p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1">Ativos no setor</p>
                      </div>
                      <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40 transition-all duration-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400 ${isExpanded ? 'rotate-90 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : ''}`}>
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                  {/* ACCORDION CONTENT */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-400 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {sector.usersList.map((user: any, idx: number) => (
                          <div key={idx} className="custody-user-card">
                            <div className="custody-user-header">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <User size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-[13px] font-semibold text-slate-800 dark:text-white tracking-tight break-all line-clamp-2">{user.userName}</h4>
                                <div className="custody-badge mt-0.5">{user.items.length} dispositivo(s)</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {user.items.map((device: any) => (
                                <div key={device.id} className="custody-device-item flex items-center justify-between transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="custody-device-icon">{getIcon(device.type)}</div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start sm:items-center flex-col sm:flex-row gap-2">
                                        <p className="text-[10px] font-bold text-slate-800 dark:text-white uppercase break-all line-clamp-2">{device.model}</p>
                                        <span className="text-[7.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 leading-none shrink-0 truncate max-w-[80px]">
                                          {device.type}
                                        </span>
                                        {device.supplier === 'Mosyle' && (
                                          <span className="px-1.5 py-0.5 rounded text-[7.5px] font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 leading-none shrink-0" title="Gerenciado pelo MDM Mosyle">
                                            MOSYLE
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[8px] text-slate-500 dark:text-white/30 uppercase tracking-widest mt-1 break-all line-clamp-2">
                                        {device.tag && <span className="text-indigo-500 dark:text-indigo-400 font-bold">#{device.tag}</span>}
                                        {device.serialNumber && <span className="ml-1 opacity-80">• S/N: {device.serialNumber}</span>}
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
                                      <>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onMaintenance(device); }}
                                          className="custody-history-btn hover:!bg-amber-500/20 !text-slate-800 dark:!text-white/40 hover:!text-amber-600 dark:hover:!text-amber-500"
                                          title="Enviar para Manutenção"
                                        >
                                          <Wrench size={14} />
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); onReturn(device); }}
                                          className="custody-return-btn"
                                        >
                                          Devolver
                                        </button>
                                      </>
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
        onAssign={onAssign}
      />
    </div>
  );
}