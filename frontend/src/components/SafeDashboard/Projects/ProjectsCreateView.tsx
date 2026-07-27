'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, borderSubtle, surfaceItem, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface ProjectsCreateViewProps {
  isDark: boolean;
}

export default function ProjectsCreateView({ isDark }: ProjectsCreateViewProps) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<'Urgent' | 'Normal' | 'Low'>('Normal');
  const [budget, setBudget] = useState<number>(0);
  const [success, setSuccess] = useState(false);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;

    // Simulate creation
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle('');
      setDesc('');
      setBudget(0);
      setPriority('Normal');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Projects / Create Project</h2>
        <p className="text-xs" style={{ color: sec }}>Initiate a compliance framework or safety program workspace</p>
      </div>

      <div className="p-6 rounded-2xl border" style={{ background: bg, borderColor: border }}>
        {success ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-sm font-bold" style={{ color: pri }}>Project Created Successfully</h3>
            <p className="text-xs" style={{ color: sec }}>Workspace has been initialized and members notified.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Project Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Risk Assessment System"
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                style={{
                  borderColor: borderSubtle(isDark),
                  color: pri,
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Description</label>
              <textarea
                required
                rows={4}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Audit procedures for high voltage zones..."
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary resize-none bg-transparent"
                style={{
                  borderColor: borderSubtle(isDark),
                  color: pri,
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Priority</label>
                <CustomSelect
                  value={priority}
                  onChange={setPriority}
                  isDark={isDark}
                  options={[
                    { value: 'Urgent', label: 'Urgent' },
                    { value: 'Normal', label: 'Normal' },
                    { value: 'Low', label: 'Low' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Budget ($)</label>
                <input
                  type="number"
                  required
                  value={budget || ''}
                  onChange={e => setBudget(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{
                    borderColor: borderSubtle(isDark),
                    color: pri,
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              <GlassButton type="submit" className="w-full py-2.5">
                Create Project
              </GlassButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
