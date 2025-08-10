import worker from './index';
import { describe, it, expect, vi } from 'vitest';

const env = {
  AI_PROVIDER_PRIMARY: 'noop',
  AI_ACCOUNT_ID_PRIMARY: 'noop',
  AI_API_KEY_PRIMARY: 'noop',
  AI_MODEL_CHAT_PRIMARY: '@cf/test/chat',
  AI_MODEL_EMBEDDINGS_PRIMARY: '@cf/test/embed',
  ALLOWED_ORIGINS: 'https://example.com',
  GATEWAY_PUBLIC_KEY: 'valid-key',
};

describe('gateway worker', () => {
  it('handles successful requests', async () => {
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: {
        'Origin': 'https://example.com',
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(data.reply).toBe('Hello from gateway');
    expect(data.model).toBe(env.AI_MODEL_CHAT_PRIMARY);
    expect(typeof data.requestId).toBe('string');
  });

  it('rejects requests with missing origin', async () => {
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: {
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(403);
    const data = await res.json<any>();
    expect(data).toEqual({ error: 'Forbidden' });
  });

  it('rejects requests with invalid origin', async () => {
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: {
        'Origin': 'https://evil.com',
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(403);
    const data = await res.json<any>();
    expect(data).toEqual({ error: 'Forbidden' });
  });

  it('rejects requests with bad API key', async () => {
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: {
        'Origin': 'https://example.com',
        'X-API-Key': 'invalid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(401);
    const data = await res.json<any>();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('handles embeddings requests', async () => {
    const embEnv = {
      ...env,
      AI_PROVIDER_PRIMARY: 'cloudflare-workers-ai',
      AI_ACCOUNT_ID_PRIMARY: 'acc',
      AI_API_KEY_PRIMARY: 'key',
      AI_MODEL_EMBEDDINGS_PRIMARY: '@cf/baai/bge-m3',
    };
    const mockRes = { result: { data: [[0.1, 0.2]] } };
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockRes), { status: 200 })
    );
    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = fetchMock as any;

    const req = new Request('https://example.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
      body: JSON.stringify({ input: 'hi' }),
    });
    const res = await worker.fetch(req, embEnv);
    (globalThis as any).fetch = origFetch;
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(Array.isArray(data.data[0].embedding)).toBe(true);
    expect(data.model).toBe(embEnv.AI_MODEL_EMBEDDINGS_PRIMARY);
  });

  it('rejects embeddings requests with missing input', async () => {
    const embEnv = {
      ...env,
      AI_PROVIDER_PRIMARY: 'cloudflare-workers-ai',
      AI_MODEL_EMBEDDINGS_PRIMARY: '@cf/baai/bge-m3',
    };
    const req = new Request('https://example.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
      body: JSON.stringify({}),
    });
    const res = await worker.fetch(req, embEnv);
    expect(res.status).toBe(400);
    const data = await res.json<any>();
    expect(data).toEqual({ error: 'Bad request' });
  });

  it('rejects embeddings requests with bad API key', async () => {
    const embEnv = {
      ...env,
      AI_PROVIDER_PRIMARY: 'cloudflare-workers-ai',
      AI_MODEL_EMBEDDINGS_PRIMARY: '@cf/baai/bge-m3',
    };
    const req = new Request('https://example.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'invalid-key',
      },
      body: JSON.stringify({ input: 'hi' }),
    });
    const res = await worker.fetch(req, embEnv);
    expect(res.status).toBe(401);
    const data = await res.json<any>();
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns health status', async () => {
    const req = new Request('https://example.com/health', {
      method: 'GET',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(data).toEqual({ ok: true });
  });

  it('returns version info with git sha', async () => {
    const versionEnv = { ...env, GIT_SHA: '1234567890abcdef' };
    const req = new Request('https://example.com/version', {
      method: 'GET',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, versionEnv);
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(data.gitSha).toBe('1234567');
    expect(typeof data.timestamp).toBe('string');
  });

  it('returns version info with unknown git sha when not provided', async () => {
    const req = new Request('https://example.com/version', {
      method: 'GET',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(data.gitSha).toBe('unknown');
  });
});
