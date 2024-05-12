import { fetchCheckoutData, sendEmail } from "@/helpers/checkoutFunctions";
import { saveOrder } from "../orders/action";

export async function generateMetadata() {
  return {
    title: "Purchase Result | Ecommerce Template",
    description:
      "Result of the purchase in the test ecommerce created by Marcos Cámara",
  };
}

const CheckoutSuccess = async ({
  searchParams,
}: {
  searchParams: { [session_id: string]: string };
}) => {
  const response = await fetchCheckoutData(searchParams.session_id);

  if (response !== undefined && response.metadata) {
    await saveOrder(response);
    await sendEmail(response);
  }

  return (
    <section className="pt-12">
      <div className="flex flex-col gap-2">
        {response !== undefined &&
        response.metadata &&
        response.customer_details ? (
          <>
            <h1 className="mb-3 text-xl font-bold sm:text-2xl">
              Checkout Payment Result
            </h1>
            <h3 className="text-lg font-semibold">Successful payment</h3>
            <p>{`An email has been sent to you at: ${response.customer_details.email}`}</p>
          </>
        ) : (
          <h1>An error has occurred.</h1>
        )}
      </div>
    </section>
  );
};

export default CheckoutSuccess;
