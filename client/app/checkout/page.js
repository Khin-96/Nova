"use client";
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { Smartphone, QrCode, Lock, MapPin, ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { API_BASE_URL } from '@/lib/api';

const DELIVERY_FEE_OTHER = 450;

export default function CheckoutPage() {
    console.log("DEBUG: V12_FORCED_FIX_ACTIVE - API_BASE_URL is", API_BASE_URL);
    const { cart, cartTotal, clearCart } = useCart();
    const router = useRouter();

    const [deliveryLocation, setDeliveryLocation] = useState('mombasa');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('stk'); // 'stk' or 'qr'
    const [qrCodeData, setQrCodeData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [orderSuccess, setOrderSuccess] = useState(false);

    const deliveryFee = deliveryLocation === 'other' ? DELIVERY_FEE_OTHER : 0;
    const finalTotal = cartTotal + deliveryFee;

    // Redirect if cart is empty
    useEffect(() => {
        if (cart.length === 0 && !orderSuccess) {
            router.push('/shop');
        }
    }, [cart, router, orderSuccess]);

    const handleMpesaCheckout = async () => {
        if (cart.length === 0) return;

        if (paymentMethod === 'stk') {
            if (!mpesaPhone || !/^254\d{9}$/.test(mpesaPhone)) {
                setMessage({ text: "Please enter a valid M-Pesa number (e.g., 254712345678).", type: "error" });
                return;
            }
            // 1. Create Order First
            const orderId = await createOrderAfterPayment(mpesaPhone, "M-Pesa STK");
            if (!orderId) return;

            // 2. Proceed with STK Push
            await initiateStkPush(orderId);

            // 3. Clear cart and show success (pending payment)
            setOrderSuccess(true);
            clearCart();
        } else {
            // Generate QR Code
            await generateQrCode();
        }
    };

    const initiateStkPush = async (orderId) => {
        setIsProcessing(true);
        setMessage({ text: "Processing payment...", type: "info" });

        try {
            const res = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: mpesaPhone, amount: finalTotal, orderId: orderId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Payment failed');

            setMessage({ text: "STK Push sent! Check your phone.", type: "success" });

        } catch (error) {
            console.error(error);
            setMessage({ text: `Error: ${error.message}`, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    const generateQrCode = async () => {
        setIsProcessing(true);
        setMessage({ text: "Generating QR Code...", type: "info" });
        setQrCodeData(null); // Reset previous

        try {
            const res = await fetch(`${API_BASE_URL}/api/mpesa/qrcode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: finalTotal,
                    refNo: `ORDER-${Date.now()}`
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'QR Gen failed');

            if (data.QRCode) {
                setQrCodeData(data.QRCode);
                setMessage({ text: "Scan this code to pay.", type: "success" });

                // Start polling or just show success button for now in this flow
                // For better UX, we could create a pending order here.
            } else {
                throw new Error("No QR Code returned.");
            }

        } catch (error) {
            console.error(error);
            setMessage({ text: `Error: ${error.message}`, type: "error" });
        } finally {
            setIsProcessing(false);
        }
    };

    const createOrderAfterPayment = async (phone, method) => {
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
            phone: phone || "QR Payment",
            location: deliveryLocation,
            subtotal: cartTotal,
            deliveryFee,
            total: finalTotal,
            paymentMethod: method,
            status: "pending"
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Failed to create order");
            return data.orderId || data._id;
        } catch (err) {
            console.error("Failed to save order", err);
            throw err;
        }
    };

    if (orderSuccess) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                        <p className="text-gray-600 mb-8">Thank you for your purchase. Your order has been received and is being processed.</p>
                        <button
                            onClick={() => router.push('/shop')}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-8">
                <button
                    onClick={() => router.push('/shop')}
                    className="flex items-center text-gray-500 hover:text-black mb-6 transition-colors"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back to Shop
                </button>

                <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Delivery & Payment */}
                    <div className="space-y-6">

                        {/* Delivery Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center mb-4 text-lg font-bold">
                                <MapPin className="mr-2" size={20} /> Delivery Details
                            </div>

                            <label className="block text-sm font-medium text-gray-700 mb-2">Select your Location</label>
                            <select
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/5 transaction-all"
                            >
                                <option value="mombasa">Mombasa (Free Delivery)</option>
                                <option value="kilifi">Kilifi (Free Delivery)</option>
                                <option value="other">Other Locations (KES {DELIVERY_FEE_OTHER})</option>
                            </select>
                        </div>

                        {/* Payment Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center mb-6 text-lg font-bold">
                                <Lock className="mr-2" size={20} /> Payment Method
                            </div>

                            {/* Payment Toggle */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={() => setPaymentMethod('stk')}
                                    className={`flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${paymentMethod === 'stk' ? 'bg-green-50 border-green-500 text-green-700 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Smartphone size={20} className="mr-2" /> M-Pesa STK
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('qr')}
                                    className={`flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${paymentMethod === 'qr' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <QrCode size={20} className="mr-2" /> Scan QR
                                </button>
                            </div>

                            {/* M-Pesa Input Area */}
                            <div className="mb-6">
                                {paymentMethod === 'stk' ? (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="2547XXXXXXXX"
                                            value={mpesaPhone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono text-lg"
                                        />
                                        <p className="text-xs text-gray-500">Enter your M-Pesa number to receive a payment prompt.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center min-h-[200px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6">
                                        {qrCodeData ? (
                                            <div className="text-center">
                                                <img src={`data:image/png;base64,${qrCodeData}`} alt="M-Pesa QR Code" className="w-48 h-48 object-contain mx-auto mb-4 bg-white p-2 rounded-lg shadow-sm" />
                                                <p className="text-sm font-medium text-green-600">Scan with your M-Pesa App</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <QrCode size={48} className="mx-auto mb-3 opacity-20" />
                                                <p>Click "Generate QR Code" below to display your unique payment code.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handleMpesaCheckout}
                                disabled={isProcessing}
                                className={`w-full text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-lg ${paymentMethod === 'stk' ? 'bg-green-600' : 'bg-blue-600'}`}
                            >
                                {isProcessing ? (
                                    <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" /> Processing...</span>
                                ) : (
                                    <>
                                        {paymentMethod === 'stk' && <Smartphone size={20} className="mr-2" />}
                                        {paymentMethod === 'qr' && <QrCode size={20} className="mr-2" />}
                                        {paymentMethod === 'stk' ? `Pay KES ${finalTotal.toLocaleString()}` : (qrCodeData ? "I have Scanned" : "Generate QR Code")}
                                    </>
                                )}
                            </button>

                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-sm mt-4 text-center p-4 rounded-xl font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}
                                >
                                    {message.text}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                            <div className="flex items-center mb-6 text-lg font-bold">
                                <ShoppingBag className="mr-2" size={20} /> Order Summary
                            </div>

                            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {cart.map((item, idx) => (
                                    <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-4 py-2 border-b border-gray-50 last:border-0">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-sm">{item.name}</h4>
                                            <p className="text-xs text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                                            <p className="text-sm font-medium mt-1">KES {(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>KES {cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery ({deliveryLocation})</span>
                                    <span>{deliveryFee === 0 ? 'Free' : `KES ${deliveryFee}`}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
                                    <span>Total</span>
                                    <span>KES {finalTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ddd;
                    border-radius: 4px;
                }
            `}</style>
            <Footer />
        </div>
    );
}
