export async function getProducts(path = "", key = "") {
    const res = await fetch(`http://localhost:3000/api/products/${path}?key=${key}`)

    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }

    return res.json()
}