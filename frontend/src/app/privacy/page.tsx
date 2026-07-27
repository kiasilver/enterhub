'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export default function PrivacyPage() {
  const { theme } = useTheme();

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: theme === 'dark' ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>

      <Navbar />

      <div className="relative z-10 flex flex-col flex-1 pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full space-y-8 sm:space-y-12">
          <div className="text-center mb-8 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              Privacy & Security
            </h1>
            <p className="text-base sm:text-lg px-2" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              How we protect your data and enterprise systems.
            </p>
          </div>

          {/* Privacy Section */}
          <div 
            className="p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] backdrop-blur-xl transition-colors duration-300"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme === 'dark' ? 'white' : 'black' }}>Data Privacy Policy</h2>
            <div className="space-y-4 text-base leading-relaxed" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
              <p>
                At Safe, your data security is our top priority. We employ industry-leading encryption protocols and advanced threat detection mechanisms to ensure that all safety reports, team data, and analytical insights remain strictly confidential.
              </p>
              <p>
                Our infrastructure is fully compliant with global data privacy regulations including GDPR and CCPA. Every incident logged and every metric tracked is isolated within secure, geo-redundant servers.
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2">
                <li>End-to-end encryption for all data in transit and at rest.</li>
                <li>Role-based access controls to limit data exposure.</li>
                <li>24/7 automated security audits and anomaly detection.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
