"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function FAQPage() {
    return (
        <StaticPageLayout title="Frequently Asked Questions">
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-lg">How long does shipping take?</h3>
                    <p>Shipping within Kenya typically takes 1-3 business days. International shipping takes 7-14 days.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Do you offer refunds?</h3>
                    <p>Yes, we offer refunds on defective items returned within 7 days of purchase. Please clear tags must be attached.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Where are you located?</h3>
                    <p>Our main warehouse and physical shop are located in Mombasa, Kenya.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg">How do I track my order?</h3>
                    <p>Once your order is dispatched, you will receive an SMS or Email with tracking details.</p>
                </div>
            </div>
        </StaticPageLayout>
    );
}
