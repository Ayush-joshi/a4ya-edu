// src/index.ts
import { runEmbeddingsCF } from './providers/cloudflare';

export interface Env {
  // Which provider to use (you already have this)
  AI_PROVIDER_PRIMARY: string;

  // Cloudflare AI bindings (you already use these in providers/cloudflare.ts)
  AI_ACCOUNT_ID_PRIMARY: string;
  AI_API_KEY_PRIMARY: string;
  AI_MODEL_EMBEDDINGS_PRIMARY: string;

  // If you add chat later, add its model name here:
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
  // Only enable if you actually use cookies/credentials
  // h.set('Access-Control-Allow-Credentials', 'true');
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

// ---- TYPES FOR EMBEDDINGS REQUEST ----
type EmbeddingsArgs = { input: string | string[] };
type EmbeddingItem = { embedding: number[]; index: number };
type EmbeddingsResult = { data: EmbeddingItem[]; model: string | undefined };

// ---- OPTIONAL: SIMPLE CHAT HANDLER (stub / echo). Replace with real logic later. ----
async function runChatCF(payload: any, env: Env): Promise<any> {
  // TODO: call your upstream model here (Cloudflare Workers AI, OpenAI, etc.)
  return {
    model: env.AI_MODEL_CHAT_PRIMARY ?? 'echo-stub',
    message: payload?.message ?? null,
    echo: payload,
  };
}

// ---- ROUTE HANDLERS ----
async function handleChat(req: Request, env: Env, origin: string | null): Promise<Response> {
  if (req.method !== 'POST') return methodNotAllowed(origin);
  const body = await req.json().catch(() => ({}));
  try {
    const result = await runChatCF(body, env);
    return jsonResponse(result, { status: 200 }, origin);
  } catch (err) {
    return jsonResponse({ error: 'Chat failed', detail: String(err) }, { status: 500 }, origin);
  }
}

async function handleEmbeddings(req: Request, env: Env, origin: string | null): Promise<Response> {
  if (req.method !== 'POST') return methodNotAllowed(origin);
  const payload = await req.json().catch(() => ({}));
  const input = (payload?.input ?? '') as EmbeddingsArgs['input'];
  try {
    if (env.AI_PROVIDER_PRIMARY === 'cloudflare-workers-ai') {
      const result = (await runEmbeddingsCF({ input }, env)) as EmbeddingsResult;
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
