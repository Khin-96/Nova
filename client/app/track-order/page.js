"use client";
import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { API_BASE_URL } from '@/lib/api';

const ORDER_STATES = [
    { key: 'received', label: 'Order Received', icon: Clock, color: 'blue' },
    { key: 'prepared', label: 'Prepared', icon: Package, color: 'purple' },
    { key: 'dispatched', label: 'Dispatched', icon: ShieldCheck, color: 'indigo' },
    { key: 'enroute', label: 'En-Route', icon: Truck, color: 'orange' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' }
];

// Helper to map old statuses to new states if needed
const mapStatus = (status) => {
    if (status === 'pending') return 'received';
    if (status === 'processing') return 'prepared';
    if (status === 'shipped') return 'dispatched';
    return status;
};

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        if (e) e.preventDefault();
        if (!orderId.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId.trim()}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Order not found');
            }
            const data = await res.json();
            setOrder(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentStatus = order ? mapStatus(order.status) : null;
    const currentIndex = ORDER_STATES.findIndex(s => s.key === currentStatus);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black mb-4"
                        >
                            Track Your Order
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600"
                        >
                            Enter your Order ID (e.g., ORD-XXXXXX) to see real-time status.
                        </motion.p>
                    </div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 mb-12 flex flex-col md:flex-row gap-2"
                    >
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="ORD-123456"
                                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                                className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 bg-gray-50/50"
                            />
                        </div>
                        <button
                            onClick={handleTrack}
                            disabled={loading}
                            className="bg-black text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Track Now"
                            )}
                        </button>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-50 text-red-600 p-6 rounded-2xl text-center font-medium border border-red-100"
                            >
                                {error}. Please double check your ID.
                            </motion.div>
                        )}

                        {order && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Summary Card */}
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                                        <h3 className="text-xl font-black">{order.orderId}</h3>
                                    </div>
                                    <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold bg-${ORDER_STATES[currentIndex]?.color || 'gray'}-100 text-${ORDER_STATES[currentIndex]?.color || 'gray'}-700`}>
                                            {ORDER_STATES[currentIndex]?.label || order.status}
                                        </span>
                                    </div>
                                    <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
                                        <p className="text-lg font-bold">{order.items?.length || 0} Products</p>
                                    </div>
                                </div>

                                {/* Progress Track */}
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="relative mt-8 mb-12">
                                        {/* Progress Line */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(currentIndex / (ORDER_STATES.length - 1)) * 100}%` }}
                                            className="absolute top-1/2 left-0 h-1 bg-black -translate-y-1/2 rounded-full transition-all duration-1000"
                                        ></motion.div>

                                        {/* Steps */}
                                        <div className="relative flex justify-between">
                                            {ORDER_STATES.map((state, idx) => {
                                                const Icon = state.icon;
                                                const isActive = idx <= currentIndex;
                                                const isCurrent = idx === currentIndex;

                                                return (
                                                    <div key={state.key} className="flex flex-col items-center">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${isActive ? 'bg-black text-white' : 'bg-white border-2 border-gray-100 text-gray-300'} ${isCurrent ? 'ring-4 ring-black/10 scale-110 shadow-lg shadow-black/20' : ''}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div className="mt-4 text-center">
                                                            <p className={`text-[10px] md:text-xs font-bold tracking-tight uppercase transition-colors ${isActive ? 'text-black' : 'text-gray-300'}`}>
                                                                {state.label}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-50">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gray-100 p-3 rounded-xl text-gray-500">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Standard Shipping</p>
                                                <p className="font-bold text-gray-800">{order.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="bg-gray-100 p-3 rounded-xl text-gray-500">
                                                <Package size={24} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Contains</p>
                                                <div className="space-y-1">
                                                    {order.items?.map((item, i) => (
                                                        <p key={i} className="text-sm font-medium text-gray-700">{item.quantity}x {item.name}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="text-center">
                                    <button
                                        onClick={() => setOrder(null)}
                                        className="text-gray-500 hover:text-black font-bold flex items-center mx-auto transition-colors"
                                    >
                                        Track Another Order <ArrowRight size={16} className="ml-2" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <Footer />
        </div>
    );
}
