'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export default function TermsPage() {
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
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              Terms of Service
            </h1>
            <p className="text-base sm:text-lg px-2" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Please read these terms carefully before using Safe.
            </p>
          </div>

          <div 
            className="p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] backdrop-blur-xl transition-colors duration-300"
            style={{
              backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <div className="space-y-6 text-base leading-relaxed" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: theme === 'dark' ? 'white' : 'black' }}>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using the Safe platform, you agree to comply with our comprehensive terms of service. This platform is designed for professional Project Management and enterprise risk assessment. If you do not agree to these terms, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: theme === 'dark' ? 'white' : 'black' }}>2. Usage Rights</h2>
                <p>
                  Users are granted a limited, non-exclusive license to utilize the analytical tools and dashboards provided by Safe. Unauthorized reproduction of the platform's proprietary algorithms, UI designs, or source code is strictly prohibited and will result in immediate termination of services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: theme === 'dark' ? 'white' : 'black' }}>3. Data Accuracy</h2>
                <p>
                  While our predictive models and incident tracking systems are highly accurate, users must independently verify critical safety parameters. Safe is designed to assist, not replace, human judgment. Safe is not liable for operational hazards resulting from misinterpretation of analytics.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: theme === 'dark' ? 'white' : 'black' }}>4. Account Suspension</h2>
                <p>
                  We reserve the right to suspend or terminate accounts that violate safety protocols, attempt malicious activities on our servers, or fail to comply with billing agreements. Any attempt to reverse-engineer our platform will be met with legal action.
                </p>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: theme === 'dark' ? 'white' : 'black' }}>5. Updates to Terms</h2>
                <p>
                  We may update these terms from time to time to reflect new features or regulatory changes. Continued use of the platform after any such changes constitutes your consent to the updated terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
