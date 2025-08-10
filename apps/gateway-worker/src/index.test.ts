import worker from './index';
import { describe, it, expect, vi } from 'vitest';

const env = {
  AI_PROVIDER_PRIMARY: 'noop',
  AI_ACCOUNT_ID_PRIMARY: 'noop',
  AI_API_KEY_PRIMARY: 'noop',
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
    };
    const mockRes = { result: { data: [[0.1, 0.2]] } };
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockRes), { status: 200 })
    );
    const origFetch = global.fetch;
    (global as any).fetch = fetchMock as any;

    const req = new Request('https://example.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Origin: 'https://example.com',
        'X-API-Key': 'valid-key',
      },
      body: JSON.stringify({ input: 'hi' }),
    });
    const res = await worker.fetch(req, embEnv);
    (global as any).fetch = origFetch;
    expect(res.status).toBe(200);
    const data = await res.json<any>();
    expect(Array.isArray(data.data[0].embedding)).toBe(true);
  });

  it('rejects embeddings requests with missing input', async () => {
    const embEnv = { ...env, AI_PROVIDER_PRIMARY: 'cloudflare-workers-ai' };
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
    const embEnv = { ...env, AI_PROVIDER_PRIMARY: 'cloudflare-workers-ai' };
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
});
