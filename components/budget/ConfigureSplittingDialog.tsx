'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TripMember {
  id: string // Actual member name for tracking
  name: string // Display name (may be "You")
  avatar: string
  contributed: number
  budget?: number
}

interface ConfigureSplittingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  tripMembers: TripMember[]
  onSplitMethodUpdated: (method: string, customSplits?: Record<string, number>) => void
}

export function ConfigureSplittingDialog({
  open,
  onOpenChange,
  tripId,
  tripMembers,
  onSplitMethodUpdated,
}: ConfigureSplittingDialogProps) {
  const { toast } = useToast()
  const [splitMethod, setSplitMethod] = useState('budget-proportion')
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>(
    tripMembers.reduce((acc, member) => {
      acc[member.id] = 100 / tripMembers.length
      return acc
    }, {} as Record<string, number>)
  )

  const handlePercentageChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCustomPercentages(prev => ({
      ...prev,
      [memberId]: numValue,
    }))
  }

  const totalPercentage = Object.values(customPercentages).reduce((sum, val) => sum + val, 0)

  const handleSave = async () => {
    if (splitMethod === 'custom-percentage' && Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: 'Invalid percentages',
        description: 'Percentages must add up to 100%',
        variant: 'destructive',
      })
      return
    }

    try {
      // Save split method to API
      const response = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          split_method: splitMethod,
          custom_split_percentages: customPercentages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update split method')
      }

      onSplitMethodUpdated(splitMethod, customPercentages)

      toast({
        title: 'Split method updated',
        description: 'Cost splitting configuration has been saved.',
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving split method:', error)
      toast({
        title: 'Error',
        description: 'Failed to update split method. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Configure Cost Splitting</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose how expenses should be split among trip members
          </p>
        </DialogHeader>

        {/* Split Method Options */}
        <RadioGroup value={splitMethod} onValueChange={setSplitMethod}>
          <div className="space-y-3">
            {/* Split Evenly */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                splitMethod === 'even-split'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSplitMethod('even-split')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="even-split" id="even-split" className="mt-1" />
                <div className="flex-1">
                  <label
                    htmlFor="even-split"
                    className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer"
                  >
                    Split Evenly
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Divide all expenses equally among all members
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Info className="h-3 w-3" />
                    <span>Each person pays {(100 / tripMembers.length).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Proportion (Current) */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                splitMethod === 'budget-proportion'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSplitMethod('budget-proportion')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="budget-proportion" id="budget-proportion" className="mt-1" />
                <div className="flex-1">
                  <label
                    htmlFor="budget-proportion"
                    className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer"
                  >
                    Budget Proportion
                    <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                      (Recommended)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Split based on each member's budget allocation
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Info className="h-3 w-3" />
                    <span>Fair for trips where members have different spending capacities</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Percentages */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                splitMethod === 'custom-percentage'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSplitMethod('custom-percentage')}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="custom-percentage" id="custom-percentage" className="mt-1" />
                <div className="flex-1">
                  <label
                    htmlFor="custom-percentage"
                    className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer"
                  >
                    Custom Percentages
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Set custom split percentages for each member
                  </p>

                  {splitMethod === 'custom-percentage' && (
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {tripMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {member.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={customPercentages[member.id]}
                              onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total
                        </span>
                        <span className={`text-sm font-bold ${
                          Math.abs(totalPercentage - 100) < 0.01
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {totalPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* By Participation (Coming Soon) */}
            <div
              className="border-2 rounded-lg p-4 opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value="by-participation" id="by-participation" disabled className="mt-1" />
                <div className="flex-1">
                  <label
                    htmlFor="by-participation"
                    className="font-semibold text-sm text-gray-900 dark:text-white"
                  >
                    By Participation
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Coming Soon)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Only split costs among members who participated in each expense
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={splitMethod === 'custom-percentage' && Math.abs(totalPercentage - 100) > 0.01}
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
