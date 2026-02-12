'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowRight, CreditCard, DollarSign, Wallet } from 'lucide-react'

interface Payment {
  payee: string
  payeeAvatar: string
  amount: number
}

interface SettleUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripName: string
  payment: Payment | null
}

export function SettleUpDialog({ open, onOpenChange, tripName, payment }: SettleUpDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState('venmo')

  if (!payment) return null

  const handleConfirmPayment = () => {
    // TODO: Implement payment processing
    console.log('Processing payment:', { payment, paymentMethod })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settle Up</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Clear your debts for {tripName}
          </p>
        </DialogHeader>

        {/* Payment Summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white">
                  {payment.payeeAvatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You are paying
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {payment.payee}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${payment.amount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total Debt
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Select Payment Method
          </Label>

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {/* Venmo */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === 'venmo'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('venmo')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    Venmo
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Instant external payment
                  </p>
                </div>
              </div>
              <RadioGroupItem value="venmo" id="venmo" />
            </div>

            {/* PayPal */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === 'paypal'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    PayPal
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Secure international transfer
                  </p>
                </div>
              </div>
              <RadioGroupItem value="paypal" id="paypal" />
            </div>

            {/* Cash/Manual */}
            <div
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                paymentMethod === 'manual'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setPaymentMethod('manual')}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    Cash / Manual
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Settle up outside the app
                  </p>
                </div>
              </div>
              <RadioGroupItem value="manual" id="manual" />
            </div>
          </RadioGroup>
        </div>

        {/* Amount to Transfer */}
        <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Amount to Transfer
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ${payment.amount.toFixed(2)}
          </span>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmPayment}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold"
        >
          Confirm Payment
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-4">
          By confirming, you agree to record this transaction in the shared trip ledger
        </p>
      </DialogContent>
    </Dialog>
  )
}
