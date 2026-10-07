import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Content,
  LanguageModelV4FunctionTool,
  LanguageModelV4GenerateResult,
  LanguageModelV4Prompt,
} from "@ai-sdk/provider";

/**
 * The Claude Code CLI as the model of the agent steps.
 *
 * e2e talks to its model through the AI SDK and has no sign-in for a Claude
 * subscription, so this is the bridge: every model call becomes one headless
 * run of `claude -p`, which answers with the account the CLI is signed in
 * to. Nothing here holds a key or a token.
 *
 * The CLI runs with none of its own tools, settings or MCP servers and in an
 * empty directory: it is asked for a decision, and the e2e runner carries the
 * decision out. Tool calls travel as JSON in the reply.
 */
export function claudeCli(modelId = "sonnet"): LanguageModelV4 {
  return {
    specificationVersion: "v4",
    provider: "claude-cli",
    modelId,
    supportedUrls: {},
    doGenerate: (options) => generate(modelId, options),
    doStream: () => Promise.reject(new Error("claude-cli answers in one piece: streaming is not supported")),
  };
}

type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

type CliResult = {
  is_error?: boolean;
  subtype?: string;
  result?: string;
  structured_output?: unknown;
  usage?: {
    input_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    output_tokens?: number;
  };
};

type ToolCall = { name?: unknown; input?: unknown };

const functionTools = (options: LanguageModelV4CallOptions) =>
  (options.tools ?? []).filter((tool): tool is LanguageModelV4FunctionTool => tool.type === "function");

/** How the reply has to look, appended to the instructions e2e sends. */
function replyRules(options: LanguageModelV4CallOptions): string {
  const tools = functionTools(options);
  const choice = options.toolChoice ?? { type: "auto" };
  if (tools.length === 0 || choice.type === "none") {
    return options.responseFormat?.type === "json"
      ? "Reply with one JSON object and nothing else: no prose, no code fence."
      : "";
  }
  const must =
    choice.type === "tool"
      ? `You must call the tool "${choice.toolName}".`
      : choice.type === "required"
        ? "You must call a tool."
        : 'Call a tool, or answer in words with {"text":"..."} when no tool applies.';
  return [
    "# How to reply",
    "You act only through the tools below. You cannot run them yourself: you name the calls and the test runner makes them, then shows you the result.",
    'Your reply is one JSON object: {"tool_calls":[{"name":"<tool>","input":{<arguments>}}]}',
    `${must} Make one call per reply unless several are independent of each other.`,
    "# Tools",
    JSON.stringify(
      tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema })),
    ),
  ].join("\n");
}

/** The shape of a reply that names tool calls; the CLI holds the model to it. */
function callsSchema(options: LanguageModelV4CallOptions) {
  const choice = options.toolChoice ?? { type: "auto" };
  const names = choice.type === "tool" ? [choice.toolName] : functionTools(options).map((tool) => tool.name);
  return {
    type: "object",
    properties: {
      tool_calls: {
        type: "array",
        minItems: choice.type === "auto" ? 0 : 1,
        items: {
          type: "object",
          properties: { name: { type: "string", enum: names }, input: { type: "object" } },
          required: ["name", "input"],
        },
      },
      ...(choice.type === "auto" ? { text: { type: "string" } } : {}),
    },
    required: ["tool_calls"],
  };
}

const pixels = (data: { type: string; data?: Uint8Array | string }, mediaType: string): Block[] =>
  data.type === "data" && data.data !== undefined && mediaType.startsWith("image/")
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: typeof data.data === "string" ? data.data : Buffer.from(data.data).toString("base64"),
          },
        },
      ]
    : [{ type: "text", text: `[a ${mediaType} file that cannot be shown]` }];

/** The conversation so far as the content of one message: the CLI is asked afresh each time. */
function transcript(prompt: LanguageModelV4Prompt): { system: string; blocks: Block[] } {
  const system: string[] = [];
  const blocks: Block[] = [];
  const say = (text: string) => blocks.push({ type: "text", text });

  for (const message of prompt) {
    if (message.role === "system") {
      system.push(message.content);
    } else if (message.role === "user") {
      say("[user]");
      for (const part of message.content) {
        if (part.type === "text") say(part.text);
        else blocks.push(...pixels(part.data, part.mediaType));
      }
    } else if (message.role === "assistant") {
      const calls = message.content.flatMap((part) =>
        part.type === "tool-call" ? [{ id: part.toolCallId, name: part.toolName, input: part.input }] : [],
      );
      const words = message.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
      say(`[you]\n${calls.length > 0 ? JSON.stringify({ tool_calls: calls }) : words}`);
    } else {
      for (const part of message.content) {
        if (part.type !== "tool-result") continue;
        say(`[result of ${part.toolName} ${part.toolCallId}]`);
        const { output } = part;
        if (output.type === "text" || output.type === "error-text") say(output.value);
        else if (output.type === "json" || output.type === "error-json") say(JSON.stringify(output.value));
        else if (output.type === "execution-denied") say(`denied: ${output.reason ?? "no reason given"}`);
        else {
          for (const piece of output.value) {
            if (piece.type === "text") say(piece.text);
            else if (piece.type === "file") blocks.push(...pixels(piece.data, piece.mediaType));
          }
        }
      }
    }
  }
  return { system: system.join("\n\n"), blocks };
}

/** The first JSON object in a reply, whatever a model wrapped around it. */
function firstObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  for (let end = text.lastIndexOf("}"); start !== -1 && end > start; end = text.lastIndexOf("}", end - 1)) {
    try {
      const value: unknown = JSON.parse(text.slice(start, end + 1));
      if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
    } catch {
      // Not the whole object yet: try a shorter slice.
    }
  }
  return null;
}

let calls = 0;

/** One headless run of the CLI; resolves with its final event. */
function run(modelId: string, system: string, blocks: Block[], schema: unknown, signal?: AbortSignal) {
  return new Promise<CliResult>((resolve, reject) => {
    // A run started from inside a Claude Code session must not look nested.
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const name of Object.keys(env)) {
      if (/^CLAUDE(CODE|_CODE_|_AGENT_SDK)/.test(name)) delete env[name];
    }
    const child = spawn(
      process.env.E2E_CLAUDE_BIN ?? "claude",
      [
        "--print",
        "--input-format", "stream-json",
        "--output-format", "stream-json",
        "--verbose",
        "--model", modelId,
        "--effort", process.env.E2E_CLAUDE_EFFORT ?? "low",
        "--system-prompt", system,
        "--tools", "",
        "--strict-mcp-config",
        "--setting-sources", "project",
        "--no-session-persistence",
        ...(schema === undefined ? [] : ["--json-schema", JSON.stringify(schema)]),
      ],
      { cwd: tmpdir(), env, signal, stdio: ["pipe", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk: Buffer) => (out += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (err += chunk.toString()));
    child.on("error", (cause) =>
      reject(new Error(`could not run the Claude CLI (is \`claude\` installed and signed in?): ${cause.message}`)),
    );
    child.on("close", (code) => {
      const events = out.split("\n").flatMap((line) => {
        try {
          return line.trim().startsWith("{") ? [JSON.parse(line) as CliResult & { type?: string }] : [];
        } catch {
          return [];
        }
      });
      const result = events.reverse().find((event) => event.type === "result");
      if (!result || result.is_error) {
        const detail = result?.result ?? (err.trim().slice(-400) || `exit code ${code}`);
        reject(new Error(`the Claude CLI failed: ${detail}`));
      } else {
        resolve(result);
      }
    });
    child.stdin.end(`${JSON.stringify({ type: "user", message: { role: "user", content: blocks } })}\n`);
  });
}

async function generate(modelId: string, options: LanguageModelV4CallOptions): Promise<LanguageModelV4GenerateResult> {
  const { system, blocks } = transcript(options.prompt);
  const rules = replyRules(options);
  const tools = functionTools(options);
  const wantsCalls = tools.length > 0 && options.toolChoice?.type !== "none";
  const schema = wantsCalls
    ? callsSchema(options)
    : options.responseFormat?.type === "json"
      ? options.responseFormat.schema
      : undefined;

  const result = await run(modelId, [system, rules].filter(Boolean).join("\n\n"), blocks, schema, options.abortSignal);
  const text = result.result ?? "";
  const structured =
    typeof result.structured_output === "object" && result.structured_output !== null
      ? (result.structured_output as Record<string, unknown>)
      : null;

  const content: LanguageModelV4Content[] = [];
  if (wantsCalls) {
    const reply = structured ?? firstObject(text);
    const named = Array.isArray(reply?.tool_calls) ? (reply.tool_calls as ToolCall[]) : [];
    named.forEach((call, index) => {
      if (typeof call?.name !== "string") return;
      content.push({
        type: "tool-call",
        toolCallId: `call_${Date.now().toString(36)}_${index}`,
        toolName: call.name,
        input: JSON.stringify(call.input ?? {}),
      });
    });
    if (content.length === 0) content.push({ type: "text", text: typeof reply?.text === "string" ? reply.text : text });
  } else if (structured) {
    content.push({ type: "text", text: JSON.stringify(structured) });
  } else {
    const reply = options.responseFormat?.type === "json" ? firstObject(text) : null;
    content.push({ type: "text", text: reply ? JSON.stringify(reply) : text });
  }

  // E2E_CLAUDE_TRACE=<dir> keeps every exchange, to see what the model was asked and said.
  if (process.env.E2E_CLAUDE_TRACE) {
    mkdirSync(process.env.E2E_CLAUDE_TRACE, { recursive: true });
    writeFileSync(
      join(process.env.E2E_CLAUDE_TRACE, `${process.pid}-${String((calls += 1)).padStart(3, "0")}.json`),
      JSON.stringify({ system, rules, blocks: blocks.map((block) => (block.type === "text" ? block.text : "[image]")), reply: text, content }, null, 1),
    );
  }

  const usage = result.usage ?? {};
  const cached = usage.cache_read_input_tokens ?? 0;
  const written = usage.cache_creation_input_tokens ?? 0;
  const fresh = usage.input_tokens ?? 0;
  const calledTools = content.some((part) => part.type === "tool-call");
  return {
    content,
    finishReason: { unified: calledTools ? "tool-calls" : "stop", raw: result.subtype },
    usage: {
      inputTokens: { total: fresh + cached + written, noCache: fresh, cacheRead: cached, cacheWrite: written },
      outputTokens: { total: usage.output_tokens, text: usage.output_tokens, reasoning: undefined },
    },
    warnings: [],
  };
}
