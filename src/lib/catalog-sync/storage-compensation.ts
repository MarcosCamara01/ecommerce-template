export async function removeStorageObjectOrThrow(
  path: string,
  remove: (paths: string[]) => Promise<{ error: unknown | null }>,
) {
  const { error } = await remove([path]);
  if (error) throw error;
}
