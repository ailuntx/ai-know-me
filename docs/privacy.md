# Privacy notice / 隐私说明

Effective date / 生效日期: 2026-09-09

Publisher / 发布者: ailuntz

ai-know-me is a local CLI and a skill that instructs an AI assistant to use that CLI. It reads the YAML file you select. The CLI stores that file's path in a local configuration file. It does not operate a hosted credential service, collect analytics, or send your YAML or credentials to the publisher. It does not encrypt your file.

`list` and `search` expose credential names; `get --reveal` outputs one actual value. If your assistant returns that output in a tool result, the value can enter the assistant provider's conversation, retention and processing systems. When you authorize use of a credential, it may be sent to the service being authenticated to. These third parties apply their own privacy policies; this plugin cannot control or delete their records.

Installing or updating through npm, downloading from GitHub, and using an AI platform involve those providers and their own data practices. There is no publisher-operated account or credential database to delete. You control the YAML and local configuration; deleting them does not revoke keys or remove copies held by other services.

Support is provided through https://github.com/ailuntx/ai-know-me/issues. GitHub issues are public. Do not include passwords, tokens, identity documents or full credential files. Information you choose to post there is used to investigate your issue and is subject to GitHub's handling and retention.

ai-know-me 在本地读取你指定的 YAML，并仅在本地配置中登记文件路径。发布者不提供托管密钥服务，不通过本程序收集分析数据或接收密钥；原文件为明文。列举和搜索会输出名称，`get --reveal` 会输出单项真实值。如果 AI 工具将输出送回会话，相关值可能由 AI 平台处理和保存；用于服务认证时也会发送给对应服务。npm、GitHub、AI 平台和目标服务各自适用其隐私政策。

你自行管理和删除本地文件；删除文件不会撤销服务密钥或清除第三方保存的记录。支持入口为上述 GitHub Issues，请勿在公开问题中提交任何秘密或身份证明文件。
