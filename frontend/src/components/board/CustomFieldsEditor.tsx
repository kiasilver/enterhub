'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]['value'];

type CustomField = {
  id: string;
  name: string;
  fieldType: string;
  sortOrder: number;
};

type Props = {
  boardId: string;
  isDark: boolean;
};

export function CustomFieldsEditor({ boardId, isDark }: Props) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fieldStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/custom-fields`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load fields');
      setFields(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/boards/${boardId}/custom-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), fieldType }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Create failed');
      return;
    }
    setName('');
    await load();
  }

  async function reorder(orderedIds: string[]) {
    setError(null);
    const res = await fetch(`/api/boards/${boardId}/custom-fields`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Reorder failed');
      return;
    }
    setFields(json.data || []);
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= fields.length) return;
    const ids = fields.map((f) => f.id);
    const tmp = ids[index];
    ids[index] = ids[next];
    ids[next] = tmp;
    void reorder(ids);
  }

  if (loading) {
    return <p className="text-sm" style={{ color: textMuted(isDark) }}>Loading fields…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
          Custom fields
        </h3>
        <p className="text-sm" style={{ color: textSecondary(isDark) }}>
          Board-level fields shown on cards
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <form onSubmit={addField} className="flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Field name"
          required
          className="flex-1 px-3 py-2 rounded-xl bg-transparent text-sm"
          style={fieldStyle}
        />
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FieldType)}
          className="px-3 py-2 rounded-xl bg-transparent text-sm"
          style={fieldStyle}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value} style={{ color: '#000' }}>
              {t.label}
            </option>
          ))}
        </select>
        <GlassButton type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus size={14} />
          Add
        </GlassButton>
      </form>

      <ul className="space-y-2">
        {fields.map((f, i) => (
          <li
            key={f.id}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: textPrimary(isDark) }}>
                {f.name}
              </p>
              <p className="text-xs" style={{ color: textMuted(isDark) }}>
                {f.fieldType}
              </p>
            </div>
            <GlassButton
              type="button"
              className="p-2 rounded-lg"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label="Move up"
            >
              <ArrowUp size={14} />
            </GlassButton>
            <GlassButton
              type="button"
              className="p-2 rounded-lg"
              disabled={i === fields.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Move down"
            >
              <ArrowDown size={14} />
            </GlassButton>
          </li>
        ))}
        {fields.length === 0 && (
          <li className="text-sm" style={{ color: textMuted(isDark) }}>
            No custom fields yet
          </li>
        )}
      </ul>
    </div>
  );
}
