import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = !app.isPackaged;

// Define a pasta de dados gravável do Electron
process.env.USER_DATA_PATH = app.getPath('userData');

// Define a porta do Express: 3001 em dev (com proxy do Vite), 3000 em prod
process.env.PORT = isDev ? '3001' : '3000';

// Inicia o servidor backend Express com logs de erro
import('./server.js').catch(err => {
    console.error("Erro ao iniciar o servidor Express:", err);
    try {
        const logPath = path.join(app.getPath('userData'), 'backend-error.log');
        fs.writeFileSync(logPath, `${new Date().toISOString()}\n${err.stack || err.toString()}`);
    } catch (e) {
        // ignore
    }
});

// Helper para aguardar que o servidor Express inicialize e defina a porta de escuta
function waitForPort() {
    return new Promise((resolve) => {
        const check = () => {
            if (global.expressServerPort) {
                resolve(global.expressServerPort);
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

async function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 850,
        title: "EAV Equipamentos",
        icon: path.join(__dirname, 'build', 'icon.ico'), // Ícone da janela e barra de tarefas
        autoHideMenuBar: true, // Oculta a barra de menu clássica para parecer nativo
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (isDev) {
        // Em desenvolvimento, carrega o servidor do Vite (HTTPS)
        win.loadURL('https://localhost:3000');
    } else {
        // Em produção, carrega o Express local na porta dinâmica onde ele conseguiu alocar
        const port = await waitForPort();
        console.log(`[Electron] Carregando o backend local na porta ${port}...`);
        win.loadURL(`http://localhost:${port}`);
    }

    win.on('page-title-updated', (e) => {
        e.preventDefault(); // Impede alteração de título da janela
    });
}

// Ignorar erros de certificado autoassinado em desenvolvimento (Plugin SSL do Vite)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
