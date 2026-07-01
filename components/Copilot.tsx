import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';

export function Copilot({ userRole = 'admin' }: { userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Olá! Sou o **EAV Copilot**, seu assistente de TI integrado ao inventário. Como posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages, userRole })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro desconhecido da IA');
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `⚠️ **Erro:** ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic Markdown renderer helper for bold text and lists
  const formatMarkdown = (text: string) => {
    // Bold: **text**
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Newlines
    html = html.replace(/\n/g, '<br />');
    return html;
  };

  // Helper to parse VNC action tags
  const parseVncAction = (text: string) => {
    const matches = [...text.matchAll(/\[ACTION:VNC\|(.*?)\]/g)];
    const vncTargets = matches.map(m => m[1]);
    const cleanText = text.replace(/\[ACTION:VNC\|.*?\]/g, '');
    return { cleanText, vncTargets };
  };

  const handleVncTrigger = async (ip: string) => {
    try {
      // Arquitetura Web: Utiliza o protocolo local vnc:// para o PC do TI abrir o Viewer
      window.location.href = `vnc://${ip}`;
    } catch (e) {
      console.error("Erro ao iniciar acesso remoto pelo Copilot", e);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/20 hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group"
        >
          <Bot size={28} className="group-hover:animate-bounce" />
          <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-400 overflow-hidden animate-slide-up origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f2d70] to-[#1e4baf] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide flex items-center gap-2">
                  EAV COPILOT <Sparkles size={12} className="text-yellow-400" />
                </h3>
                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold">Assistente IA de Inventário</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => {
              const { cleanText, vncTargets } = parseVncAction(msg.text);

              return (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none ml-auto' 
                        : 'bg-white border border-slate-400 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div 
                      className={`leading-relaxed ${
                        msg.role === 'user' ? 'text-blue-50' : 'text-slate-800 font-medium'
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(cleanText) }}
                    />
                    
                    {/* Botão de VNC Injetado */}
                    {vncTargets && vncTargets.length > 0 && msg.role === 'ai' && (
                      <div className="flex flex-col gap-2 w-full mt-2">
                        {vncTargets.map((target, i) => (
                          <button
                            key={i}
                            onClick={() => handleVncTrigger(target)}
                            className="bg-blue-600 hover:bg-blue-700 !text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95 border border-blue-800 animate-fade-in w-full justify-center"
                          >
                            <span className="text-[12px]">🖥️</span> ACESSAR REMOTAMENTE: {target}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center gap-2 text-slate-600">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-xs font-medium">Analisando o inventário...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte sobre os ativos..."
                className="flex-1 bg-slate-100 text-slate-800 placeholder:text-slate-600 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md shadow-blue-600/20"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-center text-slate-600 mt-2 font-medium">O Copilot pode cometer erros. Verifique informações importantes.</p>
          </div>
        </div>
      )}
    </>
  );
}
