import './globals.css';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import CartSidebar from '@/app/components/CartSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Nova Wear - Contemporary Style for Modern Life',
    description: 'Discover the latest trends in fashion with Nova Wear. Premium quality clothing including cargo pants, crop tops, dresses, and accessories. Free delivery in Mombasa & Kilifi.',
    keywords: ['fashion', 'clothing', 'Kenya fashion', 'cargo pants', 'crop tops', 'dresses', 'streetwear', 'Nova Wear', 'Mombasa fashion'],
    authors: [{ name: 'Nova Wear' }],
    creator: 'Nova Wear',
    publisher: 'Nova Wear',
    metadataBase: new URL('https://novawears.tech'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Nova Wear - Contemporary Style for Modern Life',
        description: 'Discover the latest trends in fashion with Nova Wear. Premium quality clothing for the modern individual.',
        url: 'https://novawears.tech',
        siteName: 'Nova Wear',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Nova Wear Fashion Collection',
            },
        ],
        locale: 'en_KE',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nova Wear - Contemporary Style for Modern Life',
        description: 'Discover the latest trends in fashion with Nova Wear.',
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
        google: 'your-google-verification-code', // Add your Google Search Console verification code
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
