# ai-know-me

中文 · [English](README.en.md)

从本地 YAML 按需读取凭据，供人和 AI 共用。

| 分类 | 内容 |
| --- | --- |
| `defaults` | 网站默认用户名、邮箱、密码与 PIN |
| `services` | npm、GitLab、Cloudflare 等服务 Token |
| `llm` | 模型平台 API Key |

需要 Node.js 22+。

```bash
npm install --global ai-know-me --ignore-scripts
ai-know-me init --file "/absolute/path/我的密钥.yaml"
ai-know-me list services
ai-know-me search git
ai-know-me get services.gitlab --reveal
ai-know-me get llm.modelscope --reveal
ai-know-me get defaults.default_email --reveal
```

文件格式：每项一行，名称小写，值用引号包裹。

```yaml
version: 1
assets:
  defaults:
    default_username: "example-user"
    default_email: "user@example.com"
    default_password: "REPLACE_ME"
    default_pin: "001234"
  services:
    npmjs: "REPLACE_ME"
    gitlab: "REPLACE_ME"
  llm:
    modelscope: "REPLACE_ME"
```

直接编辑原文件，下一次查询立即生效。`init` 只在 `~/.config/ai-know-me/config.json` 登记已有文件路径；`--file` 可临时指定另一份文件。没有 Web、MCP、后台服务或写入命令。

`list [分类]`、`search <关键词>` 只列名称；`get <分类.名称>` 默认遮盖值，`--reveal` 返回单项原值。名称唯一时可省略分类。点号、空格可用于条目名，含空格的参数需加引号；PIN 等数字值必须加引号。支持额外的小写分类。

`doctor` 检查文件与权限，`--json` 提供 JSON 输出。默认网站密码不代表每个网站都使用它，不自动尝试密码变体。

Codex 插件位于 `plugins/ai-know-me`：先确认 CLI 和文件配置，再按任务搜索、读取所需项并继续执行。npm 安装只提供 CLI 和插件文件，Codex 插件需单独安装。

密钥保存在本地明文 YAML。`--reveal` 输出真实值；可直接传入目标进程，避免打印。若输出被返回给 AI，密钥会进入会话上下文。发布包仅包含程序、说明和占位示例。

本地开发：`npm install --ignore-scripts`、`npm test`。本地安装：`npm install --global . --ignore-scripts`。

安装 Codex 插件：

```bash
codex plugin marketplace add https://github.com/ailuntx/ai-know-me.git
codex plugin add ai-know-me@ai-know-me
```

需要能访问本机文件和终端的运行环境。插件按用户语言回复，YAML 名称保持不变；CLI 当前帮助和错误提示为中文。
