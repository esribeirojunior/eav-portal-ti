const fs = require('fs');

const targetFile = 'C:\\Users\\erisson.junior\\.gemini\\antigravity-ide\\brain\\17336537-c1c1-43d0-8951-a8b148d403de\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(targetFile)) {
  console.log("Transcript not found");
  process.exit(1);
}

const lines = fs.readFileSync(targetFile, 'utf8').split('\n');
console.log("Total lines:", lines.length);

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        let args = tc.args;
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch (e) {}
        }
        const str = JSON.stringify(args);
        if (str.includes("App.tsx")) {
          console.log(`Step ${data.step_index} (${tc.name}) - Instruction: ${args.Instruction || args.Description}`);
        }
      }
    }
  } catch (e) {}
}
