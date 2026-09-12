import { getAdminAccessToken } from "../../../core/auth/adminAuthService";
import { getSupabaseClient } from "../../../core/database";

const EVOX_RANKING_TABLE = "radio_evox_ranking";
const EVOX_RANKING_ID = "imortal0800";

function cleanText(value, maxLength = 120) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalizeRankingEntry(entry = {}, index = 0) {
  const title = cleanText(entry.title, 120);
  const artist = cleanText(entry.artist, 120);
  const requests = toNonNegativeInteger(entry.requests ?? entry.count);

  return {
    position: index + 1,
    title,
    artist,
    requests,
    label: [title, artist].filter(Boolean).join(" — "),
    count: requests,
  };
}

function normalizeRankingRow(row = {}) {
  const ranking = (Array.isArray(row.ranking) ? row.ranking : [])
    .slice(0, 5)
    .map(normalizeRankingEntry)
    .filter((entry) => entry.title);

  const data = {
    id: row.id || EVOX_RANKING_ID,
    periodLabel: cleanText(row.period_label || row.periodLabel || "Últimos 7 dias", 60),
    totalRequests: toNonNegativeInteger(row.total_requests ?? row.totalRequests),
    uniqueSongs: toNonNegativeInteger(row.unique_songs ?? row.uniqueSongs),
    highlightSong: cleanText(row.highlight_song || row.highlightSong, 120),
    highlightArtist: cleanText(row.highlight_artist || row.highlightArtist, 120),
    ranking,
    updatedAt: row.updated_at || row.updatedAt || null,
  };

  return {
    ...data,
    hasManualData: Boolean(
      data.ranking.length
      || data.totalRequests
      || data.uniqueSongs
      || data.highlightSong
      || data.highlightArtist,
    ),
  };
}

async function readRankingRow() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(EVOX_RANKING_TABLE)
    .select("id,period_label,total_requests,unique_songs,highlight_song,highlight_artist,ranking,updated_at")
    .eq("id", EVOX_RANKING_ID)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeRankingRow(data) : null;
}

export async function getRadioEvoxRankingPublic() {
  try {
    return await readRankingRow();
  } catch {
    return null;
  }
}

export async function getRadioEvoxRankingAdmin() {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta autorizada para gerenciar o Ranking EVOX.");
  }

  const ranking = await readRankingRow();
  return ranking || normalizeRankingRow({ id: EVOX_RANKING_ID });
}

export async function saveRadioEvoxRankingAdmin(input = {}) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta autorizada para salvar o Ranking EVOX.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Banco de dados indisponível.");
  }

  const ranking = (Array.isArray(input.ranking) ? input.ranking : [])
    .slice(0, 5)
    .map((entry, index) => normalizeRankingEntry(entry, index))
    .filter((entry) => entry.title)
    .map(({ title, artist, requests }) => ({ title, artist, requests }));

  const { data: userResult } = await supabase.auth.getUser();
  const updatedBy = userResult?.user?.id || null;
  const payload = {
    period_label: cleanText(input.periodLabel || "Últimos 7 dias", 60),
    total_requests: toNonNegativeInteger(input.totalRequests),
    unique_songs: toNonNegativeInteger(input.uniqueSongs),
    highlight_song: cleanText(input.highlightSong, 120),
    highlight_artist: cleanText(input.highlightArtist, 120),
    ranking,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const { data, error } = await supabase
    .from(EVOX_RANKING_TABLE)
    .update(payload)
    .eq("id", EVOX_RANKING_ID)
    .select("id,period_label,total_requests,unique_songs,highlight_song,highlight_artist,ranking,updated_at")
    .single();

  if (error) throw error;
  return normalizeRankingRow(data);
}
