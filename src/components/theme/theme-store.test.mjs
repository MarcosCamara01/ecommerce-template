import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { THEME_STORAGE_KEY, themeInitScript } from "../../lib/theme/index.ts";

const source = await readFile(new URL("./theme-store.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function themeEnvironment(stored, { blocked = false, systemDark = false } = {}) {
  const classes = new Set();
  const listeners = new Set();
  const media = {
    matches: systemDark,
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  const context = {
    document: {
      documentElement: {
        classList: {
          contains: (value) => classes.has(value),
          toggle: (value, on) => on ? classes.add(value) : classes.delete(value),
        },
      },
    },
    localStorage: {
      getItem: () => {
        if (blocked) throw new Error("Storage blocked");
        return stored;
      },
    },
    matchMedia: () => media,
  };
  vm.runInNewContext(themeInitScript, context);
  return { context, classes, media, listeners };
}

function subscribeToTheme(environment) {
  let unsubscribe;
  const themeModule = { exports: {} };
  const modules = {
    react: {
      useSyncExternalStore: (subscribe, snapshot) => {
        unsubscribe = subscribe(() => {});
        return snapshot();
      },
    },
    "@/lib/theme": { THEME_STORAGE_KEY },
  };
  vm.runInNewContext(compiled, {
    ...environment.context,
    module: themeModule,
    exports: themeModule.exports,
    require: (id) => modules[id],
  });
  themeModule.exports.useTheme();
  return () => unsubscribe();
}

test("theme initialization follows the OS when storage is blocked", () => {
  const { classes } = themeEnvironment(null, { blocked: true, systemDark: true });
  assert.equal(classes.has("dark"), true);
});

test("stored light and dark themes take precedence over the OS", () => {
  const light = themeEnvironment("light", { systemDark: true });
  const dark = themeEnvironment("dark", { systemDark: false });
  assert.equal(light.classes.has("dark"), false);
  assert.equal(dark.classes.has("dark"), true);
});

test("invalid stored themes keep following OS changes and clean up listeners", () => {
  const environment = themeEnvironment("invalid");
  const unsubscribe = subscribeToTheme(environment);
  try {
    environment.media.matches = true;
    for (const listener of environment.listeners) listener();
    assert.equal(environment.classes.has("dark"), true);
  } finally {
    unsubscribe();
  }
  assert.equal(environment.listeners.size, 0);
});

test("an explicit stored theme ignores subsequent OS changes", () => {
  const environment = themeEnvironment("light");
  const unsubscribe = subscribeToTheme(environment);
  try {
    environment.media.matches = true;
    for (const listener of environment.listeners) listener();
    assert.equal(environment.classes.has("dark"), false);
  } finally {
    unsubscribe();
  }
});
