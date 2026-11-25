---
name: azure-orbit
description: >-
  Manage external LLM models injected directly into Google Antigravity's native
  bottom-left model selector dropdown via the Azure Orbit (苍蓝星轨) sidecar console
  and MCP tools. Use when the user wants to mount, unmount, sync, or inspect custom
  primary models in the native model selector or manage the 2.33.0+ runtime patch.
---

# 苍蓝星轨 · Azure Orbit

本插件将外部大模型 API（DeepSeek、OpenAI 兼容、Anthropic 兼容、本地聚合网关、Ollama）直接挂载进Antigravity客户端**输入框左下角的原生模型下拉菜单**中作为主脑使用，并自带右侧可视化管理面板（`[苍蓝星轨](sidecar://azure-orbit/orbit/)`，Antigravity 2.35.1+ 回复含该链接会自动弹开侧栏，仅在用户需打开面板时输出）。

## 数据与配置位置
- 原生主模型配置文件：`~/.gemini/antigravity/custom_models.json`（底层代理每次请求实时读取，修改后无需重启客户端即可生效；按 `Ctrl+R` 可立即刷新左下角菜单列表）
- 星轨渠道配置文件：`~/.gemini/azure-orbit/providers.json`
- 内置 2.32+/2.33.0+（含中文界面与猫娘挂件共存）运行时补丁引擎：`runtime/`

## 可用 MCP 工具（`azure-orbit`）
1. `orbit_list_models`：查看当前已挂载到左下角原生菜单的主模型列表、已配置渠道（脱敏）及底层补丁状态。
2. `orbit_mount_models(providerId, modelNames, removeDemos?)`：将指定渠道的模型挂载到左下角原生下拉菜单。
3. `orbit_unmount_model(name?, cleanDemos?)`：从左下角原生下拉菜单移除模型，或一键清理首次生成的 3 个默认示例模型。
4. `orbit_sync_from_orchestrator(alsoMountModels?, removeDemos?)`：一键从「苍蓝协奏台」（`external-orchestrator`）同步已配好的渠道与模型并直接挂载进左下角原生下拉菜单。
5. `orbit_patch_status`：检查Antigravity `resources/app.asar` 是否已注入星轨底层运行时补丁。
