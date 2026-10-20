// Server-mapping rows for a namespace update, keeping each server's existing
// status. update() deletes and re-inserts every mapping; without this, a
// routine namespace edit (rename, add a server) flips every INACTIVE server
// back to ACTIVE. That is how browser-assistant returned to Dove's namespace
// after its documented removal (sentinel-stack#128).
export type MappingStatus = "ACTIVE" | "INACTIVE";

export function buildServerMappings(
  namespaceUuid: string,
  serverUuids: string[],
  existingStatus: Map<string, MappingStatus>,
): {
  namespace_uuid: string;
  mcp_server_uuid: string;
  status: MappingStatus;
}[] {
  return serverUuids.map((serverUuid) => ({
    namespace_uuid: namespaceUuid,
    mcp_server_uuid: serverUuid,
    // A server new to this namespace starts ACTIVE, as before.
    status: existingStatus.get(serverUuid) ?? "ACTIVE",
  }));
}
