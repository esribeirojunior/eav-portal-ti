const fs = require('fs');
const file = 'C:\\\\Users\\\\erisson.junior\\\\.gemini\\\\antigravity-ide\\\\brain\\\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\\\.system_generated\\\\logs\\\\transcript.jsonl';

if (!fs.existsSync(file)) {
  console.log("Transcript file does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');
const targetSteps = [447, 477];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (targetSteps.includes(data.step_index) && data.type === 'PLANNER_RESPONSE') {
      if (data.tool_calls) {
        data.tool_calls.forEach(tc => {
          console.log(`=== Step ${data.step_index} (${tc.name}) ===`);
          console.log(typeof tc.args);
          console.log(JSON.stringify(tc.args).substring(0, 1000));
        });
      }
    }
  } catch (e) {}
}
