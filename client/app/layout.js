import './globals.css';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import CartSidebar from '@/app/components/CartSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Nova Wear - We Style You',
    description: 'Contemporary Style for Modern Life',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            </head>
            <body className={inter.className}>
                <CartProvider>
                    {children}
                    <CartSidebar />
                </CartProvider>
            </body>
        </html>
    );
}
