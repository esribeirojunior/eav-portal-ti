const fs = require('fs');
const file = 'C:\\\\Users\\\\erisson.junior\\\\.gemini\\\\antigravity-ide\\\\brain\\\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\\\.system_generated\\\\logs\\\\transcript.jsonl';

const lines = fs.readFileSync(file, 'utf8').split('\n');
const targetSteps = [447, 477];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (targetSteps.includes(data.step_index) && data.type === 'PLANNER_RESPONSE') {
      data.tool_calls.forEach(tc => {
        let args = tc.args;
        if (typeof args === 'string') {
          args = JSON.parse(args);
        }
        console.log(`Step ${data.step_index} args keys:`, Object.keys(args));
        console.log(`Step ${data.step_index} ReplacementChunks type:`, typeof args.ReplacementChunks);
        console.log(`Step ${data.step_index} ReplacementChunks raw:`, String(args.ReplacementChunks).substring(0, 200));
        let chunks = args.ReplacementChunks;
        if (typeof chunks === 'string') {
          try {
            chunks = JSON.parse(chunks);
            console.log(`  Parsed chunks is array?`, Array.isArray(chunks));
            console.log(`  Parsed chunks length:`, chunks.length);
          } catch(e) {
            console.log(`  Parse error:`, e.message);
          }
        }
      });
    }
  } catch (e) {}
}
