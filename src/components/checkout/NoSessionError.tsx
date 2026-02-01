import { HiOutlineXCircle } from "react-icons/hi";

export function NoSessionError() {
  return (
    <section className="py-16 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
          <div className="flex items-center gap-3 mb-4">
            <HiOutlineXCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              No Session ID Found
            </h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Please make sure you accessed this page after completing a purchase.
          </p>
        </div>
      </div>
    </section>
  );
}
