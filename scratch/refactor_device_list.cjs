const fs = require('fs');
let txt = fs.readFileSync('c:\\Users\\erisson.junior\\Downloads\\EAVTEST-main (4)\\EAVTEST-main\\components\\DeviceList.tsx', 'utf-8');

// Replace renderDeviceCard
const renderDeviceCardNew = `  // Renderização de Item de Dispositivo Disponível (Lista Moderna)
  const renderDeviceCard = (device: any) => (
    <div key={device.id} className="group relative bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 dark:text-white/40">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">{device.model}</h3>
          <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mt-0.5">
            <span className="text-indigo-500 dark:text-indigo-400">#{device.tag}</span> • S/N: {device.serialNumber} {device.condition && device.condition.includes('Hostname: ') && \`• HOST: \${device.condition.split('Hostname: ')[1].split(' |')[0]}\`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 flex-1 justify-between xl:justify-end w-full xl:w-auto mt-4 xl:mt-0 border-t xl:border-none border-slate-200 dark:border-white/5 pt-4 xl:pt-0">
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Tipo</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80">{device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Categoria</span>
          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80">{device.category || device.type}</span>
        </div>
        <div className="flex flex-col items-start xl:items-end">
          <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Status</span>
          {(() => {
            const norm = device.status ? device.status.toLowerCase() : '';
            if (norm.includes('uso')) return <span className="status-badge status-badge-em-uso">EM USO</span>;
            if (norm.includes('manuten')) return <span className="status-badge status-badge-manutencao">MANUTENÇÃO</span>;
            return <span className="status-badge status-badge-disponivel">DISPONÍVEL</span>;
          })()}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0 justify-end">
        <button
          onClick={() => handleAssignClick(device)}
          className="flex-1 xl:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-[1000] uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
        >
          ENTREGAR
        </button>
        {device.condition && device.condition.includes('Sistema:') && (
          <button
            onClick={() => setSelectedRmmDevice(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 px-3 py-2.5 rounded-xl transition-all border border-slate-200 dark:border-indigo-500/20 active:scale-95 group/rmm"
            title="Ver Status do PC"
          >
            <Activity size={16} className="group-hover/rmm:scale-110 transition-transform" />
          </button>
        )}
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 px-3 py-2.5 rounded-xl transition-all border border-slate-200 dark:border-white/5 active:scale-95 group/hist"
          title="Ver Histórico"
        >
          <History size={16} className="group-hover/hist:rotate-[-45deg] transition-transform" />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(device)}
            className="flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-500 px-3 py-2.5 rounded-xl transition-all border border-slate-200 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/30 active:scale-95 group/trash"
            title="Excluir Ativo"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );`;

const renderMaintenanceCardNew = `  // Renderização de Item de Dispositivo em Manutenção (Lista Moderna)
  const renderMaintenanceCard = (device: any) => (
    <div key={device.id} className="group relative bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200/50 dark:border-rose-500/20 hover:border-rose-500/50 p-4 rounded-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400">
          {getIcon(device.type)}
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tighter">{device.model}</h3>
          <p className="text-[10px] font-bold text-rose-500/70 dark:text-rose-400/60 uppercase tracking-widest mt-0.5">
            <span className="text-rose-600 dark:text-rose-400">#{device.tag}</span> • S/N: {device.serialNumber}
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
        <button
          onClick={() => onMaintenance(device)}
          className="flex-1 xl:flex-none flex items-center justify-center px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-[1000] uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95"
        >
          FINALIZAR
        </button>
        <button
          onClick={() => onHistory(device)}
          className="flex items-center justify-center bg-rose-100 hover:bg-rose-200 dark:bg-white/5 dark:hover:bg-white/10 text-rose-600 dark:text-white/40 px-3 py-2.5 rounded-xl transition-all border border-rose-200 dark:border-white/5 active:scale-95"
          title="Ver Histórico"
        >
          <History size={16} />
        </button>
      </div>
    </div>
  );`;


// Find the start of renderDeviceCard and replace up to the end of renderMaintenanceCard
const start1 = txt.indexOf('  // Renderização de Card de Dispositivo Disponível');
const end1 = txt.indexOf('  return (', start1);

if(start1 !== -1 && end1 !== -1) {
    txt = txt.substring(0, start1) + renderDeviceCardNew + '\\n\\n' + renderMaintenanceCardNew + '\\n\\n' + txt.substring(end1);
} else {
    console.log("Could not find the card rendering sections.");
}

// Replace the grid container layout for available and maintenance
// Search for: <div className={\`transition-all duration-500 \${activeTab === 'available' && availableDevices.length > 20 ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}\`}>
const gridStart = txt.indexOf("      <div className={\`transition-all duration-500 \${activeTab === 'available' && availableDevices.length > 20 ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}\`}>");
if (gridStart !== -1) {
  const replacement = "      <div className={\`transition-all duration-500 \${activeTab === 'available' && availableDevices.length > 20 ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3'}\`}>";
  txt = txt.replace("      <div className={\`transition-all duration-500 \${activeTab === 'available' && availableDevices.length > 20 ? 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}\`}>", replacement);
}

fs.writeFileSync('c:\\\\Users\\\\erisson.junior\\\\Downloads\\\\EAVTEST-main (4)\\\\EAVTEST-main\\\\components\\\\DeviceList.tsx', txt);
