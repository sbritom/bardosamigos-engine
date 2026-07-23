import {
  ADMIN_ROLES,
  getAdminAccess,
  getAdminAccessToken,
  signInAdminWithUsername,
  signOutAdmin,
} from "../../../core/auth/adminAuthService";

const REQUESTS_ENDPOINT = "/api/radio/requests";
const RADIO_ADMIN_ROLES = [ADMIN_ROLES.ADMIN, ADMIN_ROLES.LOCUTOR];

function normalizeRequest(row = {}) {
  return {
    id: row.id,
    songAndArtist: row.song_and_artist || row.songAndArtist || "",
    message: row.message || "",
    status: row.status || "pending",
    source: row.source || "",
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

export async function submitRadioMusicRequest({ songAndArtist, message }) {
  const response = await fetch(REQUESTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ songAndArtist, message }),
  });

  return parseResponse(response);
}

export async function listRadioMusicRequests({ status } = {}) {
  const token = await getAdminAccessToken();
  if (!token) {
    throw new Error("Entre com uma conta administradora para ver os pedidos.");
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
