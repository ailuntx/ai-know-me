# Privacy notice / 隐私说明

Effective date / 生效日期: 2026-09-09

Maintainer / 维护者: ailuntz

Website / 网站: https://www.ailuntz.com

Publisher / 发布者: ailuntz

ai-know-me is a local CLI and a skill that instructs an AI assistant to use that CLI. It reads the YAML file you select. The CLI stores that file's path in a local configuration file. It does not operate a hosted credential service, collect analytics, or send your YAML or credentials to the publisher. It does not encrypt your file.

`list` and `search` expose credential names; `get` always masks values, including JSON output. Version 0.3.4 removes the plaintext output option. Humans can view the original YAML locally, outside the AI conversation. When you authorize use of a credential, the target program may send it to the service being authenticated to. These third parties apply their own privacy policies; this plugin cannot control or delete their records.

Installing or updating through npm, downloading from GitHub, and using an AI platform involve those providers and their own data practices. There is no publisher-operated account or credential database to delete. You control the YAML and local configuration; deleting them does not revoke keys or remove copies held by other services.

Support is provided through https://github.com/ailuntx/ai-know-me/issues. GitHub issues are public. Do not include passwords, tokens, identity documents or full credential files. Information you choose to post there is used to investigate your issue and is subject to GitHub's handling and retention.

ai-know-me 在本地读取你指定的 YAML，并仅在本地配置中登记文件路径。发布者不提供托管密钥服务，不通过本程序收集分析数据或接收密钥；原文件为明文。列举和搜索会输出名称，`get` 始终遮盖值，包括 JSON 输出。0.3.4 已删除明文输出选项。人类可自行在本机查看原 YAML，保持在 AI 对话之外。经你授权后，目标程序可将凭据发送给对应认证服务。npm、GitHub、AI 平台和目标服务各自适用其隐私政策。

你自行管理和删除本地文件；删除文件不会撤销服务密钥或清除第三方保存的记录。支持入口为上述 GitHub Issues，请勿在公开问题中提交任何秘密或身份证明文件。

`run` passes selected values through the child process environment and discards child stdout/stderr. Its result contains only execution status. Credential values are not returned through this command's output; it cannot control what the target program stores or sends, or prevent an assistant from reading files through other tools. Do not return your YAML or credential-bearing logs through AI tools.

`run` 通过环境变量传递选中项，丢弃子进程输出，只返回执行状态；该命令的输出不包含凭据。目标程序仍可保存或发送凭据，本程序也无法阻止 AI 通过其他工具读取文件。请勿通过 AI 工具返回原 YAML 或凭据日志。
