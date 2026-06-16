// Usando node:https para ignorar verificação SSL (certificado auto-assinado da Monitcall)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno suporta módulos node: em Edge Functions
import https from "node:https";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function fetchMonitcall(url: string, credentials: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
      rejectUnauthorized: false, // Ignora certificado inválido
      timeout: 15000,
    };

    const req = https.request(options, (res: any) => {
      let body = '';
      res.on('data', (chunk: any) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Resposta inválida da Monitcall'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ao conectar à Monitcall'));
    });

    req.on('error', (e: any) => {
      reject(new Error(`Falha de conexão: ${e.message}`));
    });

    req.end();
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let target = 'ramais';
    let fila = '1021';

    if (req.method === 'POST') {
      try {
        const body = await req.json().catch(() => ({}));
        target = body.target || target;
        fila = body.fila || fila;
      } catch (_) { /* usa padrões */ }
    } else {
      const url = new URL(req.url);
      target = url.searchParams.get('target') || target;
      fila = url.searchParams.get('fila') || fila;
    }

    const username = 'Demo';
    const password = 'Y7R8EM';
    const credentials = btoa(`${username}:${password}`);

    const monitcallUrl = target === 'agentes'
      ? `https://escolaamericana.monitcall.com/monitcall/api/v1/buscarEstadoDosAgentes.php?fila=${fila}`
      : 'https://escolaamericana.monitcall.com/monitcall/api/v1/buscarEstadoDosRamais.php';

    console.log(`[Proxy node:https] Fetching: ${monitcallUrl}`);

    const data = await fetchMonitcall(monitcallUrl, credentials);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error("[Proxy Error]", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
