export type UserRole = 'admin' | 'fund-manager' | 'operations' | 'read-only'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastLogin?: string
  invitedBy?: string
  profileImage?: string
}

export interface UserPermissions {
  // Structures
  viewStructures: boolean
  createStructure: boolean
  editStructure: boolean
  deleteStructure: boolean

  // Investors
  viewInvestors: boolean
  addInvestor: boolean
  editInvestor: boolean
  deleteInvestor: boolean

  // Investments
  viewInvestments: boolean
  addInvestment: boolean
  editInvestment: boolean
  deleteInvestment: boolean

  // Capital Operations
  issueCapitalCall: boolean
  executeDistribution: boolean
  markPayments: boolean

  // Reports
  generateReports: boolean
  viewReports: boolean
  exportReports: boolean

  // Documents
  viewDocuments: boolean
  uploadDocuments: boolean
  deleteDocuments: boolean

  // Performance
  viewPerformance: boolean

  // Chat
  sendMessages: boolean
  viewMessages: boolean

  // Settings
  manageSettings: boolean
  manageUsers: boolean
  manageNotifications: boolean
}

const STORAGE_KEY = 'polibit_users'

// Default users - seed with admin user
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    name: 'Tony Cueva',
    email: 'tony@orbis.capital',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Gabriela Mena',
    email: 'gabriela@orbis.capital',
    role: 'fund-manager',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLogin: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
]

// Get permissions for a specific role
export function getPermissionsForRole(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        viewStructures: true,
        createStructure: true,
        editStructure: true,
        deleteStructure: true,
        viewInvestors: true,
        addInvestor: true,
        editInvestor: true,
        deleteInvestor: true,
        viewInvestments: true,
        addInvestment: true,
        editInvestment: true,
        deleteInvestment: true,
        issueCapitalCall: true,
        executeDistribution: true,
        markPayments: true,
        generateReports: true,
        viewReports: true,
        exportReports: true,
        viewDocuments: true,
        uploadDocuments: true,
        deleteDocuments: true,
        viewPerformance: true,
        sendMessages: true,
        viewMessages: true,
        manageSettings: true,
        manageUsers: true,
        manageNotifications: true,
      }

    case 'fund-manager':
      return {
        viewStructures: true,
        createStructure: true,
        editStructure: true,
        deleteStructure: false,
        viewInvestors: true,
        addInvestor: true,
        editInvestor: true,
        deleteInvestor: false,
        viewInvestments: true,
        addInvestment: true,
        editInvestment: true,
        deleteInvestment: false,
        issueCapitalCall: true,
        executeDistribution: true,
        markPayments: true,
        generateReports: true,
        viewReports: true,
        exportReports: true,
        viewDocuments: true,
        uploadDocuments: true,
        deleteDocuments: true,
        viewPerformance: true,
        sendMessages: true,
        viewMessages: true,
        manageSettings: false,
        manageUsers: false,
        manageNotifications: true,
      }

    case 'operations':
      return {
        viewStructures: true,
        createStructure: false,
        editStructure: false,
        deleteStructure: false,
        viewInvestors: true,
        addInvestor: false,
        editInvestor: false,
        deleteInvestor: false,
        viewInvestments: true,
        addInvestment: false,
        editInvestment: false,
        deleteInvestment: false,
        issueCapitalCall: true,
        executeDistribution: true,
        markPayments: true,
        generateReports: true,
        viewReports: true,
        exportReports: true,
        viewDocuments: true,
        uploadDocuments: true,
        deleteDocuments: false,
        viewPerformance: true,
        sendMessages: true,
        viewMessages: true,
        manageSettings: false,
        manageUsers: false,
        manageNotifications: true,
      }

    case 'read-only':
      return {
        viewStructures: true,
        createStructure: false,
        editStructure: false,
        deleteStructure: false,
        viewInvestors: true,
        addInvestor: false,
        editInvestor: false,
        deleteInvestor: false,
        viewInvestments: true,
        addInvestment: false,
        editInvestment: false,
        deleteInvestment: false,
        issueCapitalCall: false,
        executeDistribution: false,
        markPayments: false,
        generateReports: true,
        viewReports: true,
        exportReports: true,
        viewDocuments: true,
        uploadDocuments: false,
        deleteDocuments: false,
        viewPerformance: true,
        sendMessages: false,
        viewMessages: true,
        manageSettings: false,
        manageUsers: false,
        manageNotifications: true,
      }
  }
}

// Get role display label
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'fund-manager':
      return 'Fund Manager'
    case 'operations':
      return 'Operations'
    case 'read-only':
      return 'Read-Only'
  }
}

// Get role description
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Full access to entire platform and configurations'
    case 'fund-manager':
      return 'Can create structures, investors, investments and view everything'
    case 'operations':
      return 'Focused on capital calls and distributions'
    case 'read-only':
      return 'View only access, perfect for auditors or advisors'
  }
}

// Get all users
export function getUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Initialize with default users
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading users:', error)
    return DEFAULT_USERS
  }
}

// Get user by ID
export function getUserById(id: string): User | null {
  const users = getUsers()
  return users.find(user => user.id === id) || null
}

// Create new user
export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const users = getUsers()

  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving user:', error)
    throw error
  }

  return newUser
}

// Update user
export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = getUsers()
  const index = users.findIndex(user => user.id === id)

  if (index === -1) return null

  users[index] = {
    ...users[index],
    ...updates,
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }

  return users[index]
}

// Delete user
export function deleteUser(id: string): boolean {
  const users = getUsers()
  const filtered = users.filter(user => user.id !== id)

  if (filtered.length === users.length) return false

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }

  return true
}

// Invite user (creates pending user)
export function inviteUser(email: string, role: UserRole, invitedBy: string): User {
  return createUser({
    name: email.split('@')[0], // Temporary name from email
    email,
    role,
    status: 'pending',
    invitedBy,
  })
}

// Activate user
export function activateUser(id: string): User | null {
  return updateUser(id, { status: 'active' })
}

// Deactivate user
export function deactivateUser(id: string): User | null {
  return updateUser(id, { status: 'inactive' })
}
