import React, { useState, useEffect } from 'react';
import { MonitorPlay, ChevronLeft, Search, CheckCircle2, XCircle, LayoutGrid, RotateCcw, Power } from 'lucide-react';
import { Device, DeviceStatus } from '../types';
import { apiClient } from '../lib/apiClient';

interface SignageModuleProps {
    onBack: () => void;
    userEmail: string;
}

export const SignageModule = ({ onBack, userEmail }: SignageModuleProps) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchSignageDevices();
        const interval = setInterval(fetchSignageDevices, 10000); // refresh a cada 10s
        return () => clearInterval(interval);
    }, []);

    const fetchSignageDevices = async () => {
        try {
            const { data, error } = await apiClient
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

            const formattedData = data?.map((device) => {
                const mappedHistory = (device.assignments || []).map((a: any) => ({
                    id: a.id,
                    userName: a.user_name,
                    userEmail: a.user_email,
                    userDepartment: a.department ? a.department.name : 'Outros Setores',
                    userRole: a.user_role,
                    startDate: a.assigned_at,
                    endDate: a.returned_at,
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

            const signageDevices = (formattedData || []).filter(d => {
                const typeStr = (d.type || '').toLowerCase();
                const modelStr = (d.model || '').toLowerCase();
                const respStr = (d.responsible || '').toLowerCase();
                
                return typeStr.includes('mini pc') || 
                       typeStr.includes('tv') || 
                       typeStr.includes('krtv') ||
                       modelStr.includes('mini pc') || 
                       modelStr.includes('tv') ||
                       modelStr.includes('krtv') ||
                       respStr.includes('mini pc') || 
                       respStr.includes('mural') ||
                       respStr.includes('tv') ||
                       respStr.includes('krtv');
            });

            setDevices(signageDevices);
        } catch (err) {
            console.error("Erro ao buscar devices do mural:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoteControl = async (device: Device) => {
        let ip = device.ip_address;
        
        // Se não tiver IP no banco, busca na string de condição (formato antigo/legado)
        if (!ip && device.condition && device.condition.includes('IP: ')) {
            try {
                ip = device.condition.split('IP: ')[1].split(' |')[0].trim();
            } catch (e) {
                console.error("Não foi possível extrair IP da condição", e);
            }
        }

        if (!ip || ip === 'N/A' || ip === 'Desconhecido') {
            ip = prompt(`O IP deste dispositivo não foi sincronizado automaticamente.\nInforme o IP para acesso remoto ao ${device.tag} (${device.model}):\nEx: 10.0.0.X`);
            if (!ip) return;
        }
        
        try {
            // Utiliza o protocolo local vnc:// para o PC do TI abrir o Viewer
            window.location.href = `vnc://${ip}`;
        } catch (err: any) {
            alert(`Erro ao conectar: ${err.message}`);
        }
    };

    const handleRustDeskControl = (device: Device) => {
        let rustdesk = '';
        if (device.condition && device.condition.includes('RustDesk ID: ')) {
            try {
                rustdesk = device.condition.split('RustDesk ID: ')[1].split(' |')[0].trim();
            } catch (e) {
                console.error("Não foi possível extrair RustDesk ID da condição", e);
            }
        }
        
        // Aplica o hardcode para as telas da KRTV
        const isKRTV = device.responsible?.toUpperCase().includes('KRTV') || (device.condition && device.condition.toUpperCase().includes('KRTV'));
        if (isKRTV && !rustdesk) {
            rustdesk = '517165846';
        }

        if (!rustdesk) {
            rustdesk = prompt(`O RustDesk ID deste dispositivo não foi encontrado.\nInforme o ID para suporte remoto ao ${device.tag}:`);
            if (!rustdesk) return;
        }

        try {
            window.location.href = `rustdesk://${rustdesk}`;
        } catch (err: any) {
            alert(`Erro ao conectar no RustDesk: ${err.message}`);
        }
    };

    const filteredDevices = devices.filter(d => {
        const term = searchQuery.toLowerCase();
        return (d.tag || '').toLowerCase().includes(term) ||
               (d.model || '').toLowerCase().includes(term) ||
               (d.currentAssignment?.campus || '').toLowerCase().includes(term);
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d21] font-sans flex flex-col h-screen overflow-hidden">
            {/* Cabeçalho */}
            <div className="bg-white dark:bg-white/5 border-b border-slate-400 dark:border-white/10 px-8 py-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <MonitorPlay className="text-pink-600" /> Mural Digital
                        </h1>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mt-1">Gerencie os murais e telas corporativas da escola</p>
                    </div>
                </div>

                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar mural..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[300px] pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-600 focus:ring-2 focus:ring-pink-500/50 outline-none transition-all"
                    />
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>
            </div>

            {/* Corpo / Grid de Telas */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
                        {filteredDevices.map(device => {
                            const isAvailable = device.status === DeviceStatus.AVAILABLE;
                            
                            return (
                                <div key={device.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-400 dark:border-white/5 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-pink-500/30">
                                    {/* Top / Tela (Visual) */}
                                    <div className="h-40 bg-slate-100 dark:bg-slate-800/50 p-6 flex flex-col justify-between border-b border-slate-400 dark:border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-[40px] rounded-full group-hover:bg-pink-500/20 transition-all"></div>
                                        
                                        <div className="flex items-center justify-between z-10">
                                            <span className="px-3 py-1 bg-white/60 dark:bg-black/40 backdrop-blur-md text-xs font-bold rounded-lg border border-slate-400 dark:border-white/10 text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                {device.tag}
                                            </span>
                                            
                                            <div className="flex items-center gap-2">
                                                {isAvailable ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        DISPONÍVEL
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-[11px] font-bold border border-amber-200 dark:border-amber-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        EM USO
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="z-10 mt-auto">
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                <LayoutGrid size={20} className="text-pink-500" /> {device.currentAssignment?.campus || 'Não Definido'}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-400 mt-1">
                                                {device.model} • {device.type}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="p-5 flex gap-3">
                                        <button 
                                            onClick={() => handleRemoteControl(device)}
                                            className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors"
                                        >
                                            <MonitorPlay size={18} />
                                            VNC
                                        </button>
                                        <button 
                                            onClick={() => handleRustDeskControl(device)}
                                            className="flex-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-colors"
                                        >
                                            <MonitorPlay size={18} />
                                            RustDesk
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredDevices.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-600 mb-4">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum mural encontrado</h3>
                                <p className="text-slate-700 dark:text-slate-400 mt-2 max-w-sm">Verifique se você possui dispositivos cadastrados com o tipo "Mini PC" ou "TV Corporativa" no inventário principal.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
