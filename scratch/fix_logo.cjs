const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

// 1. Modify LogoEAV signature
txt = txt.replace(
  'const LogoEAV = ({ size = "normal", theme = "light" }: { size?: "small" | "normal" | "large", theme?: "light" | "dark" }) => {',
  'const LogoEAV = ({ size = "normal", theme = "light", single = false }: { size?: "small" | "normal" | "large", theme?: "light" | "dark", single?: boolean }) => {'
);

// 2. Wrap the divider and Buaiz logo with !single
txt = txt.replace(
  '{/* Divisor Visual */}',
  '{/* Divisor Visual */}\n      {!single && <div className={`w-[1.5px] h-6 md:h-10 rounded-full mx-1 md:mx-2 ${theme === \'dark\' ? \'bg-white/40\' : \'bg-slate-300\'}`} />}\n\n      {/* Logo Grupo Buaiz */}\n      {!single && (\n      <div className={`flex items-center justify-center flex-shrink-0 ${selectedHeight} w-24 md:w-36 overflow-hidden py-1`}>\n        <img \n          src="/grupo-buaiz.jpg" \n          alt="Grupo Buaiz" \n          className={`w-full h-full object-contain scale-[3.5] md:scale-[4.5] origin-center ${theme === \'dark\' ? \'\' : \'mix-blend-multiply contrast-125\'}`}\n          style={theme === \'dark\' ? { filter: \'grayscale(1) contrast(200%) invert(1)\' } : undefined}\n        />\n      </div>\n      )}'
);

// Remove the old divider and Buaiz logo that we just duplicated
txt = txt.replace(
  '<div className={`w-[1.5px] h-6 md:h-10 rounded-full mx-1 md:mx-2 ${theme === \'dark\' ? \'bg-white/40\' : \'bg-slate-300\'}`} />\n\n      {/* Logo Grupo Buaiz */}\n      <div className={`flex items-center justify-center flex-shrink-0 ${selectedHeight} w-24 md:w-36 overflow-hidden py-1`}>\n        <img \n          src="/grupo-buaiz.jpg" \n          alt="Grupo Buaiz" \n          className={`w-full h-full object-contain scale-[3.5] md:scale-[4.5] origin-center ${theme === \'dark\' ? \'\' : \'mix-blend-multiply contrast-125\'}`}\n          style={theme === \'dark\' ? { filter: \'grayscale(1) contrast(200%) invert(1)\' } : undefined}\n        />\n      </div>',
  ''
);

// 3. Add single={true} to the LogoEAV in the sidebar
txt = txt.replace(
  '<LogoEAV size="small" theme="dark" />',
  '<LogoEAV size="small" theme="dark" single={true} />'
);

fs.writeFileSync('App.tsx', txt);
console.log('Fixed LogoEAV and sidebar overflow');
