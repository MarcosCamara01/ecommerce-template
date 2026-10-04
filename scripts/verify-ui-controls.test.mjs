import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const wrappers = {
  input: "src/components/ui/input.tsx",
  select: "src/components/ui/native-select.tsx",
  textarea: "src/components/ui/textarea.tsx",
};

function findRawControls(source, fileName) {
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const violations = [];
  function visit(node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName)
    ) {
      const tag = node.tagName.text;
      if (
        Object.hasOwn(wrappers, tag) &&
        fileName !== wrappers[tag] &&
        !(tag === "input" && isFileInput(node))
      ) {
        const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
        violations.push({ fileName, line: line + 1, tag });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return violations;
}

function isFileInput(node) {
  let type;
  for (const property of node.attributes.properties) {
    if (ts.isJsxSpreadAttribute(property)) type = undefined;
    else if (property.name.getText() === "type") {
      const value = property.initializer && ts.isJsxExpression(property.initializer)
        ? property.initializer.expression
        : property.initializer;
      type = value && ts.isStringLiteralLike(value) ? value.text : undefined;
    }
  }
  return type === "file";
}

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!["__tests__", "__fixtures__"].includes(entry.name)) yield* sourceFiles(path);
    } else if (
      [".ts", ".tsx", ".js", ".jsx", ".mjs"].includes(extname(path)) &&
      !/\.(?:test|spec)\./.test(entry.name)
    ) {
      yield path;
    }
  }
}

test("AST guard catches native controls while ignoring components, comments and strings", () => {
  const violations = findRawControls(`
    const example = "<input />";
    const view = <>
      <Input />{/* <textarea /> */}
      <input type="hidden" />
      <select><option>Sort</option></select>
      <textarea />
      <input type={kind} />
      <input type />
    </>;
  `, "src/components/example.tsx");
  assert.deepEqual(violations.map(({ tag }) => tag), ["input", "select", "textarea", "input", "input"]);
});

test("AST guard permits only each matching primitive and definite file inputs", () => {
  for (const [tag, fileName] of Object.entries(wrappers)) {
    assert.deepEqual(findRawControls(`<${tag} />`, fileName), []);
  }
  assert.deepEqual(findRawControls('<input type="file" /><input type={"file"} />', "src/components/upload.tsx"), []);
  assert.equal(findRawControls('<input type="file" {...props} />', "src/components/upload.tsx").length, 1);
  assert.equal(findRawControls("<select />", wrappers.input).length, 1);
});

test("production JSX form controls use shared UI primitives except file uploads", () => {
  const violations = Array.from(sourceFiles(join(projectRoot, "src"))).flatMap((path) =>
    findRawControls(readFileSync(path, "utf8"), relative(projectRoot, path).split(sep).join("/")),
  );
  assert.deepEqual(
    violations,
    [],
    "Use Input, NativeSelect or Textarea instead of raw controls:\n" +
      violations.map(({ fileName, line, tag }) => `${fileName}:${line} <${tag}>`).join("\n"),
  );
});
