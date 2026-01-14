"use client";
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Mail,
    Plus,
    Trash2,
    CheckCircle,
    Search,
    Filter,
    Loader2,
    Briefcase,
    BarChart3,
    TrendingUp
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

import { API_BASE_URL } from '@/lib/api';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [orderFilter, setOrderFilter] = useState('all');

    // Career State
    const [jobs, setJobs] = useState([]);
    const [newJob, setNewJob] = useState({
        title: '',
        type: 'Full-time',
        location: 'Mombasa',
        description: '',
        requirements: '', // text area, split by newline
        contactEmail: 'careers@novawear.co.ke'
    });

    // Analytics State
    const [analytics, setAnalytics] = useState(null);

    // Product Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: '',
        price: '',
        image: null,
        sizes: [],
        tags: []
    });

    // Fetch Data on Tab Change
    useEffect(() => {
        if (activeTab === 'products') fetchProducts();
        if (activeTab === 'orders') fetchOrders(orderFilter);
        if (activeTab === 'careers') fetchJobs();
        if (activeTab === 'analytics') fetchAnalytics();
    }, [activeTab, orderFilter]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // --- Product Functions ---
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/products?nocache=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
            showMessage('Error loading products', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Create FormData
        const formData = new FormData();
        formData.append('name', newProduct.name || '');
        formData.append('category', newProduct.category || '');
        formData.append('price', newProduct.price || '');
        if (newProduct.image) formData.append('productImage', newProduct.image);

        // Add sizes and tags manually if needed by backend, assuming backend parses comma lists or arrays
        // Based on admin.js, it appends tags individually.
        newProduct.tags.forEach(tag => formData.append('tags', tag));
        // Provide default valid sizes if none selected (simplified for now as UI didn't show size selector in admin.js explicitly but good to have)
        // admin.js didn't show size inputs, so maybe it defaults on backend or I missed it. I'll ignore specific size inputs to match admin.js strictness unless I see it.
        // Re-reading admin.js: "const tags = Array.from...". No sizes.

        try {
            const res = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                body: formData,
                headers: { 'x-admin-api-key': localStorage.getItem('ADMIN_API_KEY') || '' }
                // Note: headers Content-Type should NOT be set for FormData (browser does it) but auth headers needed
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.msg || 'Failed to create');
            }
            showMessage('Product added successfully');
            setNewProduct({ name: '', category: '', price: '', image: null, sizes: [], tags: [] });
            fetchProducts();
        } catch (err) {
            showMessage(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm("Delete this product?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-api-key': localStorage.getItem('ADMIN_API_KEY') || '' }
            });
            if (!res.ok) throw new Error('Failed to delete');
            showMessage('Product deleted');
            fetchProducts();
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    // --- Order Functions ---
    const fetchOrders = async (status) => {
        setIsLoading(true);
        try {
            const endpoint = status === 'all' ? '/api/orders' : `/api/orders?status=${status}`;
            const res = await fetch(`${API_BASE_URL}${endpoint}?nocache=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const data = await res.json();
            setOrders(data);
        } catch (err) {
            showMessage('Error loading orders', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateOrder = async (id, action) => {
        if (!confirm(`Mark as ${action}?`)) return;
        try {
            const endpoint = action === 'delivered' ? `/api/orders/${id}/deliver` : `/api/orders/${id}`;
            const method = action === 'delete' ? 'DELETE' : 'PATCH';

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers: { 'x-admin-api-key': localStorage.getItem('ADMIN_API_KEY') || '' }
            });
            if (!res.ok) throw new Error('Action failed');

            showMessage(`Order ${action === 'delete' ? 'deleted' : 'updated'}`);
            fetchOrders(orderFilter);
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    // --- Career Functions ---
    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/careers`);
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            showMessage('Error fetching jobs', 'error');
        } finally {
            setIsLoading(false);
        }
    }

    const handleCreateJob = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...newJob,
                requirements: newJob.requirements.split('\n').filter(r => r.trim() !== '')
            };
            const res = await fetch(`${API_BASE_URL}/api/careers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': localStorage.getItem('ADMIN_API_KEY') || ''
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to post job');

            showMessage('Job posted successfully');
            setNewJob({ title: '', type: 'Full-time', location: 'Mombasa', description: '', requirements: '', contactEmail: 'careers@novawear.co.ke' });
            fetchJobs();
        } catch (err) {
            showMessage(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteJob = async (id) => {
        if (!confirm("Delete this job posting?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/careers/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-api-key': localStorage.getItem('ADMIN_API_KEY') || '' }
            });
            if (!res.ok) throw new Error('Failed to delete');
            showMessage('Job deleted');
            fetchJobs();
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    // --- Analytics Functions ---
    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/analytics/dashboard`, {
                headers: { 'x-admin-api-key': localStorage.getItem('ADMIN_API_KEY') || '' }
            });
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const data = await res.json();
            setAnalytics(data);
        } catch (err) {
            console.error(err);
            // showMessage('Error fetching analytics', 'error'); 
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI Components ---
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">NOVA ADMIN</h1>
                </div>
                <nav className="p-4 space-y-2 flex-grow">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Package size={20} /> <span>Products</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ShoppingCart size={20} /> <span>Orders</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('careers')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'careers' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Briefcase size={20} /> <span>Careers</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <BarChart3 size={20} /> <span>Analytics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('newsletter')}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'newsletter' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Mail size={20} /> <span>Newsletter</span>
                    </button>
                </nav>
                <div className="p-4 border-t bg-gray-50">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Admin API Key</label>
                    <input
                        type="password"
                        placeholder="Enter API Key"
                        className="w-full px-3 py-2 border rounded text-sm mb-1"
                        onChange={(e) => {
                            // Store in localStorage or state for requests
                            localStorage.setItem('ADMIN_API_KEY', e.target.value);
                        }}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* Mobile Header */}
                <div className="md:hidden mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div className="flex space-x-2">
                        <button onClick={() => setActiveTab('products')} className={`p-2 rounded ${activeTab === 'products' ? 'bg-indigo-100' : 'bg-white'}`}><Package /></button>
                        <button onClick={() => setActiveTab('orders')} className={`p-2 rounded ${activeTab === 'orders' ? 'bg-indigo-100' : 'bg-white'}`}><ShoppingCart /></button>
                    </div>
                </div>

                {/* Message Toast */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        <div className="flex-1">{message.text}</div>
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                        <input required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
                                        <input required type="number" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <select className="w-full px-4 py-2 border rounded-lg bg-white"
                                            value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                            <option value="">Select Category</option>
                                            <option value="cargo-pants">Cargo pants</option>
                                            <option value="knot-top">Knot top</option>
                                            <option value="crop-tops">Crop tops</option>
                                            <option value="tshirts">T-Shirts</option>
                                            <option value="outerwear">Outerwear</option>
                                            <option value="dresses">Dresses</option>
                                            <option value="accessories">Accessories</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                                        <input type="file" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            onChange={e => setNewProduct({ ...newProduct, image: e.target.files[0] })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['new', 'sale', 'out-of-stock', 'coming-soon'].map(tag => (
                                                <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500"
                                                        checked={newProduct.tags.includes(tag)}
                                                        onChange={e => {
                                                            const tags = e.target.checked
                                                                ? [...newProduct.tags, tag]
                                                                : newProduct.tags.filter(t => t !== tag);
                                                            setNewProduct({ ...newProduct, tags });
                                                        }}
                                                    />
                                                    <span className="text-sm text-gray-700 capitalize">{tag.replace(/-/g, ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                                        {isLoading ? <span className="flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Adding...</span> : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">Product Inventory</h2>
                            {isLoading && <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>}
                            <div className="space-y-2">
                                {products.map(product => (
                                    <div key={product.id || product._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-4">
                                            <img src={product.image} alt={product.name} className="w-12 h-12 rounded object-cover bg-gray-100" />
                                            <div>
                                                <h3 className="font-semibold">{product.name}</h3>
                                                <p className="text-sm text-gray-500">{product.category} • KES {product.price}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteProduct(product.id || product._id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                            {['all', 'pending', 'delivered'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setOrderFilter(status)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${orderFilter === status ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {orders.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No orders found.</div>
                            ) : (
                                <div className="divide-y">
                                    {orders.map(order => (
                                        <div key={order._id} className={`p-6 ${order.status === 'delivered' ? 'bg-green-50/50' : ''}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg">Order #{order.orderId || order._id.slice(-6)}</h3>
                                                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-700">Customer</p>
                                                    <p>{order.customerName}</p>
                                                    <p className="text-sm text-gray-600">{order.phone}</p>
                                                    <p className="text-sm text-gray-600 capitalize">{order.location}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex justify-end space-x-8 text-sm text-gray-600">
                                                        <span>Subtotal</span> <span>KES {order.subtotal}</span>
                                                    </div>
                                                    <div className="flex justify-end space-x-8 text-sm text-gray-600">
                                                        <span>Delivery</span> <span>KES {order.deliveryFee}</span>
                                                    </div>
                                                    <div className="flex justify-end space-x-8 font-bold text-lg mt-2">
                                                        <span>Total</span> <span>KES {order.total}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm py-1">
                                                        <span>{item.quantity}x {item.name} <span className="text-gray-500">({item.size})</span></span>
                                                        <span className="text-gray-600">KES {item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end space-x-3">
                                                {order.status !== 'delivered' && (
                                                    <button onClick={() => handleUpdateOrder(order._id, 'delivered')} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                                                        <CheckCircle size={16} /> <span>Mark Delivered</span>
                                                    </button>
                                                )}
                                                <button onClick={() => handleUpdateOrder(order._id, 'delete')} className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition">
                                                    <Trash2 size={16} /> <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}



                {/* CAREERS TAB */}
                {activeTab === 'careers' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">Post New Job</h2>
                            <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                        <input required className="w-full px-4 py-2 border rounded-lg"
                                            value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select className="w-full px-4 py-2 border rounded-lg bg-white"
                                                value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })}>
                                                <option>Full-time</option>
                                                <option>Part-time</option>
                                                <option>Contract</option>
                                                <option>Freelance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                            <input required className="w-full px-4 py-2 border rounded-lg"
                                                value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                        <input required type="email" className="w-full px-4 py-2 border rounded-lg"
                                            value={newJob.contactEmail} onChange={e => setNewJob({ ...newJob, contactEmail: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea required rows="4" className="w-full px-4 py-2 border rounded-lg"
                                            value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })}></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                                        <textarea rows="4" className="w-full px-4 py-2 border rounded-lg"
                                            placeholder="- Experience with React&#10;- Knowledge of CSS"
                                            value={newJob.requirements} onChange={e => setNewJob({ ...newJob, requirements: e.target.value })}></textarea>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                                        {isLoading ? <span className="flex items-center justify-center"><Loader2 className="animate-spin mr-2" /> Posting...</span> : 'Post Job'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">Active Listings</h2>
                            <div className="space-y-4">
                                {jobs.map(job => (
                                    <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                        <div>
                                            <h3 className="font-bold">{job.title}</h3>
                                            <p className="text-sm text-gray-500">{job.type} • {job.location}</p>
                                        </div>
                                        <button onClick={() => handleDeleteJob(job._id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                                {jobs.length === 0 && <p className="text-gray-500 text-center">No active jobs.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* NEWSLETTER TAB */}
                {activeTab === 'newsletter' && (
                    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-6">Send Newsletter</h2>
                        <form className="space-y-4" onSubmit={e => {
                            e.preventDefault();
                            // Just a mailto link simulation as per original admin.js
                            const subject = encodeURIComponent(e.target.subject.value);
                            const body = encodeURIComponent(e.target.body.value);
                            // In real app, fetch recipients from backend. Here we simulate.
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                        }}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input name="subject" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                                <textarea name="body" rows="6" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded text-sm text-yellow-800">
                                <p>Note: This will open your default email client with the newsletter content ready to send to your subscriber list.</p>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                                Compose in Email Client
                            </button>
                        </form>
                    </div>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {!analytics ? (
                            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /> Loading Stats...</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                                <h3 className="text-2xl font-bold mt-1">KES {analytics.revenue?.toLocaleString() || 0}</h3>
                                            </div>
                                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                <TrendingUp size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                                <h3 className="text-2xl font-bold mt-1">{analytics.totalOrders || 0}</h3>
                                            </div>
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <ShoppingCart size={20} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
                                                <h3 className="text-2xl font-bold mt-1">KES {analytics.totalOrders ? Math.round(analytics.revenue / analytics.totalOrders).toLocaleString() : 0}</h3>
                                            </div>
                                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                <BarChart3 size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-4">Sales Trend (Last 7 Days)</h3>
                                        <Bar data={{
                                            labels: analytics.ordersPerDay?.map(d => d._id) || [],
                                            datasets: [{
                                                label: 'Revenue (KES)',
                                                data: analytics.ordersPerDay?.map(d => d.revenue) || [],
                                                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                                                borderRadius: 4
                                            }]
                                        }} options={{ responsive: true }} />
                                    </div>

                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-4">Top Selling Products</h3>
                                        <div className="space-y-4">
                                            {analytics.topProducts?.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="font-bold text-gray-400">#{i + 1}</span>
                                                        <span className="font-medium">{p._id}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">{p.quantitySold} sold</div>
                                                        <div className="text-xs text-gray-500">KES {p.revenueGenerated?.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!analytics.topProducts || analytics.topProducts.length === 0) && <p className="text-gray-500 text-sm">No sales data yet.</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-4">Least Selling Products (Bottom 5)</h3>
                                    <div className="space-y-4">
                                        {analytics.bottomProducts?.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-bold text-gray-400">#{i + 1}</span>
                                                    <span className="font-medium">{p._id}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{p.quantitySold} sold</div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!analytics.bottomProducts || analytics.bottomProducts.length === 0) && <p className="text-gray-500 text-sm">No sales data yet.</p>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}
