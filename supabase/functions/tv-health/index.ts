import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const HEALTH_TOKEN_KEY = "tv-health-token";
const REQUEST_TIMEOUT_MS = 6500;
const MAX_CONCURRENCY = 6;

const PROVIDER_HOSTS: Record<string, Set<string>> = {
  "embed-canais-tv": new Set(["embedcanaisdetv.xyz"]),
  "youtube-official": new Set(["www.youtube-nocookie.com"]),
  "hls-official": new Set([
    "6e52fb8b.wurl.com",
    "playout175.livextend.cloud",
    "globallive.tdm.com.mo",
    "stream.tvm.co.mz",
    "porbrics.mediacdn.ru",
    "media-tyo.hls.nhkworld.jp",
    "amdlive-ch01-g-ctnd-com.akamaized.net",
    "english-livetx.cgtn.com",
    "live.france24.com",
    "mblesmain01.telesur.ultrabase.net",
    "mblenmain01.telesur.ultrabase.net",
  ]),
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function adminKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (parsed?.default) return String(parsed.default);
    } catch {
      // fallback para a chave legada durante a transicao.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

async function authorized(req: Request, admin: ReturnType<typeof createClient>) {
  const token = req.headers.get("x-tv-health-token") || "";
  if (!token) return false;

  const { data, error } = await admin
    .from("tv_health_settings")
    .select("value_hash")
    .eq("key", HEALTH_TOKEN_KEY)
    .maybeSingle();

  if (error || !data?.value_hash) return false;
  const candidate = await sha256Hex(token);
  return constantTimeEqual(candidate, String(data.value_hash));
}

function validateTarget(provider: string, input: string) {
  let parsed: URL;
  try {
    parsed = new URL(String(input || ""));
  } catch {
    return { ok: false, reason: "invalid-url", url: null as URL | null };
  }

  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return { ok: false, reason: "unsafe-url", url: parsed };
  }

  const allowed = PROVIDER_HOSTS[provider];
  if (!allowed?.has(parsed.hostname.toLowerCase())) {
    return { ok: false, reason: "host-not-approved", url: parsed };
  }

  if (provider === "hls-official" && !parsed.pathname.toLowerCase().endsWith(".m3u8")) {
    return { ok: false, reason: "invalid-hls-path", url: parsed };
  }

  return { ok: true, reason: "", url: parsed };
}

type Channel = {
  id: string;
  name: string | null;
  provider: string;
  embed_url: string | null;
  enabled: boolean;
};

type ProbeResult = {
  channel_id: string;
  provider: string;
  status: "unknown" | "healthy" | "degraded" | "down";
  http_status: number | null;
  latency_ms: number | null;
  manifest_ok: boolean | null;
  final_url: string | null;
  message: string | null;
  checked_at: string;
  updated_at: string;
};

async function probeChannel(channel: Channel): Promise<ProbeResult> {
  const checkedAt = new Date().toISOString();
  const base: ProbeResult = {
    channel_id: channel.id,
    provider: channel.provider,
    status: "unknown",
    http_status: null,
    latency_ms: null,
    manifest_ok: null,
    final_url: null,
    message: null,
    checked_at: checkedAt,
    updated_at: checkedAt,
  };

  const target = validateTarget(channel.provider, channel.embed_url || "");
  if (!target.ok || !target.url) {
    return {
      ...base,
      status: "degraded",
      message: target.reason,
      final_url: target.url?.toString() || null,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(target.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: channel.provider === "hls-official"
          ? "application/vnd.apple.mpegurl, application/x-mpegURL, text/plain;q=0.9, */*;q=0.8"
          : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "IMORTAL0800-TV-Health/1.0",
      },
    });

    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    let manifestOk: boolean | null = null;

    if (channel.provider === "hls-official") {
      const text = await response.text();
      manifestOk = response.ok && text.includes("#EXTM3U");
    } else {
      try {
        await response.body?.cancel();
      } catch {
        // O status HTTP ja e suficiente para embeds.
      }
    }

    let status: ProbeResult["status"] = "down";
    if (response.ok && (channel.provider !== "hls-official" || manifestOk)) {
      status = "healthy";
    } else if ([401, 403, 405, 429].includes(response.status)) {
      status = "degraded";
    }

    return {
      ...base,
      status,
      http_status: response.status,
      latency_ms: latencyMs,
      manifest_ok: manifestOk,
      final_url: response.url || target.url.toString(),
      message: status === "healthy"
        ? null
        : channel.provider === "hls-official" && response.ok && !manifestOk
          ? "hls-manifest-invalid"
          : `http-${response.status}`,
    };
  } catch (error) {
    return {
      ...base,
      status: "down",
      latency_ms: Math.max(0, Math.round(performance.now() - startedAt)),
      final_url: target.url.toString(),
      message: controller.signal.aborted
        ? "timeout"
        : String(error instanceof Error ? error.message : error).slice(0, 240),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), Math.max(1, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Metodo nao permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = adminKey();
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Supabase admin nao configurado." }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!(await authorized(req, admin))) {
    return json({ ok: false, error: "Acesso negado." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const scope = ["all", "active", "hls"].includes(String(body?.scope))
    ? String(body.scope)
    : "all";

  let query = admin
    .from("tv_channels")
    .select("id,name,provider,embed_url,enabled")
    .order("provider")
    .order("name");

  if (scope === "active") query = query.eq("enabled", true);
  if (scope === "hls") query = query.eq("provider", "hls-official");
  if (scope === "all") query = query.or("enabled.eq.true,provider.eq.hls-official");

  const { data, error } = await query;
  if (error) {
    return json({ ok: false, error: "Nao foi possivel carregar os canais.", detail: error.message }, 500);
  }

  const channels = (data || []) as Channel[];
  const results = await mapConcurrent(channels, MAX_CONCURRENCY, probeChannel);

  if (results.length) {
    const { error: upsertError } = await admin
      .from("tv_channel_health")
      .upsert(results, { onConflict: "channel_id" });

    if (upsertError) {
      return json({ ok: false, error: "Nao foi possivel salvar o health-check.", detail: upsertError.message }, 500);
    }
  }

  const summary = results.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { healthy: 0, degraded: 0, down: 0, unknown: 0 },
  );

  return json({
    ok: true,
    data: {
      scope,
      checked: results.length,
      summary,
      checkedAt: new Date().toISOString(),
    },
  });
});
