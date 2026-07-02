import { sendJson } from "./http.js";

export function handleRouteError(response, error) {
  console.error("[Bar Radio Engine API]", error);
  sendJson(response, 500, {
    ok: false,
    error: "Internal radio API error.",
  });
}
