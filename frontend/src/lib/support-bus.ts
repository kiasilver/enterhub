import { EventEmitter } from 'events';

type TicketEvent = {
  type: 'message' | 'status';
  ticketId: string;
  payload: unknown;
};

declare global {
  // eslint-disable-next-line no-var
  var __supportTicketBus: EventEmitter | undefined;
}

function bus() {
  if (!global.__supportTicketBus) {
    global.__supportTicketBus = new EventEmitter();
    global.__supportTicketBus.setMaxListeners(200);
  }
  return global.__supportTicketBus;
}

export function publishTicketEvent(event: TicketEvent) {
  bus().emit(`ticket:${event.ticketId}`, event);
  bus().emit('ticket:all', event);
}

export function subscribeTicket(
  ticketId: string,
  handler: (event: TicketEvent) => void,
) {
  const key = `ticket:${ticketId}`;
  bus().on(key, handler);
  return () => bus().off(key, handler);
}

export function subscribeAllTickets(handler: (event: TicketEvent) => void) {
  bus().on('ticket:all', handler);
  return () => bus().off('ticket:all', handler);
}
