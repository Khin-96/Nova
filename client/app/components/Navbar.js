"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Search, ShoppingBag, User, Menu, ChevronDown, X } from 'lucide-react';

export default function Navbar() {
    const { cartCount, setIsCartOpen } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
    const [isDesktopShopOpen, setIsDesktopShopOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const pathname = usePathname();
    const router = useRouter();
    const searchInputRef = useRef(null);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
    }, [pathname]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false); // Close search bar on search
        }
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Link href="/" className="text-2xl font-bold tracking-tight text-black">
                        NOVA WEAR
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex space-x-8 items-center">
                    <Link href="/" className="nav-link font-medium text-gray-700 hover:text-black">Home</Link>
                    <div
                        className="relative"
                        onMouseEnter={() => setIsDesktopShopOpen(true)}
                        onMouseLeave={() => setIsDesktopShopOpen(false)}
                    >
                        <button className="nav-link font-medium text-gray-700 hover:text-black flex items-center py-2">
                            Shop <ChevronDown size={12} className="ml-1" />
                        </button>
                        {/* Transparent bridge to connect button and dropdown */}
                        <div className="absolute top-full left-0 w-48 h-2 bg-transparent"></div>

                        <div className={`absolute top-[calc(100%+0.5rem)] left-0 w-48 bg-white shadow-lg rounded-md py-1 z-50 animate-in fade-in zoom-in duration-200 ${isDesktopShopOpen ? 'block' : 'hidden'}`}>
                            <Link href="/shop" className="block px-4 py-2 hover:bg-gray-100">All Products</Link>
                            <Link href="/shop?category=cargo-pants" className="block px-4 py-2 hover:bg-gray-100">Cargo pants</Link>
                            <Link href="/shop?category=knot-top" className="block px-4 py-2 hover:bg-gray-100">Knot top</Link>
                            <Link href="/shop?category=crop-tops" className="block px-4 py-2 hover:bg-gray-100">Crop tops</Link>
                            <Link href="/shop?category=tshirts" className="block px-4 py-2 hover:bg-gray-100">T-Shirts</Link>
                            <Link href="/shop?category=outerwear" className="block px-4 py-2 hover:bg-gray-100">Outerwear</Link>
                            <Link href="/shop?category=dresses" className="block px-4 py-2 hover:bg-gray-100">Dresses</Link>
                            <Link href="/shop?category=accessories" className="block px-4 py-2 hover:bg-gray-100">Accessories</Link>
                        </div>
                    </div>
                    <Link href="/our-story" className="nav-link font-medium text-gray-700 hover:text-black">About</Link>
                    <Link href="/contact" className="nav-link font-medium text-gray-700 hover:text-black">Contact</Link>

                    <div className="relative ml-4 flex items-center">
                        <div className={`transition-all duration-300 overflow-hidden ${isSearchOpen ? 'w-64 opacity-100 mr-2' : 'w-0 opacity-0'}`}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-black text-sm"
                            />
                        </div>
                        <button onClick={toggleSearch} className="p-2 text-gray-600 hover:text-black">
                            <Search size={20} />
                        </button>
                    </div>
                </nav>

                {/* Icons */}
                <div className="flex items-center space-x-4">
                    <button className="md:hidden p-2 text-gray-600 hover:text-black" onClick={toggleSearch}>
                        <Search size={20} />
                    </button>

                    <button className="p-2 text-gray-600 hover:text-black relative" onClick={() => setIsCartOpen(true)}>
                        <ShoppingBag size={20} />
                        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cartCount}
                        </span>
                    </button>
                    <button className="p-2 text-gray-600 hover:text-black">
                        <User size={20} />
                    </button>
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-black"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Search Bar (Expandable) */}
            {isSearchOpen && (
                <div className="md:hidden container mx-auto px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-black"
                        autoFocus
                    />
                </div>
            )}

            {/* Mobile Menu */}
            <div
                className={`md:hidden bg-white border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="container mx-auto px-4 py-2">
                    <nav className="flex flex-col space-y-3 py-4">
                        <Link href="/" className="font-medium text-gray-700 hover:text-black py-2">Home</Link>
                        <div>
                            <button
                                onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                                className="flex justify-between items-center w-full font-medium text-gray-700 hover:text-black py-2"
                            >
                                Shop <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div
                                className={`pl-4 border-l border-gray-200 mt-2 overflow-hidden transition-all duration-300 ${isMobileCategoriesOpen ? 'max-h-60' : 'max-h-0'}`}
                            >
                                <Link href="/shop" className="block py-2 text-gray-600 hover:text-black">All Products</Link>
                                <Link href="/shop?category=cargo-pants" className="block py-2 text-gray-600 hover:text-black">Cargo pants</Link>
                                <Link href="/shop?category=knot-top" className="block py-2 text-gray-600 hover:text-black">Knot top</Link>
                                <Link href="/shop?category=crop-tops" className="block py-2 text-gray-600 hover:text-black">Crop tops</Link>
                                <Link href="/shop?category=tshirts" className="block py-2 text-gray-600 hover:text-black">T-Shirts</Link>
                                <Link href="/shop?category=outerwear" className="block py-2 text-gray-600 hover:text-black">Outerwear</Link>
                                <Link href="/shop?category=dresses" className="block py-2 text-gray-600 hover:text-black">Dresses</Link>
                                <Link href="/shop?category=accessories" className="block py-2 text-gray-600 hover:text-black">Accessories</Link>
                            </div>
                        </div>
                        <Link href="/shop#about" className="font-medium text-gray-700 hover:text-black py-2">About</Link>
                        <Link href="/shop#contact" className="font-medium text-gray-700 hover:text-black py-2">Contact</Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
