---
name: configure-yaml
description: Configure Keybook with the absolute path to an existing local credentials YAML file. Use when the user asks to set up or change the YAML path, or when a credential task finds Keybook uninitialized. Do not prompt merely because the plugin was installed.
---

# Configure Keybook YAML

Respond in the user's language. This skill collects a file path, never YAML contents or credential values.

1. If the user already supplied a path, use it. Otherwise, ask one focused question for the absolute path to their **existing local YAML file**. When a native user-input tool supports free text, use it with no made-up path choices; otherwise ask directly in the conversation. Explain briefly that only the path is needed and the file stays local. Ask only once: if an asynchronous input tool acknowledges that it displayed the question, that acknowledgment is not the user's path. Do not repeat the question in a chat message. If no independent work remains, end the turn and resume setup when the user replies. Do not infer a path from examples, old notes, or filesystem searches.
2. Resolve the bundled script at `../keybook/scripts/keybook.mjs` relative to this SKILL.md. Requires local shell access and Node.js 22+. Run `node "<script>" init --file "<user-provided-path>"`. Pass the path as a single argument using an argv-based process call or proper shell quoting; never interpolate untrusted path text into shell code. The command validates the existing file and saves only its path in `~/.config/keybook/config.json` (or `KEYBOOK_CONFIG_HOME/config.json`); it does not create or edit the YAML.
3. Run `node "<script>" doctor --json` and report only whether the file is valid, its category and entry counts, and any permission warning. Do not show credential values. If validation fails, report the safe error and ask the user to correct the path or file locally; do not read the YAML into the conversation.

For credential use after setup, follow the sibling [Keybook skill](../keybook/SKILL.md). If a configured file already works and the user has not asked to change it, continue the task without asking for a new path.
