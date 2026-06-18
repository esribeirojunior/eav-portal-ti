const fs = require('fs');

try {
  let code = fs.readFileSync('App.tsx', 'utf8');
  const targetStr = fs.readFileSync('target.txt', 'utf8');
  const replaceStr = fs.readFileSync('replace.txt', 'utf8');

  if (code.indexOf(targetStr) === -1) {
    console.error("Target text NOT found in App.tsx! Check whitespace or exact matches.");
  } else {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('App.tsx', code, 'utf8');
    console.log("Successfully replaced the layout in App.tsx!");
  }
} catch(e) {
  console.error(e);
}
