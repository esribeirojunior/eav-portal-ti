const fs = require('fs');
const path = require('path');

const downloadsDir = 'c:\\\\Users\\\\erisson.junior\\\\Downloads';
const dirs = fs.readdirSync(downloadsDir);

function searchDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'dist-electron' && file !== 'build') {
        searchDir(fullPath);
      }
    } else {
      const ext = path.extname(file);
      if (ext === '.tsx' || ext === '.ts' || ext === '.js' || ext === '.html') {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('Erisson') || content.includes('2026')) {
          console.log(`File: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('Erisson') || line.includes('2026')) {
              console.log(`  L${idx+1}: ${line.trim()}`);
            }
          });
          console.log('---------------------------');
        }
      }
    }
  });
}

dirs.forEach(dir => {
  const fullPath = path.join(downloadsDir, dir);
  if (fs.statSync(fullPath).isDirectory() && dir.startsWith('EAVTEST-main')) {
    try {
      searchDir(fullPath);
    } catch(e) {}
  }
});
