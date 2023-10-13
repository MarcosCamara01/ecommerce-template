import axios from "axios";

export const fetchUserCart = async (session, setCartLoading) => {
    try {
      const userId = await session.user._id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?userId=${userId}`);
      const userCart = response.data;
      setCartLoading(false);
      return userCart;
    } catch (error) {
      console.error('Error fetching cart:', error);
    }

  return null;
};
