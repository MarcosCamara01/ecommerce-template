export function readImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), {
      once: true,
    });
    reader.addEventListener(
      "error",
      () => reject(new Error("Image preview could not be read")),
      { once: true },
    );
    reader.readAsDataURL(file);
  });
}

export async function pairImagePreviews(
  files: readonly File[],
  readPreview: (file: File) => Promise<string> = readImagePreview,
) {
  const previews = await Promise.all(files.map(readPreview));
  return files.map((file, index) => ({ file, preview: previews[index] }));
}
