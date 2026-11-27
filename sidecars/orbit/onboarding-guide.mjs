export const ORBIT_ONBOARDING_GUIDE = {
  version: "1",
  icon: "🪐",
  title: "欢迎使用苍蓝星轨——原生菜单外接模型挂载",
  subtitle: "1 分钟学会把外部大模型直接挂载进 Antigravity 左下角原生模型下拉菜单（随时点「? 指南」重看）",
  steps: [
    {
      icon: "🔌",
      navTitle: "配置模型渠道",
      title: "第一步：添加渠道或从协奏台一键同步",
      desc: "先把要用的外部 API（DeepSeek、OpenAI、Anthropic、OpenRouter、本地网关等）添加到「模型渠道」。",
      spotlight: {
        clickBefore: '.tab[data-tab="providers"]',
        selector: "#preset-buttons",
        buttonText: "定位渠道配置",
        hint: "点常用预设快速新建渠道，若已配置苍蓝协奏台也可直接一键同步过来"
      },
      items: [
        {
          icon: "⚡",
          title: "内置主流厂商模板",
          text: "点预设按钮自动填好协议和接口地址，填上 API Key 后可在线拉取模型清单。"
        },
        {
          icon: "🔄",
          title: "支持复用协奏台渠道",
          text: "如果已经在「苍蓝协奏台」填过渠道与密钥，无需重复录入，一键即可同步进星轨。"
        }
      ],
      tip: "渠道仅负责保存连接信息；真正出现在左下角菜单里的模型需要在下一步「挂载」。"
    },
    {
      icon: "🪐",
      navTitle: "挂载到原生菜单",
      title: "第二步：挑选模型挂载到 Antigravity 左下角",
      desc: "把想当作主脑使用的模型挂载进「原生主模型」列表，就能像官方模型一样直接在聊天窗口切换。",
      spotlight: {
        clickBefore: '.tab[data-tab="native"]',
        selector: "#native-models-list",
        buttonText: "定位已挂载列表",
        hint: "这里展示当前已写入 custom_models.json 的自定义主模型，可随时编辑、启停或移除"
      },
      items: [
        {
          icon: "🏷️",
          title: "自定义显示名与推理参数",
          text: "支持自定义在下拉菜单中显示的名称、上下文长度与推理档位，辨识度更高。"
        },
        {
          icon: "♻️",
          title: "保存后热更新生效",
          text: "底层代理会实时热读取 ~/.gemini/antigravity/custom_models.json；若左下角菜单暂未刷出新项，按一次 Ctrl+R 即可。"
        }
      ],
      tip: "支持在列表顶部搜索框快速过滤，也提供一键清理演示示例项。"
    },
    {
      icon: "⚙️",
      navTitle: "星轨引擎检查",
      title: "第三步：确认星轨底层运行补丁状态",
      desc: "Antigravity 2.33.0+ 客户端升级后若发现自定义模型不生效，可在此一键核验并刷新星轨引擎补丁。",
      spotlight: {
        clickBefore: '.tab[data-tab="patch"]',
        selector: "#patch-badge",
        buttonText: "查看引擎状态",
        hint: "绿色代表星轨底层补丁正常就绪；客户端每次大版本更新后记得来这里点一眼"
      },
      items: [
        {
          icon: "🩺",
          title: "自动定位资源目录与健康自检",
          text: "自动识别当前 Antigravity 安装目录并展示补丁状态详情，无需手动翻目录。"
        },
        {
          icon: "🛡️",
          title: "安全可逆一键恢复",
          text: "应用补丁前自动保留原始备份，任何时候都能一键还原回官方初始状态。"
        }
      ],
      tip: "随时可点顶栏「? 指南」重新打开这份教程；支持 ← / → 翻页与 Esc 关闭。"
    }
  ]
};
