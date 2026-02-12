'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TripType } from '@/types'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewTripPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination: '',
    start_date: '',
    end_date: '',
    trip_type: 'personal' as TripType,
  })

  // Additional fields for specific trip types
  const [roadTripEndDestination, setRoadTripEndDestination] = useState('')
  const [cruiseLine, setCruiseLine] = useState('')
  const [cruiseShip, setCruiseShip] = useState('')
  const [skiResort, setSkiResort] = useState('')
  const [businessPurpose, setBusinessPurpose] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Build enhanced description with trip-specific details
      let enhancedDescription = formData.description

      if (formData.trip_type === 'road-trip' && roadTripEndDestination) {
        enhancedDescription = `${enhancedDescription}\n\nEnd Destination: ${roadTripEndDestination}`.trim()
      }

      if (formData.trip_type === 'cruise') {
        if (cruiseLine) enhancedDescription = `${enhancedDescription}\n\nCruise Line: ${cruiseLine}`.trim()
        if (cruiseShip) enhancedDescription = `${enhancedDescription}\n\nShip: ${cruiseShip}`.trim()
      }

      if (formData.trip_type === 'ski-trip' && skiResort) {
        enhancedDescription = `${enhancedDescription}\n\nResort: ${skiResort}`.trim()
      }

      if (formData.trip_type === 'business' && businessPurpose) {
        enhancedDescription = `${enhancedDescription}\n\nPurpose: ${businessPurpose}`.trim()
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description: enhancedDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create trip')
        setIsLoading(false)
        return
      }

      router.push(`/trips/${data.trip.id}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/trips"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Trips
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Trip</CardTitle>
          <CardDescription>
            Start planning your next adventure by filling out the details below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Trip Name *</Label>
              <Input
                id="title"
                placeholder="Summer Vacation 2024"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Dynamic destination field based on trip type */}
            {formData.trip_type === 'road-trip' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-location">Start Location *</Label>
                  <LocationAutocomplete
                    id="start-location"
                    placeholder="Where are you starting from?"
                    value={formData.destination}
                    onChange={(value) => setFormData({ ...formData, destination: value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-destination">End Destination *</Label>
                  <LocationAutocomplete
                    id="end-destination"
                    placeholder="Where are you heading to?"
                    value={roadTripEndDestination}
                    onChange={setRoadTripEndDestination}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <LocationAutocomplete
                  id="destination"
                  placeholder="Search for a destination..."
                  value={formData.destination}
                  onChange={(value) => setFormData({ ...formData, destination: value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip_type">Trip Type</Label>
              <Select
                value={formData.trip_type}
                onValueChange={(value: TripType) =>
                  setFormData({ ...formData, trip_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="road-trip">Road Trip</SelectItem>
                  <SelectItem value="beach-vacation">Beach Vacation</SelectItem>
                  <SelectItem value="city-break">City Break</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="weekend-getaway">Weekend Getaway</SelectItem>
                  <SelectItem value="cruise">Cruise</SelectItem>
                  <SelectItem value="backpacking">Backpacking</SelectItem>
                  <SelectItem value="ski-trip">Ski Trip</SelectItem>
                  <SelectItem value="cultural-tour">Cultural Tour</SelectItem>
                  <SelectItem value="honeymoon">Honeymoon</SelectItem>
                  <SelectItem value="family-vacation">Family Vacation</SelectItem>
                  <SelectItem value="solo-travel">Solo Travel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on trip type */}
            {formData.trip_type === 'cruise' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cruise-line">Cruise Line</Label>
                  <Input
                    id="cruise-line"
                    placeholder="e.g., Royal Caribbean"
                    value={cruiseLine}
                    onChange={(e) => setCruiseLine(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cruise-ship">Ship Name</Label>
                  <Input
                    id="cruise-ship"
                    placeholder="e.g., Symphony of the Seas"
                    value={cruiseShip}
                    onChange={(e) => setCruiseShip(e.target.value)}
                  />
                </div>
              </>
            )}

            {formData.trip_type === 'ski-trip' && (
              <div className="space-y-2">
                <Label htmlFor="ski-resort">Resort Name</Label>
                <Input
                  id="ski-resort"
                  placeholder="e.g., Aspen Snowmass"
                  value={skiResort}
                  onChange={(e) => setSkiResort(e.target.value)}
                />
              </div>
            )}

            {formData.trip_type === 'business' && (
              <div className="space-y-2">
                <Label htmlFor="business-purpose">Purpose of Visit</Label>
                <Input
                  id="business-purpose"
                  placeholder="e.g., Client meeting, Conference"
                  value={businessPurpose}
                  onChange={(e) => setBusinessPurpose(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add notes about your trip..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Trip
              </Button>
              <Link href="/trips">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
