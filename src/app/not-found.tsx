import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4">
      <div className="w-full rounded-lg border border-solid border-border-primary bg-background-secondary p-8 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          404
        </p>
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Page not found</h1>
        <p className="mb-8 text-sm text-muted-foreground sm:text-base">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-solid border-border-primary bg-background-tertiary px-6 text-sm font-medium transition-colors hover:bg-border-secondary"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
