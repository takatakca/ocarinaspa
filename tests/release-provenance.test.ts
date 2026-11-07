import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("stamps the hosting revision, falls back to GitHub and rejects an invalid supplied revision", () => {
  const cwd = mkdtempSync(join(tmpdir(), "ocarina-release-"));
  const script = fileURLToPath(new URL("../scripts/write-release.mjs", import.meta.url));
  mkdirSync(join(cwd, "public"), { recursive: true });
  const env = { ...process.env };
  delete env.SOURCE_COMMIT;
  delete env.GITHUB_SHA;
  const github = "a".repeat(40);
  const source = "B".repeat(40);
  try {
    let result = spawnSync(process.execPath, [script], { cwd, env: { ...env, SOURCE_COMMIT: source, GITHUB_SHA: github }, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(cwd, "public/ocarina-release.json"), "utf8"))).toEqual({ revision: source.toLowerCase() });
    result = spawnSync(process.execPath, [script], { cwd, env: { ...env, GITHUB_SHA: github }, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(cwd, "public/ocarina-release.json"), "utf8"))).toEqual({ revision: github });
    result = spawnSync(process.execPath, [script], { cwd, env: { ...env, SOURCE_COMMIT: "invalid", GITHUB_SHA: github }, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("valid full source commit");
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
