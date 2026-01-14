export const API_BASE_URL = "https://nova-backend-htzd.onrender.com"; // Forced production URL

export async function fetchWithFallback(endpoint) {
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });

        if (!res.ok) {
            // If backend is down, return empty or handle gracefully
            console.warn(`API request to ${endpoint} failed: ${res.status}`);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error(`Fetch error for ${endpoint}:`, error);
        return [];
    }
}

export const FALLBACK_PRODUCTS = [
    {
        _id: "fallback1",
        name: "Classic Hoodie",
        price: 2499,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
        category: "hoodies",
        sizes: ["S", "M", "L", "XL"],
        tags: ["new"]
    },
    {
        _id: "fallback2",
        name: "Essential T-Shirt",
        price: 1299,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80",
        category: "tshirts",
        sizes: ["S", "M", "L"],
        tags: ["sale"]
    },
    {
        _id: "fallback3",
        name: "Urban Cargo Pants",
        price: 1899,
        image: "https://images.unsplash.com/photo-1604176354204-9268737828e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
        category: "pants",
        sizes: ["M", "L", "XL"],
        tags: []
    },
    {
        _id: "fallback4",
        name: "Windbreaker Jacket",
        price: 3499,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=736&q=80",
        category: "outerwear",
        sizes: ["S", "M", "L"],
        tags: ["new"]
    }
];
