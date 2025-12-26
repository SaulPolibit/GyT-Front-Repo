// API Configuration

export const API_CONFIG = {
  // Base URL for API requests
  // Set via NEXT_PUBLIC_API_URL environment variable
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',

  endpoints: {
    login: '/api/custom/login',
    mfaLoginVerify: '/api/custom/mfa/login-verify',
    mfaEnroll: '/api/custom/mfa/enroll',
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
    getInvestorCommitments: (investorId: string) => `/api/investors/${investorId}/commitments`,
    getInvestorCapitalCalls: (investorId: string) => `/api/investors/${investorId}/capital-calls`,

    // Current investor endpoints (me)
    getMyInvestorWithStructures: '/api/investors/me/with-structures',
    getMyCapitalCallsSummary: '/api/investors/me/capital-calls-summary',
    getMyCapitalCalls: '/api/investors/me/capital-calls',
    getMyDashboard: '/api/investors/me/dashboard',

    // Notification settings
    getNotificationSettings: '/api/notifications/settings',
    updateNotificationSettings: '/api/notifications/settings',
    enableAllNotifications: '/api/notifications/settings/enable-all',
    disableAllNotifications: '/api/notifications/settings/disable-all',

    // Firm settings
    getFirmSettings: '/api/firm-settings',
    updateFirmSettings: '/api/firm-settings',

    // Email configuration
    getUserEmailSettings: (userId: string) => `/api/users/${userId}/email-settings`,
    updateUserEmailSettings: (userId: string) => `/api/users/${userId}/email-settings`,
    sendTestEmail: (userId: string) => `/api/users/${userId}/email-settings/test`,

    // User profile
    updateUserProfile: '/api/users/profile',
    uploadProfileImage: '/api/users/profile-image',
    getUsersByRole: (roles: string) => `/api/users/filter?role=${roles}`,
    getAllUsers: '/api/users',
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

    // Add other endpoints as needed
  }
}

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  // If baseUrl is empty or not set, use localhost
  const baseUrl = API_CONFIG.baseUrl?.trim() || 'http://localhost:3000'
  return `${baseUrl}${endpoint}`
}
