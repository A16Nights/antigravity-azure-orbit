# 🪐 苍蓝星轨（Azure Orbit）

面向 **Google Antigravity** 的原生主模型接入与侧栏可视化管理插件：**把外部大模型 API（DeepSeek / OpenAI 兼容 / Anthropic 兼容 / 本地聚合网关 / Ollama）直接挂载进Antigravity客户端输入框左下角的「原生模型下拉菜单」中作为主脑使用**。

与 **[苍蓝协奏台（External Orchestrator）](https://github.com/A16Nights/antigravity-external-orchestrator)** 组成「苍蓝双子」：
- **苍蓝协奏台**：主脑规划 + 委派外部模型干脏活累活（省主脑 Token）
- **苍蓝星轨**：让外部模型直接驶入Antigravity左下角的原生模型下拉菜单，亲自担任主脑对话！

---

## 核心特性

- **右侧栏原生可视化面板（不依赖 Settings 弹窗 DOM 注入）**
  - 采用 Antigravity 官方标准的 **Sidecar 辅助侧栏** + **MCP Server** 架构，彻底解决传统 DOM 注入在中文界面或新版 Settings 下无法显示的问题。
- **多渠道接入 + 模型拉取与多关键词搜索**
  - 支持添加多个 API 提供商渠道、一键从 `/v1/models` 拉取模型列表、支持空格多关键词实时检索过滤。
  - 点击模型即可一键 **「★ 挂载 / 移除」** 到左下角原生下拉菜单，底层代理每次请求实时读取 `~/.gemini/antigravity/custom_models.json`，无需重启客户端（按 `Ctrl+R` 即可刷新前端下拉菜单）。
- **与「苍蓝协奏台」一键联动同步**
  - 已安装苍蓝协奏台的用户，点击 **「⚡ 从苍蓝协奏台一键同步并挂载」** 即可自动导入所有已配好的渠道、密钥与模型并直接挂载进左下角原生菜单，无需重复配置。
- **内置 Antigravity 2.32+ / 2.33.0+ 底层补丁引擎（`runtime/`）**
  - 已修复 `dist/languageServer.js` 在 2.32+/2.33.0+ 下的 `...spread`（`baseLsArgs`）启动参数布局问题，并支持中文「模型」下拉菜单内嵌搜索框。
  - 采用增量非破坏性注入，与猫娘挂件（`antigravity-observer`）等补丁完全共存，支持在侧栏一键生成桌面安装与还原脚本。

---

## 安装方法

1. 克隆本仓库到 Antigravity 的全局插件目录：

```powershell
# Windows (PowerShell)
git clone https://github.com/A16Nights/antigravity-azure-orbit.git "$env:USERPROFILE\.gemini\config\plugins\azure-orbit"

# macOS / Linux
git clone https://github.com/A16Nights/antigravity-azure-orbit.git ~/.gemini/config/plugins/azure-orbit
```

2. 重启或重载 Antigravity，打开右侧栏 **「苍蓝星轨」**。
3. 首次在新设备上使用时，切到 **「星轨引擎（底层补丁）」** 页，点击 **「在桌面生成安装/更新星轨补丁.bat」**，退出Antigravity后双击运行一次即可激活底层代理。
4. 在 **「原生主模型」** 或 **「模型渠道」** 页挂载你的模型（或从苍蓝协奏台一键同步），按 `Ctrl+R` 刷新窗口，即可在输入框左下角的原生模型下拉菜单中直接选用！

---

## MCP 工具一览

| 工具名 | 作用 |
| --- | --- |
| `orbit_list_models` | 查看当前已挂载到左下角原生菜单的主模型、渠道（脱敏）及底层补丁状态 |
| `orbit_mount_models` | 将指定渠道的一个或多个模型挂载到左下角原生下拉菜单 |
| `orbit_unmount_model` | 从左下角原生下拉菜单移除模型，或一键清理默认示例模型 |
| `orbit_sync_from_orchestrator` | 一键从「苍蓝协奏台」同步渠道与模型并挂载到原生菜单 |
| `orbit_patch_status` | 检查Antigravity `app.asar` 的星轨底层补丁状态 |

---

## License

[Apache-2.0](./LICENSE)
