import { describe, it, expect } from "vitest";
import { toConverseMessages, extractJsonText } from "./_core/converseLlm";
import type { Message } from "./_core/llm";

describe("toConverseMessages", () => {
  it("lifts system messages into system blocks and keeps chat alternating", () => {
    const messages: Message[] = [
      { role: "system", content: "You are an intake assistant." },
      { role: "user", content: "I have a cough." },
      { role: "assistant", content: "How long?" },
      { role: "user", content: "A week." },
    ];
    const result = toConverseMessages(messages);
    expect(result.system).toEqual([{ text: "You are an intake assistant." }]);
    expect(result.messages).toEqual([
      { role: "user", content: [{ text: "I have a cough." }] },
      { role: "assistant", content: [{ text: "How long?" }] },
      { role: "user", content: [{ text: "A week." }] },
    ]);
  });

  it("merges consecutive same-role messages (Converse requires alternation)", () => {
    const messages: Message[] = [
      { role: "user", content: "First." },
      { role: "user", content: "Second." },
      { role: "assistant", content: "Reply." },
    ];
    const result = toConverseMessages(messages);
    expect(result.messages).toEqual([
      { role: "user", content: [{ text: "First." }, { text: "Second." }] },
      { role: "assistant", content: [{ text: "Reply." }] },
    ]);
  });

  it("prepends a placeholder user turn when the chat starts with assistant", () => {
    const result = toConverseMessages([{ role: "assistant", content: "Hello!" }]);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1].role).toBe("assistant");
  });

  it("rejects tool-role messages", () => {
    const messages: Message[] = [
      { role: "user", content: "hi" },
      { role: "tool", content: "result", tool_call_id: "x" },
    ];
    expect(() => toConverseMessages(messages)).toThrow(/not supported/);
  });
});

describe("extractJsonText", () => {
  it("passes through a bare JSON object", () => {
    expect(extractJsonText('{"a":1}')).toBe('{"a":1}');
  });

  it("strips markdown code fences", () => {
    expect(extractJsonText('```json\n{"a": 1}\n```')).toBe('{"a": 1}');
    expect(extractJsonText('```\n{"a": 1}\n```')).toBe('{"a": 1}');
  });

  it("trims surrounding prose down to the JSON object", () => {
    expect(extractJsonText('Here is the data:\n{"a": {"b": 2}}\nHope that helps!')).toBe(
      '{"a": {"b": 2}}'
    );
  });

  it("returns trimmed text when no JSON object is present", () => {
    expect(extractJsonText("  no json here  ")).toBe("no json here");
  });
});
