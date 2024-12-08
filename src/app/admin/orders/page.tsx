import { getAllOrders } from "./action";
import { format } from "date-fns";
import { OrderDocument } from "@/types/types";

export async function generateMetadata() {
  return {
    title: `Admin Orders | Ecommerce Template`,
  };
}

const AdminOrders = async () => {
  const orders = await getAllOrders();

  if (!orders) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-91px)]">
        <p>Error loading orders</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-91px)]">
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Orders</h1>
      <div className="space-y-6">
        {orders.map((order: OrderDocument) => (
          <div key={order._id.toString()} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-8">
                <div>
                  <span className="text-gray-500">Date: </span>
                  {format(new Date(order.purchaseDate), 'MMM d, yyyy')}
                </div>
                <div>
                  <span className="text-gray-500">Order Total: </span>
                  ${(order.total_price / 100).toFixed(2)}
                </div>
                <div>
                  <span className="text-gray-500">Items: </span>
                  {order.products.reduce((acc, product) => acc + product.quantity, 0)}
                </div>
                <div>
                  <span className="text-gray-500">Order #: </span>
                  {order.orderNumber}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Customer: </span>
                {order.name}
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Products:</h3>
              <div className="space-y-2 text-sm">
                {order.products.map((product, idx) => (
                  <div key={idx} className="border border-gray-100 rounded p-2 flex gap-4">
                    <div className="flex gap-2">
                      <span className="text-gray-500">Product:</span>
                      <span>{product.sku}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500">Quantity:</span>
                      <span>{product.quantity}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500">Color:</span>
                      <span>{product.color}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500">Size:</span>
                      <span>{product.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
