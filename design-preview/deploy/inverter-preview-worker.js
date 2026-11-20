const MAIN_ORIGIN = "https://wattdesk-preview.carlwang.cn";
const SETTINGS_ORIGIN_PATH =
  "/plants/p25/devices/inverter-settings?device=inverter&standalone=1";

function redirectToSettings(request) {
  const target = new URL("/settings", request.url);
  return Response.redirect(target.toString(), 302);
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

function upstreamRequest(request, pathname = null) {
  const url = new URL(request.url);
  const target = new URL(pathname ?? `${url.pathname}${url.search}`, MAIN_ORIGIN);
  return new Request(target, request);
}

function standalonePage(request) {
  return fetch(upstreamRequest(request, SETTINGS_ORIGIN_PATH));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") return redirectToSettings(request);
    if (url.pathname === "/settings") return standalonePage(request);

    if (
      url.pathname.startsWith("/src/") ||
      url.pathname.startsWith("/home-assets/")
    ) {
      return fetch(upstreamRequest(request));
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=0, must-revalidate"
        }
      });
    }

    return notFound();
  }
};
