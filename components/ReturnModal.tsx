import React from 'react';
import { Device } from '../types';
import { X, RotateCcw, User, MapPin } from 'lucide-react';

interface Props {
  isOpen: boolean;
  device: Device | null;
  onClose: () => void;
  onConfirm: (device: Device) => void;
}

export const ReturnModal: React.FC<Props> = ({ isOpen, device, onClose, onConfirm }) => {
  if (!isOpen || !device) return null;

  // --- TRAVA DE SEGURANÇA 2 ---
  // Lógica de negócio: Só permite devolver se tiver alguém atribuído
  if (!device.currentAssignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1c1d3a] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] w-full max-w-md overflow-hidden border border-white/10 animate-fade-in my-auto">

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-600/20 to-indigo-600/20">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400 mb-1 text-left">Recebimento</span>
            <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white text-left">Devolução</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all text-white/40 hover:text-white">
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-10 space-y-5 sm:space-y-6">
          {/* Info Card */}
          <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-400">
                <User size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 text-left">Responsável</p>
                <p className="text-sm sm:text-base font-black text-white uppercase text-left truncate">{device.currentAssignment.userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-400">
                <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-1 text-left">Setor</p>
                <p className="text-sm sm:text-base font-black text-white uppercase text-left truncate">{device.currentAssignment.userDepartment}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => onConfirm(device)}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl sm:rounded-[1.5rem] shadow-xl transition-all uppercase text-xs sm:text-sm tracking-wider flex items-center justify-center gap-3 active:scale-95"
            >
              <RotateCcw size={18} />
              Confirmar
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-white/20 font-bold hover:text-white transition-colors uppercase text-xs sm:text-sm tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};