'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Filter,
  Search,
  Plus,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AddExpenseForm } from './AddExpenseForm'
import { SettleUpDialog } from './SettleUpDialog'
import { SetBudgetsDialog } from './SetBudgetsDialog'
import { EditCategoryGoalsDialog } from './EditCategoryGoalsDialog'
import { ConfigureSplittingDialog } from './ConfigureSplittingDialog'

interface Expense {
  id: string
  item: string
  category: 'flights' | 'accommodation' | 'food' | 'activities' | 'transport'
  paidBy: string
  date: string
  amount: number
}

const categoryIcons = {
  flights: Plane,
  accommodation: Hotel,
  food: Utensils,
  activities: MapPin,
  transport: MapPin,
}

const categoryColors = {
  flights: 'bg-blue-500',
  accommodation: 'bg-green-500',
  food: 'bg-orange-500',
  activities: 'bg-purple-500',
  transport: 'bg-blue-400',
}

import { useSession } from 'next-auth/react'

interface BudgetViewProps {
  tripId: string
  trip?: {
    name?: string
    collaborators?: Array<{
      id: string
      user?: {
        name?: string
      }
    }>
  }
}

export function BudgetView({ tripId, trip }: BudgetViewProps) {
  const { data: session } = useSession()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [filterPaidBy, setFilterPaidBy] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)
  const [showSettleUp, setShowSettleUp] = useState(false)
  const [showSetBudgets, setShowSetBudgets] = useState(false)
  const [showEditGoals, setShowEditGoals] = useState(false)
  const [showConfigureSplitting, setShowConfigureSplitting] = useState(false)
  const [totalBudget, setTotalBudget] = useState(5000)
  const [memberBudgets, setMemberBudgets] = useState<Record<string, number>>({})
  const [categoryGoals, setCategoryGoals] = useState<Record<string, number>>({})
  const [splitMethod, setSplitMethod] = useState('budget-proportion')
  const [customSplitPercentages, setCustomSplitPercentages] = useState<Record<string, number>>({})
  const [expenses, setExpenses] = useState<Expense[]>([])

  // Reusable function to load trip budget data
  const loadTripData = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      if (response.ok) {
        const data = await response.json()
        const tripData = data.trip

        // Initialize budget states from trip data
        if (tripData.total_budget) {
          setTotalBudget(tripData.total_budget)
        }
        if (tripData.member_budgets) {
          setMemberBudgets(tripData.member_budgets)
        }
        if (tripData.category_goals) {
          setCategoryGoals(tripData.category_goals)
        }
        if (tripData.split_method) {
          setSplitMethod(tripData.split_method)
        }
        if (tripData.custom_split_percentages) {
          setCustomSplitPercentages(tripData.custom_split_percentages)
        }
      }
    } catch (error) {
      console.error('Error loading trip budget data:', error)
    }
  }

  // Reusable function to load expenses data
  const loadExpenses = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`)
      if (response.ok) {
        const data = await response.json()
        // Map database expenses to component format
        const mappedExpenses = (data.expenses || []).map((exp: any) => {
          // Map database category enum to our category keys
          const categoryMap: Record<string, string> = {
            'FLIGHT': 'flights',
            'ACCOMMODATION': 'accommodation',
            'FOOD': 'food',
            'TRANSPORTATION': 'transport',
            'ACTIVITIES': 'activities',
            'SHOPPING': 'other',
            'INSURANCE': 'other',
            'VISA': 'other',
            'OTHER': 'other',
          }

          return {
            id: exp.id,
            item: exp.item,
            category: categoryMap[exp.category] || 'other',
            paidBy: exp.paid_by_name,
            date: new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            amount: parseFloat(exp.amount),
          }
        })
        setExpenses(mappedExpenses)
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    }
  }

  // Refresh all budget-related data
  const refreshBudgetData = async () => {
    await Promise.all([loadTripData(), loadExpenses()])
  }

  // Load data on mount
  useEffect(() => {
    loadTripData()
    loadExpenses()
  }, [tripId])

  // Calculate spending from real expenses
  const calculateCategorySpending = (category: string) => {
    return expenses
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0)
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const categoryBudgets = [
    { name: 'Flights', key: 'flights', spent: calculateCategorySpending('flights'), budget: categoryGoals['flights'] || 0, icon: Plane },
    { name: 'Accommodation', key: 'accommodation', spent: calculateCategorySpending('accommodation'), budget: categoryGoals['accommodation'] || 0, icon: Hotel },
    { name: 'Food & Dining', key: 'food', spent: calculateCategorySpending('food'), budget: categoryGoals['food'] || 0, icon: Utensils },
    { name: 'Activities', key: 'activities', spent: calculateCategorySpending('activities'), budget: categoryGoals['activities'] || 0, icon: MapPin },
  ]

  // Build trip members from real collaborators data
  const collaborators = trip?.collaborators || []
  const currentUserName = session?.user?.name || 'You'

  // Helper function to generate avatar initials
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const defaultBudget = totalBudget / Math.max(collaborators.length, 1)

  // Calculate contributions from expenses
  const calculateContributed = (memberName: string) => {
    return expenses
      .filter(expense => {
        // Match both the actual name and "You" for current user
        if (memberName === currentUserName) {
          return expense.paidBy === 'You' || expense.paidBy === memberName
        }
        return expense.paidBy === memberName
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
  }

  const tripMembers = collaborators.map((collab) => {
    const memberName = collab.user?.name || 'Unknown'
    const isCurrentUser = memberName === currentUserName
    const displayName = isCurrentUser ? 'You' : memberName
    const contributed = calculateContributed(memberName)
    const budget = memberBudgets[memberName] || defaultBudget

    return {
      id: memberName, // Actual name for tracking
      name: displayName, // Display name (may be "You")
      avatar: getInitials(memberName),
      contributed,
      budget,
      status: (contributed >= budget ? 'Fully paid' : 'Unsettled') as const,
    }
  })

  // If no collaborators, add current user as default
  if (tripMembers.length === 0) {
    const contributed = calculateContributed(currentUserName)
    const budget = memberBudgets[currentUserName] || totalBudget
    tripMembers.push({
      id: currentUserName, // Actual name for tracking
      name: 'You', // Display name
      avatar: getInitials(currentUserName),
      contributed,
      budget,
      status: (contributed >= budget ? 'Fully paid' : 'Unsettled') as const,
    })
  }

  // Calculate cost splitting based on selected method
  const calculateCostSplitting = () => {
    const youOwe: Array<{ name: string; amount: number; avatar: string }> = []
    const owesYou: Array<{ name: string; amount: number; avatar: string }> = []

    const yourMember = tripMembers.find(m => m.name === 'You')
    if (!yourMember) return { youOwe, owesYou }

    tripMembers.forEach((member) => {
      if (member.name === 'You') return // Skip calculating for yourself

      let yourFairShare: number
      let theirFairShare: number

      if (splitMethod === 'even-split') {
        // Split evenly among all members
        const perPerson = totalSpent / tripMembers.length
        yourFairShare = perPerson
        theirFairShare = perPerson
      } else if (splitMethod === 'custom-percentage') {
        // Use custom percentages
        const yourPercentage = customSplitPercentages[yourMember.name] || (100 / tripMembers.length)
        const theirPercentage = customSplitPercentages[member.name] || (100 / tripMembers.length)
        yourFairShare = (yourPercentage / 100) * totalSpent
        theirFairShare = (theirPercentage / 100) * totalSpent
      } else {
        // Default: Budget proportion
        const totalAllocatedBudget = tripMembers.reduce((sum, m) => sum + m.budget, 0)
        yourFairShare = (yourMember.budget / totalAllocatedBudget) * totalSpent
        theirFairShare = (member.budget / totalAllocatedBudget) * totalSpent
      }

      // Calculate who owes whom
      const yourOverpayment = yourMember.contributed - yourFairShare
      const theirOverpayment = member.contributed - theirFairShare

      // If you overpaid and they underpaid, they owe you
      // If they overpaid and you underpaid, you owe them
      const netAmount = theirOverpayment - yourOverpayment

      if (netAmount > 0.01) {
        // They overpaid, so you owe them
        youOwe.push({
          name: member.name,
          amount: netAmount,
          avatar: member.avatar,
        })
      } else if (netAmount < -0.01) {
        // You overpaid, so they owe you
        owesYou.push({
          name: member.name,
          amount: Math.abs(netAmount),
          avatar: member.avatar,
        })
      }
    })

    return { youOwe, owesYou }
  }

  const { youOwe, owesYou } = calculateCostSplitting()

  // Payment data for settle up dialog
  const primaryPayment = youOwe.length > 0 ? {
    payee: youOwe[0].name,
    payeeAvatar: youOwe[0].avatar,
    amount: youOwe[0].amount,
  } : null

  // Filter and search logic
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      expense.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.paidBy.toLowerCase().includes(searchQuery.toLowerCase())

    // Category filter
    const matchesCategory = filterCategories.length === 0 ||
      filterCategories.includes(expense.category)

    // Paid by filter
    const matchesPaidBy = filterPaidBy.length === 0 ||
      filterPaidBy.includes(expense.paidBy)

    return matchesSearch && matchesCategory && matchesPaidBy
  })

  // Get unique categories and people from expenses
  const availableCategories = Array.from(new Set(expenses.map(e => e.category)))
  const availablePeople = Array.from(new Set(expenses.map(e => e.paidBy)))

  // Handler functions
  const handleCategoryToggle = (category: string) => {
    setFilterCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handlePaidByToggle = (person: string) => {
    setFilterPaidBy(prev =>
      prev.includes(person)
        ? prev.filter(p => p !== person)
        : [...prev, person]
    )
  }

  const clearAllFilters = () => {
    setFilterCategories([])
    setFilterPaidBy([])
    setSearchQuery('')
    setShowSearch(false)
    setShowFilter(false)
  }

  const hasActiveFilters = filterCategories.length > 0 || filterPaidBy.length > 0 || searchQuery !== ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Budget Overview */}
      <div className="lg:col-span-2 space-y-6">
        {/* Total Budget Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Trip Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Circular Progress */}
              <div className="relative w-48 h-48 mb-6">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - spentPercentage / 100)}`}
                    className="text-blue-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${totalSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    SPENT OF ${totalBudget.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Spent ({spentPercentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <span className="text-gray-700 dark:text-gray-300">Remaining</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Trip Spending by Category
            </CardTitle>
            <Button
              variant="link"
              className="text-blue-600 dark:text-blue-400 p-0 h-auto"
              onClick={() => setShowEditGoals(true)}
            >
              Edit Goals
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {categoryBudgets
              .filter(category => category.spent > 0 || category.budget > 0)
              .map((category) => {
                const Icon = category.icon
                const percentage = Math.round((category.spent / category.budget) * 100)
                const colorKey = category.key as keyof typeof categoryColors
                return (
                  <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${categoryColors[colorKey]} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Recent Expenses
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filteredExpenses.length} of {expenses.length}
                  </Badge>
                )}
              </CardTitle>
            <div className="flex items-center gap-2">
              <Popover open={showFilter} onOpenChange={setShowFilter}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={filterCategories.length > 0 || filterPaidBy.length > 0 ? 'text-blue-600 dark:text-blue-400' : ''}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filter Expenses</h4>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-auto py-1 px-2 text-xs text-blue-600 dark:text-blue-400"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Category
                      </Label>
                      <div className="space-y-2">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={filterCategories.includes(category)}
                              onCheckedChange={() => handleCategoryToggle(category)}
                            />
                            <label
                              htmlFor={`category-${category}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                            >
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paid By Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Paid By
                      </Label>
                      <div className="space-y-2">
                        {availablePeople.map((person) => (
                          <div key={person} className="flex items-center space-x-2">
                            <Checkbox
                              id={`person-${person}`}
                              checked={filterPaidBy.includes(person)}
                              onCheckedChange={() => handlePaidByToggle(person)}
                            />
                            <label
                              htmlFor={`person-${person}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {person}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {showSearch ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearch(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                  className={searchQuery !== '' ? 'text-blue-600 dark:text-blue-400' : ''}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track a new cost for Summer in Tokyo
                    </p>
                  </DialogHeader>
                  <AddExpenseForm
                    tripId={tripId}
                    collaborators={trip?.collaborators || []}
                    currentUserId={session?.user?.id}
                    onSubmit={(expense) => {
                      console.log('New expense:', expense)
                      // TODO: Add API call to save expense
                      setShowAddExpense(false)
                    }}
                    onCancel={() => setShowAddExpense(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {hasActiveFilters
                    ? 'No expenses match your filters'
                    : 'No expenses yet'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="link"
                    onClick={clearAllFilters}
                    className="mt-2 text-blue-600 dark:text-blue-400"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Expense Item
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Paid By
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Date
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => {
                    const Icon = categoryIcons[expense.category]
                    return (
                      <tr
                        key={expense.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {expense.item}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {expense.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {expense.paidBy[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {expense.paidBy}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {expense.date}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${expense.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Cost Splitting & Members */}
      <div className="space-y-6">
        {/* Cost Splitting */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Cost Splitting
              </CardTitle>
              <Button
                variant="link"
                className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
                onClick={() => setShowConfigureSplitting(true)}
              >
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* You Owe */}
            {youOwe.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  YOU OWE
                </div>
                <div className="space-y-3">
                  {youOwe.map((person, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-sm font-semibold">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {person.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        ${person.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owes You */}
            {owesYou.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  OWES YOU
                </div>
                <div className="space-y-3">
                  {owesYou.map((person, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm font-semibold">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {person.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${person.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settle Up Button */}
            <Button
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowSettleUp(true)}
              disabled={youOwe.length === 0}
            >
              Settle Up
            </Button>
          </CardContent>
        </Card>

        {/* Trip Members & Budget Tracking */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                Trip Members & Budgets
              </CardTitle>
              <Button
                variant="link"
                className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
                onClick={() => setShowSetBudgets(true)}
              >
                Set Budgets
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tripMembers.map((member, idx) => {
              const budgetCommitment = member.budget
              const actualSpent = member.contributed
              const difference = actualSpent - budgetCommitment
              const percentOfBudget = Math.round((actualSpent / budgetCommitment) * 100)

              return (
                <div key={idx} className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Budget: ${budgetCommitment.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={member.status === 'Fully paid' ? 'default' : 'secondary'}
                      className={
                        member.status === 'Fully paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1 ml-11">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        Spent ${actualSpent.toFixed(2)}
                      </span>
                      <span className={`font-medium ${
                        difference > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          percentOfBudget > 100
                            ? 'bg-red-500'
                            : percentOfBudget > 80
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentOfBudget, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {percentOfBudget}% of budget {percentOfBudget > 100 && '(Over budget)'}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Budget Balance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Balance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Trip Budget</span>
              <span className="font-semibold text-gray-900 dark:text-white">${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
              <span className="font-semibold text-gray-900 dark:text-white">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Budget Remaining</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${(totalBudget - totalSpent).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settle Up Dialog */}
      <SettleUpDialog
        open={showSettleUp}
        onOpenChange={setShowSettleUp}
        tripName={trip?.name || 'this trip'}
        payment={primaryPayment}
      />

      {/* Set Budgets Dialog */}
      <SetBudgetsDialog
        open={showSetBudgets}
        onOpenChange={setShowSetBudgets}
        tripId={tripId}
        tripMembers={tripMembers}
        totalBudget={totalBudget}
        onBudgetsUpdated={(budgets) => {
          setMemberBudgets(budgets)
          // Update total budget to be sum of all individual budgets
          const newTotalBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0)
          setTotalBudget(newTotalBudget)
        }}
      />

      {/* Edit Category Goals Dialog */}
      <EditCategoryGoalsDialog
        open={showEditGoals}
        onOpenChange={setShowEditGoals}
        tripId={tripId}
        categories={categoryBudgets}
        totalBudget={totalBudget}
        onGoalsUpdated={async (goals) => {
          // Refresh all budget data to reflect the updated goals
          await refreshBudgetData()
        }}
      />

      {/* Configure Splitting Dialog */}
      <ConfigureSplittingDialog
        open={showConfigureSplitting}
        onOpenChange={setShowConfigureSplitting}
        tripId={tripId}
        tripMembers={tripMembers}
        onSplitMethodUpdated={(method, customSplits) => {
          setSplitMethod(method)
          if (customSplits) {
            setCustomSplitPercentages(customSplits)
          }
        }}
      />
    </div>
  )
}
