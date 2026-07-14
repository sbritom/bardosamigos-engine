import { getSupabaseClient } from "../../../core/database";

const REQUESTS_ENDPOINT = "/api/radio/requests";
const AUTHORIZED_ROLES = new Set(["admin", "locutor"]);

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

async function getAdminToken() {
  const client = getSupabaseClient();
  if (!client) return "";
  const { data } = await client.auth.getSession();
  return data?.session?.access_token || "";
}

function isAuthorizedRadioUser(user) {
  const role = user?.app_metadata?.role || user?.user_metadata?.role;
  return AUTHORIZED_ROLES.has(role) || user?.app_metadata?.is_admin === true || user?.user_metadata?.is_admin === true;
}

export async function getRadioRequestsAdminAccess() {
  const client = getSupabaseClient();
  if (!client) {
    return { allowed: false, reason: "Supabase nao configurado." };
  }

  const { data, error } = await client.auth.getSession();
  const session = data?.session;

  if (error || !session?.access_token) {
    return { allowed: false, hasSession: false, reason: "Entre para acessar o painel do locutor." };
  }

  const user = session.user;
  const allowed = isAuthorizedRadioUser(user);

  return {
    allowed,
    hasSession: true,
    reason: allowed ? "" : "Acesso nao autorizado para este usuario.",
    user,
  };
}

export async function signInRadioRequestsAdmin({ email, password }) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase nao configurado.");
  }

  const { error } = await client.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || ""),
  });

  if (error) {
    throw new Error("E-mail ou senha invalidos.");
  }

  return getRadioRequestsAdminAccess();
}

export async function signOutRadioRequestsAdmin() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
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
  const token = await getAdminToken();
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
  const token = await getAdminToken();
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
  const token = await getAdminToken();
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
