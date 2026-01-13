"use client";
import { useState, useEffect } from 'react';
import { fetchWithFallback, FALLBACK_PRODUCTS } from '@/lib/api';

const VALID_SIZES = ["S", "M", "L", "XL"];

export default function ProductGrid({ category = 'all', searchQuery = '', onAddToCart }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSizes, setSelectedSizes] = useState({});

    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            let endpoint = '/api/products';
            if (category !== 'all') {
                endpoint += `?category=${encodeURIComponent(category)}`;
            }
            if (searchQuery) {
                endpoint += `?search=${encodeURIComponent(searchQuery)}`;
            }

            let data = await fetchWithFallback(endpoint);

            // Client-side fallback if API returns empty/error or for search simulation if API handles it differently
            if (!data || data.length === 0) {
                data = FALLBACK_PRODUCTS.filter(p => {
                    const matchesCategory = category === 'all' || p.category === category;
                    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesCategory && matchesSearch;
                });
            }

            setProducts(data);
            setLoading(false);
        }
        loadProducts();
    }, [category, searchQuery]);

    const handleSizeSelect = (productId, size) => {
        setSelectedSizes(prev => ({ ...prev, [productId]: size }));
    };

    const handleAddToCart = (product) => {
        const size = selectedSizes[product._id || product.id] || "M"; // Default to M
        onAddToCart(product, size);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-80"></div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return <p className="text-gray-500 text-center col-span-full">No products found.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => {
                const productId = product._id || product.id;
                const currentSize = selectedSizes[productId] || "M";
                const imageUrl = product.image; // Assume full URL or handle helper if relative

                return (
                    <div key={productId} className="product-card bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300">
                        <div className="relative overflow-hidden h-48 md:h-64">
                            {product.tags && product.tags.map(tag => (
                                <span key={tag} className={`tag tag-${tag}`}>{tag}</span>
                            ))}
                            <img src={imageUrl} alt={product.name} className="product-image w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-3 py-2">
                                <span className="text-sm capitalize">{product.category}</span>
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="font-medium text-lg">{product.name}</h3>
                            <div className="mt-2 mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                <div className="flex space-x-2">
                                    {(product.sizes || VALID_SIZES).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => handleSizeSelect(productId, size)}
                                            className={`size-option border rounded px-2 py-1 text-sm ${currentSize === size ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-bold">KES {product.price.toFixed(2)}</span>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="bg-black text-white px-3 py-1 rounded-md text-sm hover:bg-gray-800 transition-colors"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
