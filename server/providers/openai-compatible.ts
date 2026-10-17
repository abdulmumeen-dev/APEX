import { isIP } from "node:net";
import {
  assertPublicHostname,
  isPrivateAddress,
  safeJsonRequest,
} from "./safe-http";

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

export type FunctionTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ModelConfig = {
  baseUrl: string;
  modelId: string;
  apiKey?: string;
};

export type ModelToolCall = { id: string; name: string; arguments: string };
export type ModelReply = { content: string; toolCalls: ModelToolCall[] };

export async function normalizeModelBaseUrl(raw: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(
      "Enter a valid model-server URL, including https:// or http://."
    );
  }
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Model endpoints must use HTTP or HTTPS.");
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "Do not include credentials, query strings, or fragments in the endpoint URL."
    );
  if (url.pathname.includes(".."))
    throw new Error(
      "The endpoint path cannot contain parent-directory segments."
    );

  const allowPrivate = process.env.APEX_ALLOW_PRIVATE_ENDPOINTS === "true";
  if (url.protocol === "http:" && !allowPrivate)
    throw new Error(
      "HTTPS is required. For a self-hosted local model, the operator must explicitly enable private endpoints."
    );

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) throw new Error("The model endpoint must include a hostname.");
  if (
    allowPrivate &&
    (hostname === "localhost" || hostname.endsWith(".localhost"))
  ) {
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname) && !allowPrivate)
      throw new Error(
        "Private-network model endpoints are disabled by the APEX operator."
      );
  } else {
    if (!allowPrivate) await assertPublicHostname(hostname);
  }

  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

async function requestJson(
  url: string,
  apiKey?: string,
  body?: unknown
): Promise<Record<string, unknown>> {
  try {
    return await safeJsonRequest(url, apiKey, body, 5_000_000, 45_000);
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP 404"))
      throw new Error(
        "The model endpoint was not found. Use the server's OpenAI-compatible /v1 base URL."
      );
    if (error instanceof Error) throw error;
    throw new Error("The model request failed.");
  }
}

export async function listModels(config: ModelConfig): Promise<string[]> {
  const base = await normalizeModelBaseUrl(config.baseUrl);
  const body = await requestJson(`${base}/models`, config.apiKey);
  const data = body.data;
  if (!Array.isArray(data))
    throw new Error("The model server response did not contain a models list.");
  return data.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const id = (item as { id?: unknown }).id;
    return typeof id === "string" ? [id] : [];
  });
}

export async function createChatCompletion(
  config: ModelConfig,
  messages: ChatMessage[],
  tools: FunctionTool[]
): Promise<ModelReply> {
  const base = await normalizeModelBaseUrl(config.baseUrl);
  const body = await requestJson(`${base}/chat/completions`, config.apiKey, {
    model: config.modelId,
    messages,
    tools,
    tool_choice: "auto",
    stream: false,
  });

  const choices = body.choices;
  if (
    !Array.isArray(choices) ||
    !choices.length ||
    !choices[0] ||
    typeof choices[0] !== "object"
  ) {
    throw new Error("The model server did not return a completion choice.");
  }
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== "object")
    throw new Error("The model server returned an invalid completion message.");
  const msg = message as { content?: unknown; tool_calls?: unknown };
  const content = typeof msg.content === "string" ? msg.content : "";
  const toolCalls = Array.isArray(msg.tool_calls)
    ? msg.tool_calls.flatMap((entry): ModelToolCall[] => {
        if (!entry || typeof entry !== "object") return [];
        const call = entry as { id?: unknown; function?: unknown };
        if (
          typeof call.id !== "string" ||
          !call.function ||
          typeof call.function !== "object"
        )
          return [];
        const fn = call.function as { name?: unknown; arguments?: unknown };
        if (typeof fn.name !== "string" || typeof fn.arguments !== "string")
          return [];
        return [{ id: call.id, name: fn.name, arguments: fn.arguments }];
      })
    : [];
  if (!content && toolCalls.length === 0)
    throw new Error("The model returned neither text nor tool calls.");
  return { content, toolCalls };
}
