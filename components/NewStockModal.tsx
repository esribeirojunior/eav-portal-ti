import React, { useState } from 'react';
import { X, PackagePlus, Loader2 } from 'lucide-react';

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEVICE_TYPES = [
  'MacBook',
  'Notebook',
  'iMac',
  'Mini PC',
  'Monitor',
  'iPad',
  'Chromebook',
  'Teclado',
  'Mouse',
  'Kit Teclado/mouse',
  'Headset',
  'Adaptador',
  'Cabo Type-C',
  'Cabo HDMI',
  'Cabo Rede',
  'Impressora',
  'TV Corporativa',
  'Outro',
];

// Classes reutilizadas em quase todos os inputs -- theme-aware pra light/dark.
const INPUT_CLS =
  'w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50 placeholder:text-slate-400 dark:placeholder:text-white/30';
const LABEL_CLS =
  'text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1.5 block';

export function NewStockModal({ isOpen, onClose, onSuccess }: NewStockModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState('MacBook');
  const [customType, setCustomType] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [isAccessory, setIsAccessory] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; firstTag: string; lastTag: string } | null>(null);

  if (!isOpen) return null;

  const finalType = type === 'Outro' ? customType.trim() : type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (quantity < 1 || quantity > 500) {
      alert('Quantidade deve ser entre 1 e 500.');
      return;
    }
    if (!finalType) {
      alert('Informe o tipo do dispositivo.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/devices/bulk-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          quantity,
          type: finalType,
          supplier: supplier.trim() || null,
          invoice_number: invoiceNumber.trim() || null,
          purchase_date: purchaseDate || null,
          warranty_expiry: warrantyExpiry || null,
          unit_cost: unitCost ? Number(unitCost) : null,
          is_accessory: isAccessory,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Falha ao cadastrar estoque.');
      setResult({
        count: json.count,
        firstTag: json.devices[0]?.tag ?? '?',
        lastTag: json.devices[json.devices.length - 1]?.tag ?? '?',
      });
      onSuccess();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setType('MacBook');
    setCustomType('');
    setSupplier('');
    setInvoiceNumber('');
    setPurchaseDate('');
    setWarrantyExpiry('');
    setUnitCost('');
    setIsAccessory(false);
    setNotes('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <PackagePlus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Cadastrar Estoque Novo</h2>
              <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest mt-0.5">
                Dispositivos em caixa lacrada • tags EAV-XXXX geradas em sequência
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all border border-slate-200 dark:border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sucesso */}
        {result ? (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PackagePlus size={28} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{result.count} dispositivos cadastrados</h3>
            <p className="text-slate-600 dark:text-white/60 text-sm">
              Tags geradas de <span className="font-black text-amber-600 dark:text-amber-400">{result.firstTag}</span>
              {' '}até <span className="font-black text-amber-600 dark:text-amber-400">{result.lastTag}</span>
            </p>
            <p className="text-slate-500 dark:text-white/40 text-xs uppercase tracking-widest">
              Status: Estoque - Lacrado
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Quantidade + Tipo */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLS}>Quantidade</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white text-lg font-black focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLS}>Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                >
                  {DEVICE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {type === 'Outro' && (
              <div>
                <label className={LABEL_CLS}>Especifique o tipo</label>
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="Ex: Webcam, Docking Station..."
                  required
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={isAccessory}
                onChange={(e) => setIsAccessory(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              Marcar como acessório (mouse, teclado, cabo etc.)
            </label>

            <div className="border-t border-slate-200 dark:border-white/5 pt-4 space-y-4">
              <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                Nota Fiscal & Fornecedor (opcional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Fornecedor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Ex: Apple Reseller, Kabum"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Nota Fiscal</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Ex: NF-1234"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Data da compra</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>Garantia até</label>
                  <input
                    type="date"
                    value={warrantyExpiry}
                    onChange={(e) => setWarrantyExpiry(e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Custo unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Ex: 8500.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Observações do lote</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={INPUT_CLS + ' resize-none'}
                    placeholder="Ex: Lote recebido do fornecedor XYZ, todos com carregador incluído..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 text-xs font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <PackagePlus size={14} />
                    Cadastrar {quantity} unidade{quantity !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
