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
import { DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CategoryBudget {
  name: string
  key: string
  spent: number
  budget: number
  icon: any
}

interface EditCategoryGoalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
  categories: CategoryBudget[]
  totalBudget: number
  onGoalsUpdated: (goals: Record<string, number>) => void
}

export function EditCategoryGoalsDialog({
  open,
  onOpenChange,
  tripId,
  categories,
  totalBudget,
  onGoalsUpdated,
}: EditCategoryGoalsDialogProps) {
  const { toast } = useToast()
  const [categoryGoals, setCategoryGoals] = useState<Record<string, number>>(
    categories.reduce((acc, cat) => {
      acc[cat.key] = cat.budget
      return acc
    }, {} as Record<string, number>)
  )

  const handleGoalChange = (categoryKey: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCategoryGoals(prev => ({
      ...prev,
      [categoryKey]: numValue,
    }))
  }

  const handleDistributeRemaining = () => {
    const allocated = Object.values(categoryGoals).reduce((sum, val) => sum + val, 0)
    const remaining = totalBudget - allocated

    if (remaining <= 0) {
      toast({
        title: 'No remaining budget',
        description: 'All budget has been allocated',
      })
      return
    }

    // Find categories with 0 budget
    const unallocatedCategories = categories.filter(cat => categoryGoals[cat.key] === 0)

    if (unallocatedCategories.length === 0) {
      toast({
        title: 'All categories allocated',
        description: 'All categories already have budget goals',
      })
      return
    }

    // Distribute remaining evenly among unallocated categories
    const perCategory = remaining / unallocatedCategories.length
    const newGoals = { ...categoryGoals }
    unallocatedCategories.forEach(cat => {
      newGoals[cat.key] = perCategory
    })

    setCategoryGoals(newGoals)
  }

  const totalAllocated = Object.values(categoryGoals).reduce((sum, amount) => sum + amount, 0)
  const remaining = totalBudget - totalAllocated

  const handleSave = async () => {
    // Validate total doesn't exceed trip budget
    if (totalAllocated > totalBudget) {
      toast({
        title: 'Budget exceeded',
        description: `Total allocated ($${totalAllocated.toFixed(2)}) exceeds trip budget ($${totalBudget.toFixed(2)})`,
        variant: 'destructive',
      })
      return
    }

    try {
      // Save category goals to API
      const response = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_goals: categoryGoals,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category goals')
      }

      onGoalsUpdated(categoryGoals)

      toast({
        title: 'Goals updated',
        description: 'Category budget goals have been updated successfully.',
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving category goals:', error)
      toast({
        title: 'Error',
        description: 'Failed to update category goals. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Category Goals</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set budget goals for each spending category
          </p>
        </DialogHeader>

        {/* Budget Summary */}
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Trip Budget</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ${totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Allocated</span>
            <span className={`font-semibold ${
              totalAllocated > totalBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              ${totalAllocated.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining</span>
            <span className={`font-bold ${
              remaining < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              ${remaining.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Distribute Remaining Button */}
        {remaining > 0 && (
          <Button
            variant="outline"
            onClick={handleDistributeRemaining}
            className="w-full"
          >
            Distribute Remaining to Unallocated Categories
          </Button>
        )}

        {/* Category Goals */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {categories.map((category) => {
            const goal = categoryGoals[category.key] || 0
            const spent = category.spent
            const percentUsed = goal > 0 ? Math.round((spent / goal) * 100) : 0
            const Icon = category.icon

            return (
              <div
                key={category.key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                {/* Category Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Spent: ${spent.toFixed(2)} ({percentUsed}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget Input */}
                <div className="space-y-3">
                  <Label htmlFor={`goal-${category.key}`} className="text-xs font-medium">
                    Budget Goal
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id={`goal-${category.key}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={goal}
                      onChange={(e) => handleGoalChange(category.key, e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[goal]}
                      min={0}
                      max={totalBudget}
                      step={50}
                      onValueChange={(value) => handleGoalChange(category.key, value[0].toString())}
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
                  {goal > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {spent > goal ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Over budget by ${(spent - goal).toFixed(2)}
                        </span>
                      ) : (
                        <span>
                          ${(goal - spent).toFixed(2)} remaining
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
            disabled={totalAllocated > totalBudget}
          >
            Save Goals
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
