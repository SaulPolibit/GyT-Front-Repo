'use client'

/**
 * NeoPay Card Form Component
 * Credit card input form with validation
 */
import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Lock } from 'lucide-react'

interface CardFormData {
  cardNumber: string
  cardExpiration: string
  cvv: string
  cardHolderName: string
}

interface NeoPayCardFormProps {
  onSubmit: (cardData: CardFormData) => void
  isLoading?: boolean
  amount?: number
  currency?: string
  submitLabel?: string
}

export function NeoPayCardForm({
  onSubmit,
  isLoading = false,
  amount,
  currency = 'GTQ',
  submitLabel = 'Pay Now',
}: NeoPayCardFormProps) {
  const [cardData, setCardData] = useState<CardFormData>({
    cardNumber: '',
    cardExpiration: '',
    cvv: '',
    cardHolderName: '',
  })
  const [errors, setErrors] = useState<Partial<CardFormData>>({})

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : v
  }

  // Format expiration as YY/MM for display, store as YYMM
  const formatExpiration = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '')
    }
    return v
  }

  // Convert display expiration (YY/MM) to API format (YYMM)
  const expirationToAPI = (displayValue: string) => {
    return displayValue.replace('/', '')
  }

  const handleChange = useCallback((field: keyof CardFormData, value: string) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'cardExpiration') {
      formattedValue = formatExpiration(value)
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4)
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }, [])

  const validate = useCallback((): boolean => {
    const newErrors: Partial<CardFormData> = {}

    // Card number validation
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '')
    if (!cleanCardNumber) {
      newErrors.cardNumber = 'Card number is required'
    } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      newErrors.cardNumber = 'Invalid card number'
    }

    // Expiration validation
    const cleanExpiration = cardData.cardExpiration.replace('/', '')
    if (!cleanExpiration) {
      newErrors.cardExpiration = 'Expiration is required'
    } else if (cleanExpiration.length !== 4) {
      newErrors.cardExpiration = 'Use YYMM format'
    }

    // CVV validation
    if (!cardData.cvv) {
      newErrors.cvv = 'CVV is required'
    } else if (cardData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV'
    }

    // Name validation
    if (!cardData.cardHolderName.trim()) {
      newErrors.cardHolderName = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [cardData])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      cardNumber: cardData.cardNumber.replace(/\s/g, ''),
      cardExpiration: expirationToAPI(cardData.cardExpiration),
      cvv: cardData.cvv,
      cardHolderName: cardData.cardHolderName,
    })
  }, [cardData, validate, onSubmit])

  // Detect card type from number
  const getCardType = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '')
    if (cleanNumber.startsWith('4')) return 'visa'
    if (cleanNumber.startsWith('5')) return 'mastercard'
    return null
  }

  const cardType = getCardType(cardData.cardNumber)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                maxLength={19}
                className={errors.cardNumber ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {cardType && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase">
                  {cardType}
                </span>
              )}
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-red-500">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiration and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardExpiration">Expiration (YY/MM)</Label>
              <Input
                id="cardExpiration"
                type="text"
                inputMode="numeric"
                placeholder="25/12"
                value={cardData.cardExpiration}
                onChange={(e) => handleChange('cardExpiration', e.target.value)}
                maxLength={5}
                className={errors.cardExpiration ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.cardExpiration && (
                <p className="text-sm text-red-500">{errors.cardExpiration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                inputMode="numeric"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                maxLength={4}
                className={errors.cvv ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.cvv && (
                <p className="text-sm text-red-500">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Card Holder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardHolderName">Name on Card</Label>
            <Input
              id="cardHolderName"
              type="text"
              placeholder="JOHN DOE"
              value={cardData.cardHolderName}
              onChange={(e) => handleChange('cardHolderName', e.target.value.toUpperCase())}
              className={errors.cardHolderName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.cardHolderName && (
              <p className="text-sm text-red-500">{errors.cardHolderName}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            <Lock className="mr-2 h-4 w-4" />
            {isLoading ? 'Processing...' : (
              amount ? `${submitLabel} ${currency} ${amount.toFixed(2)}` : submitLabel
            )}
          </Button>

          {/* Security Notice */}
          <p className="text-xs text-muted-foreground text-center">
            Secured by NeoNet. Your payment information is encrypted.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
