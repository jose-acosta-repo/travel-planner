'use client'

import { useState, useRef, useEffect, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Sparkles, X, ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

interface Collaborator {
  id: string
  user?: {
    name?: string
  }
}

interface AddExpenseFormProps {
  tripId: string
  collaborators?: Collaborator[]
  currentUserId?: string
  onSubmit: (expense: any) => void
  onCancel: () => void
}

const categories = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'activity', label: 'Activity' },
  { value: 'flights', label: 'Flights' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'other', label: 'Other' },
]

const currencies = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
]

export function AddExpenseForm({ tripId, collaborators = [], currentUserId, onSubmit, onCancel }: AddExpenseFormProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expenseName, setExpenseName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitWith, setSplitWith] = useState<string[]>([])
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Format collaborators list to include current user
  const formattedCollaborators = collaborators.map((collab) => {
    const name = collab.user?.name || 'Unknown User'
    const isCurrentUser = collab.id === currentUserId
    return {
      id: collab.id,
      name: isCurrentUser ? `${name} (You)` : name,
      avatar: name.charAt(0).toUpperCase(),
      isCurrentUser,
    }
  })

  // Set default paidBy to current user
  useEffect(() => {
    const currentUserCollab = formattedCollaborators.find((c) => c.isCurrentUser)
    if (currentUserCollab && !paidBy) {
      setPaidBy(currentUserCollab.id)
    }
  }, [formattedCollaborators, paidBy])

  const handleSplitWithToggle = (collaboratorId: string) => {
    setSplitWith((prev) =>
      prev.includes(collaboratorId)
        ? prev.filter((id) => id !== collaboratorId)
        : [...prev, collaboratorId]
    )
  }

  const handleSelectAll = () => {
    if (splitWith.length === formattedCollaborators.length) {
      setSplitWith([])
    } else {
      setSplitWith(formattedCollaborators.map((c) => c.id))
    }
  }

  const processReceiptFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, GIF, or PDF file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      })
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // TODO: Extract data from receipt using AI
    toast({
      title: 'Receipt uploaded',
      description: 'AI extraction coming soon...',
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processReceiptFile(file)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      await processReceiptFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!paidBy) {
      toast({
        title: 'Please select who paid',
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      expenseName,
      amount: parseFloat(amount),
      currency,
      date,
      category,
      paidBy,
      splitWith,
      receiptImage,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Quick Fill with AI */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]'
            : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
        }`}
        onClick={() => !receiptImage && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {receiptImage ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={receiptImage}
                  alt="Receipt"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Receipt uploaded
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Click or drag to replace
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setReceiptImage(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center transition-colors ${
                isDragging ? 'bg-blue-200 dark:bg-blue-900' : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                {isDragging ? (
                  <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {isDragging ? 'Drop receipt here!' : 'Quick Fill with AI'}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {isDragging ? 'Release to upload' : 'Drag & drop a receipt or click to browse'}
                </p>
              </div>
            </div>
            {!isDragging && (
              <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Expense Name */}
      <div className="space-y-2">
        <Label htmlFor="expenseName" className="text-sm font-medium text-gray-900 dark:text-white">
          EXPENSE NAME
        </Label>
        <Input
          id="expenseName"
          placeholder="e.g., Dinner at Shibuya"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
          required
        />
      </div>

      {/* Amount and Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-gray-900 dark:text-white">
            AMOUNT
          </Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium text-gray-900 dark:text-white">
            DATE
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium text-gray-900 dark:text-white">
          CATEGORY
        </Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Paid By */}
      <div className="space-y-2">
        <Label htmlFor="paidBy" className="text-sm font-medium text-gray-900 dark:text-white">
          PAID BY
        </Label>
        <Select value={paidBy} onValueChange={setPaidBy} required>
          <SelectTrigger id="paidBy">
            <SelectValue placeholder="Select who paid" />
          </SelectTrigger>
          <SelectContent>
            {formattedCollaborators.map((collaborator) => (
              <SelectItem key={collaborator.id} value={collaborator.id}>
                {collaborator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split With */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-900 dark:text-white">
            SPLIT WITH
          </Label>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleSelectAll}
            className="text-blue-600 dark:text-blue-400 p-0 h-auto"
          >
            SELECT ALL
          </Button>
        </div>
        <div className="space-y-3">
          {formattedCollaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {collaborator.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {collaborator.name}
                </span>
              </div>
              <Checkbox
                checked={splitWith.includes(collaborator.id)}
                onCheckedChange={() => handleSplitWithToggle(collaborator.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add to Budget
        </Button>
      </div>
    </form>
  )
}
