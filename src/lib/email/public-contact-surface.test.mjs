import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

test("the unused public contact-email surface stays removed", async () => {
  await assert.rejects(
    access(resolve("src/app/api/email/route.ts")),
    (error) => error?.code === "ENOENT",
  );

  const [index, mailer] = await Promise.all([
    readFile("src/lib/email/index.ts", "utf8"),
    readFile("src/lib/email/mailer.ts", "utf8"),
  ]);
  for (const source of [index, mailer]) {
    assert.doesNotMatch(source, /contactEmailSchema|sendContactEmail/);
  }
});
