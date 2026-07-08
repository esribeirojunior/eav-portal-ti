import { GoogleGenerativeAI } from "@google/generative-ai";

// O componente será inicializado dentro da função para garantir que pegue a chave do .env
export async function analyzeDeviceLabel(base64Image: string) {
    // Tenta pegar a chave de várias fontes possíveis para garantir compatibilidade com o deploy
    const API_KEY = (
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        (window as any)._env_?.VITE_GEMINI_API_KEY ||
        ""
    ).trim();

    if (!API_KEY || API_KEY === "PLACEHOLDER_API_KEY") {
        console.error("Gemini API Key missing! Fontes verificadas: import.meta.env, window._env_");
        throw new Error("Chave de API do Gemini não configurada no Render. Vá em Environment > Edit > Save para forçar um novo build.");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    // Gemini 2.5 Flash é o modelo disponível em 2026 segundo o diagnóstico
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });

    const prompt = `
    Analise esta etiqueta de equipamento eletrônico.
    Identifique o Número de Série (ou Service Tag) e o Modelo do equipamento.
    Ignore textos como 'INPUT', 'OUTPUT', 'V', 'A', 'Hz'.
    Retorne APENAS um objeto JSON no seguinte formato:
    {
      "serial": "valor_encontrado",
      "modelo": "valor_encontrado"
    }
  `;

    // Remover o prefixo data:image/jpeg;base64, se houver
    const base64Data = base64Image.split(",")[1] || base64Image;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        },
    ]);

    const response = await result.response;
    const text = response.text();

    try {
        // Tenta extrair o JSON da resposta (o Gemini às vezes coloca blocos de código ```json)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Não foi possível processar a resposta da IA");
    } catch (error) {
        console.error("Erro ao processar JSON do Gemini:", text);
        throw new Error("Falha ao analisar a imagem. Tente novamente.");
    }
}
