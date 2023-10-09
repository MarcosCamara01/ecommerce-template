import axios from "axios";

export const fetchUserCart = async (session, status, setCartLoading) => {
  if (status === "authenticated") {
    try {
      const userId = await session.user._id;
      const response = await axios.get(`/api/cart?userId=${userId}`);
      const userCart = response.data;
      setCartLoading(false);
      return userCart;
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }

  return null;
};
