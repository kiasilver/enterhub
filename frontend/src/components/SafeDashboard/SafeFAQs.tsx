'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { ChevronDown, Search, Plus, X } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';

interface Props {
  isDark: boolean;
}

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

const INITIAL_FAQS: FaqCategory[] = [
  {
    category: 'General',
    items: [
      { q: 'What is Enterhub?', a: 'Enterhub is a comprehensive Project Management system designed to track incidents, monitor site compliance, and ensure a secure environment for all personnel.' },
      { q: 'How do I reset my password?', a: 'You can reset your password from the Settings page under the Security tab, or use the "Forgot Password" link on the login screen.' }
    ]
  },
  {
    category: 'Incidents',
    items: [
      { q: 'How do I report a new incident?', a: 'Click the "Report Incident" button located at the top right of the Project Overview dashboard. Fill out the required details and severity level to submit your report.' },
      { q: 'Who gets notified when an incident is logged?', a: 'By default, the Lead Inspector and Safety Manager of the assigned sector will receive an immediate push notification and email alert.' }
    ]
  },
  {
    category: 'Billing',
    items: [
      { q: 'Can I upgrade my plan later?', a: 'Yes! You can upgrade your plan at any time from the Pricing page. The cost will be prorated based on the remainder of your billing cycle.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, wire transfers for enterprise clients, and popular crypto options.' }
    ]
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I add a new team member?', a: 'Navigate to Settings > Team and click "Invite Member". Enter their work email and assign a role such as Inspector, Manager, or Viewer. They will receive an activation link to set up their account.' },
      { q: 'Can I change a user’s role after they join?', a: 'Yes. From Settings > Team, open the member’s profile and select a new role from the dropdown. Permission changes take effect immediately on their next page load.' },
      { q: 'How do I deactivate an account?', a: 'In Settings > Team, choose "Deactivate" on the member’s row. Their access is revoked instantly, but all their historical incident reports and audit logs are preserved for compliance.' }
    ]
  },
  {
    category: 'Security',
    items: [
      { q: 'Do you support two-factor authentication?', a: 'Yes. Every account can enable 2FA from Settings > Security using an authenticator app or SMS. Enterprise admins can also enforce 2FA across their entire organization.' },
      { q: 'How is my safety data protected?', a: 'All data is encrypted in transit with TLS 1.3 and at rest with AES-256. Incident records are stored in geo-redundant facilities and access is governed by role-based permissions.' },
      { q: 'Where can I review account activity?', a: 'The Security tab includes an audit log of sign-ins, permission changes, and exported reports. Suspicious activity triggers an automatic email to all account administrators.' }
    ]
  },
  {
    category: 'Technical',
    items: [
      { q: 'Is there an API for integrations?', a: 'Yes. Enterhub exposes a REST API and webhooks so you can push incident data into your own tools. Generate API keys from Settings > Developer and review the docs for rate limits.' },
      { q: 'Which browsers are supported?', a: 'The dashboard supports the latest two versions of Chrome, Edge, Firefox, and Safari. For field use, our mobile apps work fully offline and sync once a connection is restored.' },
      { q: 'Why aren’t my real-time alerts arriving?', a: 'Real-time alerts depend on browser notification permissions and a stable websocket connection. Confirm notifications are allowed for the site and check the Status page for any ongoing service incidents.' }
    ]
  }
];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } } };

export default function SafeFAQs({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const glass = glassStyle(isDark);

  const [faqs, setFaqs] = useState<FaqCategory[]>(INITIAL_FAQS);
  const [activeCategory, setActiveCategory] = useState('General');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Add Question modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState(faqs[0]?.category ?? 'General');

  const modalPanelRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openModal = () => {
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory(activeCategory && !searchQuery ? activeCategory : (faqs[0]?.category ?? 'General'));
    setIsModalOpen(true);
  };

  const canSubmit = newQuestion.trim().length > 0 && newAnswer.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const entry: FaqItem = { q: newQuestion.trim(), a: newAnswer.trim() };
    setFaqs(prev => prev.map(cat =>
      cat.category === newCategory
        ? { ...cat, items: [entry, ...cat.items] }
        : cat
    ));
    setActiveCategory(newCategory);
    setSearchQuery('');
    setIsModalOpen(false);
  };

  const categoryOptions = faqs.map(c => ({ value: c.category, label: c.category }));

  const activeFaqs = faqs.find(f => f.category === activeCategory)?.items || [];
  const filteredFaqs = searchQuery
    ? faqs.flatMap(c => c.items).filter(i => i.q.toLowerCase().includes(searchQuery.toLowerCase()) || i.a.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeFaqs;

  return (
    <div className="w-full h-full overflow-y-auto pb-10" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header & Search */}
      <div className="mb-10 max-w-4xl mx-auto text-center pt-8 px-4">
        <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: pri, letterSpacing: '-0.02em' }}>How can we help?</h2>
        <p className="text-sm font-medium max-w-lg mx-auto mb-8" style={{ color: mut }}>
          Search our knowledge base or browse categories below to find answers to common questions.
        </p>

        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className="relative flex-1 min-w-0">
            <Search size={20} className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 opacity-50" style={{ color: sec }} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-4 rounded-2xl text-base outline-none focus:ring-2 ring-primary transition-all shadow-xl"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${borderSubtle(isDark)}`,
                color: pri,
                backdropFilter: 'blur(20px)'
              }}
            />
          </div>
          <GlassButton onClick={openModal} className="!py-4 flex-shrink-0 whitespace-nowrap">
            <Plus size={16} strokeWidth={2.5} />
            Add Question
          </GlassButton>
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 px-4">
        
        {/* Categories Sidebar */}
        {!searchQuery && (
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0" style={{ scrollbarWidth: 'none' }}>
              {faqs.map(c => {
                const isActive = activeCategory === c.category;
                return (
                  <motion.button
                    key={c.category}
                    onClick={() => setActiveCategory(c.category)}
                    whileTap={{ scale: 0.96 }}
                    className="relative px-5 py-3 rounded-xl text-sm font-bold text-left whitespace-nowrap transition-colors duration-200"
                    style={{
                      color: isActive ? 'var(--primary)' : sec,
                      border: `1px solid ${isActive ? (isDark ? 'rgba(var(--primary-rgb), 0.3)' : 'rgba(var(--primary-rgb), 0.2)') : 'transparent'}`
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = surfaceHover(isDark); }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="faq-cat"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.1)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{c.category}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <motion.div
          className="flex-1 space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {searchQuery && filteredFaqs.length === 0 && (
            <div className="text-center py-10" style={{ color: mut }}>
              No results found for "{searchQuery}"
            </div>
          )}

          <AnimatePresence mode="popLayout" initial={false}>
          {filteredFaqs.map((faq, i) => {
            const id = searchQuery ? `search-${faq.q}` : `${activeCategory}-${i}`;
            const isOpen = openItems[id];

            return (
              <motion.div
                key={id}
                layout
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="rounded-2xl overflow-hidden"
                style={{ ...glass, border: `1px solid ${isOpen ? (isDark ? 'rgba(var(--primary-rgb),0.3)' : 'rgba(var(--primary-rgb),0.2)') : borderSubtle(isDark)}` }}
              >
                <button
                  onClick={() => toggleItem(id)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left gap-4"
                  style={{ background: isOpen ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : 'transparent' }}
                  onMouseEnter={e => { if(!isOpen) e.currentTarget.style.background = surfaceHover(isDark); }}
                  onMouseLeave={e => { if(!isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="font-bold text-[15px] min-w-0 break-words" style={{ color: isOpen ? pri : sec }}>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="flex-shrink-0"
                    style={{ color: isOpen ? 'var(--primary)' : mut }}
                  >
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.25 }
                      }}
                      style={{ overflow: 'hidden' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="px-4 sm:px-6 pb-5 sm:pb-6 pt-1 text-sm leading-relaxed"
                        style={{ color: mut }}
                      >
                        {faq.a}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              ref={modalPanelRef}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-md rounded-2xl"
              style={{ ...glass, padding: '24px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black" style={{ color: pri, letterSpacing: '-0.01em' }}>Add a Question</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: mut }}
                  onMouseEnter={e => { e.currentTarget.style.background = surfaceHover(isDark); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: sec }}>Question</label>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="e.g. How do I export a report?"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 ring-primary transition-all"
                    style={{ background: surfaceHover(isDark), border: `1px solid ${borderSubtle(isDark)}`, color: pri }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: sec }}>Answer</label>
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Write a clear, helpful answer..."
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 ring-primary transition-all resize-none"
                    style={{ background: surfaceHover(isDark), border: `1px solid ${borderSubtle(isDark)}`, color: pri }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: sec }}>Category</label>
                  <CustomSelect
                    value={newCategory}
                    onChange={(v) => setNewCategory(v)}
                    options={categoryOptions}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-6">
                <GlassButton onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton
                  variant="success"
                  hoverVariant="success"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={canSubmit ? undefined : { opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Add Question
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
