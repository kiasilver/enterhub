'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export default function TeamPage() {
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
        <div className="max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6" style={{ color: theme === 'dark' ? 'white' : 'black' }}>
              Our Team
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto px-2" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Meet the industry experts, data scientists, and safety engineers behind Safe. We are dedicated to protecting your workforce.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Sarah Jenkins', role: 'Chief Executive Officer', desc: 'Former Head of Industrial Safety at Nexus Corp with 15 years of field experience.', img: 'https://i.pravatar.cc/150?u=sarah' },
              { name: 'Dr. Alan Turing', role: 'Head of Data Science', desc: 'Pioneer in predictive analytics and risk modeling. Leads our AI research lab.', img: 'https://i.pravatar.cc/150?u=alan' },
              { name: 'Marcus Chen', role: 'VP of Engineering', desc: 'Expert in highly scalable systems and IoT integrations. Built the core Safe infrastructure.', img: 'https://i.pravatar.cc/150?u=marcus' },
              { name: 'Elena Rodriguez', role: 'Chief Safety Officer', desc: 'Certified industrial hygienist ensuring our platform meets global compliance standards.', img: 'https://i.pravatar.cc/150?u=elena' },
              { name: 'David Kim', role: 'Product Manager', desc: 'Translates complex safety requirements into intuitive, glassmorphic user experiences.', img: 'https://i.pravatar.cc/150?u=david' },
              { name: 'James Wilson', role: 'Customer Success', desc: 'Dedicated to helping enterprise clients deploy Safe across thousands of facilities.', img: 'https://i.pravatar.cc/150?u=james' },
            ].map((member, i) => (
              <div 
                key={i}
                className="p-6 rounded-[32px] backdrop-blur-xl transition-colors duration-300 flex flex-col items-center text-center"
                style={{
                  backgroundColor: theme === 'dark' ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)',
                }}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-1" style={{ color: theme === 'dark' ? 'white' : 'black' }}>{member.name}</h3>
                <div className="text-sm font-semibold mb-4" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{member.role}</div>
                <p className="text-sm leading-relaxed" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                  {member.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
