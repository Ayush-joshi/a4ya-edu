import { runEmbeddings } from './providers';

export interface Env {
  AI_PROVIDER_PRIMARY: string;
  AI_ACCOUNT_ID_PRIMARY: string;
  AI_API_KEY_PRIMARY: string;
  AI_MODEL_CHAT_PRIMARY?: string;
  AI_MODEL_EMBEDDINGS_PRIMARY?: string;
  ALLOWED_ORIGINS: string;
  GATEWAY_PUBLIC_KEY: string;
  GIT_SHA?: string;
  PAGES_ORIGIN: string;
  ALLOW_ORIGIN_ONLY?: string;
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
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (!allowedOrigins.includes(origin)) {
      return jsonResponse(
        { error: 'Forbidden' },
        { status: 403, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    const allowOriginOnly = env.ALLOW_ORIGIN_ONLY === 'true' && origin === env.PAGES_ORIGIN;
    if (!allowOriginOnly) {
      const apiKey = request.headers.get('X-API-Key');
      if (apiKey !== env.GATEWAY_PUBLIC_KEY) {
        return jsonResponse(
          { error: 'Unauthorized' },
          { status: 401, headers: { 'Access-Control-Allow-Origin': origin } }
        );
      }
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(
        { ok: true },
        { status: 200, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    if (request.method === 'GET' && url.pathname === '/version') {
      const gitSha = env.GIT_SHA ? env.GIT_SHA.slice(0, 7) : 'unknown';
      return jsonResponse(
        { gitSha, timestamp: new Date().toISOString() },
        { status: 200, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    if (request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    if (url.pathname === '/v1/chat') {
      return handleChat(request, env, origin);
    }

    if (url.pathname === '/v1/embeddings') {
      return handleEmbeddings(request, env, origin);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleChat(request: Request, env: Env, origin: string): Promise<Response> {
  try {
    const requestId = crypto.randomUUID();
    let payload: any = {};
    try {
      payload = await request.json();
    } catch {}

    const model = env.AI_MODEL_CHAT_PRIMARY;
    payload.model = model;

    if (env.AI_PROVIDER_PRIMARY === 'noop') {
      return jsonResponse(
        { reply: 'Hello from gateway', model, requestId },
        { status: 200, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    if (env.AI_PROVIDER_PRIMARY !== 'cloudflare-workers-ai') {
      return jsonResponse(
        { error: 'Provider not implemented' },
        { status: 501, headers: { 'Access-Control-Allow-Origin': origin } }
      );
    }

    const aiRes = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${env.AI_ACCOUNT_ID_PRIMARY}/${env.AI_PROVIDER_PRIMARY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AI_API_KEY_PRIMARY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await aiRes.json()) as Record<string, unknown>;
    return jsonResponse(
      { ...data, model, requestId },
      {
        status: aiRes.status,
        headers: { 'Access-Control-Allow-Origin': origin },
      }
    );
  } catch (error) {
    return jsonResponse(
      { error: 'Upstream request failed' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': origin } }
    );
  }
}

async function handleEmbeddings(request: Request, env: Env, origin: string): Promise<Response> {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: 'Bad request' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': origin } }
    );
  }

  if (!payload || payload.input === undefined) {
    return jsonResponse(
      { error: 'Bad request' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': origin } }
    );
  }

  try {
    const requestId = crypto.randomUUID();
    const result = await runEmbeddings({ input: payload.input }, env);
    return jsonResponse(
      { ...result, provider: env.AI_PROVIDER_PRIMARY, requestId },
      { status: 200, headers: { 'Access-Control-Allow-Origin': origin } }
    );
  } catch (error: any) {
    const status = error?.message === 'Not implemented' ? 501 : 500;
    const message = status === 501 ? 'Provider not implemented' : 'Upstream request failed';
    return jsonResponse(
      { error: message },
      { status, headers: { 'Access-Control-Allow-Origin': origin } }
    );
  }
}

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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
