# 苍蓝星轨（azure-orbit）使用约定

- 当用户希望将外部 API 模型添加/移除到反重力左下角原生模型下拉菜单作为主脑使用，或询问原生菜单自定义模型配置时，使用 `azure-orbit` 的 MCP 工具（`orbit_list_models`、`orbit_mount_models`、`orbit_unmount_model`、`orbit_sync_from_orchestrator`）或引导打开 `[苍蓝星轨](sidecar://azure-orbit/orbit/)` 侧栏面板。
- 修改挂载模型后底层代理会实时热读取 `~/.gemini/antigravity/custom_models.json`；若前端左下角菜单尚未刷新列表，提醒用户按一次 `Ctrl+R` 即可刷出最新模型。
