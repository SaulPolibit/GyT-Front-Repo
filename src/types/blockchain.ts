// Blockchain and Smart Contract Types

export interface BlockchainResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface TransactionReceipt {
  transactionHash: string
  blockNumber: string
  gasUsed: string
  network: string
}

// Ownership Types
export interface ContractOwnership {
  contractAddress: string
  ownerAddress: string
  network: string
}

export interface TransferOwnershipRequest {
  contractAddress: string
  newOwnerAddress: string
}

export interface TransferOwnershipResponse extends TransactionReceipt {
  contractAddress: string
  previousOwner: string
  newOwner: string
}

// Agent Types
export interface AgentStatus {
  contractAddress: string
  agentAddress: string
  isAgent: boolean
  network: string
}

export interface RegisterAgentRequest {
  contractAddress: string
  userAddress: string
}

export interface AgentOperationResponse extends TransactionReceipt {
  contractAddress: string
  agentAddress: string
}

// User Identity Types
export interface UserVerificationStatus {
  identityAddress: string
  userAddress: string
  isVerified: boolean
  status: 'verified' | 'not_verified'
  network: string
}

export interface RegisterUserRequest {
  identityAddress: string
  userAddress: string
  country: string
  investorType: number // 0: retail, 1: professional, 2: institutional
}

export interface UserOperationResponse extends TransactionReceipt {
  identityAddress: string
  userAddress: string
  country?: string
  countryCode?: number
  investorType?: number
}

// Country Compliance Types
export interface CountryStatus {
  complianceAddress: string
  country: string
  countryCode: number
  isAllowed: boolean
  status: 'allowed' | 'not_allowed'
  network: string
}

export interface CountryOperationRequest {
  complianceAddress: string
  country: string
}

export interface CountryOperationResponse extends TransactionReceipt {
  complianceAddress: string
  country: string
  countryCode: number
}

// Token Types
export interface TokenBalance {
  contractAddress: string
  userAddress: string
  balance: string
  balanceFormatted: string
  network: string
}

export interface TransferTokensRequest {
  contractAddress: string
  addressFrom: string
  addressTo: string
  amount: number
}

export interface TransferTokensResponse extends TransactionReceipt {
  contractAddress: string
  from: string
  to: string
  amount: string
}

export interface MintTokensRequest {
  contractAddress: string
  userAddress: string
  amount: number
}

export interface MintTokensResponse extends TransactionReceipt {
  contractAddress: string
  userAddress: string
  amount: string
  mintTransactionHash?: string
}

export interface BatchTransferRequest {
  contractAddress: string
  addressList: string[]
  amountsList: number[]
}

export interface BatchTransferResponse extends TransactionReceipt {
  contractAddress: string
  recipientCount: number
  recipients: string[]
  amountsList: string[]
}

// Allowance Types
export interface AllowanceStatus {
  contractAddress: string
  owner: string
  spender: string
  allowance: string
  network: string
}

export interface SetAllowanceRequest {
  contractAddress: string
  owner: string
  spender: string
  amount: number
}

export interface SetAllowanceResponse extends TransactionReceipt {
  contractAddress: string
  owner: string
  spender: string
  amount: string
}

// Token Holders Types
export interface TokenHoldersResponse {
  contractAddress: string
  tokenHolders: string[]
  totalHolders: number
  network: string
}

// Total Supply Types
export interface TotalSupplyResponse {
  contractAddress: string
  totalSupply: string
  network: string
}

// Contract Call Types
export interface ContractCallRequest {
  contractAddress: string
  abi: any[]
  functionName: string
  params?: any[]
}

export interface ContractCallResponse {
  contractAddress: string
  functionName: string
  params: any[]
  result: any
}

// Investor Types (enum matching backend)
export enum InvestorType {
  RETAIL = 0,
  PROFESSIONAL = 1,
  INSTITUTIONAL = 2,
}

// Country codes mapping type
export type CountryCode = {
  [key: string]: number
}

// Error response type
export interface BlockchainError {
  success: false
  error: string
  message: string
  details?: any
}

// Union type for API responses
export type BlockchainApiResponse<T> = BlockchainResponse<T> | BlockchainError

// Smart Contract Deployment Types
export interface DeployERC3643Request {
  structureId?: string
  contractTokenName: string
  contractTokenSymbol: string
  contractTokenValue: number
  contractMaxTokens: number
  company: string
  currency: string
  projectName: string
  network?: string
  operatingAgreementHash?: string
}

export interface DeployERC3643Response {
  success: boolean
  message: string
  contractType: string
  contractId: string
  data: any
}

// Contract Balance Types
export interface ContractBalanceResponse {
  address: string
  balanceWei: string
  balanceEther: string
  network: string
}
