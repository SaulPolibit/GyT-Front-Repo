/**
 * Stripe API Client
 * Handles all API calls to the Stripe backend
 */
import { getApiUrl, API_CONFIG } from './api-config';
import { getAuthToken } from './auth-storage';

export interface SubscriptionData {
  success: boolean;
  subscriptionId?: string;
  clientSecret?: string;
  status?: string;
  subscription?: any;
  message?: string;
}

export interface CustomerData {
  success: boolean;
  customerId?: string;
  message?: string;
}

export interface InvoiceData {
  success: boolean;
  invoices?: any[];
  hasMore?: boolean;
}

export class StripeAPI {
  private static async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found. Please login.');
    }

    const url = getApiUrl(endpoint);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  /**
   * Create a Stripe customer for the current user
   */
  static async createCustomer(): Promise<CustomerData> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeCreateCustomer, {
      method: 'POST'
    });
  }

  /**
   * Create a new subscription
   * @param includeAdditionalService - Whether to include Additional Service Base Cost
   * @param trialDays - Optional trial period in days
   */
  static async createSubscription(
    includeAdditionalService: boolean = false,
    trialDays?: number
  ): Promise<SubscriptionData> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeCreateSubscription, {
      method: 'POST',
      body: JSON.stringify({
        includeAdditionalService,
        trialDays
      })
    });
  }

  /**
   * Get current subscription details
   */
  static async getSubscription(): Promise<SubscriptionData> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeGetSubscription);
  }

  /**
   * Add Additional Service Base Cost to existing subscription
   */
  static async addAdditionalService(): Promise<any> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeAddAdditionalService, {
      method: 'POST'
    });
  }

  /**
   * Update quantity of a service in subscription
   * @param subscriptionItemId - The subscription item ID to update
   * @param quantity - New quantity (must be >= 1)
   */
  static async updateServiceQuantity(subscriptionItemId: string, quantity: number): Promise<any> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeUpdateServiceQuantity, {
      method: 'POST',
      body: JSON.stringify({ subscriptionItemId, quantity })
    });
  }

  /**
   * Remove a service from subscription
   * @param subscriptionItemId - The subscription item ID to remove
   */
  static async removeService(subscriptionItemId: string): Promise<any> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeRemoveService, {
      method: 'POST',
      body: JSON.stringify({ subscriptionItemId })
    });
  }

  /**
   * Cancel subscription
   * @param immediately - If true, cancel immediately. If false, cancel at period end.
   */
  static async cancelSubscription(immediately: boolean = false): Promise<SubscriptionData> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeCancelSubscription, {
      method: 'POST',
      body: JSON.stringify({ immediately })
    });
  }

  /**
   * Reactivate a subscription scheduled for cancellation
   */
  static async reactivateSubscription(): Promise<SubscriptionData> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeReactivateSubscription, {
      method: 'POST'
    });
  }

  /**
   * Get customer invoices
   * @param limit - Number of invoices to retrieve (default: 10)
   */
  static async getInvoices(limit: number = 10): Promise<InvoiceData> {
    return this.fetchWithAuth(`${API_CONFIG.endpoints.stripeGetInvoices}?limit=${limit}`);
  }

  /**
   * Get upcoming invoice (preview of next charge)
   */
  static async getUpcomingInvoice(): Promise<any> {
    return this.fetchWithAuth(API_CONFIG.endpoints.stripeGetUpcomingInvoice);
  }

  /**
   * Get Stripe public configuration
   */
  static async getConfig(): Promise<any> {
    const url = getApiUrl(API_CONFIG.endpoints.stripeGetConfig);
    const response = await fetch(url);
    return response.json();
  }
}
