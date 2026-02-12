'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ItineraryItem } from '@/types'
import { formatTime, categoryColors } from '@/lib/utils'
import {
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Car,
  Briefcase,
  Circle,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  GripVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useToast } from '@/hooks/use-toast'

const categoryIcons = {
  flight: Plane,
  hotel: Hotel,
  restaurant: Utensils,
  activity: MapPin,
  transport: Car,
  meeting: Briefcase,
  other: Circle,
}

interface DayViewProps {
  items: ItineraryItem[]
  dayNumber: number
  tripId: string
  onEdit: (item: ItineraryItem) => void
  onRefresh: () => void
}

export function DayView({ items, dayNumber, tripId, onEdit, onRefresh }: DayViewProps) {
  const { toast } = useToast()
  const [deletingItem, setDeletingItem] = useState<ItineraryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/items/${deletingItem.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ title: 'Activity deleted' })
        onRefresh()
      } else {
        toast({ title: 'Failed to delete activity', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
      setDeletingItem(null)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No activities planned for Day {dayNumber} yet.
            <br />
            Add an activity or scan an image to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort items by start_time
  const sortedItems = [...items].sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <div className="relative">
      {/* Vertical Timeline Line */}
      {sortedItems.length > 0 && (
        <div className="absolute left-[123px] top-16 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      )}

      <div className="space-y-6">
        {sortedItems.map((item, index) => {
          const Icon = categoryIcons[item.category] || Circle
          const colors = categoryColors[item.category] || categoryColors.other

          return (
            <div key={item.id} className="relative flex gap-6">
              {/* Time & Dot */}
              <div className="w-24 flex-shrink-0 pt-2">
                {item.start_time ? (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatTime(item.start_time)}
                    </div>
                    {item.end_time && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(item.end_time)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-right">
                    No time
                  </div>
                )}
              </div>

              {/* Timeline Dot */}
              <div className="flex-shrink-0 relative z-10">
                <div className="h-6 w-6 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 shadow-sm" />
              </div>

              {/* Content Card */}
              <Card className="flex-1 overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${colors.bg} flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            {item.title}
                          </h3>
                          {item.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.comments && item.comments.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500 dark:text-gray-400">
                              <MessageSquare className="h-4 w-4" />
                              {item.comments.length} comment{item.comments.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
