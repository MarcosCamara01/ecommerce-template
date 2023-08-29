import axios from 'axios';

export async function fetchProducts(setProducts) {
    try {
        const response = await axios.get('/api/products');
        const data = response.data;
        setProducts(data);
        return data;
    } catch (error) {
        console.error('Failed to fetch products.', error);
        throw error;
    }
}