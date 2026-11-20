import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { OrbitStore, ORBIT_PRESETS } from "../../lib/orbit-store.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(__dirname, "index.html");
const store = new OrbitStore();

const PORT = parseInt(
  process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || process.env.PORT || "18796",
  10
);
const TOKEN = (
  process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN ||
  process.env.ANTIGRAVITY_SIDECAR_AUTH_TOKEN ||
  process.env.ANTIGRAVITY_SIDECAR_WEB_TOKEN ||
  ""
).trim();

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => {
      buf += c;
      if (buf.length > 2 * 1024 * 1024) reject(new Error("Body too large"));
    });
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function checkAuth(req, url) {
  if (!TOKEN) return true;
  const hdr = req.headers["x-codeium-sidecar-token"] || req.headers["x-sidecar-token"];
  const q = url.searchParams.get("token");
  return hdr === TOKEN || q === TOKEN;
}

let actualPort = PORT;

function getWebUrl() {
  return TOKEN
    ? `http://127.0.0.1:${actualPort}/?token=${encodeURIComponent(TOKEN)}`
    : `http://127.0.0.1:${actualPort}/`;
}

function buildState() {
  return {
    nativeModels: store.listNativeModels(),
    providers: store.listProviders(),
    presets: ORBIT_PRESETS,
    patchStatus: store.getPatchStatus(),
    webUrl: getWebUrl()
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${actualPort}`);
  const pathname = url.pathname;

  if (pathname === "/healthz") {
    sendJson(res, 200, { ok: true, service: "azure-orbit-console" });
    return;
  }

  if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    const html = fs.readFileSync(HTML_PATH, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (pathname.startsWith("/api/")) {
    if (!checkAuth(req, url)) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    try {
      if (req.method === "GET" && pathname === "/api/state") {
        sendJson(res, 200, buildState());
        return;
      }
      if (req.method === "POST" && pathname === "/api/provider") {
        const body = await readBody(req);
        const provider = store.upsertProvider(body);
        sendJson(res, 200, { provider, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/provider/delete") {
        const body = await readBody(req);
        store.deleteProvider(body.id);
        sendJson(res, 200, { ok: true, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/provider/models") {
        const body = await readBody(req);
        const models = await store.fetchProviderModels(body);
        sendJson(res, 200, { models, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/sync-orchestrator") {
        const body = await readBody(req);
        if (body.removeDemos !== false) {
          store.cleanDemoModels();
        }
        const result = await store.importFromOrchestrator(Boolean(body.alsoMountModels));
        sendJson(res, 200, { result, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/native/mount") {
        const body = await readBody(req);
        if (Array.isArray(body.modelNames)) {
          const result = await store.mountBatchModels({
            providerId: body.providerId,
            modelNames: body.modelNames,
            removeDemos: Boolean(body.removeDemos)
          });
          sendJson(res, 200, { result, state: buildState() });
        } else {
          const model = store.mountModelToNativeMenu(body);
          sendJson(res, 200, { model, state: buildState() });
        }
        return;
      }
      if (req.method === "POST" && pathname === "/api/native/update") {
        const body = await readBody(req);
        const model = store.updateNativeModel(body.name, body);
        sendJson(res, 200, { model, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/native/unmount") {
        const body = await readBody(req);
        store.unmountNativeModel(body.name);
        sendJson(res, 200, { ok: true, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/native/clean-demos") {
        const result = store.cleanDemoModels();
        sendJson(res, 200, { result, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/patch/generate-bat") {
        const body = await readBody(req);
        const result = store.createDesktopPatchBat({
          resourcesDir: body.resourcesDir,
          action: body.action || "install",
          pluginRoot: PLUGIN_ROOT
        });
        sendJson(res, 200, { result, state: buildState() });
        return;
      }
      if (req.method === "POST" && pathname === "/api/open-custom-models") {
        const target = store.customModelsPath;
        if (process.platform === "win32" && fs.existsSync(target)) {
          const child = spawn("explorer.exe", [`/select,${target}`], { detached: true, stdio: "ignore" });
          child.unref();
        }
        sendJson(res, 200, { ok: true, path: target });
        return;
      }
      sendJson(res, 404, { error: "API route not found" });
    } catch (err) {
      sendJson(res, 400, { error: err?.message || String(err) });
    }
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  const addr = server.address();
  if (addr && typeof addr === "object") actualPort = addr.port;
  console.log(`[azure-orbit console] listening on http://127.0.0.1:${actualPort}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
