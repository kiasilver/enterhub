'use client';

import { useCallback, useEffect, useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

const TRIGGERS = [
  { value: 'card_moved_to_list', label: 'Card moved to list' },
  { value: 'due_tomorrow', label: 'Due tomorrow' },
  { value: 'card_created', label: 'Card created' },
] as const;

const ACTIONS = [
  { value: 'add_label', label: 'Add label' },
  { value: 'assign_user', label: 'Assign user' },
  { value: 'fire_webhook', label: 'Fire webhook' },
] as const;

type Trigger = (typeof TRIGGERS)[number]['value'];
type Action = (typeof ACTIONS)[number]['value'];

type AutomationDef = {
  trigger?: Trigger | null;
  action?: Action | null;
  webhookUrl?: string;
};

type Automation = {
  id: string;
  name: string;
  definition: AutomationDef;
  isEnabled: boolean;
};

type Props = {
  boardId: string;
  isDark: boolean;
};

export function AutomationBuilder({ boardId, isDark }: Props) {
  const [rules, setRules] = useState<Automation[]>([]);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<Trigger>('card_created');
  const [action, setAction] = useState<Action>('add_label');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/automations`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load automations');
      setRules(
        (json.data || []).map((r: Automation) => ({
          ...r,
          definition: (r.definition || {}) as AutomationDef,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildDefinition(): AutomationDef {
    const def: AutomationDef = { trigger, action };
    if (action === 'fire_webhook' && webhookUrl.trim()) {
      def.webhookUrl = webhookUrl.trim();
    }
    return def;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setError(null);
    const res = await fetch(`/api/boards/${boardId}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        definition: buildDefinition(),
        isEnabled: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Save failed');
      return;
    }
    setName('');
    setWebhookUrl('');
    setOk('Rule created');
    await load();
  }

  async function toggleEnabled(rule: Automation) {
    setError(null);
    const res = await fetch(`/api/boards/${boardId}/automations/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: !rule.isEnabled }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Update failed');
      return;
    }
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  }

  async function testRule(rule: Automation) {
    setOk(null);
    setError(null);
    const res = await fetch(`/api/boards/${boardId}/automations/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, definition: rule.definition }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Test failed');
      return;
    }
    setOk(json.data?.message || 'Dry-run OK');
  }

  if (loading) {
    return <p className="text-sm" style={{ color: textMuted(isDark) }}>Loading automations…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
          Automations
        </h3>
        <p className="text-sm" style={{ color: textSecondary(isDark) }}>
          Trigger → action rules for this board
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {ok && <p className="text-sm text-green-500">{ok}</p>}

      <form onSubmit={save} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rule name"
          required
          className="w-full px-3 py-2 rounded-xl bg-transparent text-sm"
          style={field}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as Trigger)}
            className="px-3 py-2 rounded-xl bg-transparent text-sm"
            style={field}
          >
            {TRIGGERS.map((t) => (
              <option key={t.value} value={t.value} style={{ color: '#000' }}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as Action)}
            className="px-3 py-2 rounded-xl bg-transparent text-sm"
            style={field}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value} style={{ color: '#000' }}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        {action === 'fire_webhook' && (
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="Webhook URL (optional)"
            className="w-full px-3 py-2 rounded-xl bg-transparent text-sm"
            style={field}
          />
        )}
        <GlassButton type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl">
          <Plus size={14} />
          Add rule
        </GlassButton>
      </form>

      <ul className="space-y-2">
        {rules.map((rule) => {
          const def = rule.definition || {};
          return (
            <li
              key={rule.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3 rounded-xl"
              style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary(isDark) }}>
                  {rule.name}
                </p>
                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {def.trigger || '—'} → {def.action || '—'}
                  {def.webhookUrl ? ` · ${def.webhookUrl}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: textSecondary(isDark) }}>
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={() => void toggleEnabled(rule)}
                  />
                  Enabled
                </label>
                <GlassButton
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                  onClick={() => void testRule(rule)}
                >
                  <FlaskConical size={12} />
                  Test
                </GlassButton>
              </div>
            </li>
          );
        })}
        {rules.length === 0 && (
          <li className="text-sm" style={{ color: textMuted(isDark) }}>
            No automation rules yet
          </li>
        )}
      </ul>
    </div>
  );
}
