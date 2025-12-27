"use client"

import * as React from "react"
import { use } from "react"
import { useSearchParams } from "next/navigation"

// MetaMask types
declare global {
  interface Window {
    ethereum?: any
  }
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  AlertCircle,
  Check,
  CreditCard,
  Lock,
  Coins,
  Wallet,
  Upload,
  File,
  Loader2,
} from "lucide-react"
import type { Structure } from "@/lib/structures-storage"
import { useToast } from "@/hooks/use-toast"
import { API_CONFIG, getApiUrl } from "@/lib/api-config"
import { getAuthToken, getCurrentUser } from "@/lib/auth-storage"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { getNotificationSettings } from "@/lib/notification-settings-storage"
import { sendPaymentCreatedNotificationEmail } from "@/lib/email-service"

interface Props {
  params: Promise<{ structureId: string }>
}

export default function PaymentPage({ params }: Props) {
  const { structureId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [structure, setStructure] = React.useState<Structure | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardName, setCardName] = React.useState("")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCVC, setCardCVC] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [paymentComplete, setPaymentComplete] = React.useState(false)
  const [bankTransferReceipt, setBankTransferReceipt] = React.useState<File | null>(null)
  const [usdcWalletAddress, setUsdcWalletAddress] = React.useState("")
  const [receiptFileName, setReceiptFileName] = React.useState("")
  const [isConnectingMetaMask, setIsConnectingMetaMask] = React.useState(false)
  const [isMetaMaskConnected, setIsMetaMaskConnected] = React.useState(false)
  const [submissionId, setSubmissionId] = React.useState<string | null>(null)
  const [transactionHash, setTransactionHash] = React.useState<string | null>(null)

  const tokens = searchParams.get("tokens") || "0"
  const email = searchParams.get("email") || "investor@demo.polibit.io"
  const amount = searchParams.get("amount") || null

  // Testing mode: Use POL (native token) instead of USDC for testing
  // Set to false for production (USDC mode)
  const USE_NATIVE_TOKEN_FOR_TESTING = false

  // Check if USDC payment is enabled based on structure blockchain configuration and user wallet
  const isMetamaskPaymentEnabled = structure?.blockchainNetwork &&
                                   structure.blockchainNetwork.trim() !== '' &&
                                   structure?.walletAddress &&
                                   structure.walletAddress.trim() !== '' &&
                                   user?.walletAddress &&
                                   user.walletAddress.trim() !== ''

  // Check if token is deployed
  const tokenAddress = structure?.smartContract?.contractAddress
  const identityRegistryAddress = structure?.smartContract?.identityRegistryAddress
  const isTokenDeployed = tokenAddress && tokenAddress.trim() !== ''

  // Check if bank transfer is enabled based on structure bank configuration
  const isBankTransferEnabled = (structure?.localBankName && structure.localBankName.trim() !== '') ||
                                 (structure?.internationalBankName && structure.internationalBankName.trim() !== '')

  React.useEffect(() => {
    const fetchStructure = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = getAuthToken()

        if (!token) {
          console.log("No auth token found, logging out...")
          logout()
          router.push('/lp-portal/login')
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.getSingleStructure(structureId)), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        // Check for invalid or expired token error
        if (data.error === "Invalid or expired token" || data.message === "Please provide a valid authentication token") {
          console.log("Token invalid or expired, logging out...")
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch structure')
        }

        console.log('[Payment] API Response:', data)

        // Map API fields to existing structure format
        const mappedStructure = {
          ...data.data,
          currency: data.data.baseCurrency,
          jurisdiction: data.data.taxJurisdiction,
          fundTerm: data.data.finalDate,
          blockchainNetwork: data.data.blockchainNetwork,
          walletAddress: data.data.walletAddress,
        }

        setStructure(mappedStructure)
      } catch (err) {
        console.error('[Payment] Error fetching structure:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch structure')
        setStructure(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStructure()
  }, [structureId])

  // Fetch submission ID from verifyUserSignature endpoint
  React.useEffect(() => {
    const fetchSubmissionId = async () => {
      try {
        const token = getAuthToken()

        if (!token) {
          console.log("[Payment] No auth token found")
          return
        }

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.verifyUserSignature), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        // Handle 401 Unauthorized - session expired or invalid
        if (response.status === 401) {
          console.log('[Payment Signature Verify] 401 Unauthorized - clearing session and redirecting to login')
          logout()
          router.push('/lp-portal/login')
          return
        }

        const data = await response.json()

        // Check for invalid or expired token error
        if (data.error === "Invalid or expired token" || data.message === "Please provide a valid authentication token") {
          console.log("[Payment] Token invalid or expired")
          return
        }

        console.log('[Payment] Verify signature response:', data)

        // Extract first submission ID from availableSubmissions
        if (data.availableSubmissions && data.availableSubmissions.length > 0) {
          const firstSubmission = data.availableSubmissions[0]
          setSubmissionId(firstSubmission.id)
          console.log('[Payment] Submission ID saved:', firstSubmission.id)
        }
      } catch (error) {
        console.error('[Payment] Error fetching submission ID:', error)
      }
    }

    fetchSubmissionId()
  }, [])

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseInt(value) : value
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const isFormValid = () => {
    // Check if user has walletAddress for blockchain operations
    if (!user?.walletAddress) {
      return false
    }

    if (paymentMethod === "credit-card") {
      return cardNumber.length >= 13 && cardName.length > 0 && cardExpiry.length === 5 && cardCVC.length === 3
    }
    if (paymentMethod === "usdc") {
      return usdcWalletAddress.length > 0
    }
    if (paymentMethod === "bank-transfer") {
      return bankTransferReceipt !== null
    }
    return false
  }

  const handlePayment = async () => {
    if (!isFormValid() || !structure) return

    // Validate amount is not null
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount is required and must be greater than zero",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Handle USDC/POL payment via MetaMask
      if (paymentMethod === "usdc" && isMetaMaskConnected) {
        console.log(`[Payment] Processing ${USE_NATIVE_TOKEN_FOR_TESTING ? 'POL (native)' : 'USDC'} payment via MetaMask`)

        if (typeof window.ethereum === 'undefined') {
          throw new Error('MetaMask is not installed')
        }

        // Validate network is Polygon Mainnet for production wallet payments
        const network = structure.blockchainNetwork || 'Polygon'
        console.log('[Payment] Structure blockchain network:', structure.blockchainNetwork)
        console.log('[Payment] Using network:', network)

        // Ensure production network (Polygon Mainnet) is used, not testnet (Amoy)
        if (network.toLowerCase().includes('amoy')) {
          throw new Error('Testnet (Amoy) is not supported for payments. Please use Polygon Mainnet.')
        }

        // Default to Polygon Mainnet if not specified
        const productionNetwork = network === 'Polygon' || network === 'Polygon PoS' ? network : 'Polygon'
        console.log('[Payment] Production network validated:', productionNetwork)

        if (!structure.walletAddress) {
          throw new Error('Destination wallet address not configured')
        }

        // Switch to the correct network before sending transaction
        try {
          console.log('[Payment] Attempting to switch to network:', productionNetwork)
          await switchNetwork(productionNetwork)
          console.log(`[Payment] Successfully switched to ${productionNetwork} network`)
        } catch (networkError) {
          console.error('[Payment] Network switch error:', networkError)
          throw new Error(`Failed to switch to ${productionNetwork} network. Please switch manually in MetaMask.`)
        }

        let txHash: string

        if (USE_NATIVE_TOKEN_FOR_TESTING) {
          // Native token (POL/MATIC) transfer for testing
          console.log('[Payment] Using native token (POL) for testing')

          // Convert amount to wei (18 decimals for native tokens) using BigInt
          const amountStr = String(amount)
          const amountFloat = parseFloat(amountStr)
          const amountInWei = BigInt(Math.floor(amountFloat * 1e18))
          const hexValue = '0x' + amountInWei.toString(16)

          console.log('[Payment] Native token transaction details:', {
            network: productionNetwork,
            to: structure.walletAddress,
            from: usdcWalletAddress,
            amount: amount,
            amountInWei: hexValue,
          })

          try {
            // Send native token transaction
            txHash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [{
                from: usdcWalletAddress,
                to: structure.walletAddress,
                value: hexValue,
              }],
            })
          } catch (txError: any) {
            console.error('[Payment] Native token transaction error:', txError)
            console.error('[Payment] Error details:', {
              code: txError?.code,
              message: txError?.message,
              data: txError?.data,
              stack: txError?.stack
            })

            // Handle specific error cases
            if (txError?.code === 4001) {
              throw new Error('Transaction rejected by user')
            }

            // Insufficient funds or gas estimation error
            if (txError?.code === -32603 || txError?.code === -32000 || txError?.message?.includes('insufficient funds')) {
              const networkName = structure.blockchainNetwork || 'Amoy'
              const faucetUrl = networkName.toLowerCase().includes('amoy')
                ? 'https://faucet.polygon.technology/'
                : 'https://faucet.polygon.technology/'

              throw new Error(
                `MetaMask transaction failed. Please check your wallet and try again.`
              )
            }

            throw new Error(txError?.message || 'MetaMask transaction failed. Please check your wallet and try again.')
          }
        } else {
          // USDC (ERC20) transfer for production
          console.log('[Payment] Using USDC (ERC20) for production')

          // USDC Token Contract Addresses by Network
          const USDC_ADDRESSES: Record<string, string> = {
            'Polygon': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            'Polygon PoS': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            'Polygon Amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
            'Amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
          }

          const usdcContractAddress = USDC_ADDRESSES[productionNetwork]

          if (!usdcContractAddress) {
            throw new Error(`USDC contract address not found for network: ${productionNetwork}`)
          }

          // Convert amount to USDC units (6 decimals for USDC) using BigInt
          const amountStr = String(amount)
          const amountFloat = parseFloat(amountStr)
          const amountInUSDC = BigInt(Math.floor(amountFloat * 1e6))
          const usdcHex = amountInUSDC.toString(16)

          // ERC20 Transfer function signature
          const transferMethodId = '0xa9059cbb' // transfer(address,uint256)

          // Encode destination address (remove 0x and pad to 32 bytes)
          const toAddress = structure.walletAddress.replace('0x', '').padStart(64, '0')

          // Encode amount (pad to 32 bytes)
          const transferAmount = usdcHex.padStart(64, '0')

          // Construct transaction data
          const data = transferMethodId + toAddress + transferAmount

          console.log('[Payment] USDC transaction details:', {
            network: productionNetwork,
            usdcContract: usdcContractAddress,
            to: structure.walletAddress,
            amount: amount,
            from: usdcWalletAddress
          })

          try {
            // Send USDC transaction
            txHash = await window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [{
                from: usdcWalletAddress,
                to: usdcContractAddress,
                data: data,
                value: '0x0', // No ETH/MATIC sent, only USDC token
              }],
            })
          } catch (txError: any) {
            console.error('[Payment] USDC transaction error:', txError)
            throw txError
          }
        }

        try {

          console.log('[Payment] Transaction sent! Hash:', txHash)
          setTransactionHash(txHash)

          toast({
            title: "Transaction Submitted",
            description: `Waiting for confirmation... Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
            variant: "default",
          })

          // Check transaction status on blockchain
          const txStatus = await checkTransactionStatus(txHash, productionNetwork)

          if (!txStatus.success) {
            throw new Error(txStatus.error || 'Transaction failed on blockchain')
          }

          console.log('[Payment] Transaction confirmed on blockchain:', txStatus.explorerUrl)

          toast({
            title: "Transaction Confirmed",
            description: "Payment successful on blockchain!",
            variant: "default",
          })

          // Register user and mint tokens before creating payment record
          const token = getAuthToken()

          if (!token) {
            console.warn('[Payment] No auth token found, skipping payment operations')
          } else {
            let mintTransactionHash: string | null = null

            // Step 1: Register user on identity registry
            try {
              if (!identityRegistryAddress) {
                console.warn('[Payment] No identity registry address found, skipping user registration')
              } else if (!user?.walletAddress) {
                console.warn('[Payment] No wallet address found in user data, skipping user registration')
              } else {
                console.log('[Payment] Registering user on identity registry:', {
                  identityRegistryAddress: identityRegistryAddress,
                  userAddress: user.walletAddress,
                  country: "Mexico",
                  investorType: 0
                })

                const registerResponse = await fetch(getApiUrl('/api/blockchain/contract/register-user'), {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    identityAddress: identityRegistryAddress,
                    userAddress: user.walletAddress,
                    country: "Mexico",
                    investorType: 0
                  }),
                })

                // Handle 401 Unauthorized - session expired or invalid
                if (registerResponse.status === 401) {
                  console.log('[Payment Register User] 401 Unauthorized - clearing session and redirecting to login')
                  logout()
                  router.push('/lp-portal/login')
                  return
                }

                const registerData = await registerResponse.json()

                if (registerData.error === "Invalid or expired token" || registerData.message === "Please provide a valid authentication token") {
                  console.log("Token invalid or expired during user registration")
                  logout()
                  router.push('/lp-portal/login')
                  return
                } else if (!registerData.success) {
                  console.warn('[Payment] Failed to register user:', registerData.message)
                } else {
                  console.log('[Payment] User registered successfully:', registerData)
                }
              }
            } catch (registerError) {
              console.error('[Payment] Error registering user:', registerError)
              // Don't fail the payment if registration fails
            }

            // Step 2: Mint tokens and capture transaction hash
            try {
              if (!tokenAddress) {
                console.warn('[Payment] No token address found, skipping mint')
              } else if (!user?.walletAddress) {
                console.warn('[Payment] No wallet address found in user data, skipping token mint')
              } else {
                console.log('[Payment] Minting tokens:', {
                  contractAddress: tokenAddress,
                  userAddress: user.walletAddress,
                  amount: tokens
                })

                const mintResponse = await fetch(getApiUrl('/api/blockchain/contract/mint-tokens'), {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    contractAddress: tokenAddress,
                    userAddress: user.walletAddress,
                    amount: tokens
                  }),
                })

                // Handle 401 Unauthorized - session expired or invalid
                if (mintResponse.status === 401) {
                  console.log('[Payment Mint Tokens] 401 Unauthorized - clearing session and redirecting to login')
                  logout()
                  router.push('/lp-portal/login')
                  return
                }

                const mintData = await mintResponse.json()

                if (mintData.error === "Invalid or expired token" || mintData.message === "Please provide a valid authentication token") {
                  console.log("Token invalid or expired during token mint")
                  logout()
                  router.push('/lp-portal/login')
                  return
                } else if (!mintData.success) {
                  console.warn('[Payment] Failed to mint tokens:', mintData.message)
                } else {
                  console.log('[Payment] Tokens minted successfully:', mintData)
                  // Capture mint transaction hash from response
                  if (mintData.mintTransactionHash) {
                    mintTransactionHash = mintData.mintTransactionHash
                    console.log('[Payment] Mint transaction hash:', mintTransactionHash)
                  }
                }
              }
            } catch (mintError) {
              console.error('[Payment] Error minting tokens:', mintError)
              // Don't fail the payment if minting fails - continue to create payment record
            }

            // Step 3: Create payment record with both transaction hashes
            try {
              const formData = new FormData()
              formData.append('amount', String(amount))
              formData.append('tokens', String(tokens))
              formData.append('structureId', structureId)
              formData.append('email', user?.email || email)
              formData.append('contractId', 'dummy-contract-id')
              formData.append('submissionId', submissionId ?? '')
              formData.append('paymentMethod', paymentMethod)
              formData.append('paymentTransactionHash', txHash)
              if (mintTransactionHash) {
                formData.append('mintTransactionHash', mintTransactionHash)
              }
              formData.append('status', 'approved')
              formData.append('walletAddress', usdcWalletAddress)

              console.log('[Payment] Creating payment record via API')

              const response = await fetch(getApiUrl(API_CONFIG.endpoints.createPayment), {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: formData,
              })

              // Handle 401 Unauthorized - session expired or invalid
              if (response.status === 401) {
                console.log('[Payment Create Record] 401 Unauthorized - clearing session and redirecting to login')
                logout()
                router.push('/lp-portal/login')
                return
              }

              const data = await response.json()

              if (data.error === "Invalid or expired token" || data.message === "Please provide a valid authentication token") {
                console.log("Token invalid or expired during payment record creation")
                logout()
                router.push('/lp-portal/login')
                return
              } else if (!data.success) {
                console.warn('[Payment] Failed to create payment record:', data.message)
              } else {
                console.log('[Payment] Payment record created successfully:', data)

                // Send email notification if paymentConfirmations is enabled
                const notificationSettings = getNotificationSettings()
                const currentUser = getCurrentUser()

                if (currentUser?.id && currentUser?.email && notificationSettings.paymentConfirmations) {
                  try {
                    const currentDate = new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    await sendPaymentCreatedNotificationEmail(
                      currentUser.id,
                      currentUser.email,
                      {
                        investorName: user?.firstName || currentUser.email,
                        paymentAmount: amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        paymentCurrency: 'USDC',
                        paymentMethod: 'Cryptocurrency (MetaMask)',
                        paymentDate: currentDate,
                        paymentReference: data.data?.id || `PAY-${Date.now()}`,
                        structureName: structure?.name || 'N/A',
                        fundManagerName: 'Polibit Team',
                        fundManagerEmail: 'support@polibit.com',
                        additionalDetails: `Mint Hash: ${mintTransactionHash}\nPayment Transaction Hash: ${txHash}\nYour payment is being processed and will be reviewed by our team.`
                      }
                    )
                    console.log('[Payment] Payment confirmation email sent successfully')
                  } catch (emailError) {
                    console.error('[Payment] Error sending payment confirmation email:', emailError)
                    // Don't fail payment if email fails
                  }
                }
              }

            } catch (apiError) {
              console.error('[Payment] Error creating payment record:', apiError)
              // Don't fail the payment if API record creation fails
            }
          }

        } catch (txError: any) {
          console.error('[Payment] MetaMask transaction error:', txError)

          // User rejected the transaction
          if (txError.code === 4001) {
            throw new Error('Transaction rejected by user')
          }

          // Insufficient funds
          if (txError.code === -32000) {
            throw new Error('Insufficient USDC balance or gas fees')
          }

          throw new Error(txError.message || 'MetaMask transaction failed')
        }
      }
      // Handle bank transfer payment via API
      else if (paymentMethod === "bank-transfer" && bankTransferReceipt) {
        const token = getAuthToken()

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }

        if (!submissionId) {
          throw new Error('Submission ID not found. Please refresh the page and try again.')
        }

        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', bankTransferReceipt)
        formData.append('amount', String(amount))
        formData.append('structureId', structureId)
        formData.append('email', user?.email || email)
        formData.append('contractId', 'dummy-contract-id') // Dummy data as contract model doesn't exist yet
        formData.append('submissionId', submissionId)
        formData.append('tokens', String(tokens))
        formData.append('paymentMethod', paymentMethod)
        formData.append('status', 'pending')

        console.log('[Payment] Creating payment with bank transfer receipt')

        const response = await fetch(getApiUrl(API_CONFIG.endpoints.createPayment), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        // Handle 401 Unauthorized - session expired or invalid
        if (response.status === 401) {
          console.log('[Payment Bank Transfer] 401 Unauthorized - clearing session and redirecting to login')
          logout()
          router.push('/lp-portal/login')
          return
        }

        const data = await response.json()

        // Check for invalid or expired token error
        if (data.error === "Invalid or expired token" || data.message === "Please provide a valid authentication token") {
          console.log("Token invalid or expired, logging out...")
          logout()
          router.push('/lp-portal/login')
          return
        }

        if (!data.success) {
          throw new Error(data.message || 'Payment creation failed')
        }

        console.log('[Payment] Payment created successfully:', data)

        // Show bank transfer specific success toast
        toast({
          title: "Bank Transfer Receipt Uploaded!",
          description: "Your payment will be reviewed by an admin and confirmed if everything looks good. You'll be notified once approved.",
          variant: "default",
        })

        // Redirect to portfolio after a short delay
        setTimeout(() => {
          window.location.href = `/lp-portal/portfolio`
        }, 2500)
      } else {
        // Simulate payment processing for other methods
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      setPaymentComplete(true)

      // Show success toast for non-bank transfer payments
      if (paymentMethod !== "bank-transfer") {
        toast({
          title: "Payment Successful!",
          description: `You've successfully invested ${tokens} tokens for ${formatCurrency(amount)} in ${structure.name}. The fund has been added to your portfolio.`,
          variant: "default",
        })
      }

      console.log('✅ Payment successful')

      // Redirect to portfolio after a short delay
      setTimeout(() => {
        window.location.href = `/lp-portal/portfolio`
      }, 1500)
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const formatted = cleaned.replace(/(\d{4})/g, "$1 ").trim()
    return formatted.slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  // Network configurations for MetaMask
  const NETWORK_CONFIGS: Record<string, { chainId: string; chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls: string[] }> = {
    'Polygon': {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/']
    },
    'Polygon PoS': {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/']
    },
    'Polygon Amoy': {
      chainId: '0x13882',
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/']
    },
    'Amoy': {
      chainId: '0x13882',
      chainName: 'Polygon Amoy Testnet',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/']
    },
  }

  const switchNetwork = async (networkName: string) => {
    const networkConfig = NETWORK_CONFIGS[networkName]
    console.log(`[Payment] networkName: ${networkName}`)
    console.log(`[Payment] networkConfig: ${networkConfig}`)

    if (!networkConfig) {
      console.error(`[Payment] Network config not found for: ${networkName}`)
      console.error('[Payment] Available networks:', Object.keys(NETWORK_CONFIGS))
      throw new Error(`Network configuration not found for: ${networkName}`)
    }

    console.log(`[Payment] Network config found:`, {
      name: networkName,
      chainId: networkConfig.chainId,
      chainName: networkConfig.chainName
    })

    try {
      // Check current network
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('[Payment] Current MetaMask chainId:', currentChainId)
      console.log('[Payment] Target chainId:', networkConfig.chainId)

      if (currentChainId === networkConfig.chainId) {
        console.log('[Payment] Already on correct network')
        return
      }

      console.log('[Payment] Switching to chainId:', networkConfig.chainId)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      })
      console.log('[Payment] Network switch successful')
    } catch (switchError: any) {
      console.error('[Payment] Network switch error:', switchError)
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('[Payment] Network not found in MetaMask, adding it...')
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig]
        })
        console.log('[Payment] Network added successfully')
      } else {
        throw switchError
      }
    }
  }

  const checkTransactionStatus = async (txHash: string, network: string, maxAttempts = 30) => {
    console.log(`[Payment] Checking transaction status for ${txHash}`)

    const networkConfig = NETWORK_CONFIGS[network]
    const explorerUrl = networkConfig?.blockExplorerUrls?.[0] || 'https://polygonscan.com/'

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        })

        if (receipt) {
          console.log('[Payment] Transaction receipt:', receipt)

          // Check if transaction succeeded (status: 1) or failed (status: 0)
          if (receipt.status === '0x1') {
            console.log('[Payment] Transaction succeeded!')
            return {
              success: true,
              explorerUrl: `${explorerUrl}tx/${txHash}`
            }
          } else if (receipt.status === '0x0') {
            console.log('[Payment] Transaction failed on-chain')
            return {
              success: false,
              explorerUrl: `${explorerUrl}tx/${txHash}`,
              error: 'Transaction failed on blockchain. Please check the transaction on the block explorer.'
            }
          }
        }

        // Wait 2 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error('[Payment] Error checking transaction status:', error)
      }
    }

    // If we exceeded max attempts without getting a receipt
    throw new Error('Transaction confirmation timeout. Please check the block explorer manually.')
  }

  const connectMetaMask = async () => {
    setIsConnectingMetaMask(true)
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask extension to connect your wallet.",
          variant: "destructive",
        })
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        setUsdcWalletAddress(address)
        setIsMetaMaskConnected(true)

        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
          variant: "default",
        })

        // Try to switch to the structure's blockchain network
        if (structure?.blockchainNetwork) {
          try {
            await switchNetwork(structure.blockchainNetwork)
            toast({
              title: "Network Switched",
              description: `Switched to ${structure.blockchainNetwork}`,
              variant: "default",
            })
          } catch (switchError) {
            console.error('Error switching network:', switchError)
            toast({
              title: "Network Switch Failed",
              description: "Please manually switch to the correct network in MetaMask",
              variant: "destructive",
            })
          }
        }
      }
    } catch (error) {
      console.error('MetaMask connection error:', error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnectingMetaMask(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href={`/lp-portal/marketplace/${structureId}/contracts`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </a>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!structure) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" asChild>
          <a href="/lp-portal/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </a>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-semibold mb-2">
              {error ? 'Error loading structure' : 'Structure not found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {error || 'The structure you are looking for could not be found.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <a href={`/lp-portal/marketplace/${structureId}/contracts`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contract Signing
        </a>
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fund Structure</p>
                <p className="font-semibold text-sm">{structure.name}</p>
                <Badge variant="outline" className="mt-2">
                  {structure.type}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tokens ({tokens})</span>
                  <span className="font-semibold">${(Number(amount)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Fee</span>
                  <span className="font-semibold">$0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(amount)}</span>
                </div>
              </div>
              {paymentComplete && (
                <div className="flex items-center gap-2 text-green-600 pt-2">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-semibold">Payment Complete</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how you'd like to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-not-allowed opacity-50 bg-muted/20 transition-colors">
                  <input
                    type="radio"
                    value="credit-card"
                    checked={paymentMethod === "credit-card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    disabled
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Credit or Debit Card</p>
                        <p className="text-xs text-muted-foreground">Currently unavailable</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                    isMetamaskPaymentEnabled
                      ? 'cursor-pointer hover:bg-muted/50'
                      : 'cursor-not-allowed opacity-50 bg-muted/20'
                  }`}
                  style={{
                    borderColor: paymentMethod === "usdc" && isMetamaskPaymentEnabled ? "oklch(0.2521 0.1319 280.76)" : undefined,
                    backgroundColor: paymentMethod === "usdc" && isMetamaskPaymentEnabled ? "oklch(0.2521 0.1319 280.76 / 0.05)" : undefined
                  }}
                >
                  <input
                    type="radio"
                    value="usdc"
                    checked={paymentMethod === "usdc"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    disabled={!isMetamaskPaymentEnabled}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {USE_NATIVE_TOKEN_FOR_TESTING ? 'POL - Native Token (Testing)' : 'USDC - Stablecoin'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isMetamaskPaymentEnabled
                            ? (USE_NATIVE_TOKEN_FOR_TESTING ? 'Pay with POL on blockchain' : 'Pay with USDC on blockchain')
                            : (!user?.walletAddress || user.walletAddress.trim() === ''
                                ? 'User wallet address required'
                                : 'Not configured - blockchain network or wallet address missing')
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                    isBankTransferEnabled
                      ? 'cursor-pointer hover:bg-muted/50'
                      : 'cursor-not-allowed opacity-50 bg-muted/20'
                  }`}
                  style={{
                    borderColor: paymentMethod === "bank-transfer" && isBankTransferEnabled ? "oklch(0.2521 0.1319 280.76)" : undefined,
                    backgroundColor: paymentMethod === "bank-transfer" && isBankTransferEnabled ? "oklch(0.2521 0.1319 280.76 / 0.05)" : undefined
                  }}
                >
                  <input
                    type="radio"
                    value="bank-transfer"
                    checked={paymentMethod === "bank-transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4"
                    disabled={!isBankTransferEnabled}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">
                          {isBankTransferEnabled
                            ? 'Upload receipt after transfer'
                            : 'Not configured - bank details missing'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Card Details Form */}
          {paymentMethod === "credit-card" && (
            <Card>
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
                <CardDescription>Enter your card information securely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="card-name">Cardholder Name</Label>
                  <Input
                    id="card-name"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground">No actual charges will be made in demo mode</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-expiry">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      placeholder="123"
                      type="password"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Your card information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* USDC Wallet Address Form */}
          {paymentMethod === "usdc" && (
            <Card>
              <CardHeader>
                <CardTitle>{USE_NATIVE_TOKEN_FOR_TESTING ? 'POL Payment Details' : 'USDC Payment Details'}</CardTitle>
                <CardDescription>Connect your wallet or enter your address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Structure Blockchain Information */}
                {isMetamaskPaymentEnabled && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Payment Destination</p>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div>
                        <span className="font-semibold">Network:</span> {structure?.blockchainNetwork}
                      </div>
                      <div>
                        <span className="font-semibold">Wallet Address:</span>
                        <p className="font-mono text-xs mt-1 break-all">{structure?.walletAddress}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MetaMask Connect Button */}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant={isMetaMaskConnected ? "outline" : "default"}
                    onClick={connectMetaMask}
                    disabled={isConnectingMetaMask || isMetaMaskConnected}
                    className="w-full sm:w-auto"
                  >
                    {isConnectingMetaMask ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : isMetaMaskConnected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        MetaMask Connected
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect MetaMask
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Your Wallet Address (Polygon)</Label>
                  {usdcWalletAddress ? (
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="font-mono text-sm break-all">{usdcWalletAddress}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                      <p className="text-sm text-muted-foreground">Connect your wallet to see address</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {isMetaMaskConnected
                      ? "Your connected wallet address"
                      : "Connect your wallet to automatically populate your address"}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Send Payment</p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Amount:</strong> {amount} USDC</p>
                    <p><strong>Network:</strong> Polygon</p>
                    <p className="text-xs">Use the wallet address you provided above as recipient.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Blockchain transactions are immutable and secure</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Transfer Receipt Upload */}
          {paymentMethod === "bank-transfer" && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Receipt</CardTitle>
                <CardDescription>Upload a screenshot or PDF of your bank transfer receipt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Local Bank Details */}
                  {structure.localBankName && structure.localBankName.trim() !== '' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Local Bank Transfer Details</p>
                      <div className="space-y-1 text-sm text-amber-800">
                        <p><strong>Bank Name:</strong> {structure.localBankName}</p>
                        {structure.localAccountHolder && <p><strong>Account Holder:</strong> {structure.localAccountHolder}</p>}
                        {structure.localAccountBank && <p><strong>Account Number:</strong> {structure.localAccountBank}</p>}
                        {structure.localRoutingBank && <p><strong>Routing Number:</strong> {structure.localRoutingBank}</p>}
                        {structure.localBankAddress && <p><strong>Bank Address:</strong> {structure.localBankAddress}</p>}
                        <p><strong>Amount:</strong> ${amount}</p>
                      </div>
                    </div>
                  )}

                  {/* International Bank Details */}
                  {structure.internationalBankName && structure.internationalBankName.trim() !== '' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">International Bank Transfer Details</p>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>Bank Name:</strong> {structure.internationalBankName}</p>
                        {structure.internationalHolderName && <p><strong>Account Holder:</strong> {structure.internationalHolderName}</p>}
                        {structure.internationalAccountBank && <p><strong>Account Number:</strong> {structure.internationalAccountBank}</p>}
                        {structure.internationalSwift && <p><strong>SWIFT Code:</strong> {structure.internationalSwift}</p>}
                        {structure.internationalBankAddress && <p><strong>Bank Address:</strong> {structure.internationalBankAddress}</p>}
                        <p><strong>Amount:</strong> ${amount}</p>
                      </div>
                    </div>
                  )}

                  {/* Fallback - Show generic message if no bank details configured */}
                  {(!structure.localBankName || structure.localBankName.trim() === '') &&
                   (!structure.internationalBankName || structure.internationalBankName.trim() === '') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-900 mb-2">Bank Transfer Details</p>
                      <div className="space-y-1 text-sm text-amber-800">
                        <p>Bank transfer details have not been configured for this structure.</p>
                        <p>Please contact the fund manager for bank transfer instructions.</p>
                        <p><strong>Amount:</strong> ${amount}</p>
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      id="receipt-upload"
                      accept=".pdf,.png,.jpg,.jpeg,.gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBankTransferReceipt(file)
                          setReceiptFileName(file.name)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      {bankTransferReceipt ? (
                        <>
                          <File className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-semibold text-green-700">{receiptFileName}</p>
                          <p className="text-xs text-muted-foreground">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-semibold">Click to upload receipt</p>
                          <p className="text-xs text-muted-foreground">PDF, PNG, JPG, GIF (max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Not Deployed Warning */}
          {!isTokenDeployed && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex gap-3 py-6">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Token Not Deployed</p>
                  <p className="text-sm text-red-800">
                    This structure does not have a token deployed yet. Payment cannot be processed at this time. Please contact the fund manager.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Address Warning */}
          {!user?.walletAddress && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Wallet Address Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800">
                  Wallet address payment disabled. Your account does not have a wallet address configured. A wallet address is required to complete blockchain transactions and receive tokens. Please contact support to add a wallet address to your account.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submission ID Warning */}
          {(!submissionId || submissionId.trim() === '') && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Contract Sign Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800">
                  Your Contract is not complete. Please sign struture contract. Refresh the page if you have recently completed KYC.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions - Only show if token is deployed */}
          {isTokenDeployed && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex gap-3 p-4 border rounded-lg bg-muted/30">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      By clicking "Complete Payment", you agree to the payment terms and understand that your investment will be processed immediately.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" asChild disabled={isProcessing}>
                    <a href={`/lp-portal/marketplace/${structureId}/contracts`}>
                      Cancel
                    </a>
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    disabled={!isFormValid() || isProcessing || paymentComplete || !submissionId || submissionId.trim() === ''}
                    onClick={handlePayment}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing Payment...
                      </>
                    ) : paymentComplete ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Payment Complete
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Complete Payment - {formatCurrency(amount)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
