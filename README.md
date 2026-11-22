# 🪐 苍蓝星轨 · Azure Orbit (`antigravity-azure-orbit`)

面向 **Google Antigravity** 的原生主模型接入与侧栏可视化管理插件：**将外部大模型 API（DeepSeek / OpenAI 兼容 / Anthropic 兼容 / OpenRouter / Kimi / 本地聚合网关 / Ollama）直接挂载进 Antigravity 客户端输入框左下角的「原生模型下拉菜单」中作为主脑使用**。

与 **[苍蓝协奏台（External Orchestrator）](https://github.com/A16Nights/antigravity-external-orchestrator)** 组成「苍蓝双子」：
- **苍蓝星轨**：让外部模型直接驶入 Antigravity 左下角原生模型下拉菜单，亲自担任主脑对话；
- **苍蓝协奏台**：由主脑负责规划与验收，把耗费大量 Token 的多文件阅读、代码编写、命令排查与文本生成委派给高性价比外部执行手。

---

## ✨ 功能全景

### 1. 原生模型下拉菜单无缝挂载
- **直挂原生选择器**：选中任意外部渠道模型即可一键 **「★ 挂载 / 移除」** 到 Antigravity 左下角原生模型下拉框。
- **热读取零重启**：底层代理每次请求实时读取 `~/.gemini/antigravity/custom_models.json`，挂载或卸载模型后无需重启客户端（若前端下拉列表尚未刷新，按一次 `Ctrl+R` 即可刷出最新模型）。
- **自定义显示别名與排序**：支持为挂载的模型设置清晰的显示名称，并一键清理默认示例占位模型。

### 2. 多渠道管理、模型拉取与多关键词检索
- **7 大主流预设开箱即用**：内置 DeepSeek、本地聚合网关、OpenAI 兼容、Kimi / Moonshot、OpenRouter、Anthropic 兼容、Ollama 本地预设，支持自定义请求头（Headers）与超时设置。
- **一键拉取 `/v1/models`**：在渠道弹窗或列表中直接从远端接口拉取全部可用模型，支持空格分隔的多关键词实时过滤检索、单选/全选批量添加。
- **密钥隔离与自动脱敏**：API Key 仅保存在本机配置中，界面展示与 MCP 工具返回均自动掩码脱敏。

### 3. 与「苍蓝协奏台」一键双向同步
- 已配置 **[苍蓝协奏台](https://github.com/A16Nights/antigravity-external-orchestrator)** 的用户，只需点击 **「⚡ 从苍蓝协奏台一键同步并挂载」**（或「⇄ 仅从苍蓝协奏台导入渠道」），即可自动导入所有已启用的提供商渠道、密钥与模型列表，免去重复填写。

### 4. Antigravity 2.32+ / 2.33.0+ 底层补丁引擎（`runtime/`）
- **新版参数布局完整适配**：完美适配 `dist/languageServer.js` 在 Antigravity 2.32+ / 2.33.0+ 下的 `...spread`（`baseLsArgs`）启动参数注入，并在原生中文/英文模型下拉菜单内提供实时搜索框。
- **非破坏性共存注入**：采用增量标记注入，与观察窗/猫娘挂件等其他扩展补丁完全共存；支持在侧栏面板实时查看补丁状态，并一键在桌面生成「安装/更新星轨补丁」与「还原官方原版」批处理脚本。

### 5. 苍蓝统一视觉与交互体系
- **Sidecar + 独立 Web UI 双形态**：采用 Antigravity 官方标准 Sidecar 辅助侧栏 + MCP Server 架构，彻底告别传统 Settings 弹窗 DOM 注入失效问题；点击顶栏 `Web UI` 可在系统浏览器全屏管理。
- **Neko Glass 毛玻璃界面 & 苍蓝主题色调中心**：支持深色/浅色切换、自定义毛玻璃下拉框与弹窗、6 套官方主题预设 + 自定义主副双色 + 4 个自定义栏位跨插件同步、左侧栏快捷入口开关与 GitHub Release 在线更新检查。

---

## 🚀 安装与使用指南

> 前置要求：**Node.js >= 22.0.0**（零第三方运行时依赖，纯 Node.js 原生 ESM 实现）。

1. **克隆本仓库到 Antigravity 全局插件目录**（目录名固定为 `azure-orbit`）：

```powershell
# Windows (PowerShell)
git clone https://github.com/A16Nights/antigravity-azure-orbit.git "$env:USERPROFILE\.gemini\config\plugins\azure-orbit"

# macOS / Linux
git clone https://github.com/A16Nights/antigravity-azure-orbit.git ~/.gemini/config/plugins/azure-orbit
```

2. **重启或重载 Antigravity（`Ctrl+R`）**，在右侧辅助面板或左侧栏打开 **「苍蓝星轨」**。
3. **首次激活底层补丁**：切换到 **「星轨引擎（底层补丁）」** 标签页，点击 **「在桌面生成安装/更新星轨补丁.bat」**，退出 Antigravity 后双击运行一次即可完成注入。
4. **挂载主模型**：在 **「模型渠道」** 页添加渠道或从苍蓝协奏台一键同步，点击模型将其挂载到 **「原生主模型」**，按 `Ctrl+R` 重载窗口后即可在左下角模型菜单中直接选用。

---

## 🧰 MCP 工具一览（5 个）

| 工具名 | 作用 |
| --- | --- |
| `orbit_list_models` | 查看当前已挂载到左下角原生菜单的主模型、已配置渠道（脱敏）及底层补丁状态 |
| `orbit_mount_models` | 将指定渠道的一个或多个模型直接挂载到 Antigravity 左下角原生下拉菜单 |
| `orbit_unmount_model` | 从左下角原生下拉菜单移除指定模型，或一键清理默认示例模型 |
| `orbit_sync_from_orchestrator` | 一键从「苍蓝协奏台」同步渠道与模型配置并可选直接挂载到原生菜单 |
| `orbit_patch_status` | 检查 Antigravity 客户端 `app.asar` 的星轨底层补丁安装状态与版本兼容性 |

---

## 📂 数据与配置存储

- **原生挂载模型列表**：`~/.gemini/antigravity/custom_models.json`
- **星轨渠道与配置**：`~/.gemini/azure-orbit/config.json`
- **苍蓝套件共享主题 / 左侧栏配置**：`~/.gemini/azure-theme.json`、`~/.gemini/azure-sidebar-nav.json`

---

## 📄 License

[Apache-2.0](./LICENSE)
