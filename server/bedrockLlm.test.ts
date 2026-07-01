import { describe, it, expect } from "vitest";
import {
  toAnthropicMessages,
  normalizeJsonSchema,
  toAnthropicTools,
  toAnthropicToolChoice,
} from "./_core/bedrockLlm";
import type { Message } from "./_core/llm";

describe("toAnthropicMessages", () => {
  it("lifts system messages into the top-level system string", () => {
    const messages: Message[] = [
      { role: "system", content: "You are a medical intake assistant." },
      { role: "user", content: "I have a headache." },
      { role: "assistant", content: "How long has it lasted?" },
      { role: "user", content: "Two days." },
    ];
    const result = toAnthropicMessages(messages);
    expect(result.system).toBe("You are a medical intake assistant.");
    expect(result.messages).toEqual([
      { role: "user", content: "I have a headache." },
      { role: "assistant", content: "How long has it lasted?" },
      { role: "user", content: "Two days." },
    ]);
  });

  it("joins multiple system messages", () => {
    const messages: Message[] = [
      { role: "system", content: "Rule one." },
      { role: "system", content: "Rule two." },
      { role: "user", content: "Hi" },
    ];
    expect(toAnthropicMessages(messages).system).toBe("Rule one.\n\nRule two.");
  });

  it("flattens array/text content parts", () => {
    const messages: Message[] = [
      { role: "user", content: [{ type: "text", text: "part one" }, "part two"] },
    ];
    expect(toAnthropicMessages(messages).messages[0].content).toBe("part one\npart two");
  });

  it("prepends a placeholder user message when the chat starts with assistant", () => {
    const messages: Message[] = [{ role: "assistant", content: "Hello!" }];
    const result = toAnthropicMessages(messages);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1]).toEqual({ role: "assistant", content: "Hello!" });
  });

  it("rejects tool-role messages with a clear error", () => {
    const messages: Message[] = [
      { role: "user", content: "hi" },
      { role: "tool", content: "result", tool_call_id: "x" },
    ];
    expect(() => toAnthropicMessages(messages)).toThrow(/not supported/);
  });

  it("rejects image content with a clear error", () => {
    const messages: Message[] = [
      {
        role: "user",
        content: [{ type: "image_url", image_url: { url: "https://x/y.png" } }],
      },
    ];
    expect(() => toAnthropicMessages(messages)).toThrow(/image_url/);
  });
});

describe("normalizeJsonSchema", () => {
  it("adds additionalProperties: false to every object node", () => {
    const schema = {
      type: "object",
      properties: {
        problems: {
          type: "array",
          items: {
            type: "object",
            properties: { description: { type: "string" } },
            required: ["description"],
          },
        },
      },
      required: ["problems"],
      additionalProperties: false,
    };
    const normalized = normalizeJsonSchema(schema) as any;
    // Pre-existing value untouched
    expect(normalized.additionalProperties).toBe(false);
    // Nested object node gets it added
    expect(normalized.properties.problems.items.additionalProperties).toBe(false);
    // Non-object nodes are untouched
    expect(normalized.properties.problems.additionalProperties).toBeUndefined();
  });

  it("leaves an explicit additionalProperties value alone", () => {
    const normalized = normalizeJsonSchema({
      type: "object",
      properties: {},
      additionalProperties: false,
    }) as any;
    expect(normalized.additionalProperties).toBe(false);
  });
});

describe("toAnthropicTools / toAnthropicToolChoice", () => {
  it("maps OpenAI function tools to Anthropic tool definitions", () => {
    const tools = toAnthropicTools([
      {
        type: "function",
        function: {
          name: "lookup_icd",
          description: "Look up an ICD-10 code",
          parameters: { type: "object", properties: { term: { type: "string" } } },
        },
      },
    ]);
    expect(tools).toEqual([
      {
        name: "lookup_icd",
        description: "Look up an ICD-10 code",
        input_schema: { type: "object", properties: { term: { type: "string" } } },
      },
    ]);
  });

  it("maps tool choice primitives and named choices", () => {
    expect(toAnthropicToolChoice("auto")).toEqual({ type: "auto" });
    expect(toAnthropicToolChoice("none")).toEqual({ type: "none" });
    expect(toAnthropicToolChoice("required")).toEqual({ type: "any" });
    expect(toAnthropicToolChoice({ name: "lookup_icd" })).toEqual({
      type: "tool",
      name: "lookup_icd",
    });
    expect(
      toAnthropicToolChoice({ type: "function", function: { name: "lookup_icd" } })
    ).toEqual({ type: "tool", name: "lookup_icd" });
  });

  it("returns undefined when nothing is provided", () => {
    expect(toAnthropicTools(undefined)).toBeUndefined();
    expect(toAnthropicToolChoice(undefined)).toBeUndefined();
  });
});
