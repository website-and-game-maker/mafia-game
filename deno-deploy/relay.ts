// Deno Deploy entry point for the Mafia realtime relay.
//
// Deno Deploy supports server-side WebSockets natively (Deno.upgradeWebSocket),
// so the relay handler from valtown/mafia-relay.ts runs as-is. This entry just
// serves it. Locally it binds $PORT (default 8787); on Deno Deploy the platform
// provides the port automatically.
//
// Deploy (from repo root):
//   deployctl deploy --project=<name> --entrypoint=deno-deploy/relay.ts
import handler from "../valtown/mafia-relay.ts";

const port = Number(Deno.env.get("PORT") ?? 8787);
Deno.serve({ port }, handler);
