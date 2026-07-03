import { ENV } from "./env";
import type { InvokeParams, InvokeResult, Message, MessageContent } from "./llm";

/**
 * AWS Bedrock Converse API backend for invokeLLM (LLM_PROVIDER=converse).
 *
 * The Converse API on classic bedrock-runtime serves every Bedrock model
 * (GLM, Gemma, Kimi, Nova, Llama, ...) with one request shape, and accepts
 * Bedrock API keys as bearer tokens. Use this provider for non-Claude Bedrock
 * models that aren't on the OpenAI-compatible route; Claude models are better
 * served by LLM_PROVIDER=bedrock (native Messages API, real structured
 * outputs).
 *
 * Structured output: Converse has no universal JSON-schema response format,
 * so when callers pass `outputSchema` the schema is injected as a system
 * instruction and the reply is trimmed down to its JSON payload so existing
 * JSON.parse call sites keep working.
 */

const contentPartToText = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  throw new Error(
    `Message content type '${part.type}' is not supported by the Converse LLM provider`
  );
};

const messageText = (content: Message["content"]): string =>
  (Array.isArray(content) ? content : [content]).map(contentPartToText).join("\n");

export type ConverseMessage = { role: "user" | "assistant"; content: Array<{ text: string }> };

/**
 * Split OpenAI-style messages into Converse's `system` blocks and strictly
 * alternating user/assistant `messages` (Converse rejects consecutive
 * same-role turns, so those are merged).
 */
export function toConverseMessages(messages: Message[]): {
  system: Array<{ text: string }> | undefined;
  messages: ConverseMessage[];
} {
  const systemParts: string[] = [];
  const chat: ConverseMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(messageText(message.content));
      continue;
    }
    if (message.role !== "user" && message.role !== "assistant") {
      throw new Error(
        `Message role '${message.role}' is not supported by the Converse LLM provider`
      );
    }
    const text = messageText(message.content);
    const last = chat[chat.length - 1];
    if (last && last.role === message.role) {
      last.content.push({ text });
    } else {
      chat.push({ role: message.role, content: [{ text }] });
    }
  }

  if (chat.length === 0 || chat[0].role !== "user") {
    chat.unshift({ role: "user", content: [{ text: "(no user input)" }] });
  }

  return {
    system: systemParts.length > 0 ? systemParts.map((text) => ({ text })) : undefined,
    messages: chat,
  };
}

/**
 * Pull the JSON object out of a model reply that may wrap it in markdown
 * fences or prose, so downstream JSON.parse succeeds.
 */
export function extractJsonText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return candidate.slice(start, end + 1).trim();
  }
  return candidate.trim();
}

export async function invokeConverseLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.bedrockApiKey) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is not configured");
  }
  if (params.tools && params.tools.length > 0) {
    throw new Error("Tools are not supported by the Converse LLM provider");
  }

  const schema = params.outputSchema || params.output_schema;
  const explicitFormat = params.responseFormat || params.response_format;
  const jsonSchema =
    schema?.schema ??
    (explicitFormat?.type === "json_schema" ? explicitFormat.json_schema.schema : undefined);

  const { system, messages } = toConverseMessages(params.messages);

  const systemBlocks = system ? [...system] : [];
  if (jsonSchema) {
    systemBlocks.push({
      text:
        "You must respond with ONLY a single valid JSON object conforming to this JSON Schema. " +
        "Do not include any prose, explanations, or markdown code fences.\n" +
        JSON.stringify(jsonSchema),
    });
  }

  const body: Record<string, unknown> = {
    messages,
    inferenceConfig: { maxTokens: params.maxTokens ?? params.max_tokens ?? 16000 },
  };
  if (systemBlocks.length > 0) body.system = systemBlocks;

  const url = `https://bedrock-runtime.${ENV.awsRegion}.amazonaws.com/model/${encodeURIComponent(ENV.bedrockModelId)}/converse`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.bedrockApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Converse invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as {
    output?: { message?: { content?: Array<{ text?: string }> } };
    stopReason?: string;
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  };

  const rawText = (result.output?.message?.content ?? [])
    .map((block) => block.text ?? "")
    .join("");
  const content = jsonSchema ? extractJsonText(rawText) : rawText;

  const finishReason =
    result.stopReason === "max_tokens"
      ? "length"
      : result.stopReason === "content_filtered"
        ? "content_filter"
        : "stop";

  return {
    id: `converse-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: ENV.bedrockModelId,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: result.usage?.inputTokens ?? 0,
      completion_tokens: result.usage?.outputTokens ?? 0,
      total_tokens: result.usage?.totalTokens ?? 0,
    },
  };
}
