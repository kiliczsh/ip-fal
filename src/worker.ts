import { ApiError, createFalClient } from "@fal-ai/client";
import { renderPage } from "./page";
import { OG_IMAGE_BASE64 } from "./assets/og-image";

const DEFAULT_GEO_MODEL_ID = "fal-ai/flux-2/turbo";
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#b9ddfb"/>
  <rect x="3" y="3" width="58" height="58" fill="none" stroke="#070707" stroke-width="4"/>
  <rect x="8" y="8" width="12" height="12" fill="#c8ff00"/>
  <rect x="44" y="44" width="12" height="12" fill="#7c14ff"/>
  <text x="10" y="45" fill="#070707" font-family="Arial,sans-serif" font-size="30" font-weight="900">ip</text>
</svg>`;

export interface Env {
  APP_HOST?: string;
  FAL_KEY?: string;
  FAL_MODEL_ID?: string;
  GEO_PREVIEW?: string;
  GENERATION_SIGNING_KEY?: string;
  WEB_ANALYTICS_TOKEN?: string;
  GENERATION_RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const GENERATION_TOKEN_TTL_SECONDS = 5 * 60;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function base64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function createGenerationToken(request: Request, secret: string): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const expires = Math.floor(Date.now() / 1000) + GENERATION_TOKEN_TTL_SECONDS;
  const message = new TextEncoder().encode(`${ip}:${expires}`);
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), message);
  return `${expires}.${base64Url(signature)}`;
}

async function verifyGenerationToken(request: Request, secret: string): Promise<boolean> {
  const token = request.headers.get("x-generation-token") ?? "";
  const [expiresText, signatureText, extra] = token.split(".");
  if (!expiresText || !signatureText || extra !== undefined) return false;
  const expires = Number(expiresText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(expires) || expires < now || expires > now + GENERATION_TOKEN_TTL_SECONDS + 30) {
    return false;
  }
  const signature = decodeBase64Url(signatureText);
  if (!signature) return false;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const message = new TextEncoder().encode(`${ip}:${expires}`);
  return crypto.subtle.verify("HMAC", await hmacKey(secret), signature, message);
}

function hasTrustedBrowserContext(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    origin === url.origin ||
    referer?.startsWith(`${url.origin}/`) === true ||
    fetchSite === "same-origin"
  );
}

function isAllowedGenerationHost(hostname: string, env: Env): boolean {
  return !env.APP_HOST || hostname === env.APP_HOST || hostname === "127.0.0.1" || hostname === "localhost";
}

function favicon(): Response {
  return new Response(FAVICON_SVG, {
    headers: {
      "cache-control": "public, max-age=604800, immutable",
      "content-type": "image/svg+xml; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

function ogImage(): Response {
  const bytes = Uint8Array.from(atob(OG_IMAGE_BASE64), (character) => character.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "cache-control": "public, max-age=604800, immutable",
      "content-type": "image/png",
      "x-content-type-options": "nosniff",
    },
  });
}

export function getLocalTimeContext(timeZone: string): {
  dateKey: string;
  localTime: string;
  timeBucket: string;
  month: string;
  period: string;
} {
  const now = new Date();

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    const bucketMinute = Math.floor(minute / 15) * 15;
    const timeBucket = `${values.hour}:${String(bucketMinute).padStart(2, "0")}`;
    const period =
      hour < 5
        ? "deep night under moonlight"
        : hour < 8
          ? "sunrise with soft early light"
          : hour < 12
            ? "clear morning light"
            : hour < 16
              ? "bright afternoon daylight"
              : hour < 19
                ? "warm golden-hour light"
                : hour < 22
                  ? "blue-hour dusk"
                  : "quiet night under moonlight";

    return {
      dateKey: `${values.year}-${values.month}-${values.day}`,
      localTime: `${values.hour}:${values.minute}`,
      timeBucket,
      month: values.month,
      period,
    };
  } catch {
    return {
      dateKey: now.toISOString().slice(0, 10),
      localTime: now.toISOString().slice(11, 16),
      timeBucket: `${now.toISOString().slice(11, 13)}:${String(Math.floor(now.getUTCMinutes() / 15) * 15).padStart(2, "0")}`,
      month: new Intl.DateTimeFormat("en-US", { month: "long" }).format(now),
      period: "natural daylight",
    };
  }
}

export function formatCoordinates(latitude: unknown, longitude: unknown): string | null {
  const latitudeValue = typeof latitude === "string" ? latitude.trim() : String(latitude ?? "");
  const longitudeValue =
    typeof longitude === "string" ? longitude.trim() : String(longitude ?? "");
  if (!latitudeValue || !longitudeValue) return null;
  const lat = Number(latitudeValue);
  const lon = Number(longitudeValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return `${latitudeValue}, ${longitudeValue}`;
}

function createPreviewImage(
  location: string,
  coordinates: string | null,
  period: string,
  portrait: boolean,
): string {
  const escapeXml = (value: string): string =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const width = portrait ? 576 : 1024;
  const height = portrait ? 1024 : 576;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#b9ddfb"/>
    <rect x="32" y="32" width="${width - 64}" height="${height - 64}" fill="none" stroke="#070707" stroke-width="8"/>
    <path d="M32 ${height - 210} 170 ${height - 390}l110 110 130-250 ${width - 32} ${height - 210}v178H32Z" fill="#7c14ff"/>
    <circle cx="${width - 120}" cy="150" r="66" fill="#c8ff00" stroke="#070707" stroke-width="8"/>
    <text x="100" y="150" fill="#070707" font-family="Arial,sans-serif" font-size="54" font-weight="900">LOCAL PREVIEW</text>
    <text x="56" y="${height - 130}" fill="#fff" font-family="Arial,sans-serif" font-size="32" font-weight="900">${escapeXml(location)}</text>
    <text x="56" y="${height - 84}" fill="#fff" font-family="monospace" font-size="20">${escapeXml(coordinates ?? "coordinates unavailable")}</text>
    <text x="56" y="${height - 50}" fill="#fff" font-family="monospace" font-size="18">${escapeXml(period)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function generateGeoImage(request: Request, env: Env): Promise<Response> {
  if (!env.FAL_KEY && env.GEO_PREVIEW !== "true") {
    return json({ error: "Image generation service is not configured" }, 503);
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format !== "portrait" && format !== "landscape") {
    return json({ error: "Invalid image format" }, 400);
  }

  if (env.GEO_PREVIEW !== "true") {
    if (!isAllowedGenerationHost(url.hostname, env)) return json({ error: "Not found" }, 404);
    if (!hasTrustedBrowserContext(request)) return json({ error: "Forbidden" }, 403);
    if (!env.GENERATION_SIGNING_KEY) return json({ error: "Generation protection unavailable" }, 503);
    if (!(await verifyGenerationToken(request, env.GENERATION_SIGNING_KEY))) {
      return json({ error: "Invalid or expired generation token" }, 401);
    }
  }

  const cf = request.cf;
  const city = typeof cf?.city === "string" ? cf.city : "your city";
  const region = typeof cf?.region === "string" ? cf.region : "";
  const country =
    typeof cf?.country === "string"
      ? cf.country
      : request.headers.get("cf-ipcountry") ?? "the world";
  const location = [city, region, country]
    .filter((part, index, parts) =>
      Boolean(part) && parts.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index,
    )
    .join(", ");
  const timeZone = typeof cf?.timezone === "string" ? cf.timezone : "UTC";
  const time = getLocalTimeContext(timeZone);
  const coordinates = formatCoordinates(cf?.latitude, cf?.longitude);
  const coordinateContext = coordinates ? `, around ${coordinates}` : "";
  const portrait = format === "portrait";
  const modelId = env.FAL_MODEL_ID || DEFAULT_GEO_MODEL_ID;
  const composition = portrait
    ? ", vertical 9:16 landscape composition optimized for a mobile screen"
    : ", wide 16:9 landscape composition optimized for a desktop screen";
  const prompt = `An immersive landscape view near ${location}${coordinateContext}, faithfully representing what is characteristic of this location and its surrounding region, whether urban, rural, coastal, mountainous, architectural, natural, or a mixture of these, with recognizable local geography and an authentic sense of place, seasonally appropriate for ${time.month}, ${time.period} at ${time.localTime} local time${composition}, atmospheric high-fidelity editorial photography, balanced composition, no prominent people, no text, no logos`;

  if (env.GEO_PREVIEW === "true") {
    return json({
      model: modelId,
      request_id: "local-preview",
      images: [
        {
          url: createPreviewImage(location, coordinates, time.period, portrait),
          content_type: "image/svg+xml",
          width: portrait ? 576 : 1024,
          height: portrait ? 1024 : 576,
        },
      ],
      timings: { inference: 0 },
      seed: 0,
      has_nsfw_concepts: [false],
      prompt,
      cache: "PREVIEW",
    });
  }

  const cacheUrl = new URL("https://geoaware-cache.invalid/v6-flux2-place-landscape/geo-image");
  cacheUrl.searchParams.set("model", modelId);
  cacheUrl.searchParams.set("location", location.toLowerCase());
  cacheUrl.searchParams.set("coordinates", coordinates ?? "unknown");
  cacheUrl.searchParams.set("date", time.dateKey);
  cacheUrl.searchParams.set("period", time.period);
  cacheUrl.searchParams.set("time", time.timeBucket);
  cacheUrl.searchParams.set("format", portrait ? "portrait-9-16" : "landscape-16-9");
  const cacheKey = new Request(cacheUrl, { method: "GET" });
  const cached = await caches.default.match(cacheKey);

  if (cached) {
    const data = (await cached.json()) as Record<string, unknown>;
    return json({ ...data, cache: "HIT" });
  }

  if (env.GEO_PREVIEW !== "true") {
    if (!env.GENERATION_RATE_LIMITER) return json({ error: "Rate limiter unavailable" }, 503);
    const rateLimitKey = request.headers.get("cf-connecting-ip") ?? "unknown";
    const { success } = await env.GENERATION_RATE_LIMITER.limit({ key: rateLimitKey });
    if (!success) {
      return Response.json(
        { error: "Generation rate limit exceeded" },
        { status: 429, headers: { "cache-control": "no-store", "retry-after": "60" } },
      );
    }
  }

  const fal = createFalClient({ credentials: env.FAL_KEY });
  const result = await fal.subscribe(modelId, {
    input: {
      prompt,
      image_size: portrait ? "portrait_16_9" : "landscape_16_9",
      num_images: 1,
      output_format: "jpeg",
      guidance_scale: 2.5,
      enable_prompt_expansion: false,
      enable_safety_checker: true,
    },
    abortSignal: request.signal,
  });
  const data = {
    model: modelId,
    request_id: result.requestId,
    ...result.data,
  };
  const cacheResponse = Response.json(data, {
    headers: { "cache-control": "public, max-age=3600" },
  });
  await caches.default.put(cacheKey, cacheResponse);

  return json({ ...data, cache: "MISS" });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const requestHost = request.headers.get("host")?.split(":", 1)[0];
    const isLocalRequest =
      env.GEO_PREVIEW === "true" ||
      requestHost === "127.0.0.1" ||
      requestHost === "localhost";

    if (
      url.protocol !== "https:" &&
      !isLocalRequest
    ) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }

    if (request.method === "GET" && url.pathname === "/og-image.png") {
      return ogImage();
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg")
    ) {
      return favicon();
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "fal-image-generation" });
    }

    if (request.method === "GET" && url.pathname === "/") {
      if (env.GEO_PREVIEW === "true") {
        return renderPage(request, "local-preview", env.WEB_ANALYTICS_TOKEN);
      }
      if (!env.GENERATION_SIGNING_KEY) {
        return json({ error: "Generation protection unavailable" }, 503);
      }
      return renderPage(
        request,
        await createGenerationToken(request, env.GENERATION_SIGNING_KEY),
        env.WEB_ANALYTICS_TOKEN,
      );
    }

    if (request.method === "GET" && url.pathname === "/geo-image-data") {
      try {
        return await generateGeoImage(request, env);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("fal.ai geo generation error", error.status, error.requestId);
          return json(
            { error: "Geo-aware image generation failed", request_id: error.requestId || undefined },
            error.status >= 400 && error.status < 600 ? error.status : 502,
          );
        }
        console.error("Unexpected geo generation error", error);
        return json({ error: "Geo-aware image generation failed" }, 502);
      }
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
