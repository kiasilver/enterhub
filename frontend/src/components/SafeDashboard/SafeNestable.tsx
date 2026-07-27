'use client';

import { useState } from 'react';
import { Reorder, useDragControls, motion, type Variants } from 'motion/react';
import { GripVertical, Folder } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

interface Leaf { id: string; label: string }
interface Group { id: string; label: string; items: Leaf[] }

const INITIAL: Group[] = [
  { id: 'g1', label: 'Operations', items: [{ id: 'i1', label: 'Daily inspection' }, { id: 'i2', label: 'Shift handover' }, { id: 'i3', label: 'Equipment check' }] },
  { id: 'g2', label: 'Compliance', items: [{ id: 'i4', label: 'OSHA audit' }, { id: 'i5', label: 'Certification renewal' }] },
  { id: 'g3', label: 'Training', items: [{ id: 'i6', label: 'Fire drill' }, { id: 'i7', label: 'PPE workshop' }, { id: 'i8', label: 'First-aid course' }] },
];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } } };

function GroupRow({ group, isDark, onItems }: { group: Group; isDark: boolean; onItems: (items: Leaf[]) => void }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const controls = useDragControls();

  return (
    <Reorder.Item value={group} dragListener={false} dragControls={controls} className="rounded-xl overflow-hidden" style={glassStyle(isDark)}>
      <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
        <span onPointerDown={(e) => controls.start(e)} className="cursor-grab active:cursor-grabbing touch-none" style={{ color: mut }}><GripVertical size={16} /></span>
        <Folder size={15} style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-semibold" style={{ color: pri }}>{group.label}</span>
        <span className="ml-auto text-[11px]" style={{ color: mut }}>{group.items.length}</span>
      </div>
      <Reorder.Group axis="y" values={group.items} onReorder={onItems} className="p-2 flex flex-col gap-1.5">
        {group.items.map((leaf) => (
          <Reorder.Item key={leaf.id} value={leaf} className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing" style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}>
            <GripVertical size={14} style={{ color: mut }} />
            <span className="text-[13px]" style={{ color: sec }}>{leaf.label}</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </Reorder.Item>
  );
}

export default function SafeNestable({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const [groups, setGroups] = useState<Group[]>(INITIAL);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-7 max-w-2xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Advance UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Nestable List</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Drag to reorder items within a group, or drag a group by its handle.</p>
      </motion.div>

      <motion.section variants={item} className="max-w-2xl">
        <div className="rounded-2xl p-4" style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}>
          <Reorder.Group axis="y" values={groups} onReorder={setGroups} className="flex flex-col gap-3">
            {groups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                isDark={isDark}
                onItems={(items) => setGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, items } : x)))}
              />
            ))}
          </Reorder.Group>
        </div>
      </motion.section>
    </motion.div>
  );
}
