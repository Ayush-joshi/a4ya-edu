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

  const url = `https://api.cloudflare.com/client/v4/accounts/${env.AI_ACCOUNT_ID_PRIMARY}/ai/run/${env.AI_MODEL_CHAT_PRIMARY}`;
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
    throw new Error(msg);
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
        { error: 'Provider not implemented' },
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

// ---- WORKER ENTRY ----
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const { pathname } = new URL(req.url);

    // 1) Preflight
    if (req.method === 'OPTIONS') {
      const headers = makeCorsHeaders(origin);
      return new Response(null, { status: 204, headers });
    }

    // 2) Routes
    if (pathname === '/v1/chat') return handleChat(req, env, origin);
    if (pathname === '/v1/embeddings') return handleEmbeddings(req, env, origin);

    // 3) 404
    return jsonResponse({ error: 'Not found' }, { status: 404 }, origin);
  },
};
