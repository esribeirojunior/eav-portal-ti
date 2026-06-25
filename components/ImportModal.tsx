import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { DeviceType, DeviceStatus, UserRole } from '../types';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userEmail: string;
}

const normalizeKey = (key: string) => {
    return key
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, "");     // remove special characters, spaces
};

const getRowValue = (row: any, aliases: string[]): string => {
    if (!row) return '';
    for (const key of Object.keys(row)) {
        const normKey = normalizeKey(key);
        if (aliases.includes(normKey)) {
            return (row[key] !== undefined && row[key] !== null) ? row[key].toString().trim() : '';
        }
    }
    // Fallback: match if any alias is a substring of the key
    for (const key of Object.keys(row)) {
        const normKey = normalizeKey(key);
        for (const alias of aliases) {
            if (normKey.includes(alias) || alias.includes(normKey)) {
                return (row[key] !== undefined && row[key] !== null) ? row[key].toString().trim() : '';
            }
        }
    }
    return '';
};

const isPlaceholderUser = (name: string) => {
    const n = name.toLowerCase().trim();
    return !n || n === '-' || n === '--' || n === '---' || n === '----' || n === 'n/a' || n === 'nao' || n === 'disponivel' || n === 'estoque' || n === 'sem usuario' || n === 'sem nome';
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess, userEmail }) => {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [importResult, setImportResult] = useState<{
        successCount: number;
        failCount: number;
        duplicates: { tag: string; reason: string }[];
    } | null>(null);

    React.useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('department').select('id, name');
            if (data) setDepartments(data);
        };
        fetchDepts();
    }, []);

    if (!isOpen) return null;

    const handleFileDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = (file: File) => {
        setFile(file);
        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Converte primeiro para array de arrays [ [col1, col2], [col1, col2] ]
                const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Procura a linha que contém os cabeçalhos (ex: que tenha 'Service TAG' ou 'Equipamento')
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(rows.length, 20); i++) {
                    const row = rows[i];
                    const rowString = JSON.stringify(row).toLowerCase();
                    if (rowString.includes('service tag') || rowString.includes('equipamento') || rowString.includes('patrimônio') || rowString.includes('tag') || rowString.includes('dispositivo') || rowString.includes('modelo') || rowString.includes('sn') || rowString.includes('serial')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                // Converte novamente agora partindo da linha correta
                const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
                console.log("JSON Data processado:", jsonData[0]); // Log para debug
                setPreviewData(jsonData);
            } catch (err) {
                setError("Erro ao ler arquivo. Verifique se é um Excel válido.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        setImporting(true);
        setError(null);
        let successCount = 0;
        let failCount = 0;
        const duplicatesList: { tag: string; reason: string }[] = [];

        try {
            console.log("Iniciando importação de", previewData.length, "linhas");

            // 0. Cache local de setores para evitar duplicatas durante o loop
            let currentDepts = [...departments];

            // 0. Busca todos os usuários já existentes para Fuzzy Matching
            const { data: existingUsers } = await supabase
                .from('assignments')
                .select('user_name')
                .is('returned_at', null);

            const existingNames = Array.from(new Set((existingUsers || []).map((u: any) => u.user_name as string))) as string[];

            const findFuzzyMatch = (newName: string) => {
                const normalizedNew = newName.toLowerCase().trim();
                if (!normalizedNew || normalizedNew === '----' || normalizedNew === 'não') return null;

                const exact = existingNames.find(n => n.toLowerCase().trim() === normalizedNew);
                if (exact) return exact;

                const substringMatch = existingNames.find(n => {
                    const normEx = n.toLowerCase().trim();
                    return normEx.includes(normalizedNew) || normalizedNew.includes(normEx);
                });
                if (substringMatch) return substringMatch;

                const firstNew = normalizedNew.split(' ')[0];
                if (firstNew.length > 3) {
                    const firstNameMatch = existingNames.find(n => n.toLowerCase().trim().split(' ')[0] === firstNew);
                    if (firstNameMatch) return firstNameMatch;
                }
                return null;
            };

            for (const row of previewData) {
                const tag = getRowValue(row, ['servicetag', 'tag', 'serial', 'ativo', 'patrimonio', 'numerodeserie', 'serialnumber', 'sn']);

                if (!tag) {
                    failCount++;
                    continue;
                }

                const typeVal = getRowValue(row, ['dispositivo', 'equipamento', 'tipo', 'type', 'device']) || 'Notebook';
                const lowerType = typeVal.toLowerCase().trim();
                let type = DeviceType.NOTEBOOK;

                if (lowerType.includes('macbook')) type = DeviceType.MACBOOK;
                else if (lowerType.includes('chromebook')) type = DeviceType.CHROMEBOOK;
                else if (lowerType.includes('monitor') || lowerType.includes('tela')) type = DeviceType.MONITOR;
                else if (lowerType.includes('headset') || lowerType.includes('fone')) type = DeviceType.HEADSET;
                else if (lowerType.includes('mouse')) type = DeviceType.MOUSE;
                else if (lowerType.includes('teclado') || lowerType.includes('keyboard')) type = DeviceType.KEYBOARD;
                else if (lowerType.includes('kit')) type = DeviceType.KEYBOARD_MOUSE_KIT;
                else if (lowerType.includes('adaptador') || lowerType.includes('adapter')) type = DeviceType.ADAPTER;
                else if (lowerType.includes('ipad') || lowerType.includes('tablet')) type = DeviceType.OTHER;
                else if (lowerType.includes('desktop') || lowerType.includes('computador')) type = DeviceType.OTHER;
                else type = DeviceType.OTHER;

                let model = getRowValue(row, ['modelo', 'model', 'aparelho', 'marcamodelo']);
                if (!model) {
                    model = typeVal; // fallback to device type if model is blank
                }

                const rawUserName = getRowValue(row, ['usuario', 'nome', 'responsavel', 'user', 'username', 'owner']);
                const isAssigned = rawUserName && !isPlaceholderUser(rawUserName);

                const statusColRaw = getRowValue(row, ['status', 'situacao', 'estado']).toLowerCase();
                let status = DeviceStatus.AVAILABLE;
                if (statusColRaw) {
                    if (statusColRaw.includes('em uso') || statusColRaw.includes('atribu')) {
                        status = DeviceStatus.IN_USE;
                    } else if (statusColRaw.includes('manuten')) {
                        status = DeviceStatus.MAINTENANCE;
                    }
                } else if (isAssigned) {
                    status = DeviceStatus.IN_USE;
                }

                // 1. Upsert Device
                const { data: deviceData, error: deviceError } = await supabase
                    .from('devices')
                    .upsert({
                        tag,
                        model,
                        type,
                        status,
                        serial_number: tag
                    }, { onConflict: 'tag' })
                    .select()
                    .single();

                if (deviceError || !deviceData) {
                    console.error("Erro ao salvar device:", tag, deviceError);
                    failCount++;
                    duplicatesList.push({
                        tag,
                        reason: deviceError?.message || 'Já cadastrado ou erro na gravação.'
                    });
                    continue;
                }

                // 2. Tratar atribuições (Assignments)
                if (status === DeviceStatus.IN_USE) {
                    const matchedName = findFuzzyMatch(rawUserName);
                    const finalUserName = matchedName || rawUserName;
                    
                    const userEmail = getRowValue(row, ['email', 'e-mail', 'correio']);

                    const userDeptName = getRowValue(row, ['departamento', 'setor', 'local', 'area', 'department', 'secao']);
                    const campusVal = getRowValue(row, ['campus', 'unidade', 'predio', 'filial']);

                    let deptId = null;
                    if (userDeptName) {
                        const normalizedDeptName = userDeptName.toString().trim();
                        if (normalizedDeptName && normalizedDeptName !== '----') {
                            let dept = currentDepts.find(d =>
                                d.name.toLowerCase() === normalizedDeptName.toLowerCase()
                            );

                            if (!dept) {
                                console.log("Criando setor inexistente:", normalizedDeptName);
                                const { data: newDept, error: deptError } = await supabase
                                    .from('department')
                                    .insert({ name: normalizedDeptName.toUpperCase() })
                                    .select()
                                    .single();

                                if (!deptError && newDept) {
                                    dept = newDept;
                                    currentDepts.push(newDept);
                                } else {
                                    console.error("Erro ao criar setor:", deptError);
                                }
                            }
                            deptId = dept ? dept.id : null;
                        }
                    }

                    if (!deptId && currentDepts.length > 0) {
                        const defaultDept = currentDepts.find(d => d.name.toUpperCase() === 'OUTROS');
                        deptId = defaultDept ? defaultDept.id : null;
                    }

                    // Verifica se já existe uma atribuição ativa para este dispositivo
                    const { data: activeAssignment } = await supabase
                        .from('assignments')
                        .select('id, user_name')
                        .eq('device_id', deviceData.id)
                        .is('returned_at', null)
                        .maybeSingle();

                    if (activeAssignment) {
                        if ((activeAssignment as any).user_name.toLowerCase().trim() !== finalUserName.toLowerCase().trim()) {
                            // Se o usuário mudou, fecha o anterior e abre um novo
                            await supabase
                                .from('assignments')
                                .update({ returned_at: new Date().toISOString() })
                                .eq('id', activeAssignment.id);

                            const { error: assignError } = await supabase.from('assignments').insert({
                                device_id: deviceData.id,
                                user_name: finalUserName,
                                user_email: userEmail,
                                department_id: deptId,
                                assigned_at: new Date().toISOString(),
                                user_role: UserRole.COLLABORATOR,
                                campus: campusVal
                            });
                            if (assignError) console.error("Erro ao criar atribuição para novo usuário:", tag, assignError);
                        }
                    } else {
                        // Não há atribuição ativa, cria uma nova
                        const { error: assignError } = await supabase.from('assignments').insert({
                            device_id: deviceData.id,
                            user_name: finalUserName,
                            user_email: userEmail,
                            department_id: deptId,
                            assigned_at: new Date().toISOString(),
                            user_role: UserRole.COLLABORATOR,
                            campus: campusVal
                        });
                        if (assignError) console.error("Erro ao criar atribuição inicial:", tag, assignError);
                    }

                    // 3. Trata periféricos
                    const peripheral = getRowValue(row, ['periferico', 'acessorio', 'perifericos', 'acessorios']);
                    if (peripheral && peripheral !== 'não' && peripheral !== 'n/a') {
                        console.log(`Bingo: ${finalUserName} tem periféricos: ${peripheral}. Vincular manualmente se necessário.`);
                    }
                } else if (status === DeviceStatus.AVAILABLE) {
                    // Se o dispositivo ficou disponível, fecha qualquer atribuição ativa
                    const { data: activeAssignment } = await supabase
                        .from('assignments')
                        .select('id')
                        .eq('device_id', deviceData.id)
                        .is('returned_at', null)
                        .maybeSingle();

                    if (activeAssignment) {
                        await supabase
                            .from('assignments')
                            .update({ returned_at: new Date().toISOString() })
                            .eq('id', activeAssignment.id);
                    }
                }
                successCount++;
            }

            setDepartments(currentDepts); // Atualiza estado global após o loop
            console.log(`Importação concluída: ${successCount} sucessos, ${failCount} falhas`);
            setImportResult({
                successCount,
                failCount,
                duplicates: duplicatesList
            });
        } catch (err) {
            console.error("Erro critico na importacao:", err);
            setError("Erro ao processar importação.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] relative">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Importar Inventário</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                    {importResult ? (
                        <div className="space-y-6 text-white animate-in fade-in duration-200">
                            <div className="flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                    importResult.failCount === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-wider">Importação Finalizada</h3>
                                <p className="text-white/40 text-sm mt-1">O processamento da planilha foi concluído.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">Cadastrados com Sucesso</span>
                                    <span className="text-3xl font-black text-white">{importResult.successCount}</span>
                                </div>
                                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl text-center">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Ignorados / Duplicados</span>
                                    <span className="text-3xl font-black text-white">{importResult.failCount}</span>
                                </div>
                            </div>

                            {importResult.duplicates.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400/80">Itens Ignorados (Duplicados):</h4>
                                    <div className="bg-black/20 border border-white/5 rounded-xl max-h-48 overflow-y-auto p-4 space-y-2">
                                        {importResult.duplicates.map((dup, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                <span className="font-mono text-white/90 font-bold">{dup.tag}</span>
                                                <span className="text-rose-400 font-semibold text-[10px] uppercase tracking-wider">{dup.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !file ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleFileDrop}
                            className={`relative border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center gap-4 transition-all ${dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                        >
                            <Upload size={48} className={dragging ? 'text-indigo-400' : 'text-white/20'} />
                            <div className="text-center">
                                <p className="text-white font-bold">Arraste sua planilha aqui</p>
                                <p className="text-white/40 text-sm mt-1">ou clique para selecionar</p>
                            </div>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv, .xml"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{file.name}</p>
                                        <p className="text-white/40 text-xs">{previewData.length} registros encontrados</p>
                                    </div>
                                </div>
                                <button onClick={() => { setFile(null); setPreviewData([]); }} className="text-white/40 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {previewData.length > 0 && (
                                <div className="bg-black/20 rounded-xl p-4 max-h-64 overflow-y-auto border border-white/5">
                                    <table className="w-full text-left text-xs">
                                        <thead className="text-white/40 uppercase tracking-wider sticky top-0 bg-slate-900">
                                            <tr>
                                                <th className="pb-3 text-left">TAG</th>
                                                <th className="pb-3 text-left">Modelo</th>
                                                <th className="pb-3 text-left">Status</th>
                                                <th className="pb-3 text-left">Responsável</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-white/80">
                                            {previewData.slice(0, 50).map((row, i) => {
                                                const tag = getRowValue(row, ['servicetag', 'tag', 'serial', 'ativo', 'patrimonio', 'numerodeserie', 'serialnumber', 'sn']);
                                                const typeVal = getRowValue(row, ['dispositivo', 'equipamento', 'tipo', 'type', 'device']) || 'Notebook';
                                                let model = getRowValue(row, ['modelo', 'model', 'aparelho', 'marcamodelo']);
                                                if (!model) model = typeVal;

                                                const rawUserName = getRowValue(row, ['usuario', 'nome', 'responsavel', 'user', 'username', 'owner']);
                                                const isAssigned = rawUserName && !isPlaceholderUser(rawUserName);

                                                const statusColRaw = getRowValue(row, ['status', 'situacao', 'estado']).toLowerCase();
                                                let statusVal = 'Disponível';
                                                if (statusColRaw) {
                                                    if (statusColRaw.includes('em uso') || statusColRaw.includes('atribu')) {
                                                        statusVal = 'Em Uso';
                                                    } else if (statusColRaw.includes('manuten')) {
                                                        statusVal = 'Manutenção';
                                                    }
                                                } else if (isAssigned) {
                                                    statusVal = 'Em Uso';
                                                }

                                                return (
                                                    <tr key={i} className="border-t border-white/5">
                                                        <td className="py-2">
                                                            {tag || '-'}
                                                        </td>
                                                        <td className="py-2">
                                                            {model || '-'}
                                                        </td>
                                                        <td className="py-2">
                                                            <span className={`status-badge ${
                                                                statusVal.includes('Uso') ? 'status-badge-em-uso' :
                                                                statusVal.includes('Manuten') ? 'status-badge-manutencao' :
                                                                'status-badge-disponivel'
                                                            }`}>
                                                                {statusVal}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-indigo-400 font-bold">
                                                            {rawUserName || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {previewData.length > 50 && (
                                        <p className="text-center text-white/20 text-xs mt-4">... e mais {previewData.length - 50} linhas</p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    {importResult ? (
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreviewData([]);
                                setImportResult(null);
                                onSuccess();
                                onClose();
                            }}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all"
                        >
                            Concluir
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-6 py-3 text-white/60 hover:text-white font-bold text-sm uppercase tracking-wider">
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || importing || previewData.length === 0}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2"
                            >
                                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                {importing ? 'Importando...' : 'Confirmar Importação'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
