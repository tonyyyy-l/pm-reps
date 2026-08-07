export type AiHotCandidate = {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  category: "ai-products";
  publishedAt: string | null;
  discoveredAt: string;
  permalink: string;
  sourceUrl: string;
};

export type AiHotCandidateSync = {
  candidates: AiHotCandidate[];
  notModified: boolean;
  etag: string | null;
  etagUrl: string;
};

export type AiHotSelectedBackfill = {
  candidates: AiHotCandidate[];
  snapshotItemCount: number;
  selectedProductCount: number;
  since: string;
  asOf: string;
};

export type SourceDocument = {
  title: string;
  canonicalUrl: string;
  publishedAt: string;
  retrievedAt: string;
  text: string;
};

const AI_HOT_URL =
  "https://aihot.virxact.com/api/v1/items?mode=selected&category=ai-products&window=7d&limit=100";
const AI_HOT_SELECTED_SNAPSHOT_URL =
  "https://aihot.virxact.com/api/v1/selected/snapshot";
const AI_HOT_UA = "aihot-skill/1.3.0 (+https://aihot.virxact.com/aihot-skill/)";
const SOURCE_TEXT_LIMIT = 30_000;
const SOURCE_RESPONSE_LIMIT = 350_000;

export async function fetchAiHotCandidates(options?: {
  etag?: string | null;
  etagUrl?: string | null;
}): Promise<AiHotCandidateSync> {
  const candidates: AiHotCandidate[] = [];
  let requestUrl = AI_HOT_URL;
  let firstEtag: string | null = null;
  for (let page = 0; page < 20; page += 1) {
    const headers: Record<string, string> = { "User-Agent": AI_HOT_UA };
    if (page === 0 && options?.etag && options.etagUrl === requestUrl) {
      headers["If-None-Match"] = options.etag;
    }
    const response = await fetch(requestUrl, { headers });
    if (page === 0 && response.status === 304) {
      return {
        candidates: [],
        notModified: true,
        etag: options?.etag ?? null,
        etagUrl: requestUrl,
      };
    }
    if (!response.ok) throw new Error(`AI HOT returned status ${response.status}.`);
    if (page === 0) firstEtag = response.headers.get("etag");
    const payload = (await response.json()) as {
      items?: unknown[];
      page?: { hasMore?: boolean; nextCursor?: string | null };
    };
    candidates.push(
      ...(payload.items ?? [])
        .map(parseCandidate)
        .filter((candidate): candidate is AiHotCandidate => candidate !== null),
    );
    if (!payload.page?.hasMore) {
      return {
        candidates,
        notModified: false,
        etag: firstEtag,
        etagUrl: AI_HOT_URL,
      };
    }
    if (!payload.page.nextCursor) throw new Error("AI HOT pagination cursor is missing.");
    const next = new URL(AI_HOT_URL);
    next.searchParams.set("cursor", payload.page.nextCursor);
    requestUrl = next.toString();
  }
  throw new Error("AI HOT pagination exceeded the bounded page limit.");
}

export async function fetchSelectedProductSnapshotSince(
  sinceInput: string,
): Promise<AiHotSelectedBackfill> {
  const since = new Date(sinceInput);
  if (Number.isNaN(since.getTime())) throw new Error("Backfill start date is invalid.");
  const now = Date.now();
  if (since.getTime() > now || now - since.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw new Error("Backfill start date must be within the past year.");
  }

  const candidates = new Map<string, AiHotCandidate>();
  let snapshotItemCount = 0;
  let selectedProductCount = 0;
  let nextPage: string | null = null;
  let stableCursor: string | null = null;
  let asOf = "";

  for (let pageNumber = 0; pageNumber < 20; pageNumber += 1) {
    const url = new URL(AI_HOT_SELECTED_SNAPSHOT_URL);
    url.searchParams.set("limit", "500");
    if (nextPage) {
      url.searchParams.set("page", nextPage);
    } else {
      url.searchParams.set("fields", "default");
    }
    const response = await fetch(url, { headers: { "User-Agent": AI_HOT_UA } });
    if (!response.ok) {
      throw new Error(`AI HOT selected snapshot returned status ${response.status}.`);
    }
    const payload = (await response.json()) as {
      asOf?: string;
      cursor?: string;
      count?: number;
      hasMore?: boolean;
      nextPage?: string | null;
      items?: unknown[];
    };
    if (!Array.isArray(payload.items) || typeof payload.cursor !== "string") {
      throw new Error("AI HOT selected snapshot returned an invalid contract.");
    }
    if (stableCursor && payload.cursor !== stableCursor) {
      throw new Error("AI HOT selected snapshot changed watermarks during pagination.");
    }
    stableCursor = payload.cursor;
    asOf = payload.asOf ?? asOf;
    snapshotItemCount += payload.items.length;
    for (const item of payload.items) {
      const candidate = parseCandidate(item);
      if (!candidate) continue;
      selectedProductCount += 1;
      if (candidateTimelineAt(candidate).getTime() >= since.getTime()) {
        candidates.set(candidate.id, candidate);
      }
    }
    if (!payload.hasMore) {
      return {
        candidates: [...candidates.values()].sort(
          (left, right) =>
            candidateTimelineAt(right).getTime() - candidateTimelineAt(left).getTime(),
        ),
        snapshotItemCount,
        selectedProductCount,
        since: since.toISOString(),
        asOf: asOf || new Date().toISOString(),
      };
    }
    if (!payload.nextPage) throw new Error("AI HOT selected snapshot page cursor is missing.");
    nextPage = payload.nextPage;
  }
  throw new Error("AI HOT selected snapshot exceeded the bounded page limit.");
}

export async function fetchSourceDocument(candidate: AiHotCandidate): Promise<SourceDocument> {
  if (!candidate.publishedAt || Number.isNaN(Date.parse(candidate.publishedAt))) {
    throw new Error("Original publication time is unavailable or invalid.");
  }
  const requestedUrl = validatePublicHttpsUrl(candidate.sourceUrl);
  const response = await fetch(requestedUrl, {
    headers: {
      Accept: "text/html, text/plain;q=0.9",
      "User-Agent": "PM-Reps-Source-Reader/1.0",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Original source returned status ${response.status}.`);
  const canonicalUrl = validatePublicHttpsUrl(response.url).toString();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("Original source is not readable HTML or plain text.");
  }
  const raw = await readLimitedResponse(response, SOURCE_RESPONSE_LIMIT);
  const text = contentType.includes("text/html") ? htmlToText(raw) : normalizeText(raw);
  if (text.length < 400) throw new Error("Original source does not contain enough readable text.");
  return {
    title: candidate.title,
    canonicalUrl,
    publishedAt: new Date(candidate.publishedAt).toISOString(),
    retrievedAt: new Date().toISOString(),
    text: text.slice(0, SOURCE_TEXT_LIMIT),
  };
}

function parseCandidate(value: unknown): AiHotCandidate | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    item.category !== "ai-products" ||
    item.selected !== true ||
    typeof item.discoveredAt !== "string"
  ) {
    return null;
  }
  const links = item.links as Record<string, unknown> | undefined;
  const source = item.source as Record<string, unknown> | undefined;
  if (
    !links ||
    typeof links.aihot !== "string" ||
    !links.aihot.startsWith("https://aihot.virxact.com/") ||
    typeof links.original !== "string" ||
    !source ||
    typeof source.name !== "string"
  ) return null;
  try {
    const sourceUrl = validatePublicHttpsUrl(links.original).toString();
    return {
      id: item.id,
      title: item.title.slice(0, 300),
      summary: typeof item.summary === "string" ? item.summary.slice(0, 800) : null,
      source: source.name.slice(0, 200),
      category: "ai-products",
      publishedAt: typeof item.publishedAt === "string" ? item.publishedAt : null,
      discoveredAt: item.discoveredAt,
      permalink: links.aihot,
      sourceUrl,
    };
  } catch {
    return null;
  }
}

function candidateTimelineAt(candidate: AiHotCandidate) {
  const discoveredAt = new Date(candidate.discoveredAt);
  if (!candidate.publishedAt) return discoveredAt;
  const publishedAt = new Date(candidate.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) return discoveredAt;
  return discoveredAt.getTime() - publishedAt.getTime() > 72 * 60 * 60 * 1000
    ? publishedAt
    : discoveredAt;
}

function validatePublicHttpsUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Source URL must be a credential-free HTTPS URL.");
  }
  if (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "0.0.0.0" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname)
  ) {
    throw new Error("Private or local source URLs are not allowed.");
  }
  return url;
}

async function readLimitedResponse(response: Response, limit: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (output.length < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => undefined);
  return output.slice(0, limit);
}

function htmlToText(html: string) {
  return normalizeText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;|&#34;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">"),
  );
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
