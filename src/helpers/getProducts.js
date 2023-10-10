export async function getProducts(key = "") {
    const { NEXT_URL } = process.env;
    
    const res = await fetch(`${NEXT_URL}/api/products${key}`)

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to fetch data. Status: ${res.status}, Message: ${errorData.message}`);
    }    

    return res.json()
}