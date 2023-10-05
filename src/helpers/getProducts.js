export async function getProducts(key = "") {
    const res = await fetch(`http://localhost:3000/api/products?${key}`)

    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }

    return res.json()
}