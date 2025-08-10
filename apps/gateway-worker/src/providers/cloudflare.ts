import type { Env } from '../index';
import type { EmbeddingsArgs, EmbeddingsResult } from './index';

export async function runEmbeddingsCF(
  { input }: EmbeddingsArgs,
  env: Env
): Promise<EmbeddingsResult> {
  const model = env.AI_MODEL_EMBEDDINGS_PRIMARY;
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.AI_ACCOUNT_ID_PRIMARY}/ai/run/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY_PRIMARY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    throw new Error('Upstream request failed');
  }
  const json = (await res.json()) as any;
  const embeddings: number[][] = json?.result?.data || [];
  return {
    data: embeddings.map((embedding: number[], index: number) => ({ embedding, index })),
    model,
  };
}
