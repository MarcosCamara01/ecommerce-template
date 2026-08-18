import { readFile } from "node:fs/promises";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
if (!accessToken || !projectRef) {
  throw new Error("SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required");
}

const config = await readFile("supabase/config.toml", "utf8");
const schemasMatch = config.match(/^schemas\s*=\s*(\[[^\n]*\])/m);
if (!schemasMatch) throw new Error("supabase/config.toml has no API schemas allowlist");
const expectedSchemas = JSON.parse(schemasMatch[1]).map(String).sort();

const response = await fetch(
  `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/postgrest`,
  { headers: { Authorization: `Bearer ${accessToken}` } },
);
if (!response.ok) {
  throw new Error(`Supabase Management API returned ${response.status}`);
}
const settings = await response.json();
const actualSchemas = String(settings.db_schema ?? "")
  .split(",")
  .map((schema) => schema.trim())
  .filter(Boolean)
  .sort();

if (JSON.stringify(actualSchemas) !== JSON.stringify(expectedSchemas)) {
  throw new Error(
    `Hosted Data API drift: expected [${expectedSchemas.join(",")}], received [${actualSchemas.join(",")}]`,
  );
}
if (actualSchemas.includes("public") || actualSchemas.includes("app_private")) {
  throw new Error("Application schemas must not be exposed by the hosted Data API");
}

console.log(`Hosted Data API schema allowlist: PASS [${actualSchemas.join(",")}]`);
