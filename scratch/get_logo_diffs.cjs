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
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            let args = tc.args;
            if (typeof args === 'string') {
              try {
                args = JSON.parse(args);
              } catch (e) {}
            }
            if (args && typeof args === 'object') {
              const content = args.ReplacementContent || '';
              const target = args.TargetContent || '';
              const chunks = args.ReplacementChunks || [];
              
              let hasLogo = content.includes('Logo') || content.includes('logo') || target.includes('Logo') || target.includes('logo') || content.includes('2025') || content.includes('2026');
              for (const chunk of chunks) {
                if (chunk.ReplacementContent.includes('Logo') || chunk.ReplacementContent.includes('logo') || chunk.TargetContent.includes('Logo') || chunk.TargetContent.includes('logo') || chunk.ReplacementContent.includes('2025') || chunk.ReplacementContent.includes('2026')) {
                  hasLogo = true;
                }
              }

              if (hasLogo) {
                console.log(`--- Step ${data.step_index} (${tc.name}) ---`);
                console.log('Instruction:', args.Instruction);
                if (chunks.length > 0) {
                  chunks.forEach((c, i) => {
                    console.log(`  Chunk ${i+1}:`);
                    console.log('  Target:', c.TargetContent);
                    console.log('  Replacement:', c.ReplacementContent);
                  });
                } else {
                  console.log('Target:', target);
                  console.log('Replacement:', content);
                }
                console.log('========================================');
              }
            }
          }
        }
      }
    }
  } catch (e) {}
}
