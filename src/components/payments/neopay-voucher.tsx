'use client'

/**
 * NeoPay Voucher/Receipt Component
 */
import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Printer, CheckCircle, XCircle } from 'lucide-react'

interface VoucherData {
  paymentMethod: string
  date: string
  time: string
  amount: number
  currency: string
  cardHolderName: string
  cardNumber: string
  cardType: string
  referenceNumber: string
  authorizationCode: string
  affiliation: string
  auditNumber: string
  transactionType: string
  legend: string
  status: string
}

interface NeoPayVoucherProps {
  voucher: VoucherData
  onClose?: () => void
}

export function NeoPayVoucher({ voucher, onClose }: NeoPayVoucherProps) {
  const voucherRef = useRef<HTMLDivElement>(null)

  const isVoid = voucher.transactionType === 'ANULACION'
  const isApproved = voucher.status === 'approved' || voucher.status === 'voided'

  const handlePrint = () => {
    const printContent = voucherRef.current?.innerHTML
    const printWindow = window.open('', '_blank')
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Voucher - ${voucher.referenceNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin: 8px 0; }
              .label { font-weight: bold; }
              .separator { border-top: 1px dashed #000; margin: 16px 0; }
              .amount { font-size: 24px; text-align: center; margin: 20px 0; }
              .legend { text-align: center; margin-top: 20px; font-size: 12px; }
              .negative { color: red; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {isApproved ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          {voucher.transactionType}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={voucherRef} className="space-y-4 font-mono text-sm">
          {/* Header */}
          <div className="header text-center">
            <h2 className="font-bold text-lg">{voucher.paymentMethod}</h2>
            <p>Comprobante de Pago</p>
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="space-y-2">
            <div className="row flex justify-between">
              <span className="label">Fecha:</span>
              <span>{voucher.date}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">Hora:</span>
              <span>{voucher.time}</span>
            </div>
          </div>

          <Separator />

          {/* Amount */}
          <div className={`amount text-2xl font-bold text-center ${isVoid ? 'text-red-500' : ''}`}>
            {isVoid ? '-' : ''}{voucher.currency} {Math.abs(voucher.amount).toFixed(2)}
          </div>

          <Separator />

          {/* Card Info */}
          <div className="space-y-2">
            <div className="row flex justify-between">
              <span className="label">Tarjetahabiente:</span>
              <span>{voucher.cardHolderName}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">Tarjeta:</span>
              <span>{voucher.cardNumber}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">Tipo:</span>
              <span>{voucher.cardType}</span>
            </div>
          </div>

          <Separator />

          {/* Reference Numbers */}
          <div className="space-y-2">
            <div className="row flex justify-between">
              <span className="label">No. Referencia:</span>
              <span>{voucher.referenceNumber}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">No. Autorizacion:</span>
              <span>{voucher.authorizationCode}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">Afiliacion:</span>
              <span>{voucher.affiliation}</span>
            </div>
            <div className="row flex justify-between">
              <span className="label">No. Auditoria:</span>
              <span>{voucher.auditNumber}</span>
            </div>
          </div>

          <Separator />

          {/* Legend */}
          <p className="legend text-center text-xs text-muted-foreground">
            {voucher.legend}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
