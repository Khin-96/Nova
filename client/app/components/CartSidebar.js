"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Minus, Plus, Lock } from 'lucide-react';

const DELIVERY_FEE_OTHER = 450;

export default function CartSidebar() {
    const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, cartTotal, clearCart } = useCart();
    const [deliveryLocation, setDeliveryLocation] = useState('mombasa');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const deliveryFee = deliveryLocation === 'other' ? DELIVERY_FEE_OTHER : 0;
    const finalTotal = cartTotal + deliveryFee;

    const handleMpesaCheckout = async () => {
        if (!mpesaPhone || !/^254\d{9}$/.test(mpesaPhone)) {
            setMessage({ text: "Please enter a valid M-Pesa number (e.g., 254712345678).", type: "error" });
            return;
        }
        if (cart.length === 0) {
            setMessage({ text: "Your cart is empty.", type: "error" });
            return;
        }

        setIsProcessing(true);
        setMessage({ text: "Processing payment...", type: "info" });

        try {
            const res = await fetch('http://localhost:5000/api/mpesa/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: mpesaPhone, amount: finalTotal }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Payment failed');

            setMessage({ text: "STK Push sent! Check your phone.", type: "success" });

            // Simulate order creation on success
            createOrderAfterPayment(mpesaPhone);

        } catch (error) {
            console.error(error);
            setMessage({ text: `Error: ${error.message}`, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    const createOrderAfterPayment = async (phone) => {
        const orderData = {
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                image: item.image
            })),
            customerName: "Online Customer",
            phone,
            location: deliveryLocation,
            subtotal: cartTotal,
            deliveryFee,
            total: finalTotal,
            paymentMethod: "M-Pesa",
            status: "pending"
        };

        try {
            await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            clearCart();
            setTimeout(() => setIsCartOpen(false), 3000);
        } catch (err) {
            console.error("Failed to save order", err);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isCartOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsCartOpen(false)}
                />
            )}

            {/* Sidebar - Matching .cart-sidebar logic */}
            <div className={`fixed top-0 right-0 w-full md:w-96 h-full bg-white/20 backdrop-blur-lg z-50 transition-transform duration-300 ease-out border-l border-white/20 shadow-2xl ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col bg-white/80 md:bg-white/60"> {/* Added slight white bg for legibility on top of blur */}

                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white/50">
                        <h3 className="text-xl font-bold">Your Cart</h3>
                        <button onClick={() => setIsCartOpen(false)} className="text-gray-600 hover:text-black">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-grow overflow-auto p-4">
                        {cart.length === 0 ? (
                            <p className="text-gray-500 text-center py-10">Your cart is empty</p>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={`${item.id}-${item.size}-${idx}`} className="flex items-center py-4 border-b border-gray-200 last:border-0">
                                    <div className="w-16 h-16 flex-shrink-0 mr-4">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-medium text-sm">{item.name}</h4>
                                        <p className="text-xs text-gray-600">Size: {item.size}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center border rounded bg-white">
                                                <button onClick={() => updateQuantity(item.id, item.size, 'decrease')} className="px-2 py-1 hover:bg-gray-100"><Minus size={12} /></button>
                                                <span className="px-2 text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.size, 'increase')} className="px-2 py-1 hover:bg-gray-100"><Plus size={12} /></button>
                                            </div>
                                            <span className="font-medium text-sm">KES {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id, item.size)} className="ml-2 text-gray-400 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white/50">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                            <select
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            >
                                <option value="mombasa">Mombasa (Free Delivery)</option>
                                <option value="kilifi">Kilifi (Free Delivery)</option>
                                <option value="other">Other Locations (KES 450 Delivery Fee)</option>
                            </select>
                        </div>

                        <div className="space-y-1 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>KES {cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery:</span>
                                <span>KES {deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                                <span>Total:</span>
                                <span>KES {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone</label>
                            <input
                                type="tel"
                                placeholder="2547XXXXXXXX"
                                value={mpesaPhone}
                                onChange={(e) => setMpesaPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>

                        <button
                            onClick={handleMpesaCheckout}
                            disabled={isProcessing}
                            className="w-full bg-green-600 text-white font-medium py-3 rounded-md hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-70"
                        >
                            {isProcessing ? 'Processing...' : (
                                <>
                                    <Lock size={16} className="mr-2" /> Pay with M-Pesa
                                </>
                            )}
                        </button>

                        {message.text && (
                            <p className={`text-sm mt-2 text-center p-2 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
