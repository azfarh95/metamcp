import { describe, expect, it } from "vitest";

import { buildServerMappings, MappingStatus } from "./namespace-server-status";

describe("buildServerMappings", () => {
  it("keeps an INACTIVE server INACTIVE across an update (sentinel-stack#128)", () => {
    const existing = new Map<string, MappingStatus>([
      ["browser-assistant", "INACTIVE"],
      ["memory-mcp", "ACTIVE"],
    ]);
    const rows = buildServerMappings(
      "dove",
      ["browser-assistant", "memory-mcp"],
      existing,
    );
    expect(rows).toEqual([
      {
        namespace_uuid: "dove",
        mcp_server_uuid: "browser-assistant",
        status: "INACTIVE",
      },
      {
        namespace_uuid: "dove",
        mcp_server_uuid: "memory-mcp",
        status: "ACTIVE",
      },
    ]);
  });

  it("starts a newly added server ACTIVE", () => {
    const rows = buildServerMappings("dove", ["new-server"], new Map());
    expect(rows[0].status).toBe("ACTIVE");
  });

  it("drops servers the update no longer lists", () => {
    const existing = new Map<string, MappingStatus>([["gone", "INACTIVE"]]);
    expect(buildServerMappings("dove", [], existing)).toEqual([]);
  });
});
