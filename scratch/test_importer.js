const normalizeKey = (key) => {
    return key
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]/g, "");     // remove special characters, spaces
};

const getRowValue = (row, aliases) => {
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

const row = {
    "Campus": "Aeroporto",
    "Departamento": "Financeiro",
    "Usuário": "Arthur.falk",
    "Dispositivo ": "Notebook",
    "Modelo ": "Dell Pro 16",
    "ST / SN ": "DXXS0H4",
    " Email": ""
};

console.log("dispositivo:", getRowValue(row, ['dispositivo', 'equipamento', 'tipo', 'type', 'device']));
console.log("modelo:", getRowValue(row, ['modelo', 'model', 'aparelho', 'marcamodelo']));
console.log("tag:", getRowValue(row, ['servicetag', 'tag', 'serial', 'ativo', 'patrimonio', 'numerodeserie', 'serialnumber', 'sn']));
