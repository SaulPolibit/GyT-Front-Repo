/**
 * Stripe Products Configuration
 * Emulated Stripe products for two subscription models:
 * - tier_based: For starter enterprises (fixed monthly fee based on tier limits)
 * - payg: Pay-As-You-Grow for big enterprises (base fee + per-investor costs)
 */

export type SubscriptionModel = 'tier_based' | 'payg';

// Get subscription model from environment variable
export const getSubscriptionModel = (): SubscriptionModel => {
  const model = process.env.NEXT_PUBLIC_SUBSCRIPTION_MODEL;
  if (model === 'payg') return 'payg';
  return 'tier_based'; // Default to tier-based
};

// ============================================================================
// SHARED PRODUCTS (Apply to both models)
// ============================================================================

export interface SharedProduct {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  frequency: 'one_time' | 'per_emission';
  scope: 'shared';
  metadata: {
    addon_type: string;
    pack_size?: number;
    included_emissions?: number;
  };
}

export const SHARED_PRODUCTS: SharedProduct[] = [
  {
    id: 'prod_setup_fee',
    name: 'Setup Fee',
    description: 'White-label + smart contract config + payment integration + 5h training. Includes 5 emissions.',
    amount: 528000, // $5,280.00
    frequency: 'one_time',
    scope: 'shared',
    metadata: {
      addon_type: 'setup',
      included_emissions: 5
    }
  },
  {
    id: 'prod_emission_individual',
    name: 'New Emission (Individual)',
    description: 'Single additional emission beyond included allocation',
    amount: 211500, // $2,115.00
    frequency: 'per_emission',
    scope: 'shared',
    metadata: {
      addon_type: 'emission',
      pack_size: 1
    }
  },
  {
    id: 'prod_emission_pack_5',
    name: 'Emission Pack (5)',
    description: '$1,000/emission vs $2,000 individual - 5 emissions',
    amount: 528000, // $5,280.00
    frequency: 'one_time',
    scope: 'shared',
    metadata: {
      addon_type: 'emission_pack',
      pack_size: 5
    }
  },
  {
    id: 'prod_emission_pack_10',
    name: 'Emission Pack (10)',
    description: '$1,000/emission vs $2,000 individual - 10 emissions',
    amount: 1056000, // $10,560.00
    frequency: 'one_time',
    scope: 'shared',
    metadata: {
      addon_type: 'emission_pack',
      pack_size: 10
    }
  },
  {
    id: 'prod_emission_pack_20',
    name: 'Emission Pack (20)',
    description: '$1,000/emission vs $2,000 individual - 20 emissions',
    amount: 2112000, // $21,120.00
    frequency: 'one_time',
    scope: 'shared',
    metadata: {
      addon_type: 'emission_pack',
      pack_size: 20
    }
  }
];

// ============================================================================
// TIER-BASED MODEL (Starter Enterprises)
// ============================================================================

export interface TierBasedPlan {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  frequency: 'monthly';
  tier: 'starter' | 'professional' | 'enterprise';
  limits: {
    maxAUM: string; // e.g., "≤$25M"
    maxInvestors: number;
  };
  model: 'tier_based';
  badge?: string;
}

export interface TierBasedAddon {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  frequency: 'monthly';
  addon_type: 'extra_aum' | 'extra_investors';
  per_unit: string;
  model: 'tier_based';
}

export const TIER_BASED_PLANS: TierBasedPlan[] = [
  {
    id: 'price_tier_starter',
    name: 'Monthly Fee - Starter',
    description: '12-month minimum contract',
    amount: 132000, // $1,320.00
    frequency: 'monthly',
    tier: 'starter',
    limits: {
      maxAUM: '≤$25M',
      maxInvestors: 50
    },
    model: 'tier_based'
  },
  {
    id: 'price_tier_professional',
    name: 'Monthly Fee - Professional',
    description: '12-month minimum contract',
    amount: 264000, // $2,640.00
    frequency: 'monthly',
    tier: 'professional',
    limits: {
      maxAUM: '≤$50M',
      maxInvestors: 100
    },
    model: 'tier_based',
    badge: 'Popular'
  },
  {
    id: 'price_tier_enterprise',
    name: 'Monthly Fee - Enterprise',
    description: '12-month minimum contract',
    amount: 528000, // $5,280.00
    frequency: 'monthly',
    tier: 'enterprise',
    limits: {
      maxAUM: '≤$100M',
      maxInvestors: 200
    },
    model: 'tier_based'
  }
];

export const TIER_BASED_ADDONS: TierBasedAddon[] = [
  {
    id: 'price_addon_extra_aum',
    name: 'Add-on: Extra AUM',
    description: 'Charged per additional $1M AUM over tier limit',
    amount: 11000, // $110.00
    frequency: 'monthly',
    addon_type: 'extra_aum',
    per_unit: 'Per +$1M AUM',
    model: 'tier_based'
  },
  {
    id: 'price_addon_extra_investors',
    name: 'Add-on: Extra Investors',
    description: 'Charged per investor over tier limit',
    amount: 400, // $4.00
    frequency: 'monthly',
    addon_type: 'extra_investors',
    per_unit: 'Per investor',
    model: 'tier_based'
  }
];

// ============================================================================
// PAY-AS-YOU-GROW MODEL (Big Enterprises)
// ============================================================================

export interface PaygPlan {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  frequency: 'monthly';
  tier: 'starter' | 'growth' | 'enterprise';
  limits: {
    maxInvestors: number;
  };
  model: 'payg';
  badge?: string;
}

export interface PaygPerInvestorCost {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  frequency: 'per_new_investor' | 'per_inv_emission';
  tier: 'starter' | 'growth' | 'enterprise';
  cost_type: 'kyc' | 'envelope';
  model: 'payg';
}

export const PAYG_PLANS: PaygPlan[] = [
  {
    id: 'price_payg_starter',
    name: 'Base Fee - Starter',
    description: '12-month minimum contract. ≤1,000 investors',
    amount: 53000, // $530.00
    frequency: 'monthly',
    tier: 'starter',
    limits: {
      maxInvestors: 1000
    },
    model: 'payg'
  },
  {
    id: 'price_payg_growth',
    name: 'Base Fee - Growth',
    description: '12-month minimum contract. ≤2,000 investors',
    amount: 106000, // $1,060.00
    frequency: 'monthly',
    tier: 'growth',
    limits: {
      maxInvestors: 2000
    },
    model: 'payg',
    badge: 'Popular'
  },
  {
    id: 'price_payg_enterprise',
    name: 'Base Fee - Enterprise',
    description: '12-month minimum contract. ≤4,000 investors',
    amount: 211500, // $2,115.00
    frequency: 'monthly',
    tier: 'enterprise',
    limits: {
      maxInvestors: 4000
    },
    model: 'payg'
  }
];

export const PAYG_PER_INVESTOR_COSTS: PaygPerInvestorCost[] = [
  // KYC Costs
  {
    id: 'price_kyc_starter',
    name: 'KYC - Starter',
    description: 'Charged once when investor completes verification',
    amount: 400, // $4.00
    frequency: 'per_new_investor',
    tier: 'starter',
    cost_type: 'kyc',
    model: 'payg'
  },
  {
    id: 'price_kyc_growth',
    name: 'KYC - Growth',
    description: 'Charged once when investor completes verification',
    amount: 300, // $3.00
    frequency: 'per_new_investor',
    tier: 'growth',
    cost_type: 'kyc',
    model: 'payg'
  },
  {
    id: 'price_kyc_enterprise',
    name: 'KYC - Enterprise',
    description: 'Charged once when investor completes verification',
    amount: 300, // $3.00
    frequency: 'per_new_investor',
    tier: 'enterprise',
    cost_type: 'kyc',
    model: 'payg'
  },
  // Envelope Costs
  {
    id: 'price_envelope_starter',
    name: 'Envelope - Starter',
    description: 'Contract signing for each investment in an emission',
    amount: 300, // $3.00
    frequency: 'per_inv_emission',
    tier: 'starter',
    cost_type: 'envelope',
    model: 'payg'
  },
  {
    id: 'price_envelope_growth',
    name: 'Envelope - Growth',
    description: 'Contract signing for each investment in an emission',
    amount: 200, // $2.00
    frequency: 'per_inv_emission',
    tier: 'growth',
    cost_type: 'envelope',
    model: 'payg'
  },
  {
    id: 'price_envelope_enterprise',
    name: 'Envelope - Enterprise',
    description: 'Contract signing for each investment in an emission',
    amount: 200, // $2.00
    frequency: 'per_inv_emission',
    tier: 'enterprise',
    cost_type: 'envelope',
    model: 'payg'
  }
];

// ============================================================================
// CREDITS/WALLET SYSTEM (For PAYG Model)
// ============================================================================

export interface CreditWallet {
  balance: number; // in cents
  minimumTopUp: number; // $50 minimum
  autoTopUpThreshold: number; // when balance <= $10, charge $40
  autoTopUpAmount: number; // $40 charge
}

export const CREDIT_WALLET_CONFIG: CreditWallet = {
  balance: 0,
  minimumTopUp: 5000, // $50.00 minimum
  autoTopUpThreshold: 1000, // $10.00 threshold
  autoTopUpAmount: 4000 // $40.00 auto charge
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format amount from cents to display string
 */
export const formatAmount = (amountInCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amountInCents / 100);
};

/**
 * Get per-investor costs for a specific tier in PAYG model
 */
export const getPaygCostsForTier = (tier: 'starter' | 'growth' | 'enterprise') => {
  const kyc = PAYG_PER_INVESTOR_COSTS.find(c => c.tier === tier && c.cost_type === 'kyc');
  const envelope = PAYG_PER_INVESTOR_COSTS.find(c => c.tier === tier && c.cost_type === 'envelope');
  return { kyc, envelope };
};

/**
 * Get all products for the current subscription model
 */
export const getProductsForModel = (model: SubscriptionModel) => {
  if (model === 'tier_based') {
    return {
      plans: TIER_BASED_PLANS,
      addons: TIER_BASED_ADDONS,
      shared: SHARED_PRODUCTS
    };
  }
  return {
    plans: PAYG_PLANS,
    perInvestorCosts: PAYG_PER_INVESTOR_COSTS,
    shared: SHARED_PRODUCTS,
    creditConfig: CREDIT_WALLET_CONFIG
  };
};

/**
 * Emulated subscription status for demo purposes
 */
export interface EmulatedSubscription {
  id: string;
  status: 'active' | 'inactive' | 'trialing' | 'past_due';
  model: SubscriptionModel;
  currentPlan: TierBasedPlan | PaygPlan | null;
  setupFeePaid: boolean;
  emissionsUsed: number;
  emissionsAvailable: number;
  creditBalance?: number; // For PAYG model
  addons?: {
    extraAUM?: number;
    extraInvestors?: number;
  };
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

/**
 * Get emulated subscription from localStorage (demo)
 */
export const getEmulatedSubscription = (): EmulatedSubscription | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('polibit_subscription');
  if (stored) {
    const sub = JSON.parse(stored);
    // Convert date strings back to Date objects
    if (sub.currentPeriodStart) sub.currentPeriodStart = new Date(sub.currentPeriodStart);
    if (sub.currentPeriodEnd) sub.currentPeriodEnd = new Date(sub.currentPeriodEnd);
    return sub;
  }
  return null;
};

/**
 * Save emulated subscription to localStorage (demo)
 */
export const saveEmulatedSubscription = (subscription: EmulatedSubscription): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('polibit_subscription', JSON.stringify(subscription));
};

/**
 * Clear emulated subscription (demo)
 */
export const clearEmulatedSubscription = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('polibit_subscription');
};

/**
 * Check if user has an active subscription
 */
export const hasActiveSubscription = (): boolean => {
  const sub = getEmulatedSubscription();
  return sub !== null && (sub.status === 'active' || sub.status === 'trialing');
};

/**
 * Check if user can create a new structure (based on subscription)
 */
export const canCreateStructure = (): { allowed: boolean; reason?: string } => {
  const sub = getEmulatedSubscription();

  if (!sub) {
    return {
      allowed: false,
      reason: 'No active subscription. Please subscribe to create structures.'
    };
  }

  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return {
      allowed: false,
      reason: 'Your subscription is not active. Please update your subscription.'
    };
  }

  if (!sub.setupFeePaid) {
    return {
      allowed: false,
      reason: 'Setup fee has not been paid. Please complete the setup process.'
    };
  }

  if (sub.emissionsAvailable <= 0) {
    return {
      allowed: false,
      reason: 'No emissions available. Please purchase additional emissions.'
    };
  }

  return { allowed: true };
};
