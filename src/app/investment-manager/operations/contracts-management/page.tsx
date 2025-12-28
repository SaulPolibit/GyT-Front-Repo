"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Shield,
  Users,
  Globe,
  Coins,
  Send,
  Lock,
  Key,
  ArrowRightLeft,
} from "lucide-react"
import { toast } from "sonner"
import { getAuthToken } from "@/lib/auth-storage"
import { getApiUrl, API_CONFIG } from "@/lib/api-config"

interface ContractAction {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: "ownership" | "agents" | "users" | "countries" | "tokens" | "allowance"
}

const contractActions: ContractAction[] = [
  {
    id: "check-ownership",
    name: "Check Ownership",
    description: "View the current owner of a smart contract",
    icon: <Shield className="h-4 w-4" />,
    category: "ownership",
  },
  {
    id: "transfer-ownership",
    name: "Transfer Ownership",
    description: "Transfer contract ownership to a new address",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    category: "ownership",
  },
  {
    id: "check-agent",
    name: "Check Agent",
    description: "Verify if an address is registered as an agent",
    icon: <Users className="h-4 w-4" />,
    category: "agents",
  },
  {
    id: "add-agent",
    name: "Add Agent",
    description: "Register a new agent for the contract",
    icon: <Users className="h-4 w-4" />,
    category: "agents",
  },
  {
    id: "remove-agent",
    name: "Remove Agent",
    description: "Remove an agent from the contract",
    icon: <Users className="h-4 w-4" />,
    category: "agents",
  },
  {
    id: "check-user",
    name: "Check User Verification",
    description: "Check if a user identity is verified",
    icon: <CheckCircle2 className="h-4 w-4" />,
    category: "users",
  },
  {
    id: "register-user",
    name: "Register User",
    description: "Register a new user identity",
    icon: <Users className="h-4 w-4" />,
    category: "users",
  },
  {
    id: "remove-user",
    name: "Remove User",
    description: "Delete a user identity from the registry",
    icon: <XCircle className="h-4 w-4" />,
    category: "users",
  },
  {
    id: "check-country",
    name: "Check Country",
    description: "Check if a country is allowed",
    icon: <Globe className="h-4 w-4" />,
    category: "countries",
  },
  {
    id: "add-country",
    name: "Add Country",
    description: "Add a country to the allowed list",
    icon: <Globe className="h-4 w-4" />,
    category: "countries",
  },
  {
    id: "remove-country",
    name: "Remove Country",
    description: "Remove a country from the allowed list",
    icon: <Globe className="h-4 w-4" />,
    category: "countries",
  },
  {
    id: "check-balance",
    name: "Check Token Balance",
    description: "View token balance for an address",
    icon: <Coins className="h-4 w-4" />,
    category: "tokens",
  },
  {
    id: "transfer-tokens",
    name: "Transfer Tokens",
    description: "Transfer tokens from one address to another",
    icon: <Send className="h-4 w-4" />,
    category: "tokens",
  },
  {
    id: "check-allowance",
    name: "Check Allowance",
    description: "View allowance for a spender",
    icon: <Key className="h-4 w-4" />,
    category: "allowance",
  },
  {
    id: "set-allowance",
    name: "Set Allowance",
    description: "Set allowance for a spender to transfer tokens",
    icon: <Lock className="h-4 w-4" />,
    category: "allowance",
  },
]

interface ContractResult {
  error: boolean
  message?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

export default function ContractsManagementPage() {
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<ContractResult | null>(null)

  // Form states
  const [contractAddress, setContractAddress] = React.useState("")
  const [userAddress, setUserAddress] = React.useState("")
  const [agentAddress, setAgentAddress] = React.useState("")
  const [identityAddress, setIdentityAddress] = React.useState("")
  const [complianceAddress, setComplianceAddress] = React.useState("")
  const [newOwnerAddress, setNewOwnerAddress] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [investorType, setInvestorType] = React.useState("0")
  const [addressFrom, setAddressFrom] = React.useState("")
  const [addressTo, setAddressTo] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [ownerAddress, setOwnerAddress] = React.useState("")
  const [spenderAddress, setSpenderAddress] = React.useState("")

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId)
    setResult(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error("Authentication token not found. Please sign in again.")
        setLoading(false)
        return
      }

      let endpoint = ""
      let method = "GET"
      let body: Record<string, unknown> | null = null

      // Configure endpoint based on selected action
      switch (selectedAction) {
        case "check-ownership":
          endpoint = API_CONFIG.endpoints.checkContractOwnership(contractAddress)
          method = "GET"
          break

        case "transfer-ownership":
          endpoint = API_CONFIG.endpoints.transferContractOwnership
          method = "POST"
          body = { contractAddress, newOwnerAddress }
          break

        case "check-agent":
          endpoint = API_CONFIG.endpoints.checkAgent(contractAddress, agentAddress)
          method = "GET"
          break

        case "add-agent":
          endpoint = API_CONFIG.endpoints.registerAgent
          method = "POST"
          body = { contractAddress, userAddress: agentAddress }
          break

        case "remove-agent":
          endpoint = API_CONFIG.endpoints.removeAgent
          method = "DELETE"
          body = { contractAddress, userAddress: agentAddress }
          break

        case "check-user":
          endpoint = API_CONFIG.endpoints.checkUser(identityAddress, userAddress)
          method = "GET"
          break

        case "register-user":
          endpoint = API_CONFIG.endpoints.registerUser
          method = "POST"
          body = { identityAddress, userAddress, country, investorType: parseInt(investorType) }
          break

        case "remove-user":
          endpoint = API_CONFIG.endpoints.removeUser
          method = "DELETE"
          body = { identityAddress, userAddress }
          break

        case "check-country":
          endpoint = API_CONFIG.endpoints.checkCountry(complianceAddress, country)
          method = "GET"
          break

        case "add-country":
          endpoint = API_CONFIG.endpoints.addCountry
          method = "POST"
          body = { complianceAddress, country }
          break

        case "remove-country":
          endpoint = API_CONFIG.endpoints.removeCountry
          method = "DELETE"
          body = { complianceAddress, country }
          break

        case "check-balance":
          endpoint = API_CONFIG.endpoints.getTokenBalance(contractAddress, userAddress)
          method = "GET"
          break

        case "transfer-tokens":
          endpoint = API_CONFIG.endpoints.transferTokens
          method = "POST"
          body = { contractAddress, addressFrom, addressTo, amount: parseFloat(amount) }
          break

        case "check-allowance":
          endpoint = API_CONFIG.endpoints.checkAllowance(contractAddress, ownerAddress, spenderAddress)
          method = "GET"
          break

        case "set-allowance":
          endpoint = API_CONFIG.endpoints.setAllowance
          method = "POST"
          body = { contractAddress, owner: ownerAddress, spender: spenderAddress, amount: parseFloat(amount) }
          break

        default:
          toast.error("Invalid action selected")
          setLoading(false)
          return
      }

      const response = await fetch(getApiUrl(endpoint), {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(body && { body: JSON.stringify(body) }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "Operation failed")
        setResult({ error: true, ...data })
      } else {
        toast.success(data.message || "Operation successful")
        setResult({ error: false, ...data })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      toast.error(errorMessage)
      setResult({ error: true, message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const renderActionForm = () => {
    if (!selectedAction) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select an action from the left to get started
        </div>
      )
    }

    const action = contractActions.find((a) => a.id === selectedAction)

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">{action?.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{action?.description}</p>
        </div>

        {/* Ownership Actions */}
        {selectedAction === "check-ownership" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {selectedAction === "transfer-ownership" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="newOwnerAddress">New Owner Address</Label>
              <Input
                id="newOwnerAddress"
                placeholder="0x..."
                value={newOwnerAddress}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Agent Actions */}
        {(selectedAction === "check-agent" || selectedAction === "add-agent" || selectedAction === "remove-agent") && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="agentAddress">Agent Address</Label>
              <Input
                id="agentAddress"
                placeholder="0x..."
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* User Actions */}
        {selectedAction === "check-user" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="identityAddress">Identity Registry Address</Label>
              <Input
                id="identityAddress"
                placeholder="0x..."
                value={identityAddress}
                onChange={(e) => setIdentityAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="userAddress">User Address</Label>
              <Input
                id="userAddress"
                placeholder="0x..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {selectedAction === "register-user" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="identityAddress">Identity Registry Address</Label>
              <Input
                id="identityAddress"
                placeholder="0x..."
                value={identityAddress}
                onChange={(e) => setIdentityAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="userAddress">User Address</Label>
              <Input
                id="userAddress"
                placeholder="0x..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="mexico"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="investorType">Investor Type</Label>
              <Select value={investorType} onValueChange={setInvestorType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Retail</SelectItem>
                  <SelectItem value="1">Professional</SelectItem>
                  <SelectItem value="2">Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {selectedAction === "remove-user" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="identityAddress">Identity Registry Address</Label>
              <Input
                id="identityAddress"
                placeholder="0x..."
                value={identityAddress}
                onChange={(e) => setIdentityAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="userAddress">User Address</Label>
              <Input
                id="userAddress"
                placeholder="0x..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Country Actions */}
        {(selectedAction === "check-country" || selectedAction === "add-country" || selectedAction === "remove-country") && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="complianceAddress">Compliance Contract Address</Label>
              <Input
                id="complianceAddress"
                placeholder="0x..."
                value={complianceAddress}
                onChange={(e) => setComplianceAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="mexico"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Token Actions */}
        {selectedAction === "check-balance" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Token Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="userAddress">User Address</Label>
              <Input
                id="userAddress"
                placeholder="0x..."
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {selectedAction === "transfer-tokens" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Token Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="addressFrom">From Address</Label>
              <Input
                id="addressFrom"
                placeholder="0x..."
                value={addressFrom}
                onChange={(e) => setAddressFrom(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="addressTo">To Address</Label>
              <Input
                id="addressTo"
                placeholder="0x..."
                value={addressTo}
                onChange={(e) => setAddressTo(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Allowance Actions */}
        {selectedAction === "check-allowance" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Token Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ownerAddress">Owner Address</Label>
              <Input
                id="ownerAddress"
                placeholder="0x..."
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="spenderAddress">Spender Address</Label>
              <Input
                id="spenderAddress"
                placeholder="0x..."
                value={spenderAddress}
                onChange={(e) => setSpenderAddress(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {selectedAction === "set-allowance" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="contractAddress">Token Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ownerAddress">Owner Address</Label>
              <Input
                id="ownerAddress"
                placeholder="0x..."
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="spenderAddress">Spender Address</Label>
              <Input
                id="spenderAddress"
                placeholder="0x..."
                value={spenderAddress}
                onChange={(e) => setSpenderAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Processing..." : "Execute"}
        </Button>
      </form>
    )
  }

  const renderResult = () => {
    if (!result) return null

    return (
      <Card className={result.error ? "border-destructive" : "border-green-500"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.error ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {result.error ? "Operation Failed" : "Operation Successful"}
          </CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent>
          {result.data && (
            <div className="space-y-2">
              {Object.entries(result.data).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono break-all max-w-md text-right">
                      {typeof value === 'boolean' ? (
                        <Badge variant={value ? "default" : "secondary"}>
                          {value ? "Yes" : "No"}
                        </Badge>
                      ) : (
                        String(value)
                      )}
                    </span>
                    {typeof value === 'string' && value.startsWith('0x') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(String(value))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "12rem",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/investment-manager">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Operations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Contracts Management</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contracts Management</h1>
              <p className="text-muted-foreground">
                Manage smart contract operations and blockchain interactions
              </p>
            </div>
          </div>

          <Tabs defaultValue="ownership" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="countries">Countries</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="allowance">Allowance</TabsTrigger>
            </TabsList>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Select an operation to perform</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <TabsContent value="ownership" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "ownership")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>

                    <TabsContent value="agents" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "agents")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>

                    <TabsContent value="users" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "users")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>

                    <TabsContent value="countries" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "countries")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>

                    <TabsContent value="tokens" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "tokens")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>

                    <TabsContent value="allowance" className="mt-0 space-y-2">
                      {contractActions
                        .filter((action) => action.category === "allowance")
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedAction === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action.id)}
                          >
                            {action.icon}
                            <span className="ml-2">{action.name}</span>
                          </Button>
                        ))}
                    </TabsContent>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Operation Details</CardTitle>
                    <CardDescription>
                      Fill in the required information for the selected operation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderActionForm()}</CardContent>
                </Card>

                {renderResult()}
              </div>
            </div>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
