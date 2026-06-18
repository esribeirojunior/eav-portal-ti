const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');
const replaceStr = fs.readFileSync('replace.txt', 'utf8');

const startIdx = code.indexOf('<header className="px-4 md:px-12 h-20 md:h-28 flex items-center justify-between sticky top-0 glass-header z-40">');
if (startIdx === -1) {
    console.error("Start not found");
    process.exit(1);
}

// Find the start of the <header> block
const headerStartIdx = code.lastIndexOf('            <header', startIdx);

// Find </main> starting from headerStartIdx
const endIdx = code.indexOf('</main>', headerStartIdx);
if (endIdx === -1) {
    console.error("End not found");
    process.exit(1);
}

const finalEndIdx = endIdx + '</main>'.length;

const before = code.substring(0, headerStartIdx);
const after = code.substring(finalEndIdx);

const newCode = before + replaceStr + after;

fs.writeFileSync('App.tsx', newCode, 'utf8');
console.log("Successfully replaced layout by index slicing!");
