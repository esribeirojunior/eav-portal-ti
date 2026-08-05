const fs = require('fs');
const file = 'C:\\\\Users\\\\erisson.junior\\\\.gemini\\\\antigravity-ide\\\\brain\\\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\\\.system_generated\\\\logs\\\\transcript.jsonl';

if (!fs.existsSync(file)) {
  console.log("Transcript file does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    // Search for first VIEW_FILE or edit of App.tsx to see what it was originally
    if (data.type === 'VIEW_FILE' && data.content && data.content.includes('App.tsx')) {
      const idx = data.content.indexOf('Escola Americana de Vitória');
      if (idx !== -1) {
        console.log(`Step ${data.step_index} VIEW_FILE contains:`);
        console.log(data.content.substring(idx, idx + 200));
        console.log('=============================');
      }
    }
  } catch (e) {}
}
