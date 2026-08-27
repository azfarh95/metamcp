# Sentinel fork of MetaMCP

This repository is a customized fork of [metatool-ai/metamcp](https://github.com/metatool-ai/metamcp) used by the **Sentinel Stack** — a self-hosted personal AI assistant on local hardware, controlled via Telegram.

**Active deployment branch: `sentinel-patches`** (set as the default branch).

## Differences vs upstream

These patches are bug fixes / infra additions for issues encountered running MetaMCP at scale
with many MCP servers (~15 concurrent in the Sentinel stack). This table is not exhaustive —
`git log --grep sentinel-patch` is the source of truth; entries here are the ones worth a
one-line explanation beyond the commit message:

| Commit | Purpose |
|---|---|
| `ac53aa88` | `fix(mcp-server-pool): prevent subprocess leaks from concurrent session creation` |
| `c93c7ea9` | `fix: re-initialize backend session when Streamable HTTP backend returns 404 Session not found` |
| (this change) | `chromium` + `xvfb` added to the runner image so STDIO MCP servers that launch a real (non-headless) browser -- e.g. donsetch's bot-wall-bypass tier -- have one to find in-container, instead of failing with "no chromium/chrome binary found". |

These originated from observed issues in the Sentinel deployment; the bug fixes may be useful
upstream (the `pull/N` branches of upstream show PRs we may eventually contribute), the
chromium/xvfb addition is Sentinel-specific and not a candidate for upstream.

## Published image

```
ghcr.io/azfarh95/sentinel-metamcp:sentinel-latest
```

Built by `.github/workflows/sentinel-publish.yml` on every push to `sentinel-patches`. This
superseded an earlier, manually-published `ghcr.io/azfarh95/metamcp:v2.4.22-sentinel-20260510`
tag (this doc used to point at that one -- it's no longer what's deployed).

Used by the Sentinel docker-compose stack as the MetaMCP gateway service.

## Sync policy

`sentinel-patches` is rebased onto `upstream/main` when upstream cuts a release. The Sentinel commits are kept on top.

## Where the wider Sentinel stack lives

This is **just the gateway image**. The full stack (Firefly III, Vaultwarden, MCP servers, watchdog, bridges, scripts) lives in a separate private repo. Public sanitized mirror: `azfarh95/sentinel-stack-public`.
