import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = await readFile(new URL("./SearchDialog.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;

function loadSearchInput() {
  const navigations = [];
  let stateCalls = 0;
  const modules = {
    react: {
      useState: () => [stateCalls++ === 0 ? "shirt" : 0, () => {}],
      useId: () => "qa-list",
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { useRouter: () => ({ push: (path) => navigations.push(path) }) },
    "next/image": { default: "img" },
    "next/link": { default: "a" },
    "@radix-ui/react-dialog": { Close: "button" },
    "@/utils/product-name": { displayName: (value) => value },
    "@/components/icons": { ArrowRightIcon: "svg", SearchIcon: "svg" },
    "@/constants/navigation": { shopSections: [] },
    "@/constants/colors": { swatchBackground: () => "" },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
    "@/utils/formatters": { formatPriceFromEuros: String },
    "@/utils/search": { searchProducts: () => [] },
    "./search-ui": {
      rememberSearch: () => {},
      setSearchOpen: () => {},
      useRecentSearches: () => [],
    },
  };
  const panelModule = { exports: {} };
  new Function("require", "module", "exports", `${compiled}\nexports.qaPanel = SearchPanel;`)(
    (id) => modules[id] ?? require(id), panelModule, panelModule.exports,
  );
  const panel = panelModule.exports.qaPanel({ catalog: [] });
  const input = panel.props.children[0].props.children.find((child) => child.type === "input");
  return { input, navigations };
}

test("search Enter leaves IME composition to the input", () => {
  const { input, navigations } = loadSearchInput();
  let prevented = false;
  input.props.onKeyDown({
    key: "Enter",
    nativeEvent: { isComposing: true },
    preventDefault: () => { prevented = true; },
  });
  assert.deepEqual(navigations, []);
  assert.equal(prevented, false);
});

test("ordinary search Enter still opens the results", () => {
  const { input, navigations } = loadSearchInput();
  let prevented = false;
  input.props.onKeyDown({
    key: "Enter",
    nativeEvent: { isComposing: false },
    preventDefault: () => { prevented = true; },
  });
  assert.deepEqual(navigations, ["/search?q=shirt"]);
  assert.equal(prevented, true);
});
