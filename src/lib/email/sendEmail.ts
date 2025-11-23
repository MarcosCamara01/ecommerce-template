import Stripe from "stripe";
import { CustomerInfo, OrderItem, OrderProduct } from "@/schemas";
import { getAllProducts } from "@/app/actions";

type OrderDetails = {
  order: OrderItem;
  customer_info: CustomerInfo;
  products: OrderProduct[];
};

/**
 * Format order details for email
 */
async function formatOrderEmail(orderDetails: OrderDetails): Promise<string> {
  const { order, customer_info, products } = orderDetails;

  const allProducts = await getAllProducts();

  const totalPrice = (customer_info.total_price / 100).toFixed(2);
  const deliveryDate = new Date(order.delivery_date).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  let productsHtml = products
    .map((item) => {
      const product = allProducts.find((p) =>
        p.variants.some((v) => v.id === item.variant_id)
      );
      const variant = product?.variants.find((v) => v.id === item.variant_id);

      if (!variant || !product) {
        return null;
      }

      const subtotal = (product.price * item.quantity).toFixed(2);

      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${product?.name}</strong><br/>
          <small>Color: ${variant.color} | Size: ${item.size}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ${product.price.toFixed(2)}€
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          <strong>${subtotal}€</strong>
        </td>
      </tr>
    `;
    })
    .join("");

  const address = customer_info.address;
  const fullAddress = [
    address.line1,
    address.line2,
    address.city,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your purchase!</h2>
      <p>Hello <strong>${customer_info.name}</strong>,</p>
      <p>Your order has been confirmed and will be delivered approximately on <strong>${deliveryDate}</strong>.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Order Details</h3>
        <p><strong>Order Number:</strong> #${order.order_number}</p>
        <p><strong>Order Date:</strong> ${new Date(
          order.created_at
        ).toLocaleDateString("en-US")}</p>
      </div>

      <h3 style="color: #333;">Products</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;">
              <strong>Total:</strong>
            </td>
            <td style="padding: 15px; text-align: right; font-size: 18px;">
              <strong>${totalPrice}€</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Delivery Address</h3>
        <p>${fullAddress}</p>
        ${
          customer_info.phone
            ? `<p><strong>Phone:</strong> ${customer_info.phone}</p>`
            : ""
        }
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you have any questions about your order, please don't hesitate to contact us.
      </p>
    </div>
  `;
}

async function sendCustomerEmail(
  data: Stripe.Checkout.Session,
  orderDetails: OrderDetails
) {
  const message = await formatOrderEmail(orderDetails);

  const emailCustomer = {
    name: data?.customer_details?.name,
    email: data?.customer_details?.email,
    message,
    subject: "Order Confirmation - Purchase Receipt",
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

async function sendOwnerEmail(
  data: Stripe.Checkout.Session,
  orderDetails: OrderDetails
) {
  const customerInfo = orderDetails.customer_info;
  const totalPrice = (customerInfo.total_price / 100).toFixed(2);
  const productsCount = orderDetails.products.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const allProducts = await getAllProducts();

  const productsDetails = orderDetails.products
    .map((item) => {
      const product = allProducts.find((p) =>
        p.variants.some((v) => v.id === item.variant_id)
      );
      const variant = product?.variants.find((v) => v.id === item.variant_id);

      if (!variant || !product) {
        return null;
      }

      return `- ${product.name} (${variant.color}, Size: ${item.size}) x${item.quantity}`;
    })
    .join("\n");

  const message = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Order Received!</h2>
      <p><strong>Customer:</strong> ${data?.customer_details?.name}</p>
      <p><strong>Email:</strong> ${data?.customer_details?.email}</p>
      <p><strong>Order Number:</strong> #${orderDetails.order.order_number}</p>
      <p><strong>Total:</strong> ${totalPrice}€</p>
      <p><strong>Number of Products:</strong> ${productsCount}</p>
      
      <h3>Products:</h3>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${productsDetails}</pre>
      
      <h3>Shipping Address:</h3>
      <p>
        ${customerInfo.address.line1 || ""}<br/>
        ${
          customerInfo.address.line2 ? customerInfo.address.line2 + "<br/>" : ""
        }
        ${customerInfo.address.city || ""}, ${
    customerInfo.address.postal_code || ""
  } ${customerInfo.address.country || ""}<br/>
        ${customerInfo.phone ? "Phone: " + customerInfo.phone : ""}
      </p>
    </div>
  `;

  const emailOwner = {
    name: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
    email: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
    message: message,
    subject: `New Order #${orderDetails.order.order_number}`,
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

export const sendEmail = async (
  data: Stripe.Checkout.Session,
  orderDetails: OrderDetails
) => {
  try {
    await sendCustomerEmail(data, orderDetails);
    await sendOwnerEmail(data, orderDetails);
  } catch (err) {
    console.error(err);
  }
};

export type { OrderDetails };
