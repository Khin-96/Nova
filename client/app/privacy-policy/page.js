"use client";
import StaticPageLayout from '@/app/components/StaticPageLayout';

export default function PrivacyPolicyPage() {
    return (
        <StaticPageLayout title="Privacy Policy">
            <p>Your privacy is important to us. This policy explains how we handle your personal information.</p>
            <h3 className="text-xl font-bold mt-6 mb-2">Data Collection</h3>
            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes name, email, phone number, and shipping address.</p>

            <h3 className="text-xl font-bold mt-6 mb-2">How We Use Data</h3>
            <p>We use your data to process orders, communicate with you, and improve our services. We do not sell your personal data to third parties.</p>
        </StaticPageLayout>
    );
}
