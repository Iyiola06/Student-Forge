export function getBillingErrorMessage(payload: any, fallback: string) {
  if (payload?.code === 'INSUFFICIENT_CREDITS') {
    const available = Number(payload?.available ?? 0);
    const cost = Number(payload?.cost ?? 0);
    return `You need ${cost} credits for this action, but only have ${available}. Buy more credits in Settings.`;
  }

  return payload?.error || fallback;
}
