import { fetchCheckoutData } from "@/services/stripe.service";
import { pickFirst } from "@/utils/pickFirst";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMail,
  HiOutlineTruck,
  HiOutlineShoppingBag,
  HiOutlineClock,
} from "react-icons/hi";

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

const CheckoutSuccess = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const sessionId = pickFirst(params, "session_id");

  if (!sessionId) {
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
              Please make sure you accessed this page after completing a
              purchase.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const response = await fetchCheckoutData(sessionId);
  const isSuccess =
    response !== undefined && response.metadata && response.customer_details;

  return (
    <section className="py-12 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {isSuccess ? (
          <>
            {/* Success Header */}
            <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <div className="flex items-center gap-3 mb-3">
                <HiOutlineCheckCircle className="w-8 h-8 text-green-500" />
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Payment Successful!
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Thank you for your purchase. Your order has been confirmed and
                will be processed shortly.
              </p>
            </div>

            {/* Order Details */}
            <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
                <HiOutlineShoppingBag className="w-5 h-5" />
                Order Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-500">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
                <HiOutlineMail className="w-5 h-5" />
                Email Confirmation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <HiOutlineMail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium break-all">
                    {response.customer_details?.email}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to the address above with
                  your order details and receipt.
                </p>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <h3 className="flex items-center gap-2 mb-4 text-lg font-bold">
                <HiOutlineTruck className="w-5 h-5" />
                Delivery Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <HiOutlineClock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Expected Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Your order will be processed and delivered within 7
                      business days.
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-primary">
                  <p className="text-xs text-muted-foreground">
                    You will receive tracking information via email once your
                    order has been shipped.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Error Header */}
            <div className="p-6 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <div className="flex items-center gap-3 mb-3">
                <HiOutlineXCircle className="w-8 h-8 text-red-500" />
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Payment Failed
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                We encountered an issue while processing your payment. Please
                try again or contact support if the problem persists.
              </p>
            </div>

            {/* What to do next */}
            <div className="p-4 border border-solid rounded-lg bg-background-secondary border-border-primary">
              <h3 className="mb-4 text-lg font-bold">What to do next</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-background-tertiary text-color-secondary">
                    1
                  </span>
                  <span>Check your email for any payment notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-background-tertiary text-color-secondary">
                    2
                  </span>
                  <span>
                    Verify your payment method is valid and has sufficient funds
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-background-tertiary text-color-secondary">
                    3
                  </span>
                  <span>Try placing the order again</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-background-tertiary text-color-secondary">
                    4
                  </span>
                  <span>Contact our support team if the issue persists</span>
                </li>
              </ul>
            </div>

            {/* Support Info */}
            <div className="p-4 border border-solid rounded-lg bg-background-tertiary border-border-primary">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-bold">
                <HiOutlineMail className="w-4 h-4" />
                Need Help?
              </h3>
              <p className="text-sm text-muted-foreground">
                Our support team is here to help. Please contact us with your
                session ID for faster assistance.
              </p>
              {sessionId && (
                <div className="mt-3 pt-3 border-t border-border-primary">
                  <p className="text-xs text-999">
                    Session ID:{" "}
                    <span className="text-color-secondary font-mono">
                      {sessionId}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default CheckoutSuccess;

