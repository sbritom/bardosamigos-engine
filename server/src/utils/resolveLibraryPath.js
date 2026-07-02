import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DESKTOP_PT_BR = "\u00c1rea de Trabalho";
const AUDIO_LIBRARY_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isWslRuntime() {
  return process.platform === "linux" && (
    Boolean(process.env.WSL_DISTRO_NAME) ||
    fs.existsSync("/mnt/c/Users")
  );
}

function windowsPathToWsl(windowsPath) {
  const normalized = String(windowsPath || "").replaceAll("\\", "/");
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/);
  if (!match) return normalized;
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function wslPathToWindows(wslPath) {
  const match = String(wslPath || "").match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
  if (!match) return wslPath;
  return `${match[1].toUpperCase()}:\\${match[2].replaceAll("/", "\\")}`;
}

function detectWindowsUsers(env) {
  const users = [
    env.USERNAME,
    env.USER,
    path.basename(os.homedir()),
    env.USERPROFILE ? path.basename(env.USERPROFILE) : "",
    env.OneDrive ? path.basename(path.dirname(env.OneDrive)) : "",
    env.ONEDRIVE ? path.basename(path.dirname(env.ONEDRIVE)) : "",
  ];

  ["C:\\Users", "/mnt/c/Users"].forEach((usersRoot) => {
    try {
      fs.readdirSync(usersRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .forEach((entry) => users.push(entry.name));
    } catch {
      // Optional platform path.
    }
  });

  return unique(users);
}

function hasAudioFile(folder) {
  try {
    return fs.readdirSync(folder, { withFileTypes: true }).some((entry) => {
      const fullPath = path.join(folder, entry.name);
      if (entry.isDirectory()) return hasAudioFile(fullPath);
      return AUDIO_LIBRARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
    });
  } catch {
    return false;
  }
}

function buildUserCandidates(userName) {
  const windowsCandidates = [
    `C:\\Users\\${userName}\\OneDrive\\${DESKTOP_PT_BR}\\BarStreaming\\music`,
    `C:\\Users\\${userName}\\Desktop\\BarStreaming\\music`,
  ];
  const wslCandidates = [
    `/mnt/c/Users/${userName}/OneDrive/${DESKTOP_PT_BR}/BarStreaming/music`,
    `/mnt/c/Users/${userName}/Desktop/BarStreaming/music`,
  ];

  return isWslRuntime()
    ? [...wslCandidates, ...windowsCandidates]
    : [...windowsCandidates, ...wslCandidates];
}

function normalizeCandidateForRuntime(candidate) {
  if (!candidate) return null;
  if (isWslRuntime() && /^[A-Za-z]:[\\/]/.test(candidate)) {
    return windowsPathToWsl(candidate);
  }
  if (process.platform === "win32" && candidate.startsWith("/mnt/")) {
    return wslPathToWindows(candidate);
  }
  return candidate;
}

export function resolveLibraryPath(env = process.env, cwd = process.cwd()) {
  const explicit = env.RADIO_LIBRARY_PATH;
  const userCandidates = detectWindowsUsers(env).flatMap(buildUserCandidates);
  const fallbackCandidates = [
    path.resolve(cwd, "music"),
    path.resolve(cwd, "server", "music"),
  ];

  const candidates = unique([
    explicit,
    ...userCandidates,
    ...fallbackCandidates,
  ].map(normalizeCandidateForRuntime));

  const externalCandidates = candidates.slice(0, Math.max(1, candidates.length - fallbackCandidates.length));
  const externalPath = externalCandidates.find((candidate) => fs.existsSync(candidate) && hasAudioFile(candidate));
  const detectedPath = externalPath || candidates.find((candidate) => fs.existsSync(candidate));
  const isExternalBarStreamingPath = detectedPath && /BarStreaming[\\/]music$/i.test(detectedPath);
  const displayPath = detectedPath && process.platform === "win32" && isExternalBarStreamingPath
    ? windowsPathToWsl(detectedPath)
    : detectedPath;

  return {
    found: Boolean(detectedPath),
    path: displayPath || null,
    fsPath: detectedPath ? path.resolve(detectedPath) : null,
    candidates,
    hasAudio: Boolean(detectedPath && hasAudioFile(detectedPath)),
  };
}

export { DESKTOP_PT_BR, windowsPathToWsl, wslPathToWindows };
