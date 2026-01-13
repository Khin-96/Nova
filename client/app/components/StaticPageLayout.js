import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function StaticPageLayout({ title, children }) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar /> {/* Assuming Navbar is self-contained via CartProvider */}
            <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-4xl font-bold mb-8 text-center border-b pb-4">{title}</h1>
                <div className="prose lg:prose-xl mx-auto text-gray-700">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
