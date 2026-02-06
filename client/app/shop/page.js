"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import ProductGrid from '@/app/components/ProductGrid';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

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
    const { addToCart } = useCart();

    return (
        <main className="min-h-screen flex flex-col">
            <Navbar />

            <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse"></div>}>
                <HeroWrapper />
            </Suspense>

            <section id="shop-content" className="flex-grow bg-white">
                <Suspense fallback={<p className="text-center py-10">Loading products...</p>}>
                    <ShopContent onAddToCart={addToCart} />
                </Suspense>
            </section>

            {/* Collection Categories */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-12 text-center">Our Collections</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CategoryCard href="/shop?category=cargo-pants" title="Cargo Pants" img="/cargo-pants.png" />
                        <CategoryCard href="/shop?category=knot-top" title="Knot Tops" img="/knot-top.jpeg" />
                        <CategoryCard href="/shop?category=crop-tops" title="Crop Tops" img="/crop-top.png" />
                        <CategoryCard href="/shop?category=tshirts" title="T-Shirts" img="/t-shirt.png" />
                        <CategoryCard href="/shop?category=outerwear" title="Outerwear" img="/outerwear.jpeg" />
                        <CategoryCard href="/shop?category=accessories" title="Accessories" img="/accessories.jpeg" />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

function CategoryCard({ href, title, img }) {
    return (
        <Link href={href} className="relative overflow-hidden rounded-xl group h-72 block shadow-lg">
            <img
                src={img}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.backgroundColor = '#1a1a1a'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-8 transition-opacity duration-300 group-hover:bg-black/40">
                <span className="text-white text-2xl font-bold tracking-wider uppercase">{title}</span>
            </div>
        </Link>
    );
}

function HeroWrapper() {
    const searchParams = useSearchParams();
    if (searchParams.toString()) return null;

    return (
        <section className="relative bg-black text-white h-[60vh] flex items-center">
            <div className="absolute inset-0 overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                >
                    <source src="/Hero_video.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="container mx-auto px-4 z-10 text-center md:text-left">
                <div className="max-w-xl">
                    <h1 className="text-5xl font-bold leading-tight mb-6">Contemporary Style for Modern Life</h1>
                    <p className="text-xl mb-8 font-light">Discover the latest trends in fashion with our premium quality clothing line.</p>
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <Link href="/shop" className="px-10 py-4 bg-white text-black font-bold hover:bg-gray-200 transition duration-300 rounded-full text-center">
                            SHOP NOW
                        </Link>
                        <a href="https://instagram.com/khin.szn" target="_blank" className="px-10 py-4 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition duration-300 rounded-full text-center">
                            INSTAGRAM
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
