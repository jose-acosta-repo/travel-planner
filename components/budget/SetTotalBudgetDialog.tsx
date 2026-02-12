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
import { Slider } from '@/components/ui/slider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DollarSign, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TripMember {
  name: string
  avatar: string
  contributed: number
  budget?: number
  status: 'Fully paid' | 'Unsettled'
}

interface SetTotalBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  currentBudget: number
  tripMembers: TripMember[]
  onBudgetUpdated: (newBudget: number) => void
}

export function SetTotalBudgetDialog({
  open,
  onOpenChange,
  tripId,
  currentBudget,
  tripMembers,
  onBudgetUpdated,
}: SetTotalBudgetDialogProps) {
  const { toast } = useToast()
  const [totalBudget, setTotalBudget] = useState(currentBudget)

  const handleBudgetChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setTotalBudget(numValue)
  }

  const perPersonBudget = totalBudget / tripMembers.length

  const handleSave = () => {
    if (totalBudget <= 0) {
      toast({
        title: 'Invalid budget',
        description: 'Total budget must be greater than $0',
        variant: 'destructive',
      })
      return
    }

    // TODO: Save total budget to API
    console.log('Saving total budget:', totalBudget)
    onBudgetUpdated(totalBudget)

    toast({
      title: 'Budget updated',
      description: `Total trip budget set to $${totalBudget.toLocaleString()}`,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Set Total Trip Budget</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set the overall budget for this trip with all collaborators
          </p>
        </DialogHeader>

        {/* Trip Members Overview */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trip Collaborators ({tripMembers.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tripMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full py-1 px-3 border border-gray-200 dark:border-gray-700"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {member.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Input */}
        <div className="space-y-3">
          <Label htmlFor="total-budget" className="text-sm font-medium">
            Total Trip Budget
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="total-budget"
              type="number"
              step="100"
              min="0"
              value={totalBudget}
              onChange={(e) => handleBudgetChange(e.target.value)}
              className="pl-9 text-lg font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Slider
              value={[totalBudget]}
              min={0}
              max={50000}
              step={100}
              onValueChange={(value) => handleBudgetChange(value[0].toString())}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>$0</span>
              <span>$50,000</span>
            </div>
          </div>
        </div>

        {/* Budget Breakdown */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Trip Budget
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Per Person ({tripMembers.length} members)
            </span>
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              ${perPersonBudget.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This sets the overall budget for the trip. You can later allocate specific budgets to each member
            or category using the "Set Budgets" and "Edit Goals" options.
          </p>
        </div>

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
            disabled={totalBudget <= 0}
          >
            Save Budget
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
