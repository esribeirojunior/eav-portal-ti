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

// Helper definitions
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
        // Em desenvolvimento, carrega o servidor do Vite (HTTPS) e inicia o backend na 3001
        import('./server.js').catch(console.error);
        win.loadURL('https://localhost:3000');
    } else {
        // Em produção, carrega o Express local
        try {
            const { serverReady } = await import('./server.js');
            const port = await serverReady;
            console.log(`[Electron] Carregando o backend local na porta ${port}...`);
            win.loadURL(`http://127.0.0.1:${port}`);
        } catch (error) {
            console.error("Erro ao iniciar o servidor backend:", error);
            try {
                const logPath = path.join(app.getPath('userData'), 'backend-crash.log');
                fs.writeFileSync(logPath, error.stack || error.toString());
            } catch (e) {}
            win.webContents.openDevTools();
            // Tenta carregar mesmo assim na 3000 para forçar erro visível
            win.loadURL(`http://127.0.0.1:3000`);
        }
    }

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        const errorLog = `Failed to load: ${validatedURL}\nError Code: ${errorCode}\nDescription: ${errorDescription}\n`;
        console.error(errorLog);
        try {
            const logPath = path.join(app.getPath('userData'), 'load-error.log');
            fs.appendFileSync(logPath, `${new Date().toISOString()}\n${errorLog}`);
        } catch (e) {}
    });

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
