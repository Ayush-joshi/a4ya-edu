import type { Env } from '../index';
import { runEmbeddingsCF } from './cloudflare';

export interface EmbeddingsArgs {
  input: string | string[];
}

export interface EmbeddingItem {
  embedding: number[];
  index: number;
}

export interface EmbeddingsResult {
  data: EmbeddingItem[];
  model: string | undefined;
}

export async function runEmbeddings(
  { input }: EmbeddingsArgs,
  env: Env
): Promise<EmbeddingsResult> {
  if (env.AI_PROVIDER_PRIMARY === 'cloudflare-workers-ai') {
    return runEmbeddingsCF({ input }, env);
  }
  throw new Error('Not implemented');
}
