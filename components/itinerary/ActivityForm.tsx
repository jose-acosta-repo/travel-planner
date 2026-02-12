'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ItineraryItem,
  ActivityCategory,
  CategoryMetadata,
  FlightMetadata,
  HotelMetadata,
  RestaurantMetadata,
  ActivityMetadata,
  TransportMetadata,
  MeetingMetadata,
} from '@/types'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ActivityFormProps {
  tripId: string
  dayNumber: number
  existingItem?: ItineraryItem | null
  onSuccess: () => void
  onCancel: () => void
}

const categories: { value: ActivityCategory; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'activity', label: 'Activity' },
  { value: 'transport', label: 'Transport' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
]

export function ActivityForm({
  tripId,
  dayNumber,
  existingItem,
  onSuccess,
  onCancel,
}: ActivityFormProps) {
  const { toast} = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: existingItem?.title || '',
    description: existingItem?.description || '',
    start_time: existingItem?.start_time || '',
    end_time: existingItem?.end_time || '',
    location: existingItem?.location || '',
    location_lat: existingItem?.location_lat || null,
    location_lng: existingItem?.location_lng || null,
    category: existingItem?.category || ('activity' as ActivityCategory),
  })
  const [metadata, setMetadata] = useState<CategoryMetadata>(existingItem?.metadata || {})

  const updateMetadata = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = existingItem
        ? `/api/trips/${tripId}/items/${existingItem.id}`
        : `/api/trips/${tripId}/items`

      const response = await fetch(url, {
        method: existingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          day_number: dayNumber,
          metadata,
        }),
      })

      if (response.ok) {
        toast({
          title: existingItem ? 'Activity updated' : 'Activity added',
        })
        onSuccess()
      } else {
        const data = await response.json()
        toast({
          title: data.error || 'Failed to save activity',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Visit Eiffel Tower"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value: ActivityCategory) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
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

      {/* Category-specific fields */}
      {formData.category === 'flight' && (
        <div className="space-y-4 border-l-2 border-blue-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Flight Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airline">Airline</Label>
              <Input
                id="airline"
                placeholder="American Airlines"
                value={(metadata as FlightMetadata).airline || ''}
                onChange={(e) => updateMetadata('airline', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flightNumber">Flight Number</Label>
              <Input
                id="flightNumber"
                placeholder="AA 5027"
                value={(metadata as FlightMetadata).flightNumber || ''}
                onChange={(e) => updateMetadata('flightNumber', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureAirport">From (Airport)</Label>
              <Input
                id="departureAirport"
                placeholder="PHL"
                value={(metadata as FlightMetadata).departureAirport || ''}
                onChange={(e) => updateMetadata('departureAirport', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalAirport">To (Airport)</Label>
              <Input
                id="arrivalAirport"
                placeholder="IND"
                value={(metadata as FlightMetadata).arrivalAirport || ''}
                onChange={(e) => updateMetadata('arrivalAirport', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="confirmationCode">Confirmation</Label>
              <Input
                id="confirmationCode"
                placeholder="ABC123"
                value={(metadata as FlightMetadata).confirmationCode || ''}
                onChange={(e) => updateMetadata('confirmationCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seat">Seat</Label>
              <Input
                id="seat"
                placeholder="12A"
                value={(metadata as FlightMetadata).seat || ''}
                onChange={(e) => updateMetadata('seat', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate">Gate</Label>
              <Input
                id="gate"
                placeholder="B12"
                value={(metadata as FlightMetadata).gate || ''}
                onChange={(e) => updateMetadata('gate', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {formData.category === 'hotel' && (
        <div className="space-y-4 border-l-2 border-purple-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Hotel Details</p>
          <div className="space-y-2">
            <Label htmlFor="hotelName">Hotel Name</Label>
            <Input
              id="hotelName"
              placeholder="Marriott Hotel"
              value={(metadata as HotelMetadata).hotelName || ''}
              onChange={(e) => updateMetadata('hotelName', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check-in Date</Label>
              <Input
                id="checkInDate"
                type="date"
                value={(metadata as HotelMetadata).checkInDate || ''}
                onChange={(e) => updateMetadata('checkInDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutDate">Check-out Date</Label>
              <Input
                id="checkOutDate"
                type="date"
                value={(metadata as HotelMetadata).checkOutDate || ''}
                onChange={(e) => updateMetadata('checkOutDate', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type</Label>
              <Input
                id="roomType"
                placeholder="King Suite"
                value={(metadata as HotelMetadata).roomType || ''}
                onChange={(e) => updateMetadata('roomType', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Guests</Label>
              <Input
                id="numberOfGuests"
                type="number"
                min="1"
                placeholder="2"
                value={(metadata as HotelMetadata).numberOfGuests || ''}
                onChange={(e) => updateMetadata('numberOfGuests', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotelConfirmation">Confirmation Code</Label>
            <Input
              id="hotelConfirmation"
              placeholder="HOTEL123"
              value={(metadata as HotelMetadata).confirmationCode || ''}
              onChange={(e) => updateMetadata('confirmationCode', e.target.value)}
            />
          </div>
        </div>
      )}

      {formData.category === 'restaurant' && (
        <div className="space-y-4 border-l-2 border-orange-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Restaurant Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reservationName">Reservation Name</Label>
              <Input
                id="reservationName"
                placeholder="Smith"
                value={(metadata as RestaurantMetadata).reservationName || ''}
                onChange={(e) => updateMetadata('reservationName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partySize">Party Size</Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                placeholder="4"
                value={(metadata as RestaurantMetadata).partySize || ''}
                onChange={(e) => updateMetadata('partySize', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuisineType">Cuisine Type</Label>
              <Select
                value={(metadata as RestaurantMetadata).cuisineType || ''}
                onValueChange={(value) => updateMetadata('cuisineType', value)}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                value={(metadata as RestaurantMetadata).priceRange || ''}
                onValueChange={(value) => updateMetadata('priceRange', value)}
              >
                <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={(metadata as RestaurantMetadata).phoneNumber || ''}
              onChange={(e) => updateMetadata('phoneNumber', e.target.value)}
            />
          </div>
        </div>
      )}

      {formData.category === 'activity' && (
        <div className="space-y-4 border-l-2 border-green-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Activity Details</p>
          <div className="space-y-2">
            <Label htmlFor="provider">Provider/Company</Label>
            <Input
              id="provider"
              placeholder="Paris Tours"
              value={(metadata as ActivityMetadata).provider || ''}
              onChange={(e) => updateMetadata('provider', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bookingReference">Booking Reference</Label>
              <Input
                id="bookingReference"
                placeholder="TOUR123"
                value={(metadata as ActivityMetadata).bookingReference || ''}
                onChange={(e) => updateMetadata('bookingReference', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="2 hours"
                value={(metadata as ActivityMetadata).duration || ''}
                onChange={(e) => updateMetadata('duration', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficultyLevel">Difficulty</Label>
              <Select
                value={(metadata as ActivityMetadata).difficultyLevel || ''}
                onValueChange={(value) => updateMetadata('difficultyLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerPerson">Price Per Person</Label>
              <Input
                id="pricePerPerson"
                type="number"
                min="0"
                step="0.01"
                placeholder="50.00"
                value={(metadata as ActivityMetadata).pricePerPerson || ''}
                onChange={(e) => updateMetadata('pricePerPerson', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      )}

      {formData.category === 'transport' && (
        <div className="space-y-4 border-l-2 border-yellow-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Transport Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Input
                id="operator"
                placeholder="Uber"
                value={(metadata as TransportMetadata).operator || ''}
                onChange={(e) => updateMetadata('operator', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select
                value={(metadata as TransportMetadata).vehicleType || ''}
                onValueChange={(value) => updateMetadata('vehicleType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bus">Bus</SelectItem>
                  <SelectItem value="Train">Train</SelectItem>
                  <SelectItem value="Ferry">Ferry</SelectItem>
                  <SelectItem value="Shuttle">Shuttle</SelectItem>
                  <SelectItem value="Taxi">Taxi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transportBooking">Booking Reference</Label>
            <Input
              id="transportBooking"
              placeholder="TRANS123"
              value={(metadata as TransportMetadata).bookingReference || ''}
              onChange={(e) => updateMetadata('bookingReference', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <Input
                id="pickupLocation"
                placeholder="Airport Terminal 1"
                value={(metadata as TransportMetadata).pickupLocation || ''}
                onChange={(e) => updateMetadata('pickupLocation', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropoffLocation">Dropoff Location</Label>
              <Input
                id="dropoffLocation"
                placeholder="Hotel"
                value={(metadata as TransportMetadata).dropoffLocation || ''}
                onChange={(e) => updateMetadata('dropoffLocation', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {formData.category === 'meeting' && (
        <div className="space-y-4 border-l-2 border-indigo-200 pl-4">
          <p className="text-sm font-medium text-gray-700">Meeting Details</p>
          <div className="space-y-2">
            <Label htmlFor="meetingLink">Meeting Link/URL</Label>
            <Input
              id="meetingLink"
              type="url"
              placeholder="https://zoom.us/..."
              value={(metadata as MeetingMetadata).meetingLink || ''}
              onChange={(e) => updateMetadata('meetingLink', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizer</Label>
              <Input
                id="organizer"
                placeholder="John Doe"
                value={(metadata as MeetingMetadata).organizer || ''}
                onChange={(e) => updateMetadata('organizer', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number</Label>
              <Input
                id="roomNumber"
                placeholder="Conference Room A"
                value={(metadata as MeetingMetadata).roomNumber || ''}
                onChange={(e) => updateMetadata('roomNumber', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees</Label>
            <Textarea
              id="attendees"
              placeholder="John, Jane, Bob..."
              value={(metadata as MeetingMetadata).attendees || ''}
              onChange={(e) => updateMetadata('attendees', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <LocationAutocomplete
          id="location"
          placeholder="Search for a location..."
          value={formData.location}
          onChange={(value, coords) =>
            setFormData({
              ...formData,
              location: value,
              location_lat: coords?.lat || null,
              location_lng: coords?.lng || null,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add notes about this activity..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingItem ? 'Update' : 'Add'} Activity
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
