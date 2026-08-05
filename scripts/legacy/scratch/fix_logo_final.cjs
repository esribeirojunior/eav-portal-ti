const fs = require('fs');
let txt = fs.readFileSync('App.tsx', 'utf-8');

// 1. Rewrite LogoEAV completely
const logoComponent = `const LogoEAV = ({ size = "normal", theme = "light" }: { size?: "small" | "normal" | "large", theme?: "light" | "dark" }) => {
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
};`;

txt = txt.replace(/const LogoEAV = \(\{[\s\S]*?\}\) => \{[\s\S]*?return \([\s\S]*?\}\);\n\};/m, logoComponent);

fs.writeFileSync('App.tsx', txt);
console.log('LogoEAV rewritten');
