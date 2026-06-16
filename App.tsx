import React, { useState, useEffect } from 'react';
import { supabase, isTestMode } from './lib/supabase';
import { Device, DeviceStatus, DeviceType, Assignment, UserRole, TechnicalInspection } from './types';
import { DeviceList } from './components/DeviceList';
import { Dashboard } from './components/Dashboard';
import { DeviceModal } from './components/DeviceModal';
import { AssignmentModal } from './components/AssignmentModal';
import { AccessoryModal } from './components/AccessoryModal';
import { ReturnModal } from './components/ReturnModal';
import { HistoryModal } from './components/HistoryModal';
import { InspectionModal } from './components/InspectionModal';
import { ModuleSelector } from './components/ModuleSelector';
import { CustodyView } from './components/CustodyView';
import { LinksModule } from './components/LinksModule';
import { TasksModule } from './components/TasksModule';
import { VaultModule } from './components/VaultModule';
import { TutorialsModule } from './components/TutorialsModule';
import DevLabModule from './components/DevLabModule';
import { AuditLogModal } from './components/AuditLogModal';
import { UserProfile } from './components/UserProfile';
import { Copilot } from './components/Copilot';
import { logAuditAction } from './lib/supabase';
import {
  Plus,
  Search,
  ClipboardList,
  LayoutDashboard,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  User,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Cable,
  Sun,
  Moon
} from 'lucide-react';

// --- LOGO COMPONENT ---
const LogoEAV = ({ size = "normal", theme = "light" }: { size?: "small" | "normal" | "large", theme?: "light" | "dark" }) => {
  const eavWidths = { 
    small: 'w-32 md:w-40', 
    normal: 'w-48 md:w-56', 
    large: 'w-72 md:w-80' 
  };

  const heights = { 
    small: 'h-8 md:h-10', 
    normal: 'h-10 md:h-12', 
    large: 'h-14 md:h-18' 
  };

  const selectedEavWidth = eavWidths[size] || eavWidths.normal;
  const selectedHeight = heights[size] || heights.normal;
  const logoSrc = theme === "dark" ? "/logo-branco.png" : "/logo.png";

  return (
    <div className="flex items-center gap-3 md:gap-5 cursor-pointer group select-none">
      {/* Logo Escola Americana de Vitória (Marketing) */}
      <div className={`flex items-center justify-center ${selectedEavWidth}`}>
        <img 
          src={logoSrc} 
          alt="EAV International School" 
          className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Divisor Visual */}
      <div className={`w-[1.5px] h-6 md:h-10 rounded-full mx-1 md:mx-2 ${theme === 'dark' ? 'bg-white/40' : 'bg-slate-300'}`} />

      {/* Logo Grupo Buaiz */}
      <div className={`flex items-center justify-center flex-shrink-0 ${selectedHeight} w-24 md:w-36 overflow-hidden py-1`}>
        <img 
          src="/grupo-buaiz.jpg" 
          alt="Grupo Buaiz" 
          className={`w-full h-full object-contain scale-[3.5] md:scale-[4.5] origin-center ${theme === 'dark' ? '' : 'mix-blend-multiply contrast-125'}`}
          style={theme === 'dark' ? { filter: 'grayscale(1) contrast(200%) invert(1)' } : undefined}
        />
      </div>
    </div>
  );
};



// --- LOGIN SCREEN ---
const LoginScreen: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (error) throw error;

      if (data.user) {
        onLogin(email);
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#ffffff] overflow-hidden font-sans select-none">
      
      {/* PAINEL ESQUERDO: AZUL (Design com Vídeo em Background) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-gradient-to-br from-[#1b5bd8] to-[#0d3ea3] flex-col items-center justify-center p-12 relative overflow-hidden select-none">
        
        {/* Vídeo em Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none z-0"
        >
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>

        {/* Detalhes abstratos de fundo para efeito premium */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#ffffff]/5 rounded-full blur-[80px] pointer-events-none z-0" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#000000]/10 rounded-full blur-[80px] pointer-events-none z-0" />
        
        {/* Onda decorativa sutil de fundo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,70 50,50 T100,50 L100,100 L0,100 Z" fill="#ffffff" />
          </svg>
        </div>

        {/* Logo EAV e Buaiz em Branco */}
        <div className="flex items-center justify-center z-10 animate-fade-in mix-blend-screen">
          <LogoEAV size="large" theme="dark" />
        </div>
      </div>

      {/* PAINEL DIREITO: FORMULÁRIO */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 lg:p-24 bg-[#ffffff] z-10">
        <div className="w-full max-w-[400px] space-y-8 animate-slide-up">
          
          {/* Título da Escola / Formulário */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="space-y-2 flex flex-col items-center">
              <h1 className="text-3xl font-[900] text-[#0f2d70] tracking-tight uppercase">CENTRAL DE GESTÃO TI</h1>
              <div className="flex items-center gap-3 w-full justify-center mt-1">
                <div className="w-8 h-[1px] bg-[#0f2d70]/20" />
                <p className="text-[10px] font-black text-[#0f2d70] uppercase tracking-widest">Acesso TI Restrito</p>
                <div className="w-8 h-[1px] bg-[#0f2d70]/20" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="space-y-4">
              {/* Campo E-mail */}
              <div className="relative group">
                <input
                  required
                  type="email"
                  placeholder="EMAIL"
                  className={`w-full bg-slate-100 border ${error ? 'border-red-500' : 'border-slate-200 group-hover:border-slate-300'} rounded-2xl py-4 pl-12 pr-4 text-xs font-black tracking-widest text-slate-800 outline-none focus:border-[#0c59cf] focus:ring-2 focus:ring-[#0c59cf]/10 transition-all placeholder:text-slate-400`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ color: '#1e293b' }}
                />
                <User 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0c59cf] transition-colors" 
                  size={18} 
                />
              </div>

              {/* Campo Senha */}
              <div className="relative group">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="SENHA"
                  className={`w-full bg-slate-100 border ${error ? 'border-red-500' : 'border-slate-200 group-hover:border-slate-300'} rounded-2xl py-4 pl-12 pr-12 text-xs font-black tracking-widest text-slate-800 outline-none focus:border-[#0c59cf] focus:ring-2 focus:ring-[#0c59cf]/10 transition-all placeholder:text-slate-400`}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  style={{ color: '#1e293b' }}
                />
                <Lock 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0c59cf] transition-colors" 
                  size={18} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3 animate-bounce">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider">Credenciais Inválidas</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-[#0f2d70] hover:bg-[#0c2050] text-[#ffffff] font-black rounded-2xl shadow-lg transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin text-[#ffffff]" size={18} />
              ) : (
                <>
                  Entrar
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-[#ffffff]" />
                </>
              )}
            </button>
          </form>

          {/* Links adicionais */}
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="flex gap-4 text-xs font-semibold">
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Entre em contato com o administrador de TI para resetar sua senha."); }} className="text-[#0c59cf] hover:underline transition-colors">
                Esqueceu a senha?
              </a>
              <span className="text-slate-300">|</span>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Termos de uso e políticas de privacidade da Escola Americana de Vitória."); }} className="text-[#0c59cf] hover:underline transition-colors">
                Política de Privacidade
              </a>
            </div>

            <div className="text-slate-400/60 text-[9px] uppercase tracking-[0.2em] font-black pt-4">
              Escola Americana de Vitória &copy; 2026 - by Erisson Junior
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- ACTION CARD COMPONENT ---
const ActionCard = ({ icon, title, desc, onClick, iconBg }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, iconBg: string }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden glass-card p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] transition-all text-left hover:translate-y-[-8px] hover:shadow-indigo-500/10 active:scale-[0.98] h-full"
  >
    <div className={`absolute top-0 right-0 w-64 h-64 ${iconBg} opacity-[0.05] group-hover:opacity-[0.1] blur-[80px] rounded-full transition-opacity`} />
    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${iconBg} rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mb-6 sm:mb-8 text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
      {React.cloneElement(icon as any, { size: 32 })}
    </div>
    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-2 sm:mb-3 leading-tight">{title}</h3>
    <p className="text-white/40 text-[11px] sm:text-[13px] font-medium leading-relaxed italic">{desc}</p>
    <div className="absolute bottom-8 sm:bottom-10 right-8 sm:right-10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg">
        <ChevronRight size={20} />
      </div>
    </div>
  </button>
);

const normalizeText = (text: string): string => {
  return (text || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('user_authenticated') === 'true';
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [subView, setSubView] = useState<'menu' | 'inventory' | 'dashboard'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('user_email') || '';
  });

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);
  const [returningDevice, setReturningDevice] = useState<Device | null>(null);
  const [inspectingDevice, setInspectingDevice] = useState<Device | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Device | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DeviceType | 'Todos' | 'Manutenção'>('Todos');
  const [selectedCampus, setSelectedCampus] = useState<'Todos' | 'Álvares' | 'Aeroporto' | 'Álvares / Aeroporto'>('Todos');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Sincroniza tema com o body
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  // --- STATE: Controle de Módulos ---
  const [currentModule, setCurrentModule] = useState<'selector' | 'assets' | 'links' | 'tasks' | 'vault' | 'tutorials' | 'lab'>('selector');

  const params = new URLSearchParams(window.location.search);
  const sharedTutorialId = params.get('tutorialId');

  // Initial Load
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated]);

  // --- FUNÇÃO FETCH DEVICES COM RETRY ---
  const fetchDevices = async (retries = 3) => {
    if (isTestMode) return; // Não faz fetch no modo teste
    setLoading(true);
    try {
      console.log(`📡 [Fetch] Buscando dados do inventário... (Tentativas restantes: ${retries})`);
      const { data: devicesData, error } = await supabase
        .from('devices')
        .select(`
          *,
          assignments (
            id,
            user_name,
            department_id,
            department (name),
            user_role,
            grade,
            assigned_at,
            returned_at,
            return_photo_url,
            campus
          )
        `)
        .order('tag', { ascending: true });

      if (error) throw error;

      const formattedData = devicesData?.map((device) => {
        const mappedHistory = (device.assignments || []).map((a: any) => ({
          id: a.id,
          userName: a.user_name,
          userDepartment: a.department?.name || 'N/A',
          userRole: a.user_role,
          userGrade: a.grade,
          startDate: a.assigned_at,
          endDate: a.returned_at,
          returnPhoto: a.return_photo_url,
          campus: a.campus
        }));

        const sortedHistory = mappedHistory.sort((a: any, b: any) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        const activeAssignment = sortedHistory.find((a: any) => !a.endDate);

        return {
          ...device,
          history: sortedHistory,
          assignments: sortedHistory,
          currentAssignment: activeAssignment || null,
          responsible: activeAssignment ? activeAssignment.userName : 'Não informado',
          department: activeAssignment ? activeAssignment.userDepartment : '-'
        };
      });

      console.log("✅ [Fetch] Dados carregados com sucesso!");
      setDevices(formattedData || []);
    } catch (err) {
      console.error(`❌ [Fetch] Erro (Tentativas restantes: ${retries}):`, err);
      if (retries > 0) {
        console.log(`🔄 [Fetch] Tentando reconectar em 2 segundos...`);
        setTimeout(() => fetchDevices(retries - 1), 2000);
      } else {
        showNotification("Erro de conexão persistente.");
      }
    } finally {
      if (retries === 0) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    } finally {
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_email');
      localStorage.removeItem('auth_token');
      setIsAuthenticated(false);
      setUserEmail('');
      setCurrentModule('selector');
      setSubView('menu');
      window.location.href = '/';
    }
  };

  const showNotification = (message: string) => {
    setNotification({ message, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMaintenance = async (device: Device) => {
    try {
      const enteringMaintenance = device.status !== DeviceStatus.MAINTENANCE;
      const newStatus = enteringMaintenance ? DeviceStatus.MAINTENANCE : DeviceStatus.AVAILABLE;

      // Lógica Real (Supabase)
      if (enteringMaintenance) {
        const { error: assignError } = await supabase
          .from('assignments')
          .insert([{
            device_id: device.id,
            user_name: 'MANUTENÇÃO', // Corrigido para user_name
            department_id: 'TI',    // Corrigido para department_id
            assigned_at: new Date().toISOString() // Corrigido para assigned_at
          }]);
        if (assignError) throw assignError;
      } else {
        if (device.currentAssignment) {
          const { error: closeError } = await supabase
            .from('assignments')
            .update({ returned_at: new Date().toISOString() })
            .eq('id', device.currentAssignment.id);
          if (closeError) throw closeError;
        }
      }

      const { error } = await supabase
        .from('devices')
        .update({ status: newStatus })
        .eq('id', device.id);

      if (error) throw error;

      await fetchDevices();

      // LOG DE AUDITORIA: MANUTENÇÃO
      logAuditAction(
        userEmail,
        'MANUTENÇÃO',
        `${enteringMaintenance ? 'Entrou' : 'Saiu'} da manutenção: ${device.tag}`,
        'DEVICE',
        device.id
      );

      showNotification(`Ativo ${device.tag} movido para ${newStatus}`);
    } catch (err) {
      console.error("Erro ao mudar status:", err);
      showNotification("Erro ao atualizar status.");
    }
  };

  const handleDeleteHistory = async (assignmentId: string) => {
    try {
      // 1. Busca dados do registro antes de deletar
      const { data: assignment } = await supabase
        .from('assignments')
        .select('device_id, returned_at')
        .eq('id', assignmentId)
        .single();

      // 2. Deleta o registro
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      // 3. Se era uma custódia ativa, volta dispositivo para DISPONÍVEL
      if (assignment && !assignment.returned_at) {
        await supabase
          .from('devices')
          .update({ status: DeviceStatus.AVAILABLE })
          .eq('id', assignment.device_id);
      }

      showNotification("Registro excluído com sucesso!");

      // LOG DE AUDITORIA: EXCLUIR HISTÓRICO
      logAuditAction(userEmail, 'EXCLUIR', `Excluiu registro de histórico ID: ${assignmentId}`, 'ASSIGNMENT', assignmentId);

      await fetchDevices();

      if (viewingHistory) {
        const updatedDevice = devices.find(d => d.id === viewingHistory.id);
        if (updatedDevice) setViewingHistory(updatedDevice);
      }
    } catch (err) {
      console.error("Erro ao excluir histórico:", err);
      showNotification("Erro ao excluir registro.");
    }
  };

  const handleDeleteDevice = async (device: Device) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o ativo ${device.tag} (${device.model})? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setLoading(true);

      // 1. Deletar histórico (opcional, dependendo do ON DELETE CASCADE no banco)
      // Supabase geralmente lida com isso se configurado, mas vamos garantir
      const { error: historyError } = await supabase
        .from('assignments')
        .delete()
        .eq('device_id', device.id);

      if (historyError) throw historyError;

      // 2. Deletar o dispositivo
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', device.id);

      if (error) throw error;

      // LOG DE AUDITORIA: EXCLUIR DISPOSITIVO
      logAuditAction(userEmail, 'EXCLUIR', `Excluiu permanentemente o ativo: ${device.tag}`, 'DEVICE', device.id);

      showNotification("Ativo excluído com sucesso!");
      await fetchDevices();
    } catch (err) {
      console.error("Erro ao excluir dispositivo:", err);
      alert("Erro ao excluir o dispositivo. Verifique se ele possui vínculos pendentes.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !sharedTutorialId) return (
    <LoginScreen onLogin={(email) => { 
      setIsAuthenticated(true);
      setUserEmail(email.toLowerCase());
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_email', email.toLowerCase());
      fetchDevices();
    }} />
  );

  // Filtra fora acessórios virtuais (criados pela Entrega Rápida) da listagem e contagem geral do inventário
  const activeDevices = devices.filter(d => d.serialNumber !== 'ACESSÓRIO');

  const stats = {
    total: activeDevices.length,
    available: activeDevices.filter(d => d.status === DeviceStatus.AVAILABLE).length,
    inUse: activeDevices.filter(d => d.status === DeviceStatus.IN_USE).length,
  };

  const filteredDevices = activeDevices.filter(d => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      (d.tag || '').toLowerCase().includes(term) ||
      (d.model || '').toLowerCase().includes(term) ||
      (d.serialNumber || '').toLowerCase().includes(term) ||
      (d.responsible || '').toLowerCase().includes(term) ||
      (d.currentAssignment?.userName || '').toLowerCase().includes(term);

    const matchesCategory =
      selectedCategory === 'Todos' ? true :
        selectedCategory === 'Manutenção' ? d.status === DeviceStatus.MAINTENANCE :
          (d.type || '').toLowerCase() === selectedCategory.toLowerCase();

    const matchesCampus =
      selectedCampus === 'Todos' ? true :
      selectedCampus === 'Álvares / Aeroporto' ? (
        d.currentAssignment ? (
          normalizeText(d.currentAssignment.campus).includes('alvares') &&
          normalizeText(d.currentAssignment.campus).includes('aeroporto')
        ) : false
      ) :
      selectedCampus === 'Álvares' ? (
        d.currentAssignment ? (
          normalizeText(d.currentAssignment.campus).includes('alvares') &&
          !normalizeText(d.currentAssignment.campus).includes('aeroporto')
        ) : false
      ) :
      selectedCampus === 'Aeroporto' ? (
        d.currentAssignment ? (
          normalizeText(d.currentAssignment.campus).includes('aeroporto') &&
          !normalizeText(d.currentAssignment.campus).includes('alvares')
        ) : false
      ) : false;

    return matchesSearch && matchesCategory && matchesCampus;
  });

  if (!isAuthenticated && sharedTutorialId) {
    return (
      <div className="min-h-screen bg-[#0c0d21]">
        <TutorialsModule
          onBack={() => window.location.href = window.location.origin + window.location.pathname}
          publicMode={true}
          sharedTutorialId={sharedTutorialId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d21] flex flex-col text-white antialiased">
      {notification && (
        <div className="fixed top-24 sm:top-32 left-1/2 -translate-x-1/2 z-[100] animate-fade-in pointer-events-none w-[90%] max-w-sm">
          <div className="bg-indigo-600 px-6 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.4)] border border-white/20 flex items-center justify-center gap-3 sm:gap-4">
            <CheckCircle2 size={24} className="text-emerald-400" />
            <span className="text-[14px] sm:text-[16px] font-[900] uppercase tracking-widest text-center">{notification.message}</span>
          </div>
        </div>
      )}

      {/* SELEÇÃO DE MÓDULO (Renderizado condicionalmente ao final) */}

      {/* --- MÓDULO DE ATIVOS (ANTIGO APP) --- */}
      {
        currentModule === 'assets' && (
          <>
            <header className="px-4 md:px-12 h-20 md:h-28 flex items-center justify-between sticky top-0 glass-header z-40">
              <div className="flex items-center gap-4 md:gap-8">
                <button
                  onClick={() => setCurrentModule('selector')}
                  className="hidden md:flex items-center gap-2 text-white/30 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all">
                    <LogOut size={14} className="rotate-180" />
                  </div>
                  <span>Voltar</span>
                </button>

                <div onClick={() => setSubView('menu')} className="transition-transform active:scale-95 flex-shrink-0 cursor-pointer scale-90 md:scale-100 origin-left">
                  <LogoEAV size="small" />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
                <div className="relative hidden xl:block">
                  <input
                    type="text"
                    placeholder="Pesquisar ativo..."
                    className="bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-[13px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all w-64 xl:w-80 placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                </div>


                <div className="hidden md:block">
                  <UserProfile
                    userEmail={userEmail}
                    onLogout={handleLogout}
                  />
                </div>

                <button
                  onClick={handleLogout}
                  className="p-3 sm:p-4 bg-white/5 text-white/30 border border-white/5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90 flex items-center gap-3 group no-print"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Sair</span>
                  <LogOut size={18} />
                </button>
              </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 md:px-12 py-10 md:py-20">
              <div className="animate-premium">
                {subView === 'menu' ? (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="text-center space-y-4 mb-10 md:mb-20">
                      <h2 className="text-4xl md:text-7xl font-[1000] tracking-[-0.05em] uppercase text-white leading-[0.85]">
                        SISTEMA DE <br /><span className="text-indigo-500">GESTÃO TI</span>
                      </h2>
                      <div className="flex items-center justify-center gap-4 opacity-30">
                        <div className="w-10 md:w-16 h-[1.5px] bg-indigo-500" />
                        <span className="text-[9px] md:text-[11px] font-black tracking-[0.6em] uppercase text-white">Administração de Ativos</span>
                        <div className="w-10 md:w-16 h-[1.5px] bg-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                      <ActionCard
                        icon={<Plus />}
                        title="Novo Ativo"
                        desc="Cadastro via serial"
                        onClick={() => setIsDeviceModalOpen(true)}
                        iconBg="bg-blue-600"
                      />
                      <ActionCard
                        icon={<ClipboardList />}
                        title="Inventário"
                        desc="Gestão de estoque"
                        onClick={() => setSubView('inventory')}
                        iconBg="bg-emerald-500"
                      />
                      <ActionCard
                        icon={<Cable />}
                        title="Entrega Rápida"
                        desc="Cabos, Mouses e Periféricos"
                        onClick={() => setIsAccessoryModalOpen(true)}
                        iconBg="bg-teal-600"
                      />
                      <ActionCard
                        icon={<LayoutDashboard />}
                        title="Dashboard"
                        desc="Estatísticas TI"
                        onClick={() => setSubView('dashboard')}
                        iconBg="bg-purple-600"
                      />
                    </div>
                  </div>
                ) : subView === 'inventory' ? (
                  <div className="space-y-8 sm:space-y-12">
                    <div className="flex flex-col gap-6 sm:gap-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 sm:gap-6">
                          <button onClick={() => setSubView('menu')} className="p-3.5 sm:p-5 bg-white/5 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all text-white/40 active:scale-90 border border-white/5 text-left flex items-center justify-center">
                            <X size={20} className="sm:w-7 sm:h-7" />
                          </button>
                          <h2 className="text-2xl sm:text-3xl font-[900] uppercase tracking-tighter text-white">Inventário</h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsDeviceModalOpen(true)}
                            className="p-3.5 sm:p-5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90 flex items-center gap-3 sm:gap-4 group"
                          >
                            <Plus size={20} className="sm:w-6 sm:h-6" />
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Novo</span>
                          </button>
                        </div>
                      </div>

                      {/* BARRA DE FILTROS COMPACTA */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Filtro de Tipo Customizado */}
                        <div className="relative group w-full sm:w-auto">
                          <div 
                            onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsCampusOpen(false); }}
                            className="flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 transition-all rounded-xl px-4 py-3.5 cursor-pointer"
                          >
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest whitespace-nowrap">Categoria:</span>
                            <span className="w-full sm:w-32 text-[11px] font-black uppercase tracking-widest text-white/80">{selectedCategory}</span>
                            <ChevronRight size={16} className={`text-white/40 transition-transform ${isCategoryOpen ? '-rotate-90' : 'rotate-90'} flex-shrink-0`} />
                          </div>
                          
                          {/* Dropdown Menu */}
                          {isCategoryOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white/5 border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {(['Todos', 'Manutenção', ...Object.values(DeviceType)] as const).map((cat) => (
                                  <div
                                    key={cat}
                                    onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/80'}`}
                                  >
                                    {cat}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Filtro de Campus Customizado */}
                        <div className="relative group w-full sm:w-auto animate-in fade-in duration-300">
                          <div 
                            onClick={() => { setIsCampusOpen(!isCampusOpen); setIsCategoryOpen(false); }}
                            className="flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 transition-all rounded-xl px-4 py-3.5 cursor-pointer"
                          >
                            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest whitespace-nowrap">Campus:</span>
                            <span className="w-full sm:w-32 text-[11px] font-black uppercase tracking-widest text-white/80 truncate">{selectedCampus}</span>
                            <ChevronRight size={16} className={`text-white/40 transition-transform ${isCampusOpen ? '-rotate-90' : 'rotate-90'} flex-shrink-0`} />
                          </div>

                          {/* Dropdown Menu */}
                          {isCampusOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-white/5 border border-white/5 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {(['Todos', 'Álvares', 'Aeroporto', 'Álvares / Aeroporto'] as const).map((cp) => (
                                  <div
                                    key={cp}
                                    onClick={() => { setSelectedCampus(cp); setIsCampusOpen(false); }}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors ${selectedCampus === cp ? 'bg-indigo-600 text-white' : 'hover:bg-white/10 text-white/80'}`}
                                  >
                                    {cp}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Backdrop invisível para fechar os menus ao clicar fora */}
                      {(isCategoryOpen || isCampusOpen) && (
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => { setIsCategoryOpen(false); setIsCampusOpen(false); }}
                        />
                      )}
                    </div>

                    <DeviceList
                      devices={filteredDevices}
                      onAssign={setAssigningDevice}
                      onReturn={setReturningDevice}
                      onHistory={setViewingHistory}
                      onMaintenance={handleMaintenance}
                      onDelete={handleDeleteDevice}
                      onRefresh={fetchDevices}
                    />
                  </div>
                ) : subView === 'dashboard' ? (
                  <Dashboard
                    stats={stats}
                    devices={devices}
                    onBack={() => setSubView('menu')}
                    userEmail={userEmail}
                    onLogout={handleLogout}
                  />
                ) : null}
              </div>
            </main>

            {/* MODAIS */}
            <DeviceModal
              isOpen={isDeviceModalOpen}
              onClose={() => setIsDeviceModalOpen(false)}
              userEmail={userEmail}
              onSuccess={async () => {
                setIsDeviceModalOpen(false); // Fecha primeiro
                await fetchDevices();        // Atualiza em background
              }}
            />

            <AssignmentModal
              isOpen={!!assigningDevice}
              onClose={() => setAssigningDevice(null)}
              device={assigningDevice}
              userEmail={userEmail}
              onSuccess={async () => {
                setAssigningDevice(null);     // Fecha primeiro
                await fetchDevices();         // Atualiza em background
                showNotification('Equipamento entregue!');
              }}
            />

            <ReturnModal
              isOpen={!!returningDevice}
              onClose={() => setReturningDevice(null)}
              device={returningDevice}
              onConfirm={async (device) => {
                try {
                  // Verifica se tem atribuição atual
                  if (!device.currentAssignment) return;

                  // 1. Atualiza a tabela assignments (fecha a entrega)
                  const { error: assignError } = await supabase
                    .from('assignments')
                    .update({
                      returned_at: new Date().toISOString(), // Ou endDate, dependendo do seu banco
                      return_photo_url: ''
                    })
                    .eq('id', device.currentAssignment.id);

                  if (assignError) throw assignError;

                  // 2. Atualiza o status do dispositivo para DISPONÍVEL
                  const { error: deviceUpdateError } = await supabase
                    .from('devices')
                    .update({ status: DeviceStatus.AVAILABLE })
                    .eq('id', device.id);

                  if (deviceUpdateError) throw deviceUpdateError;

                  // LOG DE AUDITORIA: DEVOLUÇÃO
                  logAuditAction(userEmail, 'DEVOLUÇÃO', `Devolução recebida: ${device.tag}`, 'DEVICE', device.id);

                  await fetchDevices();
                  setReturningDevice(null);
                  showNotification('Devolução registrada com sucesso!');

                } catch (e) {
                  console.error("Erro na devolução:", e);
                  showNotification("Erro ao processar devolução.");
                }
              }}
            />

            <HistoryModal
              isOpen={!!viewingHistory}
              onClose={() => setViewingHistory(null)}
              device={viewingHistory}
              onDelete={handleDeleteHistory}
            />

            <InspectionModal
              isOpen={!!inspectingDevice}
              onClose={() => setInspectingDevice(null)}
              device={inspectingDevice}
              onConfirm={async (device: Device, inspection: any) => {
                // Lógica de inspeção aqui (se necessário)
                await fetchDevices();
                setInspectingDevice(null);
                showNotification('Inspeção registrada!');
              }}
            />

            <AccessoryModal
              isOpen={isAccessoryModalOpen}
              onClose={() => setIsAccessoryModalOpen(false)}
              onSuccess={async () => {
                await fetchDevices();
                showNotification('Acessório entregue com sucesso!');
              }}
              userEmail={userEmail}
            />

          </>
        )
      }

      {currentModule === 'selector' && (
        <ModuleSelector
          onSelectModule={(module: 'assets' | 'links' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab') => {
            if (module === 'audit') setIsAuditModalOpen(true);
            else setCurrentModule(module);
          }}
          onLogout={handleLogout}
          userEmail={userEmail}
        />
      )}

      {currentModule === 'links' && (
        <LinksModule
          onBack={() => setCurrentModule('selector')}
          userEmail={userEmail}
        />
      )}

      {currentModule === 'tasks' && (
        <TasksModule
          userEmail={userEmail}
          onBack={() => setCurrentModule('selector')}
        />
      )}

      {currentModule === 'vault' && (
        <VaultModule
          userEmail={userEmail}
          onBack={() => setCurrentModule('selector')}
        />
      )}

      {currentModule === 'tutorials' && (
        <TutorialsModule
          onBack={() => setCurrentModule('selector')}
          userEmail={userEmail}
        />
      )}

      {currentModule === 'lab' && (
        <DevLabModule
          onBack={() => setCurrentModule('selector')}
          userEmail={userEmail}
        />
      )}
 
      {isAuditModalOpen && (
        <AuditLogModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* EAV COPILOT (Chatbot IA) */}
      <Copilot />
    </div >
  );
};

export default App;