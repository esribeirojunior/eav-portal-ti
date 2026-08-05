const fs = require('fs');

let txt = fs.readFileSync('App.tsx', 'utf-8');

// 1. Remove the old toggle from the sidebar header
const startToggle = txt.indexOf('{/* Botão de Toggle Light/Dark Mode */}');
const endToggle = txt.indexOf('</button>', startToggle) + '</button>'.length;

if (startToggle !== -1 && endToggle !== -1) {
    txt = txt.substring(0, startToggle) + txt.substring(endToggle);
}

// 2. Create the floating button logic and place it right before <Copilot />
const floatingButton = `      {/* FLOATING THEME TOGGLE (Igual IA) */}
      <button 
        onClick={() => {
          const html = document.documentElement;
          if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            html.classList.add('light');
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
            setThemeState('light');
          } else {
            html.classList.add('dark');
            html.classList.remove('light');
            document.body.classList.add('dark');
            document.body.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setThemeState('dark');
          }
        }}
        className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/50 hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group border border-slate-200 dark:border-slate-700"
        title="Alternar Tema"
      >
        <Sun size={24} className="hidden dark:block group-hover:text-amber-400 transition-colors" />
        <Moon size={24} className="block dark:hidden group-hover:text-indigo-500 transition-colors" />
      </button>

      {/* EAV COPILOT (Chatbot IA) */}`;

txt = txt.replace('{/* EAV COPILOT (Chatbot IA) */}', floatingButton);

fs.writeFileSync('App.tsx', txt);
console.log('Floating theme toggle added!');
