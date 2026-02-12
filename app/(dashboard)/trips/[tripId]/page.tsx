'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DayView } from '@/components/itinerary/DayView'
import { ActivityForm } from '@/components/itinerary/ActivityForm'
import { ImageUploader } from '@/components/ai/ImageUploader'
import { BudgetView } from '@/components/budget/BudgetView'
import { DocsView } from '@/components/docs/DocsView'
import { CollaboratorList } from '@/components/collaboration/CollaboratorList'
import { CollaboratorsView } from '@/components/collaboration/CollaboratorsView'
import { ChecklistView } from '@/components/checklist/ChecklistView'
import { InviteModal } from '@/components/collaboration/InviteModal'
import { EditTripDialog } from '@/components/trips/EditTripDialog'
import { DeleteTripDialog } from '@/components/trips/DeleteTripDialog'
import { GoogleCalendarImport } from '@/components/calendar/GoogleCalendarImport'
import { Trip, ItineraryItem } from '@/types'
import { formatDate, getDaysBetween, getDateForDay } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Share2,
  Plus,
  Camera,
  Loader2,
  Globe,
  Lock,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const tripId = params.tripId as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(1)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeleteDayDialog, setShowDeleteDayDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [activeTab, setActiveTab] = useState<'trip' | 'budget' | 'docs' | 'collaborators' | 'checklist'>('trip')

  useEffect(() => {
    fetchTrip()
  }, [tripId])

  async function fetchTrip() {
    try {
      const response = await fetch(`/api/trips/${tripId}`)
      if (response.ok) {
        const data = await response.json()
        setTrip(data.trip)
      } else if (response.status === 404) {
        router.push('/trips')
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivityAdded = () => {
    setShowActivityForm(false)
    setEditingItem(null)
    fetchTrip()
  }

  const handleImageExtracted = () => {
    setShowImageUploader(false)
    fetchTrip()
  }

  const handleShare = async () => {
    if (!trip) return

    const shareUrl = `${window.location.origin}/share/${trip.share_token}`

    if (!trip.is_public) {
      // Make trip public first
      await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: true }),
      })
      setTrip({ ...trip, is_public: true })
    }

    navigator.clipboard.writeText(shareUrl)
    toast({
      title: 'Link copied!',
      description: 'The shareable link has been copied to your clipboard.',
    })
  }

  const handleAddDay = async () => {
    if (!trip) return

    try {
      // Calculate new end date (add one day)
      const currentEndDate = new Date(trip.end_date)
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() + 1)

      // Update trip with new end date
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_date: newEndDate.toISOString().split('T')[0],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Day added!',
          description: 'A new day has been added to your trip.',
        })
        fetchTrip()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add day to trip.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to add day:', error)
      toast({
        title: 'Error',
        description: 'Failed to add day to trip.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveDay = async () => {
    if (!trip) return

    const totalDays = getDaysBetween(trip.start_date, trip.end_date)

    // Don't allow removing if only 1 day left
    if (totalDays <= 1) {
      toast({
        title: 'Cannot remove day',
        description: 'Trip must have at least one day.',
        variant: 'destructive',
      })
      return
    }

    // Check if last day has activities
    const lastDayItems = itemsByDay[totalDays] || []
    if (lastDayItems.length > 0) {
      toast({
        title: 'Cannot remove day',
        description: `Day ${totalDays} has ${lastDayItems.length} activit${lastDayItems.length === 1 ? 'y' : 'ies'}. Please remove them first.`,
        variant: 'destructive',
      })
      return
    }

    try {
      // Calculate new end date (subtract one day)
      const currentEndDate = new Date(trip.end_date)
      const newEndDate = new Date(currentEndDate)
      newEndDate.setDate(newEndDate.getDate() - 1)

      // Update trip with new end date
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_date: newEndDate.toISOString().split('T')[0],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Day removed!',
          description: 'The last day has been removed from your trip.',
        })
        // If we were viewing the removed day, switch to the new last day
        if (selectedDay === totalDays) {
          setSelectedDay(totalDays - 1)
        }
        fetchTrip()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove day from trip.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to remove day:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove day from trip.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Trip not found</p>
        <Link href="/trips">
          <Button className="mt-4">Back to Trips</Button>
        </Link>
      </div>
    )
  }

  const totalDays = getDaysBetween(trip.start_date, trip.end_date)
  const itemsByDay = trip.items?.reduce((acc, item) => {
    if (!acc[item.day_number]) {
      acc[item.day_number] = []
    }
    acc[item.day_number].push(item)
    return acc
  }, {} as Record<number, ItineraryItem[]>) || {}

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Day Navigation */}
      <div className="hidden md:block w-auto min-w-[200px] max-w-xs border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            TIMELINE
          </h3>
          <div className="space-y-4">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const date = getDateForDay(trip.start_date, day)
              const itemCount = itemsByDay[day]?.length || 0
              const dayTitle = day === 1 ? 'Arrival' : trip.destination
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedDay === day
                      ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      selectedDay === day
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      D{day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${
                        selectedDay === day
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {dayTitle}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${
                    selectedDay === day
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            onClick={handleAddDay}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Day
          </button>
        </div>
      </div>

      {/* Center - Timeline View */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-8">
          {/* Day Header */}
          <div className="mb-8">
            <Link
              href="/trips"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Link>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Day {selectedDay}: {selectedDay === 1 ? 'Arrival & ' : ''}{trip.destination}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {getDateForDay(trip.start_date, selectedDay).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })} - {itemsByDay[selectedDay]?.length || 0} activities planned
                </p>
              </div>
              <div className="flex items-center gap-2">
                {trip.collaborators && trip.collaborators.length > 0 && (
                  <div className="flex -space-x-2">
                    {trip.collaborators.slice(0, 3).map((collab, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded-full bg-blue-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-semibold"
                      >
                        {collab.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    ))}
                    {trip.collaborators.length > 3 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-semibold">
                        +{trip.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                )}
                {totalDays > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteDayDialog(true)}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Day
                  </Button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('trip')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'trip'
                      ? 'border-blue-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Activities
                </button>
                <button
                  onClick={() => setActiveTab('budget')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'budget'
                      ? 'border-blue-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Budget
                </button>
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'docs'
                      ? 'border-blue-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Docs
                </button>
                <button
                  onClick={() => setActiveTab('collaborators')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'collaborators'
                      ? 'border-blue-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Collaborators
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'checklist'
                      ? 'border-blue-600 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Checklist
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {activeTab === 'trip' && (
            <>
              <div className="mb-6 flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
                  onClick={() => setShowImageUploader(true)}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Upload Activity
                </Button>
              </div>
              <DayView
                items={itemsByDay[selectedDay] || []}
                dayNumber={selectedDay}
                tripId={tripId}
                onEdit={(item) => {
                  setEditingItem(item)
                  setShowActivityForm(true)
                }}
                onRefresh={fetchTrip}
              />

              {/* Add Entry Button */}
              <button
                onClick={() => setShowActivityForm(true)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add manual entry or destination
              </button>
            </>
          )}

          {/* Budget View */}
          {activeTab === 'budget' && trip && (
            <BudgetView tripId={tripId} trip={trip} />
          )}

          {/* Docs View */}
          {activeTab === 'docs' && (
            <DocsView tripId={tripId} />
          )}

          {/* Collaborators View */}
          {activeTab === 'collaborators' && (
            <CollaboratorsView
              trip={trip}
              onInvite={() => setShowInviteModal(true)}
              onRefresh={fetchTrip}
            />
          )}

          {/* Checklist View */}
          {activeTab === 'checklist' && (
            <ChecklistView tripId={tripId} />
          )}
        </div>
      </div>


      {/* Modals */}
      <Dialog open={showActivityForm} onOpenChange={setShowActivityForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Activity' : 'Add Activity'}
            </DialogTitle>
          </DialogHeader>
          <ActivityForm
            tripId={tripId}
            dayNumber={selectedDay}
            existingItem={editingItem}
            onSuccess={handleActivityAdded}
            onCancel={() => {
              setShowActivityForm(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showImageUploader} onOpenChange={setShowImageUploader}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Extract from Image</DialogTitle>
          </DialogHeader>
          <ImageUploader
            tripId={tripId}
            dayNumber={selectedDay}
            tripStartDate={trip?.start_date || ''}
            tripEndDate={trip?.end_date || ''}
            onSuccess={handleImageExtracted}
            onTripDatesUpdated={fetchTrip}
          />
        </DialogContent>
      </Dialog>

      <InviteModal
        tripId={tripId}
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={fetchTrip}
      />

      {/* Delete Day Confirmation Dialog */}
      <AlertDialog open={showDeleteDayDialog} onOpenChange={setShowDeleteDayDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Day {selectedDay}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this day from your trip? This will remove the day from your itinerary.
              {itemsByDay[selectedDay]?.length > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  Warning: This day has {itemsByDay[selectedDay].length} activit{itemsByDay[selectedDay].length === 1 ? 'y' : 'ies'}. Please remove them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveDay}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Day
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
