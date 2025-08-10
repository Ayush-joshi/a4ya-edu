export interface Env {
  AI_PROVIDER_PRIMARY: string;
  AI_ACCOUNT_ID_PRIMARY: string;
  AI_API_KEY_PRIMARY: string;
  ALLOWED_ORIGINS: string;
  GATEWAY_PUBLIC_KEY: string;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    if (url.pathname !== '/v1/chat' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (!allowedOrigins.includes(origin)) {
      return jsonResponse(
        { error: 'Forbidden' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== env.GATEWAY_PUBLIC_KEY) {
      return jsonResponse(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    const requestId = crypto.randomUUID();
    return jsonResponse(
      { reply: 'Hello from gateway', requestId },
      { headers: { 'Access-Control-Allow-Origin': origin } }
    );
  },
};

function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  if (!allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 403,
      headers: { 'Access-Control-Allow-Origin': origin },
    });
  }
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
