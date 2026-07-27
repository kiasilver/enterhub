'use client';

import { motion, type Variants } from 'motion/react';
import { Flag, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

const TIMELINE_DATA = [
  {
    id: 1,
    date: 'Oct 24, 2023',
    time: '10:00 AM',
    title: 'Project Setup Initiated',
    desc: 'The new safety framework was deployed to the staging environment for preliminary checks.',
    icon: <Flag size={14} />,
    color: 'var(--primary)', // purple
    status: 'Completed'
  },
  {
    id: 2,
    date: 'Nov 12, 2023',
    time: '02:30 PM',
    title: 'Initial Safety Audit',
    desc: 'External auditors completed the phase 1 safety audit with a 98% compliance score.',
    icon: <CheckCircle size={14} />,
    color: 'var(--primary)',
    status: 'Completed'
  },
  {
    id: 3,
    date: 'Jan 05, 2024',
    time: '09:15 AM',
    title: 'Minor Incident Reported',
    desc: 'A level-2 incident was reported in Sector 4. The response team contained it within 12 minutes.',
    icon: <AlertTriangle size={14} />,
    color: 'var(--primary)',
    status: 'Resolved'
  },
  {
    id: 4,
    date: 'Mar 18, 2024',
    time: '11:45 AM',
    title: 'Full System Upgrade',
    desc: 'Deployed v2.0 of the Enterhub protocol across all active sites. Downtime was minimal.',
    icon: <ShieldCheck size={14} />,
    color: 'var(--primary)',
    status: 'Completed'
  },
  {
    id: 5,
    date: 'Jun 30, 2024',
    time: 'TBD',
    title: 'Annual Compliance Review',
    desc: 'Upcoming comprehensive review of all safety protocols and personnel certifications.',
    icon: <Clock size={14} />,
    color: 'var(--primary)',
    status: 'Upcoming'
  }
];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } } };

export default function SafeTimeline({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const glass = glassStyle(isDark);

  return (
    <div className="w-full h-full overflow-y-auto pb-10" style={{ scrollbarWidth: 'none' }}>

      {/* Header */}
      <motion.div
        className="mb-10 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h2 variants={item} className="text-3xl font-black mb-2" style={{ color: pri, letterSpacing: '-0.02em' }}>Project Timeline</motion.h2>
        <motion.p variants={item} className="text-sm font-medium max-w-lg mx-auto" style={{ color: mut }}>
          Track the history of project milestones, audits, and safety incidents.
        </motion.p>
      </motion.div>

      {/* Timeline Container */}
      <div className="max-w-3xl mx-auto relative px-4">
        
        {/* Central Line */}
        <motion.div
          className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
          style={{ background: `linear-gradient(to bottom, transparent, ${borderSubtle(isDark)}, transparent)`, transformOrigin: 'top' }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {TIMELINE_DATA.map((item, i) => {
          const isEven = i % 2 === 0;

          return (
            <motion.div
              key={item.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              transition={{ staggerChildren: 0.08 }}
              className={`relative flex flex-col md:flex-row items-start mb-12 ${isEven ? 'md:flex-row-reverse' : ''}`}
            >

              {/* Center Dot */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 mt-6 z-10 flex items-center justify-center">
                <motion.div
                  variants={{ hidden: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 22 } } }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ background: item.color, boxShadow: `0 0 15px ${item.color}60`, border: `2px solid ${isDark ? '#000' : '#fff'}` }}
                >
                  {item.icon}
                </motion.div>
              </div>

              {/* Spacer for alternating layout (Desktop) */}
              <div className="hidden md:block w-1/2 px-8" />

              {/* Content Card */}
              <div className={`w-full pl-12 md:pl-0 md:w-1/2 ${isEven ? 'md:pr-10' : 'md:pl-10'}`}>
                <motion.div
                  variants={{ hidden: { opacity: 0, x: isEven ? -24 : 24 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } } }}
                  whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                  className="p-6 rounded-3xl relative group" style={glass}>
                  {/* Subtle glow border on hover based on status color */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                    style={{ border: `1px solid ${item.color}40`, boxShadow: `inset 0 0 20px ${item.color}10` }}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-block" 
                      style={{ background: `${item.color}15`, color: item.color }}
                    >
                      {item.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: pri }}>{item.date}</p>
                      <p className="text-[10px] font-semibold" style={{ color: mut }}>{item.time}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-black mb-2" style={{ color: pri }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: sec }}>{item.desc}</p>
                </motion.div>
              </div>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
