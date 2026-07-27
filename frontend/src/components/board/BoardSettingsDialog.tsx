'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

type DeptOpt = { id: string; key: string; label: string; color?: string };

type Props = {
  open: boolean;
  boardId: string;
  initial: {
    name: string;
    description: string | null;
    visibility: string;
    background: string | null;
    departmentId?: string | null;
  };
  departments: DeptOpt[];
  onClose: () => void;
  onSaved: () => void;
};

export default function BoardSettingsDialog({
  open,
  boardId,
  initial,
  departments,
  onClose,
  onSaved,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description || '');
  const [visibility, setVisibility] = useState(initial.visibility);
  const [background, setBackground] = useState(initial.background || '');
  const [departmentId, setDepartmentId] = useState(initial.departmentId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setDescription(initial.description || '');
    setVisibility(initial.visibility);
    setBackground(initial.background || '');
    setDepartmentId(initial.departmentId || '');
    setError(null);
  }, [open, initial]);

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
    background: 'transparent',
  } as const;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          background: background.trim() || null,
          departmentId: departmentId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update name, department, visibility, and accent color.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={field}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={field}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              Department
            </span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={field}
            >
              <option value="">Unassigned</option>
              {departments
                .filter((d) => d.id && d.key !== 'general')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              Visibility
            </span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={field}
            >
              <option value="PRIVATE">Private</option>
              <option value="WORKSPACE">Workspace</option>
              <option value="PUBLIC">Public</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              Accent color
            </span>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(background) ? background : '#3B82F6'}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full h-10 rounded-xl cursor-pointer"
            />
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Link
            href={`/board/${boardId}/settings`}
            className="text-xs font-medium mr-auto"
            style={{ color: textSecondary(isDark) }}
          >
            Advanced settings
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void save()}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: '#2563eb' }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
