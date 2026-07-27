import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

function key(): Buffer {
  const secret = process.env.MAILBOX_SECRET || process.env.NEXTAUTH_SECRET || 'enterhub-dev-mailbox';
  return scryptSync(secret, 'enterhub-mailbox-salt', 32);
}

/** Encrypt mailbox password for DB storage (AES-256-GCM). */
export function encryptMailboxSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptMailboxSecret(blob: string): string {
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
