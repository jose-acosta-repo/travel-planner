'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trip } from '@/types'
import { formatDate, getConsistentDestinationImage } from '@/lib/utils'
import { Calendar, MapPin, Users, Plane, Plus, Loader2 } from 'lucide-react'

interface TripListProps {
  limit?: number
  filter?: 'all' | 'personal' | 'business'
  searchQuery?: string
  viewMode?: 'grid' | 'list'
  status?: 'upcoming' | 'past'
}

export function TripList({
  limit,
  filter = 'all',
  searchQuery = '',
  viewMode = 'grid',
  status = 'upcoming'
}: TripListProps) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch(`/api/trips${limit ? `?limit=${limit}` : ''}`)
        if (response.ok) {
          const data = await response.json()
          setTrips(data.trips || [])
        }
      } catch (error) {
        console.error('Failed to fetch trips:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrips()
  }, [limit])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 dark:text-gray-600" />
      </div>
    )
  }

  // Filter trips
  let filteredTrips = trips

  // Filter by type
  if (filter !== 'all') {
    filteredTrips = filteredTrips.filter((trip) => trip.trip_type === filter)
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredTrips = filteredTrips.filter(
      (trip) =>
        trip.title.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query) ||
        trip.description?.toLowerCase().includes(query)
    )
  }

  // Filter by status (upcoming vs past)
  const now = new Date()
  if (status === 'upcoming') {
    filteredTrips = filteredTrips.filter((trip) => new Date(trip.end_date) >= now)
  } else {
    filteredTrips = filteredTrips.filter((trip) => new Date(trip.end_date) < now)
  }

  if (filteredTrips.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Plane className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {status === 'past' ? 'No past trips yet' : 'No trips yet'}
          </p>
          {status === 'upcoming' && (
            <Link href="/trips/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Trip
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  if (status === 'past') {
    // Compact view for past trips
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredTrips.map((trip) => {
          const thumbnailUrl = trip.cover_image_url || getConsistentDestinationImage(trip.destination)

          return (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-square overflow-hidden rounded-lg mb-2 bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={thumbnailUrl}
                    alt={trip.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    Completed
                  </Badge>
                </div>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                {trip.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </Link>
        )})}
      </div>
    )
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
      {filteredTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} viewMode={viewMode} />
      ))}
    </div>
  )
}

function TripCard({ trip, viewMode }: { trip: Trip; viewMode?: 'grid' | 'list' }) {
  const typeColors = {
    personal: 'bg-white/90 text-gray-900 dark:bg-gray-800/90 dark:text-white backdrop-blur-sm',
    business: 'bg-white/90 text-gray-900 dark:bg-gray-800/90 dark:text-white backdrop-blur-sm',
  }

  const itemCount = trip.items?.length || 0
  const thumbnailUrl = trip.cover_image_url || getConsistentDestinationImage(trip.destination)

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-gray-200 dark:border-gray-800">
        <div className="relative h-52 bg-gray-200 dark:bg-gray-800">
          <Image
            src={thumbnailUrl}
            alt={trip.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge className={typeColors[trip.trip_type]}>
              {trip.trip_type.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' - '}
                {new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
            {trip.title}
          </h3>
          {trip.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {trip.description}
            </p>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="line-clamp-1 font-medium">{trip.destination}</span>
            </div>
            <div className="flex items-center justify-between">
              {trip.collaborators && trip.collaborators.length > 0 && (
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {trip.collaborators.slice(0, 3).map((collab, idx) => (
                      <Avatar key={idx} className="h-7 w-7 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={collab.user?.avatar_url} />
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {collab.user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {trip.collaborators.length > 3 && (
                      <Avatar className="h-7 w-7 border-2 border-white dark:border-gray-800">
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                          +{trip.collaborators.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    +{trip.collaborators.length + 1}
                  </span>
                </div>
              )}
              {itemCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
