"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function SizeGuidePage() {
    return (
        <StaticPageLayout title="Size Guide">
            <p className="mb-6">Use this guide to find your perfect fit. Measurements are in inches.</p>

            <h3 className="text-xl font-bold mb-4">T-Shirts & Tops</h3>
            <table className="w-full border-collapse border border-gray-300 mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Size</th>
                        <th className="border p-2">Chest</th>
                        <th className="border p-2">Length</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="border p-2">S</td><td className="border p-2">36-38"</td><td className="border p-2">27"</td></tr>
                    <tr><td className="border p-2">M</td><td className="border p-2">38-40"</td><td className="border p-2">28"</td></tr>
                    <tr><td className="border p-2">L</td><td className="border p-2">40-42"</td><td className="border p-2">29"</td></tr>
                    <tr><td className="border p-2">XL</td><td className="border p-2">42-44"</td><td className="border p-2">30"</td></tr>
                </tbody>
            </table>

            <h3 className="text-xl font-bold mb-4">Pants & Bottoms</h3>
            <table className="w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2">Size</th>
                        <th className="border p-2">Waist</th>
                        <th className="border p-2">Inseam</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td className="border p-2">S</td><td className="border p-2">28-30"</td><td className="border p-2">30"</td></tr>
                    <tr><td className="border p-2">M</td><td className="border p-2">31-33"</td><td className="border p-2">32"</td></tr>
                    <tr><td className="border p-2">L</td><td className="border p-2">34-36"</td><td className="border p-2">32"</td></tr>
                    <tr><td className="border p-2">XL</td><td className="border p-2">36-38"</td><td className="border p-2">34"</td></tr>
                </tbody>
            </table>
        </StaticPageLayout>
    );
}
