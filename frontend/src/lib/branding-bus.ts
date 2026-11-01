import { EventEmitter } from "events";

export type WorkspaceBranding = {
  id: string;
  name: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  logoColor: string | null;
  showCompanyName: boolean;
};

type BrandingEvent = {
  workspaceId: string;
  branding: WorkspaceBranding;
};

declare global {
  // eslint-disable-next-line no-var
  var __workspaceBrandingBus: EventEmitter | undefined;
}

function bus() {
  if (!global.__workspaceBrandingBus) {
    global.__workspaceBrandingBus = new EventEmitter();
    global.__workspaceBrandingBus.setMaxListeners(500);
  }
  return global.__workspaceBrandingBus;
}

export function publishWorkspaceBranding(event: BrandingEvent) {
  bus().emit(`branding:${event.workspaceId}`, event);
}

export function subscribeWorkspaceBranding(
  workspaceId: string,
  handler: (event: BrandingEvent) => void,
) {
  const key = `branding:${workspaceId}`;
  bus().on(key, handler);
  return () => bus().off(key, handler);
}
