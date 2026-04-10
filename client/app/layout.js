import './globals.css';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import CartSidebar from '@/app/components/CartSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Misa Studio - Contemporary Style for Modern Life',
    description: 'Discover the latest trends in fashion with Misa Studio. Premium quality clothing including cargo pants, crop tops, dresses, and accessories. Free delivery in Mombasa & Kilifi.',
    keywords: ['fashion', 'clothing', 'Kenya fashion', 'cargo pants', 'crop tops', 'dresses', 'streetwear', 'Misa Studio', 'Mombasa fashion'],
    authors: [{ name: 'Misa Studio' }],
    creator: 'Hinzano',
    publisher: 'Hinzano',
    metadataBase: new URL('https://misastudioshop.netlify.app'),
    alternates: {
        canonical: '/',
    },
    icons: {
        icon: '/Misa_Favicon.png',
        apple: '/Misa_Favicon.png',
    },
    openGraph: {
        title: 'Misa Studio - Contemporary Style for Modern Life',
        description: 'Discover the latest trends in fashion with Misa Studio. Premium quality clothing for the modern individual.',
        url: 'https://novawears.tech',
        siteName: 'Misa Studio',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Misa Studio Fashion Collection',
            },
        ],
        locale: 'en_KE',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Misa Studio - Contemporary Style for Modern Life',
        description: 'Discover the latest trends in fashion with Misa Studio.',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: 'Tn20NyLw5A7btwFIUpw0KVKQ5XHzJV3U_iIf82Qskg8',
    },
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
