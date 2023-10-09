export async function getProducts(key = "") {
    const { NEXT_URL } = process.env;
    
    const res = await fetch(`${NEXT_URL}/api/products?${key}`)

    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }

    return res.json()
}