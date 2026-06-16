import React, { useState } from 'react';
import { User, LogOut, ChevronDown, Mail } from 'lucide-react';

interface UserProfileProps {
    userEmail: string;
    onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userEmail, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Extrair iniciais do email (primeiras 2 letras antes do @)
    const getInitials = (email: string) => {
        const username = email.split('@')[0];
        return username.substring(0, 2).toUpperCase();
    };

    // Extrair nome do domínio para exibir
    const getDomain = (email: string) => {
        return email.split('@')[1] || '';
    };

    return (
        <div className="relative">
            {/* Botão Principal */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all group"
            >
                {/* Avatar com Iniciais */}
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
                        <span className="text-white font-black text-sm">{getInitials(userEmail)}</span>
                    </div>
                    {/* Indicador Online */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0b1e] animate-pulse" />
                </div>

                {/* Email e Domínio */}
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-white text-xs font-bold leading-none">
                        {userEmail.split('@')[0]}
                    </span>
                    <span className="text-white/40 text-[10px] font-medium leading-none mt-1">
                        @{getDomain(userEmail)}
                    </span>
                </div>

                {/* Ícone Dropdown */}
                <ChevronDown
                    size={16}
                    className={`text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Menu Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay para fechar ao clicar fora */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-72 bg-[#14152e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                        {/* Header do Menu */}
                        <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-black text-base">{getInitials(userEmail)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-bold truncate">{userEmail.split('@')[0]}</p>
                                    <p className="text-white/40 text-xs font-medium truncate">@{getDomain(userEmail)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Informações */}
                        <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                <Mail size={14} />
                                <span className="font-medium truncate">{userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-500 text-xs">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="font-bold">Online</span>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="p-2 border-t border-white/5">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onLogout();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group"
                            >
                                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold">Sair da Conta</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
