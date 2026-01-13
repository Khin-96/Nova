export default function Footer() {
    return (
        <footer className="bg-gray-100 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">NOVA WEAR</h3>
                        <p className="text-gray-600 mb-4">Contemporary clothing for modern lifestyles.</p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-600 hover:text-black"><i className="fab fa-facebook-f"></i></a>
                            <a href="https://instagram.com/khin.szn" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-black"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="text-gray-600 hover:text-black"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="text-gray-600 hover:text-black"><i className="fab fa-pinterest"></i></a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Shop</h3>
                        <ul className="space-y-2">
                            <li><a href="/shop" className="text-gray-600 hover:text-black">All Products</a></li>
                            <li><a href="/shop?category=hoodies" className="text-gray-600 hover:text-black">Hoodies</a></li>
                            <li><a href="/shop?category=tshirts" className="text-gray-600 hover:text-black">T-Shirts</a></li>
                            <li><a href="/shop?category=pants" className="text-gray-600 hover:text-black">Pants</a></li>
                            <li><a href="/shop?category=outerwear" className="text-gray-600 hover:text-black">Outerwear</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Help</h3>
                        <ul className="space-y-2">
                            <li><a href="/faq" className="text-gray-600 hover:text-black">FAQ</a></li>
                            <li><a href="/shipping-returns" className="text-gray-600 hover:text-black">Shipping & Returns</a></li>
                            <li><a href="/size-guide" className="text-gray-600 hover:text-black">Size Guide</a></li>
                            <li><a href="/contact" className="text-gray-600 hover:text-black">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">About</h3>
                        <ul className="space-y-2">
                            <li><a href="/our-story" className="text-gray-600 hover:text-black">Our Story</a></li>
                            <li><a href="/sustainability" className="text-gray-600 hover:text-black">Sustainability</a></li>
                            <li><a href="/careers" className="text-gray-600 hover:text-black">Careers</a></li>
                            <li><a href="/privacy-policy" className="text-gray-600 hover:text-black">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-200 mt-10 pt-6">
                    <p className="text-gray-600 text-center">&copy; 2025 Nova Wear. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
