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
import { DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TripMember {
  id: string // Actual member name for tracking
  name: string // Display name (may be "You")
  avatar: string
  contributed: number
  budget?: number
  status: 'Fully paid' | 'Unsettled'
}

interface SetBudgetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  tripMembers: TripMember[]
  totalBudget: number
  onBudgetsUpdated: (budgets: Record<string, number>) => void
}

export function SetBudgetsDialog({
  open,
  onOpenChange,
  tripId,
  tripMembers,
  totalBudget,
  onBudgetsUpdated,
}: SetBudgetsDialogProps) {
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Record<string, number>>(
    tripMembers.reduce((acc, member) => {
      acc[member.id] = member.budget || totalBudget / tripMembers.length
      return acc
    }, {} as Record<string, number>)
  )

  const handleBudgetChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setBudgets(prev => ({
      ...prev,
      [memberId]: numValue,
    }))
  }

  const handleSplitEvenly = () => {
    const perPerson = totalBudget / tripMembers.length
    const evenBudgets = tripMembers.reduce((acc, member) => {
      acc[member.id] = perPerson
      return acc
    }, {} as Record<string, number>)
    setBudgets(evenBudgets)
  }

  const totalAllocated = Object.values(budgets).reduce((sum, amount) => sum + amount, 0)
  const remaining = totalBudget - totalAllocated

  const handleSave = async () => {
    // Validate that at least one budget is set
    if (totalAllocated === 0) {
      toast({
        title: 'No budget allocated',
        description: 'Please allocate budget to at least one member',
        variant: 'destructive',
      })
      return
    }

    try {
      // Save budgets to API
      const response = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_budgets: budgets,
          total_budget: totalAllocated,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update budgets')
      }

      onBudgetsUpdated(budgets)

      toast({
        title: 'Budgets updated',
        description: `Total trip budget updated to $${totalAllocated.toFixed(2)}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving budgets:', error)
      toast({
        title: 'Error',
        description: 'Failed to update budgets. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Set Individual Budgets</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set budget allocations for each member. Total trip budget will be updated automatically.
          </p>
        </DialogHeader>

        {/* Budget Summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Trip Budget</span>
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Total Budget</span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              ${totalAllocated.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
            The trip budget will be updated to match your allocations
          </p>
        </div>

        {/* Split Evenly Button */}
        <Button
          variant="outline"
          onClick={handleSplitEvenly}
          className="w-full"
        >
          Split Evenly (${(totalBudget / tripMembers.length).toFixed(2)} per person)
        </Button>

        {/* Member Budgets */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {tripMembers.map((member) => {
            const budget = budgets[member.id] || 0
            const spent = member.contributed
            const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0

            return (
              <div
                key={member.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                {/* Member Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Spent: ${spent.toFixed(2)} ({percentUsed}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget Input */}
                <div className="space-y-3">
                  <Label htmlFor={`budget-${member.id}`} className="text-xs font-medium">
                    Budget Allocation
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id={`budget-${member.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={budget}
                      onChange={(e) => handleBudgetChange(member.id, e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[budget]}
                      min={0}
                      max={totalBudget}
                      step={50}
                      onValueChange={(value) => handleBudgetChange(member.id, value[0].toString())}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>$0</span>
                      <span>${totalBudget.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentUsed > 100
                          ? 'bg-red-500'
                          : percentUsed > 80
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                  {budget > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {spent > budget ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Over budget by ${(spent - budget).toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          ${(budget - spent).toFixed(2)} remaining
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
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
            disabled={totalAllocated === 0}
          >
            Save Budgets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
