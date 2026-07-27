'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill, canvasBg } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

interface TicketComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  submitterName: string;
  submitterEmail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'hazard' | 'equipment' | 'compliance' | 'general';
  status: 'open' | 'in_progress' | 'resolved';
  date: string;
  description: string;
  zone: string;
  telemetryName: string;
  telemetryUnit: string;
  sensorThreshold: number;
  comments: TicketComment[];
}

interface TelemetryPoint {
  time: string;
  value: number;
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-2026-924',
    subject: 'Breaker Panel 3 calibration fail',
    submitterName: 'Mohammad Reza',
    submitterEmail: 'm.reza@enterhub.io',
    severity: 'critical',
    category: 'equipment',
    status: 'open',
    date: '2026-06-19 18:45',
    zone: 'Zone A - Power Distribution Room',
    telemetryName: 'Thermal Sensor TS-A4',
    telemetryUnit: '°C',
    sensorThreshold: 75,
    description: 'The heat flow calibration index on thermal sensor A4 keeps returning out-of-bounds error logs. Needs physical testing and recalibration to prevent high-temp breaker trips.',
    comments: [
      { id: 'c1', author: 'SYSTEM BOT', avatar: 'SB', text: 'Thermal sensor A4 exceeded safety threshold limit of 75°C (Current: 82.5°C). Critical alarm logged.', time: '18:42 PM' },
      { id: 'c2', author: 'Mohammad Reza', avatar: 'MR', text: 'Power loop isolated. Terminal leads dispatched for physical inspection.', time: '19:15 PM' },
    ],
  },
  {
    id: 'TCK-2026-931',
    subject: 'Scaffolding latch corrosion in Zone C',
    submitterName: 'Hassan Alavi',
    submitterEmail: 'h.alavi@enterhub.io',
    severity: 'medium',
    category: 'hazard',
    status: 'in_progress',
    date: '2026-06-19 10:15',
    zone: 'Zone C - Heavy Storage Rack 14',
    telemetryName: 'Zone C Ambient Humidity (H-C2)',
    telemetryUnit: '%',
    sensorThreshold: 65,
    description: 'Weekly mechanical structural audit showed light surface corrosion on the main extension ladder locking latch. Restricting vertical access tag-out until sign-off.',
    comments: [
      { id: 'c5', author: 'Hassan Alavi', avatar: 'HA', text: 'Safety tags attached to ladder. Scaffolding marked unsafe for multi-person overhead loads.', time: '10:30 AM' },
    ],
  },
  {
    id: 'TCK-2026-903',
    subject: 'Forklift charger spark incident',
    submitterName: 'Sara Nouri',
    submitterEmail: 's.nouri@enterhub.io',
    severity: 'high',
    category: 'hazard',
    status: 'resolved',
    date: '2026-06-18 14:10',
    zone: 'Zone B - Charging Station Dock 5',
    telemetryName: 'Forklift Charger Current Draw',
    telemetryUnit: 'kW',
    sensorThreshold: 15,
    description: 'Electrical sparking observed upon insertion of charger plug into Forklift 5. Immediate load isolator switch was flipped to check for cable shield breach.',
    comments: [
      { id: 'c3', author: 'Ali Mohammadi', avatar: 'AM', text: 'Electrical team deployed to check charger power supply surge protection.', time: '14:22 PM' },
      { id: 'c4', author: 'Mohammad Reza', avatar: 'MR', text: 'Cleaned contacts, tightened supply clamp. Tested dry draw cycles and spark cleared.', time: '16:05 PM' },
    ],
  },
  {
    id: 'TCK-2026-928',
    subject: 'OSHA placard missing near chemical shelf',
    submitterName: 'Sara Nouri',
    submitterEmail: 's.nouri@enterhub.io',
    severity: 'low',
    category: 'compliance',
    status: 'open',
    date: '2026-06-18 09:30',
    zone: 'Zone B - Chemical Storage Cabinet 4',
    telemetryName: 'Zone B Hood Exhaust (EX-B2)',
    telemetryUnit: 'PPM',
    sensorThreshold: 50,
    description: 'Emergency eyewash station placard has detached due to high humidity spray. Needs OSHA hazard instruction sheet replacement.',
    comments: [],
  },
];

const SEVERITY_CONFIG = {
  critical: { label: 'Critical Alert', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: 'High Priority', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  medium: { label: 'Medium Issue', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  low: { label: 'Low/Notice', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

const STATUS_CONFIG = {
  open: { label: 'Open Tag', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  in_progress: { label: 'Assigned', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  resolved: { label: 'Cleared', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
};

const CATEGORIES = {
  hazard: { label: 'Hazard Alert', color: '#ef4444' },
  equipment: { label: 'Equipment Fault', color: '#3b82f6' },
  compliance: { label: 'Compliance Gap', color: '#f59e0b' },
  general: { label: 'General Request', color: 'var(--primary)' },
};

const ONLINE_OPERATORS = [
  { name: 'Mohammad Reza', zone: 'Zone A', active: true },
  { name: 'Sara Nouri', zone: 'Zone B', active: true },
  { name: 'Hassan Alavi', zone: 'Zone C', active: true },
  { name: 'Ali Mohammadi', zone: 'Control', active: true }
];

// Helper to generate initial sensor telemetry points
const generateInitialTelemetry = (baseVal: number, points = 10) => {
  const data = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const timeStr = new Date(now - i * 4000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    data.push({
      time: timeStr,
      value: Number((baseVal + (Math.random() * 4 - 2)).toFixed(1))
    });
  }
  return data;
};

// SVG Icons
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconMessage = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 animate-pulse">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function SafeSupport({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';

  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState<string>('TCK-2026-924');
  // On phones the list and console are separate screens we switch between.
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Report Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSeverity, setFormSeverity] = useState<keyof typeof SEVERITY_CONFIG>('high');
  const [formCategory, setFormCategory] = useState<keyof typeof CATEGORIES>('hazard');
  const [formZone, setFormZone] = useState('Zone A - General Area');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Initialize and track telemetry
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryPoint[]>>(() => ({
    'TCK-2026-924': generateInitialTelemetry(82.5),
    'TCK-2026-931': generateInitialTelemetry(68.2),
    'TCK-2026-903': generateInitialTelemetry(4.8),
    'TCK-2026-928': generateInitialTelemetry(18.0),
  }));

  // Update telemetry values every 3 seconds for dynamic fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(tid => {
          const t = tickets.find(ticket => ticket.id === tid);
          if (!t) return;

          const points = next[tid] || [];
          if (points.length === 0) return;

          const lastVal = points[points.length - 1].value;
          let targetBase = lastVal;

          if (t.status === 'resolved') {
            // Drop down to safe ranges
            if (t.id.includes('924')) targetBase = 32.4;
            else if (t.id.includes('931')) targetBase = 44.5;
            else if (t.id.includes('903')) targetBase = 0.0;
            else if (t.id.includes('928')) targetBase = 12.0;
            else targetBase = 15.0;
          } else {
            // Alarm ranges
            if (t.id.includes('924')) targetBase = 82.0;
            else if (t.id.includes('931')) targetBase = 68.0;
            else if (t.id.includes('903')) targetBase = 18.2;
            else if (t.id.includes('928')) targetBase = 18.0;
            else targetBase = 60.0;
          }

          const newValue = Number((targetBase + (Math.random() * 2 - 1)).toFixed(1));
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          next[tid] = [...points.slice(1), { time: timeStr, value: newValue }];
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [tickets]);

  // Background simulations for comments, tickets, and automatic updates (every 22 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.random();
      if (r < 0.3) {
        // Spawn new ticket
        const mockIncidents = [
          {
            subject: 'Zone B gas ventilation leak',
            description: 'Intrinsically safe vent analyzer GA-B2 detected hazardous vapors exceeding 50 PPM threshold levels in storage locker room. Activating safety evacuation sweep.',
            severity: 'critical',
            category: 'hazard',
            zone: 'Zone B - Chemical Processing Room',
            telemetryName: 'Carbon Monoxide Vapor Index',
            telemetryUnit: 'PPM',
            sensorThreshold: 50,
            baseVal: 62.4,
          },
          {
            subject: 'Emergency exit lock block Zone A',
            description: 'Warning light EX-A2 flagged mechanical lock fault on egress door 4 during routine supervisor check. Access pathway must remain clear.',
            severity: 'high',
            category: 'compliance',
            zone: 'Zone A - Logistics Passage',
            telemetryName: 'Door Solenoid Voltage',
            telemetryUnit: 'V',
            sensorThreshold: 24,
            baseVal: 11.2, // Below nominal threshold
          },
          {
            subject: 'Line 2 coolant pump vibration',
            description: 'Vibration telemetry sensor VIB-08 logged frequency spike on fluid circulation line 2. Inspecting motor mounting bolts.',
            severity: 'medium',
            category: 'equipment',
            zone: 'Zone C - Coolant Station',
            telemetryName: 'Vibration Frequency',
            telemetryUnit: 'Hz',
            sensorThreshold: 45,
            baseVal: 53.8,
          }
        ];

        const match = mockIncidents[Math.floor(Math.random() * mockIncidents.length)];
        const tid = `TCK-2026-${Math.floor(Math.random() * 900 + 100)}`;
        
        const newTicket: SupportTicket = {
          id: tid,
          subject: match.subject,
          submitterName: ['Kian Saberi', 'Sina Rostami', 'Neda Zarei'][Math.floor(Math.random() * 3)],
          submitterEmail: 'field-support@enterhub.io',
          severity: match.severity as SupportTicket['severity'],
          category: match.category as SupportTicket['category'],
          status: 'open',
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          zone: match.zone,
          description: match.description,
          telemetryName: match.telemetryName,
          telemetryUnit: match.telemetryUnit,
          sensorThreshold: match.sensorThreshold,
          comments: [
            { id: `c-init-${tid}`, author: 'SYSTEM COMMAND', avatar: 'SC', text: 'Incident registered. Automated telemetry routing active.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };

        setTickets(prev => {
          if (prev.some(t => t.subject === newTicket.subject)) return prev;
          return [newTicket, ...prev];
        });

        setTelemetry(prev => ({
          ...prev,
          [tid]: generateInitialTelemetry(match.baseVal)
        }));

      } else if (r < 0.6) {
        // Operator posts comment
        setTickets(prev => {
          const active = prev.filter(t => t.status !== 'resolved');
          if (active.length === 0) return prev;
          const target = active[Math.floor(Math.random() * active.length)];

          const responses = [
            'Adjusting exhaust fan frequencies to mitigate reading spikes.',
            'Dispatched physical tags for locking down structural platform.',
            'Verifying circuit layout diagnostics on sensor terminals.',
            'Compliance supervisor notified. Awaiting field documentation clearance.',
          ];

          const author = ['Mohammad Reza', 'Sara Nouri', 'Hassan Alavi'][Math.floor(Math.random() * 3)];
          const avatar = author.split(' ').map(n => n[0]).join('');

          const newComment: TicketComment = {
            id: `c-sim-${Date.now()}`,
            author,
            avatar,
            text: responses[Math.floor(Math.random() * responses.length)],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          return prev.map(t => {
            if (t.id === target.id) {
              return {
                ...t,
                status: t.status === 'open' ? 'in_progress' : t.status,
                comments: [...t.comments, newComment],
              };
            }
            return t;
          });
        });
      } else if (r < 0.8) {
        // System resolves an issue
        setTickets(prev => {
          const active = prev.filter(t => t.status !== 'resolved');
          if (active.length === 0) return prev;
          const target = active[Math.floor(Math.random() * active.length)];

          const resolveComment: TicketComment = {
            id: `c-res-${Date.now()}`,
            author: 'SYSTEM MONITOR',
            avatar: 'SM',
            text: 'Telemetry bounds checked. Target sensor has returned to optimal safe parameters. Automatically resolving tag.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          return prev.map(t => {
            if (t.id === target.id) {
              return {
                ...t,
                status: 'resolved',
                comments: [...t.comments, resolveComment],
              };
            }
            return t;
          });
        });
      }
    }, 22000);
    return () => clearInterval(timer);
  }, [tickets]);

  const getInputStyle = (fieldName: string) => ({
    borderColor: focusedField === fieldName ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedField === fieldName
      ? (isDark ? `0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)` : `0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)`)
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    ...Object.entries(SEVERITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  const severityFormOptions = useMemo(() => {
    return Object.entries(SEVERITY_CONFIG).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const categoryFormOptions = useMemo(() => {
    return Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.zone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || t.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [tickets, searchQuery, severityFilter]);

  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedId) || null;
  }, [tickets, selectedId]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status !== 'resolved').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const criticalCount = tickets.filter(t => t.severity === 'critical' && t.status !== 'resolved').length;
    const score = total > 0 ? Math.round((resolved / total) * 100) : 100;
    return { total, open, resolved, criticalCount, score };
  }, [tickets]);

  // Handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTicket) return;

    const newComment: TicketComment = {
      id: `c-${Date.now()}`,
      author: 'Ali Mohammadi (You)',
      avatar: 'AM',
      text: commentText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTickets(prev => prev.map(t => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          status: t.status === 'open' ? 'in_progress' : t.status,
          comments: [...t.comments, newComment],
        };
      }
      return t;
    }));

    setCommentText('');
  };

  const handleResolveTicket = (id: string) => {
    const resolveComment: TicketComment = {
      id: `c-user-res-${Date.now()}`,
      author: 'Ali Mohammadi (You)',
      avatar: 'AM',
      text: 'Incident closed manually. Re-routing console parameter check.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTickets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'resolved',
          comments: [...t.comments, resolveComment],
        };
      }
      return t;
    }));
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDesc.trim()) return;

    const tid = `TCK-2026-${Math.floor(Math.random() * 900 + 100)}`;
    const newTicket: SupportTicket = {
      id: tid,
      subject: formSubject,
      submitterName: 'Ali Mohammadi',
      submitterEmail: 'a.mohammadi@enterhub.io',
      severity: formSeverity,
      category: formCategory,
      status: 'open',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: formDesc,
      zone: formZone,
      telemetryName: formCategory === 'hazard' ? 'Gas Concentration Sensor' : 'Operational Load Sensor',
      telemetryUnit: formCategory === 'hazard' ? 'PPM' : '%',
      sensorThreshold: formCategory === 'hazard' ? 50 : 70,
      comments: [],
    };

    setTickets(prev => [newTicket, ...prev]);
    setTelemetry(prev => ({
      ...prev,
      [tid]: generateInitialTelemetry(formCategory === 'hazard' ? 12.0 : 45.0)
    }));

    setSelectedId(newTicket.id);
    setFormSubject('');
    setFormDesc('');
    setFormZone('Zone A - General Area');
    setIsModalOpen(false);
  };

  // Determine current active telemetry alert states
  const activeTelemetryData = activeTicket ? (telemetry[activeTicket.id] || []) : [];
  const latestTelemetryValue = activeTelemetryData.length > 0 
    ? activeTelemetryData[activeTelemetryData.length - 1].value 
    : 0;

  const isLowSensorType = activeTicket?.telemetryName.toLowerCase().includes('voltage') || 
                           activeTicket?.telemetryName.toLowerCase().includes('pressure');

  const isSensorTripped = activeTicket && activeTicket.status !== 'resolved' && (
    isLowSensorType 
      ? (latestTelemetryValue < activeTicket.sensorThreshold)
      : (latestTelemetryValue > activeTicket.sensorThreshold)
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full relative" style={{ background: isDark ? canvasBg(isDark) : '#f8fafc' }}>
      
      {/* ─── Header Console ─── (hidden on the mobile detail screen for room) */}
      <div className={`px-4 sm:px-6 py-3 sm:py-4 ${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} flex-col md:flex-row md:items-center justify-between border-b gap-3 md:gap-4`} style={{ borderColor: borderCol }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.7)] animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
              Safety Console Terminal
            </p>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
            Incidents & Diagnostics Control
          </h1>
        </div>

        {/* Online safety team roster */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3.5 border-r pr-5 border-dashed" style={{ borderColor: borderCol }}>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider block" style={{ color: mut }}>Active Staff</span>
              <span className="text-[11px] font-bold" style={{ color: sec }}>Console Operators Online</span>
            </div>
            <div className="flex -space-x-2">
              {ONLINE_OPERATORS.map((op, idx) => (
                <div 
                  key={idx} 
                  title={`${op.name} (${op.zone})`} 
                  className="w-7 h-7 rounded-full border-2 text-[9px] font-bold flex items-center justify-center relative cursor-help shrink-0"
                  style={{ 
                    borderColor: bg, 
                    background: isDark ? 'var(--surface)' : '#e2e8f0', 
                    color: pri 
                  }}
                >
                  {op.name.split(' ').map(n => n[0]).join('')}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-black animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <GlassButton onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', borderRadius: '12px' }}>
            <IconPlus /> Log Incident Tag
          </GlassButton>
        </div>
      </div>

      {/* ─── Control Room Diagnostics Metrics Row ─── (desktop only; freed for the mobile list) */}
      <div className="p-4 sm:p-6 hidden lg:grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 border-b shrink-0" style={{ borderColor: borderCol }}>
        <div className="rounded-[18px] p-4 flex items-center justify-between h-[90px] transition-all relative overflow-hidden" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: sec }}>System Logs</span>
            <span className="text-2xl font-black block" style={{ color: pri }}>{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-mono text-primary font-black">
            TAG
          </div>
        </div>

        <div className="rounded-[18px] p-4 flex items-center justify-between h-[90px] transition-all relative overflow-hidden" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: sec }}>Active Alarms</span>
            <span className="text-2xl font-black block text-red-500">{stats.open}</span>
          </div>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
            <IconShield />
          </div>
        </div>

        <div className="rounded-[18px] p-4 flex items-center justify-between h-[90px] transition-all relative overflow-hidden" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: sec }}>Resolved Tags</span>
            <span className="text-2xl font-black block text-emerald-500">{stats.resolved}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
            ✓
          </div>
        </div>

        <div className="rounded-[18px] p-4 flex items-center justify-between h-[90px] transition-all relative overflow-hidden" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: sec }}>Control Index</span>
            <span className="text-2xl font-black block text-primary">{stats.score}%</span>
          </div>
          <div className="w-12 h-1.5 rounded-full bg-gray-500/20 overflow-hidden relative">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${stats.score}%` }} />
          </div>
        </div>
      </div>

      {/* ─── Control Deck Workspace ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT COLUMN: Terminal Logs (Incident List) */}
        <div className={`${mobileView === 'detail' ? 'hidden' : 'flex'} lg:flex w-full lg:w-2/5 lg:border-r flex-col min-w-0 lg:min-w-[340px] lg:max-h-none shrink-0`} style={{ borderColor: borderCol }}>
          
          {/* List Search and Quick Filters */}
          <div className="p-4 space-y-3 shrink-0 border-b" style={{ borderColor: borderCol, background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs opacity-60">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Filter terminal by zone, subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-all"
                style={{
                  borderColor: borderCol,
                  background: inputBg,
                  color: pri,
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: mut }}>Severity Filter:</span>
              <CustomSelect
                value={severityFilter}
                onChange={setSeverityFilter}
                options={severityOptions}
                isDark={isDark}
                className="w-36 flex-shrink-0 text-[11px]"
              />
            </div>
          </div>

          {/* Incident Feed List */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-48 space-y-2">
                <span className="text-2xl">📡</span>
                <p className="text-xs font-semibold" style={{ color: sec }}>No terminal nodes match search</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: borderCol }}>
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredTickets.map(t => {
                    const isSelected = t.id === selectedId;
                    const sev = SEVERITY_CONFIG[t.severity] || SEVERITY_CONFIG.medium;
                    const stat = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                    
                    // Check if this specific ticket currently has telemetry alert
                    const ticketPoints = telemetry[t.id] || [];
                    const lastVal = ticketPoints[ticketPoints.length - 1]?.value || 0;
                    const isLowSensor = t.telemetryName.toLowerCase().includes('voltage') || 
                                        t.telemetryName.toLowerCase().includes('pressure');
                    const isTripped = t.status !== 'resolved' && (
                      isLowSensor ? (lastVal < t.sensorThreshold) : (lastVal > t.sensorThreshold)
                    );

                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={() => { setSelectedId(t.id); setMobileView('detail'); }}
                        className="p-4 cursor-pointer select-none transition-all flex flex-col gap-2 relative group hover:bg-primary/[0.02]"
                        style={{
                          background: isSelected
                            ? (isDark ? 'rgba(var(--primary-rgb),0.1)' : 'rgba(var(--primary-rgb),0.06)')
                            : 'transparent',
                        }}
                      >
                        {/* Selector Indicator Light */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                        )}

                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            {isTripped ? (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.status === 'resolved' ? '#10b981' : '#f59e0b' }} />
                            )}
                            <span className="font-mono font-bold" style={{ color: pri }}>{t.id}</span>
                          </div>
                          <span style={{ color: mut }}>{t.date.split(' ')[1] || t.date}</span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold leading-snug group-hover:text-primary transition-colors" style={{ color: pri }}>
                            {t.subject}
                          </h4>
                          <span className="text-[10px] block mt-0.5 tracking-wide font-medium" style={{ color: sec }}>
                            {t.zone}
                          </span>
                        </div>

                        <div className="flex justify-between items-end gap-2 mt-1">
                          <div className="flex flex-wrap gap-1.5 min-w-0">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: sev.bg, color: sev.color }}>
                              {sev.label}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: stat.bg, color: stat.color }}>
                              {stat.label}
                            </span>
                          </div>

                          <span className="text-[9.5px] italic shrink-0" style={{ color: mut }}>By {t.submitterName.split(' ')[0]}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostic Console and Live Charts */}
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} lg:flex w-full lg:flex-1 flex-col overflow-y-auto bg-black/10 lg:min-h-0`} style={{ scrollbarWidth: 'none' }}>

          {/* Mobile back-to-list bar */}
          <button
            onClick={() => setMobileView('list')}
            className="lg:hidden flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b shrink-0 cursor-pointer"
            style={{ color: primaryColor, borderColor: borderCol }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            All incidents
          </button>

          <AnimatePresence mode="wait">
            {!activeTicket ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 h-full"
              >
                <div className="relative w-24 h-24 rounded-full border border-primary/20 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border border-primary/10 rounded-full animate-ping" />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-primary/50 shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent rotate-0 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider" style={{ color: sec }}>Console Monitor Offline</p>
                  <p className="text-[11px] max-w-[280px]" style={{ color: mut }}>Select an active command incident terminal logs on the left sidebar to connect telemetry diagnostics feed.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeTicket.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="p-4 sm:p-6 flex flex-col gap-5 sm:gap-6"
              >
                {/* Panel Info Banner */}
                <div className="flex justify-between items-start gap-3 border-b pb-4" style={{ borderColor: borderCol }}>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{activeTicket.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/10 border break-words" style={{ borderColor: borderCol, color: sec }}>{activeTicket.zone}</span>
                    </div>
                    <h3 className="text-base font-extrabold mt-1.5" style={{ color: pri }}>{activeTicket.subject}</h3>
                    <p className="text-xs mt-1 break-words" style={{ color: sec }}>
                      Reporter: <span className="font-bold">{activeTicket.submitterName}</span> ({activeTicket.submitterEmail})
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <span 
                      className="px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider" 
                      style={{ 
                        backgroundColor: SEVERITY_CONFIG[activeTicket.severity].bg, 
                        color: SEVERITY_CONFIG[activeTicket.severity].color 
                      }}
                    >
                      {activeTicket.severity}
                    </span>
                    <span 
                      className="px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider" 
                      style={{ 
                        backgroundColor: STATUS_CONFIG[activeTicket.status].bg, 
                        color: STATUS_CONFIG[activeTicket.status].color 
                      }}
                    >
                      {activeTicket.status}
                    </span>
                  </div>
                </div>

                {/* ─── Sensor Telemetry Console Widget (Wow Factor) ─── */}
                <div
                  className="rounded-[18px] p-4 sm:p-5 border flex flex-col relative overflow-hidden transition-colors duration-300"
                  style={{
                    background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)',
                    borderColor: isSensorTripped ? 'rgba(239,68,68,0.25)' : borderCol,
                    boxShadow: isSensorTripped 
                      ? (isDark ? '0 8px 30px rgba(239,68,68,0.08)' : '0 8px 25px rgba(239,68,68,0.05)') 
                      : 'none'
                  }}
                >
                  {/* Glass indicator grid */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-widest font-mono block" style={{ color: mut }}>Telemetry Diagnostics Stream</span>
                      <h4 className="text-xs font-bold font-mono mt-0.5 break-words" style={{ color: pri }}>{activeTicket.telemetryName}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      {isSensorTripped ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wide animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Over Limit Alert
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Telemetry Normal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Display values block */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4 border-b border-dashed pb-3.5 mb-3.5" style={{ borderColor: borderCol }}>
                    <div className="shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: mut }}>Active Value</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span
                          className="text-4xl font-black font-mono tracking-tight transition-colors duration-200"
                          style={{ color: isSensorTripped ? '#ef4444' : '#10b981' }}
                        >
                          {latestTelemetryValue}
                        </span>
                        <span className="text-sm font-bold font-mono" style={{ color: sec }}>{activeTicket.telemetryUnit}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right font-mono text-[10px] w-full sm:w-auto">
                      <div className="flex justify-between gap-4">
                        <span style={{ color: mut }}>Target Threshold:</span>
                        <span className="font-bold" style={{ color: pri }}>
                          {isLowSensorType ? '<' : '>'} {activeTicket.sensorThreshold} {activeTicket.telemetryUnit}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 mt-0.5">
                        <span style={{ color: mut }}>Sensor Health Index:</span>
                        <span className="font-bold text-emerald-500">99.8%</span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Area Telemetry Chart */}
                  <div className="h-[120px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeTelemetryData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`telemetryGrad-${activeTicket.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isSensorTripped ? '#ef4444' : '#10b981'} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={isSensorTripped ? '#ef4444' : '#10b981'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                          cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                          contentStyle={{ 
                            background: panelFill(isDark), 
                            border: `1px solid ${borderCol}`,
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}
                          labelStyle={{ color: pri, fontWeight: 'bold' }}
                          itemStyle={{ color: isSensorTripped ? '#ef4444' : '#10b981' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={isSensorTripped ? '#ef4444' : '#10b981'} 
                          strokeWidth={2} 
                          fillOpacity={1}
                          fill={`url(#telemetryGrad-${activeTicket.id})`} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Description details */}
                <div className="p-4 rounded-xl border bg-black/[0.02]" style={{ borderColor: borderCol }}>
                  <span className="text-[9px] font-black uppercase tracking-wider block" style={{ color: mut }}>Description details</span>
                  <p className="text-xs leading-relaxed mt-1.5" style={{ color: sec }}>{activeTicket.description}</p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3.5 mt-3.5 border-t border-dashed text-[10px]" style={{ borderColor: borderCol }}>
                    <div>
                      <span style={{ color: mut }}>Incident Category:</span>
                      <span className="font-bold ml-1.5 capitalize" style={{ color: pri }}>{activeTicket.category}</span>
                    </div>
                    <div>
                      <span style={{ color: mut }}>Console Node Status:</span>
                      <span className="font-bold ml-1.5 capitalize" style={{ color: pri }}>{activeTicket.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Live Activity & Comments stream */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: borderCol }}>
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: mut }}>Communications Log ({activeTicket.comments.length})</span>
                    <span className="text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 text-emerald-500 font-bold">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Live Feed
                    </span>
                  </div>

                  {activeTicket.comments.length === 0 ? (
                    <div className="py-4 text-center">
                      <span className="text-xs italic" style={{ color: mut }}>No safety log entries recorded for this tag.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {activeTicket.comments.map(c => {
                          const isSystem = c.author.toLowerCase().includes('system') || c.author.toLowerCase().includes('bot');
                          return (
                            <motion.div 
                              key={c.id} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="flex gap-2.5 items-start text-xs"
                            >
                              <div 
                                className="w-7 h-7 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 border"
                                style={{
                                  borderColor: borderCol,
                                  background: isSystem ? 'rgba(var(--primary-rgb),0.1)' : 'rgba(255,255,255,0.05)',
                                  color: isSystem ? 'var(--primary)' : pri
                                }}
                              >
                                {c.avatar}
                              </div>

                              <div 
                                className="flex-1 p-3 rounded-xl border transition-colors"
                                style={{
                                  borderColor: borderCol,
                                  background: isSystem ? (isDark ? 'rgba(var(--primary-rgb),0.02)' : 'rgba(var(--primary-rgb),0.02)') : bg
                                }}
                              >
                                <div className="flex justify-between items-center mb-1 text-[10px]">
                                  <span className="font-extrabold" style={{ color: isSystem ? 'var(--primary)' : pri }}>{c.author}</span>
                                  <span style={{ color: mut }}>{c.time}</span>
                                </div>
                                <p className="leading-relaxed" style={{ color: sec }}>{c.text}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Resolve Action & Add Comments forms */}
                <div className="border-t pt-4 space-y-3.5 shrink-0" style={{ borderColor: borderCol }}>
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type details or command response logs..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-all"
                      style={{
                        borderColor: borderCol,
                        background: inputBg,
                        color: pri,
                      }}
                    />
                    <GlassButton type="submit" style={{ padding: '0 16px', borderRadius: '10px' }}>
                      <IconMessage /> Log Entry
                    </GlassButton>
                  </form>

                  {activeTicket.status !== 'resolved' && (
                    <div className="flex justify-end pt-1">
                      <GlassButton
                        type="button"
                        onClick={() => handleResolveTicket(activeTicket.id)}
                        style={{ 
                          padding: '8px 18px', 
                          borderRadius: '10px', 
                          background: 'rgba(16, 185, 129, 0.15)', 
                          borderColor: 'rgba(16, 185, 129, 0.35)' 
                        }}
                      >
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <IconCheck /> Resolve Incident Tag
                        </span>
                      </GlassButton>
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ─── Logging Ticket Dialog Modal ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-2xl p-5 sm:p-6 overflow-visible shadow-2xl border transition-colors"
              style={{
                ...glassStyle(isDark),
                background: panelFill(isDark),
                borderColor: borderCol,
              }}
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b" style={{ borderColor: borderCol }}>
                <h3 className="text-base font-bold" style={{ color: pri }}>Log Safety Incident Node</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border text-xs cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 transition-colors"
                  style={{ borderColor: borderCol, color: sec }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Incident Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Short title (e.g. Zone B Gas Exhaust leak)"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs border"
                    style={getInputStyle('subject')}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Incident Location (Zone)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone B - Chemical Storage"
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    onFocus={() => setFocusedField('zone')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs border"
                    style={getInputStyle('zone')}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Detailed logs</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide incident telemetry context or diagnostic guidelines..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    onFocus={() => setFocusedField('desc')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs border resize-none"
                    style={getInputStyle('desc')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Category</label>
                    <CustomSelect
                      value={formCategory}
                      onChange={(val) => setFormCategory(val)}
                      options={categoryFormOptions}
                      isDark={isDark}
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>Severity</label>
                    <CustomSelect
                      value={formSeverity}
                      onChange={(val) => setFormSeverity(val)}
                      options={severityFormOptions}
                      isDark={isDark}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3.5 border-t" style={{ borderColor: borderCol }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors"
                    style={{ borderColor: borderCol, background: 'transparent', color: pri }}
                  >
                    Cancel
                  </button>
                  <GlassButton type="submit" style={{ padding: '10px 24px', fontSize: '13px', borderRadius: '12px' }}>
                    Log Tag
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
