import { Suspense } from "react";

import { fetchCheckoutData } from "@/services/stripe.service";
import { pickFirst } from "@/utils/pickFirst";
import {
  ResultSkeleton,
  NoSessionError,
  StatusContent,
  AutoRefreshStatus,
  SuccessContent,
  FulfilledCheckoutSync,
} from "@/components/checkout";
import { getOrder } from "../orders/action";

export async function generateMetadata() {
  return {
    title: "Purchase Result | Ecommerce Template",
    description: "Result of your purchase in Ecommerce Template by Marcos Camara",
  };
}

type Props = {
  searchParams: Promise<{ session_id: string | undefined }>;
};

async function CheckoutResult({ sessionId }: { sessionId: string }) {
  const result = await fetchCheckoutData(sessionId);

  if (result.status !== "success") {
    return (
      <StatusContent
        status={result.status}
        sessionId={sessionId}
        error={result.error}
      />
    );
  }

  const { session } = result;
  const { outcome } = result;

  if (!outcome || outcome.status !== "fulfilled") {
    return (
      <StatusContent
        status="error"
        sessionId={sessionId}
        error="Fulfillment state is unavailable"
      />
    );
  }

  // The bought pieces dress the page; the outcome stands without them.
  const order = await getOrder(outcome.orderId).catch(() => null);

  return (
    <>
      <AutoRefreshStatus active={outcome.cartCleanup === "pending"} />
      <FulfilledCheckoutSync cartCleanup={outcome.cartCleanup} />
      <SuccessContent
        orderId={outcome.orderId}
        order={order}
        email={session?.customer_details?.email}
        emailStatus={outcome.customerEmail}
      />
    </>
  );
}

async function DynamicCheckoutContent({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const params = await searchParams;
  const sessionId = pickFirst(params, "session_id");

  if (!sessionId) {
    return <NoSessionError />;
  }

  return <CheckoutResult sessionId={sessionId} />;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  return (
    <section>
      <h1 className="sr-only">Purchase result</h1>
      <Suspense fallback={<ResultSkeleton />}>
        <DynamicCheckoutContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
