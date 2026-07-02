import React, { useState, useEffect } from 'react';
import { supabase, isTestMode } from './lib/supabase';
import { Device, DeviceStatus, DeviceType, Assignment, UserRole, TechnicalInspection } from './types';
import { DeviceList } from './components/DeviceList';
import { Dashboard } from './components/Dashboard';
import { DeviceModal } from './components/DeviceModal';
import { AssignmentModal } from './components/AssignmentModal';
import { AccessoryModal } from './components/AccessoryModal';
import { ReturnModal } from './components/ReturnModal';
import { ImportModal } from './components/ImportModal';
import { HistoryModal } from './components/HistoryModal';
import { InspectionModal } from './components/InspectionModal';
import { ModuleSelector } from './components/ModuleSelector';
import { CustodyView } from './components/CustodyView';
import { LinksModule } from './components/LinksModule';
import { TasksModule } from './components/TasksModule';
import { VaultModule } from './components/VaultModule';
import { TutorialsModule } from './components/TutorialsModule';
import DevLabModule from './components/DevLabModule';
import { SettingsModule } from './components/SettingsModule';
import { SignageModule } from './components/SignageModule';
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
  Moon,
  FileUp,
  FileDown,
  MapPin
} from 'lucide-react';

// --- LOGO COMPONENT ---
const LogoEAV = ({ size = "normal", theme = "light", single = false }: { size?: "small" | "normal" | "large", theme?: "light" | "dark", single?: boolean }) => {
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
      {!single && (
        <div className={`w-[1.5px] h-6 md:h-10 rounded-full mx-1 md:mx-2 ${theme === 'dark' ? 'bg-white/40' : 'bg-slate-300'}`} />
      )}

      {/* Logo Grupo Buaiz */}
      {!single && (
        <div className={`flex items-center justify-center flex-shrink-0 ${selectedHeight} w-24 md:w-36 overflow-hidden py-1`}>
          <img 
            src="/grupo-buaiz.jpg" 
            alt="Grupo Buaiz" 
            className={`w-full h-full object-contain scale-[3.5] md:scale-[4.5] origin-center ${theme === 'dark' ? '' : 'mix-blend-multiply contrast-125'}`}
            style={theme === 'dark' ? { filter: 'grayscale(1) contrast(200%) invert(1)' } : undefined}
          />
        </div>
      )}
    </div>
  );
};



// --- LOGIN SCREEN ---
const LoginScreen: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    let interval: any;
    if (lockoutTime && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    } else if (lockoutTime === null && failedAttempts >= 5) {
      setFailedAttempts(0);
    }
    return () => clearInterval(interval);
  }, [lockoutTime, failedAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    setLoading(true);
    setError(false);
    setGoogleError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (error) throw error;

      if (data.user) {
        setFailedAttempts(0);
        onLogin(email);
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutTime(30);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response: any) => {
    setLoading(true);
    setError(false);
    setGoogleError(null);
    try {
      const { data, error } = await (supabase.auth as any).signInWithGoogle(response.credential);
      if (error) throw error;
      if (data.user) {
        onLogin(data.user.email);
      }
    } catch (err: any) {
      console.error("Erro no login do Google:", err);
      setGoogleError(err.message || "E-mail da conta Google não autorizado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.initialize({
          client_id: "219719535721-26k832m63t27fpik9cionsnje45mp0du.apps.googleusercontent.com",
          callback: handleGoogleLogin
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: 380, 
            shape: "pill",
            text: "signin_with"
          }
        );
      } else {
        setTimeout(initGoogle, 200);
      }
    };
    initGoogle();
  }, []);

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
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0"
        >
          <source src="/YTDown_YouTube_Escola-Americana-de-Vitoria-Campus-Alvar_Media_So2vmCFKSSg_001_1080p.mp4" type="video/mp4" />
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
                  className={`w-full bg-slate-100 border ${error ? 'border-red-500' : 'border-slate-400 group-hover:border-slate-400'} rounded-2xl py-4 pl-12 pr-4 text-xs font-black tracking-widest text-slate-800 outline-none focus:border-[#0c59cf] focus:ring-2 focus:ring-[#0c59cf]/10 transition-all placeholder:text-slate-700`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ color: '#1e293b' }}
                />
                <User 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#0c59cf] transition-colors" 
                  size={18} 
                />
              </div>

              {/* Campo Senha */}
              <div className="relative group">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="SENHA"
                  className={`w-full bg-slate-100 border ${error ? 'border-red-500' : 'border-slate-400 group-hover:border-slate-400'} rounded-2xl py-4 pl-12 pr-12 text-xs font-black tracking-widest text-slate-800 outline-none focus:border-[#0c59cf] focus:ring-2 focus:ring-[#0c59cf]/10 transition-all placeholder:text-slate-700`}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  style={{ color: '#1e293b' }}
                />
                <Lock 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-[#0c59cf] transition-colors" 
                  size={18} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-800 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && !lockoutTime && (
              <div className="text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3 animate-bounce">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider">Credenciais Inválidas</p>
              </div>
            )}

            {lockoutTime && (
              <div className="text-center bg-orange-50 border border-orange-100 rounded-lg py-2 px-3">
                <p className="text-orange-600 text-[10px] font-bold uppercase tracking-wider">Muitas tentativas. Aguarde {lockoutTime}s</p>
              </div>
            )}

            {googleError && (
              <div className="text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider">{googleError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || lockoutTime !== null}
              className="w-full py-4.5 bg-[#0f2d70] hover:bg-[#0c2050] text-[#ffffff] font-black rounded-2xl shadow-lg transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin text-[#ffffff]" size={18} />
              ) : lockoutTime ? (
                <span className="text-[#ffffff]">Bloqueado Temporariamente</span>
              ) : (
                <>
                  Entrar
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-[#ffffff]" />
                </>
              )}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 h-[1px] bg-slate-200" />
              <span className="mx-4 text-slate-700 text-[10px] font-black uppercase tracking-widest">ou</span>
              <div className="flex-1 h-[1px] bg-slate-200" />
            </div>

            <div id="google-signin-btn" className="w-full flex justify-center mt-3 min-h-[44px]"></div>
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

            <div className="text-slate-700/60 text-[9px] uppercase tracking-[0.2em] font-black pt-4">
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
  
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('user_role') || 'admin';
  });

  const [userModules, setUserModules] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('user_modules') || '["assets","links","audit","tasks","vault","tutorials","lab"]');
    } catch {
      return ["assets","links","audit","tasks","vault","tutorials","lab"];
    }
  });

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Garantia absoluta de Super Admin para Erisson e sincronização de cargos para os demais
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      if (userEmail.toLowerCase().includes('erisson.junior') && userRole !== 'superadmin') {
        setUserRole('superadmin');
        localStorage.setItem('user_role', 'superadmin');
        supabase.from('authorized_users').update({ role: 'superadmin' }).ilike('email', userEmail).then(() => {});
      } else {
        // Busca o cargo atualizado do banco de dados em segundo plano para qualquer outro usuário
        supabase.from('authorized_users').select('role, modules').ilike('email', userEmail).maybeSingle().then(({ data }) => {
          if (data) {
            if (data.role && data.role !== userRole) {
              setUserRole(data.role);
              localStorage.setItem('user_role', data.role);
            }
            if (data.modules) {
              try {
                const parsedModules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules;
                setUserModules(parsedModules);
                localStorage.setItem('user_modules', JSON.stringify(parsedModules));
              } catch (e) {
                console.error("Failed to parse modules");
              }
            }
          }
        });
      }
    }
  }, [isAuthenticated, userEmail, userRole, userModules]);
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [assigningDevice, setAssigningDevice] = useState<Device | null>(null);
  const [returningDevice, setReturningDevice] = useState<Device | null>(null);
  const [inspectingDevice, setInspectingDevice] = useState<Device | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Device | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DeviceType | 'Todos' | 'Manutenção'>('Todos');
  const [selectedCampus, setSelectedCampus] = useState<'Todos' | 'Álvares' | 'Aeroporto' | 'Álvares / Aeroporto'>('Todos');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [themeState, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Sincroniza tema com o body
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // --- STATE: Controle de Módulos ---
  const [currentModule, setCurrentModule] = useState<'selector' | 'assets' | 'links' | 'tasks' | 'vault' | 'tutorials' | 'lab' | 'settings' | 'signage'>('selector');

  const params = new URLSearchParams(window.location.search);
  const sharedTutorialId = params.get('tutorialId');

  // Initial Load & Auto-Refresh Polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices(); // Busca com loading (tela inicial)

      // Polling a cada 5 segundos (Atualização Automática de Tela)
      const interval = setInterval(() => {
        fetchDevices(3, true); // Busca silenciosa no background
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- FUNÇÃO FETCH DEVICES COM RETRY E SILENT ---
  const fetchDevices = async (retries = 3, silent = false) => {
    if (isTestMode) return; // Não faz fetch no modo teste
    if (!silent) setLoading(true);
    try {
      if (!silent) console.log(`📡 [Fetch] Buscando dados do inventário... (Tentativas restantes: ${retries})`);
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
          userEmail: a.user_email,
          userDepartment: a.department ? a.department.name : 'Outros Setores',
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

      if (!silent) console.log("✅ [Fetch] Dados carregados com sucesso!");
      setDevices(formattedData || []);
    } catch (err) {
      if (!silent) console.error(`❌ [Fetch] Erro (Tentativas restantes: ${retries}):`, err);
      if (retries > 0) {
        if (!silent) console.log(`🔄 [Fetch] Tentando reconectar em 2 segundos...`);
        setTimeout(() => fetchDevices(retries - 1, silent), 2000);
      } else {
        if (!silent) showNotification("Erro de conexão persistente.");
      }
    } finally {
      if (!silent && (retries === 0 || setDevices)) setLoading(false);
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

  const handleExportCSV = () => {
    try {
      const headers = ['Campus', 'Departamento', 'Usuário', 'Status', 'Dispositivo', 'Modelo', 'Service Tag', 'Email', 'Status Envio'];
      const rows = devices.map(d => [
        d.currentAssignment?.campus || '',
        d.currentAssignment?.userDepartment || '',
        d.currentAssignment?.userName || '',
        d.status || '',
        d.type || '',
        d.model || '',
        d.tag || '',
        d.currentAssignment?.userEmail || '',
        ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`));
      
      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inventario_eav_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logAuditAction(userEmail, 'EXPORTAÇÃO', `Exportou o inventário completo para CSV no novo formato.`, 'SYSTEM', 'export');
      showNotification("Planilha exportada com sucesso!");
    } catch (e) {
      console.error("Erro ao exportar:", e);
      showNotification("Erro ao exportar planilha.");
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
    <LoginScreen onLogin={async (email) => { 
      setIsAuthenticated(true);
      setUserEmail(email.toLowerCase());
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('user_email', email.toLowerCase());
      
      const { data } = await supabase.from('authorized_users').select('role, modules').ilike('email', email).maybeSingle();
      let role = data?.role || 'admin';
      
      // Fallback de segurança garantido para o Super Admin
      if (email.toLowerCase().includes('erisson.junior')) {
          role = 'superadmin';
          // Força a atualização no banco silenciosamente caso tenha falhado
          supabase.from('authorized_users').update({ role: 'superadmin' }).ilike('email', email).then(() => {});
      }
      
      setUserRole(role);
      localStorage.setItem('user_role', role);

      if (data?.modules) {
        try {
          const parsedModules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules;
          setUserModules(parsedModules);
          localStorage.setItem('user_modules', JSON.stringify(parsedModules));
        } catch (e) {
          console.error("Failed to parse modules on login", e);
        }
      }
      
      fetchDevices();
    }} />
  );

  // Filtra fora acessórios virtuais (criados pela Entrega Rápida) da listagem e contagem geral do inventário
  const activeDevices = devices.filter(d => !(d.serialNumber || '').startsWith('ACESSÓRIO'));

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
          <div className="flex w-full h-screen overflow-hidden bg-slate-100 dark:bg-[#0c0d21] transition-colors">
            {/* --- SIDEBAR --- */}
            <aside className="w-[280px] flex-shrink-0 bg-white dark:bg-white/5 border-r border-slate-400 dark:border-white/5 flex flex-col sticky top-0 h-screen overflow-y-auto hidden md:flex shadow-sm">
              {/* Logo container */}
              <div className="p-8 flex items-center justify-center cursor-pointer mb-2" onClick={() => setCurrentModule('selector')}>
                <LogoEAV size="normal" single={true} theme={theme} />
              </div>

              {/* Menu Principal */}
              <div className="px-6 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/30 mb-4 px-2">Menu Principal</p>
                <div className="space-y-2">
                  <button onClick={() => setSubView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-[11px] font-black tracking-widest ${subView === 'dashboard' ? 'bg-[#5b61f8] text-white shadow-lg shadow-indigo-500/20' : 'text-slate-800 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <LayoutDashboard size={18} />
                    Dashboard
                  </button>
                  <button onClick={() => setSubView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-[11px] font-black tracking-widest ${(subView === 'inventory' || subView === 'menu') ? 'bg-[#5b61f8] text-white shadow-lg shadow-indigo-500/20' : 'text-slate-800 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                    <ClipboardList size={18} />
                    Inventário
                  </button>
                </div>
              </div>

              {/* Ações Rápidas */}
              {userRole !== 'viewer' && (
                <div className="px-6 mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/30 mb-4 px-2">Ações Rápidas</p>
                  <div className="space-y-2">
                    <button onClick={() => setIsDeviceModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-[11px] font-black tracking-widest text-slate-800 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                      <Plus size={18} />
                      Novo Ativo
                    </button>
                    <button onClick={() => setIsAccessoryModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-[11px] font-black tracking-widest text-slate-800 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
                      <Cable size={18} />
                      Entrega Rápida
                    </button>
                  </div>
                </div>
              )}

              {/* Perfil e Voltar (Rodapé da Sidebar) */}
              <div className="mt-auto p-6 border-t border-slate-400 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
                <div className="bg-white dark:bg-white/5 border border-slate-400 dark:border-white/5 p-3 rounded-2xl flex items-center gap-3 mb-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#5b61f8] flex items-center justify-center flex-shrink-0 font-black text-white text-sm shadow-inner">
                    {userEmail.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-slate-800 dark:text-white truncate">{userEmail.split('@')[0]}</p>
                    <p className="text-[9px] font-bold text-slate-700 dark:text-white/40 truncate">@{userEmail.split('@')[1]}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentModule('selector')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-white/5 border border-slate-400 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/10 text-slate-800 hover:text-slate-800 dark:text-white/40 dark:hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest group shadow-sm">
                  <LogOut size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Módulos
                </button>
                <button onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/30 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest group shadow-sm">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-[#0c0d21] p-6 md:p-12 relative transition-colors">

              <div className="max-w-[1400px] mx-auto animate-premium relative z-10">
                {/* --- HEADER SUPERIOR INVENTÁRIO/DASHBOARD --- */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-[900] uppercase tracking-tighter text-[#1e293b] dark:text-white flex items-center gap-4">
                      {subView === 'dashboard' ? 'Dashboard' : 'Inventário'}
                      {(subView === 'inventory' || subView === 'menu') && (
                        <button
                          onClick={() => setIsDeviceModalOpen(true)}
                          className="md:hidden p-2 bg-indigo-600 text-white rounded-lg active:scale-95"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </h2>
                    <p className="text-[13px] font-bold text-slate-700 dark:text-white/40 mt-2">
                      {subView === 'dashboard' ? 'Métricas e relatórios do sistema' : 'Gestão completa de equipamentos e licenças.'}
                    </p>
                  </div>

                  {/* PESQUISA E FILTROS (Só no inventário) */}
                  {(subView === 'inventory' || subView === 'menu') && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-80">
                        <input
                          type="text"
                          placeholder="Pesquisar..."
                          className="w-full bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-full py-3.5 pl-12 pr-4 text-[12px] font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 dark:placeholder:text-white/20 shadow-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 dark:text-white/20" size={16} />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex items-center">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as any)}
                            className="appearance-none bg-white dark:bg-white/10 border border-slate-400 dark:border-white/20 rounded-full py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/90 outline-none hover:border-slate-400 hover:dark:bg-white/20 focus:border-indigo-500/50 transition-all cursor-pointer shadow-sm w-32"
                          >
                            {['Todos', 'Manutenção', ...Object.values(DeviceType)].map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <MapPin size={12} className="absolute left-3 text-slate-300 pointer-events-none hidden" />
                        </div>
                        
                        <div className="relative flex items-center">
                          <select
                            value={selectedCampus}
                            onChange={(e) => setSelectedCampus(e.target.value as any)}
                            className="appearance-none bg-white dark:bg-white/10 border border-slate-400 dark:border-white/20 rounded-full py-3 px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/90 outline-none hover:border-slate-400 hover:dark:bg-white/20 focus:border-indigo-500/50 transition-all cursor-pointer shadow-sm w-32"
                          >
                            {['Todos', 'Álvares', 'Aeroporto', 'Álvares / Aeroporto'].map((cp) => (
                              <option key={cp} value={cp}>{cp}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- CONTEÚDO PRINCIPAL --- */}
                {subView === 'dashboard' ? (
                  <Dashboard
                    stats={stats}
                    devices={devices}
                    onBack={() => setSubView('inventory')}
                    userEmail={userEmail}
                    onLogout={handleLogout}
                    onImportClick={() => setIsImportModalOpen(true)}
                    onExportClick={handleExportCSV}
                    userRole={userRole}
                  />
                ) : (
                  <DeviceList
                    devices={filteredDevices}
                    onAssign={setAssigningDevice}
                    onReturn={setReturningDevice}
                    onHistory={setViewingHistory}
                    onMaintenance={handleMaintenance}
                    onDelete={handleDeleteDevice}
                    onRefresh={fetchDevices}
                    userRole={userRole}
                  />
                )}
              </div>
            </main>
          </div>


            {/* MODAIS */}
            <ImportModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              userEmail={userEmail}
              onSuccess={async () => {
                setIsImportModalOpen(false);
                await fetchDevices();
                showNotification('Inventário importado com sucesso!');
              }}
            />

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
          onSelectModule={(module: 'assets' | 'links' | 'employees' | 'audit' | 'tasks' | 'vault' | 'tutorials' | 'lab' | 'settings' | 'signage') => {
            if (module === 'audit') setIsAuditModalOpen(true);
            else setCurrentModule(module);
          }}
          onLogout={handleLogout}
          userEmail={userEmail}
          userRole={userRole}
          userModules={userModules}
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
          onBack={() => setCurrentModule('lab')}
        />
      )}

      {currentModule === 'vault' && (
        <VaultModule
          userEmail={userEmail}
          userRole={userRole}
          onBack={() => setCurrentModule('lab')}
          onLogout={handleLogout}
        />
      )}

      {currentModule === 'tutorials' && (
        <TutorialsModule
          onBack={() => setCurrentModule('lab')}
          userEmail={userEmail}
        />
      )}

      {currentModule === 'lab' && (
        <DevLabModule
          onBack={() => setCurrentModule('selector')}
          userEmail={userEmail}
          onSelectModule={setCurrentModule}
        />
      )}

      {currentModule === 'signage' && (
        <SignageModule
          onBack={() => setCurrentModule('selector')}
          userEmail={userEmail}
        />
      )}
 
      {currentModule === 'settings' && (
        <div className="flex w-full h-screen overflow-hidden bg-slate-100 dark:bg-[#0c0d21] transition-colors relative">
           <SettingsModule userEmail={userEmail} />
           <button 
              onClick={() => setCurrentModule('selector')}
              className="absolute top-6 right-6 px-4 py-3 bg-white dark:bg-white/5 border border-slate-400 dark:border-white/10 rounded-xl text-slate-800 dark:text-white/80 dark:hover:text-white hover:text-slate-900 shadow-sm hover:shadow-md transition-all z-50 text-xs font-black uppercase tracking-widest"
           >
              Voltar ao Início
           </button>
        </div>
      )}

      {isAuditModalOpen && (
        <AuditLogModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* FLOATING THEME TOGGLE (Igual IA) */}
      <button 
        onClick={() => {
          const html = document.documentElement;
          if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            html.classList.add('light');
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
            setThemeState('light');
            setTheme('light');
          } else {
            html.classList.add('dark');
            html.classList.remove('light');
            document.body.classList.add('dark');
            document.body.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setThemeState('dark');
            setTheme('dark');
          }
        }}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/50 hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group border border-slate-400 dark:border-slate-700"
        title="Alternar Tema"
      >
        <Sun size={24} className="hidden dark:block group-hover:text-amber-400 transition-colors" />
        <Moon size={24} className="block dark:hidden group-hover:text-indigo-500 transition-colors" />
      </button>

      {/* EAV COPILOT (Chatbot IA) */}
      <Copilot userRole={userRole} />
    </div >
  );
};

export default App;