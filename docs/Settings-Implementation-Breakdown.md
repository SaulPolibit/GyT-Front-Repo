# Settings Page Implementation Breakdown

**Page:** `/investment-manager/settings`
**Status:** Partially Implemented (Firm Branding + Firm Details exist)
**To Add:** User Management + Notification Settings

---

## Current State

### ✅ Already Implemented
1. **Firm Branding Section**
   - Firm name editing
   - Logo upload (base64, 5MB limit)
   - Logo preview and removal

2. **Firm Details Section**
   - Firm email, phone, website, address, description
   - Form validation
   - Save/update functionality

3. **Data Layer**
   - `firm-settings-storage.ts` exists with localStorage persistence
   - CRUD operations working

---

## Requirements to Implement

### 1. User Management Section

#### Overview
Manage platform users with role-based access control (RBAC). Four roles with different permission levels.

#### User Roles (4 Total)

| Role | Spanish Label | Description |
|------|---------------|-------------|
| **Admin** | Administrador | Acceso completo a toda la plataforma y configuraciones |
| **Fund Manager** | Gerente de Fondos | Puede crear estructuras, inversionistas, inversiones y ver todo |
| **Operations** | Operaciones | Enfocado en capital calls y distribuciones |
| **Read-Only** | Solo Lectura | Solo visualización, perfecto para auditores o advisors |

#### Permissions Matrix

| Feature/Action | Admin | Fund Manager | Operations | Read-Only |
|----------------|-------|--------------|------------|-----------|
| **Structures** |
| View Structures | ✅ | ✅ | ✅ | ✅ |
| Create Structure | ✅ | ✅ | ❌ | ❌ |
| Edit Structure | ✅ | ✅ | ❌ | ❌ |
| Delete Structure | ✅ | ❌ | ❌ | ❌ |
| **Investors** |
| View Investors | ✅ | ✅ | ✅ | ✅ |
| Add Investor | ✅ | ✅ | ❌ | ❌ |
| Edit Investor | ✅ | ✅ | ❌ | ❌ |
| Delete Investor | ✅ | ❌ | ❌ | ❌ |
| **Investments** |
| View Investments | ✅ | ✅ | ✅ | ✅ |
| Add Investment | ✅ | ✅ | ❌ | ❌ |
| Edit Investment | ✅ | ✅ | ❌ | ❌ |
| Delete Investment | ✅ | ❌ | ❌ | ❌ |
| **Capital Operations** |
| Issue Capital Call | ✅ | ✅ | ✅ | ❌ |
| Execute Distribution | ✅ | ✅ | ✅ | ❌ |
| Mark Payments | ✅ | ✅ | ✅ | ❌ |
| **Reports** |
| Generate Reports | ✅ | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ | ✅ |
| Export Reports | ✅ | ✅ | ✅ | ✅ |
| **Documents** |
| View Documents | ✅ | ✅ | ✅ | ✅ |
| Upload Documents | ✅ | ✅ | ✅ | ❌ |
| Delete Documents | ✅ | ✅ | ❌ | ❌ |
| **Performance** |
| View Performance | ✅ | ✅ | ✅ | ✅ |
| **Chat** |
| Send Messages | ✅ | ✅ | ✅ | ❌ |
| View Messages | ✅ | ✅ | ✅ | ✅ |
| **Settings** |
| Manage Settings | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Manage Notifications | ✅ | ✅ | ✅ | ✅ |

#### Data Structure

**File to Create:** `/src/lib/user-management-storage.ts`

```typescript
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
```

**Permission Helper Functions:**

```typescript
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
```

**CRUD Functions:**

```typescript
export function getUsers(): User[]
export function getUserById(id: string): User | null
export function createUser(user: Omit<User, 'id' | 'createdAt'>): User
export function updateUser(id: string, updates: Partial<User>): User | null
export function deleteUser(id: string): boolean
export function inviteUser(email: string, role: UserRole, invitedBy: string): User
export function activateUser(id: string): User | null
export function deactivateUser(id: string): User | null
```

#### UI Components to Create

**1. User Management Card** (in Settings page)

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage platform users and their access levels
        </CardDescription>
      </div>
      <Button onClick={() => setShowInviteModal(true)}>
        <IconUserPlus className="h-4 w-4 mr-2" />
        Invite User
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* User list table */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge>{getRoleLabel(user.role)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                {user.status}
              </Badge>
            </TableCell>
            <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconDotsVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                    Edit Role
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewPermissions(user)}>
                    View Permissions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600"
                  >
                    Remove User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**2. Roles Explanation Section** (before user table)

```tsx
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-semibold mb-2">Platform Roles</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Polibit ofrece cuatro roles de usuario con diferentes permisos:
    </p>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Acceso completo a toda la plataforma y configuraciones
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fund Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Puede crear estructuras, inversionistas, inversiones y ver todo
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Enfocado en capital calls y distribuciones
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Read-Only</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Solo visualización, perfecto para auditores o advisors
        </p>
      </CardContent>
    </Card>
  </div>
</div>
```

**3. Permissions Matrix Modal/Dialog**

```tsx
<Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Role Permissions Matrix</DialogTitle>
      <DialogDescription>
        Cada rol tiene permisos específicos. Por ejemplo, solo los Admins pueden modificar settings,
        pero tanto Admins como Fund Managers pueden crear estructuras nuevas.
      </DialogDescription>
    </DialogHeader>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Feature/Action</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Fund Manager</TableHead>
          <TableHead>Operations</TableHead>
          <TableHead>Read-Only</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Structures */}
        <TableRow className="bg-muted/50">
          <TableCell colSpan={5} className="font-semibold">Structures</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>View Structures</TableCell>
          <TableCell><IconCheck className="h-4 w-4 text-green-600" /></TableCell>
          <TableCell><IconCheck className="h-4 w-4 text-green-600" /></TableCell>
          <TableCell><IconCheck className="h-4 w-4 text-green-600" /></TableCell>
          <TableCell><IconCheck className="h-4 w-4 text-green-600" /></TableCell>
        </TableRow>
        {/* ... more rows ... */}
      </TableBody>
    </Table>
  </DialogContent>
</Dialog>
```

**4. Invite User Modal**

```tsx
<Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Invite User</DialogTitle>
      <DialogDescription>
        Send an invitation to join your investment management platform
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="fund-manager">Fund Manager</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="read-only">Read-Only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {getRoleDescription(inviteRole)}
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowInviteModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleInviteUser}>
        Send Invitation
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 2. Notification Settings Section

#### Overview
Configure email notifications for important platform events. Users can customize notification preferences per event type and choose delivery frequency.

#### Data Structure

**File to Create:** `/src/lib/notification-settings-storage.ts`

```typescript
export type NotificationFrequency = 'real-time' | 'daily-digest' | 'weekly-summary' | 'disabled'

export interface NotificationEvent {
  id: string
  name: string
  description: string
  category: 'capital' | 'reports' | 'investors' | 'system'
  enabled: boolean
  frequency: NotificationFrequency
}

export interface NotificationSettings {
  // Capital Operations
  capitalCallIssued: NotificationEvent
  distributionExecuted: NotificationEvent
  paymentOverdue: NotificationEvent
  paymentReceived: NotificationEvent

  // Reports
  reportGenerated: NotificationEvent
  quarterlyReportDue: NotificationEvent

  // Investors
  newInvestorAdded: NotificationEvent
  investorDocumentUploaded: NotificationEvent

  // System
  systemMaintenance: NotificationEvent
  securityAlert: NotificationEvent

  // Global settings
  emailAddress: string
  enableEmailNotifications: boolean
  enableInAppNotifications: boolean

  updatedAt: Date
}
```

**Default Settings:**

```typescript
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  capitalCallIssued: {
    id: 'capital-call-issued',
    name: 'Capital Call Issued',
    description: 'Notificación cuando se emite un nuevo capital call',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  distributionExecuted: {
    id: 'distribution-executed',
    name: 'Distribution Executed',
    description: 'Notificación cuando se ejecuta una distribución',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  paymentOverdue: {
    id: 'payment-overdue',
    name: 'Payment Overdue',
    description: 'Alerta cuando un pago está vencido',
    category: 'capital',
    enabled: true,
    frequency: 'daily-digest',
  },
  paymentReceived: {
    id: 'payment-received',
    name: 'Payment Received',
    description: 'Confirmación cuando se recibe un pago',
    category: 'capital',
    enabled: true,
    frequency: 'real-time',
  },
  reportGenerated: {
    id: 'report-generated',
    name: 'Report Generated',
    description: 'Notificación cuando se genera un reporte',
    category: 'reports',
    enabled: true,
    frequency: 'real-time',
  },
  quarterlyReportDue: {
    id: 'quarterly-report-due',
    name: 'Quarterly Report Due',
    description: 'Recordatorio de reporte trimestral próximo',
    category: 'reports',
    enabled: true,
    frequency: 'weekly-summary',
  },
  newInvestorAdded: {
    id: 'new-investor-added',
    name: 'New Investor Added',
    description: 'Notificación cuando se agrega un nuevo inversionista',
    category: 'investors',
    enabled: true,
    frequency: 'real-time',
  },
  investorDocumentUploaded: {
    id: 'investor-document-uploaded',
    name: 'Investor Document Uploaded',
    description: 'Notificación cuando un inversionista sube un documento',
    category: 'investors',
    enabled: false,
    frequency: 'daily-digest',
  },
  systemMaintenance: {
    id: 'system-maintenance',
    name: 'System Maintenance',
    description: 'Aviso de mantenimiento programado del sistema',
    category: 'system',
    enabled: true,
    frequency: 'real-time',
  },
  securityAlert: {
    id: 'security-alert',
    name: 'Security Alert',
    description: 'Alertas de seguridad importantes',
    category: 'system',
    enabled: true,
    frequency: 'real-time',
  },
  emailAddress: '',
  enableEmailNotifications: true,
  enableInAppNotifications: true,
  updatedAt: new Date(),
}
```

**CRUD Functions:**

```typescript
export function getNotificationSettings(): NotificationSettings
export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings
export function updateEventSetting(eventId: string, updates: Partial<NotificationEvent>): NotificationSettings
export function resetNotificationSettings(): NotificationSettings
```

#### UI Components to Create

**Notification Settings Card** (in Settings page)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Notification Settings</CardTitle>
    <CardDescription>
      Configura notificaciones por email para eventos importantes
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Global toggles */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enableEmail">Email Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive notifications via email
          </p>
        </div>
        <Switch
          id="enableEmail"
          checked={notificationSettings.enableEmailNotifications}
          onCheckedChange={(checked) =>
            handleUpdateSettings({ enableEmailNotifications: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enableInApp">In-App Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Show notifications in the platform
          </p>
        </div>
        <Switch
          id="enableInApp"
          checked={notificationSettings.enableInAppNotifications}
          onCheckedChange={(checked) =>
            handleUpdateSettings({ enableInAppNotifications: checked })
          }
        />
      </div>
    </div>

    <Separator />

    {/* Event categories */}
    <div className="space-y-6">
      {/* Capital Operations */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Capital Operations</h4>
        <div className="space-y-4">
          {renderEventSetting(notificationSettings.capitalCallIssued)}
          {renderEventSetting(notificationSettings.distributionExecuted)}
          {renderEventSetting(notificationSettings.paymentOverdue)}
          {renderEventSetting(notificationSettings.paymentReceived)}
        </div>
      </div>

      {/* Reports */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Reports</h4>
        <div className="space-y-4">
          {renderEventSetting(notificationSettings.reportGenerated)}
          {renderEventSetting(notificationSettings.quarterlyReportDue)}
        </div>
      </div>

      {/* Investors */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Investors</h4>
        <div className="space-y-4">
          {renderEventSetting(notificationSettings.newInvestorAdded)}
          {renderEventSetting(notificationSettings.investorDocumentUploaded)}
        </div>
      </div>

      {/* System */}
      <div>
        <h4 className="text-sm font-semibold mb-4">System</h4>
        <div className="space-y-4">
          {renderEventSetting(notificationSettings.systemMaintenance)}
          {renderEventSetting(notificationSettings.securityAlert)}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

**Event Setting Row Component:**

```tsx
function renderEventSetting(event: NotificationEvent) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label>{event.name}</Label>
          <Switch
            checked={event.enabled}
            onCheckedChange={(checked) =>
              handleUpdateEventSetting(event.id, { enabled: checked })
            }
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {event.description}
        </p>
      </div>

      {event.enabled && (
        <Select
          value={event.frequency}
          onValueChange={(value) =>
            handleUpdateEventSetting(event.id, { frequency: value as NotificationFrequency })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real-time">Real-time</SelectItem>
            <SelectItem value="daily-digest">Daily Digest</SelectItem>
            <SelectItem value="weekly-summary">Weekly Summary</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
```

**Frequency Descriptions:**

```tsx
<div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
  <p><strong>Real-time:</strong> Notificaciones inmediatas cuando ocurre el evento</p>
  <p><strong>Daily Digest:</strong> Resumen diario de eventos (enviado a las 9:00 AM)</p>
  <p><strong>Weekly Summary:</strong> Resumen semanal (enviado los lunes)</p>
  <p><strong>Disabled:</strong> No recibir notificaciones de este evento</p>
</div>
```

---

## Implementation Steps

### Phase 1: User Management (4-6 hours)

1. **Create Data Layer** (1 hour)
   - Create `/src/lib/user-management-storage.ts`
   - Define User and UserPermissions interfaces
   - Implement CRUD functions
   - Add role-to-permissions mapping
   - Seed with 2-3 sample users

2. **Create UI Components** (2-3 hours)
   - Add Roles Explanation section to Settings page
   - Create User Management Card with table
   - Implement Invite User Modal
   - Create Permissions Matrix Dialog
   - Add Edit User Role functionality

3. **Wire Up Functionality** (1-2 hours)
   - Connect UI to storage layer
   - Implement invite user flow
   - Implement edit/delete user actions
   - Add confirmation dialogs
   - Test all CRUD operations

### Phase 2: Notification Settings (3-4 hours)

1. **Create Data Layer** (45 min)
   - Create `/src/lib/notification-settings-storage.ts`
   - Define NotificationSettings and NotificationEvent interfaces
   - Implement CRUD functions
   - Set up default settings

2. **Create UI Components** (1.5-2 hours)
   - Add Notification Settings Card to Settings page
   - Create global toggle switches
   - Implement event setting rows with frequency selectors
   - Group events by category
   - Add frequency descriptions

3. **Wire Up Functionality** (45 min - 1 hour)
   - Connect UI to storage layer
   - Implement toggle handlers
   - Implement frequency selector handlers
   - Add save confirmation
   - Test all settings

### Phase 3: Integration & Testing (1-2 hours)

1. **Page Layout**
   - Organize sections: Firm Branding → Firm Details → User Management → Notification Settings
   - Add section separators
   - Ensure responsive design

2. **Testing**
   - Test user creation/deletion
   - Test role changes and permission updates
   - Test notification settings persistence
   - Test form validation
   - Test mobile responsiveness

3. **Polish**
   - Add loading states
   - Add error handling
   - Add success messages
   - Ensure consistent styling

---

## File Structure

```
src/
├── lib/
│   ├── firm-settings-storage.ts          # ✅ Already exists
│   ├── user-management-storage.ts        # ❌ To create
│   └── notification-settings-storage.ts  # ❌ To create
├── components/
│   ├── invite-user-modal.tsx             # ❌ To create
│   ├── permissions-matrix-dialog.tsx     # ❌ To create
│   └── notification-event-row.tsx        # ❌ To create
└── app/
    └── investment-manager/
        └── settings/
            └── page.tsx                   # ✅ Exists, needs expansion
```

---

## Total Effort Estimate

- **User Management**: 4-6 hours
- **Notification Settings**: 3-4 hours
- **Integration & Testing**: 1-2 hours

**Total**: 8-12 hours for complete Settings implementation

---

## Key Decisions

1. **Role-Based Access Control (RBAC)**
   - Use 4 predefined roles (no custom roles in v1)
   - Permissions are derived from role, not individually assigned
   - Future: Consider custom permissions per user

2. **User Invitations**
   - Email-based invitations (no actual email sending in demo)
   - Users start with "pending" status
   - Simulate email with in-app notification or console log

3. **Notification Delivery**
   - Settings stored, but no actual email sending in demo
   - Future: Integrate with email service (SendGrid, AWS SES, etc.)
   - For now, just persist preferences

4. **Data Persistence**
   - Continue using localStorage for consistency
   - User management and notification settings in separate storage keys
   - Future: Migrate to backend database

---

## Notes

- User Management should only be accessible to Admin role users
- Notification Settings accessible to all roles
- Consider adding "Current User" indicator in user list
- Consider preventing Admin from deleting themselves
- Add confirmation dialog for destructive actions (delete user)
- Validate email format in invite modal
- Ensure at least one Admin always exists in the system

---

**End of Breakdown**
