'use client';

import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, glassDropdown, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
  dealValue: number;
  location: string;
  rating: number;
  contactName: string;
  contactEmail: string;
  website: string;
  description: string;
}

interface CompaniesViewProps {
  isDark: boolean;
}

const INITIAL_COMPANIES: Company[] = [
  { 
    id: 'COM-001', 
    name: 'Persian Gas Corp', 
    industry: 'Energy & Mining', 
    employees: 1200, 
    dealValue: 85000, 
    location: 'Tehran, IR', 
    rating: 4.8,
    contactName: 'Ehsan Alavi',
    contactEmail: 'e.alavi@persiangas.ir',
    website: 'www.persiangas.ir',
    description: 'Major natural gas production and supply network operating across multiple offshore plants.'
  },
  { 
    id: 'COM-002', 
    name: 'DrillTech Solutions', 
    industry: 'Industrial Gear', 
    employees: 340, 
    dealValue: 42000, 
    location: 'Houston, USA', 
    rating: 4.5,
    contactName: 'Marcus Vance',
    contactEmail: 'm.vance@drilltech.co',
    website: 'www.drilltech.co',
    description: 'Specialized deepwater drilling components, safety valve equipment, and high-pressure sensor manifolds.'
  },
  { 
    id: 'COM-003', 
    name: 'Global Compliance Inc', 
    industry: 'Legal & Audits', 
    employees: 150, 
    dealValue: 18500, 
    location: 'London, UK', 
    rating: 4.2,
    contactName: 'Fiona Gallagher',
    contactEmail: 'fiona.g@compliance.org',
    website: 'www.compliance-global.org',
    description: 'International standards certification, safety training accreditation, and third-party safety audits.'
  },
  { 
    id: 'COM-004', 
    name: 'Tehran Fire Safety', 
    industry: 'Safety Services', 
    employees: 85, 
    dealValue: 32000, 
    location: 'Tehran, IR', 
    rating: 4.9,
    contactName: 'Zahra Alavi',
    contactEmail: 'zahra@tehranfire.ir',
    website: 'www.tehranfiresafety.ir',
    description: 'Municipal and industrial firefighting systems engineering, alarm calibration, and sprinkler maintenance.'
  },
  { 
    id: 'COM-005', 
    name: 'SafetyFirst Ltd', 
    industry: 'Consulting', 
    employees: 45, 
    dealValue: 12000, 
    location: 'Berlin, DE', 
    rating: 4.0,
    contactName: 'Hans Schmidt',
    contactEmail: 'h.schmidt@safetyfirst.de',
    website: 'www.safetyfirst.de',
    description: 'ISO-45001 workplace risk assessments, safety manuals authoring, and fire warden briefing.'
  },
];

export default function CompaniesView({ isDark }: CompaniesViewProps) {
  const [companies] = useState<Company[]>(INITIAL_COMPANIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<'All' | 'Energy' | 'Industrial' | 'Compliance' | 'Safety'>('All');
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = industryFilter === 'All' ? true :
                              industryFilter === 'Energy' ? c.industry.includes('Energy') :
                              industryFilter === 'Industrial' ? c.industry.includes('Industrial') :
                              industryFilter === 'Compliance' ? c.industry.includes('Compliance') || c.industry.includes('Legal') :
                              industryFilter === 'Safety' ? c.industry.includes('Safety') : false;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, searchQuery, industryFilter]);

  const totalValue = companies.reduce((sum, c) => sum + c.dealValue, 0);
  const avgDeal = Math.round(totalValue / companies.length);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return (
              <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            );
          } else if (i === fullStars && hasHalf) {
            return (
              <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <defs>
                  <linearGradient id="halfGrad">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfGrad)" />
              </svg>
            );
          } else {
            return (
              <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="opacity-30">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            );
          }
        })}
      </div>
    );
  };

  const getIndustryColor = (industry: string) => {
    if (industry.includes('Energy')) return '#ef4444';
    if (industry.includes('Industrial')) return '#3b82f6';
    if (industry.includes('Legal')) return '#f59e0b';
    return '#10b981';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Title & Stats */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>CRM / Companies</h2>
        <p className="text-xs" style={{ color: sec }}>Safety vendors, client organizations, and regulatory bodies</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          className="rounded-2xl p-5 border flex items-center justify-between shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Total Companies</span>
            <span className="text-2xl font-black block mt-1" style={{ color: pri }}>{companies.length}</span>
            <span className="text-[9px]" style={{ color: mut }}>Across 4 major sectors</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          className="rounded-2xl p-5 border flex items-center justify-between shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Total Pipeline Value</span>
            <span className="text-2xl font-black block mt-1 text-primary">${totalValue.toLocaleString()}</span>
            <span className="text-[9px]" style={{ color: mut }}>Current project contract estimates</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, scale: 1.01 }}
          className="rounded-2xl p-5 border flex items-center justify-between shadow-lg"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.03)' }}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: sec }}>Average Deal Size</span>
            <span className="text-2xl font-black block mt-1 text-emerald-500">${avgDeal.toLocaleString()}</span>
            <span className="text-[9px]" style={{ color: mut }}>Targeting tier-1 operators</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors border shadow-md" style={{ background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderColor: border }}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all duration-200 focus-within:border-primary w-full sm:w-auto" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), minWidth: 220 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-55">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search companies, locations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none border-none text-xs w-full"
              style={{ color: pri }}
            />
          </div>
          <CustomSelect
            value={industryFilter}
            onChange={setIndustryFilter}
            isDark={isDark}
            options={[
              { value: 'All', label: 'All Industries' },
              { value: 'Energy', label: 'Energy & Mining' },
              { value: 'Industrial', label: 'Industrial Gear' },
              { value: 'Compliance', label: 'Compliance / Auditing' },
              { value: 'Safety', label: 'Safety Services' },
            ]}
            className="min-w-[150px]"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-white/5">
          {(['List', 'Grid'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                background: viewMode === mode ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                color: viewMode === mode ? pri : sec,
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Layout */}
      <AnimatePresence mode="wait">
        {viewMode === 'List' ? (
          <motion.div
            key="list-layout"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="overflow-x-auto rounded-2xl border shadow-lg"
            style={{ borderColor: border, background: bg }}
          >
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <th className="p-4 font-bold">Company Name</th>
                  <th className="p-4 font-bold">Industry</th>
                  <th className="p-4 font-bold">Employees</th>
                  <th className="p-4 font-bold">Pipeline Value</th>
                  <th className="p-4 font-bold">Location</th>
                  <th className="p-4 font-bold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c, i) => {
                  const isSelected = selectedCompanyId === c.id;
                  const industryColor = getIndustryColor(c.industry);
                  return (
                    <Fragment key={c.id}>
                      <tr 
                        onClick={() => setSelectedCompanyId(isSelected ? null : c.id)}
                        style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} 
                        className="hover:bg-primary/[0.04] transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-bold flex items-center gap-2.5" style={{ color: pri }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] border" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), color: industryColor }}>
                            {c.name[0]}
                          </div>
                          {c.name}
                        </td>
                        <td className="p-4" style={{ color: sec }}>{c.industry}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" style={{ color: pri }}>{c.employees.toLocaleString()}</span>
                            <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((c.employees / 1500) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-primary">${c.dealValue.toLocaleString()}</td>
                        <td className="p-4" style={{ color: sec }}>{c.location}</td>
                        <td className="p-4 font-semibold">
                          {renderStars(c.rating)}
                        </td>
                      </tr>
                      {/* Expandable details panel inline */}
                      <AnimatePresence>
                        {isSelected && (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 flex flex-col md:flex-row gap-5 border-b" style={{ background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)', borderColor: borderSubtle(isDark) }}>
                                  <div className="flex-1 space-y-2">
                                    <h4 className="text-xs uppercase font-black" style={{ color: mut }}>About Organization</h4>
                                    <p className="text-xs leading-relaxed" style={{ color: sec }}>{c.description}</p>
                                    <div className="flex items-center gap-4 pt-1">
                                      <span className="text-[11px]" style={{ color: pri }}>Website: <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">{c.website}</a></span>
                                      <span className="text-[11px]" style={{ color: pri }}>Location: <strong className="font-semibold">{c.location}</strong></span>
                                    </div>
                                  </div>
                                  <div className="flex-1 space-y-2 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-5" style={{ borderColor: borderSubtle(isDark) }}>
                                    <h4 className="text-xs uppercase font-black" style={{ color: mut }}>Primary Contact</h4>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                        {c.contactName.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-xs" style={{ color: pri }}>{c.contactName}</p>
                                        <p className="text-[10px]" style={{ color: mut }}>{c.contactEmail}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="grid-layout"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredCompanies.map((c, i) => {
              const industryColor = getIndustryColor(c.industry);
              const isSelected = selectedCompanyId === c.id;
              return (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border p-5 flex flex-col justify-between min-h-[220px] shadow-lg cursor-pointer transition-all duration-200"
                  style={{ background: bg, borderColor: isSelected ? 'var(--primary)' : border }}
                  onClick={() => setSelectedCompanyId(isSelected ? null : c.id)}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), color: industryColor }}>
                          {c.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs" style={{ color: pri }}>{c.name}</h4>
                          <span className="text-[9px]" style={{ color: mut }}>{c.location}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${industryColor}15`, color: industryColor }}>
                        {c.industry.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-[11px] mt-3.5 leading-relaxed line-clamp-2" style={{ color: sec }}>{c.description}</p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-dashed space-y-2.5" style={{ borderColor: borderSubtle(isDark) }}>
                    <div className="flex justify-between items-center text-[10px]">
                      <span style={{ color: mut }}>Deal Volume:</span>
                      <span className="font-black text-primary text-xs">${c.dealValue.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span style={{ color: mut }}>Rating:</span>
                      <span>{renderStars(c.rating)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span style={{ color: mut }}>Scale:</span>
                      <span className="font-bold" style={{ color: pri }}>{c.employees} Emp</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
