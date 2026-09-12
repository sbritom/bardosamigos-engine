import { getAdminAccessToken } from "../../../core/auth/adminAuthService";
import { getSupabaseClient } from "../../../core/database";
import "../radioEvoxRanking.css";

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

function toPercent(value) {
  return Math.min(100, toNonNegativeInteger(value));
}

function normalizeHighlight(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    title: cleanText(source.title, 120),
    artist: cleanText(source.artist, 120),
    count: toNonNegativeInteger(source.count),
  };
}

function normalizeRankingEntry(entry = {}, index = 0) {
  const title = cleanText(entry.title, 120);
  const artist = cleanText(entry.artist, 120);
  const likes = toNonNegativeInteger(entry.likes ?? entry.requests ?? entry.count);
  const dislikes = toNonNegativeInteger(entry.dislikes);
  const approval = toPercent(entry.approval ?? (likes + dislikes ? Math.round((likes / (likes + dislikes)) * 100) : 0));

  return {
    position: index + 1,
    title,
    artist,
    likes,
    dislikes,
    approval,
    label: title,
    count: likes,
  };
}

function normalizeRankingRow(row = {}) {
  const ranking = (Array.isArray(row.ranking) ? row.ranking : [])
    .slice(0, 5)
    .map(normalizeRankingEntry)
    .filter((entry) => entry.title);

  const legacyMostLiked = {
    title: cleanText(row.highlight_song || row.highlightSong, 120),
    artist: cleanText(row.highlight_artist || row.highlightArtist, 120),
    count: 0,
  };

  const data = {
    id: row.id || EVOX_RANKING_ID,
    periodLabel: cleanText(row.period_label || row.periodLabel || "Ranking atual", 60),
    songsEvaluated: toNonNegativeInteger(row.songs_evaluated ?? row.songsEvaluated ?? row.unique_songs ?? row.uniqueSongs),
    likesCount: toNonNegativeInteger(row.likes_count ?? row.likesCount),
    approvalPercent: toPercent(row.approval_percent ?? row.approvalPercent),
    totalReactions: toNonNegativeInteger(row.total_reactions ?? row.totalReactions ?? row.total_requests ?? row.totalRequests),
    mostLiked: Object.keys(row.most_liked || row.mostLiked || {}).length
      ? normalizeHighlight(row.most_liked || row.mostLiked)
      : legacyMostLiked,
    mostFavorited: normalizeHighlight(row.most_favorited || row.mostFavorited),
    mostRejected: normalizeHighlight(row.most_rejected || row.mostRejected),
    ranking,
    updatedAt: row.updated_at || row.updatedAt || null,
  };

  return {
    ...data,
    hasManualData: Boolean(
      data.ranking.length
      || data.songsEvaluated
      || data.likesCount
      || data.approvalPercent
      || data.totalReactions
      || data.mostLiked.title
      || data.mostFavorited.title
      || data.mostRejected.title,
    ),
  };
}

const EVOX_SELECT = [
  "id",
  "period_label",
  "total_requests",
  "unique_songs",
  "highlight_song",
  "highlight_artist",
  "songs_evaluated",
  "likes_count",
  "approval_percent",
  "total_reactions",
  "most_liked",
  "most_favorited",
  "most_rejected",
  "ranking",
  "updated_at",
].join(",");

async function readRankingRow() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(EVOX_RANKING_TABLE)
    .select(EVOX_SELECT)
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
    .map(({ title, artist, likes, dislikes, approval }) => ({
      title,
      artist,
      likes,
      dislikes,
      approval,
    }));

  const { data: userResult } = await supabase.auth.getUser();
  const updatedBy = userResult?.user?.id || null;
  const mostLiked = normalizeHighlight(input.mostLiked);
  const mostFavorited = normalizeHighlight(input.mostFavorited);
  const mostRejected = normalizeHighlight(input.mostRejected);
  const songsEvaluated = toNonNegativeInteger(input.songsEvaluated);
  const totalReactions = toNonNegativeInteger(input.totalReactions);

  const payload = {
    period_label: cleanText(input.periodLabel || "Ranking atual", 60),
    songs_evaluated: songsEvaluated,
    likes_count: toNonNegativeInteger(input.likesCount),
    approval_percent: toPercent(input.approvalPercent),
    total_reactions: totalReactions,
    most_liked: mostLiked,
    most_favorited: mostFavorited,
    most_rejected: mostRejected,
    ranking,
    total_requests: totalReactions,
    unique_songs: songsEvaluated,
    highlight_song: mostLiked.title,
    highlight_artist: mostLiked.artist,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  const { data, error } = await supabase
    .from(EVOX_RANKING_TABLE)
    .update(payload)
    .eq("id", EVOX_RANKING_ID)
    .select(EVOX_SELECT)
    .single();

  if (error) throw error;
  return normalizeRankingRow(data);
}
