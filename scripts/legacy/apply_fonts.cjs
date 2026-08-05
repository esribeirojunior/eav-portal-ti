const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ROIModule.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace "font-black" with "font-poppins font-black" for major headings
content = content.replace(/<h1 className="([^"]*)font-black([^"]*)"/g, '<h1 className="$1font-poppins font-black$2"');
content = content.replace(/<h2 className="([^"]*)font-black([^"]*)"/g, '<h2 className="$1font-poppins font-black$2"');
content = content.replace(/<span className="([^"]*)font-black([^"]*)"/g, '<span className="$1font-poppins font-black$2"');
content = content.replace(/<p className="text-3xl font-black/g, '<p className="font-poppins text-3xl font-black');
content = content.replace(/<p className="text-6xl/g, '<p className="font-poppins text-6xl');

// Add "font-montserrat" for subtitles (h3, p)
content = content.replace(/<h3 className="([^"]*)"/g, '<h3 className="$1 font-montserrat"');
content = content.replace(/<p className="([^"]*font-medium[^"]*)"/g, '<p className="$1 font-montserrat"');
content = content.replace(/<p className="text-xl font-bold/g, '<p className="font-montserrat text-xl font-bold');
content = content.replace(/<p className="text-sm text-\[\#70508a\]/g, '<p className="font-montserrat text-sm text-[#70508a]');
content = content.replace(/<span className="text-\[10px\]/g, '<span className="font-montserrat text-[10px]');
content = content.replace(/<p className="text-\[10px\]/g, '<p className="font-montserrat text-[10px]');
content = content.replace(/<span className="text-xs/g, '<span className="font-montserrat text-xs');
content = content.replace(/<span className="font-black text-xl/g, '<span className="font-poppins font-black text-xl');

// Clean up duplicate font-poppins if they happen to already have it
content = content.replace(/font-poppins font-poppins/g, 'font-poppins');
content = content.replace(/font-montserrat font-montserrat/g, 'font-montserrat');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully applied Poppins and Montserrat fonts.");
