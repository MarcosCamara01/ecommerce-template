export class FulfillmentLeaseLostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfillmentLeaseLostError";
  }
}

export async function persistFailureUnlessLeaseLost(
  persist: () => Promise<void>,
): Promise<boolean> {
  try {
    await persist();
    return true;
  } catch (error) {
    if (error instanceof FulfillmentLeaseLostError) return false;
    throw error;
  }
}
