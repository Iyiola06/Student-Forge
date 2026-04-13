import { createHmac } from 'crypto';

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!signature || !secret) {
    return false;
  }

  const digest = createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  return digest === signature;
}
