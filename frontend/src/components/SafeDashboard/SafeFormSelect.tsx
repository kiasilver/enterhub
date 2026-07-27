'use client';


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

const ACCENT = 'var(--primary)';

/* ---------- shared option types ---------- */
interface Opt {
  value: string;
  label: string;
}
interface Group {
  label: string;
  options: Opt[];
}
type Source = Opt[] | Group[];

function isGrouped(src: Source): src is Group[] {
  return src.length > 0 && (src[0] as Group).options !== undefined;
}
function flatten(src: Source): Opt[] {
  return isGrouped(src) ? src.flatMap(g => g.options) : src;
}

function dropdownGlass(isDark: boolean): React.CSSProperties {
  return {
    background: panelFill(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
  };
}

/* ===================================================================== *
 *  DropdownPanel — portal-rendered panel that escapes overflow clipping  *
 *  Anchors to the field, flips above when there's no room below.        *
 * ===================================================================== */
interface DropdownPanelProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  children: React.ReactNode;
}

function DropdownPanel({ anchorRef, open, onClose, isDark, children }: DropdownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<React.CSSProperties | null>(null);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const place: 'bottom' | 'top' = spaceBelow < 260 && spaceAbove > spaceBelow ? 'top' : 'bottom';
      const maxHeight = Math.max(160, Math.min(320, (place === 'bottom' ? spaceBelow : spaceAbove) - gap - 10));
      setPlacement(place);
      setBox({
        position: 'fixed',
        left: r.left,
        width: r.width,
        maxHeight,
        ...(place === 'bottom'
          ? { top: r.bottom + gap }
          : { bottom: window.innerHeight - r.top + gap }),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && box && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="z-[9999] rounded-xl p-1 overflow-y-auto no-scrollbar"
          style={{ ...box, ...dropdownGlass(isDark), transformOrigin: placement === 'bottom' ? 'top center' : 'bottom center' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ===================================================================== *
 *  GlassSelect — single-value select (searchable / clearable / sizes)   *
 * ===================================================================== */
type Size = 'sm' | 'md' | 'lg';

interface GlassSelectProps {
  isDark: boolean;
  source: Source;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: Size;
}

const sizePad: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12px]',
  md: 'px-3.5 py-2.5 text-[13px]',
  lg: 'px-4 py-3 text-[15px]',
};

function GlassSelect({
  isDark,
  source,
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = false,
  clearable = false,
  disabled = false,
  size = 'md',
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const flat = useMemo(() => flatten(source), [source]);
  const selected = flat.find(o => o.value === value) || null;

  const matches = (o: Opt) =>
    !searchable || o.label.toLowerCase().includes(query.trim().toLowerCase());

  const renderOption = (o: Opt) => {
    const isSel = o.value === value;
    return (
      <button
        key={o.value}
        type="button"
        onClick={() => {
          onChange(o.value);
          setOpen(false);
          setQuery('');
        }}
        className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-between gap-2"
        style={{
          background: isSel ? (isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.08)') : 'transparent',
          color: isSel ? (isDark ? '#a5b4fc' : 'var(--primary)') : sec,
        }}
        onMouseEnter={e => {
          if (!isSel) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
        }}
        onMouseLeave={e => {
          if (!isSel) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>{o.label}</span>
        {isSel && <Check size={14} />}
      </button>
    );
  };

  const visibleGroups: Group[] = isGrouped(source)
    ? source.map(g => ({ label: g.label, options: g.options.filter(matches) })).filter(g => g.options.length > 0)
    : [];
  const visibleFlat = !isGrouped(source) ? flat.filter(matches) : [];

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full rounded-xl outline-none border flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 text-left ${sizePad[size]}`}
        style={{
          background: bg,
          borderColor: open ? ACCENT : border,
          boxShadow: open ? `0 0 0 3px ${isDark ? 'rgba(var(--primary-rgb), 0.18)' : 'rgba(var(--primary-rgb), 0.12)'}` : 'none',
          color: selected ? pri : mut,
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-0.5 rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: mut }}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            style={{ color: mut }}
          />
        </span>
      </button>

      <DropdownPanel anchorRef={triggerRef} open={open} onClose={() => { setOpen(false); setQuery(''); }} isDark={isDark}>
            {searchable && (
              <div className="flex items-center gap-2 px-2.5 mb-1 sticky top-0" style={{ background: 'inherit' }}>
                <Search size={14} style={{ color: mut }} />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent outline-none py-2 text-[13px]"
                  style={{ color: pri }}
                />
              </div>
            )}

            {isGrouped(source)
              ? visibleGroups.map(g => (
                  <div key={g.label} className="mb-1 last:mb-0">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: mut }}>
                      {g.label}
                    </p>
                    {g.options.map(renderOption)}
                  </div>
                ))
              : visibleFlat.map(renderOption)}

            {((isGrouped(source) && visibleGroups.length === 0) ||
              (!isGrouped(source) && visibleFlat.length === 0)) && (
              <p className="px-3 py-3 text-[12px] text-center" style={{ color: mut }}>
                No results found
              </p>
            )}
      </DropdownPanel>
    </div>
  );
}

/* ===================================================================== *
 *  GlassMultiSelect — chip-based multiple select                        *
 * ===================================================================== */
interface GlassMultiSelectProps {
  isDark: boolean;
  source: Source;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  removable?: boolean;
  limit?: number;
}

function GlassMultiSelect({
  isDark,
  source,
  values,
  onChange,
  placeholder = 'Select options',
  removable = true,
  limit,
}: GlassMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const flat = useMemo(() => flatten(source), [source]);
  const selectedOpts = values.map(v => flat.find(o => o.value === v)).filter(Boolean) as Opt[];
  const atLimit = limit !== undefined && values.length >= limit;

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else if (!atLimit) onChange([...values, v]);
  };

  const renderOption = (o: Opt) => {
    const isSel = values.includes(o.value);
    const blocked = !isSel && atLimit;
    return (
      <button
        key={o.value}
        type="button"
        disabled={blocked}
        onClick={() => toggle(o.value)}
        className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between gap-2"
        style={{
          background: isSel ? (isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.08)') : 'transparent',
          color: isSel ? (isDark ? '#a5b4fc' : 'var(--primary)') : sec,
          cursor: blocked ? 'not-allowed' : 'pointer',
          opacity: blocked ? 0.4 : 1,
        }}
        onMouseEnter={e => {
          if (!isSel && !blocked) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
        }}
        onMouseLeave={e => {
          if (!isSel) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>{o.label}</span>
        {isSel && <Check size={14} />}
      </button>
    );
  };

  return (
    <div>
      <div
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] rounded-xl border flex flex-wrap items-center gap-1.5 px-2 py-1.5 cursor-text transition-all duration-200"
        style={{
          background: bg,
          borderColor: open ? ACCENT : border,
          boxShadow: open ? `0 0 0 3px ${isDark ? 'rgba(var(--primary-rgb), 0.18)' : 'rgba(var(--primary-rgb), 0.12)'}` : 'none',
        }}
      >
        {selectedOpts.length === 0 && (
          <span className="px-1.5 text-[13px]" style={{ color: mut }}>{placeholder}</span>
        )}
        {selectedOpts.map(o => (
          <span
            key={o.value}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-[12px] font-medium"
            style={{ background: isDark ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}
          >
            {o.label}
            {removable && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggle(o.value);
                }}
                className="rounded-md p-0.5 transition-colors hover:bg-black/10"
                style={{ color: 'inherit' }}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <span className="ml-auto pr-1 shrink-0">
          <ChevronDown size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: mut }} />
        </span>
      </div>

      {limit !== undefined && (
        <p className="mt-1.5 text-[11px]" style={{ color: atLimit ? '#f59e0b' : mut }}>
          {values.length} / {limit} selected
        </p>
      )}

      <DropdownPanel anchorRef={triggerRef} open={open} onClose={() => setOpen(false)} isDark={isDark}>
            {isGrouped(source)
              ? source.map(g => (
                  <div key={g.label} className="mb-1 last:mb-0">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: mut }}>
                      {g.label}
                    </p>
                    {g.options.map(renderOption)}
                  </div>
                ))
              : flat.map(renderOption)}
      </DropdownPanel>
    </div>
  );
}

/* ===================================================================== *
 *  TagInput — create free-text tags by typing                           *
 * ===================================================================== */
interface TagInputProps {
  isDark: boolean;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  unique?: boolean;
  limit?: number;
  disabled?: boolean;
}

function TagInput({
  isDark,
  tags,
  onChange,
  placeholder = 'Type and press Enter',
  unique = false,
  limit,
  disabled = false,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const atLimit = limit !== undefined && tags.length >= limit;

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (unique && tags.includes(v)) {
      setDraft('');
      return;
    }
    if (atLimit) return;
    onChange([...tags, v]);
    setDraft('');
  };

  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div
        className="w-full min-h-[44px] rounded-xl border flex flex-wrap items-center gap-1.5 px-2 py-1.5 transition-all duration-200 focus-within:border-primary"
        style={{ background: bg, borderColor: border }}
      >
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-[12px] font-medium"
            style={{ background: isDark ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}
          >
            {t}
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-md p-0.5 transition-colors hover:bg-black/10"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {!atLimit && (
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Backspace' && !draft && tags.length) {
                remove(tags.length - 1);
              }
            }}
            onPaste={unique ? e => e.preventDefault() : undefined}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none px-1.5 py-1 text-[13px]"
            style={{ color: pri }}
          />
        )}
      </div>
      {limit !== undefined && (
        <p className="mt-1.5 text-[11px]" style={{ color: atLimit ? '#f59e0b' : mut }}>
          {tags.length} / {limit} tags
        </p>
      )}
    </div>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
const STATUS: Opt[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const SERVICES: Opt[] = [
  { value: 'hosting', label: 'Cloud Hosting' },
  { value: 'cdn', label: 'CDN & Edge' },
  { value: 'db', label: 'Managed Database' },
  { value: 'auth', label: 'Authentication' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'ml', label: 'Machine Learning' },
];

const TEAM_ROLES: Opt[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Administrator' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const CITIES: Group[] = [
  {
    label: 'Europe',
    options: [
      { value: 'madrid', label: 'Madrid' },
      { value: 'berlin', label: 'Berlin' },
      { value: 'paris', label: 'Paris' },
    ],
  },
  {
    label: 'Americas',
    options: [
      { value: 'nyc', label: 'New York' },
      { value: 'sf', label: 'San Francisco' },
      { value: 'toronto', label: 'Toronto' },
    ],
  },
  {
    label: 'Asia',
    options: [
      { value: 'tokyo', label: 'Tokyo' },
      { value: 'singapore', label: 'Singapore' },
      { value: 'dubai', label: 'Dubai' },
    ],
  },
];

function Section({
  isDark,
  title,
  hint,
  children,
}: {
  isDark: boolean;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-6 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? (
        <p className="text-[12px] mt-1 mb-5" style={{ color: mut }}>{hint}</p>
      ) : (
        <div className="mb-5" />
      )}
      {children}
    </motion.section>
  );
}

export default function SafeFormSelect({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);

  // Default Select
  const [status, setStatus] = useState<string | null>(null);
  const [service, setService] = useState<string | null>(null);

  // Sizes
  const [sizeSm, setSizeSm] = useState<string | null>(null);
  const [sizeMd, setSizeMd] = useState<string | null>(null);
  const [sizeLg, setSizeLg] = useState<string | null>(null);

  // Single select examples
  const [single1, setSingle1] = useState<string | null>(null);
  const [singleGroup, setSingleGroup] = useState<string | null>(null);
  const [singleClear, setSingleClear] = useState<string | null>('hosting');

  // Multiple
  const [multi, setMulti] = useState<string[]>(['editor']);
  const [multiGroup, setMultiGroup] = useState<string[]>([]);
  const [multiLimit, setMultiLimit] = useState<string[]>([]);

  // Tag inputs
  const [limitTags, setLimitTags] = useState<string[]>(['Task-1']);
  const [uniqueTags, setUniqueTags] = useState<string[]>(['Project-A', 'Project-B']);

  const labelStyle: React.CSSProperties = { color: pri, fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'block' };
  const descStyle: React.CSSProperties = { color: mut, fontSize: '11px', marginTop: '6px' };

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Form Select</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Form Select</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Default Select --- */}
        <Section isDark={isDark} title="Default Select" hint="Custom dropdowns with smooth motion, keyboard-free selection, an optional search field, and a disabled state.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label style={labelStyle}>Account Status</label>
              <GlassSelect isDark={isDark} source={STATUS} value={status} onChange={setStatus} placeholder="Select your status" />
            </div>
            <div>
              <label style={labelStyle}>Search for Services</label>
              <GlassSelect isDark={isDark} source={SERVICES} value={service} onChange={setService} placeholder="Search for services" searchable />
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Disabled</label>
              <GlassSelect isDark={isDark} source={STATUS} value={null} onChange={() => {}} placeholder="This select is disabled" disabled />
            </div>
          </div>
        </Section>

        {/* --- Select Size --- */}
        <Section isDark={isDark} title="Select Size" hint="Three matched sizes — small, default, and large — share the same behaviour and accent focus ring.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label style={labelStyle}>Small</label>
              <GlassSelect isDark={isDark} source={TEAM_ROLES} value={sizeSm} onChange={setSizeSm} placeholder="Small select" size="sm" />
            </div>
            <div>
              <label style={labelStyle}>Default</label>
              <GlassSelect isDark={isDark} source={TEAM_ROLES} value={sizeMd} onChange={setSizeMd} placeholder="Default select" size="md" />
            </div>
            <div>
              <label style={labelStyle}>Large</label>
              <GlassSelect isDark={isDark} source={TEAM_ROLES} value={sizeLg} onChange={setSizeLg} placeholder="Large select" size="lg" />
            </div>
          </div>
        </Section>

        {/* --- Single Select --- */}
        <Section isDark={isDark} title="Single Select" hint="A placeholder, grouped options, and a clearable value — each driven entirely by state.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label style={labelStyle}>With Placeholder</label>
              <GlassSelect isDark={isDark} source={SERVICES} value={single1} onChange={setSingle1} placeholder="This is a placeholder" />
              <p style={descStyle}>Nothing is selected until the user chooses.</p>
            </div>
            <div>
              <label style={labelStyle}>Option Groups</label>
              <GlassSelect isDark={isDark} source={CITIES} value={singleGroup} onChange={setSingleGroup} placeholder="Choose a city" searchable />
              <p style={descStyle}>Options organised under group headers.</p>
            </div>
            <div>
              <label style={labelStyle}>Clearable</label>
              <GlassSelect isDark={isDark} source={SERVICES} value={singleClear} onChange={setSingleClear} placeholder="Pick a service" clearable />
              <p style={descStyle}>A clear button resets the selection.</p>
            </div>
          </div>
        </Section>

        {/* --- Multiple Select --- */}
        <Section isDark={isDark} title="Multiple Select" hint="Chip-based multi-selection with removable tags, grouped options, and an enforced selection limit.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label style={labelStyle}>Removable Tags</label>
              <GlassMultiSelect isDark={isDark} source={TEAM_ROLES} values={multi} onChange={setMulti} placeholder="Assign roles" />
              <p style={descStyle}>Click a chip's × or re-select to remove.</p>
            </div>
            <div>
              <label style={labelStyle}>Option Groups</label>
              <GlassMultiSelect isDark={isDark} source={CITIES} values={multiGroup} onChange={setMultiGroup} placeholder="Choose cities" />
              <p style={descStyle}>Multi-select across grouped options.</p>
            </div>
            <div>
              <label style={labelStyle}>With Limit</label>
              <GlassMultiSelect isDark={isDark} source={SERVICES} values={multiLimit} onChange={setMultiLimit} placeholder="Max 2 services" limit={2} />
              <p style={descStyle}>Stops accepting input after the limit.</p>
            </div>
          </div>
        </Section>

        {/* --- Text Inputs --- */}
        <Section isDark={isDark} title="Text Inputs" hint="Create free-form tags on the fly — with an optional limit, uniqueness enforcement, or a fully disabled state.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label style={labelStyle}>Limited & Removable</label>
              <TagInput isDark={isDark} tags={limitTags} onChange={setLimitTags} placeholder="Add a task..." limit={3} />
              <p style={descStyle}>Press Enter to add — capped at 3 tags.</p>
            </div>
            <div>
              <label style={labelStyle}>Unique Values, No Pasting</label>
              <TagInput isDark={isDark} tags={uniqueTags} onChange={setUniqueTags} placeholder="Add a project..." unique />
              <p style={descStyle}>Duplicates and paste are rejected.</p>
            </div>
            <div className="md:col-span-2">
              <label style={labelStyle}>Disabled</label>
              <TagInput isDark={isDark} tags={['josh@joshuajohnson.co.uk', 'joe@bloggs.co.uk']} onChange={() => {}} disabled />
              <p style={descStyle}>Read-only — interaction is blocked.</p>
            </div>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
