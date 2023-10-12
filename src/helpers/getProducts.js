export async function getProducts(key = "") {
    const { NEXT_URL } = process.env;

    try {
        const res = await fetch(`${NEXT_URL}/api/products${key}`)

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
        }

        const jsonData = await res.json();

        return jsonData;

    } catch (error) {
        console.error('Error fetching cart:', error);
    }

    return null;
}