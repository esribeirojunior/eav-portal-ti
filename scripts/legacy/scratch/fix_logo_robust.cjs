const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

const startIndex = txt.indexOf('const LogoEAV =');
if (startIndex === -1) {
    console.error("Could not find LogoEAV start");
    process.exit(1);
}

// Find the start of the next component or the comment before it
let endIndex = txt.indexOf('// --- LOGIN SCREEN ---', startIndex);
if (endIndex === -1) {
    endIndex = txt.indexOf('const LoginScreen =', startIndex);
}

if (endIndex === -1) {
    console.error("Could not find end of LogoEAV");
    process.exit(1);
}

const logoComponent = `const LogoEAV = ({ size = "normal", theme = "light" }: { size?: "small" | "normal" | "large", theme?: "light" | "dark", single?: boolean }) => {
  const eavWidths = { 
    small: 'w-32 md:w-40', 
    normal: 'w-48 md:w-56', 
    large: 'w-64 md:w-72' 
  };

  const selectedEavWidth = eavWidths[size] || eavWidths.normal;
  const logoSrc = theme === "dark" ? "/logo-branco.png" : "/logo.png";

  return (
    <div className="flex items-center cursor-pointer group select-none">
      <div className={\`flex items-center justify-center \${selectedEavWidth}\`}>
        <img 
          src={logoSrc} 
          alt="EAV International School" 
          className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
        />
      </div>
    </div>
  );
};

`;

const before = txt.substring(0, startIndex);
const after = txt.substring(endIndex);

fs.writeFileSync('App.tsx', before + logoComponent + after);
console.log('LogoEAV rewritten correctly');
