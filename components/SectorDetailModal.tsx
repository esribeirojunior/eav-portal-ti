import React, { useState } from 'react';
import { X, Search, User as UserIcon, CheckCircle2, AlertCircle, FileDown, Building } from 'lucide-react';
import { Device } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    sectorName: string;
    devices: Device[];
    sectorConfig: {
        color: string;
        icon: string;
        subtitle: string;
    };
}

export function SectorDetailModal({ isOpen, onClose, sectorName, devices, sectorConfig }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    // Group devices by user
    const usersInSector = devices.reduce((acc: any, device) => {
        const userName = device.currentAssignment?.userName || 'Sem Responsável';
        const userRole = device.currentAssignment?.userRole || 'Colaborador';
        const userGrade = (device.currentAssignment as any)?.userGrade || 'EAV';

        if (!acc[userName]) {
            acc[userName] = {
                name: userName,
                role: userRole,
                grade: userGrade,
                devices: []
            };
        }
        acc[userName].devices.push(device);
        return acc;
    }, {});

    const filteredUsers = Object.values(usersInSector).filter((user: any) => {
        const matchesUser = user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDevice = user.devices.some((d: Device) =>
            d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesUser || matchesDevice;
    });

    const totalUsers = Object.keys(usersInSector).length;
    const totalDevices = devices.length;

    // Helper component for user card
    const renderUserCard = (user: any) => (
        <div
            key={user.name}
            className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group/user"
            style={{ hoverBorderColor: sectorConfig.color } as any}
        >
            <div className="flex items-center gap-4 mb-6">
                <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md"
                    style={{ backgroundColor: sectorConfig.color }}
                >
                    {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <h4 className="text-white font-black uppercase tracking-tight leading-none mb-1">{user.name}</h4>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                        {user.role} • {user.grade}
                    </p>
                </div>
            </div>

            <div className="ml-14 space-y-3">
                {user.devices.map((device: Device) => (
                    <div
                        key={device.id}
                        className="bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between group/dev hover:border-white/10 transition-all font-bold"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">💻</span>
                            <span className="text-[11px] font-black text-white/60 group-hover/dev:text-white transition-colors uppercase">
                                {device.model}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-indigo-400 group-hover/dev:text-indigo-300 transition-colors mr-2">
                                #{device.tag}
                            </span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${device.status === 'Em Uso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                {device.status === 'Em Uso' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {device.status === 'Em Uso' ? 'Ativo' : 'Manutenção'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[800px] max-h-[85vh] bg-gradient-to-br from-[#1a1640] to-[#24243e] border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between z-10">
                    <div className="flex items-center gap-5">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                            style={{ backgroundColor: sectorConfig.color }}
                        >
                            {sectorConfig.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-[1000] text-white uppercase tracking-tighter leading-tight">
                                {sectorName}
                            </h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                Detalhamento de Usuários e Equipamentos
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 rounded-lg transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-6">

                    {/* Search Box */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por usuário ou equipamento..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-white/10 focus:outline-none focus:border-opacity-100 transition-all font-bold"
                            style={{ borderColor: `${sectorConfig.color}20`, focusBorderColor: sectorConfig.color } as any}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* User Cards List & Grouping */}
                    <div className="space-y-8">
                        {filteredUsers.length > 0 ? (
                            sectorName.toUpperCase() === 'DISCENTES' ? (
                                // Group by Grade for DISCENTES
                                Object.entries(
                                    filteredUsers.reduce((acc: any, user: any) => {
                                        const g = user.grade || 'N/A';
                                        if (!acc[g]) acc[g] = [];
                                        acc[g].push(user);
                                        return acc;
                                    }, {})
                                ).sort(([a], [b]) => {
                                    // Custom sort for grades (simplified)
                                    const getWeight = (g: string) => {
                                        if (g.includes('Pre-K')) return 0;
                                        if (g.includes('Kindergarten')) return 1;
                                        const match = g.match(/\d+/);
                                        return match ? parseInt(match[0]) + 10 : 100;
                                    };
                                    return getWeight(a) - getWeight(b);
                                }).map(([grade, users]: [string, any]) => (
                                    <div key={grade} className="space-y-4">
                                        <div className="flex items-center gap-3 ml-2">
                                            <div className="h-px flex-1 bg-white/10" />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                {grade}
                                            </span>
                                            <div className="h-px flex-1 bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {users.map((user: any) => renderUserCard(user))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Standard view for other sectors
                                filteredUsers.map((user: any) => renderUserCard(user))
                            )
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/10 border border-dashed border-white/10">
                                    <UserIcon size={32} />
                                </div>
                                <div>
                                    <p className="text-white/30 font-black uppercase tracking-[0.2em] text-xs">Nenhum resultado</p>
                                    <p className="text-white/10 text-[10px] font-bold uppercase">Não encontramos nada para "{searchTerm}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between bg-black/20 z-10">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        Total: {totalUsers} Usuários • {totalDevices} Equipamentos
                    </div>
                    <button
                        className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 text-white shadow-lg"
                        style={{ backgroundColor: sectorConfig.color }}
                    >
                        <FileDown size={14} />
                        Exportar Lista
                    </button>
                </div>
            </div>
        </div>
    );
}
