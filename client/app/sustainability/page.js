"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function SustainabilityPage() {
    return (
        <StaticPageLayout title="Sustainability">
            <p>At NOVA WEAR, we are committed to reducing our environmental footprint.</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Ethical Sourcing:</strong> We work with suppliers who ensure fair wages and safe working conditions.</li>
                <li><strong>Eco-Friendly Packaging:</strong> We are transitioning to 100% biodegradable packaging materials.</li>
                <li><strong>Durability:</strong> We focus on quality over quantity. Our clothes are made to last, reducing textile waste.</li>
            </ul>
        </StaticPageLayout>
    );
}
