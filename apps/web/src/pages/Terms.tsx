import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mb-8" style={{ scrollMarginTop: '6rem' }}>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
  </section>
);

const Terms: React.FC = () => {
  const updated = 'January 1, 2026';

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b py-8 mt-24">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Terms & Conditions</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: {updated}</p>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 p-1 text-gray-500" />
            <div className="text-sm text-gray-600">
              <div>Secure payments · Non-refundable policy</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="order-1 lg:order-1 lg:col-span-1">
          <nav className="sticky top-24 rounded-lg p-4 bg-gray-50 border border-gray-100">
            <p className="text-xs uppercase text-gray-500 font-semibold mb-3">On this page</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#introduction" className="text-brand-prussian hover:underline">Introduction</a></li>
              <li><a href="#payments" className="text-brand-prussian hover:underline">Payments & Policy</a></li>
              <li><a href="#access" className="text-brand-prussian hover:underline">Service Access</a></li>
              <li><a href="#ip" className="text-brand-prussian hover:underline">Intellectual Property</a></li>
              <li><a href="#contact" className="text-brand-prussian hover:underline">Contact</a></li>
            </ul>
          </nav>
        </aside>

        <article className="order-2 lg:order-2 lg:col-span-3">
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-10 h-10 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <div className="rounded-lg border-l-4 border-gray-200 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Important — Non-Refundable Policy</p>
                  <p className="text-sm text-gray-700 mt-1">All course purchases, enrollment fees, and related payments are final and non-refundable unless otherwise required by law. By completing a payment you acknowledge and agree to this policy.</p>
                </div>
              </div>
            </div>
          </div>

          <Section id="introduction" title="1. Introduction">
            <p>Welcome to SL Accounting. These Terms &amp; Conditions govern your use of our services and website. By using our services you agree to these terms.</p>
          </Section>

          <Section id="payments" title="2. Payments and Non-Refundable Policy">
            <p>All payments for courses and services are processed through our payment partners. Payments are final and non-refundable except where statutory consumer rights apply or when explicitly stated otherwise.</p>
            <ul>
              <li>Check course details and schedule before purchasing.</li>
              <li>Contact support about billing questions prior to payment.</li>
              <li>Refund exceptions (if any) are at the sole discretion of SL Accounting and handled case-by-case.</li>
            </ul>
          </Section>

          <Section id="access" title="3. Service Access">
            <p>We strive to provide uninterrupted access to course materials but cannot guarantee continuous availability. We may modify or discontinue services, and will notify users when practical.</p>
          </Section>

          <Section id="ip" title="4. Intellectual Property">
            <p>All course materials, videos, and content are the intellectual property of SL Accounting or our licensors. Unauthorized copying, distribution, or republishing is prohibited and may result in legal action.</p>
          </Section>

          <Section id="contact" title="5. Contact">
            <p>For questions about these Terms, email us at <a href="mailto:info@kalumwaduge.com" className="text-brand-cerulean font-medium">info@kalumwaduge.com</a>.</p>
            <div className="mt-4">
              <Link to="/" className="inline-block px-4 py-2 bg-brand-cerulean text-white rounded-md shadow-sm hover:opacity-95">Back to Home</Link>
            </div>
          </Section>
        </article>
      </main>
    </div>
  );
};

export default Terms;
