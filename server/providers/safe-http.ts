import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";

type PinnedAddress = { address: string; family: number };

export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [a, b, c] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith("ff")
    ) {
      return true;
    }
    if (
      normalized.startsWith("2001:db8:") ||
      normalized.startsWith("2001:0:") ||
      normalized.startsWith("2002:") ||
      !/^[23][0-9a-f]{3}:/.test(normalized)
    ) {
      return true;
    }
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isPrivateAddress(mapped);
    }
    return false;
  }
  return true;
}

export async function assertPublicHostname(hostname: string): Promise<void> {
  let addresses: PinnedAddress[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The endpoint hostname could not be resolved.");
  }
  if (!addresses.length)
    throw new Error("The endpoint hostname did not resolve.");
  if (addresses.some(entry => isPrivateAddress(entry.address))) {
    throw new Error(
      "The endpoint resolves to a private or reserved network. That is disabled by the APEX operator."
    );
  }
}

async function resolvePinnedAddresses(url: URL): Promise<PinnedAddress[]> {
  const allowPrivate = process.env.APEX_ALLOW_PRIVATE_ENDPOINTS === "true";
  if (url.protocol === "http:" && !allowPrivate) {
    throw new Error(
      "HTTPS is required. For a self-hosted local endpoint, the operator must explicitly enable private endpoints."
    );
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) throw new Error("The endpoint must include a hostname.");
  let addresses: PinnedAddress[];
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) as 4 | 6 }];
  } else {
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new Error("The endpoint hostname could not be resolved.");
    }
  }
  if (!addresses.length)
    throw new Error("The endpoint hostname did not resolve.");
  if (
    !allowPrivate &&
    addresses.some(entry => isPrivateAddress(entry.address))
  ) {
    throw new Error(
      "The endpoint resolves to a private or reserved network. That is disabled by the APEX operator."
    );
  }
  return addresses;
}

export async function safeJsonRequest(
  rawUrl: string,
  apiKey?: string,
  body?: unknown,
  maxBytes = 5_000_000,
  timeoutMs = 45_000,
  query?: URLSearchParams
): Promise<Record<string, unknown>> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("The endpoint URL is invalid.");
  }
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("The endpoint must use HTTP or HTTPS.");
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "Do not include credentials, query strings, or fragments in endpoint URLs."
    );

  if (query) {
    const encoded = query.toString();
    if (encoded.length > 2_048)
      throw new Error("API plugin query parameters exceed the 2 KB limit.");
    url.search = encoded;
  }

  const addresses = await resolvePinnedAddresses(url);
  const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
    if (typeof options === "object" && "all" in options && options.all) {
      callback(null, addresses);
      return;
    }
    callback(null, addresses[0].address, addresses[0].family);
  };

  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  let serializedBody: string | undefined;
  if (body !== undefined) {
    serializedBody = JSON.stringify(body);
    if (Buffer.byteLength(serializedBody, "utf8") > maxBytes) {
      throw new Error("The request exceeded its configured size limit.");
    }
    headers["Content-Type"] = "application/json";
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const resolveOnce = (value: Record<string, unknown>) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const responseHandler = (response: import("node:http").IncomingMessage) => {
      const status = response.statusCode ?? 0;
      const contentLength = Number(response.headers["content-length"] ?? 0);
      if (contentLength > maxBytes) {
        response.destroy();
        rejectOnce(
          new Error(
            `The endpoint response exceeded the ${Math.round(maxBytes / 1_000_000)} MB limit.`
          )
        );
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        if (status === 401 || status === 403) {
          rejectOnce(
            new Error("The endpoint rejected its credential or access policy.")
          );
        } else {
          rejectOnce(new Error(`The endpoint returned HTTP ${status}.`));
        }
        return;
      }

      const chunks: Buffer[] = [];
      let receivedBytes = 0;
      response.on("data", (chunk: Buffer | string) => {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += data.length;
        if (receivedBytes > maxBytes) {
          response.destroy();
          rejectOnce(
            new Error(
              `The endpoint response exceeded the ${Math.round(maxBytes / 1_000_000)} MB limit.`
            )
          );
          return;
        }
        chunks.push(data);
      });
      response.on("error", error => rejectOnce(error));
      response.on("end", () => {
        if (settled) return;
        try {
          const parsed: unknown = JSON.parse(
            Buffer.concat(chunks).toString("utf8")
          );
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error();
          }
          resolveOnce(parsed as Record<string, unknown>);
        } catch {
          rejectOnce(new Error("The endpoint returned invalid JSON."));
        }
      });
    };

    const options = {
      method: serializedBody === undefined ? "GET" : "POST",
      headers,
      lookup: pinnedLookup,
      timeout: timeoutMs,
    };
    const request =
      url.protocol === "https:"
        ? httpsRequest(
            url,
            {
              ...options,
              servername: isIP(url.hostname.replace(/^\[|\]$/g, ""))
                ? undefined
                : url.hostname,
            },
            responseHandler
          )
        : httpRequest(url, options, responseHandler);

    request.setTimeout(timeoutMs, () => {
      const error = new Error("ETIMEDOUT");
      request.destroy(error);
    });
    request.on("error", error => {
      if ((error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
        rejectOnce(
          new Error(
            `The endpoint did not respond before the ${Math.round(timeoutMs / 1000)}-second timeout.`
          )
        );
      } else {
        rejectOnce(
          new Error(
            "The endpoint could not be reached. Check its URL and network access."
          )
        );
      }
    });
    if (serializedBody === undefined) request.end();
    else request.end(serializedBody);
  });
}
