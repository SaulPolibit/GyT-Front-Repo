import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Get subscription model from env
export const getSubscriptionModel = (): 'tier_based' | 'payg' => {
  const model = process.env.NEXT_PUBLIC_SUBSCRIPTION_MODEL;
  return model === 'payg' ? 'payg' : 'tier_based';
};

// Price IDs based on subscription model
export const getPriceIds = () => {
  const model = getSubscriptionModel();

  if (model === 'tier_based') {
    return {
      plans: {
        starter: process.env.STRIPE_PRICE_TIER_STARTER!,
        professional: process.env.STRIPE_PRICE_TIER_PROFESSIONAL!,
        enterprise: process.env.STRIPE_PRICE_TIER_ENTERPRISE!,
      },
      addons: {
        extraAum: process.env.STRIPE_PRICE_ADDON_EXTRA_AUM!,
        extraInvestors: process.env.STRIPE_PRICE_ADDON_EXTRA_INVESTORS!,
      },
    };
  }

  return {
    plans: {
      starter: process.env.STRIPE_PRICE_PAYG_STARTER!,
      growth: process.env.STRIPE_PRICE_PAYG_GROWTH!,
      enterprise: process.env.STRIPE_PRICE_PAYG_ENTERPRISE!,
    },
    kyc: {
      starter: process.env.STRIPE_PRICE_KYC_STARTER!,
      growth: process.env.STRIPE_PRICE_KYC_GROWTH!,
      enterprise: process.env.STRIPE_PRICE_KYC_ENTERPRISE!,
    },
    envelope: {
      starter: process.env.STRIPE_PRICE_ENVELOPE_STARTER!,
      growth: process.env.STRIPE_PRICE_ENVELOPE_GROWTH!,
      enterprise: process.env.STRIPE_PRICE_ENVELOPE_ENTERPRISE!,
    },
  };
};

// Shared price IDs
export const getSharedPriceIds = () => ({
  setupFee: process.env.STRIPE_PRICE_SETUP_FEE!,
  emissionSingle: process.env.STRIPE_PRICE_EMISSION_SINGLE!,
  emissionPack5: process.env.STRIPE_PRICE_EMISSION_PACK_5!,
  emissionPack10: process.env.STRIPE_PRICE_EMISSION_PACK_10!,
  emissionPack20: process.env.STRIPE_PRICE_EMISSION_PACK_20!,
});

// Plan details for display
export const PLAN_DETAILS = {
  tier_based: {
    starter: {
      name: 'Starter',
      maxAum: '≤$25M',
      maxInvestors: 50,
    },
    professional: {
      name: 'Professional',
      maxAum: '≤$50M',
      maxInvestors: 100,
    },
    enterprise: {
      name: 'Enterprise',
      maxAum: '≤$100M',
      maxInvestors: 200,
    },
  },
  payg: {
    starter: {
      name: 'Starter',
      maxInvestors: 1000,
      kycCost: 400,
      envelopeCost: 300,
    },
    growth: {
      name: 'Growth',
      maxInvestors: 2000,
      kycCost: 300,
      envelopeCost: 200,
    },
    enterprise: {
      name: 'Enterprise',
      maxInvestors: 4000,
      kycCost: 300,
      envelopeCost: 200,
    },
  },
};

// Emission pack sizes
export const EMISSION_PACKS = {
  single: 1,
  pack5: 5,
  pack10: 10,
  pack20: 20,
};

// Format amount for display
export const formatAmount = (amountInCents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
};
