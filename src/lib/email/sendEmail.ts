import "server-only";

import type { OrderWithDetails } from "@/lib/db/drizzle/schema";

import { escapeHtml, getContactEmailAddress, sendMail } from "./mailer";

type OrderDetails = OrderWithDetails;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatOrderDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAddress(address: OrderDetails["customerInfo"]["address"]) {
  return [
    address.line1,
    address.line2,
    address.city,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .map((part) => escapeHtml(part))
    .join(", ");
}

function formatOrderEmail(orderDetails: OrderDetails): string {
  const totalPrice = formatCurrency(orderDetails.customerInfo.totalPrice / 100);
  const deliveryDate = formatOrderDate(orderDetails.deliveryDate);

  const productsHtml = orderDetails.orderProducts
    .map(({ quantity, size, variant }) => {
      const unitPrice = variant.product.price;

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${escapeHtml(variant.product.name)}</strong><br/>
            <small>Color: ${escapeHtml(variant.color)} | Size: ${escapeHtml(size)}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            ${formatCurrency(unitPrice)}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            <strong>${formatCurrency(unitPrice * quantity)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your purchase!</h2>
      <p>Hello <strong>${escapeHtml(orderDetails.customerInfo.name)}</strong>,</p>
      <p>Your order has been confirmed and will be delivered approximately on <strong>${deliveryDate}</strong>.</p>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Order Details</h3>
        <p><strong>Order Number:</strong> #${orderDetails.orderNumber}</p>
        <p><strong>Order Date:</strong> ${formatOrderDate(orderDetails.createdAt)}</p>
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
              <strong>${totalPrice}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #333;">Delivery Address</h3>
        <p>${formatAddress(orderDetails.customerInfo.address)}</p>
        ${
          orderDetails.customerInfo.phone
            ? `<p><strong>Phone:</strong> ${escapeHtml(orderDetails.customerInfo.phone)}</p>`
            : ""
        }
      </div>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you have any questions about your order, please do not hesitate to contact us.
      </p>
    </div>
  `;
}

function formatOwnerEmail(orderDetails: OrderDetails): string {
  const productsCount = orderDetails.orderProducts.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const productsDetails = orderDetails.orderProducts
    .map(
      ({ quantity, size, variant }) =>
        `- ${escapeHtml(variant.product.name)} (${escapeHtml(variant.color)}, Size: ${escapeHtml(size)}) x${quantity}`,
    )
    .join("<br />");

  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Order Received!</h2>
      <p><strong>Customer:</strong> ${escapeHtml(orderDetails.customerInfo.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(orderDetails.customerInfo.email)}</p>
      <p><strong>Order Number:</strong> #${orderDetails.orderNumber}</p>
      <p><strong>Total:</strong> ${formatCurrency(orderDetails.customerInfo.totalPrice / 100)}</p>
      <p><strong>Number of Products:</strong> ${productsCount}</p>

      <h3>Products:</h3>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${productsDetails}</div>

      <h3>Shipping Address:</h3>
      <p>
        ${formatAddress(orderDetails.customerInfo.address)}<br/>
        ${
          orderDetails.customerInfo.phone
            ? `Phone: ${escapeHtml(orderDetails.customerInfo.phone)}`
            : ""
        }
      </p>
    </div>
  `;
}

async function sendCustomerEmail(orderDetails: OrderDetails) {
  if (!orderDetails.customerInfo.email) {
    console.warn("Skipping customer email: missing customer email address");
    return;
  }

  await sendMail({
    to: orderDetails.customerInfo.email,
    subject: "Order Confirmation - Purchase Receipt",
    html: formatOrderEmail(orderDetails),
  });
}

async function sendOwnerEmail(orderDetails: OrderDetails) {
  await sendMail({
    to: getContactEmailAddress(),
    subject: `New Order #${orderDetails.orderNumber}`,
    replyTo: orderDetails.customerInfo.email || undefined,
    html: formatOwnerEmail(orderDetails),
  });
}

export const sendEmail = async (orderDetails: OrderDetails) => {
  const results = await Promise.allSettled([
    sendCustomerEmail(orderDetails),
    sendOwnerEmail(orderDetails),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Error sending order email:", result.reason);
    }
  }
};

export type { OrderDetails };
