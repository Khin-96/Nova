"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, size) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === (product._id || product.id) && item.size === size);
            if (existing) {
                return prev.map(item => item.id === (product._id || product.id) && item.size === size
                    ? { ...item, quantity: item.quantity + 1 }
                    : item);
            } else {
                return [...prev, {
                    id: product._id || product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    size: size,
                    quantity: 1,
                    category: product.category
                }];
            }
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id, size) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
    };

    const updateQuantity = (id, size, action) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.size === size) {
                const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            isCartOpen, setIsCartOpen, cartTotal, cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
