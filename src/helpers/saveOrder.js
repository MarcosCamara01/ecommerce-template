import axios from "axios";

export const saveOrder = async (data, setHasSavedOrder) => {
    const userId = data.metadata?.userId;
    const products = data.metadata?.products ? JSON.parse(data.metadata.products) : [];
    const newOrder = {
      name: data.customer_details?.name || "",
      email: data.customer_details?.email || "",
      phone: data.customer_details?.phone || "",
      address: {
        line1: data.customer_details?.address?.line1 || "",
        line2: data.customer_details?.address?.line2 || "",
        city: data.customer_details?.address?.city || "",
        state: data.customer_details?.address?.state || "",
        postal_code: data.customer_details?.address?.postal_code || "",
        country: data.customer_details?.address?.country || "",
      },
      products: products,
      orderId: data.id,
    };

    try {
      const response = await axios.get(`/api/orders`);
      const userOrders = response.data.find((order) => order.userId === userId);

      if (userOrders) {
        const orderIdMatch = userOrders.orders.some(order => order.orderId === data.id);
        if (!orderIdMatch) {
          const updatedOrders = [...userOrders.orders, newOrder];
          const response = await axios.put(`/api/orders?id=${userOrders._id}`, {
            orders: updatedOrders,
          });
          console.log("Pedidos actualizados con éxito", response);
        } else {
          console.log("Ya se ha guardado este pedido");
        }
      } else {
        const updatedOrders = [newOrder];
        const response = await axios.post('/api/orders', {
          userId: userId,
          order: updatedOrders,
        });
        console.log("Pedido creado y guardado con éxito", response);
      }

      setHasSavedOrder(true);
    } catch (error) {
      console.error('Error al guardar la orden:', error);
    }
  };
