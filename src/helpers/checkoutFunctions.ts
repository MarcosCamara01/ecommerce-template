import Stripe from "stripe";

export const fetchCheckoutData = async (
  sessionId: string
): Promise<Stripe.Checkout.Session | undefined> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout_sessions?session_id=${sessionId}`
    ).then((res) => res.json());
    return response;
  } catch (err: any) {
    console.error("Error obtaining data:", err.message);
  }
};

async function sendCustomerEmail(data: Stripe.Checkout.Session) {
  const emailCustomer = {
    name: data?.customer_details?.name,
    email: data?.customer_details?.email,
    message:
      "Your purchase has been successfully completed and will be delivered in the next few days.",
    subject: "Successful purchase",
  };

  try {
    const responseCustomer = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email`,
      {
        method: "POST",
        body: JSON.stringify(emailCustomer),
      }
    );

    if (!responseCustomer.ok) {
      throw new Error(`response status: ${responseCustomer.status}`);
    } else {
      console.log("Customer's email successfully sent");
    }
  } catch (err) {
    console.error("Error sending customer's email:", err);
    throw err;
  }
}

async function sendOwnerEmail(data: Stripe.Checkout.Session) {
  const emailOwner = {
    name: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
    email: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
    message: `${data?.customer_details?.name} has made a new purchase, his/her email is: ${data?.customer_details?.email}`,
    subject: "A new purchase",
  };

  try {
    const responseEmailOwner = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email`,
      {
        method: "POST",
        body: JSON.stringify(emailOwner),
      }
    );

    if (!responseEmailOwner.ok) {
      throw new Error(`response status: ${responseEmailOwner.status}`);
    } else {
      console.log("Owner's email sent correctly");
    }
  } catch (err) {
    console.error("Error sending owner's email:", err);
    throw err;
  }
}

export const sendEmail = async (data: Stripe.Checkout.Session) => {
  try {
    await sendCustomerEmail(data);
    await sendOwnerEmail(data);
  } catch (err) {
    console.error(err);
  }
};
