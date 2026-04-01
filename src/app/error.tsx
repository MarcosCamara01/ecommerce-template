"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-solid border-border-primary bg-background-secondary p-8 md:p-12">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="my-2 text-muted-foreground">
        There was an issue with our storefront. This could be a temporary issue,
        please try your action again.
      </p>
      <button
        className="mt-4 inline-flex h-11 items-center justify-center rounded-md border border-solid border-border-primary bg-background-tertiary px-6 text-sm font-medium transition-colors hover:bg-border-secondary"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
