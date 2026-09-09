# AI Know Me

中文 · [English](README.en.md)

安全调用本地账号与密钥，继续完成发布、部署和模型接入。**执行脚本随插件提供，无需安装 npm 包、MCP 或后台服务。** 需要本机终端和 Node.js 22+。

[官方插件](https://chatgpt.com/plugins/plugins_6aa069eeb4408191a73c5eb02f19bbab) · [发布包](https://github.com/ailuntx/ai-know-me/releases) · [Privacy](docs/privacy.md) · [Terms](docs/terms.md) · [Support](https://github.com/ailuntx/ai-know-me/issues)

安装后告诉 AI：“我的凭据 YAML 在 `/absolute/path/我的密钥.yaml`，请配置 AI Know Me。”只提供路径，不发送文件内容。插件会运行随包脚本的 `init --file`，验证格式并把路径保存到 `~/.config/ai-know-me/config.json`。以后自动复用；旧版 CLI 的配置直接兼容。换文件时提供新路径即可。

| 分类 | 内容 |
| --- | --- |
| `defaults` | 网站默认用户名、邮箱、密码与 PIN |
| `services` | npm、Hugging Face、Docker、GitHub/GitLab、Cloudflare 等服务 Token |
| `llm` | 模型平台 API Key |
| `ssh` | SSH 私钥文件的绝对路径 |

文件每项一行，名称小写，值加引号。直接编辑原文件，下一次调用立即生效：

```yaml
version: 1
assets:
  defaults:
    default_username: "example-user"
    default_pin: "001234"
  services:
    npmjs: "REPLACE_ME"
  llm:
    openrouter: "REPLACE_ME"
  ssh:
    default_key: "/absolute/path/id_ed25519"
```

插件入口：`plugins/ai-know-me/skills/assets/SKILL.md`。脚本位于该技能的 `scripts/ai-know-me.mjs`；以下 `<script>` 代表安装后的实际绝对路径，不能照抄占位符或固定版本缓存路径。

```sh
node "<script>" init --file "/absolute/path/我的密钥.yaml"
node "<script>" doctor --json
node "<script>" search cloudflare --json
node "<script>" run --env API_KEY=llm.openrouter -- node your-script.mjs
```

`list`、`search` 只返回名称；`get` 始终遮盖值；`run` 直接注入环境变量，关闭子进程输入输出，只返回执行状态。可重复 `--env` 注入多项。`--file` 临时指定另一份 YAML；`AKM_CONFIG_HOME` 可替换配置目录。程序不创建或改写密钥文件，配置文件仅登记路径并保存在插件之外，插件升级或卸载不会删除它。

缺失、为空或占位值会阻止执行并提醒更新原文件。执行失败会报告状态；单凭退出码不能判断凭据过期，需区分认证失败、权限不足和网络问题。网站默认值不代表所有网站都使用它，不自动轮试密码。SSH 注入的是路径，目标程序需将它传给 `ssh -i`；加密私钥可能需要现有 SSH agent。没有浏览器自动填写。

原 YAML 是本地明文。该脚本不输出凭据，但目标程序仍可保存或发送凭据，也不能阻止其他工具读取文件。仅向可信程序传递已授权的凭据；不要让 AI 读取原 YAML 或凭据日志。

开发者可运行 `npm ci --ignore-scripts`、`npm test`。旧 npm 包已全部标记弃用；后续使用插件发布包。根目录 package.json 是 private 开发配置，不再提供或发布独立 npm CLI；开发依赖不需要在使用端安装。构建将 YAML 解析器和程序打包成一个脚本，并附带第三方许可。测试包含脱离源码和 node_modules 的插件运行验证。
