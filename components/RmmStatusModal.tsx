import React from 'react';
import { createPortal } from 'react-dom';
import { Device } from '../types';
import { 
  X, 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Monitor, 
  UserCircle,
  Network,
  Radio,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Server,
  Timer,
  Battery,
  MonitorPlay,
  MonitorSmartphone
} from 'lucide-react';

interface RmmStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
}

export function RmmStatusModal({ isOpen, onClose, device }: RmmStatusModalProps) {
  const [pingStatus, setPingStatus] = React.useState<'idle' | 'loading' | 'online' | 'offline' | 'pinging'>('idle');
  const [pingTime, setPingTime] = React.useState<string>('');

  // Resetar estado do ping ao abrir outro dispositivo
  React.useEffect(() => {
    setPingStatus('idle');
    setPingTime('');
  }, [device?.id]);

  if (!isOpen || !device) return null;

  // Parser do texto bruto do agente
  const getSpecs = (condition: string) => {
    const specs = { 
      hostname: '', os: 'Desconhecido', cpu: 'Desconhecido', ram: 'Desconhecido', 
      diskTotal: 0, diskFree: 0, user: 'N/A', mac: 'N/A', ip: 'N/A',
      uptime: 'N/A', wifi: 'N/A', battery: 'N/A', monitors: 'N/A'
    };
    if (!condition) return specs;
    
    const parts = condition.split('|').map(s => s.trim());
    parts.forEach(p => {
      if(p.startsWith('Hostname:')) specs.hostname = p.replace('Hostname:', '').trim();
      if(p.startsWith('Sistema:')) specs.os = p.replace('Sistema:', '').trim();
      if(p.startsWith('Processador:')) specs.cpu = p.replace('Processador:', '').trim();
      if(p.startsWith('RAM:')) specs.ram = p.replace('RAM:', '').trim();
      if(p.startsWith('Usuário Logado:')) specs.user = p.replace('Usuário Logado:', '').trim();
      if(p.startsWith('MAC:')) specs.mac = p.replace('MAC:', '').trim();
      if(p.startsWith('IP:')) specs.ip = p.replace('IP:', '').trim();
      if(p.startsWith('Uptime:')) specs.uptime = p.replace('Uptime:', '').trim();
      if(p.startsWith('Wi-Fi:')) specs.wifi = p.replace('Wi-Fi:', '').trim();
      if(p.startsWith('Bateria:')) specs.battery = p.replace('Bateria:', '').trim();
      if(p.startsWith('Monitores:')) specs.monitors = p.replace('Monitores:', '').trim();
      if(p.startsWith('HD:')) {
         const hdMatch = p.match(/HD:\s*([\d.]+)GB\s*\(([\d.]+)GB/);
         if (hdMatch) {
            specs.diskTotal = parseFloat(hdMatch[1]);
            specs.diskFree = parseFloat(hdMatch[2]);
         }
      }
    });
    return specs;
  };

  const conditionStr = device.condition || '';
  const specs = getSpecs(conditionStr);
  const isAgentData = conditionStr.includes('Sistema:');

  const diskUsed = specs.diskTotal > 0 ? specs.diskTotal - specs.diskFree : 0;
  const diskPercentage = specs.diskTotal > 0 ? (diskUsed / specs.diskTotal) * 100 : 0;

  // Formatar last_seen
  let lastSeenText = 'Desconhecido';
  let isRecent = false;
  if ((device as any).last_seen) {
    const lastDate = new Date((device as any).last_seen);
    const diffMs = Date.now() - lastDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) lastSeenText = 'Agora mesmo';
    else if (diffMins < 60) lastSeenText = `Há ${diffMins} min`;
    else if (diffHours < 24) lastSeenText = `Há ${diffHours} hora(s)`;
    else lastSeenText = `Há ${diffDays} dia(s)`;

    // Considera recente se sincronizou nas últimas 2 horas
    isRecent = diffHours < 2;
  }

  // Cor da barra baseada no uso
  let progressColor = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
  if (diskPercentage > 75) progressColor = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
  if (diskPercentage > 90) progressColor = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';

  const testPing = async () => {
    setPingStatus('pinging');
    try {
      const targetIp = specs.ip && specs.ip !== 'N/A' ? specs.ip : null;
      const res = await fetch('/api/agent/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: specs.hostname || device.tag, ip: targetIp })
      });
      const data = await res.json();
      if (data.online) {
        setPingStatus('online');
        setPingTime(data.time);
      } else {
        setPingStatus('offline');
      }
    } catch (e) {
      setPingStatus('offline');
    }
  };

  const openRemoteDesktop = async () => {
    try {
      const targetIp = specs.ip && specs.ip !== 'N/A' ? specs.ip : specs.hostname;
      // Arquitetura Web: Em vez de disparar no servidor (o que abriria a tela la no servidor),
      // pedimos ao navegador local do usuario para abrir o aplicativo VNC instalado nele.
      window.location.href = `vnc://${targetIp}`;
    } catch (e) {
      console.error("Erro ao iniciar acesso remoto", e);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in font-sans">
      <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col relative animate-slide-up">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Activity size={24} />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">{device.model}</h2>
                {specs.hostname && (
                  <span className="text-[10px] font-bold text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                    HOST: {specs.hostname}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isRecent ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Agente Integrado</p>
                </div>
                <div className="flex items-center gap-1.5 text-white/30">
                  <Clock size={10} />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Último Sync: <span className="text-white/60">{lastSeenText}</span></p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 relative z-10 custom-scrollbar">
          
          {isAgentData ? (
            <>
              {/* Ping Network Tester */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border-white/5`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    pingStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
                    pingStatus === 'offline' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {pingStatus === 'pinging' ? <Loader2 size={18} className="animate-spin" /> : <Network size={18} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Teste de Conexão Local</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                      {pingStatus === 'online' ? `Online (${pingTime}ms)` : 
                       pingStatus === 'offline' ? 'Dispositivo Inativo' :
                       pingStatus === 'pinging' ? 'Testando...' :
                       'Verifique se a máquina está ativa na rede'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openRemoteDesktop}
                    disabled={!specs.ip || specs.ip === 'N/A'}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${
                      !specs.ip || specs.ip === 'N/A'
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                        : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 shadow-emerald-500/20 active:scale-95'
                    }`}
                  >
                    <MonitorSmartphone size={14} />
                    Acesso Remoto
                  </button>
                  <button
                    onClick={testPing}
                    disabled={pingStatus === 'pinging' || !specs.ip || specs.ip === 'N/A'}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                      pingStatus === 'pinging' || !specs.ip || specs.ip === 'N/A'
                        ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500 shadow-indigo-500/20 active:scale-95'
                    }`}
                  >
                    Pingar IP/Host
                  </button>
                </div>
              </div>

              {/* Hardware Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-400 transition-colors">
                    <Monitor size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sistema Operacional</p>
                    <p className="text-sm font-bold text-white mt-0.5">{specs.os}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">
                    <UserCircle size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Usuário Ativo</p>
                    <p className="text-sm font-bold text-white mt-0.5 truncate">{specs.user}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-center gap-2 hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-amber-400 transition-colors">
                      <Cpu size={14} />
                    </div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Processador</p>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white pl-1">{specs.cpu}</p>
                </div>

                <div className="bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-center gap-2 hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-pink-400 transition-colors">
                      <MemoryStick size={14} />
                    </div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Memória RAM</p>
                  </div>
                  <p className="text-2xl font-[1000] text-white pl-1">{specs.ram} <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">GB Total</span></p>
                </div>
              </div>

              {/* Storage Visualizer */}
              <div className="bg-white/5 p-5 sm:p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan-400 transition-colors">
                      <HardDrive size={14} />
                    </div>
                    <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Armazenamento Principal (C:)</p>
                  </div>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-white/40 tracking-widest">{diskPercentage.toFixed(1)}% Usado</span>
                </div>
                
                <div className="relative h-4 sm:h-5 bg-white/5 rounded-full overflow-hidden mb-3 border border-white/5">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${progressColor}`}
                    style={{ width: `${diskPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <p className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest">{diskUsed.toFixed(2)} GB Usados</p>
                  <p className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">{specs.diskFree} GB Livres <span className="text-white/20">de {specs.diskTotal} GB</span></p>
                </div>
              </div>

              {/* Network Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <Wifi size={14} className="text-white/20" />
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Endereço MAC</p>
                    <p className="text-xs font-bold text-white/80 mt-0.5 font-mono">{specs.mac}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                  <Server size={14} className="text-white/20" />
                  <div>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">IPv4 Local</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5 font-mono">{specs.ip}</p>
                  </div>
                </div>
              </div>
              {/* Extra Sensors / Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-fuchsia-400 transition-colors">
                    <Timer size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Tempo Ligado (Uptime)</p>
                    <p className="text-sm font-bold text-white mt-0.5">{specs.uptime}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-yellow-400 transition-colors">
                    <Battery size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Bateria e Desgaste</p>
                    <p className={`text-sm font-bold mt-0.5 ${specs.battery.includes('Troca') ? 'text-rose-400' : 'text-white'}`}>{specs.battery}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan-400 transition-colors">
                    <Wifi size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Rede Wi-Fi (SSID)</p>
                    <p className="text-sm font-bold text-white mt-0.5">{specs.wifi}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 transition-colors">
                    <MonitorPlay size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Telas Conectadas</p>
                    <p className="text-xs font-bold text-white mt-0.5 leading-tight">{specs.monitors}</p>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/20 mb-4 border border-white/5">
                <Activity size={24} />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Aguardando Sincronização</h3>
              <p className="text-[11px] text-white/40 max-w-xs leading-relaxed uppercase tracking-widest font-bold">
                As informações detalhadas de hardware e rede estarão disponíveis quando o agente instalar e sincronizar pela primeira vez.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
