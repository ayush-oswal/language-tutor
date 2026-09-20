import { build } from "esbuild";
import { readdirSync, rmSync } from "node:fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: "dist/index.js",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@modelcontextprotocol/sdk", "zod"],
});

// `tsc -b` (the typecheck step) emits its own per-file output into dist/ as a
// side effect of composite project builds — the bundle above is the only
// thing we actually ship, so clear out everything else.
for (const entry of readdirSync("dist")) {
  if (entry !== "index.js") rmSync(`dist/${entry}`, { recursive: true, force: true });
}
