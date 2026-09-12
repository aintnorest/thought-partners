import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 5;
const MAX_TEXT_LENGTH = 20_000;
export const FETCH_TIMEOUT_MS = 8_000;
export const MAX_BODY_BYTES = 1_000_000;
const REDIRECT_STATUSES: Record<number, true> = {
  301: true,
  302: true,
  303: true,
  307: true,
  308: true,
};

function normalizedHostname(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  return hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
}

function parseIpv4(address: string): number[] | undefined {
  if (isIP(address) !== 4) return undefined;
  return address.split(".").map(Number);
}

function isBlockedIpv4(address: string): boolean {
  const octets = parseIpv4(address);
  if (!octets) return false;

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function parseIpv6(address: string): Uint8Array | undefined {
  if (isIP(address) !== 6) return undefined;

  let source = address.toLowerCase();
  const zoneIndex = source.indexOf("%");
  if (zoneIndex !== -1) source = source.slice(0, zoneIndex);

  const ipv4Match = source.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4Match) {
    const octets = parseIpv4(ipv4Match[1]);
    if (!octets) return undefined;
    source = `${source.slice(0, -ipv4Match[1].length)}${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }

  const halves = source.split("::");
  if (halves.length > 2) return undefined;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return undefined;

  const groups = [...left, ...Array<number>(missing).fill(0), ...right].map((part) =>
    typeof part === "number" ? part : Number.parseInt(part, 16),
  );
  if (groups.length !== 8 || groups.some((group) => !Number.isFinite(group))) return undefined;

  return Uint8Array.from(groups.flatMap((group) => [group >> 8, group & 0xff]));
}

function isBlockedIpv6(address: string): boolean {
  const bytes = parseIpv6(address);
  if (!bytes) return false;

  const isUnspecified = bytes.every((byte) => byte === 0);
  const isLoopback = bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1;
  const isLinkLocal = bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80;
  const isUniqueLocal = (bytes[0] & 0xfe) === 0xfc;
  const isIpv4Mapped =
    bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
  const mappedIpv4 = `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;

  return (
    isUnspecified ||
    isLoopback ||
    isLinkLocal ||
    isUniqueLocal ||
    (isIpv4Mapped && isBlockedIpv4(mappedIpv4))
  );
}

function isBlockedAddress(address: string): boolean {
  return isBlockedIpv4(address) || isBlockedIpv6(address);
}

/** Performs protocol, credential, localhost, and literal-IP checks without DNS. */
export function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;

  const hostname = normalizedHostname(url);
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return false;
  if (isIP(hostname) !== 0 && isBlockedAddress(hostname)) return false;

  return true;
}

async function assertAllowedTarget(url: URL): Promise<void> {
  if (!isAllowedUrl(url)) throw new Error("URL target is not allowed");

  const hostname = normalizedHostname(url);
  if (isIP(hostname) !== 0) return;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("URL hostname could not be resolved");
  }

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error("URL target is not allowed");
  }
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return text.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, value: string) => {
    if (value.startsWith("#")) {
      const hexadecimal = value[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(value.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      if (Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff) {
        return String.fromCodePoint(codePoint);
      }
      return entity;
    }
    return named[value.toLowerCase()] ?? entity;
  });
}

function htmlToReadableText(html: string): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|nav|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
  const withoutTags = withoutNoise.replace(/<[^>]*>/g, " ");
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

async function readResponseBody(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    byteLength += value.byteLength;
    if (byteLength > MAX_BODY_BYTES) {
      try {
        await reader.cancel();
      } catch {
        // Preserve the size error if cancellation itself fails.
      }
      throw new Error("recipe page too large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function fetchRecipeText(url: string): Promise<string> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    throw new Error("Invalid recipe URL");
  }

  for (let redirects = 0; ; redirects += 1) {
    await assertAllowedTarget(current);

    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      throw new Error("Recipe URL could not be fetched");
    }

    if (REDIRECT_STATUSES[response.status]) {
      if (redirects >= MAX_REDIRECTS) throw new Error("Too many redirects");
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect is missing a location");
      try {
        current = new URL(location, current);
      } catch {
        throw new Error("Redirect location is invalid");
      }
      continue;
    }

    if (!response.ok) throw new Error("Recipe URL returned an error");
    const readableText = htmlToReadableText(await readResponseBody(response));
    if (readableText.length < 40) throw new Error("recipe page has no readable text");
    return readableText;
  }
}
