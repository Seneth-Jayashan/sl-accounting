import React from 'react';
import { FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PSection: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mb-8" style={{ scrollMarginTop: '6rem' }}>
    <h3 className="text-xl font-semibold text-brand-prussian mb-3">{title}</h3>
    <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
  </section>
);

const Privacy: React.FC = () => {
  const updated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b py-8 mt-24">
        <div className="container mx-auto max-w-6xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-aliceBlue rounded-md"><FileText className="w-6 h-6 text-brand-cerulean" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-gray-500">Last updated: {updated}</p>
            </div>
          </div>
          <Link to="/" className="text-sm text-brand-cerulean">Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="order-1 lg:col-span-1">
          <nav className="sticky top-24 rounded-lg p-4 bg-gray-50 border border-gray-100">
            <p className="text-xs uppercase text-gray-500 font-semibold mb-3">On this page</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#intro" className="text-brand-prussian hover:underline">Introduction</a></li>
              <li><a href="#collect" className="text-brand-prussian hover:underline">Information We Collect</a></li>
              <li><a href="#use" className="text-brand-prussian hover:underline">How We Use</a></li>
              <li><a href="#share" className="text-brand-prussian hover:underline">Sharing & Disclosure</a></li>
              <li><a href="#rights" className="text-brand-prussian hover:underline">Your Rights</a></li>
            </ul>
          </nav>
        </aside>

        <article className="order-2 lg:col-span-3">
          <PSection id="intro" title="1. Introduction">
            <p>SL Accounting is committed to protecting your privacy. This policy explains how we collect, use, and disclose information when you use our website and services.</p>
          </PSection>

          <PSection id="collect" title="2. Information We Collect">
            <p>We collect information you provide directly (e.g., registration and payment details) and information collected automatically (e.g., usage data, cookies).</p>
            <ul>
              <li>Account information: name, email, phone.</li>
              <li>Payment details: processed by third-party providers (we do not store full card details).</li>
              <li>Usage data: pages visited, session duration, IP address.</li>
            </ul>
          </PSection>

          <PSection id="use" title="3. How We Use Your Information">
            <p>We use data to provide and improve services, process payments, communicate with you, and for security and fraud prevention.</p>
          </PSection>

          <PSection id="share" title="4. Sharing and Disclosure">
            <p>We do not sell personal data. We may share information with service providers, payment processors, analytics providers, and when required by law.</p>
          </PSection>

          <PSection id="rights" title="5. Your Rights & Contact">
            <p>You may request access to your personal data, request corrections, or ask for deletion where applicable under law. To exercise these rights, contact us.</p>
            <div className="mt-4 rounded-lg border-l-4 border-brand-cerulean bg-brand-aliceBlue p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-brand-cerulean" />
                <div>
                  <p className="text-sm">For privacy inquiries or rights requests, email <a href="mailto:info@kalumwaduge.com" className="text-brand-cerulean font-medium">info@kalumwaduge.com</a></p>
                </div>
              </div>
            </div>
          </PSection>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
