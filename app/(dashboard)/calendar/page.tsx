'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, ChevronRight, Plus, Plane, Car, Hotel, Utensils, Calendar, X, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  type: 'trip' | 'activity'
  color: string
  tripId?: string
}

interface DayActivity {
  id: string
  time: string
  title: string
  subtitle?: string
  category: 'flight' | 'transport' | 'hotel' | 'restaurant'
}

type ViewMode = 'day' | 'week' | 'month'

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDateActivities, setSelectedDateActivities] = useState<DayActivity[]>([])
  const [selectedDateTrip, setSelectedDateTrip] = useState<string | null>(null)

  // Add Event Dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventType, setEventType] = useState<'flight' | 'accommodation' | 'activity' | 'transport' | 'meeting' | 'other'>('activity')
  const [eventLocation, setEventLocation] = useState('')
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [selectedTripId, setSelectedTripId] = useState<string>('personal')
  const [saving, setSaving] = useState(false)

  // Events from API
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // User trips for trip selector
  const [trips, setTrips] = useState<any[]>([])
  const [loadingTrips, setLoadingTrips] = useState(false)

  // Edit/Delete state
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load events from API
  useEffect(() => {
    loadEvents()
    loadTrips()
  }, [currentDate])

  const loadTrips = async () => {
    try {
      setLoadingTrips(true)
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data.trips || [])
      }
    } catch (error) {
      console.error('Error loading trips:', error)
    } finally {
      setLoadingTrips(false)
    }
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      // Get first and last day of month
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const url = `/api/calendar/events?startDate=${firstDay.toISOString()}&endDate=${lastDay.toISOString()}`
      console.log('🔍 [Calendar] Fetching events from:', url)
      console.log('🔍 [Calendar] Date range:', {
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString()
      })

      const response = await fetch(url)
      console.log('🔍 [Calendar] Response status:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 [Calendar] Raw API response:', data)
        console.log('🔍 [Calendar] Events count:', data.events?.length || 0)

        const mappedEvents: CalendarEvent[] = (data.events || []).map((event: any) => ({
          id: event.id,
          title: event.title,
          startDate: new Date(event.start_date),
          endDate: new Date(event.end_date),
          type: event.trip_id ? 'trip' : 'activity',
          color: event.event_type === 'flight' ? 'bg-blue-500' : 'bg-green-500',
          tripId: event.trip_id,
        }))

        console.log('🔍 [Calendar] Mapped events:', mappedEvents)
        console.log('🔍 [Calendar] Setting events state with', mappedEvents.length, 'events')
        setEvents(mappedEvents)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [Calendar] API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ [Calendar] Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load activities for selected date
  useEffect(() => {
    const loadActivitiesForDate = () => {
      // Check if selected date has any events
      const dateEvents = events.filter((event) => {
        const selectedTime = selectedDate.getTime()
        return (
          selectedTime >= event.startDate.getTime() &&
          selectedTime <= event.endDate.getTime()
        )
      })

      if (dateEvents.length > 0) {
        // Mock activities for demo - replace with API call
        const mockActivities: DayActivity[] = [
          {
            id: '1',
            time: '08:30 AM',
            title: 'Flight to Malé (MLE)',
            subtitle: 'Flight EK120 • Departure Terminal 3',
            category: 'flight',
          },
          {
            id: '2',
            time: '03:45 PM',
            title: 'Speedboat Transfer',
            subtitle: 'Jetty A, Malé Airport',
            category: 'transport',
          },
          {
            id: '3',
            time: '05:00 PM',
            title: 'Check-in at Crystal Sands',
            subtitle: 'Confirmation #882194',
            category: 'hotel',
          },
          {
            id: '4',
            time: '08:00 PM',
            title: 'Dinner at Sunset Pier',
            subtitle: 'Reservation for 4 people',
            category: 'restaurant',
          },
        ]
        setSelectedDateActivities(mockActivities)
        setSelectedDateTrip(dateEvents[0].title)
      } else {
        setSelectedDateActivities([])
        setSelectedDateTrip(null)
      }
    }

    loadActivitiesForDate()
  }, [selectedDate])

  const categoryIcons = {
    flight: Plane,
    transport: Car,
    hotel: Hotel,
    restaurant: Utensils,
  }

  const categoryColors = {
    flight: 'text-blue-600 dark:text-blue-400',
    transport: 'text-orange-600 dark:text-orange-400',
    hotel: 'text-purple-600 dark:text-purple-400',
    restaurant: 'text-green-600 dark:text-green-400',
  }

  // Get days in month
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Generate calendar grid
  const calendarDays = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Check if date has event
  const getEventsForDate = (day: number | null) => {
    if (!day) return []
    // Create start and end of day to check if any event overlaps with this day
    const dayStart = new Date(year, month, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999)

    return events.filter((event) => {
      // Event overlaps with day if: event starts before day ends AND event ends after day starts
      return (
        event.startDate.getTime() <= dayEnd.getTime() &&
        event.endDate.getTime() >= dayStart.getTime()
      )
    })
  }

  // Helper: Check if event overlaps with a specific date
  const eventOverlapsWithDate = (event: CalendarEvent, date: Date) => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
    return (
      event.startDate.getTime() <= dayEnd.getTime() &&
      event.endDate.getTime() >= dayStart.getTime()
    )
  }

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Navigate weeks
  const prevWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedDate(newDate)
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
  }

  const nextWeek = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedDate(newDate)
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
  }

  // Navigate days
  const prevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
  }

  const nextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
    setCurrentDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
  }

  // Get week days for week view
  const getWeekDays = () => {
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - start.getDay()) // Start from Sunday
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Open add event dialog
  const openAddDialog = () => {
    // Reset all form fields
    setEventTitle('')
    setEventDescription('')
    setEventType('activity')
    setEventLocation('')
    setSelectedTripId('personal')
    // Pre-fill with selected date
    const dateStr = selectedDate.toISOString().split('T')[0]
    setEventStartDate(dateStr)
    setEventEndDate(dateStr)
    setEventStartTime('09:00')
    setEventEndTime('10:00')
    setShowAddDialog(true)
  }

  // Save calendar event
  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) return

    setSaving(true)
    try {
      // Combine date and time
      const startDateTime = new Date(`${eventStartDate}T${eventStartTime}:00`)
      const endDateTime = new Date(`${eventEndDate}T${eventEndTime}:00`)

      const payload = {
        title: eventTitle,
        description: eventDescription,
        event_type: eventType,
        location: eventLocation,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        trip_id: selectedTripId === 'personal' ? null : selectedTripId,
      }

      console.log('📝 [Calendar] Creating event with payload:', payload)

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📝 [Calendar] Create response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [Calendar] Event created successfully:', result)

        // Reset form
        setEventTitle('')
        setEventDescription('')
        setEventType('activity')
        setEventLocation('')
        setSelectedTripId('personal')
        setShowAddDialog(false)

        // Reload calendar events
        console.log('🔄 [Calendar] Reloading events after create...')
        await loadEvents()
      } else {
        const error = await response.json()
        console.error('❌ [Calendar] Failed to save event:', error)
        alert('Failed to save event. Please try again.')
      }
    } catch (error) {
      console.error('❌ [Calendar] Error saving event:', error)
      alert('An error occurred while saving the event.')
    } finally {
      setSaving(false)
    }
  }

  // Handle edit event
  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event)
    // Pre-fill form with existing event data
    setEventTitle(event.title)
    setEventDescription('') // We don't have description in CalendarEvent interface
    setEventType('activity') // We don't have full type in interface
    setEventLocation('')
    setEventStartDate(event.startDate.toISOString().split('T')[0])
    setEventStartTime(event.startDate.toTimeString().slice(0, 5))
    setEventEndDate(event.endDate.toISOString().split('T')[0])
    setEventEndTime(event.endDate.toTimeString().slice(0, 5))
    setSelectedTripId(event.tripId || 'personal')
    setShowEditDialog(true)
  }

  // Save edited event
  const handleSaveEditedEvent = async () => {
    if (!eventToEdit || !eventTitle.trim()) return

    setSaving(true)
    try {
      const startDateTime = new Date(`${eventStartDate}T${eventStartTime}:00`)
      const endDateTime = new Date(`${eventEndDate}T${eventEndTime}:00`)

      const response = await fetch(`/api/calendar/events?id=${eventToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          event_type: eventType,
          location: eventLocation,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          trip_id: selectedTripId === 'personal' ? null : selectedTripId,
        }),
      })

      if (response.ok) {
        setEventToEdit(null)
        setShowEditDialog(false)
        await loadEvents()
      } else {
        const error = await response.json()
        console.error('Failed to update event:', error)
        alert('Failed to update event. Please try again.')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('An error occurred while updating the event.')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/calendar/events?id=${eventToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEventToDelete(null)
        setShowDeleteDialog(false)
        await loadEvents()
      } else {
        const error = await response.json()
        console.error('Failed to delete event:', error)
        alert('Failed to delete event. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('An error occurred while deleting the event.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Calendar Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Master Calendar
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={viewMode === 'day' ? prevDay : viewMode === 'week' ? prevWeek : prevMonth}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 min-w-[180px] text-center">
                {viewMode === 'day'
                  ? selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : viewMode === 'week'
                  ? `Week of ${selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}`
                  : `${monthNames[month]} ${year}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={viewMode === 'day' ? nextDay : viewMode === 'week' ? nextWeek : nextMonth}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? '' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
            >
              Month
            </Button>
          </div>

          <Button
            onClick={openAddDialog}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Calendar Grid */}
        {viewMode === 'month' && (
          <Card>
            <CardContent className="p-0">
              {/* Day Names */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center py-3 text-xs font-semibold text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day)
                  const isSelected =
                    day === selectedDate.getDate() &&
                    month === selectedDate.getMonth() &&
                    year === selectedDate.getFullYear()
                  const isToday =
                    day === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear()

                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        !day ? 'bg-gray-50 dark:bg-gray-900' : ''
                      }`}
                      onClick={() => {
                        if (day) {
                          setSelectedDate(new Date(year, month, day))
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div className="flex justify-between items-start mb-1">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : isToday
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {day}
                            </span>
                          </div>

                          {/* Events */}
                          <div className="space-y-1">
                            {dayEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`${event.color} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditEvent(event)
                                }}
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <Card>
            <CardContent className="p-0">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {getWeekDays().map((date, index) => {
                  const isToday =
                    date.toDateString() === new Date().toDateString()
                  const isSelected = date.toDateString() === selectedDate.toDateString()

                  return (
                    <div
                      key={index}
                      className="text-center py-3 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {dayNames[date.getDay()]}
                      </div>
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full mt-1 text-sm font-medium ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Week Grid */}
<div className="grid grid-cols-7">
                {getWeekDays().map((date, index) => {
                  const dayEvents = events.filter((event) => {
                    // Check if event overlaps with this day
                    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
                    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
                    return (
                      event.startDate.getTime() <= dayEnd.getTime() &&
                      event.endDate.getTime() >= dayStart.getTime()
                    )
                  })

                  return (
                    <div
                      key={index}
                      className="min-h-[400px] border-r border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 last:border-r-0"
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`${event.color} text-white text-xs px-2 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEvent(event)
                            }}
                          >
                            <div className="font-semibold truncate">{event.title}</div>
                            <div className="text-[10px] opacity-90 mt-1">
                              {event.startDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">Loading events...</div>
                  </div>
                ) : events.filter((event) => eventOverlapsWithDate(event, selectedDate)).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No events for this day</p>
                    <Button
                      variant="ghost"
                      className="mt-4"
                      onClick={openAddDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </div>
                ) : (
                  events
                    .filter((event) => eventOverlapsWithDate(event, selectedDate))
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`${event.color} text-white p-4 rounded-lg`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/20 text-white">
                              {event.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:bg-white/20"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white hover:bg-red-500/50"
                              onClick={() => {
                                setEventToDelete(event)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm opacity-90">
                          {event.startDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}{' '}
                          -{' '}
                          {event.endDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openAddDialog}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>
              Create a new event or activity for your trip
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Event Title */}
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Flight to Paris, Hotel Check-in"
                className="mt-1.5"
              />
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="type">Event Type</Label>
              <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trip Selector */}
            <div>
              <Label htmlFor="trip">Associate with Trip (Optional)</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a trip or leave empty for personal event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">None (Personal Event)</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., Charles de Gaulle Airport"
                className="mt-1.5"
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Add notes or details about this event..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEvent}
              disabled={!eventTitle.trim() || !eventStartDate || !eventEndDate || saving}
            >
              {saving ? 'Saving...' : 'Save Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Calendar Event</DialogTitle>
            <DialogDescription>
              Update the event details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Flight to Paris, Hotel Check-in"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Event Type</Label>
              <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-trip">Associate with Trip (Optional)</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a trip or leave empty for personal event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">None (Personal Event)</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., Charles de Gaulle Airport"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Add notes or details about this event..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedEvent}
              disabled={!eventTitle.trim() || !eventStartDate || !eventEndDate || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
