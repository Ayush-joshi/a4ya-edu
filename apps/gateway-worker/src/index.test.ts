import worker from './index';
import { describe, it, expect } from 'vitest';

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
});
