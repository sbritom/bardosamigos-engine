import {
  ADMIN_ROLES,
  getAdminAccess,
  getAdminAccessToken,
  signInAdminWithUsername,
  signOutAdmin,
} from "../../../core/auth/adminAuthService";
import { getSupabaseClient } from "../../../core/database";

const REQUESTS_ENDPOINT = "/api/radio/requests";
const RADIO_ADMIN_ROLES = [ADMIN_ROLES.ADMIN, ADMIN_ROLES.LOCUTOR];

function normalizeRequest(row = {}) {
  return {
    id: row.id,
    songAndArtist: row.song_and_artist || row.songAndArtist || "",
    message: row.message || "",
    status: row.status || "pending",
    source: row.source || "",
    requesterProfileId: row.requester_profile_id || row.requesterProfileId || "",
    requesterName: row.requester_name || row.requesterName || "",
    requesterKind: row.requester_kind || row.requesterKind || "guest",
    adminNote: row.admin_note || row.adminNote || "",
    handledBy: row.handled_by || row.handledBy || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

export async function getRadioRequestsAdminAccess() {
  return getAdminAccess({
    allowedRoles: RADIO_ADMIN_ROLES,
    allowLegacyUserMetadata: false,
    noSessionReason: "Entre para acessar o painel do locutor.",
  });
}

export async function signInRadioRequestsAdmin({ username, password }) {
  return signInAdminWithUsername({
    username,
    password,
    allowedRoles: RADIO_ADMIN_ROLES,
    allowLegacyUserMetadata: false,
  });
}

export async function signOutRadioRequestsAdmin() {
  await signOutAdmin();
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error || `Radio requests API ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

async function getOptionalUserAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return "";

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return "";

  return data?.session?.access_token || "";
}

export async function submitRadioMusicRequest({
  songAndArtist,
  message,
  requesterName = "",
  providerTrackFile = "",
}) {
  const token = await getOptionalUserAccessToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ songAndArtist, message, requesterName, providerTrackFile }),
  });

  return parseResponse(response);
}

export async function getRadioPublicContent() {
  const response = await fetch(`${REQUESTS_ENDPOINT}?section=public-content`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function searchRadioProviderCatalog(query) {
  const normalized = String(query || "").trim();
  if (normalized.length < 2) return [];

  const response = await fetch(
    `${REQUESTS_ENDPOINT}?section=provider-catalog&q=${encodeURIComponent(normalized)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const data = await parseResponse(response);
  return Array.isArray(data) ? data : [];
}

export async function listRadioProgramsAdmin() {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para gerenciar programas.");

  const response = await fetch(`${REQUESTS_ENDPOINT}?section=programs`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await parseResponse(response);
  return Array.isArray(data) ? data : [];
}

export async function createRadioProgram(program) {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para criar programas.");

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resource: "program", ...program }),
  });

  return parseResponse(response);
}

export async function updateRadioProgram(program) {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para atualizar programas.");

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resource: "program", ...program }),
  });

  return parseResponse(response);
}

export async function deleteRadioProgram(id) {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para remover programas.");

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resource: "program", id }),
  });

  return parseResponse(response);
}

export async function listRadioScheduleAdmin() {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para gerenciar a grade.");

  const response = await fetch(`${REQUESTS_ENDPOINT}?section=schedule`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await parseResponse(response);
  return Array.isArray(data) ? data : [];
}

export async function updateRadioScheduleSlot(slot) {
  const token = await getAdminAccessToken();
  if (!token) throw new Error("Entre com uma conta autorizada para atualizar a grade.");

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resource: "schedule", ...slot }),
  });

  return parseResponse(response);
}

export async function listRadioMusicRequests({ status } = {}) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta autorizada para ver os pedidos.");
  }

  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${REQUESTS_ENDPOINT}${params}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await parseResponse(response);
  return Array.isArray(data) ? data.map(normalizeRequest) : [];
}

export async function getRadioLocutorStatus() {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta autorizada para ver o status da rádio.");
  }

  const response = await fetch(`${REQUESTS_ENDPOINT}?section=locutor-status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function updateRadioLocutorStatus(isLive) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta autorizada para alterar o status da rádio.");
  }

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resource: "locutor-status",
      isLive: Boolean(isLive),
    }),
  });

  return parseResponse(response);
}

export async function updateRadioMusicRequest({ id, status, adminNote = "", handledBy = "" }) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta administradora para atualizar pedidos.");
  }

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, status, adminNote, handledBy }),
  });

  return normalizeRequest(await parseResponse(response));
}

export async function deleteRadioMusicRequest(id) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta administradora para remover pedidos.");
  }

  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id }),
  });

  return parseResponse(response);
}
