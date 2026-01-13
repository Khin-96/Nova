"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function ContactPage() {
    return (
        <StaticPageLayout title="Contact Us">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
                    <p className="mb-4">We'd love to hear from you. Whether you have a question about our products, orders, or just want to say hi.</p>
                    <div className="space-y-2">
                        <p><strong>Email:</strong> support@novawear.co.ke</p>
                        <p><strong>Phone:</strong> +254 700 000 000</p>
                        <p><strong>Address:</strong> Mombasa, Kenya</p>
                    </div>
                </div>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input type="text" className="w-full border rounded p-2" placeholder="Your Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" className="w-full border rounded p-2" placeholder="your@email.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <textarea rows="4" className="w-full border rounded p-2" placeholder="How can we help?"></textarea>
                    </div>
                    <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">Send Message</button>
                </form>
            </div>
        </StaticPageLayout>
    );
}
