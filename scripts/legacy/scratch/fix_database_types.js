import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const EXCEL_PATH = path.join(PROJECT_ROOT, 'data', 'inventario.xlsx');
const GOOGLE_CREDS_PATH = path.join(PROJECT_ROOT, 'data', 'google-credentials.json');
const SPREADSHEET_ID = '1uNLKLitQLRCf1bwVZ9Gy-VnZttUp7HybYxMypFaz0Yg';

console.log('EXCEL_PATH:', EXCEL_PATH);
console.log('GOOGLE_CREDS_PATH:', GOOGLE_CREDS_PATH);

async function getSheetsRows() {
  const creds = JSON.parse(fs.readFileSync(GOOGLE_CREDS_PATH, 'utf-8'));
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const client = google.sheets({ version: 'v4', auth });
  
  const metadata = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const firstSheetName = metadata.data.sheets[0].properties.title;
  console.log('Lendo aba do Google Sheets:', firstSheetName);
  
  const response = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${firstSheetName}!A:G`
  });
  
  return response.data.values || [];
}

function normalize(str) {
  return String(str || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function run() {
  try {
    const sheetRows = await getSheetsRows();
    if (sheetRows.length < 2) {
      console.error('Nenhum dado encontrado no Google Sheets.');
      return;
    }
    
    // Detect headers row
    let headerRowIndex = 0;
    for (let i = 0; i < sheetRows.length; i++) {
      if (sheetRows[i].includes('Campus') || sheetRows[i].includes('Departamento') || sheetRows[i].includes('Usuário')) {
        headerRowIndex = i;
        break;
      }
    }
    
    const headers = sheetRows[headerRowIndex].map(h => String(h || '').trim());
    const dataRows = sheetRows.slice(headerRowIndex + 1);
    
    const campusIdx = headers.indexOf('Campus');
    const deptIdx = headers.indexOf('Departamento');
    const userIdx = headers.indexOf('Usuário');
    const deviceTypeIdx = headers.indexOf('Dispositivo');
    const modelIdx = headers.indexOf('Modelo');
    const serialIdx = headers.indexOf('Service Tag');
    
    console.log(`Headers detectados: Campus(${campusIdx}), Dept(${deptIdx}), User(${userIdx}), Type(${deviceTypeIdx}), Model(${modelIdx}), Serial(${serialIdx})`);
    
    // Ler Excel local
    const wb = XLSX.readFile(EXCEL_PATH);
    const devices = XLSX.utils.sheet_to_json(wb.Sheets['devices']);
    const assignments = XLSX.utils.sheet_to_json(wb.Sheets['assignments']);
    const departments = XLSX.utils.sheet_to_json(wb.Sheets['department']);
    
    console.log(`Dispositivos no Excel local: ${devices.length}`);
    console.log(`Atribuições no Excel local: ${assignments.length}`);
    
    let updatedCount = 0;
    
    // Mapear cada dispositivo no banco local
    for (const dev of devices) {
      const activeAssign = assignments.find(a => String(a.device_id) === String(dev.id) && !a.returned_at);
      const user = activeAssign ? activeAssign.user_name : null;
      const campus = activeAssign ? activeAssign.campus : null;
      
      let matchedRow = null;
      
      // 1. Tentar casar pelo Serial Number se for válido (não-TEMP, não-N/A)
      if (dev.serial_number && !dev.serial_number.includes('TEMP') && dev.serial_number.toUpperCase() !== 'N/A' && dev.serial_number.toUpperCase() !== 'ACESSÓRIO') {
        matchedRow = dataRows.find(row => {
          const sheetSerial = String(row[serialIdx] || '').trim();
          return sheetSerial.toLowerCase() === dev.serial_number.toLowerCase();
        });
      }
      
      // 2. Se não casou pelo Serial e o dispositivo estiver atribuído, tentar casar pelo Usuário e Campus
      if (!matchedRow && user) {
        const potentialRows = dataRows.filter(row => {
          const sheetUser = String(row[userIdx] || '').trim();
          const sheetCampus = String(row[campusIdx] || '').trim();
          return normalize(sheetUser) === normalize(user) && normalize(sheetCampus) === normalize(campus);
        });
        
        if (potentialRows.length === 1) {
          matchedRow = potentialRows[0];
        } else if (potentialRows.length > 1) {
          // Se houver mais de um, tentar casar pelo tipo/modelo por eliminação
          // E.g., se o modelo no banco contiver palavras-chave do tipo ou modelo do sheet
          matchedRow = potentialRows.find(row => {
            const sheetType = String(row[deviceTypeIdx] || '').trim().toLowerCase();
            const sheetModel = String(row[modelIdx] || '').trim().toLowerCase();
            const devModel = String(dev.model || '').trim().toLowerCase();
            
            return devModel.includes(sheetType) || devModel.includes(sheetModel) ||
                   sheetType.includes(dev.type.toLowerCase()) || 
                   (sheetType.includes('macbook') && dev.type === 'MacBook') ||
                   (sheetType.includes('monitor') && dev.type === 'Outro'); // O caso específico do monitor marcado como Outro
          });
          
          // Se ainda assim não encontrar, pegamos o primeiro com serial N/A ou correspondente
          if (!matchedRow) {
            matchedRow = potentialRows.find(row => String(row[serialIdx] || '').trim().toUpperCase() === 'N/A');
          }
        }
      }
      
      // Se encontramos uma linha correspondente no Google Sheets, atualizamos o tipo e modelo no Excel local
      if (matchedRow) {
        const rawType = String(matchedRow[deviceTypeIdx] || '').trim();
        const rawModel = String(matchedRow[modelIdx] || '').trim();
        
        // Determinar o tipo mapeado correto para o sistema
        let correctType = dev.type;
        const lowerRawType = rawType.toLowerCase();
        
        if (lowerRawType.includes('macbook') || lowerRawType.includes('macoobk')) correctType = 'MacBook';
        else if (lowerRawType.includes('chromebook')) correctType = 'Chromebook';
        else if (lowerRawType.includes('monitor') || lowerRawType.includes('tela')) correctType = 'Monitor';
        else if (lowerRawType.includes('headset') || lowerRawType.includes('fone')) correctType = 'Headset';
        else if (lowerRawType.includes('mouse')) correctType = 'Mouse';
        else if (lowerRawType.includes('teclado') || lowerRawType.includes('keyboard')) correctType = 'Teclado';
        else if (lowerRawType.includes('kit')) correctType = 'Kit Teclado/mouse';
        else if (lowerRawType.includes('adaptador') || lowerRawType.includes('adapter')) correctType = 'Adaptador';
        else if (lowerRawType.includes('notebook')) correctType = 'Notebook';
        else if (rawType) correctType = rawType;
        
        // Se mudou ou se é Lorena e era Outro, atualiza!
        if (dev.type !== correctType || (user === 'Lorena' && dev.type === 'Outro')) {
          console.log(`[ATUALIZANDO] Tag: ${dev.tag} | Usuário: ${user || 'ESTOQUE'} | Modelo Atual: ${dev.model} | Tipo Atual: ${dev.type} -> Novo Tipo: ${correctType}`);
          dev.type = correctType;
          
          // Se o modelo atual for N/A mas no sheet tiver um modelo melhor, ou vice-versa, atualiza
          if (rawModel && rawModel !== 'N/A' && (dev.model === 'N/A' || !dev.model)) {
            console.log(`  -> Atualizando Modelo: ${dev.model} -> ${rawModel}`);
            dev.model = rawModel;
          }
          
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      // Gravar de volta no Excel
      const newSheet = XLSX.utils.json_to_sheet(devices);
      wb.Sheets['devices'] = newSheet;
      XLSX.writeFile(wb, EXCEL_PATH);
      console.log(`\nSucesso! Foram corrigidos ${updatedCount} dispositivos no Excel local.`);
    } else {
      console.log('\nNenhuma alteração foi necessária. Todas as categorias estão corretas.');
    }
    
  } catch (err) {
    console.error('Erro ao executar correção de categorias:', err);
  }
}

run();
