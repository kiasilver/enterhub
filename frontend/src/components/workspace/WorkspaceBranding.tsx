'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type WorkspaceBranding = {
  id: string;
  name: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  logoColor: string | null;
  showCompanyName: boolean;
};

const BrandingCtx = createContext<WorkspaceBranding | null>(null);

export function useWorkspaceBranding() {
  return useContext(BrandingCtx);
}

export function WorkspaceBrandingProvider({
  workspaceId,
  initialName,
  initial,
  children,
}: {
  workspaceId: string;
  initialName: string;
  initial?: Partial<WorkspaceBranding> | null;
  children: ReactNode;
}) {
  const [branding, setBranding] = useState<WorkspaceBranding>({
    id: workspaceId,
    name: initial?.name || initialName,
    logoUrl: initial?.logoUrl ?? null,
    logoUrlDark: initial?.logoUrlDark ?? null,
    logoColor: initial?.logoColor ?? null,
    showCompanyName: initial?.showCompanyName !== false,
  });

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    const apply = (data: WorkspaceBranding | undefined) => {
      if (!closed && data?.id === workspaceId) setBranding(data);
    };

    void fetch(`/api/workspaces/${workspaceId}/branding`)
      .then((r) => r.json())
      .then((j) => apply(j.data))
      .catch(() => undefined);

    const onLocal = (e: Event) => {
      const data = (e as CustomEvent<WorkspaceBranding>).detail;
      apply(data);
    };
    window.addEventListener('enterhub:branding', onLocal);

    try {
      es = new EventSource(`/api/workspaces/${workspaceId}/branding/stream`);
      es.addEventListener('branding', (ev) => {
        try {
          apply(JSON.parse((ev as MessageEvent).data) as WorkspaceBranding);
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* EventSource unavailable */
    }

    return () => {
      closed = true;
      es?.close();
      window.removeEventListener('enterhub:branding', onLocal);
    };
  }, [workspaceId]);

  return <BrandingCtx.Provider value={branding}>{children}</BrandingCtx.Provider>;
}
