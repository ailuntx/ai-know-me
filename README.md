# Keybook

中文 · [English](README.en.md)

从你维护的本地 YAML 中按需选取凭据，供已授权的任务使用。**执行脚本随插件提供，无需安装 npm 包、MCP 或后台服务。** 需要本机终端和 Node.js 22+。

[安装 Keybook 0.6.0](https://chatgpt.com/plugins/plugins_6ab477295a3081918fce6282c1273661) · [发布包](https://github.com/ailuntx/keybook/releases/tag/v0.6.0) · [Privacy](docs/privacy.md) · [Terms](docs/terms.md) · [Support](https://github.com/ailuntx/keybook/issues)

安装后可以直接说“配置 Keybook”。插件会询问已有凭据 YAML 的绝对路径；也可以在请求中直接提供路径。只提供路径，不发送文件内容。插件会运行随包脚本的 `init --file`，验证格式并把路径保存到 `~/.config/keybook/config.json`。以后自动复用；换文件时提供新路径即可。由旧包名升级的用户需要重新提供一次原 YAML 路径，原文件不会被改动。

仅安装插件不会触发提问。明确要求配置时会立即询问；在已授权任务需要凭据时，插件先检查配置，未配置才询问。已有有效路径时直接继续任务，不重复索取路径。

| 分类 | 已授权任务示例 | 可查找的内容 |
| --- | --- | --- |
| `web` | 登录已指定的网站 | 用户名、邮箱、指定密码变体与 PIN |
| `system` | 执行需要本机密码的命令 | macOS 登录密码、登录钥匙串密码；两者独立 |
| `services` | 发布 npm 包、上传 Hugging Face 模型或数据集、推送 Docker 镜像、操作 GitHub/GitLab、部署 Cloudflare | 对应服务的 Token |
| `llm` | 调用 OpenRouter、ModelScope 等模型 API | 对应平台的 API Key |
| `ssh` | 连接已授权的主机 | SSH 私钥文件的绝对路径 |

文件每项一行，名称小写，值加引号。直接编辑原文件，下一次调用立即生效：

```yaml
version: 1
assets:
  web:
    web_username: "example-user"
    web_email: "user@example.com"
    web_password_with_special_char: "REPLACE_ME"
    web_password: "REPLACE_ME"
    web_fallback_password: "REPLACE_ME"
    web_pin: "001234"
  system:
    macos_login_password: ""
    macos_keychain_password: ""
  services:
    npmjs: "REPLACE_ME"
    huggingface: "REPLACE_ME"
    dockerhub: "REPLACE_ME"
    github: "REPLACE_ME"
    gitlab: "REPLACE_ME"
    cloudflare: "REPLACE_ME"
  llm:
    openrouter: "REPLACE_ME"
    modelscope: "REPLACE_ME"
  ssh:
    default_key: "/absolute/path/id_ed25519"
```

`system.macos_login_password` 是 Mac 用户登录密码；`system.macos_keychain_password` 是登录钥匙串密码。请在本机分别填写；即使相同也填写两项，不自动猜测或回退到网站密码。留空时不会执行目标程序。保存密码不等于授予系统权限，也不会解除工具访问限制；插件不自动点击系统授权窗口。

凭据技能入口：`plugins/keybook/skills/keybook/SKILL.md`；路径配置技能：`plugins/keybook/skills/configure-yaml/SKILL.md`。有可用的自由文本提问界面时，配置技能会用它询问地址。脚本位于凭据技能的 `scripts/keybook.mjs`；以下 `<script>` 代表安装后的实际绝对路径，不能照抄占位符或固定版本缓存路径。

```sh
node "<script>" init --file "/absolute/path/我的密钥.yaml"
node "<script>" doctor --json
node "<script>" search cloudflare --json
node "<script>" run --env API_KEY=llm.openrouter -- node your-script.mjs
```

`list`、`search` 只返回名称；`get` 始终遮盖值；`run` 直接注入环境变量，关闭子进程输入输出，只返回执行状态。可重复 `--env` 注入多项。`--file` 临时指定另一份 YAML；`KEYBOOK_CONFIG_HOME` 可替换配置目录。程序不创建或改写密钥文件，配置文件仅登记路径并保存在插件之外，插件升级或卸载不会删除它。

缺失、为空或占位值会阻止执行并提醒更新原文件。执行失败会报告状态；单凭退出码不能判断凭据过期，需区分认证失败、权限不足和网络问题。`web` 只用于网站，密码变体必须根据该任务选定，不自动轮试。SSH 注入的是路径，目标程序需将它传给 `ssh -i`；加密私钥可能需要现有 SSH agent。没有浏览器自动填写。

原 YAML 是本地明文。该脚本不输出凭据，但目标程序仍可保存或发送凭据，也不能阻止其他工具读取文件。仅向可信程序传递已授权的凭据；不要让 AI 读取原 YAML 或凭据日志。

开发者可运行 `npm ci --ignore-scripts`、`npm test`。已发布版本为 0.6.0，插件技术标识、目录、脚本及配置目录统一使用 `keybook`。[原公开条目](https://chatgpt.com/plugins/plugins_6aa069eeb4408191a73c5eb02f19bbab)仍提供 0.5.1 版；新标识使用上方的新条目。根目录 package.json 是 private 开发配置，不提供独立 npm CLI；开发依赖不需要在使用端安装。构建将 YAML 解析器和程序打包成一个脚本，并附带第三方许可。测试包含脱离源码和 node_modules 的插件运行验证。
