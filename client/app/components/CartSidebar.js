"use client";
import { useCart } from '@/context/CartContext';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function CartSidebar() {
    const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        setIsCartOpen(false);
        router.push('/checkout');
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={() => setIsCartOpen(false)}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 w-full md:w-96 h-full bg-white/90 backdrop-blur-xl z-50 border-l border-white/20 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white/50">
                            <div className="flex items-center space-x-2">
                                <ShoppingBag size={20} />
                                <h3 className="text-xl font-bold font-heading">Your Cart ({cart.reduce((a, c) => a + c.quantity, 0)})</h3>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-grow overflow-y-auto p-5 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                    <ShoppingBag size={48} className="text-gray-300" />
                                    <p>Your cart is empty</p>
                                    <button onClick={() => setIsCartOpen(false)} className="text-black underline text-sm hover:text-gray-600">Start Shopping</button>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        key={`${item.id}-${item.size}-${idx}`}
                                        className="flex gap-4 p-3 bg-white/60 rounded-xl border border-gray-100 shadow-sm"
                                    >
                                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                                    <p className="text-xs text-gray-500">Size: {item.size}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.size)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-end mt-2">
                                                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.size, 'decrease')}
                                                        className="px-2 py-1 hover:bg-gray-200 rounded-l-lg transition-colors"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.size, 'increase')}
                                                        className="px-2 py-1 hover:bg-gray-200 rounded-r-lg transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-sm">KES {(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-5 border-t border-gray-200 bg-white/80 backdrop-blur-md">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between font-bold text-lg pt-2">
                                        <span>Subtotal</span>
                                        <span>KES {cartTotal.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">Shipping & taxes calculated at checkout</p>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all duration-200 flex items-center justify-center shadow-lg"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
