import { RadioEngine } from "../src/services/RadioEngine.js";
import { sendJson } from "../src/utils/http.js";

function ok(response, data) {
  sendJson(response, 200, { ok: true, data });
}

export async function handleRadioRoute(request, response, url) {
  const path = url.pathname;

  if (path === "/api/radio/status") return ok(response, RadioEngine.getStatus());
  if (path === "/api/radio/nowplaying") return ok(response, RadioEngine.getNowPlaying());
  if (path === "/api/radio/history") return ok(response, RadioEngine.getHistory());
  if (path === "/api/radio/playlists") return ok(response, RadioEngine.listPlaylists());
  if (path === "/api/radio/categories") return ok(response, RadioEngine.listCategories());
  if (path === "/api/radio/library") {
    return ok(response, RadioEngine.listLibrary({
      query: url.searchParams.get("query") || "",
      category: url.searchParams.get("category") || "all",
    }));
  }
  if (path === "/api/radio/config") return ok(response, RadioEngine.getConfig());
  if (path === "/api/radio/listeners") return ok(response, RadioEngine.listListeners());
  if (path === "/api/radio/stats") return ok(response, RadioEngine.getStats());
  if (path === "/api/radio/logs") return ok(response, RadioEngine.listLogs());
  if (path === "/api/radio/schedule") return ok(response, RadioEngine.listSchedule());

  return false;
}
