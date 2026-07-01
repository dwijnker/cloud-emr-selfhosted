import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";
import type {
  InvokeParams,
  InvokeResult,
  Message,
  MessageContent,
  Tool,
  ToolChoice,
} from "./llm";

/**
 * AWS Bedrock (Anthropic Claude) backend for invokeLLM.
 *
 * Preserves the OpenAI-compatible invokeLLM contract used across the app
 * (messages in, `choices[0].message.content` out, JSON-schema structured
 * output via `outputSchema`) while calling Claude in Amazon Bedrock.
 * Selected with LLM_PROVIDER=bedrock.
 *
 * Targets Bedrock's Messages-API ("Mantle") endpoint at
 * https://bedrock-mantle.{region}.api.aws/anthropic — the surface that
 * console-generated Bedrock API keys (bearer tokens) authenticate against.
 * Per Anthropic's docs, bearer-token auth uses the standard Anthropic client
 * with a base_url override; the dedicated Bedrock clients are for SigV4.
 * Model IDs on this endpoint carry an `anthropic.` prefix and no version
 * suffix, e.g. `anthropic.claude-haiku-4-5`.
 */

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!ENV.bedrockApiKey) {
      throw new Error("AWS_BEARER_TOKEN_BEDROCK is not configured");
    }
    _client = new Anthropic({
      apiKey: ENV.bedrockApiKey, // Bedrock API key (bearer token) auth
      baseURL: `https://bedrock-mantle.${ENV.awsRegion}.api.aws/anthropic`,
    });
  }
  return _client;
}

type AnthropicTextBlock = { type: "text"; text: string };

const contentPartToText = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  // Bedrock does not support URL image/file sources; no current caller sends them.
  throw new Error(
    `Message content type '${part.type}' is not supported by the Bedrock LLM provider`
  );
};

const messageText = (content: Message["content"]): string =>
  (Array.isArray(content) ? content : [content]).map(contentPartToText).join("\n");

/**
 * Split OpenAI-style messages into Anthropic's top-level `system` string and
 * alternating user/assistant `messages`. Tool/function roles are rejected —
 * no caller uses them, and mapping tool_use ids faithfully is not worth
 * speculative complexity.
 */
export function toAnthropicMessages(messages: Message[]): {
  system: string | undefined;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const systemParts: string[] = [];
  const chat: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(messageText(message.content));
    } else if (message.role === "user" || message.role === "assistant") {
      chat.push({ role: message.role, content: messageText(message.content) });
    } else {
      throw new Error(
        `Message role '${message.role}' is not supported by the Bedrock LLM provider`
      );
    }
  }

  // Anthropic requires the first message to be from the user.
  if (chat.length === 0 || chat[0].role !== "user") {
    chat.unshift({ role: "user", content: "(no user input)" });
  }

  return { system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined, messages: chat };
}

/**
 * Structured outputs require `additionalProperties: false` on every object
 * node. Callers' schemas only set it at the top level, so normalize the whole
 * tree rather than pushing that requirement onto every call site.
 */
export function normalizeJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(normalizeJsonSchema);
  }
  if (node && typeof node === "object") {
    const source = node as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      result[key] = normalizeJsonSchema(value);
    }
    if (result.type === "object" && result.additionalProperties === undefined) {
      result.additionalProperties = false;
    }
    return result;
  }
  return node;
}

export function toAnthropicTools(tools: Tool[] | undefined) {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: (tool.function.parameters ?? { type: "object", properties: {} }) as {
      type: "object";
      [key: string]: unknown;
    },
  }));
}

export function toAnthropicToolChoice(toolChoice: ToolChoice | undefined) {
  if (!toolChoice) return undefined;
  if (toolChoice === "auto") return { type: "auto" as const };
  if (toolChoice === "none") return { type: "none" as const };
  if (toolChoice === "required") return { type: "any" as const };
  const name = "name" in toolChoice ? toolChoice.name : toolChoice.function.name;
  return { type: "tool" as const, name };
}

export async function invokeBedrockLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = getClient();
  const { system, messages } = toAnthropicMessages(params.messages);
  const schema = params.outputSchema || params.output_schema;
  const explicitFormat = params.responseFormat || params.response_format;
  const jsonSchema =
    schema?.schema ??
    (explicitFormat?.type === "json_schema" ? explicitFormat.json_schema.schema : undefined);

  const request: Record<string, unknown> = {
    model: ENV.bedrockModelId,
    max_tokens: params.maxTokens ?? params.max_tokens ?? 16000,
    messages,
  };
  if (system) request.system = system;

  const tools = toAnthropicTools(params.tools);
  if (tools) request.tools = tools;
  const toolChoice = toAnthropicToolChoice(params.toolChoice || params.tool_choice);
  if (toolChoice) request.tool_choice = toolChoice;

  if (jsonSchema) {
    request.output_config = {
      format: { type: "json_schema", schema: normalizeJsonSchema(jsonSchema) },
    };
  }

  // Cast: request is assembled dynamically; output_config may lag the SDK types.
  const response = await client.messages.create(request as never);

  if (!Array.isArray(response?.content)) {
    throw new Error(
      `Unexpected Bedrock response shape (no content array): ${JSON.stringify(response).slice(0, 300)}`
    );
  }

  const textContent = (response.content as Array<{ type: string }>)
    .filter((block): block is AnthropicTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const toolCalls = (response.content as Array<{ type: string }>)
    .filter(
      (block): block is { type: "tool_use"; id: string; name: string; input: unknown } =>
        block.type === "tool_use"
    )
    .map((block) => ({
      id: block.id,
      type: "function" as const,
      function: { name: block.name, arguments: JSON.stringify(block.input) },
    }));

  const finishReason =
    response.stop_reason === "max_tokens"
      ? "length"
      : response.stop_reason === "tool_use"
        ? "tool_calls"
        : response.stop_reason === "refusal"
          ? "content_filter"
          : "stop";

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textContent,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}
