import { handleRadioRoute } from "../../routes/radioRoutes.js";
import { handleRouteError } from "../utils/errorHandler.js";
import { handleOptions, notFound } from "../utils/http.js";

export async function routeRequest(request, response) {
  if (request.method === "OPTIONS") {
    handleOptions(response);
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method !== "GET") {
      notFound(response);
      return;
    }

    const handled = await handleRadioRoute(request, response, url);

    if (!handled) {
      notFound(response);
    }
  } catch (error) {
    handleRouteError(response, error);
  }
}
