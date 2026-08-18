import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const DATABASE_TARGETS = [
  /^src\/lib\/db\/drizzle\/connection(?:\.|\/|$)/,
  /^src\/lib\/db\/drizzle\/repositories(?:\.|\/|$)/,
  /^src\/lib\/db\/supabase(?:\.|\/|$)/,
  /^src\/lib\/data-access\/catalog-(?:sync|preparation)\.repository(?:\.|$)/,
];
const SCHEMA_TARGET = /^src\/lib\/db\/drizzle\/schema(?:\.|\/|$)/;
const RAW_CATALOG_TARGET =
  /^src\/lib\/data-access\/catalog-(?:sync|preparation)\.repository(?:\.|$)/;
const ALLOWED_DATABASE_IMPORTERS = [
  /^src\/lib\/data-access\//,
  /^src\/lib\/db\/drizzle\/connection\.ts$/,
  /^src\/lib\/db\/drizzle\/repositories\//,
  /^src\/lib\/db\/drizzle\/schema\//,
  /^src\/utils\/auth\.ts$/,
];
const PRINCIPAL_AUTHORITY_IMPORTERS = new Set([
  "src/lib/identity/core.test.mjs",
  "src/lib/identity/index.ts",
  "src/lib/identity/server.ts",
  "src/lib/order-fulfillment/system-principal.ts",
  "src/lib/order-fulfillment/system-principal.test.mjs",
]);
const SYSTEM_PRINCIPAL_IMPORTERS = new Set([
  "src/app/api/cron/fulfillment/route.ts",
  "src/app/api/stripe/webhooks/route.ts",
  "src/lib/order-fulfillment/index.ts",
  "src/lib/order-fulfillment/system-principal.test.mjs",
]);

const normalizePath = (value) => value.split(sep).join("/");
const withoutExtension = (value) => value.replace(/\.(?:ts|tsx|js|mjs)$/, "");

export function extractModuleSpecifiers(source, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

export function extractRuntimeImportNames(
  source,
  requestedSpecifier,
  fileName = "source.ts",
) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const names = [];
  for (const node of sourceFile.statements) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === requestedSpecifier
    ) {
      const clause = node.importClause;
      if (!clause) names.push("*");
      else if (!clause.isTypeOnly) {
        if (clause.name) names.push("*");
        if (clause.namedBindings) {
          if (ts.isNamespaceImport(clause.namedBindings)) names.push("*");
          else {
            for (const element of clause.namedBindings.elements) {
              if (!element.isTypeOnly) {
                names.push((element.propertyName ?? element.name).text);
              }
            }
          }
        }
      }
    }
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === requestedSpecifier &&
      !node.isTypeOnly
    ) {
      if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) {
        names.push("*");
      } else {
        for (const element of node.exportClause.elements) {
          if (!element.isTypeOnly) {
            names.push((element.propertyName ?? element.name).text);
          }
        }
      }
    }
  }
  const dynamicPattern = new RegExp(
    String.raw`(?:import|require)\(\s*["']${requestedSpecifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']\s*\)`,
  );
  if (dynamicPattern.test(source)) names.push("*");
  return names;
}

export function resolveWorkspaceImport(importer, specifier, projectRoot) {
  let target;
  if (specifier.startsWith("@/")) {
    target = resolve(projectRoot, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    target = resolve(dirname(importer), specifier);
  } else {
    return null;
  }
  return normalizePath(relative(projectRoot, target));
}

export function findViolationsInSource({
  importer,
  source,
  projectRoot,
}) {
  const importerPath = normalizePath(relative(projectRoot, importer));
  const isTest = /\.(?:test|spec)\.(?:ts|tsx|js|mjs)$/.test(importerPath);
  const violations = [];
  for (const specifier of extractModuleSpecifiers(source, importerPath)) {
    const target = resolveWorkspaceImport(importer, specifier, projectRoot);
    if (!target) continue;
    const targetModule = withoutExtension(target);
    if (!isTest && RAW_CATALOG_TARGET.test(target)) {
      const allowedRawImporter =
        (targetModule === "src/lib/data-access/catalog-sync.repository" &&
          importerPath === "src/lib/catalog-sync/service.ts") ||
        (targetModule === "src/lib/data-access/catalog-preparation.repository" &&
          importerPath === "src/lib/data-access/catalog-sync.repository.ts");
      if (!allowedRawImporter) violations.push(importerPath);
    } else if (
      !isTest &&
      !ALLOWED_DATABASE_IMPORTERS.some((pattern) => pattern.test(importerPath)) &&
      DATABASE_TARGETS.some((pattern) => pattern.test(target))
    ) {
      violations.push(importerPath);
    }
    if (
      !isTest &&
      !ALLOWED_DATABASE_IMPORTERS.some((pattern) => pattern.test(importerPath)) &&
      SCHEMA_TARGET.test(target)
    ) {
      const runtimeNames = extractRuntimeImportNames(
        source,
        specifier,
        importerPath,
      );
      if (
        runtimeNames.some((name) =>
          name === "*" || !(name.endsWith("Schema") || name.endsWith("Zod"))
        )
      ) {
        violations.push(`${importerPath} (Drizzle schema object import)`);
      }
    }
    if (
      targetModule === "src/lib/identity/principal-authority" &&
      !PRINCIPAL_AUTHORITY_IMPORTERS.has(importerPath)
    ) {
      violations.push(`${importerPath} (Principal authority import)`);
    }
    if (
      targetModule === "src/lib/order-fulfillment/system-principal" &&
      !SYSTEM_PRINCIPAL_IMPORTERS.has(importerPath)
    ) {
      violations.push(`${importerPath} (System Principal factory import)`);
    }
  }
  return [...new Set(violations)];
}

export function findArchitectureViolations(projectRoot = process.cwd()) {
  const sourceRoot = join(projectRoot, "src");
  const violations = [];
  for (const file of walk(sourceRoot)) {
    violations.push(...findViolationsInSource({
      importer: file,
      source: readFileSync(file, "utf8"),
      projectRoot,
    }));
  }
  return [...new Set(violations)];
}

function* walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if ([".ts", ".tsx", ".js", ".mjs"].includes(extname(path))) yield path;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const violations = findArchitectureViolations();
  if (violations.length) {
    console.error("Forbidden database access paths:\n" + violations.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Architecture boundary: PASS");
  }
}
