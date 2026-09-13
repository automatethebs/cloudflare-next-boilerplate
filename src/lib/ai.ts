import { getBinding } from "./cloudflare-env";

/**
 * Workers AI (binding AI). Free tier: 10,000 Neurons/day — no card required.
 * A few frontier models are paid-only; the defaults below are free-tier models.
 * All functions return null when AI is unavailable — never throw in request paths.
 */

type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<any>;
};

const TEXT_MODEL = "@cf/meta/llama-3.1-8b-instruct";
const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";

async function ai(): Promise<AiBinding | null> {
  return getBinding<AiBinding>("AI");
}

export async function aiAvailable(): Promise<boolean> {
  return (await ai()) !== null;
}

export async function aiText(
  prompt: string,
  opts?: { model?: string; maxTokens?: number; system?: string },
): Promise<string | null> {
  const binding = await ai();
  if (!binding) return null;
  try {
    const messages = [
      ...(opts?.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: prompt },
    ];
    const res = await binding.run(opts?.model ?? TEXT_MODEL, {
      messages,
      max_tokens: opts?.maxTokens ?? 512,
    });
    const text = typeof res?.response === "string" ? res.response : null;
    return text?.trim() ? text : null;
  } catch {
    return null;
  }
}

export async function aiEmbeddings(texts: string[], model = EMBEDDING_MODEL): Promise<number[][] | null> {
  const binding = await ai();
  if (!binding || texts.length === 0) return null;
  try {
    const res = await binding.run(model, { text: texts });
    const data = res?.data as number[][] | undefined;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
