// API Configuration

export const API_CONFIG = {
  // Base URL for API requests
  // Set via NEXT_PUBLIC_API_URL environment variable
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  endpoints: {
    login: '/api/custom/login',
    mfaLoginVerify: '/api/custom/mfa/login-verify',
    mfaEnroll: '/api/custom/mfa/enroll',
    mfaVerifyEnrollment: '/api/custom/mfa/verify-enrollment',
    mfaUnenroll: '/api/custom/mfa/unenroll',
    mfaChallenge: '/api/custom/mfa/challenge',
    mfaVerify: '/api/custom/mfa/verify',
    mfaStatus: '/api/custom/mfa/status',
    diditSession: '/api/custom/didit/session',
    getDiditSession: (sessionId: string) => `/api/custom/didit/session/${sessionId}`,
    getAllStructures: '/api/structures',
    getSingleStructure: (structureId: string) => `/api/structures/${structureId}`,
    updateStructure: (structureId: string) => `/api/structures/${structureId}`,
    deleteStructure: (structureId: string) => `/api/structures/${structureId}`,
    getStructureDocuments: (structureId: string) => `/api/documents/entity/Structure/${structureId}`,
    verifyUserSignature: '/api/docuseal/verifyUserSignature',
    createPayment: '/api/payments',

    // Investments API
    getAllInvestments: '/api/investments',
    getSingleInvestment: (investmentId: string) => `/api/investments/${investmentId}`,
    updateInvestment: (investmentId: string) => `/api/investments/${investmentId}`,
    createInvestment: '/api/investments',
    deleteInvestment: (investmentId: string) => `/api/investments/${investmentId}`,

    // Investors API
    getAllInvestors: '/api/investors',
    getAllInvestorsWithStructures: '/api/investors/with-structures',
    searchInvestors: (query: string) => `/api/investors/search?q=${encodeURIComponent(query)}`,
    getInvestorWithStructures: (investorId: string) => `/api/investors/${investorId}/with-structures`,
    getInvestorById: (investorId: string) => `/api/investors/${investorId}`,
    updateInvestorById: (investorId: string) => `/api/investors/${investorId}`,
    deleteInvestor: (investorId: string) => `/api/investors/${investorId}`,
    getInvestorCommitments: (investorId: string) => `/api/investors/${investorId}/commitments`,
    getInvestorCapitalCalls: (investorId: string) => `/api/investors/${investorId}/capital-calls`,

    // Current investor endpoints (me)
    getMyInvestorWithStructures: '/api/investors/me/with-structures',
    getMyCapitalCallsSummary: '/api/investors/me/capital-calls-summary',
    getMyCapitalCalls: '/api/investors/me/capital-calls',
    getMyDashboard: '/api/investors/me/dashboard',

    // Notification settings
    getNotificationSettings: '/api/notifications/settings',
    getNotificationSettingsById: (userId: string) => `/api/notifications/settings/${userId}`,
    updateNotificationSettings: '/api/notifications/settings',
    enableAllNotifications: '/api/notifications/settings/enable-all',
    disableAllNotifications: '/api/notifications/settings/disable-all',

    // Notifications inbox
    getNotifications: '/api/notifications',
    getNotificationById: (id: string) => `/api/notifications/${id}`,
    getUnreadNotificationCount: '/api/notifications/unread-count',
    createNotification: '/api/notifications',
    createBulkNotifications: '/api/notifications/bulk',
    markNotificationAsRead: (id: string) => `/api/notifications/${id}/read`,
    markAllNotificationsAsRead: '/api/notifications/read-all',
    deleteNotification: (id: string) => `/api/notifications/${id}`,
    cleanupOldNotifications: '/api/notifications/cleanup/old',
    cleanupExpiredNotifications: '/api/notifications/cleanup/expired',

    // Firm settings
    getFirmSettings: '/api/firm-settings',
    getFirmLogo: '/api/firm-settings/logo',
    updateFirmSettings: '/api/firm-settings',

    // Email configuration (legacy SMTP)
    getUserEmailSettings: (userId: string) => `/api/users/${userId}/email-settings`,
    updateUserEmailSettings: (userId: string) => `/api/users/${userId}/email-settings`,
    sendTestEmail: (userId: string) => `/api/users/${userId}/email-settings/test`,

    // Email Domains (Resend)
    getEmailDomains: '/api/email-domains',
    getVerifiedEmailDomains: '/api/email-domains/verified',
    getEmailDomain: (domainId: string) => `/api/email-domains/${domainId}`,
    createEmailDomain: '/api/email-domains',
    verifyEmailDomain: (domainId: string) => `/api/email-domains/${domainId}/verify`,
    updateEmailDomainConfig: (domainId: string) => `/api/email-domains/${domainId}/config`,
    deleteEmailDomain: (domainId: string) => `/api/email-domains/${domainId}`,
    getEmailDomainDnsRecords: (domainId: string) => `/api/email-domains/${domainId}/dns-records`,

    // User profile
    updateUserProfile: '/api/users/profile',
    uploadProfileImage: '/api/users/profile-image',
    getUsersByRole: (roles: string) => `/api/users/filter?role=${roles}`,
    getInvestorUsers: '/api/users/investors',
    getAllUsers: '/api/users',
    createUser: '/api/users/register',
    getUserById: (userId: string) => `/api/users/${userId}`,
    deleteUser: (userId: string) => `/api/users/${userId}`,
    createInvestor: '/api/investors',
    sendEmail: (userId: string) => `/api/users/${userId}/send-email`,

    // Chat/Messages API
    getConversations: '/api/conversations',
    createConversation: '/api/conversations',
    deleteConversation: (conversationId: string) => `/api/conversations/${conversationId}`,
    getMessages: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
    sendMessage: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
    sendFileMessage: (conversationId: string) => `/api/conversations/${conversationId}/messages/file`,
    searchMessages: (conversationId: string) => `/api/conversations/${conversationId}/messages/search`,
    markMessageAsRead: (messageId: string) => `/api/messages/${messageId}/read`,
    deleteMessage: (messageId: string) => `/api/messages/${messageId}`,
    getAvailableUsers: '/api/messages/available-users',

    // Documents API
    getAllDocuments: '/api/documents/all',
    getCombinedDocuments: '/api/documents/combined',
    uploadDocument: '/api/documents',
    getEntityDocuments: (entityType: string, entityId: string) => `/api/documents/entity/${entityType}/${entityId}`,
    deleteDocument: (documentId: string) => `/api/documents/${documentId}`,

    // Payment Approvals API
    getAllPayments: '/api/payments',
    getPaymentStats: '/api/payments/approvals/stats',
    getPaymentById: (paymentId: string) => `/api/payments/${paymentId}`,
    approvePayment: (paymentId: string) => `/api/payments/${paymentId}/approve`,
    rejectPayment: (paymentId: string) => `/api/payments/${paymentId}/reject`,

    // Capital Calls API
    getAllCapitalCalls: '/api/capital-calls',
    getCapitalCallById: (id: string) => `/api/capital-calls/${id}`,
    getCapitalCallsByStructure: (structureId: string) => `/api/capital-calls/structure/${structureId}/summary`,

    // Distributions API
    getAllDistributions: '/api/distributions',
    getDistributionById: (id: string) => `/api/distributions/${id}`,
    getDistributionsByStructure: (structureId: string) => `/api/distributions/structure/${structureId}/summary`,

    // Blockchain API
    registerUserOnBlockchain: '/api/blockchain/contract/register-user',
    mintTokensOnBlockchain: '/api/blockchain/contract/mint-tokens',

    // Blockchain Contract Management
    checkContractOwnership: (contractAddress: string) => `/api/blockchain/contract/${contractAddress}/ownership`,
    transferContractOwnership: '/api/blockchain/contract/transfer-ownership',
    checkAgent: (contractAddress: string, agentAddress: string) => `/api/blockchain/contract/${contractAddress}/check-agent/${agentAddress}`,
    registerAgent: '/api/blockchain/contract/register-agent',
    removeAgent: '/api/blockchain/contract/remove-agent',
    checkUser: (identityAddress: string, userAddress: string) => `/api/blockchain/contract/${identityAddress}/check-user/${userAddress}`,
    registerUser: '/api/blockchain/contract/register-user',
    removeUser: '/api/blockchain/contract/remove-user',
    checkCountry: (complianceAddress: string, country: string) => `/api/blockchain/contract/${complianceAddress}/check-country/${country}`,
    addCountry: '/api/blockchain/contract/add-country',
    removeCountry: '/api/blockchain/contract/remove-country',
    getTokenBalance: (contractAddress: string, userAddress: string) => `/api/blockchain/contract/${contractAddress}/balance/${userAddress}`,
    transferTokens: '/api/blockchain/contract/transfer-tokens',
    checkAllowance: (contractAddress: string, owner: string, spender: string) => `/api/blockchain/contract/allowance?contractAddress=${contractAddress}&owner=${owner}&spender=${spender}`,
    setAllowance: '/api/blockchain/contract/set-allowance',
    getContractOwner: '/api/blockchain/contract/owner',
    getTokenHolders: '/api/blockchain/contract/token-holders',
    batchTransferTokens: '/api/blockchain/contract/batch-transfer-tokens',
    forceTransferTokens: '/api/blockchain/contract/force-transfer-tokens',
    getTotalSupply: '/api/blockchain/contract/total-supply',

    // Stripe Subscription API
    stripeGetConfig: '/api/stripe/config',
    stripeCreateCustomer: '/api/stripe/create-customer',
    stripeCreateSubscription: '/api/stripe/create-subscription',
    stripeGetSubscription: '/api/stripe/subscription',
    stripeAddAdditionalService: '/api/stripe/add-additional-service',
    stripeUpdateServiceQuantity: '/api/stripe/update-service-quantity',
    stripeRemoveService: '/api/stripe/remove-service',
    stripeCancelSubscription: '/api/stripe/cancel-subscription',
    stripeReactivateSubscription: '/api/stripe/reactivate-subscription',
    stripeGetInvoices: '/api/stripe/invoices',
    stripeGetUpcomingInvoice: '/api/stripe/upcoming-invoice',
    stripeCreateSetupIntent: '/api/stripe/create-setup-intent',
    stripeGetPaymentMethods: '/api/stripe/payment-methods',

    // Stripe Connect API (for Investors)
    stripeConnectCreateAccount: '/api/stripe/connect/create-account',
    stripeConnectOnboardingLink: '/api/stripe/connect/onboarding-link',
    stripeConnectAccountStatus: '/api/stripe/connect/account-status',
    stripeConnectDashboardLink: '/api/stripe/connect/dashboard-link',
    stripeConnectBalance: '/api/stripe/connect/balance',

    // Stripe Connect Admin API (for Fund Managers)
    stripeConnectAdminInvestors: '/api/stripe/connect/admin/investors',
    stripeConnectAdminStatus: (investorId: string) => `/api/stripe/connect/admin/status/${investorId}`,
    stripeConnectAdminSendInvite: (investorId: string) => `/api/stripe/connect/admin/send-invite/${investorId}`,

    // Add other endpoints as needed
  }
}

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  // If baseUrl is empty or not set, use localhost
  const baseUrl = API_CONFIG.baseUrl?.trim() || 'http://localhost:3000'
  return `${baseUrl}${endpoint}`
}
