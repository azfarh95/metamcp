# Sentinel fork of MetaMCP

This repository is a customized fork of [metatool-ai/metamcp](https://github.com/metatool-ai/metamcp) used by the **Sentinel Stack** — a self-hosted personal AI assistant on local hardware, controlled via Telegram.

**Active deployment branch: `sentinel-patches`** (set as the default branch).

## Differences vs upstream

Both patches are bug fixes for issues encountered running MetaMCP at scale with many MCP servers (~15 concurrent in the Sentinel stack):

| Commit | Purpose |
|---|---|
| `ac53aa88` | `fix(mcp-server-pool): prevent subprocess leaks from concurrent session creation` |
| `c93c7ea9` | `fix: re-initialize backend session when Streamable HTTP backend returns 404 Session not found` |

Both originated from observed crashes in the Sentinel deployment and may be useful upstream. The `pull/N` branches of upstream show PRs we may eventually contribute.

## Published image

```
ghcr.io/azfarh95/metamcp:v2.4.22-sentinel-20260510
```

Used by the Sentinel docker-compose stack as the MetaMCP gateway service.

## Sync policy

`sentinel-patches` is rebased onto `upstream/main` when upstream cuts a release. The two Sentinel commits are kept on top.

## Where the wider Sentinel stack lives

This is **just the gateway image**. The full stack (Firefly III, Vaultwarden, MCP servers, watchdog, bridges, scripts) lives in a separate private repo. Public sanitized mirror: `azfarh95/sentinel-stack-public`.
