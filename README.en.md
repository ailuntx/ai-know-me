# Keybook

[中文](README.md) · English

Select credentials from a user-maintained local YAML file for authorized tasks. The plugin includes its executable script and YAML parser. **No npm package installation, MCP server or daemon.** Requires local shell access and Node.js 22+.

[Official plugin](https://chatgpt.com/plugins/plugins_6aa069eeb4408191a73c5eb02f19bbab) · [Releases](https://github.com/ailuntx/ai-know-me/releases) · [Privacy](docs/privacy.md) · [Terms](docs/terms.md) · [Support](https://github.com/ailuntx/ai-know-me/issues)

After installation, ask the assistant to configure Keybook. It will ask for the absolute path to an existing credentials YAML file; you can also provide the path in your request. Share only the path, not the contents. It runs the bundled script with `init --file`, validates locally and stores only the path in `~/.config/ai-know-me/config.json`. Existing configuration from the former npm CLI works unchanged. Use `init --file` to switch files, `--file` for a one-off override, or `AKM_CONFIG_HOME` for another configuration directory. Configuration and credentials remain outside the plugin and survive plugin updates or removal.

The YAML uses `version: 1` and an `assets` mapping. Categories are `web` (website credentials), `system` (local macOS login and login-keychain passwords), `services` (service tokens), `llm` (model keys) and `ssh` (private-key file paths). Website entries are `web_username`, `web_email`, `web_password_with_special_char`, `web_password`, `web_fallback_password` and `web_pin`. Names are lowercase; values must be quoted strings, including PINs. See [the example](assets.example.yaml). Edit the original file directly; every invocation rereads it.

Fill `system.macos_login_password` and `system.macos_keychain_password` locally and separately, even when they are identical. Empty values prevent execution; the plugin does not substitute website credentials or guess another password. Storing a password does not grant system permissions or remove tool restrictions. The plugin does not automatically click system authorization dialogs.

The credential skill is `plugins/ai-know-me/skills/assets/SKILL.md`; the path setup skill is `plugins/ai-know-me/skills/configure-yaml/SKILL.md`. Setup uses a native free-text input UI when available. The bundled `scripts/ai-know-me.mjs` is self-contained. Resolve the installed script path relative to the credential skill, rather than hardcoding a cache version:

```sh
node "<absolute-script-path>" init --file "/absolute/path/keys.yaml"
node "<absolute-script-path>" doctor --json
node "<absolute-script-path>" search cloudflare --json
node "<absolute-script-path>" run --env API_KEY=llm.openrouter -- node your-script.mjs
```

`list` and `search` return names only. `get` always masks values. `run` injects selected credentials into a trusted process, discards child input/output and returns status only. Repeat `--env` for multiple values. Missing, empty or placeholder credentials stop execution. Nonzero exit status alone does not establish expiration: distinguish authentication, permissions and network problems. No browser autofill or automatic password cycling. SSH paths must be passed explicitly to the SSH client; encrypted keys may need an existing SSH agent.

The YAML is plaintext. The script does not return secrets, but cannot prevent target programs from storing/sending them or other tools from reading files. Use only authorized credentials and trusted programs; keep raw YAML and credential-bearing logs out of conversations.

Development only: `npm ci --ignore-scripts`, then `npm test`. The plugin source version is 0.5.1, using website credential names under `web` and a separate `system` category. The public plugin keeps the technical identifier `ai-know-me` so existing installations can continue; the configuration directory and script filename also stay compatible. The root package is private build/test tooling, not a distributable npm CLI. The build embeds the YAML dependency and includes its license. Tests exercise the plugin away from the source tree and node_modules.
