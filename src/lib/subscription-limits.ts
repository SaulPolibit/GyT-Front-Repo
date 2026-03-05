/**
 * Subscription Limits Utilities
 * Frontend utilities for checking and validating subscription limits
 *
 * Supports two subscription models:
 * - tier_based: Limits based on total AUM commitment and investor count
 * - payg: Limits based on investor count only
 */

import { getApiUrl, API_CONFIG } from './api-config';
import { getAuthToken } from './auth-storage';

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionModel = 'tier_based' | 'payg';
export type PaygTier = 'starter' | 'growth' | 'enterprise';
export type TierBasedTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionTier = PaygTier | TierBasedTier;

export interface SubscriptionLimits {
  maxInvestors: number;
  maxTotalCommitment?: number; // Only for tier_based
  name: string;
}

export interface UpgradeOption {
  tier: SubscriptionTier;
  name: string;
  maxInvestors: number;
  maxTotalCommitment?: number;
}

export interface SubscriptionUsage {
  model: SubscriptionModel;
  tier: SubscriptionTier;
  status: string | null;
  investors: {
    current: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  };
  commitment: {
    current: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  } | null;
  limits: SubscriptionLimits;
  upgradeOption: UpgradeOption | null;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  currentTotal?: number;
  currentCount?: number;
  newCommitment?: number;
  projectedTotal?: number;
  limit?: number;
  tier?: SubscriptionTier;
  model?: SubscriptionModel;
  remaining?: number;
  upgradeOption?: UpgradeOption | null;
  error?: string;
}

// ============================================================================
// CONSTANTS - LOCAL LIMITS CONFIGURATION
// ============================================================================

/**
 * PAYG Model Limits (Pay-As-You-Grow)
 * Limits based on number of investors
 */
export const PAYG_LIMITS: Record<PaygTier, SubscriptionLimits> = {
  starter: {
    maxInvestors: 1000,
    name: 'Base Fee - Starter'
  },
  growth: {
    maxInvestors: 2000,
    name: 'Base Fee - Growth'
  },
  enterprise: {
    maxInvestors: 4000,
    name: 'Base Fee - Enterprise'
  }
};

/**
 * Tier-Based Model Limits
 * Limits based on total AUM commitment AND investor count
 */
export const TIER_BASED_LIMITS: Record<TierBasedTier, SubscriptionLimits> = {
  starter: {
    maxTotalCommitment: 25000000, // $25 Million
    maxInvestors: 50,
    name: 'Monthly Fee - Starter'
  },
  professional: {
    maxTotalCommitment: 50000000, // $50 Million
    maxInvestors: 100,
    name: 'Monthly Fee - Professional'
  },
  enterprise: {
    maxTotalCommitment: 100000000, // $100 Million
    maxInvestors: 200,
    name: 'Monthly Fee - Enterprise'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get limits for a specific subscription model and tier
 */
export const getLimitsForSubscription = (
  model: SubscriptionModel,
  tier: SubscriptionTier
): SubscriptionLimits => {
  if (model === 'payg') {
    return PAYG_LIMITS[tier as PaygTier] || PAYG_LIMITS.starter;
  }
  return TIER_BASED_LIMITS[tier as TierBasedTier] || TIER_BASED_LIMITS.starter;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get the current subscription model from environment variable
 */
export const getSubscriptionModel = (): SubscriptionModel => {
  const model = process.env.NEXT_PUBLIC_SUBSCRIPTION_MODEL;
  if (model === 'payg') return 'payg';
  return 'tier_based';
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch subscription usage from backend API
 */
export const fetchSubscriptionUsage = async (): Promise<SubscriptionUsage | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('[SubscriptionLimits] No auth token found');
      return null;
    }

    const response = await fetch(getApiUrl('/api/stripe/subscription-usage'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription usage: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.usage : null;
  } catch (error) {
    console.error('[SubscriptionLimits] Error fetching usage:', error);
    return null;
  }
};

/**
 * Validate if a new structure can be created
 * @param totalCommitment - The total commitment of the new structure
 */
export const validateStructureCreation = async (
  totalCommitment: number = 0
): Promise<ValidationResult> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    const response = await fetch(getApiUrl('/api/stripe/validate-structure-creation'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ totalCommitment })
    });

    if (!response.ok) {
      throw new Error(`Validation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.validation : { allowed: false, reason: 'Validation failed' };
  } catch (error) {
    console.error('[SubscriptionLimits] Error validating structure creation:', error);
    // Allow creation on error to prevent blocking
    return { allowed: true, error: String(error) };
  }
};

/**
 * Validate if a new investor can be created
 */
export const validateInvestorCreation = async (): Promise<ValidationResult> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    const response = await fetch(getApiUrl('/api/stripe/validate-investor-creation'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Validation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.validation : { allowed: false, reason: 'Validation failed' };
  } catch (error) {
    console.error('[SubscriptionLimits] Error validating investor creation:', error);
    // Allow creation on error to prevent blocking
    return { allowed: true, error: String(error) };
  }
};

/**
 * Update subscription model and tier
 */
export const updateSubscriptionPlan = async (
  model: SubscriptionModel,
  tier: SubscriptionTier
): Promise<{ success: boolean; usage?: SubscriptionUsage; error?: string }> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(getApiUrl('/api/stripe/update-subscription-plan'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, tier })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Update failed' };
    }

    const data = await response.json();
    return { success: true, usage: data.usage };
  } catch (error) {
    console.error('[SubscriptionLimits] Error updating subscription plan:', error);
    return { success: false, error: String(error) };
  }
};

// ============================================================================
// LOCAL VALIDATION (Fallback when API unavailable)
// ============================================================================

/**
 * Local validation for structure creation (tier_based model only)
 * Use this as a pre-check before making API calls
 */
export const localValidateStructure = (
  model: SubscriptionModel,
  tier: SubscriptionTier,
  currentTotalCommitment: number,
  newCommitment: number
): ValidationResult => {
  // PAYG model doesn't have commitment limits
  if (model !== 'tier_based') {
    return { allowed: true };
  }

  const limits = getLimitsForSubscription(model, tier);
  const projectedTotal = currentTotalCommitment + newCommitment;

  if (limits.maxTotalCommitment && projectedTotal > limits.maxTotalCommitment) {
    return {
      allowed: false,
      reason: `Total commitment limit exceeded. Your ${limits.name} plan allows up to ${formatCurrency(limits.maxTotalCommitment)} total commitment. Current: ${formatCurrency(currentTotalCommitment)}, New structure: ${formatCurrency(newCommitment)}, Total: ${formatCurrency(projectedTotal)}.`,
      currentTotal: currentTotalCommitment,
      newCommitment,
      projectedTotal,
      limit: limits.maxTotalCommitment,
      tier
    };
  }

  return {
    allowed: true,
    currentTotal: currentTotalCommitment,
    newCommitment,
    projectedTotal,
    limit: limits.maxTotalCommitment,
    remaining: limits.maxTotalCommitment ? limits.maxTotalCommitment - projectedTotal : undefined
  };
};

/**
 * Local validation for investor creation
 * Use this as a pre-check before making API calls
 */
export const localValidateInvestor = (
  model: SubscriptionModel,
  tier: SubscriptionTier,
  currentInvestorCount: number
): ValidationResult => {
  const limits = getLimitsForSubscription(model, tier);
  const projectedCount = currentInvestorCount + 1;

  if (projectedCount > limits.maxInvestors) {
    return {
      allowed: false,
      reason: `Investor limit exceeded. Your ${limits.name} plan allows up to ${limits.maxInvestors} investors. Current: ${currentInvestorCount}. Please upgrade your subscription to add more investors.`,
      currentCount: currentInvestorCount,
      limit: limits.maxInvestors,
      tier,
      model
    };
  }

  return {
    allowed: true,
    currentCount: currentInvestorCount,
    limit: limits.maxInvestors,
    remaining: limits.maxInvestors - projectedCount
  };
};

// ============================================================================
// ERROR MESSAGE HELPERS
// ============================================================================

/**
 * Generate user-friendly error message for limit exceeded
 */
export const getLimitExceededMessage = (
  type: 'structure' | 'investor',
  validation: ValidationResult
): string => {
  if (validation.allowed) return '';

  if (type === 'structure') {
    const upgrade = validation.upgradeOption;
    let message = validation.reason || 'Total commitment limit exceeded.';

    if (upgrade) {
      message += ` Upgrade to ${upgrade.name} for up to ${formatCurrency(upgrade.maxTotalCommitment || 0)} total commitment.`;
    }

    return message;
  } else {
    const upgrade = validation.upgradeOption;
    let message = validation.reason || 'Investor limit exceeded.';

    if (upgrade) {
      message += ` Upgrade to ${upgrade.name} for up to ${upgrade.maxInvestors} investors.`;
    }

    return message;
  }
};

/**
 * Get upgrade CTA button text
 */
export const getUpgradeButtonText = (upgradeOption: UpgradeOption | null): string => {
  if (!upgradeOption) return 'Contact Sales';
  return `Upgrade to ${upgradeOption.name}`;
};
