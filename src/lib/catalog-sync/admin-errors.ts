import { z } from "zod";

export function fieldErrorsFromZod(error: z.ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".") || "form";
    (errors[path] ??= []).push(issue.message);
  }
  return errors;
}

export function variantImageRequiredError(index: number, color: string) {
  return new z.ZodError([
    {
      code: "custom",
      path: ["variants", index, "images"],
      message: `Variant ${color} must include an image`,
    },
  ]);
}
