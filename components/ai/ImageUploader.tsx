'use client'

import { useState, useRef, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { ExtractedActivity, ActivityCategory, FlightMetadata, HotelMetadata, RestaurantMetadata, ActivityMetadata, TransportMetadata, MeetingMetadata } from '@/types'
import { categoryColors } from '@/lib/utils'
import {
  Upload,
  Camera,
  Loader2,
  Check,
  X,
  Plus,
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Car,
  Briefcase,
  Circle,
  ImageIcon,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

const categoryIcons: Record<ActivityCategory, React.ComponentType<any>> = {
  flight: Plane,
  hotel: Hotel,
  restaurant: Utensils,
  activity: MapPin,
  transport: Car,
  meeting: Briefcase,
  other: Circle,
}

interface ImageUploaderProps {
  tripId: string
  dayNumber: number
  tripStartDate: string
  tripEndDate: string
  onSuccess: () => void
  onTripDatesUpdated?: () => void
}

export function ImageUploader({ tripId, dayNumber, tripStartDate, tripEndDate, onSuccess, onTripDatesUpdated }: ImageUploaderProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedActivities, setExtractedActivities] = useState<ExtractedActivity[]>([])
  const [editedActivities, setEditedActivities] = useState<ExtractedActivity[]>([])
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set())
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showDateMismatchDialog, setShowDateMismatchDialog] = useState(false)
  const [suggestedDateRange, setSuggestedDateRange] = useState<{ start: string; end: string } | null>(null)

  const validateActivityDates = (activities: ExtractedActivity[]): { isValid: boolean; suggestedStart?: string; suggestedEnd?: string } => {
    const activitiesWithDates = activities.filter(a => a.date)
    if (activitiesWithDates.length === 0) return { isValid: true }

    const activityDates = activitiesWithDates.map(a => new Date(a.date!))
    const minDate = new Date(Math.min(...activityDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...activityDates.map(d => d.getTime())))

    const tripStart = new Date(tripStartDate)
    const tripEnd = new Date(tripEndDate)

    const isValid = minDate >= tripStart && maxDate <= tripEnd

    if (!isValid) {
      const suggestedStart = minDate < tripStart ? minDate.toISOString().split('T')[0] : tripStartDate
      const suggestedEnd = maxDate > tripEnd ? maxDate.toISOString().split('T')[0] : tripEndDate
      return { isValid: false, suggestedStart, suggestedEnd }
    }

    return { isValid: true }
  }

  const handleAdjustTripDates = async () => {
    if (!suggestedDateRange) return

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: suggestedDateRange.start,
          end_date: suggestedDateRange.end,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Trip dates updated',
          description: 'Your trip dates have been adjusted to include all activities.',
        })
        setShowDateMismatchDialog(false)
        if (onTripDatesUpdated) {
          onTripDatesUpdated()
        }
      } else {
        toast({
          title: 'Failed to update trip dates',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error updating trip dates',
        variant: 'destructive',
      })
    }
  }

  const processFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or GIF image.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB.',
        variant: 'destructive',
      })
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Extract
    setIsExtracting(true)
    setExtractedActivities([])
    setSelectedActivities(new Set())

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const activities = data.activities || []
        setExtractedActivities(activities)
        setEditedActivities(activities)
        // Select all by default and expand the first one
        setSelectedActivities(new Set(activities.map((_: any, i: number) => i)))
        setExpandedActivity(activities.length > 0 ? 0 : null)

        // Validate dates
        const validation = validateActivityDates(activities)
        if (!validation.isValid) {
          setSuggestedDateRange({
            start: validation.suggestedStart!,
            end: validation.suggestedEnd!,
          })
          setShowDateMismatchDialog(true)
        }
      } else {
        const data = await response.json()
        toast({
          title: data.error || 'Failed to extract activities',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to process image',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
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
      await processFile(file)
    }
  }

  const toggleActivity = (index: number) => {
    const newSelected = new Set(selectedActivities)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedActivities(newSelected)
  }

  const updateActivity = (index: number, field: string, value: any) => {
    setEditedActivities(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const updateMetadata = (index: number, field: string, value: any) => {
    setEditedActivities(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        metadata: { ...updated[index].metadata, [field]: value }
      }
      return updated
    })
  }

  const handleAddSelected = async () => {
    const activitiesToAdd = editedActivities.filter((_, i) => selectedActivities.has(i))
    if (activitiesToAdd.length === 0) {
      toast({ title: 'No activities selected', variant: 'destructive' })
      return
    }

    setIsAdding(true)

    try {
      for (const activity of activitiesToAdd) {
        await fetch(`/api/trips/${tripId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            day_number: dayNumber,
            title: activity.title,
            description: activity.description,
            start_time: activity.start_time,
            end_time: activity.end_time,
            location: activity.location,
            category: activity.category,
            metadata: activity.metadata || {},
          }),
        })
      }

      toast({
        title: `Added ${activitiesToAdd.length} activit${activitiesToAdd.length === 1 ? 'y' : 'ies'}`,
      })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Failed to add activities',
        variant: 'destructive',
      })
    } finally {
      setIsAdding(false)
    }
  }

  const reset = () => {
    setImagePreview(null)
    setExtractedActivities([])
    setEditedActivities([])
    setSelectedActivities(new Set())
    setExpandedActivity(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!imagePreview ? (
        <Card
          className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className={`rounded-full p-4 mb-4 transition-colors ${
              isDragging ? 'bg-blue-200' : 'bg-blue-100'
            }`}>
              {isDragging ? (
                <ImageIcon className="h-8 w-8 text-blue-600" />
              ) : (
                <Camera className="h-8 w-8 text-blue-600" />
              )}
            </div>

            {isDragging ? (
              <p className="text-blue-600 font-medium text-center mb-2">
                Drop your image here!
              </p>
            ) : (
              <>
                <p className="text-gray-600 text-center mb-2">
                  <span className="font-medium">Drag & drop</span> an image here, or click to browse
                </p>
                <p className="text-sm text-gray-500 text-center mb-1">
                  Upload photos of tickets, reservations, or itineraries
                </p>
                <p className="text-xs text-gray-400">
                  Supports JPG, PNG, WebP (max 10MB)
                </p>
              </>
            )}

            {!isDragging && (
              <Button className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Image Preview */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imagePreview}
              alt="Uploaded image"
              width={400}
              height={300}
              className="w-full h-48 object-contain"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={reset}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Extracting State */}
          {isExtracting && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Analyzing image with AI...</span>
            </div>
          )}

          {/* Extracted Activities */}
          {extractedActivities.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Found {extractedActivities.length} activit{extractedActivities.length === 1 ? 'y' : 'ies'}:
              </p>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {editedActivities.map((activity, index) => {
                const Icon = categoryIcons[activity.category]
                const colors = categoryColors[activity.category]
                const isSelected = selectedActivities.has(index)
                const isExpanded = expandedActivity === index

                return (
                  <Card
                    key={index}
                    className={`transition-all ${
                      isSelected ? 'ring-2 ring-blue-500' : 'opacity-60'
                    }`}
                  >
                    <CardContent className="p-3">
                      {/* Header - clickable to expand/collapse */}
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => setExpandedActivity(isExpanded ? null : index)}
                      >
                        <div
                          className={`p-2 rounded-lg ${colors.bg} ${
                            isSelected ? '' : 'opacity-50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {activity.title}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(activity.confidence * 100)}%
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {activity.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            {activity.start_time && <span>{activity.start_time}</span>}
                            {activity.location && (
                              <span className="truncate">{activity.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0" onClick={(e) => {
                          e.stopPropagation()
                          toggleActivity(index)
                        }}>
                          {isSelected ? (
                            <Check className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Plus className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Editable fields - shown when expanded */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                value={activity.start_time || ''}
                                onChange={(e) => updateActivity(index, 'start_time', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                value={activity.end_time || ''}
                                onChange={(e) => updateActivity(index, 'end_time', e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          {/* Flight-specific fields */}
                          {activity.category === 'flight' && (
                            <div className="space-y-3 border-l-2 border-blue-200 pl-3">
                              <p className="text-xs font-medium text-gray-600">Flight Details</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Airline</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.airline || ''}
                                    onChange={(e) => updateMetadata(index, 'airline', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="American Airlines"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Flight Number</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.flightNumber || ''}
                                    onChange={(e) => updateMetadata(index, 'flightNumber', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="AA 5027"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Confirmation</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.confirmationCode || ''}
                                    onChange={(e) => updateMetadata(index, 'confirmationCode', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="ABC123"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Seat</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.seat || ''}
                                    onChange={(e) => updateMetadata(index, 'seat', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="10F"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Gate</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.gate || ''}
                                    onChange={(e) => updateMetadata(index, 'gate', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="B12"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Terminal</Label>
                                  <Input
                                    value={(activity.metadata as FlightMetadata)?.terminal || ''}
                                    onChange={(e) => updateMetadata(index, 'terminal', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Terminal 1"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hotel-specific fields */}
                          {activity.category === 'hotel' && (
                            <div className="space-y-3 border-l-2 border-purple-200 pl-3">
                              <p className="text-xs font-medium text-gray-600">Hotel Details</p>
                              <div className="space-y-1">
                                <Label className="text-xs">Hotel Name</Label>
                                <Input
                                  value={(activity.metadata as HotelMetadata)?.hotelName || ''}
                                  onChange={(e) => updateMetadata(index, 'hotelName', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Marriott Hotel"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Check-in</Label>
                                  <Input
                                    type="date"
                                    value={(activity.metadata as HotelMetadata)?.checkInDate || ''}
                                    onChange={(e) => updateMetadata(index, 'checkInDate', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Check-out</Label>
                                  <Input
                                    type="date"
                                    value={(activity.metadata as HotelMetadata)?.checkOutDate || ''}
                                    onChange={(e) => updateMetadata(index, 'checkOutDate', e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Confirmation</Label>
                                  <Input
                                    value={(activity.metadata as HotelMetadata)?.confirmationCode || ''}
                                    onChange={(e) => updateMetadata(index, 'confirmationCode', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="HOTEL123"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Room Type</Label>
                                  <Input
                                    value={(activity.metadata as HotelMetadata)?.roomType || ''}
                                    onChange={(e) => updateMetadata(index, 'roomType', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="King Suite"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Restaurant-specific fields */}
                          {activity.category === 'restaurant' && (
                            <div className="space-y-3 border-l-2 border-orange-200 pl-3">
                              <p className="text-xs font-medium text-gray-600">Restaurant Details</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Reservation Name</Label>
                                  <Input
                                    value={(activity.metadata as RestaurantMetadata)?.reservationName || ''}
                                    onChange={(e) => updateMetadata(index, 'reservationName', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Smith"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Party Size</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={(activity.metadata as RestaurantMetadata)?.partySize || ''}
                                    onChange={(e) => updateMetadata(index, 'partySize', parseInt(e.target.value) || 0)}
                                    className="h-8 text-sm"
                                    placeholder="4"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Cuisine Type</Label>
                                  <Select
                                    value={(activity.metadata as RestaurantMetadata)?.cuisineType || ''}
                                    onValueChange={(value) => updateMetadata(index, 'cuisineType', value)}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Select cuisine" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Italian">Italian</SelectItem>
                                      <SelectItem value="French">French</SelectItem>
                                      <SelectItem value="Japanese">Japanese</SelectItem>
                                      <SelectItem value="Chinese">Chinese</SelectItem>
                                      <SelectItem value="Mexican">Mexican</SelectItem>
                                      <SelectItem value="Indian">Indian</SelectItem>
                                      <SelectItem value="Thai">Thai</SelectItem>
                                      <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                                      <SelectItem value="American">American</SelectItem>
                                      <SelectItem value="Seafood">Seafood</SelectItem>
                                      <SelectItem value="Steakhouse">Steakhouse</SelectItem>
                                      <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                                      <SelectItem value="Vegan">Vegan</SelectItem>
                                      <SelectItem value="Fusion">Fusion</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Price Range</Label>
                                  <Select
                                    value={(activity.metadata as RestaurantMetadata)?.priceRange || ''}
                                    onValueChange={(value) => updateMetadata(index, 'priceRange', value)}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Select price" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="$">$ (Budget)</SelectItem>
                                      <SelectItem value="$$">$$ (Moderate)</SelectItem>
                                      <SelectItem value="$$$">$$$ (Expensive)</SelectItem>
                                      <SelectItem value="$$$$">$$$$ (Fine Dining)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Phone Number</Label>
                                <Input
                                  type="tel"
                                  value={(activity.metadata as RestaurantMetadata)?.phoneNumber || ''}
                                  onChange={(e) => updateMetadata(index, 'phoneNumber', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="+1 (555) 123-4567"
                                />
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 italic">
                            Click to expand/collapse • Fill in any missing details before adding
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              </div>

              <Button
                className="w-full"
                onClick={handleAddSelected}
                disabled={selectedActivities.size === 0 || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add {selectedActivities.size} Selected to Day {dayNumber}
              </Button>
            </div>
          )}

          {/* No activities found */}
          {!isExtracting && extractedActivities.length === 0 && imagePreview && (
            <div className="text-center py-4">
              <p className="text-gray-500">
                No travel activities found in this image. Try another image or add activities
                manually.
              </p>
              <Button variant="outline" className="mt-2" onClick={reset}>
                Try Another Image
              </Button>
            </div>
          )}
        </>
      )}

      {/* Date Mismatch Alert Dialog */}
      <AlertDialog open={showDateMismatchDialog} onOpenChange={setShowDateMismatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDialogTitle>Activity Dates Don't Match Trip Dates</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                The activities extracted from this image have dates that fall outside your current trip dates.
              </p>
              {suggestedDateRange && (
                <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Current Trip:</span>
                    <span>{new Date(tripStartDate).toLocaleDateString()} - {new Date(tripEndDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Suggested Trip:</span>
                    <span className="text-blue-600 font-medium">
                      {new Date(suggestedDateRange.start).toLocaleDateString()} - {new Date(suggestedDateRange.end).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-sm">
                You can adjust your trip dates to include these activities, or cancel and create a new trip.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDateMismatchDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAdjustTripDates}>
              Adjust Trip Dates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
