import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { decryptMailboxSecret } from '@/lib/mailbox-crypto';
import { publishBadgeRefresh } from '@/lib/badge-bus';

function guessCategory(subject: string): string {
  const s = subject.toLowerCase();
  if (/critical|alert|incident|urgent/.test(s)) return 'alerts';
  if (/inspect|audit|checklist/.test(s)) return 'inspections';
  if (/train|certif|course/.test(s)) return 'trainings';
  return 'general';
}

function guessPriority(subject: string): string {
  const s = subject.toLowerCase();
  if (/critical|urgent/.test(s)) return 'critical';
  if (/important|asap|high/.test(s)) return 'high';
  if (/fyi|low/.test(s)) return 'low';
  return 'medium';
}

/** Sync recent INBOX messages from a connected mailbox into ExternalMailMessage. */
export async function syncConnectedMailbox(mailboxId: string): Promise<{
  imported: number;
  error?: string;
}> {
  const box = await prisma.connectedMailbox.findUnique({ where: { id: mailboxId } });
  if (!box || !box.isActive) {
    return { imported: 0, error: 'Mailbox not found' };
  }

  let password: string;
  try {
    password = decryptMailboxSecret(box.passwordEnc);
  } catch {
    return { imported: 0, error: 'Could not decrypt mailbox password' };
  }

  const client = new ImapFlow({
    host: box.imapHost,
    port: box.imapPort,
    secure: box.imapSecure,
    auth: { user: box.username, pass: password },
    logger: false,
  });

  let imported = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const total = client.mailbox?.exists || 0;
      const from = Math.max(1, total - 49);
      if (total === 0) {
        await prisma.connectedMailbox.update({
          where: { id: mailboxId },
          data: { lastSyncAt: new Date(), lastError: null },
        });
        return { imported: 0 };
      }

      for await (const msg of client.fetch(`${from}:*`, {
        uid: true,
        envelope: true,
        source: true,
      })) {
        const uid = String(msg.uid);
        const exists = await prisma.externalMailMessage.findUnique({
          where: { mailboxId_externalUid: { mailboxId, externalUid: uid } },
        });
        if (exists) continue;

        let subject = msg.envelope?.subject || '(no subject)';
        let fromEmail = msg.envelope?.from?.[0]?.address || 'unknown@mail';
        let fromName = msg.envelope?.from?.[0]?.name || fromEmail;
        let bodyText = '';
        let toEmails = (msg.envelope?.to || [])
          .map((t) => t.address)
          .filter(Boolean)
          .join(', ');

        if (msg.source) {
          const parsed = await simpleParser(msg.source);
          subject = parsed.subject || subject;
          bodyText =
            (typeof parsed.text === 'string' && parsed.text) ||
            (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, ' ') : '') ||
            '';
          if (parsed.from?.value?.[0]) {
            fromEmail = parsed.from.value[0].address || fromEmail;
            fromName = parsed.from.value[0].name || fromName;
          }
          if (parsed.to) {
            const list = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
            toEmails = list
              .flatMap((t) => t.value || [])
              .map((v) => v.address)
              .filter(Boolean)
              .join(', ');
          }
        }

        const ownerUserId = box.userId;
        if (!ownerUserId && box.scope === 'PERSONAL') {
          continue;
        }

        // ORG mailboxes without userId: attach to workspace owner
        let ownerId = ownerUserId;
        if (!ownerId) {
          const ws = await prisma.workspace.findUnique({
            where: { id: box.workspaceId },
            select: { ownerId: true },
          });
          ownerId = ws?.ownerId;
        }
        if (!ownerId) continue;

        await prisma.externalMailMessage.create({
          data: {
            workspaceId: box.workspaceId,
            mailboxId,
            ownerUserId: ownerId,
            externalUid: uid,
            folder: 'inbox',
            fromName,
            fromEmail,
            toEmails,
            subject: subject.slice(0, 500),
            bodyText: bodyText.slice(0, 50000),
            category: guessCategory(subject),
            priority: guessPriority(subject),
            receivedAt: msg.envelope?.date || new Date(),
          },
        });
        imported += 1;
        publishBadgeRefresh({ workspaceId: box.workspaceId, userId: ownerId });
      }
    } finally {
      lock.release();
    }
    await client.logout();

    await prisma.connectedMailbox.update({
      where: { id: mailboxId },
      data: { lastSyncAt: new Date(), lastError: null },
    });
    return { imported };
  } catch (e) {
    const err = e instanceof Error ? e.message : 'IMAP sync failed';
    await prisma.connectedMailbox.update({
      where: { id: mailboxId },
      data: { lastError: err.slice(0, 500) },
    });
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    return { imported, error: err };
  }
}
