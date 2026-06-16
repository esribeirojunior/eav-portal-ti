const fs = require('fs');
const file = 'C:\\\\Users\\\\erisson.junior\\\\.gemini\\\\antigravity-ide\\\\brain\\\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\\\.system_generated\\\\logs\\\\transcript.jsonl';

if (!fs.existsSync(file)) {
  console.log("Transcript file does not exist");
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');
const targetSteps = [63, 103, 297, 303, 309, 337, 341, 396, 400, 447, 458, 477, 499];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (targetSteps.includes(data.step_index)) {
      console.log(`Step ${data.step_index} is of type ${data.type}`);
      if (data.tool_calls) {
        data.tool_calls.forEach(tc => {
          console.log(`  Tool call: ${tc.name}`);
          let args = tc.args;
          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch (e) {}
          }
          if (args && typeof args === 'object') {
            console.log(`    TargetFile: ${args.TargetFile || args.AbsolutePath}`);
            console.log(`    Instruction: ${args.Instruction}`);
          }
        });
      }
    }
  } catch (e) {}
}
