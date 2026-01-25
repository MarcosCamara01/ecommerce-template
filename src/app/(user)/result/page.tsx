import { Suspense } from "react";
import { fetchCheckoutData } from "@/services/stripe.service";
import { pickFirst } from "@/utils/pickFirst";
import {
  ResultSkeleton,
  NoSessionError,
  StatusContent,
  SuccessHeader,
  OrderInfo,
  EmailConfirmation,
  DeliveryTimeline,
  ActionButtons,
} from "@/components/checkout";

export async function generateMetadata() {
  return {
    title: "Purchase Result | Ecommerce Template",
    description:
      "Result of the purchase in the test ecommerce created by Marcos Cámara",
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

  return (
    <>
      <SuccessHeader />
      <OrderInfo />
      {session?.customer_details?.email && (
        <EmailConfirmation email={session.customer_details.email} />
      )}
      <DeliveryTimeline />
      <ActionButtons />
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
    <div className="max-w-3xl mx-auto space-y-6">
      <CheckoutResult sessionId={sessionId} />
    </div>
  );
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  return (
    <section className="py-12 px-6 sm:px-8">
      <Suspense fallback={<ResultSkeleton />}>
        <DynamicCheckoutContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
