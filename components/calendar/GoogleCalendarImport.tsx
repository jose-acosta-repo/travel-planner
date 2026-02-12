'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GoogleCalendarEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  location?: string
  htmlLink: string
}

interface GoogleCalendarImportProps {
  tripId: string
  tripStartDate: string
  tripEndDate: string
  onImportSuccess: () => void
}

export function GoogleCalendarImport({
  tripId,
  tripStartDate,
  tripEndDate,
  onImportSuccess,
}: GoogleCalendarImportProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())

  const fetchCalendarEvents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/calendar/events?` +
          new URLSearchParams({
            timeMin: new Date(tripStartDate).toISOString(),
            timeMax: new Date(tripEndDate).toISOString(),
          })
      )

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Not Connected',
            description: 'Please sign in with Google to access your calendar',
            variant: 'destructive',
          })
          return
        }
        throw new Error('Failed to fetch calendar events')
      }

      const data = await response.json()
      setEvents(data.events || [])

      if (data.events?.length === 0) {
        toast({
          title: 'No Events Found',
          description: 'No calendar events found in this date range',
        })
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      toast({
        title: 'Error',
        description: 'Failed to load calendar events',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      fetchCalendarEvents()
    } else {
      setEvents([])
      setSelectedEvents(new Set())
    }
  }

  const toggleEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents)
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId)
    } else {
      newSelected.add(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const toggleAll = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set())
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)))
    }
  }

  const handleImport = async () => {
    if (selectedEvents.size === 0) {
      toast({
        title: 'No Events Selected',
        description: 'Please select at least one event to import',
        variant: 'destructive',
      })
      return
    }

    setIsImporting(true)
    try {
      const eventsToImport = events.filter(e => selectedEvents.has(e.id))

      for (const event of eventsToImport) {
        // Calculate day number
        const startDate = new Date(event.start)
        const tripStart = new Date(tripStartDate)
        const dayNumber = Math.floor((startDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

        // Extract time from datetime
        const startTime = event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : undefined
        const endTime = event.end?.includes('T') ? event.end.split('T')[1].substring(0, 5) : undefined

        await fetch(`/api/trips/${tripId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_number: dayNumber,
            title: event.title,
            description: event.description || '',
            location: event.location || '',
            start_time: startTime,
            end_time: endTime,
            category: 'other', // Default category
          }),
        })
      }

      toast({
        title: 'Success',
        description: `Imported ${selectedEvents.size} event(s) to your trip`,
      })

      setOpen(false)
      onImportSuccess()
    } catch (error) {
      console.error('Error importing events:', error)
      toast({
        title: 'Error',
        description: 'Failed to import some events',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (dateStr.includes('T')) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Import from Google Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import from Google Calendar</DialogTitle>
          <DialogDescription>
            Select events from your Google Calendar to add to this trip
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No calendar events found for this date range
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedEvents.size === events.length && events.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">
                  Select All ({selectedEvents.size} of {events.length} selected)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {events.map((event) => (
                <Card key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {formatDateTime(event.start)}
                          </Badge>
                          {event.location && (
                            <Badge variant="outline" className="text-xs">
                              {event.location}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedEvents.size === 0}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {selectedEvents.size > 0 && `(${selectedEvents.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
