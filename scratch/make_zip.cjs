const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const source = "c:\\Users\\erisson.junior\\Downloads\\EAVTEST-main (4)\\EAVTEST-main";
const destDir = "c:\\Users\\erisson.junior\\Downloads\\EAV-Deploy-Fixed";
const zipFile = "c:\\Users\\erisson.junior\\Downloads\\EAV-Deploy-Fixed.zip";

if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });
if (fs.existsSync(zipFile)) fs.rmSync(zipFile, { force: true });
fs.mkdirSync(destDir, { recursive: true });

const exclude = ['node_modules', 'dist', 'dist-electron', '.git'];

function copyFolderSync(from, to) {
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (exclude.includes(element)) return;
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        const stat = fs.lstatSync(fromPath);
        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else if (stat.isDirectory()) {
            copyFolderSync(fromPath, toPath);
        }
    });
}

console.log("Copiando arquivos...");
copyFolderSync(source, destDir);
console.log("Compactando...");
execSync(`powershell Compress-Archive -Path "${destDir}\\*" -DestinationPath "${zipFile}" -Force`);
console.log("Limpando temporários...");
fs.rmSync(destDir, { recursive: true, force: true });
console.log("PRONTO! Arquivo salvo em: " + zipFile);
