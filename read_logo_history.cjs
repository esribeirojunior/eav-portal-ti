const fs = require('fs');
const path = require('path');
const file = 'C:\\Users\\erisson.junior\\.gemini\\antigravity-ide\\brain\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(file)) {
  console.log("Transcript file does not exist");
  process.exit(0);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log("Total lines:", lines.length);

lines.forEach((line, idx) => {
  if (line.includes('LogoEAV') || line.includes('logo') || line.includes('Logo')) {
    try {
      const obj = JSON.parse(line);
      console.log(`Step ${obj.step_index} (${obj.type}):`);
      if (obj.tool_calls) {
        console.log("Tool calls:", JSON.stringify(obj.tool_calls).substring(0, 500));
      }
      if (obj.content) {
        console.log("Content:", obj.content.substring(0, 500));
      }
    } catch (e) {
      // ignore
    }
  }
});
