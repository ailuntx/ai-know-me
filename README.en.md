# ai-know-me

[中文](README.md) · English

Read credentials from a local, human-maintained YAML file.

| Group | Contents |
| --- | --- |
| `defaults` | Website default username, email, password and PIN |
| `services` | npm, GitLab, Cloudflare and other service tokens |
| `llm` | Model provider API keys |

Requires Node.js 22+ and local terminal access.

```sh
npm install --global ai-know-me --ignore-scripts
ai-know-me init --file /absolute/path/credentials.yaml
ai-know-me list services
ai-know-me search git
ai-know-me get services.gitlab --reveal
```

Start with [assets.example.yaml](assets.example.yaml). Keep `version: 1` and the `assets` mapping. Use lowercase names and quoted string values, including PINs. Edit your file directly; each command reloads it. No Web UI, daemon, MCP server or write command.

Install the Codex plugin separately:

```sh
codex plugin marketplace add https://github.com/ailuntx/ai-know-me.git
codex plugin add ai-know-me@ai-know-me
```

The skill responds in the user's language; CLI help and errors currently use Chinese. It requires access to the user's local shell and configured YAML, which may be unavailable in hosted environments.

`list` and `search` show names only. `get` masks values unless `--reveal` is supplied; only a single value can be revealed. Use qualified names for duplicates. Quote names containing spaces. `--json` returns JSON; `--file` overrides the configured path. `doctor` checks configuration and permissions.

Credentials remain plaintext on disk. Capture revealed stdout directly into the consuming process when possible. If an AI tool prints it, the credential enters the conversation. Never commit your real credentials. The package includes only placeholder data.

Development: `npm install --ignore-scripts`, then `npm test`.
