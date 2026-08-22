import { defineConfig, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const API_PORT = Number(process.env.PORT || 8787);
/* npm always runs scripts with the package root as cwd, so this is stable. */
const data = (name: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), "data", name), "utf8"));

/** Catalogue served straight from data/*.json, used only when the API process
 *  is not answering. The whole point: a refused port degrades the demo, it does
 *  not break it. Read endpoints are covered; anything that writes or calls a
 *  model says plainly that the API is offline. */
function offline(req: IncomingMessage, res: ServerResponse) {
  const url = (req.url || "").split("?")[0];
  const send = (code: number, body: unknown) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  try {
    const howTo = data("how-to-apply.json");
    const schemes = () =>
      (data("schemes.json") as any[]).map((s) => ({
        ...s,
        how_to: howTo[s.id] ?? howTo._default ?? null,
        verified: !!s.verified,
      }));

    if (url === "/api/data")
      return send(200, { schemes: schemes(), attributes: data("attributes.json") });
    if (url === "/api/schemes") return send(200, schemes());
    if (url === "/api/attributes") return send(200, data("attributes.json"));
    if (url === "/api/personas") return send(200, data("personas.json"));
    if (url === "/api/health")
      return send(200, {
        ok: true,
        offline: true,
        storage: "json",
        mock: { extract: true, asr: true },
        schemes: schemes().length,
        warning: `The API server on :${API_PORT} is not running. Serving the catalogue from data/*.json. Start it with: npm run dev:api`,
      });

    return send(503, {
      error: `The API server on :${API_PORT} is not running, so this action is unavailable. Start it with: npm run dev:api`,
      offline: true,
    });
  } catch (e: any) {
    return send(500, { error: `Offline fallback failed to read data/*.json — ${e.message}` });
  }
}

/* We already print one clear line when the API is down and then serve the
 * fallback, so Vite's per-request proxy stack traces are pure noise. Nothing
 * else is filtered. */
const logger = createLogger();
const quiet = (fn: (m: string, o?: any) => void) => (msg: string, opts?: any) => {
  if (/http proxy error|ECONNREFUSED|afterConnect|TCPConnectWrap/.test(msg)) return;
  fn(msg, opts);
};
logger.error = quiet(logger.error.bind(logger));
logger.warn = quiet(logger.warn.bind(logger));

export default defineConfig({
  plugins: [react()],
  customLogger: logger,
  server: {
    port: 5173,
    proxy: {
      "/api": {
        /* 127.0.0.1, not "localhost": Node resolves localhost to both ::1 and
         * 127.0.0.1 and fails the whole AggregateError if either is refused. */
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
        configure: (proxy) => {
          let warned = false;
          proxy.on("error", (err: any, req, res) => {
            if (!warned) {
              warned = true;
              console.log(
                `\n  ! API on :${API_PORT} is not answering (${err.code || err.message}).` +
                `\n    Serving the scheme catalogue from data/*.json so the app still runs.` +
                `\n    For the full stack, run the API in a second terminal:  npm run dev:api\n`
              );
            }
            if (res && "writeHead" in res && !res.headersSent) offline(req, res as ServerResponse);
          });
        },
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
