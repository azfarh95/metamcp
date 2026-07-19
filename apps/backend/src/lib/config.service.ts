import { ConfigKey, ConfigKeyEnum } from "@repo/zod-types";

import { configRepo } from "../db/repositories/config.repo";

export const configService = {
  async isSignupDisabled(): Promise<boolean> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.DISABLE_SIGNUP,
    );
    return config?.value === "true";
  },

  async setSignupDisabled(disabled: boolean): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.DISABLE_SIGNUP,
      disabled.toString(),
      "Whether new user signup is disabled",
    );
  },

  async isSsoSignupDisabled(): Promise<boolean> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.DISABLE_SSO_SIGNUP,
    );
    return config?.value === "true";
  },

  async setSsoSignupDisabled(disabled: boolean): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.DISABLE_SSO_SIGNUP,
      disabled.toString(),
      "Whether new user signup via SSO/OAuth is disabled",
    );
  },

  async isBasicAuthDisabled(): Promise<boolean> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.DISABLE_BASIC_AUTH,
    );
    return config?.value === "true";
  },

  async setBasicAuthDisabled(disabled: boolean): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.DISABLE_BASIC_AUTH,
      disabled.toString(),
      "Whether basic email/password authentication is disabled",
    );
  },

  async getMcpResetTimeoutOnProgress(): Promise<boolean> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.MCP_RESET_TIMEOUT_ON_PROGRESS,
    );
    return config?.value === "true" || true;
  },

  async setMcpResetTimeoutOnProgress(enabled: boolean): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.MCP_RESET_TIMEOUT_ON_PROGRESS,
      enabled.toString(),
      "Whether to reset timeout on progress for MCP requests",
    );
  },

  async getMcpTimeout(): Promise<number> {
    const config = await configRepo.getConfig(ConfigKeyEnum.Enum.MCP_TIMEOUT);
    return config?.value ? parseInt(config.value, 10) : 60000;
  },

  async setMcpTimeout(timeout: number): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.MCP_TIMEOUT,
      timeout.toString(),
      "MCP request timeout in milliseconds",
    );
  },

  async getMcpMaxTotalTimeout(): Promise<number> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.MCP_MAX_TOTAL_TIMEOUT,
    );
    return config?.value ? parseInt(config.value, 10) : 60000;
  },

  async setMcpMaxTotalTimeout(timeout: number): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.MCP_MAX_TOTAL_TIMEOUT,
      timeout.toString(),
      "MCP maximum total timeout in milliseconds",
    );
  },

  async getMcpMaxAttempts(): Promise<number> {
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.MCP_MAX_ATTEMPTS,
    );
    return config?.value ? parseInt(config.value, 10) : 1;
  },

  async setMcpMaxAttempts(maxAttempts: number): Promise<void> {
    await configRepo.setConfig(
      ConfigKeyEnum.Enum.MCP_MAX_ATTEMPTS,
      maxAttempts.toString(),
      "Maximum number of crash attempts before marking MCP server as ERROR",
    );
  },

  async getSessionLifetime(): Promise<number | null> {
    // [sentinel-patch] Finite DEFAULT so a fresh / reset metamcp_db is not
    // re-vulnerable to the 2026-07-20 pool-exhaustion leak: when SESSION_LIFETIME
    // is unset the reaper is skipped (infinite sessions) → stale sessions
    // accumulate until the connection cap → fresh clients get 0 tools. An explicit
    // SESSION_LIFETIME config row still overrides this. Set
    // METAMCP_DEFAULT_SESSION_LIFETIME_MS=0 to opt back into infinite sessions.
    const DEFAULT_MS = Number(
      process.env.METAMCP_DEFAULT_SESSION_LIFETIME_MS ?? 3600000,
    );
    const fallback =
      Number.isFinite(DEFAULT_MS) && DEFAULT_MS > 0 ? DEFAULT_MS : null;
    const config = await configRepo.getConfig(
      ConfigKeyEnum.Enum.SESSION_LIFETIME,
    );
    if (!config?.value) {
      return fallback; // no explicit row → finite default (was: null = infinite)
    }
    const lifetime = parseInt(config.value, 10);
    return isNaN(lifetime) ? fallback : lifetime;
  },

  async setSessionLifetime(lifetime?: number | null): Promise<void> {
    if (lifetime === null || lifetime === undefined) {
      // Remove the config to indicate infinite session lifetime
      await configRepo.deleteConfig(ConfigKeyEnum.Enum.SESSION_LIFETIME);
    } else {
      await configRepo.setConfig(
        ConfigKeyEnum.Enum.SESSION_LIFETIME,
        lifetime.toString(),
        "Session lifetime in milliseconds before automatic cleanup",
      );
    }
  },

  async getConfig(key: ConfigKey): Promise<string | undefined> {
    const config = await configRepo.getConfig(key);
    return config?.value;
  },

  async setConfig(
    key: ConfigKey,
    value: string,
    description?: string,
  ): Promise<void> {
    await configRepo.setConfig(key, value, description);
  },

  async getAllConfigs(): Promise<
    Array<{ id: string; value: string; description?: string | null }>
  > {
    return await configRepo.getAllConfigs();
  },

  async getAuthProviders(): Promise<
    Array<{ id: string; name: string; enabled: boolean }>
  > {
    const providers = [];

    // Check if OIDC is configured
    const isOidcEnabled = !!(
      process.env.OIDC_CLIENT_ID &&
      process.env.OIDC_CLIENT_SECRET &&
      process.env.OIDC_DISCOVERY_URL
    );

    if (isOidcEnabled) {
      providers.push({
        id: "oidc",
        name: "OIDC",
        enabled: true,
      });
    }

    return providers;
  },
};
