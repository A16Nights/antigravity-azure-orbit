#!/usr/bin/env node
import { getSidebarToolDefinition, getSidebarResourceDefinition, getSidebarResourceUri, handleSidebarToolCall, buildSidebarResourceReadResult } from "./lib/sidebar-nav.mjs";
import { readPluginVersion } from "./lib/update-checker.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { OrbitStore } from "./lib/orbit-store.mjs";

const PLUGIN_ROOT = path.dirname(fileURLToPath(import.meta.url));
const store = new OrbitStore();

const TOOLS = [
  {
    name: "orbit_list_models",
    description: "列出当前已挂载到Antigravity左下角原生模型选择器的外部主模型、已配置的渠道列表（密钥脱敏）及底层补丁状态。",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "orbit_mount_models",
    description: "将指定渠道的一个或多个模型直接挂载到Antigravity客户端左下角的原生模型下拉菜单中（无需重启客户端即可生效）。",
    inputSchema: {
      type: "object",
      required: ["providerId", "modelNames"],
      properties: {
        providerId: { type: "string", description: "渠道 ID" },
        modelNames: { type: "array", items: { type: "string" }, description: "要挂载的模型 ID 列表" },
        removeDemos: { type: "boolean", description: "是否顺手清理默认生成的 3 个无效示例模型（gpt-4o/claude/llama3）" }
      }
    }
  },
  {
    name: "orbit_unmount_model",
    description: "从Antigravity左下角原生模型下拉菜单中移除指定的已挂载外部模型（或传入 cleanDemos=true 清理默认示例模型）。",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "要移除的模型内部标识（如 models/deepseek/deepseek-chat）" },
        cleanDemos: { type: "boolean", description: "为 true 时一键移除默认示例模型" }
      }
    }
  },
  {
    name: "orbit_sync_from_orchestrator",
    description: "一键从「苍蓝协奏台」(external-orchestrator) 同步已配置好的渠道、密钥与模型列表到苍蓝星轨，可选直接挂载到左下角原生下拉菜单。",
    inputSchema: {
      type: "object",
      properties: {
        alsoMountModels: { type: "boolean", description: "是否在同步渠道后自动把所有启用渠道的模型挂载到左下角原生下拉菜单（默认 true）" },
        removeDemos: { type: "boolean", description: "是否同时清理默认示例模型（默认 true）" }
      }
    }
  },
  {
    name: "orbit_patch_status",
    description: "检查Antigravity客户端底层 app.asar 是否已安装苍蓝星轨运行时代理补丁。",
    inputSchema: { type: "object", properties: {} }
  }
];

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function sendResponse(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message, data) {
  send({ jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } });
}

async function dispatchTool(name, args = {}) {
  switch (name) {
    case "orbit_list_models":
      return {
        nativeModels: store.listNativeModels(),
        providers: store.listProviders(),
        patchStatus: store.getPatchStatus(),
        sidecarLink: "[苍蓝星轨](sidecar://azure-orbit/orbit/)"
      };
    case "orbit_mount_models":
      return await store.mountBatchModels({
        providerId: args.providerId,
        modelNames: args.modelNames,
        removeDemos: Boolean(args.removeDemos)
      });
    case "orbit_unmount_model": {
      const res = {};
      if (args.cleanDemos) {
        res.cleanedDemos = store.cleanDemoModels();
      }
      if (args.name) {
        res.unmounted = store.unmountNativeModel(args.name);
      }
      res.nativeModels = store.listNativeModels();
      return res;
    }
    case "orbit_sync_from_orchestrator": {
      if (args.removeDemos !== false) {
        store.cleanDemoModels();
      }
      const syncRes = await store.importFromOrchestrator(args.alsoMountModels !== false);
      return {
        ...syncRes,
        nativeModels: store.listNativeModels(),
        providers: store.listProviders()
      };
    }
    case "orbit_patch_status":
      return store.getPatchStatus();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    return;
  }
  const { id, method, params } = req;
  if (id === undefined || id === null) return;
  try {
    switch (method) {
      case "initialize":
        sendResponse(id, {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: "azure-orbit", version: readPluginVersion(PLUGIN_ROOT) }
        });
        break;
      case "ping":
        sendResponse(id, {});
        break;
      case "tools/list": {
        const sbTool = getSidebarToolDefinition("azure-orbit");
        sendResponse(id, { tools: sbTool ? [...TOOLS, sbTool] : TOOLS });
        break;
      }
      case "resources/list": {
        const sbRes = getSidebarResourceDefinition("azure-orbit");
        sendResponse(id, { resources: sbRes ? [sbRes] : [] });
        break;
      }
      case "resources/read": {
        const uri = params?.uri;
        if (uri === getSidebarResourceUri("azure-orbit")) {
          sendResponse(id, buildSidebarResourceReadResult("azure-orbit"));
        } else {
          sendError(id, -32602, `Unknown resource: ${uri}`);
        }
        break;
      }
      case "tools/call": {
        const toolName = params?.name;
        if (toolName === "open_azure_orbit_ui") {
          sendResponse(id, handleSidebarToolCall("azure-orbit"));
          break;
        }
        const toolArgs = params?.arguments || {};
        try {
          const result = await dispatchTool(toolName, toolArgs);
          sendResponse(id, {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            isError: false
          });
        } catch (err) {
          sendResponse(id, {
            content: [{ type: "text", text: `Error (${toolName}): ${err?.message || String(err)}` }],
            isError: true
          });
        }
        break;
      }
      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    sendError(id, -32603, "Internal error", String(err));
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  handleLine(line).catch((err) => {
    process.stderr.write(`[azure-orbit mcp] unhandled error: ${err?.stack || err}\n`);
  });
});
