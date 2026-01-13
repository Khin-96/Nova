"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function ShippingPage() {
    return (
        <StaticPageLayout title="Shipping & Returns">
            <h3>Shipping Policy</h3>
            <p>We deliver countrywide. Deliveries within Mombasa and Kilifi are free. Other regions attract a flat rate of KES 450.</p>
            <p>Orders placed before 2 PM are typically dispatched the same day.</p>

            <h3 className="mt-8">Return Policy</h3>
            <p>We accept returns for store credit or exchange within 7 days of delivery. Items must be unworn, unwashed, and with original tags.</p>
            <p>Sale items are final sale and cannot be returned.</p>
        </StaticPageLayout>
    );
}
