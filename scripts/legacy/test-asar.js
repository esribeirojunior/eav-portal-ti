const { app } = require('electron');
app.whenReady().then(async () => {
    console.log("Starting test...");
    try {
        const { serverReady } = await import('./dist-electron/win-unpacked/resources/app.asar/server.js');
        const port = await serverReady;
        console.log("Server started on port", port);
    } catch (e) {
        console.error("CRASH:", e);
    }
    app.quit();
});
