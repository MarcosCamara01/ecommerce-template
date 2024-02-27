"use server"

export async function getProducts(key = "") {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products${key}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
        }

        const jsonData = await res.json();

        return jsonData;

    } catch (error) {
        console.error('Error fetching products:', error);
    }
}