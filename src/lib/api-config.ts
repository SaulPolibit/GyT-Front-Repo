// API Configuration

export const API_CONFIG = {
  // Base URL for API requests
  // Set via NEXT_PUBLIC_API_URL environment variable
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',

  endpoints: {
    login: '/api/custom/login',
    mfaEnroll: '/api/custom/mfa/enroll',
    mfaUnenroll: '/api/custom/mfa/unenroll',
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
    getMyCapitalCallsSummary: '/api/investors/me/capital-calls-summary',
    getMyCapitalCalls: '/api/investors/me/capital-calls',
    getMyDashboard: '/api/investors/me/dashboard',

    // Notification settings
    getNotificationSettings: '/api/notifications/settings',
    updateNotificationSettings: '/api/notifications/settings',
    enableAllNotifications: '/api/notifications/settings/enable-all',
    disableAllNotifications: '/api/notifications/settings/disable-all',

    // User profile
    updateUserProfile: '/api/custom/user/profile',
    uploadProfileImage: '/api/custom/user/profile-image',
    getUsersByRole: (roles: string) => `/api/users/filter?role=${roles}`,
    createInvestor: '/api/investors',

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

    // Add other endpoints as needed
  }
}

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.baseUrl}${endpoint}`
}
