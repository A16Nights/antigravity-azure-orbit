import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export const ORBIT_PRESETS = [
  {
    preset: "deepseek",
    name: "DeepSeek",
    tag: "官方",
    protocol: "openai",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"]
  },
  {
    preset: "local-gateway",
    name: "本地聚合网关",
    tag: "本地聚合",
    protocol: "openai",
    baseUrl: "http://127.0.0.1:18899/v1",
    models: []
  },
  {
    preset: "openai-compat",
    name: "OpenAI 兼容渠道",
    tag: "自定义",
    protocol: "openai",
    baseUrl: "https://api.openai.com/v1",
    models: []
  },
  {
    preset: "kimi",
    name: "Kimi / Moonshot",
    tag: "自定义",
    protocol: "openai",
    baseUrl: "https://api.moonshot.cn/v1",
    models: ["moonshot-v1-8k", "moonshot-v1-32k"]
  },
  {
    preset: "openrouter",
    name: "OpenRouter",
    tag: "自定义",
    protocol: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    models: []
  },
  {
    preset: "anthropic",
    name: "Anthropic 兼容",
    tag: "自定义",
    protocol: "anthropic",
    baseUrl: "https://api.anthropic.com",
    models: ["claude-sonnet-4-20250514"]
  },
  {
    preset: "ollama",
    name: "Ollama 本地",
    tag: "本地",
    protocol: "openai",
    baseUrl: "http://127.0.0.1:11434/v1",
    models: []
  }
];

const DEMO_MODEL_NAMES = new Set([
  "models/gpt-4o",
  "models/claude-3-5-sonnet",
  "models/llama3"
]);

export const DEFAULT_CONTEXT_WINDOW = 1048576; // 1M
export const DEFAULT_MAX_OUTPUT_TOKENS = 131072; // 128K

export function extractModelMetaFromApiItem(item) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || item.name || "").trim();
  if (!id) return null;

  const rawCtx = Number(
    item.context_window ??
    item.contextWindow ??
    item.context_length ??
    item.inputTokenLimit ??
    item.max_input_tokens ??
    0
  );
  const rawOut = Number(
    item.max_output_tokens ??
    item.maxOutputTokens ??
    item.max_completion_tokens ??
    item.max_tokens ??
    item.outputTokenLimit ??
    item.output_tokens ??
    0
  );

  let supportsThinking;
  if (item.reasoning !== undefined) supportsThinking = Boolean(item.reasoning);
  else if (item.thinking !== undefined) supportsThinking = Boolean(item.thinking);
  else if (item.supports_reasoning !== undefined) supportsThinking = Boolean(item.supports_reasoning);

  let supportsVision;
  if (Array.isArray(item.input)) {
    supportsVision = item.input.includes("image") || Boolean(item.vision);
  } else if (item.vision !== undefined) {
    supportsVision = Boolean(item.vision);
  } else if (item.supports_vision !== undefined) {
    supportsVision = Boolean(item.supports_vision);
  }

  const meta = {};
  if (Number.isFinite(rawCtx) && rawCtx >= 4096) meta.contextWindow = Math.round(rawCtx);
  if (Number.isFinite(rawOut) && rawOut >= 512) meta.maxOutputTokens = Math.round(rawOut);
  if (supportsThinking !== undefined) meta.supportsThinking = supportsThinking;
  if (supportsVision !== undefined) meta.supportsVision = supportsVision;
  return meta;
}

export function resolveModelDefaults(externalModelName, providerMeta = null) {
  const ext = String(externalModelName || "").toLowerCase();
  const contextWindow =
    (providerMeta?.contextWindow && providerMeta.contextWindow >= 4096)
      ? providerMeta.contextWindow
      : DEFAULT_CONTEXT_WINDOW;

  let fallbackOut = DEFAULT_MAX_OUTPUT_TOKENS;
  if (/deepseek-v4/i.test(ext)) {
    fallbackOut = 65536; // 64K for deepseek-v4 series when upstream omits max_output_tokens
  }
  let maxOutputTokens =
    (providerMeta?.maxOutputTokens && providerMeta.maxOutputTokens >= 512)
      ? providerMeta.maxOutputTokens
      : fallbackOut;

  if (maxOutputTokens >= contextWindow) {
    maxOutputTokens = Math.max(4096, Math.floor(contextWindow / 4));
  }

  const supportsThinking =
    providerMeta?.supportsThinking !== undefined
      ? Boolean(providerMeta.supportsThinking)
      : true;

  const supportsVision =
    providerMeta?.supportsVision !== undefined
      ? Boolean(providerMeta.supportsVision)
      : true;

  return {
    contextWindow,
    maxOutputTokens,
    supportsThinking,
    supportsVision
  };
}

export function maskApiKey(key) {
  const s = typeof key === "string" ? key.trim() : "";
  if (!s) return "";
  if (s.startsWith("enc:") || s.startsWith("local-gcm:")) {
    return "🔒 已由系统加密保护";
  }
  if (s.length > 10) {
    return `${s.slice(0, 4)}****${s.slice(-4)}`;
  }
  return "****";
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function atomicWriteJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2, 8)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

export function normalizeCompletionUrl(baseUrl, protocol = "openai") {
  const clean = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!clean) throw new Error("Base URL 不能为空");
  if (protocol === "anthropic") {
    if (clean.endsWith("/messages")) return clean;
    if (/\/v\d+$/i.test(clean)) return `${clean}/messages`;
    return `${clean}/v1/messages`;
  }
  if (clean.endsWith("/chat/completions")) return clean;
  if (clean.endsWith("/models")) {
    return clean.slice(0, -"/models".length) + "/chat/completions";
  }
  if (/\/(v\d+(?:beta\d*)?|compatible-mode\/v\d+|api\/v\d+)$/i.test(clean)) {
    return `${clean}/chat/completions`;
  }
  return `${clean}/v1/chat/completions`;
}

export function normalizeModelsUrl(baseUrl, protocol = "openai") {
  const clean = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!clean) throw new Error("Base URL 不能为空");
  if (clean.endsWith("/models")) return clean;
  if (clean.endsWith("/chat/completions")) {
    return clean.slice(0, -"/chat/completions".length) + "/models";
  }
  if (clean.endsWith("/messages")) {
    return clean.slice(0, -"/messages".length) + "/models";
  }
  if (protocol === "anthropic") {
    if (/\/v\d+$/i.test(clean)) return `${clean}/models`;
    return `${clean}/v1/models`;
  }
  if (/\/(v\d+(?:beta\d*)?|compatible-mode\/v\d+|api\/v\d+)$/i.test(clean)) {
    return `${clean}/models`;
  }
  return `${clean}/v1/models`;
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `p-${crypto.randomBytes(2).toString("hex")}`;
}

export class OrbitStore {
  constructor(opts = {}) {
    this.dataDir =
      opts.dataDir ||
      process.env.AZURE_ORBIT_DATA_DIR ||
      path.join(os.homedir(), ".gemini", "azure-orbit");
    this.providersPath = path.join(this.dataDir, "providers.json");
    this.antigravityDir =
      opts.antigravityDir ||
      process.env.AZURE_ORBIT_AGY_DIR ||
      path.join(os.homedir(), ".gemini", "antigravity");
    this.customModelsPath =
      opts.customModelsPath ||
      process.env.AZURE_ORBIT_CUSTOM_MODELS_PATH ||
      path.join(this.antigravityDir, "custom_models.json");
    this.identitiesPath = path.join(path.dirname(this.customModelsPath), "custom_model_identities.json");
    this.orchestratorConfigPath =
      opts.orchestratorConfigPath ||
      path.join(os.homedir(), ".gemini", "external-orchestrator", "config.json");
    this.ensureInitialized();
  }

  ensureInitialized() {
    ensureDir(this.dataDir);
    if (!fs.existsSync(this.providersPath)) {
      atomicWriteJson(this.providersPath, {
        version: 1,
        providers: [
          {
            id: "deepseek",
            name: "DeepSeek",
            preset: "deepseek",
            tag: "官方",
            protocol: "openai",
            baseUrl: "https://api.deepseek.com/v1",
            apiKey: "",
            enabled: true,
            models: ["deepseek-chat", "deepseek-reasoner"],
            headers: {}
          }
        ]
      });
    }
  }

  readProvidersRaw() {
    const data = readJsonSafe(this.providersPath, null);
    if (!data || !Array.isArray(data.providers)) {
      return { version: 1, providers: [] };
    }
    return data;
  }

  saveProvidersRaw(data) {
    atomicWriteJson(this.providersPath, data);
  }

  sanitizeProvider(p) {
    const { apiKey, ...rest } = p;
    return {
      ...rest,
      hasApiKey: Boolean(apiKey && String(apiKey).trim()),
      apiKeyMasked: maskApiKey(apiKey)
    };
  }

  listProviders() {
    const raw = this.readProvidersRaw();
    return raw.providers.map((p) => this.sanitizeProvider(p));
  }

  getProviderWithSecret(id) {
    const raw = this.readProvidersRaw();
    return raw.providers.find((p) => p.id === id) || null;
  }

  upsertProvider(input) {
    const name = String(input.name || "").trim();
    const protocol = input.protocol === "anthropic" ? "anthropic" : "openai";
    const baseUrl = String(input.baseUrl || "").trim();
    if (!name) throw new Error("渠道名称不能为空");
    if (!baseUrl) throw new Error("Base URL 不能为空");

    const data = this.readProvidersRaw();
    const idx = input.id ? data.providers.findIndex((p) => p.id === input.id) : -1;
    const existing = idx >= 0 ? data.providers[idx] : null;
    const usedIds = new Set(data.providers.map((p) => p.id));

    let id = existing ? existing.id : (input.id ? String(input.id).trim() : slugify(name));
    if (!existing && usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }

    let apiKey = existing?.apiKey || "";
    if (input.clearApiKey === true) {
      apiKey = "";
    } else if (typeof input.apiKey === "string") {
      const trimmed = input.apiKey.trim();
      if (trimmed && !trimmed.includes("****") && !trimmed.includes("已由系统加密")) {
        apiKey = trimmed;
      }
    }

    let models = existing?.models || [];
    if (Array.isArray(input.models)) {
      models = Array.from(new Set(input.models.map((m) => String(m || "").trim()).filter(Boolean)));
    }

    let headers = existing?.headers || {};
    if (input.headers !== undefined) {
      if (typeof input.headers === "string") {
        headers = input.headers.trim() ? JSON.parse(input.headers.trim()) : {};
      } else if (input.headers && typeof input.headers === "object" && !Array.isArray(input.headers)) {
        headers = input.headers;
      }
    }

    const record = {
      id,
      name,
      preset: String(input.preset ?? existing?.preset ?? "custom"),
      tag: String(input.tag ?? existing?.tag ?? "自定义").trim() || "自定义",
      protocol,
      baseUrl,
      apiKey,
      enabled: input.enabled !== undefined ? Boolean(input.enabled) : (existing ? existing.enabled : true),
      models,
      modelMeta: { ...(existing?.modelMeta || {}), ...(input.modelMeta || {}) },
      headers
    };

    if (idx >= 0) data.providers[idx] = record;
    else data.providers.push(record);
    this.saveProvidersRaw(data);

    // Also sync updated apiUrl / apiKey to any already-mounted native models belonging to this provider
    this._syncProviderToMountedModels(record);
    return this.sanitizeProvider(record);
  }

  deleteProvider(id) {
    const data = this.readProvidersRaw();
    const before = data.providers.length;
    data.providers = data.providers.filter((p) => p.id !== id);
    if (data.providers.length === before) throw new Error(`未找到渠道：${id}`);
    this.saveProvidersRaw(data);
    return { deleted: true, id };
  }

  async importFromOrchestrator(alsoMountModels = false) {
    if (!fs.existsSync(this.orchestratorConfigPath)) {
      throw new Error("未找到苍蓝协奏台配置文件 ~/.gemini/external-orchestrator/config.json");
    }
    const orch = readJsonSafe(this.orchestratorConfigPath, null);
    const srcProviders = Array.isArray(orch?.providers) ? orch.providers : [];
    if (!srcProviders.length) {
      throw new Error("苍蓝协奏台中尚无任何渠道配置");
    }

    const data = this.readProvidersRaw();
    let importedProviders = 0;
    let mountedModels = 0;

    for (const sp of srcProviders) {
      const hasModelsOrKey = Boolean((sp.apiKey && String(sp.apiKey).trim()) || (Array.isArray(sp.models) && sp.models.length > 0));
      if (!hasModelsOrKey && !sp.enabled) continue;

      const idx = data.providers.findIndex((p) => p.id === sp.id);
      const existing = idx >= 0 ? data.providers[idx] : null;
      const mergedModels = Array.from(new Set([...(existing?.models || []), ...(sp.models || [])]));
      const record = {
        id: sp.id,
        name: sp.name || sp.id,
        preset: sp.preset || "custom",
        tag: sp.tag || "协奏台同步",
        protocol: sp.protocol === "anthropic" ? "anthropic" : "openai",
        baseUrl: sp.baseUrl,
        apiKey: (sp.apiKey && String(sp.apiKey).trim()) ? String(sp.apiKey).trim() : (existing?.apiKey || ""),
        enabled: sp.enabled !== undefined ? Boolean(sp.enabled) : true,
        models: mergedModels,
        modelMeta: { ...(existing?.modelMeta || {}) },
        headers: sp.headers && typeof sp.headers === "object" ? sp.headers : (existing?.headers || {})
      };

      // Try fetching live metadata from provider's /v1/models endpoint so contextWindow/maxOutputTokens/vision/thinking are exact
      if (record.enabled && (record.apiKey || /127\.0\.0\.1|localhost/.test(record.baseUrl))) {
        try {
          const fetched = await this.fetchProviderModelsWithMeta(record);
          record.modelMeta = { ...record.modelMeta, ...fetched.metaMap };
        } catch {}
      }

      if (idx >= 0) data.providers[idx] = record;
      else data.providers.push(record);
      importedProviders++;
      this.saveProvidersRaw(data);

      this._syncProviderToMountedModels(record);

      if (alsoMountModels && record.enabled && mergedModels.length > 0) {
        const res = await this.mountBatchModels({
          providerId: record.id,
          modelNames: mergedModels
        });
        mountedModels += res.mountedCount;
      }
    }

    return { importedProviders, mountedModels };
  }

  // Native custom_models.json methods
  readCustomModelsRaw() {
    const raw = readJsonSafe(this.customModelsPath, { models: [] });
    if (Array.isArray(raw)) return { models: raw };
    if (raw && Array.isArray(raw.models)) return raw;
    return { models: [] };
  }

  saveCustomModelsRaw(obj) {
    const models = Array.isArray(obj?.models) ? obj.models : [];
    atomicWriteJson(this.customModelsPath, { models });
  }

  readIdentitiesMap() {
    const raw = readJsonSafe(this.identitiesPath, null);
    return (raw && typeof raw.assignments === "object" && raw.assignments) ? raw.assignments : {};
  }

  listNativeModels() {
    const { models } = this.readCustomModelsRaw();
    const assignments = this.readIdentitiesMap();
    return models.map((m) => {
      const { apiKey, ...rest } = m;
      const slot = assignments[m.name];
      return {
        ...rest,
        enabled: m.enabled !== false,
        isDemo: DEMO_MODEL_NAMES.has(m.name),
        hasApiKey: Boolean(apiKey && String(apiKey).trim()),
        apiKeyMasked: maskApiKey(apiKey),
        placeholderSlot: slot !== undefined ? `M${slot}` : "待分配"
      };
    });
  }

  _buildNativeModelName(providerId, externalModelName) {
    const cleanExt = String(externalModelName || "").trim().replace(/^models\//, "");
    const safeExt = cleanExt.replace(/[^a-zA-Z0-9._/-]+/g, "-");
    return `models/${providerId}/${safeExt}`;
  }

  _syncProviderToMountedModels(providerRecord) {
    const data = this.readCustomModelsRaw();
    let changed = false;
    const prefix = `models/${providerRecord.id}/`;
    const apiUrl = normalizeCompletionUrl(providerRecord.baseUrl, providerRecord.protocol);
    const apiFormat = providerRecord.protocol === "anthropic" ? "anthropic" : "openai";
    const providerType = providerRecord.protocol === "anthropic" ? "anthropic" : "openai";

    for (const m of data.models) {
      if (m._orbitProviderId === providerRecord.id || (typeof m.name === "string" && m.name.startsWith(prefix))) {
        m.apiUrl = apiUrl;
        m.apiFormat = apiFormat;
        m.provider = providerType;
        if (providerRecord.apiKey && String(providerRecord.apiKey).trim()) {
          m.apiKey = String(providerRecord.apiKey).trim();
          m.encrypted = false;
        }
        if (providerRecord.headers && Object.keys(providerRecord.headers).length > 0) {
          m.customHeaders = providerRecord.headers;
          m.encryptedHeaders = false;
        }
        changed = true;
      }
    }
    if (changed) {
      this.saveCustomModelsRaw(data);
    }
  }

  mountModelToNativeMenu(input) {
    const providerId = String(input.providerId || "").trim();
    const externalModelName = String(input.externalModelName || "").trim();
    if (!providerId) throw new Error("请选择所属渠道");
    if (!externalModelName) throw new Error("模型 ID 不能为空");

    const prov = this.getProviderWithSecret(providerId);
    if (!prov) throw new Error(`未找到渠道：${providerId}`);

    const name = input.name && String(input.name).startsWith("models/")
      ? String(input.name).trim()
      : this._buildNativeModelName(prov.id, externalModelName);

    const displayName = String(input.displayName || "").trim() || `${externalModelName} (${prov.name})`;
    const apiUrl = normalizeCompletionUrl(prov.baseUrl, prov.protocol);
    const apiFormat = prov.protocol === "anthropic" ? "anthropic" : "openai";
    const providerType = prov.protocol === "anthropic" ? "anthropic" : "openai";

    const data = this.readCustomModelsRaw();
    const idx = data.models.findIndex((m) => m.name === name);
    const existing = idx >= 0 ? data.models[idx] : null;

    const providerMeta = prov.modelMeta?.[externalModelName] || null;
    const defaults = resolveModelDefaults(externalModelName, providerMeta);

    const explicitCtx = Number(input.contextWindow);
    const explicitOut = Number(input.maxOutputTokens);

    const entry = {
      ...(existing || {}),
      name,
      displayName,
      description: String(input.description ?? existing?.description ?? `Mounted via Azure Orbit (${prov.name})`),
      provider: providerType,
      apiFormat,
      apiUrl,
      externalModelName,
      enabled: input.enabled !== undefined ? Boolean(input.enabled) : true,
      supportsThinking: input.supportsThinking !== undefined
        ? Boolean(input.supportsThinking)
        : defaults.supportsThinking,
      supportsVision: input.supportsVision !== undefined
        ? Boolean(input.supportsVision)
        : defaults.supportsVision,
      contextWindow: (Number.isFinite(explicitCtx) && explicitCtx >= 4096)
        ? Math.round(explicitCtx)
        : defaults.contextWindow,
      maxOutputTokens: (Number.isFinite(explicitOut) && explicitOut >= 512)
        ? Math.round(explicitOut)
        : defaults.maxOutputTokens
    };

    if (Array.isArray(input.fallbackModels)) {
      entry.fallbackModels = input.fallbackModels.map((x) => String(x || "").trim()).filter(Boolean);
    }

    if (prov.apiKey && String(prov.apiKey).trim()) {
      entry.apiKey = String(prov.apiKey).trim();
      entry.encrypted = false;
    } else if (existing?.apiKey) {
      entry.apiKey = existing.apiKey;
      entry.encrypted = existing.encrypted;
    }

    if (prov.headers && Object.keys(prov.headers).length > 0) {
      entry.customHeaders = prov.headers;
      entry.encryptedHeaders = false;
    }

    // Ensure maxOutputTokens < contextWindow per schemaValidator rule
    if (entry.maxOutputTokens >= entry.contextWindow) {
      entry.maxOutputTokens = Math.max(4096, Math.floor(entry.contextWindow / 4));
    }

    if (idx >= 0) data.models[idx] = entry;
    else data.models.push(entry);

    // Ensure model is also listed in provider.models
    const pData = this.readProvidersRaw();
    const pObj = pData.providers.find((x) => x.id === prov.id);
    if (pObj && !pObj.models.includes(externalModelName)) {
      pObj.models.push(externalModelName);
      this.saveProvidersRaw(pData);
    }

    this.saveCustomModelsRaw(data);
    return this.listNativeModels().find((m) => m.name === name);
  }

  async mountBatchModels({ providerId, modelNames, removeDemos = false }) {
    if (!Array.isArray(modelNames) || !modelNames.length) {
      throw new Error("未选择要挂载的模型");
    }
    if (removeDemos) {
      this.cleanDemoModels();
    }
    // Refresh live metadata from provider /v1/models if possible before mounting
    const prov = this.getProviderWithSecret(providerId);
    if (prov && (!prov.modelMeta || Object.keys(prov.modelMeta).length === 0)) {
      try {
        await this.fetchProviderModels({ id: providerId });
      } catch {}
    }
    let mountedCount = 0;
    for (const mName of modelNames) {
      const trimmed = String(mName || "").trim();
      if (!trimmed) continue;
      this.mountModelToNativeMenu({ providerId, externalModelName: trimmed });
      mountedCount++;
    }
    return { mountedCount, models: this.listNativeModels() };
  }

  updateNativeModel(name, patch = {}) {
    const data = this.readCustomModelsRaw();
    const m = data.models.find((x) => x.name === name);
    if (!m) throw new Error(`未找到已挂载模型：${name}`);

    if (patch.displayName !== undefined) m.displayName = String(patch.displayName || "").trim() || m.externalModelName || m.name;
    if (patch.externalModelName !== undefined) m.externalModelName = String(patch.externalModelName || "").trim() || m.externalModelName;
    if (patch.apiUrl !== undefined && String(patch.apiUrl).trim()) m.apiUrl = String(patch.apiUrl).trim();
    if (patch.enabled !== undefined) m.enabled = Boolean(patch.enabled);
    if (patch.supportsThinking !== undefined) m.supportsThinking = Boolean(patch.supportsThinking);
    if (patch.supportsVision !== undefined) m.supportsVision = Boolean(patch.supportsVision);

    // Find matching provider metadata if available
    const pData = this.readProvidersRaw();
    let providerMeta = null;
    for (const p of pData.providers) {
      if (String(m.name || "").startsWith(`models/${p.id}/`) && p.modelMeta?.[m.externalModelName]) {
        providerMeta = p.modelMeta[m.externalModelName];
        break;
      }
    }
    const defaults = resolveModelDefaults(m.externalModelName, providerMeta);

    // If left blank / 0 / null in the modal, fall back to provider metadata or 1M / 128K default
    if (patch.contextWindow !== undefined) {
      const rawCtx = String(patch.contextWindow ?? "").trim();
      const numCtx = Number(rawCtx);
      m.contextWindow = (rawCtx !== "" && Number.isFinite(numCtx) && numCtx >= 4096)
        ? Math.round(numCtx)
        : defaults.contextWindow;
    }
    if (patch.maxOutputTokens !== undefined) {
      const rawOut = String(patch.maxOutputTokens ?? "").trim();
      const numOut = Number(rawOut);
      m.maxOutputTokens = (rawOut !== "" && Number.isFinite(numOut) && numOut >= 512)
        ? Math.round(numOut)
        : defaults.maxOutputTokens;
    }

    if (m.maxOutputTokens >= m.contextWindow) {
      m.maxOutputTokens = Math.max(4096, Math.floor(m.contextWindow / 4));
    }
    if (Array.isArray(patch.fallbackModels)) {
      m.fallbackModels = patch.fallbackModels.map((x) => String(x || "").trim()).filter(Boolean);
    }
    if (typeof patch.apiKey === "string" && patch.apiKey.trim() && !patch.apiKey.includes("****") && !patch.apiKey.includes("已由系统加密")) {
      m.apiKey = patch.apiKey.trim();
      m.encrypted = false;
    }

    this.saveCustomModelsRaw(data);
    return this.listNativeModels().find((x) => x.name === name);
  }

  unmountNativeModel(name) {
    const data = this.readCustomModelsRaw();
    const before = data.models.length;
    data.models = data.models.filter((m) => m.name !== name);
    if (data.models.length === before) throw new Error(`未找到已挂载模型：${name}`);
    this.saveCustomModelsRaw(data);
    return { unmounted: true, name };
  }

  cleanDemoModels() {
    const data = this.readCustomModelsRaw();
    const before = data.models.length;
    data.models = data.models.filter((m) => !DEMO_MODEL_NAMES.has(m.name));
    const removed = before - data.models.length;
    if (removed > 0) {
      this.saveCustomModelsRaw(data);
    }
    return { removed, remaining: data.models.length };
  }

  // Remote /v1/models discovery & metadata caching
  async fetchProviderModelsWithMeta(input) {
    const existing = input.id ? this.getProviderWithSecret(input.id) : null;
    const protocol = input.protocol || existing?.protocol || "openai";
    const baseUrl = String(input.baseUrl || existing?.baseUrl || "").trim();
    let apiKey = existing?.apiKey || "";
    if (input.clearApiKey === true) apiKey = "";
    else if (typeof input.apiKey === "string" && input.apiKey.trim() && !input.apiKey.includes("****")) {
      apiKey = input.apiKey.trim();
    }
    let headers = existing?.headers || {};
    if (typeof input.headers === "string" && input.headers.trim()) {
      headers = JSON.parse(input.headers.trim());
    } else if (input.headers && typeof input.headers === "object") {
      headers = input.headers;
    }

    const endpoint = normalizeModelsUrl(baseUrl, protocol);
    const reqHeaders = { ...headers };
    if (protocol === "anthropic") {
      reqHeaders["anthropic-version"] = "2023-06-01";
      if (apiKey) reqHeaders["x-api-key"] = apiKey;
    } else if (apiKey) {
      reqHeaders.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(endpoint, {
      method: "GET",
      headers: reqHeaders,
      signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 240) || res.statusText}`);
    }
    const data = await res.json();
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.models) ? data.models : (Array.isArray(data) ? data : []));
    const ids = [];
    const metaMap = {};
    const seen = new Set();
    for (const item of arr) {
      const id = typeof item === "string" ? item : (item?.id || item?.name || "");
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
        const meta = extractModelMetaFromApiItem(item);
        if (meta && Object.keys(meta).length > 0) {
          metaMap[id] = meta;
        }
      }
    }

    // Persist discovered metadata into provider record if provider exists
    if (existing && Object.keys(metaMap).length > 0) {
      const pData = this.readProvidersRaw();
      const target = pData.providers.find((p) => p.id === existing.id);
      if (target) {
        target.modelMeta = { ...(target.modelMeta || {}), ...metaMap };
        this.saveProvidersRaw(pData);
      }
    }
    return { ids, metaMap };
  }

  async fetchProviderModels(input) {
    const { ids } = await this.fetchProviderModelsWithMeta(input);
    return ids;
  }

  // Runtime Patch Status & Script Generation
  detectResourcesDir(customPath) {
    const candidates = [];
    if (customPath && String(customPath).trim()) {
      const p = String(customPath).trim();
      candidates.push(p, path.join(p, "resources"));
    }
    candidates.push("D:\\AI\\antigravity\\resources");
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, "Programs", "antigravity", "resources"));
    }
    for (const c of candidates) {
      try {
        if (fs.existsSync(path.join(c, "app.asar"))) {
          return fs.realpathSync(c);
        }
      } catch {}
    }
    return candidates[0] || "";
  }

  getPatchStatus(customResourcesDir) {
    const resourcesDir = this.detectResourcesDir(customResourcesDir);
    const asarExists = Boolean(resourcesDir && fs.existsSync(path.join(resourcesDir, "app.asar")));
    const statePath = resourcesDir ? path.join(resourcesDir, ".antigravity-model-patch", "state.json") : "";
    const state = statePath ? readJsonSafe(statePath, null) : null;
    const nekoBackupExists = Boolean(resourcesDir && (
      fs.existsSync(path.join(resourcesDir, "app.asar.with-neko.bak")) ||
      fs.existsSync(path.join(resourcesDir, "app.asar.neko.bak"))
    ));
    return {
      resourcesDir,
      asarExists,
      patched: Boolean(state && state.patched),
      appVersion: state?.version || null,
      backupId: state?.backupId || null,
      nekoBackupExists,
      customModelsPath: this.customModelsPath,
      customModelsExists: fs.existsSync(this.customModelsPath)
    };
  }

  createDesktopPatchBat({ resourcesDir, action = "install", pluginRoot }) {
    const resolvedRes = this.detectResourcesDir(resourcesDir);
    if (!resolvedRes || !fs.existsSync(path.join(resolvedRes, "app.asar"))) {
      throw new Error(`未在路径下找到 app.asar：${resolvedRes}`);
    }
    const runtimeDir = path.join(pluginRoot, "runtime");
    const desktopDir = path.join(os.homedir(), "Desktop");
    const isRestore = action === "restore";
    const batName = isRestore ? "Restore-AzureOrbit-Patch.bat" : "Install-AzureOrbit-Patch.bat";
    const batPath = path.join(desktopDir, batName);
    const flag = isRestore ? "--restore " : "";

    const lines = [
      "@echo off",
      "setlocal",
      "",
      'tasklist /FI "IMAGENAME eq Antigravity.exe" 2>nul | find /I "Antigravity.exe" >nul',
      "if %errorlevel%==0 (",
      "    echo [ERROR] Antigravity.exe is still running!",
      "    echo Please close Antigravity completely and double-click this script again.",
      "    echo.",
      "    pause",
      "    exit /b 1",
      ")",
      "",
      `cd /d "${pluginRoot}"`,
      "if not exist node_modules (",
      "    echo Installing patcher dependencies (@electron/asar, typescript)...",
      "    call npm.cmd install --no-audit --no-fund",
      ")",
      "",
      `cd /d "${runtimeDir}"`,
      `echo Running Azure Orbit runtime patch (${isRestore ? "restore" : "install"}) on ${resolvedRes} ...`,
      `node scripts/deploy.mjs ${flag}--resources "${resolvedRes}"`,
      "if %errorlevel% NEQ 0 (",
      "    echo.",
      "    echo [ERROR] Operation failed. Your original files are safe.",
      "    echo.",
      "    pause",
      "    exit /b 1",
      ")",
      "",
      "echo.",
      "echo ==========================================",
      `echo   DONE! Azure Orbit runtime ${isRestore ? "restored" : "installed"}!`,
      "echo   You can now reopen Antigravity and delete this script.",
      "echo ==========================================",
      "echo.",
      "pause"
    ];

    fs.writeFileSync(batPath, lines.join("\r\n") + "\r\n", { encoding: "ascii" });
    return { ok: true, batPath, resourcesDir: resolvedRes, action };
  }
}
