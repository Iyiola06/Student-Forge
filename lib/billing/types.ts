export type CreditGrantSummary = {
  id: string;
  source: string;
  credits_awarded: number;
  credits_remaining: number;
  expires_at: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type CreditTransactionSummary = {
  id: string;
  transaction_type: 'credit' | 'debit';
  source: string;
  amount: number;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type CreditEventSummary = {
  id: string;
  event_type:
    | 'purchase'
    | 'grant'
    | 'referral_bonus'
    | 'generation_spend'
    | 'advanced_extraction_spend'
    | 'adjustment'
    | 'expiry'
    | 'refund';
  source: string;
  amount: number;
  model_name: string | null;
  input_size: number | null;
  output_size: number | null;
  estimated_provider_cost: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WalletSummary = {
  balance: number;
  nextExpiry: string | null;
  grants: CreditGrantSummary[];
  transactions: CreditTransactionSummary[];
  events: CreditEventSummary[];
  referralCode?: string | null;
  referralRedemptions?: Array<{
    id: string;
    status: string;
    suspicious: boolean;
    created_at: string;
  }>;
  notifications?: Array<{
    id: string;
    notification_type: string;
    status: string;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
};
