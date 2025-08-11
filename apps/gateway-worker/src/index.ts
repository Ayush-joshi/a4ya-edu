// src/index.ts
import { runEmbeddingsCF } from './providers/cloudflare';

export interface Env {
  // Provider selector (you can add more providers later)
  AI_PROVIDER_PRIMARY: string;

  // Cloudflare AI bindings
  AI_ACCOUNT_ID_PRIMARY: string;
  AI_API_KEY_PRIMARY: string;
  AI_MODEL_EMBEDDINGS_PRIMARY: string;
  AI_MODEL_CHAT_PRIMARY?: string;
}

// ADD NEAR TOP (below your imports/types)
const ALLOWED_CHAT_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.1-70b-instruct'
];

const ALLOWED_EMBED_MODELS = [
  '@cf/baai/bge-m3',
  '@cf/baai/bge-small-en-v1.5'
];

// OPTIONAL: if you want to override from an env var CSV later:
// parse env.ALLOWED_CHAT_MODELS etc. (not shown here for brevity)


// ---- CORS CONFIG ----
const ALLOWED_ORIGINS = new Set<string>([
  'http://localhost:4200',
  'https://ayush-joshi.github.io',
  'https://ayush-joshi.github.io/a4ya-edu',
]);

const ALLOWED_HEADERS = [
  'authorization',
  'content-type',
  'x-requested-with',
  'x-api-key',
];

const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'];

function makeCorsHeaders(originHeader: string | null): Headers {
  const h = new Headers();
  if (originHeader && ALLOWED_ORIGINS.has(originHeader)) {
    h.set('Access-Control-Allow-Origin', originHeader);
  }
  h.set('Vary', 'Origin');
  h.append('Vary', 'Access-Control-Request-Headers');
  h.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  h.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  // h.set('Access-Control-Allow-Credentials', 'true'); // enable only if needed
  return h;
}

function jsonResponse(body: unknown, init: ResponseInit = {}, origin: string | null = null): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const cors = makeCorsHeaders(origin);
  cors.forEach((v, k) => headers.set(k, v));
  return new Response(JSON.stringify(body), { ...init, headers });
}

function methodNotAllowed(origin: string | null): Response {
  return jsonResponse({ error: 'Method Not Allowed' }, { status: 405 }, origin);
}

// ---- Chat payload shaping ----
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatPayload = {
  messages?: ChatMessage[];
  prompt?: string;
  message?: string;
  // optional common knobs (passed through if present)
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  [k: string]: unknown;
};

function normalizeChatPayload(incoming: any): ChatPayload {
  const p: ChatPayload = typeof incoming === 'object' && incoming ? { ...incoming } : {};
  // If no messages but a single string is provided, wrap it.
  if (!Array.isArray(p.messages)) {
    const text = typeof p.prompt === 'string' ? p.prompt
      : typeof p.message === 'string' ? p.message
        : undefined;
    if (typeof text === 'string') {
      p.messages = [{ role: 'user', content: text }];
      delete p.prompt;
      delete p.message;
    }
  }
  // Ensure messages exists and is a non-empty array
  if (!Array.isArray(p.messages) || p.messages.length === 0) {
    p.messages = [{ role: 'user', content: 'Hello' }];
  }
  return p;
}

// ---- Cloudflare Workers AI: Chat call ----
async function runChatCF(incoming: any, env: Env): Promise<any> {
  if (!env.AI_MODEL_CHAT_PRIMARY) {
    throw new Error('AI_MODEL_CHAT_PRIMARY is not set');
  }
  const payload = normalizeChatPayload(incoming);
  const model = incoming?.model || env.AI_MODEL_CHAT_PRIMARY;
  if (!model) throw new Error('No chat model provided');

  const url = `https://api.cloudflare.com/client/v4/accounts/${env.AI_ACCOUNT_ID_PRIMARY}/ai/run/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY_PRIMARY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Propagate non-2xx with the upstream body to help debugging
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    const msg = typeof json?.errors?.[0]?.message === 'string'
      ? json.errors[0].message
      : `Upstream error ${res.status}`;
    throw new Error(msg + "Failed to run chat model: " + model);
  }

  // Cloudflare AI returns { result: {...}, ... } shape typically
  return {
    model: env.AI_MODEL_CHAT_PRIMARY,
    ...json,
  };
}

// ---- ROUTE HANDLERS ----
async function handleChat(req: Request, env: Env, origin: string | null): Promise<Response> {
  if (req.method !== 'POST') return methodNotAllowed(origin);
  const body = await req.json().catch(() => ({}));

  try {
    if (env.AI_PROVIDER_PRIMARY === 'noop') {
      const requestId = crypto.randomUUID();
      return jsonResponse(
        { reply: 'Hello from gateway', model: 'noop', requestId, echo: body },
        { status: 200 },
        origin,
      );
    }

    if (env.AI_PROVIDER_PRIMARY !== 'cloudflare-workers-ai') {
      return jsonResponse(
        { error: 'Provider not implemented' + env.toString() },
        { status: 501 },
        origin,
      );
    }

    const result = await runChatCF(body, env);
    const requestId = crypto.randomUUID();
    return jsonResponse(
      { ...result, provider: 'cloudflare-workers-ai', requestId },
      { status: 200 },
      origin,
    );
  } catch (err: any) {
    return jsonResponse(
      { error: 'Chat failed', detail: String(err?.message ?? err) },
      { status: 500 },
      origin,
    );
  }
}

async function handleEmbeddings(req: Request, env: Env, origin: string | null): Promise<Response> {
  if (req.method !== 'POST') return methodNotAllowed(origin);
  const payload = await req.json().catch(() => ({}));
  const input = (payload?.input ?? '') as string | string[];

  try {
    if (env.AI_PROVIDER_PRIMARY === 'cloudflare-workers-ai') {
      const result = await runEmbeddingsCF({ input }, env);
      return jsonResponse(result, { status: 200 }, origin);
    }
    return jsonResponse({ error: 'Provider not implemented' }, { status: 501 }, origin);
  } catch (err) {
    return jsonResponse({ error: 'Embeddings failed', detail: String(err) }, { status: 500 }, origin);
  }
}

function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const headers = new Headers();
  // Mirror your makeCorsHeaders policy (static allowlist in your file)
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  return new Response(null, { status: 204, headers });
}


// ---- WORKER ENTRY ----
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // List allowed models for the UI dropdown
    if (url.pathname === '/v1/models' && request.method === 'GET') {
      return jsonResponse(
        {
          chat: ALLOWED_CHAT_MODELS,
          embeddings: ALLOWED_EMBED_MODELS
        },
        { status: 200 },
        origin
      );
    }


    // 1) CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // 2) Health endpoint (optional)
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true }, { status: 200 }, origin);
    }

    // 3) Version/debug endpoint (← YOUR SNIPPET GOES HERE)
    if (url.pathname === '/version' && request.method === 'GET') {
      return jsonResponse({
        provider: env.AI_PROVIDER_PRIMARY || '(unset)',
        accountId: (env.AI_ACCOUNT_ID_PRIMARY || '').slice(0, 6) + '…',
        gitSha: env.GIT_SHA?.slice(0, 7) || '(unset)',
        ts: new Date().toISOString(),
      }, { status: 200 }, origin);
    }

    // 4) API routes
    if (url.pathname === '/v1/chat') {
      return handleChat(request, env, origin);
    }
    if (url.pathname === '/v1/embeddings') {
      return handleEmbeddings(request, env, origin);
    }

    // 5) Fallback 404 (must come last)
    return new Response('Not found', { status: 404 });
  },
};

