"use client";

import Link from "next/link";
import { Suspense } from "react";

function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page not found</h2>
      <p className="text-gray-600 text-center mb-8">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense>
      <NotFoundContent />
    </Suspense>
  );
}
