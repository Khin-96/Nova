"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ProductGrid from '@/app/components/ProductGrid';
import Link from 'next/link';
import { useCart } from '@/context/CartContext'; // Import context

// Helper to wrap useSearchParams for Suspense
function ShopContent({ onAddToCart }) {
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-12 text-center capitalize">
                {search ? `Search Results for "${search}"` : (category === 'all' ? 'All Products' : category)}
            </h2>
            <ProductGrid category={category} searchQuery={search} onAddToCart={onAddToCart} />
        </div>
    );
}


export default function ShopPage() {
    const { addToCart } = useCart(); // Use global addToCart

    return (
        <main className="min-h-screen flex flex-col">
            <Navbar /> {/* Remove legacy props */}

            {/* Original Hero Section if on home/all */}
            <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse"></div>}>
                <HeroWrapper />
            </Suspense>

            <section id="shop-content" className="flex-grow bg-white">
                <Suspense fallback={<p className="text-center py-10">Loading products...</p>}>
                    {/* Pass global addToCart directly (wrapper if needed for size arg match, but context handles it) */}
                    <ShopContent onAddToCart={addToCart} />
                </Suspense>
            </section>

            {/* Collection Categories (Static) */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">Shop by Category</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/shop?category=cargo-pants" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594633313593-bab3825d0caf?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">Cargo Pants</span>
                            </div>
                        </Link>
                        <Link href="/shop?category=knot-top" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503342394128-c104d54dba01?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">Knot Tops</span>
                            </div>
                        </Link>
                        <Link href="/shop?category=crop-tops" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?ixlib=rb-4.0.3&auto=format&fit=crop&w=768&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">Crop Tops</span>
                            </div>
                        </Link>
                        <Link href="/shop?category=tshirts" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&auto=format&fit=crop&w=764&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">T-Shirts</span>
                            </div>
                        </Link>
                        <Link href="/shop?category=outerwear" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=736&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">Outerwear</span>
                            </div>
                        </Link>
                        <Link href="/shop?category=dresses" className="relative overflow-hidden rounded-lg group h-64 block">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=883&q=80')" }}></div>
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">Dresses</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

function HeroWrapper() {
    const searchParams = useSearchParams();
    // Only show hero on main shop page, not when searching or filtering
    if (searchParams.toString()) return null;

    return (
        <section className="relative bg-black text-white h-[60vh] flex items-center">
            <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')" }}></div>
            <div className="container mx-auto px-4 z-10">
                <div className="max-w-xl">
                    <h1 className="text-5xl font-bold leading-tight mb-6 fade-in">Contemporary Style for Modern Life</h1>
                    <p className="text-xl mb-8 fade-in delay-1">Discover the latest trends in fashion with our premium quality clothing line.</p>
                    <div className="flex space-x-4 fade-in delay-2">
                        <Link href="/shop" className="px-8 py-3 bg-white text-black font-medium hover:bg-gray-100 transition duration-300 rounded-md">
                            Shop Now
                        </Link>
                        <a href="https://instagram.com/khin.szn" target="_blank" className="px-8 py-3 border border-white font-medium hover:bg-white hover:text-black transition duration-300 rounded-md">
                            View Our Instagram
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
