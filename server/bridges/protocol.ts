import { normalizeModelBaseUrl } from "../providers/openai-compatible";
import { safeJsonRequest } from "../providers/safe-http";

export type BridgeHealth = {
  name: string;
  capabilities: string[];
};

export type BridgeRunResult = {
  output: string;
  externalRunId?: string;
  steps?: string[];
};

async function bridgeRequest(
  url: string,
  apiKey: string | undefined,
  body?: unknown
): Promise<Record<string, unknown>> {
  try {
    return await safeJsonRequest(url, apiKey, body, 2_000_000, 45_000);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("The agent bridge request failed.");
  }
}

export async function checkApexBridge(
  endpoint: string,
  apiKey?: string
): Promise<BridgeHealth> {
  const base = await normalizeModelBaseUrl(endpoint);
  const response = await bridgeRequest(`${base}/health`, apiKey);
  if (response.protocol !== "apex-bridge/v1") {
    throw new Error(
      "The endpoint is reachable but does not identify as APEX Bridge v1."
    );
  }
  if (typeof response.name !== "string" || !response.name.trim()) {
    throw new Error("The bridge health response is missing its public name.");
  }
  const capabilities = Array.isArray(response.capabilities)
    ? response.capabilities
        .filter((item): item is string => typeof item === "string")
        .slice(0, 50)
    : [];
  return { name: response.name.slice(0, 120), capabilities };
}

export async function runApexBridge(
  endpoint: string,
  apiKey: string | undefined,
  request: {
    requestId: string;
    task: string;
    context: Array<{ role: string; content: string }>;
  }
): Promise<BridgeRunResult> {
  const base = await normalizeModelBaseUrl(endpoint);
  const response = await bridgeRequest(`${base}/run`, apiKey, request);
  if (
    response.protocol !== "apex-bridge/v1" ||
    response.status !== "completed" ||
    typeof response.output !== "string"
  ) {
    throw new Error(
      "The agent bridge did not return a completed APEX Bridge v1 result."
    );
  }
  const steps = Array.isArray(response.steps)
    ? response.steps
        .filter((item): item is string => typeof item === "string")
        .slice(0, 30)
        .map(item => item.slice(0, 500))
    : undefined;
  return {
    output: response.output.slice(0, 50_000),
    ...(typeof response.runId === "string"
      ? { externalRunId: response.runId.slice(0, 160) }
      : {}),
    ...(steps ? { steps } : {}),
  };
}
