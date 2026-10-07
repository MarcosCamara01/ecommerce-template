import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import braces from "braces";

const require = createRequire(import.meta.url);
const installedDirectory = dirname(require.resolve("braces/package.json"));

test("the installed dependency contains the reviewed depth guards", () => {
  const manifest = require("braces/package.json");
  assert.equal(manifest.name, "@ecommerce-template/braces-depth-safe");
  assert.equal(manifest.private, true);
  const provenance = JSON.parse(
    readFileSync(new URL("../../vendor/braces/provenance.json", import.meta.url)),
  );
  for (const file of provenance.files) {
    const digest = createHash("sha256")
      .update(readFileSync(join(installedDirectory, file.name)))
      .digest("hex");
    assert.equal(digest, file.patchedSha256, file.name);
  }
});

test("ordinary patterns retain the callable, expansion and stringify contracts", () => {
  assert.equal(typeof braces, "function");
  for (const method of ["parse", "compile", "expand", "stringify", "create"]) {
    assert.equal(typeof braces[method], "function", method);
  }
  assert.deepEqual(braces.expand("src/**/*.{ts,tsx}"), ["src/**/*.ts", "src/**/*.tsx"]);
  assert.deepEqual(braces.expand("{01..03}"), ["01", "02", "03"]);
  assert.deepEqual(braces.expand("a{b,{c,d}}e"), ["abe", "ace", "ade"]);
  assert.deepEqual(braces(["{a,b}", "{a,b}"], { expand: true, nodupes: true }), ["a", "b"]);
  assert.equal(braces.stringify("{1..8}", { escapeInvalid: true }), "{1..8}");
});

for (const method of ["parse", "compile", "expand", "stringify"]) {
  test(`${method} accepts the supported nesting boundary and rejects excessive depth`, () => {
    for (const [open, close] of [["{", "}"], ["(", ")"]]) {
      assert.doesNotThrow(() => braces[method](open.repeat(100) + "a,b" + close.repeat(100)));
      const excessive = open.repeat(101) + "a,b" + close.repeat(101);
      for (const options of [{}, { maxDepth: 1000 }, { maxDepth: Infinity }]) {
        assert.throws(() => braces[method](excessive, options), /exceeds max depth/);
      }
    }
  });
}

test("a stricter fractional depth limit remains effective", () => {
  assert.doesNotThrow(() => braces.parse("{a,b}", { maxDepth: 1.5 }));
  assert.throws(() => braces.parse("{{a,b},c}", { maxDepth: 1.5 }), /exceeds max depth/);
});

for (const method of ["compile", "expand", "stringify"]) {
  test(`${method} also guards caller-supplied syntax trees`, () => {
    let node = { type: "text", value: "a" };
    for (let depth = 0; depth < 101; depth++) node = { type: "brace", nodes: [node] };
    assert.throws(() => braces[method]({ type: "root", nodes: [node] }), /exceeds max depth/);
  });
}

test("parent cycles terminate with a controlled error", () => {
  const child = spawnSync(process.execPath, ["--max-old-space-size=64", "--input-type=module", "-e", `
    import braces from "braces";
    const node = { type: "paren", nodes: [{ type: "text", value: "a" }] };
    node.parent = node;
    try { braces.expand(node); process.exitCode = 1; }
    catch (error) { process.stdout.write(error.message); }
  `], { cwd: process.cwd(), timeout: 2000, encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr || child.error?.message);
  assert.match(child.stdout, /parent chain contains a cycle/);
});
