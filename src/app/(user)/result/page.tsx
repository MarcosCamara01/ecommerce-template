import { Suspense } from "react";

import { fetchCheckoutData } from "@/services/stripe.service";
import { pickFirst } from "@/utils/pickFirst";
import {
  ResultSkeleton,
  NoSessionError,
  StatusContent,
  AutoRefreshStatus,
  SuccessHeader,
  OrderInfo,
  EmailConfirmation,
  DeliveryTimeline,
  ActionButtons,
  FulfilledCheckoutSync,
} from "@/components/checkout";

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

  return (
    <>
      <AutoRefreshStatus active={outcome.cartCleanup === "pending"} />
      <FulfilledCheckoutSync cartCleanup={outcome.cartCleanup} />
      <SuccessHeader />
      <OrderInfo />
      {session?.customer_details?.email && (
        <EmailConfirmation
          email={session.customer_details.email}
          status={outcome.customerEmail}
        />
      )}
      <DeliveryTimeline />
      <ActionButtons orderId={outcome.orderId} />
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <CheckoutResult sessionId={sessionId} />
    </div>
  );
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  return (
    <section className="px-6 py-12 sm:px-8">
      <Suspense fallback={<ResultSkeleton />}>
        <DynamicCheckoutContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
