'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2, Calendar as CalendarIcon, Trash2 } from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  category: string
  calendar_event_id: string | null
}

interface ChecklistViewProps {
  tripId: string
}

export function ChecklistView({ tripId }: ChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null)

  // Form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('other')
  const [newDueDate, setNewDueDate] = useState('')

  // Load checklist items
  useEffect(() => {
    loadChecklist()
  }, [tripId])

  const loadChecklist = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/checklist`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newTitle.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          category: newCategory,
          due_date: newDueDate || null,
        }),
      })

      if (response.ok) {
        setNewTitle('')
        setNewDescription('')
        setNewCategory('other')
        setNewDueDate('')
        setShowDialog(false)
        await loadChecklist()
      } else {
        // Show error message but still close dialog
        console.error('Failed to create task:', await response.text())
        alert('Failed to create task. Please make sure the database migrations are applied.')
        setShowDialog(false)
      }
    } catch (error) {
      console.error('Error creating checklist item:', error)
      alert('Error creating task. Please check the console for details.')
      setShowDialog(false)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleComplete = async (itemId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/checklist?id=${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !currentStatus,
        }),
      })

      if (response.ok) {
        await loadChecklist()
      }
    } catch (error) {
      console.error('Error updating checklist item:', error)
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/trips/${tripId}/checklist?id=${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadChecklist()
        setItemToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error)
    }
  }

  const categoryColors = {
    documents: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    booking: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    packing: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    activities: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  const categoryLabels = {
    documents: 'Documents',
    booking: 'Booking',
    packing: 'Packing',
    activities: 'Activities',
    other: 'Other',
  }

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedCount}/{totalCount} Done
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% Complete
              </p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          {totalCount > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks yet.</p>
              <Button onClick={() => setShowDialog(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggleComplete(item.id, item.completed)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`font-medium ${
                          item.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          categoryColors[item.category as keyof typeof categoryColors]
                        }`}
                      >
                        {categoryLabels[item.category as keyof typeof categoryLabels]}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {item.description}
                      </p>
                    )}
                    {item.due_date && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Due: {formatDueDate(item.due_date)}</span>
                        {item.calendar_event_id && (
                          <span className="ml-1 text-blue-600 dark:text-blue-400">• On Calendar</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItemToDelete(item)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for your trip. Tasks with due dates will automatically appear on the calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Book hotel, Pack passport"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add notes or details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="activities">Activities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
              </div>
            </div>
            {newDueDate && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <CalendarIcon className="inline h-3 w-3 mr-1" />
                  This task will be added to your trip calendar
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!newTitle.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Task'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
              {itemToDelete?.calendar_event_id && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-400 font-medium">
                  Note: This will also remove the associated calendar event.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
